import { query } from "../config/db.js";
import { ErrorCodes } from "../constants/error-codes.js";
import type { LostPersonReportRow, LostPersonSource, LostPersonStatus } from "../types/db.js";
import { AppError } from "../utils/app-error.js";
import { writeLog } from "./logs.service.js";
import { emitEvent } from "./websocket.service.js";

interface CreateReportInput {
  name?: string;
  description: string;
  reporterName?: string;
  reporterPhone?: string;
  lastSeenLocation?: string;
  lat?: number;
  lng?: number;
  source?: LostPersonSource;
  imageUrl?: string;
}

interface ListFilters {
  status?: LostPersonStatus;
  limit?: number;
  offset?: number;
}

export async function createReport(data: CreateReportInput) {
  const result = await query<LostPersonReportRow>(
    `INSERT INTO lost_person_reports (name, description, reporter_name, reporter_phone, last_seen_location, lat, lng, source, image_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      data.name ?? null,
      data.description,
      data.reporterName ?? null,
      data.reporterPhone ?? null,
      data.lastSeenLocation ?? null,
      data.lat ?? null,
      data.lng ?? null,
      data.source ?? "app",
      data.imageUrl ?? null
    ]
  );

  const row = result.rows[0]!;

  await writeLog("info", "lost_person_report", `New lost person report: ${data.description.slice(0, 80)}`, {
    report_id: row.id,
    source: row.source,
    status: row.status
  });

  const reportData = {
    id: row.id,
    name: row.name,
    description: row.description,
    reporterName: row.reporter_name,
    reporterPhone: row.reporter_phone,
    lastSeenLocation: row.last_seen_location,
    lat: row.lat,
    lng: row.lng,
    source: row.source,
    status: row.status,
    imageUrl: row.image_url,
    createdAt: row.created_at.toISOString()
  };

  emitEvent("new_lost_person", reportData);

  return reportData;
}

export async function listReports(filters: ListFilters = {}) {
  const { status, limit = 50, offset = 0 } = filters;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (status) {
    conditions.push(`status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM lost_person_reports ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0]?.count ?? "0", 10);

  const dataResult = await query<LostPersonReportRow>(
    `SELECT * FROM lost_person_reports ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  const reports = dataResult.rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    reporterName: row.reporter_name,
    reporterPhone: row.reporter_phone,
    lastSeenLocation: row.last_seen_location,
    lat: row.lat,
    lng: row.lng,
    source: row.source,
    status: row.status,
    imageUrl: row.image_url,
    resolvedAt: row.resolved_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  }));

  return { total, reports };
}

export async function updateStatus(id: string, status: LostPersonStatus) {
  const resolvedAt = status === "resolved" ? "now()" : "resolved_at";

  const result = await query<LostPersonReportRow>(
    `UPDATE lost_person_reports
     SET status = $1, resolved_at = ${status === "resolved" ? "now()" : "resolved_at"}
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );

  if (result.rows.length === 0) {
    throw new AppError(ErrorCodes.LostPersonReportNotFound, "Lost person report not found", 404);
  }

  const row = result.rows[0]!;

  await writeLog("info", "lost_person_status_update", `Report ${id} status changed to ${status}`, {
    report_id: id,
    new_status: status
  });

  const updateData = {
    id: row.id,
    status: row.status,
    resolvedAt: row.resolved_at?.toISOString() ?? null,
    updatedAt: row.updated_at.toISOString()
  };

  emitEvent("lost_person_status_changed", updateData);

  return updateData;
}
