import bcrypt from "bcryptjs";
import { pool, withTransaction } from "../config/db.js";
import { config } from "../config/env.js";

const zones = [
  {
    code: "A",
    name: "Zone A",
    description: "Demo residential and worship support zone",
    boundaryGeojson: {
      type: "Polygon",
      coordinates: [
        [
          [3.4149, 6.8191],
          [3.4187, 6.8191],
          [3.4187, 6.8153],
          [3.4149, 6.8153],
          [3.4149, 6.8191]
        ]
      ]
    }
  },
  {
    code: "D",
    name: "Zone D",
    description: "Demo zone with medical and visitor support points",
    boundaryGeojson: {
      type: "Polygon",
      coordinates: [
        [
          [3.4201, 6.8176],
          [3.4241, 6.8176],
          [3.4241, 6.8135],
          [3.4201, 6.8135],
          [3.4201, 6.8176]
        ]
      ]
    }
  }
];

const pois = [
  {
    name: "Main Auditorium",
    type: "venue",
    zoneCode: "A",
    description: "Primary programme venue for demo routing",
    aliases: ["auditorium", "main venue", "church"],
    lat: 6.81765,
    lng: 3.41675
  },
  {
    name: "Zone D Medical Post",
    type: "medical",
    zoneCode: "D",
    description: "Demo medical post near Zone D",
    aliases: ["clinic", "first aid", "medical near zone d"],
    lat: 6.81584,
    lng: 3.42215
  },
  {
    name: "Gate 3",
    type: "gate",
    zoneCode: "A",
    description: "Demo entry gate",
    aliases: ["entrance", "third gate"],
    lat: 6.81846,
    lng: 3.41515
  },
  {
    name: "Feeding Area 1",
    type: "feeding",
    zoneCode: "D",
    description: "Demo feeding point",
    aliases: ["food", "meal", "feeding centre"],
    lat: 6.81492,
    lng: 3.42328
  }
];

const roads = [
  {
    name: "Auditorium Walkway",
    roadType: "pedestrian",
    accessibleByVehicle: false,
    pathGeojson: {
      type: "LineString",
      coordinates: [
        [3.41515, 6.81846],
        [3.41675, 6.81765],
        [3.42215, 6.81584]
      ]
    }
  },
  {
    name: "Service Road D",
    roadType: "service",
    accessibleByVehicle: true,
    pathGeojson: {
      type: "LineString",
      coordinates: [
        [3.41675, 6.81765],
        [3.4206, 6.81645],
        [3.42328, 6.81492]
      ]
    }
  }
];

async function seed() {
  const passwordHash = await bcrypt.hash(config.demoAdminPassword, 12);

  await withTransaction(async (client) => {
    await client.query(
      `
        INSERT INTO users (name, email, password_hash, role)
        VALUES ($1, $2, $3, 'admin')
        ON CONFLICT (email)
        DO UPDATE SET
          name = EXCLUDED.name,
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role;
      `,
      ["Demo Admin", config.demoAdminEmail, passwordHash]
    );

    for (const zone of zones) {
      await client.query(
        `
          INSERT INTO zones (code, name, description, boundary_geojson)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (code)
          DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            boundary_geojson = EXCLUDED.boundary_geojson;
        `,
        [zone.code, zone.name, zone.description, zone.boundaryGeojson]
      );
    }

    for (const poi of pois) {
      await client.query(
        `
          INSERT INTO pois (name, type, zone_id, description, aliases, lat, lng)
          VALUES (
            $1,
            $2,
            (SELECT id FROM zones WHERE code = $3),
            $4,
            $5,
            $6,
            $7
          )
          ON CONFLICT DO NOTHING;
        `,
        [poi.name, poi.type, poi.zoneCode, poi.description, poi.aliases, poi.lat, poi.lng]
      );
    }

    for (const road of roads) {
      await client.query(
        `
          INSERT INTO roads (name, road_type, accessible_by_vehicle, path_geojson)
          SELECT $1, $2, $3, $4
          WHERE NOT EXISTS (
            SELECT 1 FROM roads WHERE name = $1
          );
        `,
        [road.name, road.roadType, road.accessibleByVehicle, road.pathGeojson]
      );
    }

    await client.query(
      `
        INSERT INTO logs (level, event, message, context)
        VALUES ('info', 'db.seed', 'Demo seed data applied', $1);
      `,
      [{ zones: zones.length, pois: pois.length, roads: roads.length }]
    );
  });

  console.log("Seed data applied");
  await pool.end();
}

seed().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
