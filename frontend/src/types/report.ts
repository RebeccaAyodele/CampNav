/**
 * Types for incident reports, lost persons, and emergency communications.
 */

import type { Coordinates } from "./location";

export interface LostPersonReport {
  id: string;
  description: string; // name, description, or identifying features
  approximateAge?: number;
  lastKnownLocation?: Coordinates;
  lastKnownLocationDescription?: string;
  reporterName?: string;
  reporterContactNumber: string;
  status: LostPersonStatus;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  notes?: string;
}

export enum LostPersonStatus {
  Open = "open",
  Located = "located",
  Reunited = "reunited",
  Closed = "closed",
}

export interface EmergencyContact {
  id: string;
  service: EmergencyService;
  contactNumber: string;
  description: string;
  responseTime?: string;
  available24h: boolean;
}

export enum EmergencyService {
  Medical = "medical",
  Security = "security",
  Fire = "fire",
  Police = "police",
  ChildProtection = "child_protection",
}

export interface EmergencyAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  location?: Coordinates;
  respondersDispatched: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum AlertType {
  MedicalEmergency = "medical_emergency",
  SecurityIncident = "security_incident",
  Fire = "fire",
  Lost = "lost_person",
  Other = "other",
}

export enum AlertSeverity {
  Low = "low",
  Medium = "medium",
  High = "high",
  Critical = "critical",
}

export interface ActivityLogEntry {
  id: string;
  type: ActivityType;
  description: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export enum ActivityType {
  CheckIn = "check_in",
  RouteRequested = "route_requested",
  ReportSubmitted = "report_submitted",
  ReportResolved = "report_resolved",
  ShuttlePositionUpdate = "shuttle_position_update",
  EmergencyAlertCreated = "emergency_alert_created",
  UserLogIn = "user_login",
  UserLogOut = "user_logout",
}
