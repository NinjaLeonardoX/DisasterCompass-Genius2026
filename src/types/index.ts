// Disaster Compass domain types.
// All data is in-memory and typed — no backend, DB, or live APIs.

export type DisasterType = "flood" | "earthquake" | "wildfire" | "hurricane" | "heat";

export type ActionType = "GO" | "STAY" | "WAIT";

/** A single household profile used to drive the decision/matching engines. */
export interface Household {
  id: string;
  name: string;
  people: number;
  elderly: number;
  toddlers: number;
  pets: number;
  hasCar: boolean;
  medicalNeeds: boolean;
  accessibilityNeeds: boolean;
  powerDependentMedicalDevice: boolean;
  hasCooling: boolean;
  locationName: string;
  lat: number;
  lng: number;
}

export type ShelterType = "community-center" | "school" | "sports-complex";

export interface Shelter {
  id: string;
  name: string;
  type: ShelterType;
  lat: number;
  lng: number;
  /** Relative elevation in feet — higher is safer for flood routing. */
  elevation: number;
  capacity: number;
  availableCapacity: number;
  petsAllowed: boolean;
  accessible: boolean;
  medicalSupport: boolean;
  coolingCenter: boolean;
}

export type RouteColorType = "safe" | "caution" | "rejected";

export interface RouteOption {
  id: string;
  name: string;
  colorType: RouteColorType;
  destinationId: string;
  distanceMiles: number;
  estimatedMinutes: number;
  /** 0 (none) – 1 (fully exposed) flood exposure along the route. */
  floodExposure: number;
  usesBridge: boolean;
  blockedRoad: boolean;
  /** Net elevation gain in feet toward higher ground (positive is safer). */
  elevationGain: number;
  /** How well the destination shelter fits the household (0–1). */
  shelterFit: number;
  /** Whether the route + destination is accessibility-friendly. */
  accessibility: boolean;
  /** [lat, lng] pairs for drawing the polyline. */
  coordinates: [number, number][];
  /**
   * Street name driven along each segment (streets[i] is the road between
   * coordinates[i] and coordinates[i+1]). Powers turn-by-turn navigation cues.
   */
  streets?: string[];
  notes: string;
}

export interface BlockedRoad {
  id: string;
  name: string;
  reason: string;
  coordinates: [number, number][];
}

export type VolunteerStatus =
  | "Awaiting coordinator approval"
  | "En Route"
  | "Unavailable"
  | "Available later";

export interface Volunteer {
  id: string;
  name: string;
  vehicle: "car" | "van" | "truck";
  seats: number;
  distanceMiles: number;
  available: boolean;
  canTransportPets: boolean;
  canSupportAccessibility: boolean;
  lat: number;
  lng: number;
  status: VolunteerStatus;
}

export type CoordinatorStatus =
  | "Needs Transport"
  | "En Route"
  | "Safe"
  | "Unaccounted"
  | "Sheltering"
  | "Needs Medicine";

export interface CoordinatorHousehold {
  id: string;
  name: string;
  status: CoordinatorStatus;
  note: string;
}

export type RecoveryCategory = "safety" | "documentation" | "assistance" | "wellbeing";

export interface RecoveryItem {
  id: string;
  label: string;
  category: RecoveryCategory;
  completed: boolean;
}

// ---- Engine result shapes ----

export type DestinationType =
  | "high-ground shelter"
  | "cooling center"
  | "evacuation shelter"
  | "open assembly point"
  | "shelter-in-place"
  | "none";

export interface ActionDecision {
  actionType: ActionType;
  actionLabel: string;
  destinationType: DestinationType;
  primaryInstruction: string;
  steps: string[];
  why: string;
  safetyNote: string;
  needsTransport: boolean;
  shouldShowRoute: boolean;
}

export interface ScoreBreakdownItem {
  label: string;
  value: number;
  explanation: string;
}

export interface RouteScore {
  score: number;
  breakdown: ScoreBreakdownItem[];
  rejectedReasons: string[];
}

export interface VolunteerMatch {
  bestVolunteer: Volunteer | null;
  matchScore: number;
  matchReasons: string[];
}
