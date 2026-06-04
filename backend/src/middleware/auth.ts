import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { sendError } from "../utils/api-response.js";

export type AuthUser = {
  id: string;
  role: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    sendError(res, "UNAUTHORIZED", "Missing bearer token", 401);
    return;
  }

  try {
    req.user = jwt.verify(header.slice("Bearer ".length), config.jwtSecret) as AuthUser;
    next();
  } catch {
    sendError(res, "UNAUTHORIZED", "Invalid bearer token", 401);
  }
};
