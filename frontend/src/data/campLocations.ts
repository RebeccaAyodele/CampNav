export type CampLocationCategory =
  | "parking"
  | "religion"
  | "commerce"
  | "residential"
  | "accommodation"
  | "finance"
  | "recreation"
  | "education"
  | "medical"
  | "services";

export type CampFeature = {
  type: "Feature";
  properties: {
    id: string;
    name: string;
    category: CampLocationCategory;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
};

export type CampGeoJSON = {
  type: "FeatureCollection";
  features: CampFeature[];
};
export type CampLocationProperties = {
  id: string;
  name: string;
  category: CampLocationCategory;
  zone: string | null;
  photos: string[];
};

export const campLocations: FeatureCollection<Point, CampLocationProperties> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "car-park-c",
        name: "Car Park C",
        category: "parking",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.4458445699432794, 6.812765326638857],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "open-heavens-international-center",
        name: "Open Heavens International Center",
        category: "religion",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.459705166137569, 6.817594186460105],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "canaan-land-market",
        name: "Canaan Land Market",
        category: "commerce",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.4612252169896496, 6.807744307189657],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "goshen-estate",
        name: "Goshen Estate",
        category: "residential",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.465285464389556, 6.8060964407871625],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "moses-apartment",
        name: "Moses Apartment",
        category: "accommodation",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.457848352011737, 6.80320253655722],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "grace-court",
        name: "Grace Court",
        category: "residential",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.4593685463985286, 6.802917594533101],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "car-park-v-rccg-new-auditorium",
        name: "Car Park V (RCCG New Auditorium)",
        category: "parking",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.4595101559141233, 6.762803493349184],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "simawa-car-park-rccg-new-auditorium",
        name: "Simawa Car Park (RCCG New Auditorium)",
        category: "parking",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.4698696171951724, 6.760634401941198],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "goshen-estate-rccg-redemption-camp",
        name: "Goshen Estate RCCG Redemption Camp",
        category: "residential",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.4653803664399576, 6.806379852280444],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "canaan-land-market-2",
        name: "Canaan Land Market",
        category: "commerce",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.4633612824679343, 6.807849941780195],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "moses-apartment-2",
        name: "Moses Apartment",
        category: "accommodation",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.4599478162053137, 6.803363550702331],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "white-house-suites",
        name: "White House Suites",
        category: "accommodation",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.4564573203930773, 6.804454310371058],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "gt-bank-rccg-camp",
        name: "GT Bank RCCG Camp",
        category: "finance",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.4566078169927144, 6.808470536789531],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "emmanuel-park",
        name: "Emmanuel Park",
        category: "recreation",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.452920463310591, 6.810676368964239],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "redeemed-christian-bible-college-main-campus",
        name: "Redeemed Christian Bible College Main Campus",
        category: "education",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.4613514021763936, 6.810377388671388],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "rccg-national-teenagers-church",
        name: "RCCG National Teenagers Church",
        category: "religion",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.455998334475326, 6.812561538527837],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "redeemers-health-center",
        name: "Redeemer's Health Center",
        category: "medical",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.455998334475326, 6.812561538527837],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "mechanic-workshop",
        name: "Mechanic Workshop",
        category: "services",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.451347864704779, 6.812238752256261],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "kindness-hostel",
        name: "Kindness Hostel",
        category: "accommodation",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.454229334816421, 6.8114167351957455],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "rccg-national-teens-hostel",
        name: "RCCG National Teens Hostel",
        category: "accommodation",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.4550537922119373, 6.813397763703372],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "rccg-health-center",
        name: "RCCG Health Center",
        category: "medical",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.4536505579854313, 6.816092014853165],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "open-heavens-international-center-2",
        name: "Open Heavens International Center",
        category: "religion",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.4594926219173994, 6.817101462168471],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "access-bank-rccg-camp-branch",
        name: "Access Bank RCCG Camp Branch",
        category: "finance",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.4571658195135613, 6.8173147254072335],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "crm-supermarket",
        name: "CRM SuperMarket",
        category: "commerce",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.4574157298623502, 6.8189415329630485],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "nigeria-police-force-redeem-division",
        name: "Nigeria Police Force Redeem Division",
        category: "services",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.4549027831941004, 6.817391823226286],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "bethel-suites-and-event-center",
        name: "Bethel Suites and Event Center",
        category: "accommodation",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.4568393987736292, 6.819421373344777],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "rccg-post-office",
        name: "RCCG Post Office",
        category: "services",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.457064919628427, 6.819702168565442],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "conoil-filling-station",
        name: "Conoil Filling Station",
        category: "finance",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.457140093244551, 6.820448585434686],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "rccg-city-kitchen",
        name: "RCCG City Kitchen",
        category: "commerce",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.4584001462677207, 6.818625193582429],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "rccg-maternity-center",
        name: "RCCG Maternity Center",
        category: "medical",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.4585325950199395, 6.818006731619723],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "halleluyah-house",
        name: "Halleluyah House",
        category: "religion",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.4574622659222065, 6.81845102909031],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "pastors-quarter",
        name: "Pastor's Quarter",
        category: "residential",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.459076708820869, 6.819833680174045],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "rccg-accommodation",
        name: "RCCG Accommodation",
        category: "accommodation",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.4595080622242076, 6.820144687266564],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "sherpherds-place-apartment",
        name: "Sherpherd's Place Apartment",
        category: "accommodation",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.4613253358554363, 6.815534146207206],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "senior-pastors-lodge",
        name: "Senior Pastors Lodge",
        category: "accommodation",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.464856457484671, 6.818564271774535],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "jordan-executives-chalet",
        name: "Jordan Executives Chalet",
        category: "accommodation",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.4658429587863395, 6.817319267818701],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "peaceville-school",
        name: "Peaceville School",
        category: "education",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.458753056865244, 6.814362370420367],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "redeemers-university-staff-quarters",
        name: "Redeemers University Staff Quarters",
        category: "residential",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.4594998475251977, 6.812879337611229],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "comfort-palace",
        name: "Comfort Palace",
        category: "accommodation",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.4648836267534846, 6.813353730733453],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "wave-of-glory-apartments",
        name: "Wave of Glory Apartments",
        category: "accommodation",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.459479850501037, 6.805172065803732],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "gethsemane-apartment",
        name: "Gethsemane Apartment",
        category: "accommodation",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.456578749856703, 6.807072946907459],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "glory-arena",
        name: "Glory Arena",
        category: "religion",
        zone: null,
        photos: [],
      },
      geometry: {
        type: "Point",
        coordinates: [3.4569957636911517, 6.8101444381302425],
      },
    },
  ],
};
