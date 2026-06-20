import type { Request, Response } from "express";
import { pool } from "../config/db.js";
import { sendSuccess } from "../utils/api-response.js";

export const healthCheck = async (_req: Request, res: Response) => {
  let dbStatus = "ok";

  try {
    await pool.query("SELECT 1");
  } catch {
    dbStatus = "degraded";
  }

  sendSuccess(res, {
    status: dbStatus === "ok" ? "ok" : "degraded",
    service: "campnav-backend",
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
};
