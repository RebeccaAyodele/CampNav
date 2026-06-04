import { Router } from "express";
import { handleUssdWebhook } from "../controllers/ussd.controller.js";

export const ussdRouter = Router();

ussdRouter.post("/webhook", handleUssdWebhook);
