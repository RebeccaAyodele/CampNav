import type { RequestHandler } from "express";
import { z } from "zod";
import { sendSuccess } from "../utils/api-response.js";

const checkinSchema = z.object({
  shuttleId: z.string().min(1),
  driverName: z.string().min(1).optional(),
  lat: z.number(),
  lng: z.number(),
  zone: z.string().optional(),
  passengerLoad: z.number().int().min(0).optional()
});

export const recordShuttleCheckin: RequestHandler = (req, res) => {
  const input = checkinSchema.parse(req.body);

  sendSuccess(
    res,
    {
      id: "checkin_placeholder",
      ...input,
      checkedInAt: new Date().toISOString()
    },
    201
  );
};

export const getActiveShuttles: RequestHandler = (_req, res) => {
  sendSuccess(res, {
    shuttles: []
  });
};
