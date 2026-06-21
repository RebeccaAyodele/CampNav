-- Fix users table to match expected schema
-- The table may have been created by a prior setup (e.g. Prisma) with different column types

-- Add name column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'name'
  ) THEN
    ALTER TABLE users ADD COLUMN name TEXT NOT NULL DEFAULT 'Admin';
  END IF;
END $$;

-- Fix role column: if it exists as the wrong type, drop and recreate
DO $$
DECLARE
  current_type TEXT;
BEGIN
  SELECT data_type INTO current_type
  FROM information_schema.columns
  WHERE table_name = 'users' AND column_name = 'role';

  IF current_type IS NOT NULL AND current_type != 'USER-DEFINED' THEN
    -- Column exists but is not our enum type, fix it
    ALTER TABLE users DROP COLUMN role;
    ALTER TABLE users ADD COLUMN role user_role NOT NULL DEFAULT 'coordinator';
  END IF;
END $$;
