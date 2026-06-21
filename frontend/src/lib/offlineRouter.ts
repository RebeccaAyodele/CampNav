/**
 * Offline pre-traced route matching engine.
 * No Dijkstra or graph algorithms — only pre-traced LineString matching
 * with straight-line fallback and landmark annotation.
 */

import { campGeoJSON, getPOIs, getRoutes, type GeoJSONPointFeature } from "@/data/campGeoJSON";
import * as turf from "@turf/turf";
import PathFinder from "geojson-path-finder";
import campRoads from "@/data/campRoads.json";

let pathFinderInstance: any = null;
let campRoadsMultiLine: any = null;

function getPathFinder() {
  if (!pathFinderInstance) {
    pathFinderInstance = new (PathFinder as any)(campRoads, { precision: 1e-5 });
    
    // Create a MultiLineString for snapping coordinates
    const allLines = (campRoads.features as any[])
      .filter((f) => f.geometry && f.geometry.type === "LineString")
      .map((f) => f.geometry.coordinates);
    campRoadsMultiLine = turf.multiLineString(allLines);
  }
  return { pf: pathFinderInstance, multiLine: campRoadsMultiLine };
}

export interface RouteResult {
  routeId: string;
  mode: string;
  distanceMeters: number;
  durationSeconds: number;
  waypoints: { lat: number; lng: number }[];
  steps: { instruction: string; distance_meters: number }[];
  isStraightLine: boolean;
}

const EARTH_RADIUS = 6371000; // meters
const MATCH_TOLERANCE = 50; // meters for matching origin/dest to route endpoints
const LANDMARK_RADIUS = 45; // meters

/** Convert degrees to radians */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Convert radians to degrees */
function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/** Haversine distance between two [lng, lat] coordinates in meters */
export function haversineDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Calculate bearing from coord1 to coord2 in degrees */
export function calculateBearing(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  const bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/** Convert bearing to cardinal direction */
function bearingToDirection(bearing: number): string {
  const directions = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

/** Determine if a POI is to the left or right of the walking direction */
function getRelativePosition(
  from: [number, number],
  to: [number, number],
  poi: [number, number]
): "left" | "right" {
  // Cross product of direction vector and POI vector
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const px = poi[0] - from[0];
  const py = poi[1] - from[1];
  const cross = dx * py - dy * px;
  return cross > 0 ? "left" : "right";
}

/** Calculate total distance along a coordinate array */
function totalPathDistance(coords: [number, number][]): number {
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    total += haversineDistance(coords[i], coords[i + 1]);
  }
  return total;
}

/**
 * Find nearby landmarks along the route and annotate steps.
 * Checks each segment for POIs within LANDMARK_RADIUS meters.
 */
function annotateLandmarks(
  coords: [number, number][],
  originId?: string,
  destId?: string
): { instruction: string; distance_meters: number }[] {
  const pois = getPOIs();
  const steps: { instruction: string; distance_meters: number }[] = [];

  for (let i = 0; i < coords.length - 1; i++) {
    const from = coords[i];
    const to = coords[i + 1];
    const segDist = Math.round(haversineDistance(from, to));
    const bearing = calculateBearing(from, to);
    const direction = bearingToDirection(bearing);

    let instruction = "";
    if (i === 0) {
      instruction = `Head ${direction} for ${segDist}m`;
    } else {
      instruction = `Continue ${direction} for ${segDist}m`;
    }

    // Check midpoint of segment for nearby landmarks
    const midLng = (from[0] + to[0]) / 2;
    const midLat = (from[1] + to[1]) / 2;
    const midPoint: [number, number] = [midLng, midLat];

    const nearbyLandmarks: { name: string; side: "left" | "right" }[] = [];

    for (const poi of pois) {
      // Skip origin and destination
      if (poi.properties.id === originId || poi.properties.id === destId) continue;

      const poiCoord = poi.geometry.coordinates;
      const dist = haversineDistance(midPoint, poiCoord);

      if (dist <= LANDMARK_RADIUS) {
        const side = getRelativePosition(from, to, poiCoord);
        nearbyLandmarks.push({ name: poi.properties.name, side });
      }
    }

    if (nearbyLandmarks.length > 0) {
      const annotations = nearbyLandmarks
        .map((lm) => `passing ${lm.name} on your ${lm.side}`)
        .join(", ");
      instruction += ` (${annotations})`;
    }

    steps.push({ instruction, distance_meters: segDist });
  }

  return steps;
}

/**
 * Find a pre-traced route between origin and destination.
 * Matches by checking if route endpoints are within MATCH_TOLERANCE of given coords,
 * or by fuzzy name matching on the from/to properties.
 */
export function findOfflineRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  originName?: string,
  destName?: string
): RouteResult {
  const routes = getRoutes();
  const originCoord: [number, number] = [origin.lng, origin.lat];
  const destCoord: [number, number] = [destination.lng, destination.lat];

  for (const route of routes) {
    const coords = route.geometry.coordinates;
    const routeStart = coords[0];
    const routeEnd = coords[coords.length - 1];
    const fromName = (route.properties.from || "").toLowerCase().trim();
    const toName = (route.properties.to || "").toLowerCase().trim();

    // Check forward match by coordinates
    const startDist = haversineDistance(originCoord, routeStart);
    const endDist = haversineDistance(destCoord, routeEnd);

    if (startDist <= MATCH_TOLERANCE && endDist <= MATCH_TOLERANCE) {
      const dist = Math.round(totalPathDistance(coords));
      const waypoints = coords.map(([lng, lat]) => ({ lat, lng }));
      const steps = annotateLandmarks(coords);
      return {
        routeId: route.properties.id || "pre-traced",
        mode: "walking",
        distanceMeters: dist,
        durationSeconds: Math.round(dist / 1.4),
        waypoints,
        steps,
        isStraightLine: false,
      };
    }

    // Check reverse match by coordinates
    const revStartDist = haversineDistance(originCoord, routeEnd);
    const revEndDist = haversineDistance(destCoord, routeStart);

    if (revStartDist <= MATCH_TOLERANCE && revEndDist <= MATCH_TOLERANCE) {
      const reversed = [...coords].reverse();
      const dist = Math.round(totalPathDistance(reversed));
      const waypoints = reversed.map(([lng, lat]) => ({ lat, lng }));
      const steps = annotateLandmarks(reversed);
      return {
        routeId: route.properties.id || "pre-traced-reversed",
        mode: "walking",
        distanceMeters: dist,
        durationSeconds: Math.round(dist / 1.4),
        waypoints,
        steps,
        isStraightLine: false,
      };
    }

    // Check name match
    if (originName && destName) {
      const oName = originName.toLowerCase().trim();
      const dName = destName.toLowerCase().trim();

      if (
        (fromName.includes(oName) || oName.includes(fromName)) &&
        (toName.includes(dName) || dName.includes(toName))
      ) {
        const dist = Math.round(totalPathDistance(coords));
        const waypoints = coords.map(([lng, lat]) => ({ lat, lng }));
        const steps = annotateLandmarks(coords);
        return {
          routeId: route.properties.id || "pre-traced-name",
          mode: "walking",
          distanceMeters: dist,
          durationSeconds: Math.round(dist / 1.4),
          waypoints,
          steps,
          isStraightLine: false,
        };
      }

      // Reverse name match
      if (
        (fromName.includes(dName) || dName.includes(fromName)) &&
        (toName.includes(oName) || oName.includes(toName))
      ) {
        const reversed = [...coords].reverse();
        const dist = Math.round(totalPathDistance(reversed));
        const waypoints = reversed.map(([lng, lat]) => ({ lat, lng }));
        const steps = annotateLandmarks(reversed);
        return {
          routeId: route.properties.id || "pre-traced-name-reversed",
          mode: "walking",
          distanceMeters: dist,
          durationSeconds: Math.round(dist / 1.4),
          waypoints,
          steps,
          isStraightLine: false,
        };
      }
    }
  }

  // Graph-based offline fallback
  return generateGraphFallback(origin, destination);
}

