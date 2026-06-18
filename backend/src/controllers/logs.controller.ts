import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import * as logsService from "../services/logs.service.js";
import { sendSuccess } from "../utils/api-response.js";

const listQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).default(50)
});

export const listLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit } = listQuerySchema.parse(req.query);
    const logs = await logsService.listLogs(limit);
    sendSuccess(res, { logs });
  } catch (error) {
    next(error);
  }
};
