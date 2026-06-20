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
  "2": "services",
  "3": "finance",
  "4": "commerce",
  "5": "accommodation",
  "6": "parking"
};

const typeToKeyMap: Record<string, string> = {
  medical: "1",
  services: "2",
  finance: "3",
  commerce: "4",
  accommodation: "5",
  parking: "6"
};

// Default center of Redemption City for distance calculations
const CAMP_CENTER = { lat: 6.813, lng: 3.457 };

interface LangStrings {
  welcome: string;
  facilityTitle: string;
  facilities: Record<string, string>;
  findZonePrompt: string;
  lostPersonPrompt: string;
  lostPersonSuccess: string;
  emergencyTitle: string;
  emergencyList: string;
  invalidSelect: string;
  invalidType: string;
  directionsTitle: (name: string) => string;
  directionsText: (bearing: string, dist: number, desc: string) => string;
  thankYou: string;
  noFacilities: string;
  zoneFacilitiesTitle: (zone: string) => string;
  zoneNoFacilities: (zone: string) => string;
}

const languages: Record<string, LangStrings> = {
  "1": { // English
    welcome: "Welcome to CampNav\nRedemption City Navigation\n\nReply:\n1. Find facility\n2. Find zone\n3. Report lost person\n4. Emergency contacts",
    facilityTitle: "Select facility type:",
    facilities: {
      "1": "Medical",
      "2": "Services",
      "3": "Banks & ATM",
      "4": "Food & Markets",
      "5": "Accommodation",
      "6": "Parking & Gates"
    },
    findZonePrompt: "Enter zone name or keyword\n(e.g. Arena, Gate, Medical):",
    lostPersonPrompt: "Describe the person and their last known location:\n(e.g. Boy, 8, red shirt, near Gate 3)",
    lostPersonSuccess: "Report received!\n\nCamp security has been notified.\nKeep your phone on — security may call you.\n\nEmergency: Call 0800-CAMPNAV",
    emergencyTitle: "Emergency Contacts:",
    emergencyList: "Medical: 0800-CAMPNAV\nSecurity: 0800-CAMPNAV\nFire: 0800-CAMPNAV\n\nOr visit the nearest medical post.",
    invalidSelect: "Invalid selection. Please try again.",
    invalidType: "Invalid selection.",
    directionsTitle: (name) => `Directions to ${name}:`,
    directionsText: (bearing, dist, desc) => `Head ${bearing} for approximately ${dist}m.\nLocation: ${desc}`,
    thankYou: "Thank you for using CampNav!",
    noFacilities: "No facilities found nearby.",
    zoneFacilitiesTitle: (zone) => `Facilities near "${zone}":`,
    zoneNoFacilities: (zone) => `No facilities found for "${zone}". Try searching by name instead.`
  },
  "2": { // Yoruba
    welcome: "Kaabo si CampNav\nIpolongo fun Redemption City\n\nE dahun si:\n1. Wa ibi pataki\n2. Wa Agbegbe\n3. Jabọ eniyan ti o sọnu\n4. Awọn nọmba pajawiri",
    facilityTitle: "Yan iru ibi ti o n wa:",
    facilities: {
      "1": "Iṣoogun (Medical)",
      "2": "Awọn iṣẹ (Services)",
      "3": "Awọn banki (Banks & ATM)",
      "4": "Ounjẹ & Ọja (Food & Markets)",
      "5": "Ibugbe (Accommodation)",
      "6": "Paati & Awọn ẹnubode (Parking & Gates)"
    },
    findZonePrompt: "Kọ orukọ agbegbe naa\n(apẹẹrẹ: Arena, Gate, Medical):",
    lostPersonPrompt: "Ṣapejuwe eniyan naa ati ibi ti o gbẹhin ti a ti rii:\n(apẹẹrẹ: Ọmọkunrin, ọdun 8, aṣọ pupa, nitosi Gate 3)",
    lostPersonSuccess: "A ti gba ijabọ rẹ!\n\nA ti sọ fun awọn alabo camp.\nMu foonu rẹ lọwọ — awọn alabo le pe ọ.\n\nPajawiri: Pe 0800-CAMPNAV",
    emergencyTitle: "Awọn Nọmba Pajawiri:",
    emergencyList: "Iṣoogun: 0800-CAMPNAV\nAlabo (Security): 0800-CAMPNAV\nIna (Fire): 0800-CAMPNAV\n\nTabi bẹwo ibi iṣoogun to sunmọ julọ.",
    invalidSelect: "Aṣayan ti ko tọ. Jọwọ gbiyanju lẹẹkansii.",
    invalidType: "Aṣayan ti ko tọ.",
    directionsTitle: (name) => `Ìtọsọna lọ si ${name}:`,
    directionsText: (bearing, dist, desc) => `Koju si ${bearing} fun bi ${dist}m.\nIbugbe: ${desc}`,
    thankYou: "O ṣeun fun lilo CampNav!",
    noFacilities: "A ko ri awọn ibi kankan nitosi.",
    zoneFacilitiesTitle: (zone) => `Awọn ibi nitosi "${zone}":`,
    zoneNoFacilities: (zone) => `A ko ri awọn ibi kankan fun "${zone}". Gbiyanju lati wa nipa orukọ.`
  },
  "3": { // Hausa
    welcome: "Barka da zuwa CampNav\nTaswirar Redemption City\n\nRubuta lamba:\n1. Nemo wuri\n2. Nemo yanki\n3. Bada rahoton bacewar mutum\n4. Lambobin gaggawa",
    facilityTitle: "Zaɓi nau'in wuri:",
    facilities: {
      "1": "Lafiya (Medical)",
      "2": "Ayyuka (Services)",
      "3": "Banki da ATM (Banks & ATM)",
      "4": "Abinci da Kasuwanni (Food & Markets)",
      "5": "Masauki (Accommodation)",
      "6": "Wurin Ajiye Mota & Kofofi (Parking & Gates)"
    },
    findZonePrompt: "Shigar da sunan yanki ko kalma:\n(misali: Arena, Gate, Medical):",
    lostPersonPrompt: "Kwatanta mutumin da inda aka gan shi na ƙarshe:\n(misali: Yaro, 8, jajayen riga, kusa da Gate 3)",
    lostPersonSuccess: "An karɓi rahotonku!\n\nAn sanar da jami'an tsaro.\nKa bar wayarka a kunne — jami'an tsaro na iya kiran ka.\n\nGaggawa: Kira 0800-CAMPNAV",
    emergencyTitle: "Lambobin Gaggawa:",
    emergencyList: "Lafiya: 0800-CAMPNAV\nTsaro: 0800-CAMPNAV\nWuta: 0800-CAMPNAV\n\nKo kuma ka ziyarci asibiti mafi kusa.",
    invalidSelect: "Zaɓin da bai dace ba. Da fatan za a sake gwadawa.",
    invalidType: "Zaɓin da bai dace ba.",
    directionsTitle: (name) => `Kwatance zuwa ${name}:`,
    directionsText: (bearing, dist, desc) => `Nufi ${bearing} na kimanin mita ${dist}.\nWuri: ${desc}`,
    thankYou: "Na gode da amfani da CampNav!",
    noFacilities: "Ba a sami wurare na kusa ba.",
    zoneFacilitiesTitle: (zone) => `Wurare kusa da "${zone}":`,
    zoneNoFacilities: (zone) => `Ba a sami wurare na "${zone}" ba. Gwada nema ta sunan wuri.`
  },
  "4": { // Igbo
    welcome: "Nnọọ na CampNav\nNnyemaaka Redemption City\n\nZaghachi:\n1. Chọọ ebe\n2. Chọọ mpaghara\n3. Kọọ maka onye furu efu\n4. Nọmba mberede",
    facilityTitle: "Họrọ ụdị ebe:",
    facilities: {
      "1": "Ahụike (Medical)",
      "2": "Ọrụ (Services)",
      "3": "Ụlọ Akụ & ATM (Banks & ATM)",
      "4": "Nri & Ahịa (Food & Markets)",
      "5": "Ebe obibi (Accommodation)",
      "6": "Ebe a na-adọba ụgbọala & Ọnụ ụzọ (Parking & Gates)"
    },
    findZonePrompt: "Tinye aha mpaghara ma ọ bụ okwu:\n(dịka: Arena, Gate, Medical):",
    lostPersonPrompt: "Kwatawa onye ahụ na ebe ikpeazụ a hụrụ ya:\n(dịka: Nwoke, afọ 8, uwe uhie, nso Gate 3)",
    lostPersonSuccess: "Anyị enwetala akụkọ gị!\n\nE sela ndị nche ozi.\nDowe ekwentị gị ka ọ na-ada — ndị nche nwere ike ịkpọ gị.\n\nMberede: Kpọọ 0800-CAMPNAV",
    emergencyTitle: "Nọmba Mberede:",
    emergencyList: "Ahụike: 0800-CAMPNAV\nNdị Nche: 0800-CAMPNAV\nỌkụ: 0800-CAMPNAV\n\nMa ọ bụ gaa n'ụlọ ahụike kacha nso gị.",
    invalidSelect: "Nhọrọ na-adịghị mma. Biko nwaa ọzọ.",
    invalidType: "Nhọrọ na-adịghị mma.",
    directionsTitle: (name) => `Kpagharịa gaa na ${name}:`,
    directionsText: (bearing, dist, desc) => `Gaa na ${bearing} ihe dị ka mita ${dist}.\nEbe ọ dị: ${desc}`,
    thankYou: "Daalụ maka iji CampNav!",
    noFacilities: "Ahụghị ebe ọ bụla dị nso.",
    zoneFacilitiesTitle: (zone) => `Ebe ndị dị nso na "${zone}":`,
    zoneNoFacilities: (zone) => `Ahụghị ebe ọ bụla na "${zone}". Nwaa ịchọ aha ya.`
  },
  "5": { // French
    welcome: "Bienvenue sur CampNav\nNavigation dans Redemption City\n\nRépondre:\n1. Trouver un lieu\n2. Trouver une zone\n3. Signaler une personne perdue\n4. Contacts d'urgence",
    facilityTitle: "Sélectionnez le type de lieu:",
    facilities: {
      "1": "Médical",
      "2": "Services",
      "3": "Banques & Distributeurs",
      "4": "Nourriture & Marchés",
      "5": "Hébergement",
      "6": "Parking & Portes"
    },
    findZonePrompt: "Entrez le nom de la zone ou mot-clé\n(ex: Arena, Gate, Medical):",
    lostPersonPrompt: "Décrivez la personne et son dernier lieu connu:\n(ex: Garçon, 8 ans, t-shirt rouge, près du Gate 3)",
    lostPersonSuccess: "Signalement reçu!\n\nLa sécurité du camp a été notifiée.\nGardez votre téléphone allumé — la sécurité peut vous appeler.\n\nUrgence: Appelez 0800-CAMPNAV",
    emergencyTitle: "Contacts d'urgence:",
    emergencyList: "Médical: 0800-CAMPNAV\nSécurité: 0800-CAMPNAV\nIncendie: 0800-CAMPNAV\n\nOu visitez le poste médical le plus proche.",
    invalidSelect: "Sélection invalide. Veuillez réessayer.",
    invalidType: "Sélection invalide.",
    directionsTitle: (name) => `Directions vers ${name}:`,
    directionsText: (bearing, dist, desc) => `Dirigez-vous vers le ${bearing} sur environ ${dist}m.\nEmplacement: ${desc}`,
    thankYou: "Merci d'utiliser CampNav!",
    noFacilities: "Aucun établissement trouvé à proximité.",
    zoneFacilitiesTitle: (zone) => `Établissements près de "${zone}":`,
    zoneNoFacilities: (zone) => `Aucun établissement trouvé pour "${zone}". Essayez de chercher par nom.`
  }
};