function generateGraphFallback(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): RouteResult {
  try {
    const { pf, multiLine } = getPathFinder();
    const originPt = turf.point([origin.lng, origin.lat]);
    const destPt = turf.point([destination.lng, destination.lat]);

    // Snap origin and destination to the nearest actual road
    const snappedStart = turf.nearestPointOnLine(multiLine, originPt);
    const snappedEnd = turf.nearestPointOnLine(multiLine, destPt);

    // Calculate shortest path through the road network
    const path = pf.findPath(snappedStart, snappedEnd);

    if (path && path.path && path.path.length > 0) {
      // geojson-path-finder weight is typically distance in km or similar, but let's calculate precise meters
      const coords = path.path as [number, number][];
      const distanceMeters = Math.round(totalPathDistance(coords));
      
      const waypoints = coords.map(([lng, lat]) => ({ lat, lng }));
      const steps = annotateLandmarks(coords);
      
      // If annotateLandmarks produces no steps, add a default one
      if (steps.length === 0) {
        steps.push({
          instruction: `Follow the route for ${distanceMeters}m`,
          distance_meters: distanceMeters,
        });
      }

      return {
        routeId: `offline-graph-${Date.now()}`,
        mode: "walking",
        distanceMeters,
        durationSeconds: Math.round(distanceMeters / 1.4), // walking speed
        waypoints,
        steps,
        isStraightLine: false,
      };
    }
  } catch (error) {
    console.error("Graph routing failed, falling back to straight line:", error);
  }

  // Absolute worst-case scenario: straight-line fallback
  return generateStraightLineFallback(origin, destination);
}

function generateStraightLineFallback(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): RouteResult {
  const originCoord: [number, number] = [origin.lng, origin.lat];
  const destCoord: [number, number] = [destination.lng, destination.lat];
  const dist = Math.round(haversineDistance(originCoord, destCoord));
  const bearing = calculateBearing(originCoord, destCoord);
  const direction = bearingToDirection(bearing);
  const coords: [number, number][] = [originCoord, destCoord];
  const steps = annotateLandmarks(coords);

  if (steps.length === 0) {
    steps.push({
      instruction: `Head ${direction} for ${dist}m (bearing ${Math.round(bearing)}°)`,
      distance_meters: dist,
    });
  }

  return {
    routeId: "straight-line",
    mode: "walking",
    distanceMeters: dist,
    durationSeconds: Math.round(dist / 1.4),
    waypoints: [
      { lat: origin.lat, lng: origin.lng },
      { lat: destination.lat, lng: destination.lng },
    ],
    steps,
    isStraightLine: true,
  };
}

/** Find nearest POIs to a given coordinate, optionally filtered by category */
export function findNearestOffline(
  lat: number,
  lng: number,
  category?: string,
  limit: number = 3
): (GeoJSONPointFeature & { distance_meters: number })[] {
  const pois = getPOIs();
  const userCoord: [number, number] = [lng, lat];

  const withDistance = pois
    .filter((poi) => !category || poi.properties.category === category)
    .map((poi) => ({
      ...poi,
      distance_meters: Math.round(haversineDistance(userCoord, poi.geometry.coordinates)),
    }))
    .sort((a, b) => a.distance_meters - b.distance_meters);

  return withDistance.slice(0, limit);
}
