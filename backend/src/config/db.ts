import pg from "pg";
import { config } from "./env.js";

export const pool = new pg.Pool({
  connectionString: config.databaseUrl
});

export async function query<T>(text: string, params: unknown[] = []) {
  const result = await pool.query<T>(text, params);
  return result;
}
