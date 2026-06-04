import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "../config/env.js";
import { sendSuccess } from "../utils/api-response.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const login: RequestHandler = (req, res) => {
  const input = loginSchema.parse(req.body);

  const token = jwt.sign(
    {
      id: "admin_placeholder",
      role: "admin"
    },
    config.jwtSecret,
    { expiresIn: "8h" }
  );

  sendSuccess(res, {
    user: {
      id: "admin_placeholder",
      email: input.email,
      role: "admin"
    },
    token
  });
};

export const logout: RequestHandler = (_req, res) => {
  sendSuccess(res, { message: "Logged out" });
};
