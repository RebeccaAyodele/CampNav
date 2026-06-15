// src/config/storage.ts
import { createClient } from "@supabase/supabase-js";
import { config } from "./env.js";


export const storageClient = createClient(
  config.supabaseUrl,
  config.supabaseServiceKey
);
