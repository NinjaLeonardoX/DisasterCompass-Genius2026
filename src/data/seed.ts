import type {
  BlockedRoad,
  CoordinatorHousehold,
  DisasterType,
  Household,
  RouteOption,
  Shelter,
  Volunteer,
} from "@/types";

// In-memory seed data for the fictional town of North Creek. Coordinates are
// clustered tightly so the Leaflet map frames the whole scenario nicely. None
// of this is real — no live APIs, no database.

export const MAP_CENTER: [number, number] = [40.027, -105.263];
export const MAP_ZOOM = 14;

/** The primary household followed through the golden-path demo. */
export const RIVERA_HOUSEHOLD: Household = {
  id: "hh-rivera",
  name: "Rivera Family",
  people: 5,
  elderly: 1,
  toddlers: 1,
  pets: 1,
  hasCar: false,
  medicalNeeds: true,
  accessibilityNeeds: true,
  powerDependentMedicalDevice: false,
  hasCooling: true,
  locationName: "North Creek",
  lat: 40.024,
  lng: -105.272,
};

export const SHELTERS: Shelter[] = [
  {
    id: "shelter-hilltop",
    name: "Hilltop Community Center",
    type: "community-center",
    lat: 40.0335,
    lng: -105.2585,
    elevation: 240,
    capacity: 200,
    availableCapacity: 65,
    petsAllowed: true,
    accessible: true,
    medicalSupport: false,
    coolingCenter: true,
  },
  {
    id: "shelter-eastside",
    name: "Eastside Middle School Shelter",
    type: "school",
    lat: 40.0265,
    lng: -105.254,
    elevation: 160,
    capacity: 150,
    availableCapacity: 30,
    petsAllowed: false,
    accessible: true,
    medicalSupport: false,
    coolingCenter: true,
  },
  {
    id: "shelter-valley",
    name: "Valley Sports Complex",
    type: "sports-complex",
    lat: 40.0175,
    lng: -105.266,
    elevation: 95,
    capacity: 300,
    availableCapacity: 120,
    petsAllowed: true,
    accessible: false,
    medicalSupport: false,
    coolingCenter: false,
  },
];

/** Semi-transparent flood area over the low-lying ground around the Rivera home. */
export const FLOOD_POLYGON: [number, number][] = [
  [40.0205, -105.2755],
  [40.0205, -105.2655],
  [40.0265, -105.2645],
  [40.029, -105.27],
  [40.0265, -105.2765],
];

export const BLOCKED_ROADS: BlockedRoad[] = [
  {
    id: "blocked-river-road",
    name: "River Road bridge",
    reason: "Flooded",
    coordinates: [
      [40.025, -105.2705],
      [40.025, -105.2668],
    ],
  },
  {
    id: "blocked-bridge-street",
    name: "Bridge Street underpass",
    reason: "Blocked",
    coordinates: [
      [40.0232, -105.2692],
      [40.0212, -105.268],
    ],
  },
  {
    id: "blocked-old-mill",
    name: "Old Mill crossing",
    reason: "Unsafe",
    coordinates: [
      [40.027, -105.2712],
      [40.0282, -105.2694],
    ],
  },
];

const HILLTOP_ID = "shelter-hilltop";

