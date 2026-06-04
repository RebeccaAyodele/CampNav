import { Router } from "express";
import {
  createLostPersonReport,
  listLostPersonReports,
  updateLostPersonStatus
} from "../controllers/lost-persons.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const lostPersonsRouter = Router();

lostPersonsRouter.post("/", createLostPersonReport);
lostPersonsRouter.get("/", requireAuth, listLostPersonReports);
lostPersonsRouter.patch("/:id/status", requireAuth, updateLostPersonStatus);
