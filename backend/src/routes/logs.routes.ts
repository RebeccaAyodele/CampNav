import { Router } from "express";
import { listLogs } from "../controllers/logs.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const logsRouter = Router();

logsRouter.get("/", requireAuth, listLogs);
