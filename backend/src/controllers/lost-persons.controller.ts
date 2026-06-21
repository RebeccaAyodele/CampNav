import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import * as lostPersonsService from "../services/lost-persons.service.js";
import { sendSuccess } from "../utils/api-response.js";

const lostPersonSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1),
  reporterName: z.string().min(1).optional(),
  reporterPhone: z.string().min(1).optional(),
  lastSeenLocation: z.string().min(1).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  source: z.enum(["app", "ussd", "dashboard"]).default("app")
});

const statusSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved"])
});

const listQuerySchema = z.object({
  status: z.enum(["open", "in_progress", "resolved"]).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

export const createLostPersonReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = lostPersonSchema.parse(req.body);
    const result = await lostPersonsService.createReport(input);
    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const listLostPersonReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = listQuerySchema.parse(req.query);
    const result = await lostPersonsService.listReports(filters);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const updateLostPersonStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = statusSchema.parse(req.body);
    const result = await lostPersonsService.updateStatus(req.params.id!, input.status);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
