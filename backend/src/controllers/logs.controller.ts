import type { RequestHandler } from "express";
import { sendSuccess } from "../utils/api-response.js";

export const listLogs: RequestHandler = (_req, res) => {
  sendSuccess(res, {
    logs: []
  });
};
