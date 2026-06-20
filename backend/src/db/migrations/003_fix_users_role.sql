-- Fix role column type if it's not our user_role enum
-- This handles cases where the users table was created by Prisma or another tool
-- with a different column type (e.g. TEXT[] instead of user_role enum)
DO $$
DECLARE
  current_type TEXT;
BEGIN
  SELECT data_type INTO current_type
  FROM information_schema.columns
  WHERE table_name = 'users' AND column_name = 'role';

  -- If role doesn't exist at all, add it
  IF current_type IS NULL THEN
    ALTER TABLE users ADD COLUMN role user_role NOT NULL DEFAULT 'coordinator';
  -- If role exists but is wrong type (not our enum), fix it
  ELSIF current_type != 'USER-DEFINED' THEN
    ALTER TABLE users DROP COLUMN role;
    ALTER TABLE users ADD COLUMN role user_role NOT NULL DEFAULT 'coordinator';
  END IF;
END $$;
