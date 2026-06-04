CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'coordinator', 'driver');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lost_person_status') THEN
    CREATE TYPE lost_person_status AS ENUM ('open', 'in_progress', 'resolved');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lost_person_source') THEN
    CREATE TYPE lost_person_source AS ENUM ('app', 'ussd', 'dashboard');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'log_level') THEN
    CREATE TYPE log_level AS ENUM ('info', 'warn', 'error');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'coordinator',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  boundary_geojson JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pois (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  description TEXT,
  aliases TEXT[] NOT NULL DEFAULT '{}',
  lat DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lng DOUBLE PRECISION NOT NULL CHECK (lng BETWEEN -180 AND 180),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS roads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  road_type TEXT NOT NULL DEFAULT 'pedestrian',
  accessible_by_vehicle BOOLEAN NOT NULL DEFAULT false,
  path_geojson JSONB NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shuttle_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shuttle_id TEXT NOT NULL,
  driver_name TEXT,
  zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  lat DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lng DOUBLE PRECISION NOT NULL CHECK (lng BETWEEN -180 AND 180),
  passenger_load INTEGER CHECK (passenger_load IS NULL OR passenger_load >= 0),
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lost_person_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  description TEXT NOT NULL,
  reporter_name TEXT,
  reporter_phone TEXT,
  last_seen_location TEXT,
  lat DOUBLE PRECISION CHECK (lat IS NULL OR lat BETWEEN -90 AND 90),
  lng DOUBLE PRECISION CHECK (lng IS NULL OR lng BETWEEN -180 AND 180),
  source lost_person_source NOT NULL DEFAULT 'app',
  status lost_person_status NOT NULL DEFAULT 'open',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level log_level NOT NULL DEFAULT 'info',
  event TEXT NOT NULL,
  message TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_zones_boundary_geojson ON zones USING GIN (boundary_geojson);
CREATE INDEX IF NOT EXISTS idx_pois_location ON pois (lat, lng);
CREATE INDEX IF NOT EXISTS idx_pois_type ON pois (type);
CREATE INDEX IF NOT EXISTS idx_pois_aliases ON pois USING GIN (aliases);
CREATE INDEX IF NOT EXISTS idx_roads_path_geojson ON roads USING GIN (path_geojson);
CREATE INDEX IF NOT EXISTS idx_roads_accessible_by_vehicle ON roads (accessible_by_vehicle);
CREATE INDEX IF NOT EXISTS idx_shuttle_checkins_shuttle_time ON shuttle_checkins (shuttle_id, checked_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_shuttle_checkins_location ON shuttle_checkins (lat, lng);
CREATE INDEX IF NOT EXISTS idx_lost_person_reports_status_time ON lost_person_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lost_person_reports_location ON lost_person_reports (lat, lng);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs (created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_users_updated_at ON users;
CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_zones_updated_at ON zones;
CREATE TRIGGER set_zones_updated_at
BEFORE UPDATE ON zones
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_pois_updated_at ON pois;
CREATE TRIGGER set_pois_updated_at
BEFORE UPDATE ON pois
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_roads_updated_at ON roads;
CREATE TRIGGER set_roads_updated_at
BEFORE UPDATE ON roads
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_lost_person_reports_updated_at ON lost_person_reports;
CREATE TRIGGER set_lost_person_reports_updated_at
BEFORE UPDATE ON lost_person_reports
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
