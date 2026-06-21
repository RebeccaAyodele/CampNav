/**
 * Centralized configuration for the entire application.
 * All environment-specific values go here, not scattered in components.
 * This ensures easy swapping between environments (dev, staging, prod).
 */

export const config = {
  // ── API Configuration ──
  api: {
    baseUrl: "https://campnav.onrender.com",//process.env.NEXT_PUBLIC_API_URL || "https://campnav.onrender.com",
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "10000", 10),
  },

  // ── Map Configuration ──
  map: {
    defaultCenter: {
      lat: parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LAT || "6.8097"),
      lng: parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LNG || "3.4588"),
    },
    defaultZoom: parseInt(process.env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM || "14", 10),
    styleUrl:
      process.env.NEXT_PUBLIC_MAPLIBRE_STYLE_URL ||
      "https://api.maptiler.com/maps/streets/style.json",
  },

  // ── Feature Flags ──
  features: {
    offlineMode: process.env.NEXT_PUBLIC_OFFLINE_MODE === "true",
    pwaEnabled: process.env.NEXT_PUBLIC_PWA_ENABLED === "true",
  },

  // ── Logging ──
  logging: {
    level: (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || "info",
  },

  // ── Internationalization ──
  i18n: {
    defaultLanguage: process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE || "en",
    supportedLanguages: ["en", "yo", "ha", "ig", "fr"],
  },

  // ── Timeouts (milliseconds) ──
  timeouts: {
    apiRequest: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "10000", 10),
    offlineRetry: 5000,
    geolocationTimeout: 10000,
    healthCheckInterval: 15000,
  },

  // ── URLs ──
  urls: {
    privacyPolicy: "/privacy",
    termsOfService: "/terms",
    supportEmail: "support@campnav.example.com",
  },

  // ── WebSocket ──
  websocket: {
    url:"https://campnav.onrender.com" || "http://localhost:3001",
  },
} as const;

export type LogLevel = "debug" | "info" | "warn" | "error";

export default config;
