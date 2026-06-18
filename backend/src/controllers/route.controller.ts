import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import * as poiService from "../services/poi.service.js";
import * as routingService from "../services/routing.service.js";
import * as supplyOptimizer from "../services/supply-optimizer.service.js";
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

export const createDirections = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = directionsSchema.parse(req.body);
    const result = await routingService.getDirections(input.origin, input.destination, input.mode);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getNearest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = z
      .object({
        lat: z.coerce.number(),
        lng: z.coerce.number(),
        type: z.string().optional(),
        limit: z.coerce.number().int().positive().max(20).default(3)
      })
      .parse(req.query);

    const results = await poiService.findNearest(query.lat, query.lng, query.type, query.limit);

    sendSuccess(res, {
      facilities: results.map((poi) => ({
        id: poi.id,
        name: poi.name,
        type: poi.type,
        description: poi.description,
        lat: poi.lat,
        lng: poi.lng,
        distance_meters: poi.distance_meters
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const searchPlaces = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = z
      .object({
        q: z.string().min(1),
        limit: z.coerce.number().int().positive().max(50).default(10)
      })
      .parse(req.query);

    const results = await poiService.searchByQuery(query.q, query.limit);

    sendSuccess(res, {
      query: query.q,
      results: results.map((poi) => ({
        id: poi.id,
        name: poi.name,
        type: poi.type,
        description: poi.description,
        lat: poi.lat,
        lng: poi.lng
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const createEmergencyRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = directionsSchema.parse({ ...req.body, mode: "vehicle" });
    const result = await routingService.getDirections(input.origin, input.destination, "vehicle");
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const createSupplyRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = supplyRouteSchema.parse(req.body);
    const result = await supplyOptimizer.optimizeRoute(input.origin, input.stops);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

