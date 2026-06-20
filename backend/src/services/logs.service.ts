import { query } from "../config/db.js";
import type { LogLevel, LogRow } from "../types/db.js";

export async function writeLog(
  level: LogLevel,
  event: string,
  message: string,
  context: Record<string, unknown> = {}
) {
  await query(
    `INSERT INTO logs (level, event, message, context) VALUES ($1, $2, $3, $4)`,
    [level, event, message, context]
  );
}

export async function listLogs(limit = 50) {
  const result = await query<LogRow>(
    `SELECT * FROM logs ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );

  return result.rows.map((row) => ({
    type: row.event,
    description: row.message,
    timestamp: row.created_at.toISOString(),
    metadata: row.context
  }));
}
