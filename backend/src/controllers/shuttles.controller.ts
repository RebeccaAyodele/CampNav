import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import * as shuttlesService from "../services/shuttles.service.js";
import { sendSuccess } from "../utils/api-response.js";

const checkinSchema = z.object({
  shuttleId: z.string().min(1),
  driverName: z.string().min(1).optional(),
  lat: z.number(),
  lng: z.number(),
  zone: z.string().optional(),
  passengerLoad: z.number().int().min(0).optional()
});

export const recordShuttleCheckin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = checkinSchema.parse(req.body);
    const result = await shuttlesService.recordCheckin(input);
    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const getActiveShuttles = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const shuttles = await shuttlesService.getActiveShuttles();
    sendSuccess(res, { shuttles });
  } catch (error) {
    next(error);
  }
};
