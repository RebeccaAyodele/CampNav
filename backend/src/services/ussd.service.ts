import { query } from "../config/db.js";
import type { PoiRow } from "../types/db.js";
import * as lostPersonsService from "./lost-persons.service.js";

// ── Helpers ─────────────────────────────────────────────────────────

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const facilityTypeMap: Record<string, string> = {
  "1": "medical",
  "2": "services",    // closest to "toilets" in our data
  "3": "finance",     // ATMs / banks
  "4": "commerce",    // food / markets
  "5": "accommodation",
  "6": "parking"      // closest to "gates" - entry points
};

const facilityLabels: Record<string, string> = {
  "1": "Medical",
  "2": "Services",
  "3": "Banks & ATM",
  "4": "Food & Markets",
  "5": "Accommodation",
  "6": "Parking & Gates"
};

// Default center of Redemption City for distance calculations
const CAMP_CENTER = { lat: 6.813, lng: 3.457 };

async function findNearestByType(type: string, limit = 3): Promise<PoiRow[]> {
  const result = await query<PoiRow>(
    `SELECT * FROM pois WHERE type = $1`,
    [type]
  );

  const withDist = result.rows.map((row) => ({
    ...row,
    dist: haversine(CAMP_CENTER.lat, CAMP_CENTER.lng, row.lat, row.lng)
  }));

  withDist.sort((a, b) => a.dist - b.dist);
  return withDist.slice(0, limit);
}

async function findZoneInfo(zoneName: string): Promise<string> {
  // Try to find POIs matching the zone query
  const result = await query<PoiRow>(
    `SELECT * FROM pois WHERE name ILIKE $1 OR metadata->>'zone' ILIKE $1 LIMIT 5`,
    [`%${zoneName}%`]
  );

  if (result.rows.length === 0) {
    return `No facilities found for "${zoneName}". Try searching by name instead.`;
  }

  const lines = result.rows.map((r, i) => `${i + 1}. ${r.name} (${r.type})`);
  return `Facilities near "${zoneName}":\n${lines.join("\n")}`;
}

// ── USSD Session Handler ────────────────────────────────────────────

/**
 * Process a USSD session request.
 * Africa's Talking sends `text` as all user inputs joined by `*`.
 * Empty string = first request (show welcome menu).
 *
 * Returns the response string prefixed with CON (continue) or END (finish).
 */
export async function handleSession(
  _sessionId: string,
  phoneNumber: string,
  text: string
): Promise<string> {
  const parts = text.split("*").filter((p) => p.length > 0);
  const depth = parts.length;

  // ── Level 0: Welcome ─────────────────────────────────────────────
  if (depth === 0) {
    return [
      "CON Welcome to CampNav",
      "Redemption City Navigation",
      "",
      "Reply:",
      "1. Find facility",
      "2. Find zone",
      "3. Report lost person",
      "4. Emergency contacts"
    ].join("\n");
  }

  const choice = parts[0];

  // ── Branch 1: Find facility ───────────────────────────────────────
  if (choice === "1") {
    if (depth === 1) {
      return [
        "CON Select facility type:",
        "1. Medical",
        "2. Services",
        "3. Banks & ATM",
        "4. Food & Markets",
        "5. Accommodation",
        "6. Parking & Gates"
      ].join("\n");
    }

    const typeChoice = parts[1]!;
    const facilityType = facilityTypeMap[typeChoice];

    if (!facilityType) {
      return "END Invalid selection. Please try again.";
    }

    if (depth === 2) {
      // Show nearest 3 of this type
      const pois = await findNearestByType(facilityType);
      if (pois.length === 0) {
        return `END No ${facilityLabels[typeChoice] ?? "facilities"} found nearby.`;
      }

      const lines = pois.map((p, i) => `${i + 1}. ${p.name}`);
      return `CON Nearest ${facilityLabels[typeChoice] ?? "facilities"}:\n${lines.join("\n")}\n\nReply with number for directions`;
    }

    if (depth === 3) {
      // Show directions to selected facility
      const pois = await findNearestByType(facilityType);
      const selectedIdx = parseInt(parts[2]!, 10) - 1;
      const selected = pois[selectedIdx];

      if (!selected) {
        return "END Invalid selection.";
      }

      // Generate simple text directions
      const bearing = calculateSimpleBearing(CAMP_CENTER.lat, CAMP_CENTER.lng, selected.lat, selected.lng);
      const dist = Math.round(haversine(CAMP_CENTER.lat, CAMP_CENTER.lng, selected.lat, selected.lng));

      return [
        `END Directions to ${selected.name}:`,
        "",
        `Head ${bearing} for approximately ${dist}m.`,
        `Location: ${selected.description ?? selected.name}`,
        "",
        "Thank you for using CampNav!"
      ].join("\n");
    }
  }

  // ── Branch 2: Find zone ───────────────────────────────────────────
  if (choice === "2") {
    if (depth === 1) {
      return "CON Enter zone name or keyword\n(e.g. Arena, Gate, Medical):";
    }

    if (depth === 2) {
      const zoneName = parts[1]!;
      const info = await findZoneInfo(zoneName);
      return `END ${info}\n\nThank you for using CampNav!`;
    }
  }

  // ── Branch 3: Lost person report ──────────────────────────────────
  if (choice === "3") {
    if (depth === 1) {
      return "CON Describe the person and their last known location:\n(e.g. Boy, 8, red shirt, near Gate 3)";
    }

    if (depth === 2) {
      const description = parts[1]!;

      try {
        await lostPersonsService.createReport({
          description,
          reporterPhone: phoneNumber,
          source: "ussd"
        });

        return [
          "END Report received!",
          "",
          "Camp security has been notified.",
          "Keep your phone on — security may call you.",
          "",
          "Emergency: Call 0800-CAMPNAV"
        ].join("\n");
      } catch {
        return "END Sorry, we could not submit your report. Please try again or call security directly.";
      }
    }
  }

  // ── Branch 4: Emergency contacts ──────────────────────────────────
  if (choice === "4") {
    return [
      "END Emergency Contacts:",
      "",
      "Medical: 0800-CAMPNAV",
      "Security: 0800-CAMPNAV",
      "Fire: 0800-CAMPNAV",
      "",
      "Or visit the nearest medical post.",
      "Thank you for using CampNav!"
    ].join("\n");
  }

  // ── Fallback ──────────────────────────────────────────────────────
  return "END Invalid input. Please dial again to restart.";
}

// ── Simple bearing helper ───────────────────────────────────────────

function calculateSimpleBearing(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;

  if (bearing >= 337.5 || bearing < 22.5) return "north";
  if (bearing < 67.5) return "northeast";
  if (bearing < 112.5) return "east";
  if (bearing < 157.5) return "southeast";
  if (bearing < 202.5) return "south";
  if (bearing < 247.5) return "southwest";
  if (bearing < 292.5) return "west";
  return "northwest";
}
