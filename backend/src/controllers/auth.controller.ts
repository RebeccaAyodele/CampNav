import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { z } from "zod";
import { config } from "../config/env.js";
import { pool } from "../config/db.js";
import { sendSuccess, sendError } from "../utils/api-response.js";

// ─── Validation Schema ────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
export const login: RequestHandler = async (req, res) => {
  // 1. Validate incoming body with Zod
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return sendError(res, "INVALID_CREDENTIALS", "email and password are required.", 400);
  }

  const { email, password } = result.data;

  try {
    // 2. Look up the admin user by email
    const { rows } = await pool.query(
      `SELECT id, email, name, role, password_hash
       FROM admin_users
       WHERE email = $1
       LIMIT 1`,
      [email.toLowerCase().trim()]
    );

    const user = rows[0];

    // 3. Deliberately vague error — never reveal whether the email exists
    if (!user) {
      return sendError(res, "UNAUTHORIZED", "Invalid email or password.", 401);
    }

    // 4. Compare submitted password against stored bcrypt hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return sendError(res, "UNAUTHORIZED", "Invalid email or password.", 401);
    }

    // 5. Sign a real JWT with the actual user data
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      config.jwtSecret,
      { expiresIn: "8h", issuer: "campnav-api" }
    );

    // 6. Return token + user info (never return password_hash)
    return sendSuccess(res, {
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[auth/login]", message);
    return sendError(res, "INTERNAL_SERVER_ERROR", "Login failed. Please try again.", 500);
  }
};

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
export const logout: RequestHandler = (_req, res) => {
  return sendSuccess(res, { message: "Logged out." });
};