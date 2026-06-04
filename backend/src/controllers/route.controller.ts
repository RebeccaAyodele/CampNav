import type { RequestHandler } from "express";
import { z } from "zod";
import { sendSuccess } from "../utils/api-response.js";

const coordinateSchema = z.object({
  lat: z.number(),
  lng: z.number()
});

const directionsSchema = z.object({
  origin: coordinateSchema,
  destination: coordinateSchema,
  mode: z.enum(["walking", "vehicle"]).default("walking")
});

const supplyRouteSchema = z.object({
  origin: coordinateSchema,
  stops: z.array(coordinateSchema).min(1)
});

export const createDirections: RequestHandler = (req, res) => {
  const input = directionsSchema.parse(req.body);

  sendSuccess(res, {
    routeId: "route_placeholder",
    mode: input.mode,
    distanceMeters: 0,
    durationSeconds: 0,
    waypoints: [input.origin, input.destination],
    steps: ["Routing engine placeholder. Replace with road-network Dijkstra implementation."]
  });
};

export const getNearest: RequestHandler = (req, res) => {
  const query = z
    .object({
      lat: z.coerce.number(),
      lng: z.coerce.number(),
      type: z.string().optional()
    })
    .parse(req.query);

  sendSuccess(res, {
    query,
    results: []
  });
};

export const searchPlaces: RequestHandler = (req, res) => {
  const query = z
    .object({
      q: z.string().min(1),
      limit: z.coerce.number().int().positive().max(50).default(10)
    })
    .parse(req.query);

  sendSuccess(res, {
    query: query.q,
    results: []
  });
};

export const createEmergencyRoute: RequestHandler = (req, res) => {
  const input = directionsSchema.parse({ ...req.body, mode: "vehicle" });

  sendSuccess(res, {
    routeId: "emergency_route_placeholder",
    mode: input.mode,
    waypoints: [input.origin, input.destination],
    steps: ["Emergency routing placeholder. Use vehicle-accessible roads only."]
  });
};

export const createSupplyRoute: RequestHandler = (req, res) => {
  const input = supplyRouteSchema.parse(req.body);

  sendSuccess(res, {
    routeId: "supply_route_placeholder",
    orderedStops: input.stops,
    waypoints: [input.origin, ...input.stops],
    steps: ["Supply optimizer placeholder. Replace with nearest-neighbor or better routing."]
  });
};
