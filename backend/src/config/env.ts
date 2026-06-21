import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  AT_API_KEY: z.string().min(1),
  AT_USERNAME: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  DEMO_ADMIN_EMAIL: z.string().email().default("admin@campnav.local"),
  DEMO_ADMIN_PASSWORD: z.string().min(8).default("ChangeMe123!")
});

const env = envSchema.parse(process.env);

export const config = {
  databaseUrl: env.DATABASE_URL,
  jwtSecret: env.JWT_SECRET,
  africaTalkingApiKey: env.AT_API_KEY,
  africaTalkingUsername: env.AT_USERNAME,
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  corsOrigin: env.CORS_ORIGIN,
  demoAdminEmail: env.DEMO_ADMIN_EMAIL,
  demoAdminPassword: env.DEMO_ADMIN_PASSWORD
} as const;
