export type UserRole = "admin" | "coordinator" | "driver";
export type LostPersonStatus = "open" | "in_progress" | "resolved";
export type LostPersonSource = "app" | "ussd" | "dashboard";
export type LogLevel = "info" | "warn" | "error";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
};

export type ZoneRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  boundary_geojson: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
};

export type PoiRow = {
  id: string;
  name: string;
  type: string;
  zone_id: string | null;
  description: string | null;
  aliases: string[];
  lat: number;
  lng: number;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
};

export type RoadRow = {
  id: string;
  name: string | null;
  road_type: string;
  accessible_by_vehicle: boolean;
  path_geojson: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
};

export type ShuttleCheckinRow = {
  id: string;
  shuttle_id: string;
  driver_name: string | null;
  zone_id: string | null;
  lat: number;
  lng: number;
  passenger_load: number | null;
  checked_in_at: Date;
  created_at: Date;
};

export type LostPersonReportRow = {
  id: string;
  name: string | null;
  description: string;
  reporter_name: string | null;
  reporter_phone: string | null;
  last_seen_location: string | null;
  lat: number | null;
  lng: number | null;
  source: LostPersonSource;
  status: LostPersonStatus;
  resolved_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type LogRow = {
  id: string;
  level: LogLevel;
  event: string;
  message: string;
  context: Record<string, unknown>;
  created_at: Date;
};
