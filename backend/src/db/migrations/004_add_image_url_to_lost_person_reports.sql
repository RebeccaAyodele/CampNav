DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lost_person_reports' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE lost_person_reports ADD COLUMN image_url TEXT;
  END IF;
END $$;
