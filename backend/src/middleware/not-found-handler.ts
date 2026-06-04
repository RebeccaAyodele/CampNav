import type { RequestHandler } from "express";
import { sendError } from "../utils/api-response.js";

export const notFoundHandler: RequestHandler = (req, res) => {
  sendError(res, "NOT_FOUND", `Route not found: ${req.method} ${req.originalUrl}`, 404);
};