// Three routes from the Rivera home to Hilltop Community Center.
// Calibrated (see src/lib/scoring.ts) to score ≈ 48 / 91 / 70.
export const ROUTES: RouteOption[] = [
  {
    id: "route-a",
    name: "River Road Shortcut",
    colorType: "rejected",
    destinationId: HILLTOP_ID,
    distanceMiles: 1.0,
    estimatedMinutes: 5,
    floodExposure: 0.4,
    usesBridge: true,
    blockedRoad: true,
    elevationGain: 12,
    shelterFit: 1.0,
    accessibility: false,
    coordinates: [
      [40.024, -105.272],
      [40.025, -105.2685],
      [40.03, -105.262],
      [40.0335, -105.2585],
    ],
    notes:
      "Shortest on paper, but it crosses the flooded River Road bridge and a blocked road. Rejected.",
  },
  {
    id: "route-b",
    name: "Hilltop Avenue Route",
    colorType: "safe",
    destinationId: HILLTOP_ID,
    distanceMiles: 3.0,
    estimatedMinutes: 35,
    floodExposure: 0,
    usesBridge: false,
    blockedRoad: false,
    elevationGain: 16,
    shelterFit: 1.0,
    accessibility: true,
    coordinates: [
      [40.024, -105.272],
      [40.029, -105.274],
      [40.034, -105.268],
      [40.0355, -105.261],
      [40.0335, -105.2585],
    ],
    notes:
      "Avoids the river and all blocked roads. Longer and uphill (slower), but accessible and reaches high ground safely. Recommended.",
  },
  {
    id: "route-c",
    name: "East Ridge Detour",
    colorType: "caution",
    destinationId: HILLTOP_ID,
    distanceMiles: 3.6,
    estimatedMinutes: 27,
    floodExposure: 0.38,
    usesBridge: false,
    blockedRoad: false,
    elevationGain: 16,
    shelterFit: 1.0,
    accessibility: false,
    coordinates: [
      [40.024, -105.272],
      [40.02, -105.268],
      [40.023, -105.256],
      [40.03, -105.256],
      [40.0335, -105.2585],
    ],
    notes:
      "Skirts the edge of the flood zone. Passable with caution, but a longer detour and not accessibility-rated.",
  },
];

export const VOLUNTEERS: Volunteer[] = [
  {
    id: "vol-ana",
    name: "Ana",
    vehicle: "truck",
    seats: 4,
    distanceMiles: 1.2,
    available: true,
    canTransportPets: true,
    canSupportAccessibility: true,
    lat: 40.026,
    lng: -105.27,
    status: "Awaiting coordinator approval",
  },
  {
    id: "vol-ben",
    name: "Ben",
    vehicle: "car",
    seats: 2,
    distanceMiles: 0.8,
    available: false,
    canTransportPets: false,
    canSupportAccessibility: false,
    lat: 40.022,
    lng: -105.271,
    status: "Available later",
  },
  {
    id: "vol-chris",
    name: "Chris",
    vehicle: "van",
    seats: 6,
    distanceMiles: 3.6,
    available: false,
    canTransportPets: true,
    canSupportAccessibility: true,
    lat: 40.01,
    lng: -105.26,
    status: "Unavailable",
  },
];

export const COORDINATOR_HOUSEHOLDS: CoordinatorHousehold[] = [
  {
    id: "hh-rivera",
    name: "Rivera Family",
    status: "Needs Transport",
    note: "No vehicle, accessibility + pet needs. Awaiting volunteer.",
  },
  {
    id: "hh-chen",
    name: "Chen",
    status: "Safe",
    note: "Sheltering with relatives on high ground.",
  },
  {
    id: "hh-miller",
    name: "Miller",
    status: "Unaccounted",
    note: "No contact since alert. Follow up.",
  },
  { id: "hh-johnson", name: "Johnson", status: "Sheltering", note: "At Hilltop Community Center." },
  { id: "hh-patel", name: "Patel", status: "Needs Medicine", note: "Insulin resupply requested." },
];

/** Maps the existing demo-scenario picker labels to a typed disaster. */
export const SCENARIO_TO_DISASTER: Record<string, DisasterType> = {
  "Flood Neighborhood": "flood",
  "Heat Wave Senior Community": "heat",
  "Wildfire Evacuation": "wildfire",
  "Hurricane Coastal Town": "hurricane",
  "Earthquake School Campus": "earthquake",
};

export const DISASTER_LABELS: Record<DisasterType, string> = {
  flood: "Flood",
  earthquake: "Earthquake",
  wildfire: "Wildfire",
  hurricane: "Hurricane",
  heat: "Extreme Heat",
};
