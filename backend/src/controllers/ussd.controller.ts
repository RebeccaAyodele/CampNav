import type { NextFunction, Request, Response } from "express";
import * as ussdService from "../services/ussd.service.js";

export const handleUssdWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = String(req.body.sessionId ?? "");
    const phoneNumber = String(req.body.phoneNumber ?? "");
    const text = String(req.body.text ?? "");

    const response = await ussdService.handleSession(sessionId, phoneNumber, text);

    res.type("text/plain").send(response);
  } catch (error) {
    next(error);
  }
};