const bearingTranslations: Record<string, Record<string, string>> = {
  "1": { // English
    north: "north", northeast: "northeast", east: "east", southeast: "southeast",
    south: "south", southwest: "southwest", west: "west", northwest: "northwest"
  },
  "2": { // Yoruba
    north: "ariwa", northeast: "ila-orun ariwa", east: "ila-orun", southeast: "ila-orun guusu",
    south: "guusu", southwest: "iwọ-orun guusu", west: "iwọ-orun", northwest: "iwọ-orun ariwa"
  },
  "3": { // Hausa
    north: "arewa", northeast: "gabas ku arewa", east: "gabas", southeast: "gabas ku kudu",
    south: "kudu", southwest: "yamma ku kudu", west: "yamma", northwest: "yamma ku arewa"
  },
  "4": { // Igbo
    north: "ugwu", northeast: "ugwu-ọwụwa", east: "ọwụwa-anyanwụ", southeast: "ndịda-ọwụwa",
    south: "ndịda", southwest: "ndịda-anyanwụ", west: "ọdịda-anyanwụ", northwest: "ugwu-ọdịda"
  },
  "5": { // French
    north: "nord", northeast: "nord-est", east: "est", southeast: "sud-est",
    south: "sud", southwest: "sud-ouest", west: "ouest", northwest: "nord-ouest"
  }
};

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

