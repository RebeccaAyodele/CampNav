/**
 * Core domain types for CampNav users and authentication.
 * All user-related TypeScript interfaces and types.
 */

export interface BaseUser {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Visitor extends BaseUser {
  displayName?: string;
  preferredLanguage: string;
}

export interface Admin extends BaseUser {
  displayName: string;
  role: "admin" | "coordinator";
  permissions: Permission[];
}

export interface Driver extends BaseUser {
  vehicleId: string;
  vehicleName: string;
  phoneNumber: string;
  lastCheckInLocation?: {
    lat: number;
    lng: number;
  };
  lastCheckInTime?: Date;
  isActive: boolean;
}

export type User = Visitor | Admin | Driver;

export enum Permission {
  ManageShuttles = "manage_shuttles",
  ManageReports = "manage_reports",
  ViewAnalytics = "view_analytics",
  ManageUsers = "manage_users",
  ConfigureRoutes = "configure_routes",
}

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

export interface AuthSession {
  user: User;
  token: AuthToken;
}
