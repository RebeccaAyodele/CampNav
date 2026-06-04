import type { RequestHandler } from "express";
import { z } from "zod";
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

export const createLostPersonReport: RequestHandler = (req, res) => {
  const input = lostPersonSchema.parse(req.body);

  sendSuccess(
    res,
    {
      id: "lost_person_placeholder",
      status: "open",
      ...input,
      createdAt: new Date().toISOString()
    },
    201
  );
};

export const listLostPersonReports: RequestHandler = (_req, res) => {
  sendSuccess(res, {
    reports: []
  });
};

export const updateLostPersonStatus: RequestHandler = (req, res) => {
  const input = statusSchema.parse(req.body);

  sendSuccess(res, {
    id: req.params.id,
    status: input.status,
    updatedAt: new Date().toISOString()
  });
};
