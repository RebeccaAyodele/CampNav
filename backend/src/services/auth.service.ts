import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../config/db.js";
import { config } from "../config/env.js";
import { ErrorCodes } from "../constants/error-codes.js";
import type { UserRow } from "../types/db.js";
import { AppError } from "../utils/app-error.js";

export async function login(email: string, password: string) {
  const result = await query<UserRow>(
    `SELECT * FROM users WHERE email = $1 LIMIT 1`,
    [email]
  );

  const user = result.rows[0];

  if (!user) {
    throw new AppError(ErrorCodes.InvalidCredentials, "Invalid email or password", 401);
  }

  const passwordValid = await bcrypt.compare(password, user.password_hash);

  if (!passwordValid) {
    throw new AppError(ErrorCodes.InvalidCredentials, "Invalid email or password", 401);
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    config.jwtSecret,
    { expiresIn: "8h" }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    token
  };
}
