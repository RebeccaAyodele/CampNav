/**
 * Types for shuttle buses, vehicle tracking, and logistics.
 */

import type { Coordinates } from "./location";

export interface Shuttle {
  id: string;
  vehicleId: string;
  driverId: string;
  driverName: string;
  capacity: number;
  currentOccupancy: number;
  currentLocation?: Coordinates;
  lastCheckInTime?: Date;
  status: ShuttleStatus;
  assignedRoute?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ShuttleStatus {
  Active = "active",
  Inactive = "inactive",
  InMaintenance = "in_maintenance",
  Offline = "offline",
}

export interface CheckIn {
  id: string;
  driverId: string;
  vehicleId: string;
  location: Coordinates;
  timestamp: Date;
  passengersBoarded: number;
  passengersDropped: number;
}

export interface RouteOptimizationRequest {
  id: string;
  deliveryPoints: Coordinates[];
  constraints?: {
    maxStops?: number;
    maxDistance?: number;
    timeWindow?: {
      startTime: Date;
      endTime: Date;
    };
  };
  status: OptimizationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum OptimizationStatus {
  Pending = "pending",
  InProgress = "in_progress",
  Completed = "completed",
  Failed = "failed",
}

export interface OptimizedRoute {
  id: string;
  requestId: string;
  stops: RouteStop[];
  totalDistance: number;
  estimatedDuration: number;
  efficiency: number; // 0-100 score
}

export interface RouteStop {
  order: number;
  location: Coordinates;
  description?: string;
  estimatedArrivalTime?: Date;
  estimatedDeparture?: Date;
  duration?: number; // minutes
}

export interface SupplyRoute {
  id: string;
  name: string;
  stops: RouteStop[];
  totalDistance: number;
  estimatedDuration: number;
  frequency: RouteFrequency;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum RouteFrequency {
  Once = "once",
  Daily = "daily",
  TwiceDaily = "twice_daily",
  Continuous = "continuous",
}
