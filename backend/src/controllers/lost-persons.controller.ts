import type { RequestHandler } from "express";
import { z } from "zod";
import { pool } from "../config/db.js";
import { sendSuccess, sendError } from "../utils/api-response.js";

// ─── Validation Schemas ───────────────────────────────────────────────────────
// Kept Temi's field names exactly. We map to DB column names during the insert.

const lostPersonSchema = z.object({
  name: z.string().min(1).optional(), // person's name if known
  description: z.string().min(1), // e.g. "Boy, 8, red shirt"
  reporterName: z.string().min(1).optional(),
  reporterPhone: z.string().min(1).optional(),
  lastSeenLocation: z.string().min(1), // maps to last_known_location
  lat: z.number().optional(),
  lng: z.number().optional(),
  source: z.enum(["app", "ussd", "dashboard"]).default("app"),
});

const statusSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved"]), // Temi's enum values
  notes: z.string().optional(),
});

// ─── Report ID Generator ──────────────────────────────────────────────────────

async function generateReportId(): Promise<string> {
  const { rows } = await pool.query<{ count: string }>(
    "SELECT COUNT(*) AS count FROM lost_person_reports",
  );
  const count = rows[0]?.count ?? "0";
  const next = parseInt(count, 10) + 1;
  return `LP-${String(next).padStart(5, "0")}`;
}

// ─── POST /api/lost-persons ───────────────────────────────────────────────────
// Public endpoint — visitors and Temi's USSD webhook both call this.

export const createLostPersonReport: RequestHandler = async (req, res) => {
  // 1. Validate with Zod
  const result = lostPersonSchema.safeParse(req.body);
  if (!result.success) {
    return sendError(
      res,
      "INVALID_CREDENTIALS",
      "description and lastSeenLocation are required.",
      400,
    );
  }

  const input = result.data;

  try {
    // 2. Generate LP-XXXXX report ID
    const report_id = await generateReportId();
    const now = new Date().toISOString();

    // 3. Build description — combine name + description if name is provided
    const fullDescription = input.name
      ? `${input.name} — ${input.description}`
      : input.description;

    // 4. Insert into DB
    // PostGIS point uses ST_MakePoint(lng, lat) — longitude always comes first
    await pool.query(
      `INSERT INTO lost_person_reports
        (report_id, description, last_known_location, location,
         reporter_phone, status, source, created_at, updated_at)
       VALUES
        ($1, $2, $3,
         ${
           input.lat != null && input.lng != null
             ? `ST_SetSRID(ST_MakePoint($7, $8), 4326)`
             : "NULL"
         },
         $4, 'open', $5, $6, $6)`,
      input.lat != null && input.lng != null
        ? [
            report_id,
            fullDescription,
            input.lastSeenLocation,
            input.reporterPhone ?? null,
            input.source,
            now,
            input.lng,
            input.lat,
          ]
        : [
            report_id,
            fullDescription,
            input.lastSeenLocation,
            input.reporterPhone ?? null,
            input.source,
            now,
          ],
    );

    // 5. Log to activity feed for dashboard
    await pool.query(
      `INSERT INTO activity_logs (type, description, metadata)
       VALUES ($1, $2, $3)`,
      [
        "lost_person_report",
        `New report ${report_id} — ${fullDescription.substring(0, 60)}`,
        JSON.stringify({
          report_id,
          source: input.source,
          lastSeenLocation: input.lastSeenLocation,
        }),
      ],
    );

    // 6. Return matching the API contract shape
    return sendSuccess(
      res,
      {
        id: report_id,
        status: "open",
        ...input,
        createdAt: now,
      },
      201,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[lost-persons/post]", message);
    return sendError(res, "DATABASE_ERROR", "Report could not be saved.", 500);
  }
};

// ─── GET /api/lost-persons ────────────────────────────────────────────────────
// Protected — dashboard coordinator view.
// Supports ?status filter and ?limit / ?offset pagination.

export const listLostPersonReports: RequestHandler = async (req, res) => {
  const {
    status,
    limit = "50",
    offset = "0",
  } = req.query as {
    status?: string;
    limit?: string;
    offset?: string;
  };

  const limitNum = parseInt(limit, 10);
  const offsetNum = parseInt(offset, 10);

  if (isNaN(limitNum) || isNaN(offsetNum) || limitNum < 1 || offsetNum < 0) {
    return sendError(
      res,
      "INVALID_CREDENTIALS",
      "limit and offset must be valid numbers.",
      400,
    );
  }

  try {
    const params: (string | number)[] = [];
    let whereClause = "";

    if (status) {
      params.push(status);
      whereClause = `WHERE status = $${params.length}`;
    }

    // Get total count for pagination metadata
    const { rows: countRows } = await pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM lost_person_reports ${whereClause}`,
      params,
    );
    const total = parseInt(countRows[0]?.count ?? "0", 10);

    // Get paginated reports
    params.push(limitNum, offsetNum);
    const { rows: reports } = await pool.query(
      `SELECT report_id, description, status, last_known_location,
              reporter_phone, source, created_at
       FROM lost_person_reports
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    return sendSuccess(res, { total, reports });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[lost-persons/get]", message);
    return sendError(res, "DATABASE_ERROR", "Could not fetch reports.", 500);
  }
};

// ─── PATCH /api/lost-persons/:id/status ──────────────────────────────────────
// Protected — security team marks reports as found or resolved.
// :id is the LP-XXXXX report_id string, not the UUID.

export const updateLostPersonStatus: RequestHandler = async (req, res) => {
  const { id } = req.params;

  // 1. Validate status with Zod
  const result = statusSchema.safeParse(req.body);
  if (!result.success) {
    return sendError(
      res,
      "INVALID_CREDENTIALS",
      "status must be one of: open, in_progress, resolved.",
      400,
    );
  }

  const { status, notes } = result.data;

  try {
    // 2. Update the row — RETURNING confirms it existed
    const { rowCount } = await pool.query(
      `UPDATE lost_person_reports
       SET status = $1, notes = $2, updated_at = $3
       WHERE report_id = $4`,
      [status, notes ?? null, new Date().toISOString(), id],
    );

    // 3. If nothing was updated, the ID doesn't exist
    if (rowCount === 0) {
      return sendError(res, "NOT_FOUND", `Report ${id} does not exist.`, 404);
    }

    // 4. Log the status change
    await pool.query(
      `INSERT INTO activity_logs (type, description, metadata)
       VALUES ($1, $2, $3)`,
      [
        "lost_person_status_update",
        `Report ${id} marked as ${status}`,
        JSON.stringify({ report_id: id, status }),
      ],
    );

    return sendSuccess(res, {
      id: id,
      status: status,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[lost-persons/patch]", message);
    return sendError(res, "DATABASE_ERROR", "Status update failed.", 500);
  }
};
