import { query } from "../config/db.js";
import type { RoadRow, PoiRow } from "../types/db.js";

// ── Geo helpers ──────────────────────────────────────────────────────

const R = 6371000; // Earth radius in meters
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function bearingToDirection(bearing: number): string {
  if (bearing >= 337.5 || bearing < 22.5) return "north";
  if (bearing < 67.5) return "northeast";
  if (bearing < 112.5) return "east";
  if (bearing < 157.5) return "southeast";
  if (bearing < 202.5) return "south";
  if (bearing < 247.5) return "southwest";
  if (bearing < 292.5) return "west";
  return "northwest";
}

function estimateTime(distanceMeters: number, mode: string): number {
  const speed = mode === "vehicle" ? 5.56 : 1.39; // m/s
  return Math.round(distanceMeters / speed);
}

function detectTurn(prevBearing: number, currBearing: number): string | null {
  let diff = currBearing - prevBearing;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  if (Math.abs(diff) < 30) return null; // straight
  return diff > 0 ? "right" : "left";
}

// ── Step generation ─────────────────────────────────────────────────

interface Step {
  instruction: string;
  distance_meters: number;
}

function generateSteps(coords: [number, number][], routeName?: string): Step[] {
  if (coords.length < 2) return [];

  const steps: Step[] = [];
  let prevBearing: number | null = null;

  for (let i = 0; i < coords.length - 1; i++) {
    // GeoJSON coords are [lng, lat]
    const [lng1, lat1] = coords[i]!;
    const [lng2, lat2] = coords[i + 1]!;

    const dist = Math.round(haversine(lat1!, lng1!, lat2!, lng2!));
    const bearing = calculateBearing(lat1!, lng1!, lat2!, lng2!);
    const direction = bearingToDirection(bearing);

    if (prevBearing !== null) {
      const turn = detectTurn(prevBearing, bearing);
      if (turn) {
        steps.push({
          instruction: `Turn ${turn} and walk ${dist}m heading ${direction}`,
          distance_meters: dist
        });
      } else {
        steps.push({
          instruction: `Continue straight for ${dist}m heading ${direction}`,
          distance_meters: dist
        });
      }
    } else {
      steps.push({
        instruction: `Head ${direction} for ${dist}m`,
        distance_meters: dist
      });
    }

    prevBearing = bearing;
  }

  return steps;
}

// ── Route matching ──────────────────────────────────────────────────

interface RouteData {
  road: RoadRow;
  from: string;
  to: string;
  coordinates: [number, number][];
}

async function loadRoutes(): Promise<RouteData[]> {
  const result = await query<RoadRow>(
    `SELECT * FROM roads WHERE metadata->>'from' IS NOT NULL AND metadata->>'to' IS NOT NULL`
  );

  return result.rows.map((road) => {
    const meta = road.metadata as Record<string, string>;
    const geojson = road.path_geojson as { coordinates?: [number, number][] };
    return {
      road,
      from: (meta.from ?? "").toLowerCase().trim(),
      to: (meta.to ?? "").toLowerCase().trim(),
      coordinates: geojson.coordinates ?? []
    };
  });
}

function findNearestPoi(pois: PoiRow[], lat: number, lng: number): PoiRow | null {
  let closest: PoiRow | null = null;
  let minDist = Infinity;

  for (const poi of pois) {
    const dist = haversine(lat, lng, poi.lat, poi.lng);
    if (dist < minDist) {
      minDist = dist;
      closest = poi;
    }
  }

  return closest;
}

function matchRoute(
  routes: RouteData[],
  originName: string,
  destName: string
): { route: RouteData; reversed: boolean } | null {
  const oLower = originName.toLowerCase().trim();
  const dLower = destName.toLowerCase().trim();

  // Direct match
  for (const route of routes) {
    if (
      (route.from.includes(oLower) || oLower.includes(route.from)) &&
      (route.to.includes(dLower) || dLower.includes(route.to))
    ) {
      return { route, reversed: false };
    }
  }

  // Reverse match
  for (const route of routes) {
    if (
      (route.from.includes(dLower) || dLower.includes(route.from)) &&
      (route.to.includes(oLower) || oLower.includes(route.to))
    ) {
      return { route, reversed: true };
    }
  }

  return null;
}

// ── Public API ──────────────────────────────────────────────────────

export interface DirectionsResult {
  routeId: string;
  mode: string;
  distanceMeters: number;
  durationSeconds: number;
  waypoints: { lat: number; lng: number }[];
  steps: Step[];
}

export async function getDirections(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode = "walking"
): Promise<DirectionsResult> {
  // Load POIs and routes
  const poisResult = await query<PoiRow>(`SELECT * FROM pois`);
  const pois = poisResult.rows;
  const routes = await loadRoutes();

  // Find nearest POIs to origin and destination
  const originPoi = findNearestPoi(pois, origin.lat, origin.lng);
  const destPoi = findNearestPoi(pois, destination.lat, destination.lng);

  // Try to find a pre-traced route
  if (originPoi && destPoi) {
    const match = matchRoute(routes, originPoi.name, destPoi.name);

    if (match) {
      const coords = match.reversed
        ? [...match.route.coordinates].reverse()
        : match.route.coordinates;

      const steps = generateSteps(coords, match.route.road.name ?? undefined);
      const totalDistance = steps.reduce((sum, s) => sum + s.distance_meters, 0);

      return {
        routeId: match.route.road.id,
        mode,
        distanceMeters: totalDistance,
        durationSeconds: estimateTime(totalDistance, mode),
        waypoints: coords.map(([lng, lat]) => ({ lat: lat!, lng: lng! })),
        steps
      };
    }
  }

  // Fallback: straight-line bearing and distance
  const dist = Math.round(haversine(origin.lat, origin.lng, destination.lat, destination.lng));
  const bearing = calculateBearing(origin.lat, origin.lng, destination.lat, destination.lng);
  const direction = bearingToDirection(bearing);

  return {
    routeId: "straight-line",
    mode,
    distanceMeters: dist,
    durationSeconds: estimateTime(dist, mode),
    waypoints: [
      { lat: origin.lat, lng: origin.lng },
      { lat: destination.lat, lng: destination.lng }
    ],
    steps: [
      {
        instruction: `Head ${direction} for approximately ${dist}m to your destination${destPoi ? ` (${destPoi.name})` : ""}`,
        distance_meters: dist
      }
    ]
  };
}
