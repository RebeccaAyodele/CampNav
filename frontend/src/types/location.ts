/**
 * Types for locations, facilities, and geographic data.
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location extends Coordinates {
  id: string;
  name: string;
  description?: string;
  facilityType: FacilityType;
  address?: string;
  distance?: number; // estimated walking distance in meters
  phone?: string;
  hours?: {
    open: string;
    close: string;
  };
  amenities: Amenity[];
  createdAt: Date;
  updatedAt: Date;
}

export enum FacilityType {
  Medical = "medical",
  Security = "security",
  FirstAid = "first_aid",
  Restroom = "restroom",
  WaterStation = "water_station",
  FoodVenue = "food_venue",
  InformationBooth = "information_booth",
  Parking = "parking",
  Shelter = "shelter",
  Other = "other",
}

export enum Amenity {
  WheelchairAccessible = "wheelchair_accessible",
  HasSeating = "has_seating",
  HasShade = "has_shade",
  BabyChanging = "baby_changing",
  FirstAidKit = "first_aid_kit",
  PhoneCharging = "phone_charging",
  WiFi = "wifi",
}

export interface RouteStep {
  instruction: string;
  distance: number; // meters
  duration: number; // seconds
  geometry: Coordinates[];
}

export interface Route {
  id: string;
  origin: Location;
  destination: Location;
  steps: RouteStep[];
  totalDistance: number;
  totalDuration: number;
  createdAt: Date;
}
