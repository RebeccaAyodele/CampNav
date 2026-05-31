/**
 * Application-wide constants.
 * All constant values that might be referenced in multiple places go here.
 */

export const APP_NAME = "CampNav";
export const APP_VERSION = "0.1.0";
export const APP_DESCRIPTION =
  "Offline-first navigation and logistics coordination for large-scale gatherings";

// ── Route Paths ──
export const ROUTES = {
  HOME: "/",
  OFFLINE: "/offline",

  // Visitor App
  APP: "/app",
  APP_SEARCH: "/app/search",
  APP_DIRECTIONS: "/app/directions",
  APP_REPORT: "/app/report",
  APP_EMERGENCY: "/app/emergency",

  // Admin Dashboard
  DASHBOARD: "/dashboard",
  DASHBOARD_LOGIN: "/dashboard/login",
  DASHBOARD_SHUTTLES: "/dashboard/shuttles",
  DASHBOARD_EMERGENCY_ROUTING: "/dashboard/emergency-routing",
  DASHBOARD_SUPPLY_ROUTES: "/dashboard/supply-routes",
  DASHBOARD_LOST_PERSONS: "/dashboard/lost-persons",
  DASHBOARD_REPORTS: "/dashboard/reports",

  // Driver
  DRIVER: "/driver",
} as const;

// ── Common UI Constants ──
export const TOUCH_TARGET_SIZE = "44px";
export const MODAL_ANIMATION_DURATION = 200; // milliseconds
export const TOAST_DURATION = 4000; // milliseconds

// ── Error Messages ──
export const ERROR_MESSAGES = {
  OFFLINE: "You are currently offline. Some features may be unavailable.",
  NETWORK_ERROR:
    "Unable to connect to the server. Please check your internet connection.",
  LOCATION_PERMISSION_DENIED:
    "Location access was denied. Enable location permissions to use this feature.",
  LOCATION_UNAVAILABLE:
    "Your location could not be determined. Please try again.",
  INVALID_INPUT: "Please enter valid information.",
  SESSION_EXPIRED: "Your session has expired. Please log in again.",
  UNAUTHORIZED: "You do not have permission to access this resource.",
  FORM_SUBMISSION_ERROR:
    "An error occurred while submitting the form. Please try again.",
  GENERIC_ERROR: "Something went wrong. Please try again later.",
} as const;

// ── Success Messages ──
export const SUCCESS_MESSAGES = {
  REPORT_SUBMITTED: "Report submitted successfully.",
  CHECK_IN_SUCCESSFUL: "Check-in recorded successfully.",
  LOGIN_SUCCESSFUL: "Logged in successfully.",
  LOGOUT_SUCCESSFUL: "Logged out successfully.",
  SAVED: "Changes saved successfully.",
} as const;

// ── Validation Rules ──
export const VALIDATION = {
  PHONE_REGEX: /^\+?[1-9]\d{1,14}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MIN_PASSWORD_LENGTH: 8,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
} as const;

// ── Empty States ──
export const EMPTY_STATES = {
  NO_RESULTS: "No results found. Try searching with different keywords.",
  NO_SHUTTLES: "No active shuttles at the moment.",
  NO_REPORTS: "No reports submitted yet.",
  NO_ROUTES: "No routes configured yet.",
} as const;

// ── Date Format Defaults ──
export const DATE_FORMATS = {
  SHORT_DATE: "MMM d, yyyy",
  FULL_DATE: "EEEE, MMMM d, yyyy",
  TIME_ONLY: "h:mm a",
  DATE_TIME: "MMM d, yyyy h:mm a",
} as const;
