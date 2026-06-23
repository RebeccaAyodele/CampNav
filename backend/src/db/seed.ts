import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { pool, withTransaction } from "../config/db.js";
import { config } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Category-to-alias mapping for common search terms
const categoryAliases: Record<string, string[]> = {
  medical: ["clinic", "hospital", "first aid", "doctor", "health"],
  commerce: ["market", "shop", "store", "food", "buy"],
  finance: ["bank", "atm", "money"],
  accommodation: ["hotel", "hostel", "room", "lodge", "stay"],
  religion: ["church", "worship", "arena", "auditorium"],
  education: ["school", "college", "university"],
  parking: ["car park", "parking lot", "park car"],
  recreation: ["park", "playground", "fun"],
  services: ["office", "police", "workshop"],
  residential: ["estate", "quarters", "house", "apartment"]
};

interface GeoJSONFeature {
  type: string;
  properties: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: unknown;
  };
}

interface GeoJSONCollection {
  type: string;
  features: GeoJSONFeature[];
}

/** Trim all property keys (some GeoJSON entries have trailing spaces) */
function cleanProps(props: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    cleaned[key.trim()] = value;
  }
  return cleaned;
}

async function seed() {
  const passwordHash = await bcrypt.hash(config.demoAdminPassword, 12);

  // Load GeoJSON
  const geojsonPath = path.join(__dirname, "../../mapdata/new.geojson");
  const raw = await readFile(geojsonPath, "utf8");
  const geojson: GeoJSONCollection = JSON.parse(raw);

  // Separate POIs (Points) and routes (LineStrings)
  const poiFeatures = geojson.features.filter((f) => f.geometry.type === "Point");
  const routeFeatures = geojson.features.filter((f) => f.geometry.type === "LineString");

  await withTransaction(async (client) => {
    // ── Admin user ──────────────────────────────────────────────────
    // The users table may have extra columns from Prisma (phone, etc.)
    // Use savepoints to handle schema mismatch gracefully
    await client.query("SAVEPOINT admin_insert");
    try {
      await client.query(
        `INSERT INTO users (name, email, password_hash, role, phone)
         VALUES ($1, $2, $3, 'admin', $4)
         ON CONFLICT (email)
         DO UPDATE SET
           name = EXCLUDED.name,
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role;`,
        ["Demo Admin", config.demoAdminEmail, passwordHash, "0000000000"]
      );
      await client.query("RELEASE SAVEPOINT admin_insert");
    } catch {
      await client.query("ROLLBACK TO SAVEPOINT admin_insert");
      await client.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, 'admin')
         ON CONFLICT (email)
         DO UPDATE SET
           name = EXCLUDED.name,
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role;`,
        ["Demo Admin", config.demoAdminEmail, passwordHash]
      );
    }

    // ── Clear old seed data ─────────────────────────────────────────
    await client.query(`DELETE FROM roads`);
    await client.query(`DELETE FROM pois`);
    await client.query(`DELETE FROM zones`);
    await client.query(`DELETE FROM shuttle_checkins`);

    // ── Zones (create a default zone) ──────────────────────────────
    await client.query(
      `INSERT INTO zones (code, name, description)
       VALUES ('RC', 'Redemption City', 'Main campus area')
       ON CONFLICT (code) DO NOTHING;`
    );

    // Get the newly created zone ID for shuttle relation
    const zoneResult = await client.query<{ id: string }>(
      `SELECT id FROM zones WHERE code = 'RC' LIMIT 1`
    );
    const zoneId = zoneResult.rows[0]?.id ?? null;

    // ── POIs from GeoJSON ──────────────────────────────────────────
    let poiCount = 0;
    for (const feature of poiFeatures) {
      const props = cleanProps(feature.properties);
      const coords = feature.geometry.coordinates as [number, number];
      const lng = coords[0]!;
      const lat = coords[1]!;
      const id = (props.id as string) ?? `poi-${poiCount}`;
      const name = (props.name as string) ?? "Unknown POI";
      const category = (props.category as string) ?? "other";

      // Build aliases from category defaults + custom GeoJSON aliases
      const defaultAliases = categoryAliases[category] ?? [];
      const customAliasesVal = props.aliases;
      let parsedCustomAliases: string[] = [];
      if (Array.isArray(customAliasesVal)) {
        parsedCustomAliases = customAliasesVal.map(s => String(s).trim());
      } else if (typeof customAliasesVal === "string") {
        parsedCustomAliases = customAliasesVal.split(",").map(s => s.trim()).filter(Boolean);
      }
      const aliases = Array.from(new Set([...defaultAliases, ...parsedCustomAliases]));


      await client.query(
        `INSERT INTO pois (name, type, description, aliases, lat, lng, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING;`,
        [
          name,
          category,
          `${name} - ${category}`,
          aliases,
          lat,
          lng,
          { geojson_id: id, category, zone: props.zone ?? null }
        ]
      );
      poiCount++;
    }

    // ── Routes from GeoJSON ────────────────────────────────────────
    let routeCount = 0;
    for (const feature of routeFeatures) {
      const props = cleanProps(feature.properties);
      const name = (props.name as string) ?? `Route ${routeCount + 1}`;
      const from = (props.from as string) ?? "";
      const to = (props.to as string) ?? "";

      await client.query(
        `INSERT INTO roads (name, road_type, accessible_by_vehicle, path_geojson, metadata)
         VALUES ($1, 'pedestrian', false, $2, $3);`,
        [
          name,
          { type: "LineString", coordinates: feature.geometry.coordinates },
          { from, to, geojson_id: props.id ?? null }
        ]
      );
      routeCount++;
    }

    // ── Shuttle Check-ins ───────────────────────────────────────────
    const mockCheckins = [
      { shuttle_id: "shuttle-1", driver_name: "Ade", lat: 6.8173, lng: 3.4571, passenger_load: 12 },
      { shuttle_id: "shuttle-2", driver_name: "Olumide", lat: 6.8122, lng: 3.4513, passenger_load: 5 },
      { shuttle_id: "shuttle-3", driver_name: "Chioma", lat: 6.8077, lng: 3.4612, passenger_load: 18 },
      { shuttle_id: "shuttle-4", driver_name: "Musa", lat: 6.8023, lng: 3.4484, passenger_load: 0 }
    ];

    for (const mc of mockCheckins) {
      await client.query(
        `INSERT INTO shuttle_checkins (shuttle_id, driver_name, zone_id, lat, lng, passenger_load, checked_in_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '5 minutes');`,
        [mc.shuttle_id, mc.driver_name, zoneId, mc.lat, mc.lng, mc.passenger_load]
      );
    }

    // ── Seed log ───────────────────────────────────────────────────
    await client.query(
      `INSERT INTO logs (level, event, message, context)
       VALUES ('info', 'db.seed', 'GeoJSON and shuttle seed data applied', $1);`,
      [{ pois: poiCount, routes: routeCount, shuttles: mockCheckins.length }]
    );
  });

  console.log(`Seed data applied: ${poiFeatures.length} POIs, ${routeFeatures.length} routes`);
  await pool.end();
}

seed().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
