import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error.js";
import { sendError } from "../utils/api-response.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    sendError(res, error.code, error.message, error.statusCode);
    return;
  }

  if (error instanceof ZodError) {
    sendError(res, "VALIDATION_ERROR", error.issues[0]?.message ?? "Invalid request payload", 422);
    return;
  }

  console.error(error);
  sendError(res, "INTERNAL_SERVER_ERROR", "Something went wrong", 500);
};
