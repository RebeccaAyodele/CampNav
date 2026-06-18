import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import * as authService from "../services/auth.service.js";
import { sendSuccess } from "../utils/api-response.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input.email, input.password);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const logout = (_req: Request, res: Response) => {
  sendSuccess(res, { message: "Logged out" });
};
