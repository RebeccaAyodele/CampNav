import type { RequestHandler } from "express";
import { sendSuccess } from "../utils/api-response.js";

export const healthCheck: RequestHandler = (_req, res) => {
  sendSuccess(res, {
    status: "ok",
    service: "campnav-backend",
    timestamp: new Date().toISOString()
  });
};
