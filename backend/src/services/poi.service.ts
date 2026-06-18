import { query } from "../config/db.js";
import type { PoiRow } from "../types/db.js";

/** Haversine distance in meters between two lat/lng pairs */
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type PoiWithDistance = PoiRow & { distance_meters: number };

export async function findById(id: string): Promise<PoiRow | null> {
  const result = await query<PoiRow>(
    `SELECT * FROM pois WHERE id = $1 LIMIT 1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function findByName(name: string): Promise<PoiRow | null> {
  // Try exact case-insensitive match first
  let result = await query<PoiRow>(
    `SELECT * FROM pois WHERE LOWER(name) = LOWER($1) LIMIT 1`,
    [name]
  );
  if (result.rows[0]) return result.rows[0];

  // Try partial match
  result = await query<PoiRow>(
    `SELECT * FROM pois WHERE name ILIKE $1 LIMIT 1`,
    [`%${name}%`]
  );
  return result.rows[0] ?? null;
}

export async function searchByQuery(q: string, limit = 10): Promise<PoiRow[]> {
  const result = await query<PoiRow>(
    `SELECT *,
       CASE
         WHEN LOWER(name) = LOWER($1) THEN 0
         WHEN name ILIKE $2 THEN 1
         WHEN $1 = ANY(aliases) THEN 2
         ELSE 3
       END AS relevance
     FROM pois
     WHERE name ILIKE $2 OR $1 = ANY(aliases) OR description ILIKE $2
     ORDER BY relevance ASC, name ASC
     LIMIT $3`,
    [q, `%${q}%`, limit]
  );
  return result.rows;
}

export async function findNearest(
  lat: number,
  lng: number,
  type?: string,
  limit = 3
): Promise<PoiWithDistance[]> {
  const result = type
    ? await query<PoiRow>(`SELECT * FROM pois WHERE type = $1`, [type])
    : await query<PoiRow>(`SELECT * FROM pois`);

  // Calculate distances in application code (avoids needing PostGIS)
  const withDistance = result.rows.map((row) => ({
    ...row,
    distance_meters: Math.round(haversine(lat, lng, row.lat, row.lng))
  }));

  withDistance.sort((a, b) => a.distance_meters - b.distance_meters);

  return withDistance.slice(0, limit);
}
