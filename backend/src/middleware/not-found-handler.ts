import type { RequestHandler } from "express";
import { ErrorCodes } from "../constants/error-codes.js";
import { sendError } from "../utils/api-response.js";

export const notFoundHandler: RequestHandler = (req, res) => {
  sendError(res, ErrorCodes.NotFound, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};
