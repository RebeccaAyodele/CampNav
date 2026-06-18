import { query } from "../config/db.js";
import type { ShuttleCheckinRow } from "../types/db.js";
import { writeLog } from "./logs.service.js";

interface CheckinInput {
  shuttleId: string;
  driverName?: string;
  lat: number;
  lng: number;
  zone?: string;
  passengerLoad?: number;
}

export async function recordCheckin(data: CheckinInput) {
  // Resolve zone_id if zone code provided
  let zoneId: string | null = null;
  if (data.zone) {
    const zoneResult = await query<{ id: string }>(
      `SELECT id FROM zones WHERE code = $1 OR name ILIKE $2 LIMIT 1`,
      [data.zone, `%${data.zone}%`]
    );
    zoneId = zoneResult.rows[0]?.id ?? null;
  }

  const result = await query<ShuttleCheckinRow>(
    `INSERT INTO shuttle_checkins (shuttle_id, driver_name, zone_id, lat, lng, passenger_load)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [data.shuttleId, data.driverName ?? null, zoneId, data.lat, data.lng, data.passengerLoad ?? null]
  );

  const row = result.rows[0]!;

  await writeLog("info", "shuttle_checkin", `${data.shuttleId} checked in`, {
    shuttle_id: data.shuttleId,
    lat: data.lat,
    lng: data.lng,
    zone: data.zone ?? null
  });

  return {
    id: row.id,
    shuttleId: row.shuttle_id,
    driverName: row.driver_name,
    lat: row.lat,
    lng: row.lng,
    zone: data.zone ?? null,
    passengerLoad: row.passenger_load,
    checkedInAt: row.checked_in_at.toISOString()
  };
}

export async function getActiveShuttles() {
  const result = await query<ShuttleCheckinRow & { zone_code: string | null; zone_name: string | null }>(
    `SELECT DISTINCT ON (sc.shuttle_id)
       sc.*,
       z.code AS zone_code,
       z.name AS zone_name
     FROM shuttle_checkins sc
     LEFT JOIN zones z ON z.id = sc.zone_id
     ORDER BY sc.shuttle_id, sc.checked_in_at DESC`
  );

  return result.rows.map((row) => ({
    shuttleId: row.shuttle_id,
    driverName: row.driver_name,
    lat: row.lat,
    lng: row.lng,
    zone: row.zone_name ?? row.zone_code ?? null,
    passengerLoad: row.passenger_load,
    lastCheckin: row.checked_in_at.toISOString()
  }));
}
