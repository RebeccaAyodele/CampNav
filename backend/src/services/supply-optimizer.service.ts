import { haversine, getDirections, type DirectionsResult } from "./routing.service.js";

interface Coordinate {
  lat: number;
  lng: number;
}

/**
 * Nearest-neighbor heuristic for multi-stop route optimization.
 * Start at origin, greedily pick the closest unvisited stop.
 */
export async function optimizeRoute(
  origin: Coordinate,
  stops: Coordinate[]
): Promise<{
  routeId: string;
  orderedStops: Coordinate[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  legs: {
    from: Coordinate;
    to: Coordinate;
    distanceMeters: number;
    durationSeconds: number;
    steps: { instruction: string; distance_meters: number }[];
  }[];
}> {
  const remaining = [...stops];
  const orderedStops: Coordinate[] = [];
  const legs: {
    from: Coordinate;
    to: Coordinate;
    distanceMeters: number;
    durationSeconds: number;
    steps: { instruction: string; distance_meters: number }[];
  }[] = [];

  let current = origin;
  let totalDistance = 0;
  let totalDuration = 0;

  while (remaining.length > 0) {
    // Find closest unvisited stop
    let closestIdx = 0;
    let closestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const stop = remaining[i]!;
      const dist = haversine(current.lat, current.lng, stop.lat, stop.lng);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    }

    const nextStop = remaining.splice(closestIdx, 1)[0]!;
    orderedStops.push(nextStop);

    // Get directions for this leg
    const directions = await getDirections(current, nextStop, "vehicle");
    legs.push({
      from: current,
      to: nextStop,
      distanceMeters: directions.distanceMeters,
      durationSeconds: directions.durationSeconds,
      steps: directions.steps
    });

    totalDistance += directions.distanceMeters;
    totalDuration += directions.durationSeconds;
    current = nextStop;
  }

  return {
    routeId: "supply-route-optimized",
    orderedStops,
    totalDistanceMeters: totalDistance,
    totalDurationSeconds: totalDuration,
    legs
  };
}
