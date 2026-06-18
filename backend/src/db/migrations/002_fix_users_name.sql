-- Add name column to users if it was created without it
-- (handles databases where the table existed before our migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'name'
  ) THEN
    ALTER TABLE users ADD COLUMN name TEXT NOT NULL DEFAULT 'Admin';
  END IF;
END $$;
