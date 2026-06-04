import { Router } from "express";
import { getActiveShuttles, recordShuttleCheckin } from "../controllers/shuttles.controller.js";

export const shuttlesRouter = Router();

shuttlesRouter.post("/checkin", recordShuttleCheckin);
shuttlesRouter.get("/active", getActiveShuttles);
