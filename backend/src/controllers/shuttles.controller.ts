import type { RequestHandler } from "express";
import { z } from "zod";
import { pool } from "../config/db.js";
import { sendSuccess, sendError } from "../utils/api-response.js";

// ─── Validation Schema ────────────────────────────────────────────────────────
const checkinSchema = z.object({
  shuttleId: z.string().min(1),
  driverName: z.string().min(1).optional(),
  lat: z.number(),
  lng: z.number(),
  zone: z.string().optional(),
  passengerLoad: z.number().int().min(0).optional(),
});

// ─── Recommendation helper ────────────────────────────────────────────────────
// Scores zones by recent lost-person reports (×2) and shuttle activity (×1).
// Returns the highest-scored zone the current shuttle is NOT already in.

const ZONE_STOPS = [
  { id: "zone-a-gate", name: "Zone A Main Gate", zone: "A" },
  { id: "zone-b-gate", name: "Zone B Main Gate", zone: "B" },
  { id: "zone-c-gate", name: "Zone C Main Gate", zone: "C" },
  { id: "zone-d-gate", name: "Zone D Main Gate", zone: "D" },
  { id: "zone-e-gate", name: "Zone E Main Gate", zone: "E" },
  { id: "arena-main", name: "Main Arena Drop-off", zone: "Arena" },
];

async function getRecommendedNextStop(currentZone: string | null) {
  try {
    const since2h = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const since30m = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const [reports, checkins] = await Promise.all([
      pool.query<{ last_known_location: string }>(
        `SELECT last_known_location FROM lost_person_reports
         WHERE status = 'open' AND created_at >= $1`,
        [since2h],
      ),
      pool.query<{ zone: string | null }>(
        `SELECT zone FROM shuttles WHERE last_checkin_at >= $1`,
        [since30m],
      ),
    ]);

    const scores: Record<string, number> = {};
    ZONE_STOPS.forEach((s) => {
      scores[s.zone] = 0;
    });

    reports.rows.forEach((r) => {
      const match = r.last_known_location.match(/zone\s+([A-Z])/i);
      const zone = match?.[1]?.toUpperCase() ?? null;
      if (zone && scores[zone] !== undefined) scores[zone] += 2;
    });

    checkins.rows.forEach((c) => {
      if (c.zone) scores[c.zone] = (scores[c.zone] ?? 0) + 1;
    });

    const best = ZONE_STOPS.filter((s) => s.zone !== currentZone).sort(
      (a, b) => (scores[b.zone] ?? 0) - (scores[a.zone] ?? 0),
    )[0];

    return {
      id: best?.id ?? "arena-main",
      name: best?.name ?? "Main Arena Drop-off",
      reason:
        (scores[best?.zone ?? ""] ?? 0) > 0
          ? `High visitor activity in Zone ${best?.zone}`
          : "Scheduled zone rotation",
    };
  } catch {
    return {
      id: "arena-main",
      name: "Main Arena Drop-off",
      reason: "Fallback",
    };
  }
}

// ─── POST /api/shuttles/checkin ───────────────────────────────────────────────

export const recordShuttleCheckin: RequestHandler = async (req, res) => {
  // 1. Validate body
  const result = checkinSchema.safeParse(req.body);
  if (!result.success) {
    return sendError(
      res,
      "INVALID_CREDENTIALS",
      "shuttleId, lat, and lng are required.",
      400,
    );
  }

  const { shuttleId, driverName, lat, lng, zone, passengerLoad } = result.data;
  const vehicleId = shuttleId.trim().toUpperCase();
  const now = new Date().toISOString();

  try {
    // 2. Upsert — one row per bus, always the latest position
    const { rows } = await pool.query<{ id: string; vehicle_id: string }>(
      `INSERT INTO shuttles (vehicle_id, lat, lng, zone, last_checkin_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (vehicle_id)
       DO UPDATE SET
         lat             = EXCLUDED.lat,
         lng             = EXCLUDED.lng,
         zone            = EXCLUDED.zone,
         last_checkin_at = EXCLUDED.last_checkin_at
       RETURNING id, vehicle_id`,
      [vehicleId, lat, lng, zone ?? null, now],
    );

    const shuttle = rows[0];

    if (!shuttle) {
      return sendError(
        res,
        "DATABASE_ERROR",
        "Check-in could not be saved.",
        500,
      );
    }

    // 3. Compute recommended next stop
    const recommendedNextStop = await getRecommendedNextStop(zone ?? null);

    // 4. Write to activity log for dashboard feed
    await pool.query(
      `INSERT INTO activity_logs (type, description, metadata)
       VALUES ($1, $2, $3)`,
      [
        "shuttle_checkin",
        `${vehicleId} checked in at ${zone ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`}`,
        JSON.stringify({
          vehicleId,
          driverName,
          lat,
          lng,
          zone,
          passengerLoad,
        }),
      ],
    );

    // 5. Return response matching API contract
    return sendSuccess(
      res,
      {
        checkin_id: shuttle.id,
        vehicle_id: shuttle.vehicle_id,
        timestamp: now,
        recommended_next_stop: recommendedNextStop,
      },
      201,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
   
    console.error("[shuttles/checkin]", message);
    return sendError(
      res,
      "DATABASE_ERROR",
      "Check-in could not be saved.",
      500,
    );
  }
};

// ─── GET /api/shuttles/active ─────────────────────────────────────────────────
// Returns all shuttles checked in within the last 2 hours.
// Stale entries are excluded so the dashboard never shows ghost buses.

export const getActiveShuttles: RequestHandler = async (_req, res) => {
  const staleThreshold = new Date(
    Date.now() - 2 * 60 * 60 * 1000,
  ).toISOString();

  try {
    const { rows } = await pool.query(
      `SELECT vehicle_id, lat, lng, zone, last_checkin_at
       FROM shuttles
       WHERE last_checkin_at >= $1
       ORDER BY last_checkin_at DESC`,
      [staleThreshold],
    );

    // Attach a recommendation to each shuttle
    const shuttles = await Promise.all(
      rows.map(async (s) => {
        const recommended = await getRecommendedNextStop(s.zone);
        return {
          vehicle_id: s.vehicle_id,
          lat: parseFloat(s.lat),
          lng: parseFloat(s.lng),
          zone: s.zone,
          last_checkin: s.last_checkin_at,
          recommended_next_stop: {
            id: recommended.id,
            name: recommended.name,
          },
        };
      }),
    );

    return sendSuccess(res, { shuttles });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[shuttles/active]", message);
    return sendError(
      res,
      "DATABASE_ERROR",
      "Could not fetch shuttle positions.",
      500,
    );
  }
};