async function findZoneInfo(zoneName: string, langCode: string): Promise<string> {
  const lang = languages[langCode] || languages["1"]!;
  
  // Try to find POIs matching the zone query
  const result = await query<PoiRow>(
    `SELECT * FROM pois WHERE name ILIKE $1 OR metadata->>'zone' ILIKE $1 LIMIT 5`,
    [`%${zoneName}%`]
  );

  if (result.rows.length === 0) {
    return lang.zoneNoFacilities(zoneName);
  }

  const lines = result.rows.map((r, i) => {
    const key = typeToKeyMap[r.type];
    const categoryName = key ? lang.facilities[key] : r.type;
    return `${i + 1}. ${r.name} (${categoryName})`;
  });

  return `${lang.zoneFacilitiesTitle(zoneName)}\n${lines.join("\n")}`;
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

  // ── Level 0: Language Selection ──────────────────────────────────
  if (depth === 0) {
    return [
      "CON Welcome to CampNav",
      "Redemption City Navigation",
      "",
      "Select Language / Yan Ede:",
      "1. English",
      "2. Yoruba",
      "3. Hausa",
      "4. Igbo",
      "5. French"
    ].join("\n");
  }

  const langCode = parts[0]!;
  const lang = languages[langCode];
  const bearingDict = bearingTranslations[langCode] || bearingTranslations["1"]!;

  if (!lang) {
    return "END Invalid language selection. Please dial again to restart.";
  }

  // ── Level 1: Main Welcome Menu (Translatable) ──────────────────────
  if (depth === 1) {
    return "CON " + lang.welcome;
  }

  const choice = parts[1]!;

  // ── Branch 1: Find facility ───────────────────────────────────────
  if (choice === "1") {
    if (depth === 2) {
      return [
        "CON " + lang.facilityTitle,
        `1. ${lang.facilities["1"]}`,
        `2. ${lang.facilities["2"]}`,
        `3. ${lang.facilities["3"]}`,
        `4. ${lang.facilities["4"]}`,
        `5. ${lang.facilities["5"]}`,
        `6. ${lang.facilities["6"]}`
      ].join("\n");
    }

    const typeChoice = parts[2]!;
    const facilityType = facilityTypeMap[typeChoice];

    if (!facilityType) {
      return "END " + lang.invalidSelect;
    }

    if (depth === 3) {
      // Show nearest 3 of this type
      const pois = await findNearestByType(facilityType);
      if (pois.length === 0) {
        return "END " + lang.noFacilities;
      }

      const lines = pois.map((p, i) => `${i + 1}. ${p.name}`);
      return `CON ${lang.facilities[typeChoice] ?? "Facilities"}:\n${lines.join("\n")}\n\nReply with number for directions`;
    }

    if (depth === 4) {
      // Show directions to selected facility
      const pois = await findNearestByType(facilityType);
      const selectedIdx = parseInt(parts[3]!, 10) - 1;
      const selected = pois[selectedIdx];

      if (!selected) {
        return "END " + lang.invalidType;
      }

      // Generate simple text directions
      const bearing = calculateSimpleBearing(CAMP_CENTER.lat, CAMP_CENTER.lng, selected.lat, selected.lng);
      const translatedBearing = bearingDict[bearing] || bearing;
      const dist = Math.round(haversine(CAMP_CENTER.lat, CAMP_CENTER.lng, selected.lat, selected.lng));

      return [
        `END ${lang.directionsTitle(selected.name)}`,
        "",
        lang.directionsText(translatedBearing, dist, selected.description ?? selected.name),
        "",
        lang.thankYou
      ].join("\n");
    }
  }

  // ── Branch 2: Find zone ───────────────────────────────────────────
  if (choice === "2") {
    if (depth === 2) {
      return "CON " + lang.findZonePrompt;
    }

    if (depth === 3) {
      const zoneName = parts[2]!;
      const info = await findZoneInfo(zoneName, langCode);
      return `END ${info}\n\n${lang.thankYou}`;
    }
  }

  // ── Branch 3: Lost person report ──────────────────────────────────
  if (choice === "3") {
    if (depth === 2) {
      return "CON " + lang.lostPersonPrompt;
    }

    if (depth === 3) {
      const description = parts[2]!;

      try {
        await lostPersonsService.createReport({
          description,
          reporterPhone: phoneNumber,
          source: "ussd"
        });

        return "END " + lang.lostPersonSuccess;
      } catch {
        return "END Error. Please try again.";
      }
    }
  }

  // ── Branch 4: Emergency contacts ──────────────────────────────────
  if (choice === "4") {
    return [
      "END " + lang.emergencyTitle,
      "",
      lang.emergencyList,
      "",
      lang.thankYou
    ].join("\n");
  }

  // ── Fallback ──────────────────────────────────────────────────────
  return "END " + lang.invalidSelect;
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
