import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useLocation } from "../LocationContext";
import { usePhase } from "../PhaseContext";
import { forwardGeocode, reverseGeocode, inferLocationType, type GeocodeResult, type PlaceSuggestion } from "@/lib/geocoding";
import { HAZARD_RISKS, HAZARD_ROUTES, SEVERITY_META, type HazardRisk } from "@/data/prepare";
import { generateCompassPlan } from "@/lib/compass-plan.functions";
import { lookupPlaceDetails } from "@/lib/place-lookup.functions";
import { PlaceAutocomplete } from "./PlaceAutocomplete";
import { loadStoredLocations, saveStoredLocations } from "@/lib/preparedLocations";

const PrepareRiskMap = lazy(() => import("./PrepareRiskMap"));
import { RouteTrainingPanel } from "./RouteTrainingPanel";
import {
  MapPin,
  LocateFixed,
  Loader2,
  Pencil,
  Printer,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  Waves,
  Flame,
  Wind,
  Thermometer,
  Activity,
  Snowflake,
  X,
  Check,
  XCircle,
  SkipForward,
  Sparkles,
  Users,
  UserRound,
  Baby,
  PawPrint,
  Car,
  Stethoscope,
  Accessibility,
} from "lucide-react";

/**
 * Saved Safety Location flow — fast 9-step readiness onboarding wizard.
 *
 * Steps:
 *   0 Base profile · 1 Flood · 2 Earthquake · 3 Extreme Heat
 *   4 Hurricane · 5 Wildfire · 6 Winter Storm · 7 Review · 8 Generate plan
 *
 * Each hazard section supports: Yes to All · No to All · Skip This Section.
 * Skipped sections do not count toward the readiness percentage but are
 * flagged on the review screen and the printable guide.
 */

type Disaster = "flood" | "earthquake" | "heat" | "hurricane" | "wildfire" | "winter";

type SectionId = "base" | Disaster;

type Answer = "yes" | "no" | null;

export type QuestionCategory = "know" | "equip" | "mental";

export const CATEGORY_META: Record<QuestionCategory, { label: string; blurb: string }> = {
  know: { label: "Do you know", blurb: "Knowledge of routes, destinations, and avoid zones." },
  equip: { label: "Physical & Equipment", blurb: "Gear, supplies, and items packed and ready." },
  mental: { label: "Mental Preparedness", blurb: "Practice, calm, and family communication." },
};

interface Question {
  key: string;
  q: string;
  /** Optional human-readable gap label when answered "no". */
  gap?: string;
  /** Which sub-category this question belongs to (hazard sections only). */
  category?: QuestionCategory;
}

interface Section {
  id: SectionId;
  title: string;
  questions: Question[];
}

interface RoutePlan {
  disaster: Disaster;
  label: string;
  firstAction: string;
  destination: string;
  safeRoute: string;
  avoid: string;
  why: string;
}

type SectionAnswers = Record<string, Answer>;
type AllAnswers = Record<SectionId, SectionAnswers>;
type SkipMap = Record<SectionId, boolean>;

interface SavedLocation {
  id: string;
  name: string;
  type: string;
  area: string;
  ready: boolean;
  /** Geocoded coordinates so picking this location drives the rest of the app. */
  geo?: GeocodeResult;
  preloaded?: boolean;
  answers: AllAnswers;
  skipped: SkipMap;
  routes: RoutePlan[];
  readinessScore: number;
  hazardScores: Record<Disaster, number | null>; // null = not assessed
  gaps: string[];
}

const DISASTERS: { id: Disaster; label: string; Icon: typeof Waves }[] = [
  { id: "flood", label: "Flood", Icon: Waves },
  { id: "earthquake", label: "Earthquake", Icon: Activity },
  { id: "heat", label: "Extreme Heat", Icon: Thermometer },
  { id: "hurricane", label: "Hurricane", Icon: Wind },
  { id: "wildfire", label: "Wildfire", Icon: Flame },
  { id: "winter", label: "Winter Storm", Icon: Snowflake },
];

// ─────────────────────────────────────────────────────────────────────────────
// Checklists
// ─────────────────────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    id: "base",
    title: "Base Profile",
    questions: [
      { key: "people", q: "Are people regularly present at this location?" },
      { key: "elderly", q: "Are elderly people regularly present?" },
      { key: "children", q: "Are toddlers or children regularly present?" },
      { key: "pets", q: "Are pets usually present?" },
      { key: "medical", q: "Are there medical needs or medications to plan for?" },
      { key: "vehicle", q: "Is a vehicle available?", gap: "No vehicle available" },
      { key: "contacts", q: "Are emergency contacts printed?", gap: "Emergency contacts not printed" },
      { key: "goBag", q: "Is a go-bag ready?", gap: "Go-bag not ready" },
      { key: "drill", q: "Has the family/group practiced the safety plan?", gap: "Safety plan not drilled" },
    ],
  },
  {
    id: "flood",
    title: "Flood Readiness",
    questions: [
      // Do you know (3)
      { category: "know", key: "higher", q: "Do you know your nearest higher-ground location?", gap: "Higher-ground destination not confirmed" },
      { category: "know", key: "avoid", q: "Do you know which roads, bridges, or underpasses to avoid?", gap: "Flood-avoid roads not mapped" },
      { category: "know", key: "blocked", q: "Do you know what to do if water blocks your route?", gap: "No backup plan if route is blocked" },
      // Physical & Equipment (3)
      { category: "equip", key: "bag", q: "Is a go-bag packed and ready to leave quickly?", gap: "Go-bag not ready" },
      { category: "equip", key: "flashlight", q: "Do you have a waterproof flashlight and spare batteries?", gap: "Flashlight/batteries not ready" },
      { category: "equip", key: "supplies", q: "Do you have 3 days of drinking water and food on hand?", gap: "3-day water/food supply missing" },
      // Mental Preparedness (2)
      { category: "mental", key: "drill", q: "Has everyone walked through the flood route together?", gap: "Flood route not rehearsed" },
      { category: "mental", key: "meetup", q: "Is there an agreed family meet-up point if you get separated?", gap: "Family meet-up point not set" },
    ],
  },
  {
    id: "earthquake",
    title: "Earthquake Readiness",
    questions: [
      // Know
      { category: "know", key: "drop", q: "Do you know to Drop, Cover, and Hold On the moment shaking starts?", gap: "Drop/Cover/Hold not learned" },
      { category: "know", key: "indoor", q: "Do you know where to shelter indoors (away from windows / heavy items)?", gap: "Indoor shelter spot not chosen" },
      { category: "know", key: "assembly", q: "Do you know the outdoor assembly point once shaking stops?", gap: "Assembly area not confirmed" },
      // Equip
      { category: "equip", key: "bag", q: "Is the go-bag stored where you can reach it after shaking?", gap: "Go-bag not accessible" },
      { category: "equip", key: "shoes", q: "Are sturdy shoes and a flashlight kept beside each bed?", gap: "Shoes/flashlight by bed missing" },
      { category: "equip", key: "supplies", q: "Do you have one week of water and non-perishable food?", gap: "1-week water/food supply missing" },
      // Mental
      { category: "mental", key: "drill", q: "Has the household rehearsed the plan in the last 6 months?", gap: "Earthquake drill not practiced" },
      { category: "mental", key: "contact", q: "Is an out-of-area contact agreed for check-ins after shaking?", gap: "Out-of-area contact not set" },
    ],
  },
  {
    id: "heat",
    title: "Extreme Heat Readiness",
    questions: [
      // Know
      { category: "know", key: "cooling", q: "Do you know your nearest cooling center?", gap: "Cooling center not confirmed" },
      { category: "know", key: "risk", q: "Have you identified elderly, children, or medical-risk people in the household?", gap: "Heat-risk people not identified" },
      { category: "know", key: "signs", q: "Can you recognize heat-exhaustion warning signs?", gap: "Heat-exhaustion signs unknown" },
      // Equip
      { category: "equip", key: "water", q: "Do you have at least 3 days of drinking water on hand?", gap: "Drinking water supply missing" },
      { category: "equip", key: "backup", q: "Do you have battery fans, cool packs, or wet towels as backup cooling?", gap: "Backup cooling kit missing" },
      { category: "equip", key: "charging", q: "Do you have a charging plan for phones and medical devices?", gap: "Charging plan missing" },
      // Mental
      { category: "mental", key: "buddy", q: "Is there a twice-a-day check-in with at-risk household members?", gap: "Heat buddy check-in not set" },
      { category: "mental", key: "pacing", q: "Have you planned to avoid outdoor activity between 11am and 4pm?", gap: "Midday pacing plan missing" },
    ],
  },
  {
    id: "hurricane",
    title: "Hurricane Readiness",
    questions: [
      // Know
      { category: "know", key: "route", q: "Do you know your evacuation or shelter route?", gap: "Shelter route not confirmed" },
      { category: "know", key: "stay", q: "Do you know where to shelter if you stay (interior, no windows)?", gap: "Stay-in-place shelter not chosen" },
      { category: "know", key: "deadline", q: "Do you know the evacuation deadline and where to get official updates?", gap: "Evacuation deadline / channels unknown" },
      // Equip
      { category: "equip", key: "bag", q: "Is a multi-day go-bag ready (clothes, meds, documents)?", gap: "Multi-day go-bag not ready" },
      { category: "equip", key: "supplies", q: "Do you have 3+ days of food, water, batteries, and medications?", gap: "3-day supplies missing" },
      { category: "equip", key: "windows", q: "Are windows protected, or is an interior safe room prepared?", gap: "Window/safe-room prep missing" },
      // Mental
      { category: "mental", key: "contact", q: "Is there a contact plan if the household is separated?", gap: "Contact plan missing" },
      { category: "mental", key: "drill", q: "Has the household walked through the hurricane plan together?", gap: "Hurricane plan not rehearsed" },
    ],
  },
  {
    id: "wildfire",
    title: "Wildfire Readiness",
    questions: [
      // Know
      { category: "know", key: "primary", q: "Do you know your primary exit route?", gap: "Primary exit not confirmed" },
      { category: "know", key: "backup", q: "Do you know your backup exit route?", gap: "Backup route not confirmed" },
      { category: "know", key: "wind", q: "Do you know what direction to avoid if fire or smoke spreads?", gap: "Smoke-avoid direction unclear" },
      // Equip
      { category: "equip", key: "bag", q: "Is a go-bag ready (including pets, medications, and documents)?", gap: "Go-bag not ready" },
      { category: "equip", key: "masks", q: "Do you have N95 (or equivalent) masks for smoke?", gap: "Smoke masks missing" },
      { category: "equip", key: "defensible", q: "Is the yard cleared of dry brush and debris near the structure?", gap: "Defensible space not cleared" },
      // Mental
      { category: "mental", key: "drill", q: "Have you practiced evacuating in under 10 minutes?", gap: "Quick-evacuation drill not done" },
      { category: "mental", key: "contact", q: "Is an out-of-area contact and meet point agreed?", gap: "Out-of-area contact missing" },
    ],
  },
  {
    id: "winter",
    title: "Winter Storm Readiness",
    questions: [
      // Know
      { category: "know", key: "warming", q: "Do you know your nearest warming center?", gap: "Warming center not confirmed" },
      { category: "know", key: "roads", q: "Do you know which icy roads, bridges, or steep routes to avoid?", gap: "Winter-safe route not confirmed" },
      { category: "know", key: "signs", q: "Can you recognize hypothermia and frostbite warning signs?", gap: "Hypothermia/frostbite signs unknown" },
      // Equip
      { category: "equip", key: "heat", q: "Do you have a backup heat plan if power fails?", gap: "Backup heat plan missing" },
      { category: "equip", key: "supplies", q: "Do you have multi-day food, water, and medications?", gap: "Multi-day supplies missing" },
      { category: "equip", key: "light", q: "Do you have flashlights, a lantern, and spare batteries?", gap: "Flashlights/batteries missing" },
      // Mental
      { category: "mental", key: "drill", q: "Does the household know how to layer clothing and stay warm together?", gap: "Warmth plan not rehearsed" },
      { category: "mental", key: "check", q: "Is there a plan to check on neighbors and at-risk household members?", gap: "Neighbor check-in plan missing" },
    ],
  },
];

const HAZARD_SECTION_IDS: Disaster[] = ["flood", "earthquake", "heat", "hurricane", "wildfire", "winter"];

function allYesAnswers(): AllAnswers {
  const out = {} as AllAnswers;
  for (const s of SECTIONS) {
    out[s.id] = {};
    for (const q of s.questions) out[s.id][q.key] = "yes";
  }
  return out;
}

function blankAnswers(): AllAnswers {
  const out = {} as AllAnswers;
  for (const s of SECTIONS) {
    out[s.id] = {};
    for (const q of s.questions) out[s.id][q.key] = null;
  }
  return out;
}

function blankSkipped(): SkipMap {
  return {
    base: false, flood: false, earthquake: false, heat: false,
    hurricane: false, wildfire: false, winter: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Seeded Boston-area locations
// ─────────────────────────────────────────────────────────────────────────────

function buildRoutes(opts: {
  flood: string;
  floodRoute: string;
  quakeMuster: string;
  quakeRoute: string;
  cooling: string;
  coolingRoute: string;
  hurricane: string;
  hurricaneRoute: string;
  wildfireExit: string;
  wildfireRoute: string;
  warming: string;
  winterRoute: string;
}): RoutePlan[] {
  return [
    {
      disaster: "flood",
      label: "Flood",
      firstAction: "Move to higher ground immediately",
      destination: opts.flood,
      safeRoute: opts.floodRoute,
      avoid: "Charles River esplanade, Storrow Dr underpasses, Back Bay low blocks",
      why: "Upper floors above the local floodplain; the safe route avoids river-adjacent low roads.",
    },
    {
      disaster: "earthquake",
      label: "Earthquake",
      firstAction: "Drop, Cover, Hold On — then go to outdoor assembly",
      destination: opts.quakeMuster,
      safeRoute: opts.quakeRoute,
      avoid: "Brick facades, glass atriums, parking structures, overhead signage",
      why: "Open ground clear of falling debris; pre-designated muster point.",
    },
    {
      disaster: "heat",
      label: "Extreme Heat",
      firstAction: "Move indoors to a cooled common area; hydrate",
      destination: opts.cooling,
      safeRoute: opts.coolingRoute,
      avoid: "Asphalt lots, athletic fields, direct sun between 11am–4pm",
      why: "Always-cooled common space with charging stations and water access.",
    },
    {
      disaster: "hurricane",
      label: "Hurricane",
      firstAction: "Shelter in place in an interior ground-floor room",
      destination: opts.hurricane,
      safeRoute: opts.hurricaneRoute,
      avoid: "Coastal blocks, windowed lounges, tree-lined paths, Storrow/Memorial Dr",
      why: "Reinforced interior space rated for high-wind shelter.",
    },
    {
      disaster: "wildfire",
      label: "Wildfire / Smoke",
      firstAction: "Move indoors with HVAC on recirculate; check AQI alerts",
      destination: opts.wildfireExit,
      safeRoute: opts.wildfireRoute,
      avoid: "Outdoor exertion, open windows, idle traffic in tunnels",
      why: "Indoor refuge with filtered air; backup is an inland evacuation route.",
    },
    {
      disaster: "winter",
      label: "Winter Storm",
      firstAction: "Walk indoors via covered paths to the warming center",
      destination: opts.warming,
      safeRoute: opts.winterRoute,
      avoid: "Icy bridges, unplowed side streets, exposed waterfront walkways",
      why: "Warming center keeps power and heat; covered route avoids icy exposure.",
    },
  ];
}

const MIT_ROUTES = buildRoutes({
  flood: "Stata Center (Bldg 32) upper floors — on-campus high ground",
  floodRoute: "Mass Ave → Vassar St → Stata Center entrance",
  quakeMuster: "Kresge Oval — open outdoor assembly area",
  quakeRoute: "Exit nearest building → Killian Court → Kresge Oval",
  cooling: "Stratton Student Center (W20) — air-conditioned commons",
  coolingRoute: "Shaded walk via Infinite Corridor → Student Center",
  hurricane: "Building 7 interior corridors — reinforced shelter",
  hurricaneRoute: "Infinite Corridor → Lobby 7 interior rooms",
  wildfireExit: "MIT Medical (E23) indoor refuge — filtered HVAC",
  wildfireRoute: "Mass Ave → Main St → MIT Medical entrance",
  warming: "Stratton Student Center warming commons",
  winterRoute: "Infinite Corridor (indoor) → W20 commons",
});

const BU_ROUTES = buildRoutes({
  flood: "Mugar Memorial Library upper floors — on-campus high ground",
  floodRoute: "Commonwealth Ave → Bay State Rd → Mugar Library",
  quakeMuster: "BU Beach (Charles River side lawn) — open assembly",
  quakeRoute: "Exit nearest building → BU Beach lawn",
  cooling: "George Sherman Union (GSU) — air-conditioned commons",
  coolingRoute: "Shaded sidewalk via Comm Ave → GSU",
  hurricane: "GSU interior ground-floor rooms — reinforced shelter",
  hurricaneRoute: "Comm Ave interior walk → GSU lower level",
  wildfireExit: "FitRec Center indoor refuge — filtered HVAC",
  wildfireRoute: "Comm Ave → Babcock St → FitRec entrance",
  warming: "GSU warming commons — power & heat",
  winterRoute: "Covered walkway via Comm Ave → GSU",
});

const MGH_ROUTES = buildRoutes({
  flood: "Lunder Building upper floors — hospital high ground",
  floodRoute: "Fruit St → Lunder Bldg main entrance (avoid Storrow underpass)",
  quakeMuster: "MGH front lawn — open assembly area off Cambridge St",
  quakeRoute: "Exit nearest wing → MGH front lawn",
  cooling: "Yawkey Center main lobby — climate-controlled commons",
  coolingRoute: "Indoor connector → Yawkey Center lobby",
  hurricane: "Ellison Building interior corridors — reinforced shelter",
  hurricaneRoute: "Internal corridors → Ellison Bldg ground floor",
  wildfireExit: "Hospital indoor refuge — filtered HVAC throughout",
  wildfireRoute: "Stay indoors; use internal corridors only",
  warming: "Yawkey Center commons — full power & heat",
  winterRoute: "Indoor connector network → Yawkey Center",
});

const MIT_LOC: SavedLocation = {
  id: "mit",
  name: "Massachusetts Institute of Technology",
  type: "Campus",
  area: "77 Massachusetts Ave, Cambridge, MA",
  ready: true,
  geo: {
    lat: 42.3601, lng: -71.0942,
    displayName: "MIT, 77 Massachusetts Ave, Cambridge, MA 02139",
    city: "Cambridge", county: "Middlesex County", state: "Massachusetts",
    stateCode: "MA", country: "United States", countryCode: "us",
  },
  preloaded: true,
  answers: allYesAnswers(),
  skipped: blankSkipped(),
  routes: MIT_ROUTES,
  readinessScore: 94,
  hazardScores: { flood: 92, earthquake: 90, heat: 96, hurricane: 91, wildfire: 95, winter: 93 },
  gaps: ["Confirm muster point lighting for evening drills", "Refresh quarterly drill schedule"],
};

const BU_LOC: SavedLocation = {
  id: "bu",
  name: "Boston University",
  type: "Campus",
  area: "1 Silber Way, Boston, MA",
  ready: true,
  geo: {
    lat: 42.3505, lng: -71.1054,
    displayName: "Boston University, Commonwealth Ave, Boston, MA 02215",
    city: "Boston", county: "Suffolk County", state: "Massachusetts",
    stateCode: "MA", country: "United States", countryCode: "us",
  },
  preloaded: true,
  answers: allYesAnswers(),
  skipped: blankSkipped(),
  routes: BU_ROUTES,
  readinessScore: 91,
  hazardScores: { flood: 88, earthquake: 90, heat: 94, hurricane: 86, wildfire: 93, winter: 92 },
  gaps: ["Confirm Charles River–side flood signage", "Refresh shuttle backup roster"],
};

const MGH_LOC: SavedLocation = {
  id: "mgh",
  name: "Massachusetts General Hospital",
  type: "Business",
  area: "55 Fruit St, Boston, MA",
  ready: true,
  geo: {
    lat: 42.3631, lng: -71.0686,
    displayName: "Massachusetts General Hospital, 55 Fruit St, Boston, MA 02114",
    city: "Boston", county: "Suffolk County", state: "Massachusetts",
    stateCode: "MA", country: "United States", countryCode: "us",
  },
  preloaded: true,
  answers: allYesAnswers(),
  skipped: blankSkipped(),
  routes: MGH_ROUTES,
  readinessScore: 96,
  hazardScores: { flood: 95, earthquake: 93, heat: 97, hurricane: 94, wildfire: 96, winter: 95 },
  gaps: ["Confirm backup generator transfer drill", "Refresh patient transport coordination"],
};

const PRELOADED_LOCATIONS: SavedLocation[] = [MIT_LOC, BU_LOC, MGH_LOC];


const LOCATION_TYPES = ["Home", "School", "Campus", "Community Center", "Church", "Business", "Other"];
const NAME_PRESETS = ["Home", "School", "Community Center"];

// ─────────────────────────────────────────────────────────────────────────────
// Type-aware copy
// ─────────────────────────────────────────────────────────────────────────────

type TypeGroup = "home" | "school" | "business" | "community";

function typeGroup(type: string): TypeGroup {
  const t = type.toLowerCase();
  if (t === "home") return "home";
  if (t === "school" || t === "campus") return "school";
  if (t === "business") return "business";
  if (t === "community center" || t === "church") return "community";
  return "home";
}

interface TypeCopy {
  groupNoun: string;          // "household", "school community", ...
  peopleTab: string;           // tab label
  peopleHeading: string;       // panel heading
  peopleIntro: string;         // descriptive sentence
  baseTitle: string;           // wizard Base step title
  baseIntro: string;           // wizard Base step description
  planIntro: string;           // saved-location header description
  attrs: { Icon: typeof Users; label: string; warn?: boolean }[];
}

const TYPE_COPY: Record<TypeGroup, TypeCopy> = {
  home: {
    groupNoun: "household",
    peopleTab: "Residence",
    peopleHeading: "Who lives here",
    peopleIntro: "Who needs to be accounted for when an alert fires — family, pets, and access needs.",
    baseTitle: "Residence Profile",
    baseIntro: "Tell us about the people, pets, and access needs in your residence so the plan accounts for everyone.",
    planIntro: "Your residence Compass Plan is ready. Review routes, fix gaps, or print the guide.",
    attrs: [
      { Icon: Users, label: "5 people" },
      { Icon: UserRound, label: "Elderly 1" },
      { Icon: Baby, label: "Toddler 1" },
      { Icon: PawPrint, label: "Pet 1" },
      { Icon: Car, label: "No vehicle", warn: true },
      { Icon: Stethoscope, label: "Medical needs" },
      { Icon: Accessibility, label: "Accessibility needs" },
    ],
  },
  school: {
    groupNoun: "school community",
    peopleTab: "School community",
    peopleHeading: "Who is on campus",
    peopleIntro: "Students, staff, and visitors who must be accounted for during a drill or real event.",
    baseTitle: "Campus Profile",
    baseIntro: "Tell us about students, staff, and accessibility needs on campus so muster, shelter, and evacuation steps match the people on site.",
    planIntro: "Your campus Compass Plan is ready. Review muster points, drill routes, and print the staff/parent guide.",
    attrs: [
      { Icon: Users, label: "Students on site" },
      { Icon: UserRound, label: "Staff & teachers" },
      { Icon: Baby, label: "Pre-K / early grades" },
      { Icon: Accessibility, label: "Accessibility needs" },
      { Icon: Stethoscope, label: "Nurse / medical needs" },
      { Icon: Car, label: "Bus & parent pickup" },
    ],
  },
  business: {
    groupNoun: "team",
    peopleTab: "Team & visitors",
    peopleHeading: "Who is on site",
    peopleIntro: "Employees, visitors, and shift coverage that need to be accounted for during an incident.",
    baseTitle: "Workplace Profile",
    baseIntro: "Tell us about employees, visitors, shifts, and ADA accommodations so the plan covers everyone in the building.",
    planIntro: "Your workplace Compass Plan is ready. Review evacuation routes, fix gaps, or print the team guide.",
    attrs: [
      { Icon: Users, label: "Employees on shift" },
      { Icon: UserRound, label: "Visitors / customers" },
      { Icon: Accessibility, label: "ADA accommodations" },
      { Icon: Stethoscope, label: "First-aid coverage" },
      { Icon: Car, label: "Parking & exits" },
    ],
  },
  community: {
    groupNoun: "congregation",
    peopleTab: "Members",
    peopleHeading: "Who gathers here",
    peopleIntro: "Members, volunteers, and any childcare or eldercare groups who use this space.",
    baseTitle: "Community Profile",
    baseIntro: "Tell us about members, volunteers, and any childcare or eldercare groups so the plan reflects everyone who gathers here.",
    planIntro: "Your community Compass Plan is ready. Review routes, fix gaps, or print the member guide.",
    attrs: [
      { Icon: Users, label: "Members & attendees" },
      { Icon: UserRound, label: "Volunteers" },
      { Icon: Baby, label: "Childcare groups" },
      { Icon: Accessibility, label: "Accessibility needs" },
      { Icon: Stethoscope, label: "Medical needs" },
    ],
  },
};

function getTypeCopy(type: string): TypeCopy {
  return TYPE_COPY[typeGroup(type)];
}

// ─────────────────────────────────────────────────────────────────────────────
// Scoring + generation
// ─────────────────────────────────────────────────────────────────────────────

function readinessLabel(score: number | null): string {
  if (score === null) return "Not Assessed";
  if (score >= 90) return "Plan Ready";
  if (score >= 70) return "Mostly Ready";
  if (score >= 40) return "Partially Ready";
  return "Not Ready";
}

function readinessColor(score: number | null): string {
  if (score === null) return "var(--severity-moderate)";
  if (score >= 90) return "var(--severity-low)";
  if (score >= 70) return "var(--severity-low)";
  if (score >= 40) return "var(--severity-moderate)";
  return "var(--severity-critical)";
}

function scoreSection(answers: SectionAnswers, skipped: boolean, total: number): number | null {
  // Skipped or unanswered questions count as "No" against the section total.
  if (total === 0) return null;
  if (skipped) return 0;
  const yes = Object.values(answers).filter((a) => a === "yes").length;
  return Math.round((yes / total) * 100);
}

function computeScores(answers: AllAnswers, skipped: SkipMap): {
  overall: number;
  hazardScores: Record<Disaster, number | null>;
  gaps: string[];
} {
  const hazardScores = {} as Record<Disaster, number | null>;
  for (const d of HAZARD_SECTION_IDS) {
    const section = SECTIONS.find((s) => s.id === d);
    const total = section?.questions.length ?? 0;
    hazardScores[d] = scoreSection(answers[d] ?? {}, skipped[d], total);
  }
  // Overall = yes / total across ALL sections. Skipped + unanswered count as No.
  let yes = 0;
  let total = 0;
  for (const s of SECTIONS) {
    for (const q of s.questions) {
      total++;
      if (skipped[s.id]) continue;
      if (answers[s.id]?.[q.key] === "yes") yes++;
    }
  }
  const overall = total === 0 ? 0 : Math.round((yes / total) * 100);

  // Gaps: every "no" answer that has a gap label (skipped sections aren't enumerated here)
  const gaps: string[] = [];
  for (const s of SECTIONS) {
    if (skipped[s.id]) continue;
    for (const q of s.questions) {
      if (answers[s.id]?.[q.key] === "no" && q.gap) gaps.push(q.gap);
    }
  }
  // Deduplicate while preserving order
  const seen = new Set<string>();
  const uniqueGaps = gaps.filter((g) => (seen.has(g) ? false : (seen.add(g), true)));
  return { overall, hazardScores, gaps: uniqueGaps };
}

function genericRoutes(name: string, area: string): RoutePlan[] {
  const where = area || name;
  return [
    {
      disaster: "flood", label: "Flood",
      firstAction: "Move to higher ground; do not drive through standing water",
      destination: `Nearest designated higher-ground shelter from ${where}`,
      safeRoute: "Use main arterial roads heading uphill; avoid creek crossings",
      avoid: "Low-lying roads, underpasses, bridges over local creeks",
      why: "Higher elevation removes you from rising water; arterials stay passable longer.",
    },
    {
      disaster: "earthquake", label: "Earthquake",
      firstAction: "Drop, Cover, Hold On indoors; then move to an open outdoor area",
      destination: `Open area away from buildings near ${where}`,
      safeRoute: "Exit nearest building carefully, walk away from glass and facades",
      avoid: "Brick facades, glass storefronts, power lines, parking structures",
      why: "Open space prevents falling-debris injury, the leading cause of earthquake harm.",
    },
    {
      disaster: "heat", label: "Extreme Heat",
      firstAction: "Move to a cooled space; hydrate every 15 minutes",
      destination: "Nearest cooling center, library, or air-conditioned space",
      safeRoute: "Shaded walking route; avoid direct sun between 11am–4pm",
      avoid: "Parked cars, asphalt lots, sustained outdoor activity",
      why: "Air-conditioned space prevents heatstroke; hydration sustains core temp.",
    },
    {
      disaster: "hurricane", label: "Hurricane",
      firstAction: "Shelter in an interior, ground-floor room away from windows",
      destination: `Interior shelter at ${where} or nearest hardened shelter`,
      safeRoute: "Stay indoors until official all-clear; do not drive in eyewall",
      avoid: "Windowed rooms, mobile structures, coastal evacuation zones",
      why: "Interior walls reduce wind and projectile risk during peak winds.",
    },
    {
      disaster: "wildfire", label: "Wildfire",
      firstAction: "Evacuate early using your primary exit",
      destination: "Designated regional shelter away from fire path",
      safeRoute: "Primary: main highway away from fire direction. Backup: secondary route.",
      avoid: "Forested roads, canyons, single-exit neighborhoods",
      why: "Early evacuation avoids road closures and smoke-blocked exits.",
    },
    {
      disaster: "winter", label: "Winter Storm",
      firstAction: "Stay indoors and conserve heat; move to a warming center if power fails",
      destination: `Nearest warming and charging center from ${where}`,
      safeRoute: "Plowed main roads and main walkways; avoid icy bridges and steep paths",
      avoid: "Icy bridges, steep roads, unplowed roads, exposed walking paths, iced underpasses",
      why: "Plowed arterials stay safer than side streets; warming center keeps heat and charging available.",
    },
  ];
}

function topFixNow(gaps: string[]): string[] {
  // Priority keywords first (transport, medical/power, route, contacts/drill)
  const priorities = [/transport/i, /power|medical|charging|heat/i, /route|exit|higher|warming|cooling/i, /contact|drill|plan/i];
  const sorted = [...gaps].sort((a, b) => {
    const ia = priorities.findIndex((re) => re.test(a));
    const ib = priorities.findIndex((re) => re.test(b));
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  return sorted.slice(0, 3);
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

type SetupMode = null | "device" | "manual";
type SetupStep = "name" | "wizard" | "review" | "generating" | "generated";

export function SafetyLocationPanel() {
  const { confirmLocation, setManualLocation } = useLocation();
  const [locations, setLocations] = useState<SavedLocation[]>(() => {
    const stored = loadStoredLocations<SavedLocation>();
    if (!stored || stored.length === 0) return [...PRELOADED_LOCATIONS];
    // Ensure all preloaded locations stay present even if older payloads dropped them.
    const merged = [...stored];
    for (const preset of PRELOADED_LOCATIONS) {
      if (!merged.some((l) => l.id === preset.id)) merged.push(preset);
    }
    return merged;
  });
  const [selectedId, setSelectedId] = useState<string>(MIT_LOC.id);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Persist every change so readiness percentage and answers survive reloads.
  useEffect(() => {
    saveStoredLocations(locations);
  }, [locations]);


  // Setup flow state
  const [setupMode, setSetupMode] = useState<SetupMode>(null);
  const [setupStep, setSetupStep] = useState<SetupStep>("name");
  const [draftName, setDraftName] = useState("Home");
  const [draftType, setDraftType] = useState("Home");
  const [draftArea, setDraftArea] = useState("");
  const [draftGeo, setDraftGeo] = useState<GeocodeResult | null>(null);
  const [draftLocationId, setDraftLocationId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AllAnswers>(blankAnswers());
  const [skipped, setSkipped] = useState<SkipMap>(blankSkipped());
  const [wizardIndex, setWizardIndex] = useState(0); // 0..SECTIONS.length-1
  const [genProgress, setGenProgress] = useState(0);
  const [genStatus, setGenStatus] = useState<string>("");

  const [selectedDisaster, setSelectedDisaster] = useState<Disaster>("flood");
  const [bodyTab, setBodyTab] = useState<"overview" | "people" | "risk" | "routes" | "gaps" | "answers">("overview");
  const [riskHazardId, setRiskHazardId] = useState<string>("flood");
  const [mapMounted, setMapMounted] = useState(false);
  useEffect(() => setMapMounted(true), []);
  const { activePhase } = usePhase();
  const showRiskMap = activePhase === "prepare";

  const selected: SavedLocation = locations.find((l) => l.id === selectedId) ?? MIT_LOC;
  const currentRoute = useMemo(
    () => selected.routes.find((r) => r.disaster === selectedDisaster) ?? selected.routes[0],
    [selected, selectedDisaster],
  );

  // Confirm + broadcast the active selection whenever it's ready (preloaded or
  // user-generated) so the rollup, snapshots, and risk map all follow this pick.
  useEffect(() => {
    if (!selected.ready) return;
    confirmLocation();
    setManualLocation(selected.geo ? { name: selected.name, resolved: selected.geo } : null);
  }, [selected.ready, selected.id, selected.geo, selected.name, confirmLocation, setManualLocation]);

  function startDeviceFlow() {
    setSetupMode("device");
    setDraftName("Home");
    setDraftType("Home");
    setDraftArea("Detecting your location…");
    setDraftGeo(null);
    setSetupStep("name");

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setDraftArea("");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setDraftArea(`Detected · resolving address (${lat.toFixed(4)}, ${lng.toFixed(4)})…`);
        try {
          const geo = await reverseGeocode(lat, lng);
          if (geo) {
            setDraftGeo(geo);
            setDraftArea(geo.displayName);
            const inferred = [geo.city, geo.state, geo.country].filter(Boolean).join(", ");
            if (!inferred) setDraftArea(geo.displayName || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
            // Persist immediately so it follows the user across Respond/Recover.
            setManualLocation({ name: geo.city || geo.displayName || "Detected location", resolved: geo });
            confirmLocation();
          } else {
            const fallback = {
              lat, lng,
              displayName: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
              city: null, county: null, state: null, stateCode: null, country: null, countryCode: null,
            };
            setDraftGeo(fallback);
            setDraftArea(`${lat.toFixed(5)}, ${lng.toFixed(5)} (address lookup unavailable)`);
            setManualLocation({ name: "Detected location", resolved: fallback });
            confirmLocation();
          }
        } catch {
          const fallback = {
            lat, lng,
            displayName: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            city: null, county: null, state: null, stateCode: null, country: null, countryCode: null,
          };
          setDraftGeo(fallback);
          setDraftArea(`${lat.toFixed(5)}, ${lng.toFixed(5)} (address lookup failed)`);
          setManualLocation({ name: "Detected location", resolved: fallback });
          confirmLocation();
        }
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied — enter your address manually below."
            : "Couldn't detect your location — enter it manually below.";
        setDraftArea(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }
  function startManualFlow() {
    setSetupMode("manual");
    setDraftName("Home");
    setDraftType("Home");
    setDraftArea("");
    setDraftGeo(null);
    setSetupStep("name");
  }
  function cancelSetup() {
    setSetupMode(null);
    setSetupStep("name");
    setAnswers(blankAnswers());
    setSkipped(blankSkipped());
    setWizardIndex(0);
    setDraftLocationId(null);
    setDraftGeo(null);
    setGenProgress(0);
    setGenStatus("");
  }

  /**
   * Update a single answer on an already-onboarded location and recompute
   * readinessScore / hazardScores / gaps live. Persists via the useEffect above.
   */
  function updateAnswer(
    locationId: string,
    sectionId: SectionId,
    questionKey: string,
    value: Answer,
  ) {
    setLocations((ls) =>
      ls.map((l) => {
        if (l.id !== locationId) return l;
        const nextSection = { ...(l.answers[sectionId] ?? {}), [questionKey]: value };
        const nextAnswers: AllAnswers = { ...l.answers, [sectionId]: nextSection };
        // Editing an answer un-skips its section so the answer actually counts.
        const nextSkipped: SkipMap = l.skipped[sectionId]
          ? { ...l.skipped, [sectionId]: false }
          : l.skipped;
        const { overall, hazardScores, gaps } = computeScores(nextAnswers, nextSkipped);
        return {
          ...l,
          answers: nextAnswers,
          skipped: nextSkipped,
          readinessScore: overall,
          hazardScores,
          gaps,
        };
      }),
    );
  }

  /** Toggle a hazard section's "skip" flag from the Answers tab. */
  function toggleSectionSkip(locationId: string, sectionId: SectionId) {
    setLocations((ls) =>
      ls.map((l) => {
        if (l.id !== locationId) return l;
        const nextSkipped: SkipMap = { ...l.skipped, [sectionId]: !l.skipped[sectionId] };
        const { overall, hazardScores, gaps } = computeScores(l.answers, nextSkipped);
        return { ...l, skipped: nextSkipped, readinessScore: overall, hazardScores, gaps };
      }),
    );
  }

  function createDraftAndStartWizard() {
    const id = `loc-${Date.now()}`;
    const draft: SavedLocation = {
      id,
      name: draftName.trim() || "My location",
      type: draftType,
      area: draftArea.trim() || (setupMode === "device" ? "Current location" : ""),
      ready: false,
      answers: blankAnswers(),
      skipped: blankSkipped(),
      routes: [],
      readinessScore: 0,
      hazardScores: { flood: null, earthquake: null, heat: null, hurricane: null, wildfire: null, winter: null },
      gaps: [],
    };
    setLocations((ls) => [...ls, draft]);
    setDraftLocationId(id);
    setSelectedId(id);
    setAnswers(blankAnswers());
    setSkipped(blankSkipped());
    setWizardIndex(0);
    setSetupStep("wizard");
  }

  function startReadinessForExisting(locId: string) {
    setDraftLocationId(locId);
    const loc = locations.find((l) => l.id === locId);
    if (loc) {
      setDraftName(loc.name);
      setDraftArea(loc.area);
      setDraftType(loc.type);
    }
    setSetupMode("manual");
    setAnswers(blankAnswers());
    setSkipped(blankSkipped());
    setWizardIndex(0);
    setSetupStep("wizard");
  }

  function goToReview() {
    setSetupStep("review");
  }

  async function generatePlan() {
    if (!draftLocationId) return;
    const locId = draftLocationId;
    const { overall, hazardScores, gaps } = computeScores(answers, skipped);

    // Move into the generating step with a live progress bar.
    setSetupStep("generating");
    setGenProgress(5);
    setGenStatus("Analyzing your location…");

    // Resolve coordinates (use draftGeo from autocomplete if available).
    let geo: GeocodeResult | null = draftGeo;
    const area = draftArea.trim();
    if (!geo && area) {
      try {
        geo = await forwardGeocode(area);
      } catch {
        geo = null;
      }
    }
    setGenProgress(25);
    setGenStatus("Mapping hazards near you…");

    // Kick off AI plan generation while we animate progress through hazards.
    const aiPromise = generateCompassPlan({
      data: {
        locationName: draftName.trim() || "My location",
        locationType: draftType,
        address: area || draftName,
        city: geo?.city ?? undefined,
        state: geo?.state ?? undefined,
        country: geo?.country ?? undefined,
        lat: geo?.lat,
        lng: geo?.lng,
      },
    }).catch(() => null);

    const hazardLabels = ["Flood", "Earthquake", "Extreme Heat", "Hurricane", "Wildfire", "Winter Storm"];
    for (let i = 0; i < hazardLabels.length; i++) {
      setGenStatus(`Generating ${hazardLabels[i]} route…`);
      setGenProgress(25 + Math.round(((i + 1) / hazardLabels.length) * 60));
      await new Promise((r) => setTimeout(r, 350));
    }

    setGenStatus("Finalizing your Compass Plan…");
    const aiResult = await aiPromise;
    const routes: RoutePlan[] = aiResult?.routes?.length
      ? (aiResult.routes as RoutePlan[])
      : genericRoutes(draftName, draftArea);
    setGenProgress(100);

    setLocations((ls) =>
      ls.map((l) =>
        l.id === locId
          ? {
              ...l,
              ready: true,
              area: area || l.area,
              answers,
              skipped,
              routes,
              readinessScore: overall,
              hazardScores,
              gaps,
              ...(geo ? { geo } : {}),
            }
          : l,
      ),
    );

    // Brief pause so the user sees 100% before the results screen.
    await new Promise((r) => setTimeout(r, 400));
    setSetupStep("generated");
  }

  function closeAfterResults() {
    setSetupMode(null);
    setSetupStep("name");
    setDraftLocationId(null);
    setDraftGeo(null);
    setGenProgress(0);
    setGenStatus("");
    setAnswers(blankAnswers());
    setSkipped(blankSkipped());
    setWizardIndex(0);
  }

  function printGuide() {
    const title = `${selected.name} Disaster Compass Safety Guide`;
    const hazardRows = HAZARD_SECTION_IDS.map((d) => {
      const score = selected.hazardScores[d];
      const label = DISASTERS.find((x) => x.id === d)?.label ?? d;
      return `<div class="row"><b>${label}:</b> ${score === null ? "Not Assessed" : score + "% — " + readinessLabel(score)}</div>`;
    }).join("");
    const planBlocks = selected.routes.map((r) => `
      <div class="block">
        <h3>${r.label}</h3>
        <div class="row"><b>First action:</b> ${r.firstAction}</div>
        <div class="row"><b>Destination:</b> ${r.destination}</div>
        <div class="row"><b>Safe route:</b> ${r.safeRoute}</div>
        <div class="row"><b>Avoid:</b> ${r.avoid}</div>
        <div class="muted">Why: ${r.why}</div>
      </div>`).join("");

    const skippedHazards = HAZARD_SECTION_IDS.filter((d) => selected.skipped[d]);
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title>
<style>
  body{font-family:ui-sans-serif,system-ui,sans-serif;color:#0f172a;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.5}
  h1{font-size:22px;margin:0 0 4px;color:#0f172a}
  h2{font-size:13px;text-transform:uppercase;letter-spacing:.1em;color:#475569;margin:22px 0 6px}
  h3{font-size:14px;margin:10px 0 4px;color:#0f172a}
  .pill{display:inline-block;background:#dcfce7;color:#166534;font-weight:600;padding:2px 10px;border-radius:999px;font-size:12px;margin-left:8px}
  .warn{display:inline-block;background:#fef3c7;color:#92400e;font-weight:600;padding:2px 10px;border-radius:999px;font-size:12px}
  .row{margin:4px 0;font-size:13px}
  .muted{color:#475569;font-size:12px;margin-top:4px}
  .block{padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;margin:8px 0}
  ul{padding-left:18px;margin:6px 0}
  .disclaimer{margin-top:32px;padding:12px;border:1px solid #fde68a;background:#fffbeb;border-radius:8px;font-size:12px;color:#92400e}
</style></head><body>
<h1>${title} <span class="pill">${readinessLabel(selected.readinessScore)}</span></h1>
<div class="muted">${selected.type} · ${selected.area || ""}</div>

<h2>Overall Readiness</h2>
<div class="row"><b>Score:</b> ${selected.readinessScore}%</div>

<h2>Hazard Readiness</h2>
${hazardRows}

${skippedHazards.length ? `<h2>Skipped Sections</h2><div class="row"><span class="warn">Not assessed · review before printing final guide</span><div class="muted">${skippedHazards.map((d) => DISASTERS.find((x) => x.id === d)?.label).join(", ")}</div></div>` : ""}

<h2>Disaster Action Plans</h2>
${planBlocks}

<h2>Open Gaps</h2>
<ul>${(selected.gaps.length ? selected.gaps : ["No open gaps recorded."]).map((g) => `<li>${g}</li>`).join("")}</ul>

<div class="disclaimer">Follow official emergency instructions and call 911 for life-threatening emergencies. Disaster Compass provides pre-mapped preparedness guidance using preloaded safety data.</div>
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
  }

  const draftLoc = draftLocationId ? locations.find((l) => l.id === draftLocationId) ?? null : null;

  return (
    <section className="dc-card overflow-hidden">
      {/* Header row */}
      <div className="border-b border-border bg-card/95 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--severity-low)]/15 text-[color:var(--severity-low)]">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-card-foreground/55">
                Saved Safety Location
              </p>
              <p className="truncate text-sm font-semibold text-foreground">
                {selected.name}
                <span
                  className="ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1"
                  style={{
                    color: readinessColor(selected.ready ? selected.readinessScore : null),
                    background: `color-mix(in srgb, ${readinessColor(selected.ready ? selected.readinessScore : null)} 14%, transparent)`,
                  }}
                >
                  {selected.ready ? readinessLabel(selected.readinessScore) : "Needs Readiness Setup"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="inline-flex min-w-[260px] items-center justify-between gap-2 rounded-lg border border-border bg-white px-3 py-1.5 text-left text-xs font-medium text-black hover:bg-gray-100"
              >
                <span className="truncate">
                  {selected.name} · {selected.ready ? readinessLabel(selected.readinessScore) : "Needs Readiness Setup"}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 z-30 mt-1 w-[320px] overflow-hidden rounded-lg border border-border bg-white shadow-xl">
                  <ul className="max-h-72 overflow-auto py-1">
                    {locations.map((l) => {
                      const active = l.id === selectedId;
                      return (
                        <li key={l.id}>
                          <button
                            onClick={() => {
                              setSelectedId(l.id);
                              setDropdownOpen(false);
                            }}
                            className={`flex w-full items-start gap-2 px-3 py-2 text-left text-xs text-black hover:bg-gray-100 ${active ? "bg-gray-100" : ""}`}
                          >
                            <MapPin className="mt-0.5 h-3.5 w-3.5 text-black/60" />
                            <span className="flex-1">
                              <span className="block font-semibold text-black">{l.name}</span>
                              <span
                                className="block text-[11px]"
                                style={{ color: readinessColor(l.ready ? l.readinessScore : null) }}
                              >
                                {l.ready ? readinessLabel(l.readinessScore) : "Needs Readiness Setup"}
                              </span>
                            </span>
                            {active && <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--severity-low)]" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {selected.preloaded ? (
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--severity-low)]">
              Campus Community Safety Guide
            </p>
            <h3 className="mt-1 text-xl font-bold tracking-tight">Preparedness Mode · Plan Ready</h3>
            <p className="mt-1 text-sm text-card-foreground/75">
              This location has preloaded preparedness data and pre-mapped safety routes for all six hazards.
            </p>
          </div>
        ) : selected.ready ? (
          <div className="mb-4">
            <h3 className="text-xl font-bold tracking-tight">{selected.name}</h3>
            <p className="mt-1 text-sm text-card-foreground/75">
              {getTypeCopy(selected.type).planIntro}
            </p>
          </div>
        ) : (
          <div className="mb-4">
            <h3 className="text-xl font-bold tracking-tight">Set your location</h3>
            <p className="mt-1 text-sm text-card-foreground/75">
              Choose how to add your address so Disaster Compass can build your Compass Plan.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={startDeviceFlow}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:brightness-110"
              >
                <LocateFixed className="h-4 w-4" /> Use My Location
              </button>
              <button
                onClick={startManualFlow}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface"
              >
                <Pencil className="h-4 w-4" /> Enter Manually
              </button>
            </div>
          </div>
        )}

        {selected.ready && (() => {
          const copy = getTypeCopy(selected.type);
          const TABS: { id: typeof bodyTab; label: string }[] = [
            { id: "overview", label: "Overview" },
            { id: "people", label: copy.peopleTab },
            ...(showRiskMap ? [{ id: "risk" as const, label: "Risk map" }] : []),
            { id: "routes", label: "Routes" },
            { id: "gaps", label: `Gaps${selected.gaps.length ? ` (${selected.gaps.length})` : ""}` },
            { id: "answers", label: "Edit answers" },
          ];
          return (
            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <div className="space-y-4">
                {/* Tab strip */}
                <div role="tablist" className="flex flex-wrap gap-1 border-b border-border">
                  {TABS.map((t) => {
                    const active = bodyTab === t.id;
                    return (
                      <button
                        key={t.id}
                        role="tab"
                        aria-selected={active}
                        onClick={() => setBodyTab(t.id)}
                        className={`-mb-px rounded-t-md border-b-2 px-3 py-1.5 text-xs font-semibold text-black transition-colors ${
                          active
                            ? "border-black"
                            : "border-transparent hover:border-black/40"
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>

                {/* Overview tab */}
                {bodyTab === "overview" && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-border bg-surface/40 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-card-foreground/55">
                        Readiness Score
                      </p>
                      <p className="mt-1 text-3xl font-bold" style={{ color: readinessColor(selected.readinessScore) }}>
                        {selected.readinessScore}%
                      </p>
                      <p className="text-[11px] font-semibold" style={{ color: readinessColor(selected.readinessScore) }}>
                        {readinessLabel(selected.readinessScore)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface/40 p-4 sm:col-span-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-card-foreground/55">
                        Hazard Readiness
                      </p>
                      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                        {DISASTERS.map(({ id, label, Icon }) => {
                          const s = selected.hazardScores[id];
                          return (
                            <li key={id} className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1.5 text-card-foreground/80">
                                <Icon className="h-3 w-3" /> {label}
                              </span>
                              <span className="font-semibold tabular-nums" style={{ color: readinessColor(s) }}>
                                {s === null ? "Not Assessed" : `${s}%`}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                )}

                {/* People tab */}
                {bodyTab === "people" && (
                  <div className="rounded-xl border border-border bg-surface/40 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-card-foreground/55">
                      {copy.peopleHeading}
                    </p>
                    <p className="mt-1 text-sm text-card-foreground/80">{copy.peopleIntro}</p>
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {copy.attrs.map(({ Icon, label, warn }) => (
                        <li
                          key={label}
                          className={[
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
                            warn
                              ? "bg-[color:var(--severity-moderate)]/12 text-[color:var(--severity-moderate)] ring-[color:var(--severity-moderate)]/30"
                              : "bg-background text-card-foreground/85 ring-border",
                          ].join(" ")}
                        >
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                          {label}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-[11px] italic text-card-foreground/55">
                      Re-run onboarding to update the {copy.groupNoun} profile.
                    </p>
                  </div>
                )}

                {/* Risk map tab */}
                {bodyTab === "risk" && showRiskMap && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-card-foreground/55">
                      Risk map — orient first
                    </p>
                    <p className="mt-1 text-xs text-card-foreground/65">
                      Tap a hazard zone on the map or pick one from the list to see the rehearsal route.
                    </p>
                    <div className="mt-3">
                      <RouteTrainingPanel selectedHazardId={riskHazardId} onSelectHazard={setRiskHazardId} />
                    </div>
                    <div className="mt-3 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
                      <div className="overflow-hidden rounded-2xl">
                        {mapMounted ? (
                          <Suspense
                            fallback={
                              <div className="flex h-[380px] items-center justify-center rounded-2xl bg-surface text-sm text-foreground/60">
                                Loading risk map…
                              </div>
                            }
                          >
                            <PrepareRiskMap selectedHazardId={riskHazardId} onSelectHazard={setRiskHazardId} />
                          </Suspense>
                        ) : (
                          <div className="flex h-[380px] items-center justify-center rounded-2xl bg-surface text-sm text-foreground/60">
                            Loading risk map…
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-card-foreground/55">
                          Hazards near you
                        </p>
                        {HAZARD_RISKS.map((h) => {
                          const active = h.id === riskHazardId;
                          const sev = SEVERITY_META[h.severity];
                          return (
                            <button
                              key={h.id}
                              type="button"
                              onClick={() => setRiskHazardId(h.id)}
                              className={[
                                "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition-colors",
                                active
                                  ? "border-foreground/70 bg-card-foreground/5 ring-1 ring-foreground/20"
                                  : "border-border hover:border-slate-300",
                              ].join(" ")}
                            >
                              <span className="text-sm font-semibold">{h.shortLabel}</span>
                              <span className="flex items-center gap-2">
                                <SeverityBars severity={h.severity} />
                                <span className="w-16 text-right text-xs font-medium" style={{ color: sev.color }}>
                                  {sev.label}
                                </span>
                              </span>
                            </button>
                          );
                        })}

                        {/* Legend */}
                        {(() => {
                          const route = HAZARD_ROUTES[riskHazardId];
                          const selectedHazard = HAZARD_RISKS.find((h) => h.id === riskHazardId);
                          return (
                            <div className="rounded-xl border border-border bg-surface/40 p-3 text-xs text-foreground">
                              <p className="mb-1 font-semibold">
                                {selectedHazard ? `${selectedHazard.shortLabel} rehearsal route` : "Risk map"}
                              </p>
                              {route && (
                                <p className="mb-2 text-[11px] text-muted-foreground">
                                  Home → {route.destinationName}
                                  <br />
                                  <span className="italic">{route.note}</span>
                                </p>
                              )}
                              <ul className="space-y-1.5">
                                {route && (
                                  <li className="flex items-center gap-2">
                                    <span
                                      className="inline-block h-[3px] w-5 rounded"
                                      style={{ background: route.color }}
                                    />
                                    Pre-mapped route
                                  </li>
                                )}
                                <li className="flex items-center gap-2">
                                  <span
                                    className="inline-block h-3 w-3 rounded-sm"
                                    style={{ background: SEVERITY_META.high.color, opacity: 0.5 }}
                                  />
                                  Flood zone — high
                                </li>
                                <li className="flex items-center gap-2">
                                  <span
                                    className="inline-block h-3 w-3 rounded-sm"
                                    style={{ background: SEVERITY_META.low.color, opacity: 0.5 }}
                                  />
                                  Fault · WUI edge — low
                                </li>
                                <li className="flex items-center gap-2">
                                  <span className="inline-block h-3 w-3 rounded-full" style={{ background: "#0F172A" }} />
                                  Your home
                                </li>
                              </ul>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Routes tab */}
                {bodyTab === "routes" && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-card-foreground/55">
                      Pre-mapped Route Plan
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {DISASTERS.map(({ id, label, Icon }) => {
                        const active = id === selectedDisaster;
                        return (
                          <button
                            key={id}
                            onClick={() => setSelectedDisaster(id)}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                              active
                                ? "border-foreground bg-foreground text-white"
                                : "border-border bg-background text-foreground hover:bg-surface"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" /> {label}
                          </button>
                        );
                      })}
                    </div>

                    {currentRoute && (
                      <div className="mt-3 rounded-xl border border-border bg-surface/40 p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field label="First Action" value={currentRoute.firstAction} accent />
                          <Field label="Destination" value={currentRoute.destination} />
                          <Field label="Safe Route" value={currentRoute.safeRoute} />
                          <Field label="Avoid" value={currentRoute.avoid} />
                        </div>
                        <p className="mt-3 text-xs italic text-card-foreground/65">
                          Why this route: {currentRoute.why}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Gaps tab — inline editable */}
                {bodyTab === "gaps" && (() => {
                  type OpenGap = { sectionId: SectionId; sectionTitle: string; key: string; question: string; gap: string };
                  const openGaps: OpenGap[] = [];
                  for (const s of SECTIONS) {
                    if (selected.skipped[s.id]) continue;
                    for (const q of s.questions) {
                      if (selected.answers[s.id]?.[q.key] === "no" && q.gap) {
                        openGaps.push({ sectionId: s.id, sectionTitle: s.title, key: q.key, question: q.q, gap: q.gap });
                      }
                    }
                  }
                  return (
                    <div className="rounded-xl border border-border bg-surface/40 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-card-foreground/55">
                        Open Gaps
                      </p>
                      <p className="mt-1 text-[11px] text-card-foreground/55">
                        Mark a gap done to close it and raise your readiness percentage live.
                      </p>
                      {openGaps.length === 0 ? (
                        <p className="mt-2 text-sm text-card-foreground/70">No open gaps recorded. Nicely done.</p>
                      ) : (
                        <ul className="mt-2 space-y-1.5">
                          {openGaps.map((g) => (
                            <li
                              key={`${g.sectionId}:${g.key}`}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2"
                            >
                              <div className="flex min-w-0 items-start gap-1.5 text-sm">
                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--severity-moderate)]" />
                                <div className="min-w-0">
                                  <p className="font-medium text-foreground">{g.gap}</p>
                                  <p className="text-[11px] text-card-foreground/55">
                                    {g.sectionTitle} · {g.question}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => updateAnswer(selected.id, g.sectionId, g.key, "yes")}
                                className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[color:var(--severity-low)] px-2.5 py-1 text-[11px] font-semibold text-white hover:brightness-110"
                              >
                                <Check className="h-3 w-3" /> Mark done
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })()}

                {/* Edit answers tab — full editable list grouped by section + category */}
                {bodyTab === "answers" && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-card-foreground/65">
                      Flip any answer to update your preparedness score. Skip a section if it doesn't apply.
                    </p>
                    {SECTIONS.map((section) => {
                      const isSkipped = selected.skipped[section.id];
                      const sectionAns = selected.answers[section.id] ?? {};
                      const isHazard = section.id !== "base";
                      const cats: QuestionCategory[] = isHazard ? ["know", "equip", "mental"] : [];
                      return (
                        <div key={section.id} className="rounded-xl border border-border bg-surface/40 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground">{section.title}</p>
                            {isHazard && (
                              <button
                                onClick={() => toggleSectionSkip(selected.id, section.id)}
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                  isSkipped
                                    ? "bg-[color:var(--severity-moderate)]/15 text-[color:var(--severity-moderate)]"
                                    : "border border-border bg-background text-card-foreground/70 hover:bg-surface"
                                }`}
                              >
                                <SkipForward className="h-3 w-3" />
                                {isSkipped ? "Skipped · tap to include" : "Skip this section"}
                              </button>
                            )}
                          </div>
                          {isHazard ? (
                            cats.map((cat) => {
                              const qs = section.questions.filter((q) => q.category === cat);
                              if (qs.length === 0) return null;
                              return (
                                <div key={cat} className="mt-3">
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-card-foreground/55">
                                    {CATEGORY_META[cat].label}
                                  </p>
                                  <ul className="mt-1 space-y-1.5">
                                    {qs.map((q) => (
                                      <AnswerRow
                                        key={q.key}
                                        question={q.q}
                                        value={sectionAns[q.key] ?? null}
                                        onChange={(v) => updateAnswer(selected.id, section.id, q.key, v)}
                                      />
                                    ))}
                                  </ul>
                                </div>
                              );
                            })
                          ) : (
                            <ul className="mt-3 space-y-1.5">
                              {section.questions.map((q) => (
                                <AnswerRow
                                  key={q.key}
                                  question={q.q}
                                  value={sectionAns[q.key] ?? null}
                                  onChange={(v) => updateAnswer(selected.id, section.id, q.key, v)}
                                />
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 lg:w-44">
                <button
                  onClick={printGuide}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-xs font-semibold text-white hover:brightness-110"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Safety Guide
                </button>
                {!selected.preloaded && (
                  <button
                    onClick={() => startReadinessForExisting(selected.id)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold hover:bg-surface"
                  >
                    Re-run onboarding
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Setup wizard modal */}
      {setupMode && (
        <SetupModal
          mode={setupMode}
          step={setupStep}
          draftName={draftName}
          draftType={draftType}
          draftArea={draftArea}
          answers={answers}
          skipped={skipped}
          wizardIndex={wizardIndex}
          draftLocation={draftLoc}
          onChangeName={setDraftName}
          onChangeType={setDraftType}
          onChangeArea={setDraftArea}
          onSelectPlace={(s: PlaceSuggestion) => {
            setDraftArea(s.displayName);
            setDraftGeo({
              lat: s.lat,
              lng: s.lng,
              displayName: s.displayName,
              city: s.city,
              county: null,
              state: s.state,
              stateCode: null,
              country: s.country,
              countryCode: null,
            });
            const inferred = inferLocationType(s.klass, s.type);
            setDraftType(inferred);
            if ((draftName === "Home" || !draftName.trim()) && s.name) {
              setDraftName(s.name.slice(0, 60));
            }
          }}
          onChangeAnswers={setAnswers}
          onChangeSkipped={setSkipped}
          onChangeWizardIndex={setWizardIndex}
          onCancel={cancelSetup}
          onNextFromName={createDraftAndStartWizard}
          onGoReview={goToReview}
          onGeneratePlan={generatePlan}
          onClose={closeAfterResults}
          genProgress={genProgress}
          genStatus={genStatus}
        />
      )}
    </section>
  );
}

function Field({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-card-foreground/55">{label}</p>
      <p className={`mt-0.5 text-sm ${accent ? "font-bold text-foreground" : "text-card-foreground/85"}`}>
        {value}
      </p>
    </div>
  );
}

function AnswerRow({
  question,
  value,
  onChange,
}: {
  question: string;
  value: Answer;
  onChange: (v: Answer) => void;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-background px-2.5 py-1.5">
      <span className="min-w-0 flex-1 text-sm text-foreground">{question}</span>
      <div className="flex gap-1">
        <button
          onClick={() => onChange("yes")}
          className={`rounded px-2 py-0.5 text-[11px] font-semibold transition-colors ${
            value === "yes"
              ? "bg-[color:var(--severity-low)] text-white"
              : "border border-border bg-background text-card-foreground/80 hover:bg-surface"
          }`}
        >
          Yes
        </button>
        <button
          onClick={() => onChange("no")}
          className={`rounded px-2 py-0.5 text-[11px] font-semibold transition-colors ${
            value === "no"
              ? "bg-[color:var(--severity-moderate)] text-white"
              : "border border-border bg-background text-card-foreground/80 hover:bg-surface"
          }`}
        >
          No
        </button>
      </div>
    </li>
  );
}



// ─────────────────────────────────────────────────────────────────────────────
// Wizard modal
// ─────────────────────────────────────────────────────────────────────────────

interface SetupModalProps {
  mode: "device" | "manual";
  step: SetupStep;
  draftName: string;
  draftType: string;
  draftArea: string;
  answers: AllAnswers;
  skipped: SkipMap;
  wizardIndex: number;
  draftLocation: SavedLocation | null;
  onChangeName: (s: string) => void;
  onChangeType: (s: string) => void;
  onChangeArea: (s: string) => void;
  onSelectPlace: (s: PlaceSuggestion) => void;
  onChangeAnswers: (a: AllAnswers) => void;
  onChangeSkipped: (s: SkipMap) => void;
  onChangeWizardIndex: (i: number) => void;
  onCancel: () => void;
  onNextFromName: () => void;
  onGoReview: () => void;
  onGeneratePlan: () => void;
  onClose: () => void;
  genProgress: number;
  genStatus: string;
}

function SetupModal(p: SetupModalProps) {
  const totalSteps = 9; // name(=created) + 7 sections + review + generated; we count user-visible
  const stepLabel = (() => {
    if (p.step === "name") return "Set up location";
    if (p.step === "wizard") {
      const section = SECTIONS[p.wizardIndex];
      return `Step ${p.wizardIndex + 1} of ${totalSteps} · ${section.title}`;
    }
    if (p.step === "review") return `Step 8 of ${totalSteps} · Review Score`;
    if (p.step === "generating") return `Step 9 of ${totalSteps} · Generating Compass Plan`;
    return `Step 9 of ${totalSteps} · Compass Plan`;
  })();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onKeyDownCapture={(e) => e.stopPropagation()}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border border-border bg-white text-black shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black">
              {p.mode === "device" ? "Use My Location" : "Enter Manually"} · Readiness Onboarding
            </p>
            <p className="text-sm font-semibold text-black">{stepLabel}</p>
          </div>
          <button type="button" onClick={p.onClose} className="rounded-md p-1 text-black hover:bg-gray-100" aria-label="Close setup">
            <X className="h-4 w-4" />
          </button>
        </div>


        {/* Progress bar */}
        {p.step !== "name" && <ProgressBar step={p.step} wizardIndex={p.wizardIndex} totalSteps={totalSteps} />}

        <div className="space-y-4 p-5">
          {p.step === "name" && <NameStep {...p} />}
          {p.step === "wizard" && <WizardStep {...p} />}
          {p.step === "review" && <ReviewStep {...p} />}
          {p.step === "generating" && <GeneratingStep {...p} />}
          {p.step === "generated" && <GeneratedStep {...p} />}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ step, wizardIndex, totalSteps }: { step: SetupStep; wizardIndex: number; totalSteps: number }) {
  const current =
    step === "wizard" ? wizardIndex + 1 : step === "review" ? 8 : step === "generating" ? 9 : 9;
  const pct = Math.round((current / totalSteps) * 100);
  return (
    <div className="px-5 pt-3">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-card-foreground/10">
        <div className="h-full rounded-full bg-[color:var(--severity-low)] transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function GeneratingStep(p: SetupModalProps) {
  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[color:var(--severity-moderate)] animate-pulse" />
        <h3 className="text-base font-bold text-foreground">Generating your Compass Plan</h3>
      </div>
      <p className="text-sm text-black/75">
        AI is building personalized route plans for each disaster based on{" "}
        <span className="font-semibold">{p.draftName}</span>
        {p.draftArea ? ` (${p.draftArea.split(",").slice(0, 2).join(",")})` : ""}.
      </p>
      <div className="space-y-2">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/10">
          <div
            className="h-full rounded-full bg-[color:var(--severity-moderate)] transition-all duration-300"
            style={{ width: `${p.genProgress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-black/70">{p.genStatus || "Working…"}</span>
          <span className="font-semibold tabular-nums text-black">{p.genProgress}%</span>
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-1.5 pt-2 text-[11px] text-black/65 sm:grid-cols-3">
        {["Flood", "Earthquake", "Heat", "Hurricane", "Wildfire", "Winter"].map((d, i) => {
          const threshold = 25 + ((i + 1) / 6) * 60;
          const done = p.genProgress >= threshold;
          return (
            <li
              key={d}
              className={`rounded-md border px-2 py-1 transition ${
                done ? "border-[color:var(--severity-low)]/40 bg-[color:var(--severity-low)]/10 text-[color:var(--severity-low)]" : "border-border bg-white"
              }`}
            >
              {done ? "✓" : "•"} {d} route
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function NameStep(p: SetupModalProps) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);

  async function runAiLookup() {
    const q = p.draftArea.trim() || p.draftName.trim();
    if (q.length < 2) {
      setAiError("Type a name or partial address first (e.g. 'Lincoln High Tampa').");
      return;
    }
    setAiError(null);
    setAiNote(null);
    setAiLoading(true);
    try {
      const details = await lookupPlaceDetails({ data: { query: q } });
      if (!details) {
        setAiError("AI couldn't resolve that. Try adding a city or state.");
        return;
      }
      const addressForGeo = [details.address, details.city, details.state, details.country]
        .filter(Boolean)
        .join(", ");
      const geo = await forwardGeocode(addressForGeo);
      const suggestion: PlaceSuggestion = {
        displayName: geo?.displayName ?? addressForGeo,
        name: details.name,
        klass: "",
        type: details.locationType.toLowerCase(),
        lat: geo?.lat ?? 0,
        lng: geo?.lng ?? 0,
        city: geo?.city ?? details.city ?? null,
        state: geo?.state ?? details.state ?? null,
        country: geo?.country ?? details.country ?? null,
      };
      p.onSelectPlace(suggestion);
      p.onChangeType(details.locationType);
      if (details.name) p.onChangeName(details.name.slice(0, 60));
      setAiNote(geo ? "Filled from AI + map lookup." : "Filled from AI (coordinates not verified).");
    } catch (err) {
      console.error(err);
      setAiError("AI lookup failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <>
      {p.mode === "device" && (
        <div className="rounded-lg border border-border bg-surface/40 p-3 text-sm">
          <p className="flex items-center gap-2 font-semibold text-black">
            {/Detecting|resolving|address lookup|permission denied|Couldn't detect/i.test(p.draftArea) ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <LocateFixed className="h-4 w-4 text-[color:var(--severity-low)]" />
            )}
            Detected location
          </p>
          <p className="mt-1 text-xs text-black">{p.draftArea || "Detecting…"}</p>
        </div>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-black">Location name</span>
        <input
          value={p.draftName}
          onChange={(e) => p.onChangeName(e.target.value)}
          maxLength={60}
          className="rounded-md border border-border bg-white px-2 py-1.5 text-sm text-black placeholder:text-black/50"
        />
        <div className="mt-1 flex flex-wrap gap-1.5">
          {NAME_PRESETS.map((n) => (
            <button key={n} onClick={() => p.onChangeName(n)} className="rounded-full border border-border bg-white px-2.5 py-0.5 text-[11px] text-black hover:bg-gray-100">
              {n}
            </button>
          ))}
        </div>
      </label>

      {p.mode === "manual" && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-black">
              Address, school, business, or landmark
            </span>
            <button
              type="button"
              onClick={runAiLookup}
              disabled={aiLoading}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:brightness-95 disabled:opacity-60"
              title="Look up the address, type, and coordinates"
            >
              <Sparkles className={`h-3.5 w-3.5 ${aiLoading ? "animate-pulse" : ""}`} />
              {aiLoading ? "Retrieving…" : "Retrieve Address"}
            </button>
          </div>
          <PlaceAutocomplete
            value={p.draftArea}
            onChange={p.onChangeArea}
            onSelect={p.onSelectPlace}
            placeholder="Try a school, hospital, business, or address…"
          />
          <span className="text-[11px] text-black/60">
            Pick a result, or type a name and tap <span className="font-semibold">Retrieve Address</span> to auto-fill address and type.
          </span>
          {aiError && <span className="text-[11px] font-medium text-[color:var(--severity-high)]">{aiError}</span>}
          {aiNote && !aiError && <span className="text-[11px] font-medium text-[color:var(--severity-low)]">{aiNote}</span>}
        </div>
      )}


      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-black">Location type</span>
        <select
          value={p.draftType}
          onChange={(e) => p.onChangeType(e.target.value)}
          className="rounded-md border border-border bg-white px-2 py-1.5 text-sm text-black"
        >
          {LOCATION_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <span className="mt-1 text-xs text-black/70">{getTypeCopy(p.draftType).baseIntro}</span>
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={p.onCancel} className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-gray-100">
          Cancel
        </button>
        <button
          onClick={p.onNextFromName}
          disabled={!p.draftName.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-60"
        >
          Start readiness onboarding <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </>
  );
}


function WizardStep(p: SetupModalProps) {
  const section = SECTIONS[p.wizardIndex];
  const isSkipped = p.skipped[section.id];
  const sectionAnswers = p.answers[section.id] ?? {};

  function setAnswer(qKey: string, value: Answer) {
    p.onChangeAnswers({
      ...p.answers,
      [section.id]: { ...sectionAnswers, [qKey]: value },
    });
    if (isSkipped) {
      p.onChangeSkipped({ ...p.skipped, [section.id]: false });
    }
  }

  function yesAll() {
    const next: SectionAnswers = {};
    for (const q of section.questions) next[q.key] = "yes";
    p.onChangeAnswers({ ...p.answers, [section.id]: next });
    p.onChangeSkipped({ ...p.skipped, [section.id]: false });
  }
  function noAll() {
    const next: SectionAnswers = {};
    for (const q of section.questions) next[q.key] = "no";
    p.onChangeAnswers({ ...p.answers, [section.id]: next });
    p.onChangeSkipped({ ...p.skipped, [section.id]: false });
  }
  function skipSection() {
    const cleared: SectionAnswers = {};
    for (const q of section.questions) cleared[q.key] = null;
    p.onChangeAnswers({ ...p.answers, [section.id]: cleared });
    p.onChangeSkipped({ ...p.skipped, [section.id]: true });
    // Auto-advance
    if (p.wizardIndex < SECTIONS.length - 1) p.onChangeWizardIndex(p.wizardIndex + 1);
    else p.onGoReview();
  }

  const isLast = p.wizardIndex === SECTIONS.length - 1;
  const canBack = p.wizardIndex > 0;

  const typeCopy = getTypeCopy(p.draftType);
  const isBase = section.id === "base";
  const heading = isBase ? typeCopy.baseTitle : section.title;
  const description = isBase ? typeCopy.baseIntro : null;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-bold text-foreground">{heading}</h3>
        {isSkipped && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--severity-moderate)]/15 px-2 py-0.5 text-[11px] font-semibold text-[color:var(--severity-moderate)]">
            <AlertTriangle className="h-3 w-3" /> Not assessed · review before printing final guide
          </span>
        )}
      </div>
      {description && (
        <p className="text-sm text-card-foreground/75">{description}</p>
      )}

      <div className="flex flex-wrap gap-1.5">
        <button onClick={yesAll} className="inline-flex items-center gap-1 rounded-full bg-[color:var(--severity-low)]/15 px-3 py-1 text-[11px] font-semibold text-[color:var(--severity-low)] hover:brightness-110">
          <Check className="h-3 w-3" /> Yes to All
        </button>
        <button onClick={noAll} className="inline-flex items-center gap-1 rounded-full bg-[color:var(--severity-moderate)]/15 px-3 py-1 text-[11px] font-semibold text-[color:var(--severity-moderate)] hover:brightness-110">
          <XCircle className="h-3 w-3" /> No to All
        </button>
        <button onClick={skipSection} className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold text-card-foreground/75 hover:bg-surface">
          <SkipForward className="h-3 w-3" /> Skip This Section
        </button>
      </div>

      {(() => {
        const isHazard = section.id !== "base";
        const renderRow = (q: Question) => {
          const v = sectionAnswers[q.key];
          return (
            <li key={q.key} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface/30 px-3 py-2">
              <span className="text-sm text-foreground">{q.q}</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setAnswer(q.key, "yes")}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                    v === "yes"
                      ? "bg-[color:var(--severity-low)] text-white"
                      : "border border-border bg-background text-card-foreground/80 hover:bg-surface"
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setAnswer(q.key, "no")}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                    v === "no"
                      ? "bg-[color:var(--severity-moderate)] text-white"
                      : "border border-border bg-background text-card-foreground/80 hover:bg-surface"
                  }`}
                >
                  No
                </button>
              </div>
            </li>
          );
        };

        if (!isHazard) {
          return <ul className="space-y-2">{section.questions.map(renderRow)}</ul>;
        }

        const cats: QuestionCategory[] = ["know", "equip", "mental"];
        return (
          <div className="space-y-3">
            {cats.map((cat) => {
              const qs = section.questions.filter((q) => q.category === cat);
              if (qs.length === 0) return null;
              return (
                <div key={cat} className="rounded-xl border border-border bg-surface/20 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-card-foreground/55">
                    {CATEGORY_META[cat].label}
                  </p>
                  <p className="text-[11px] text-card-foreground/55">{CATEGORY_META[cat].blurb}</p>
                  <ul className="mt-2 space-y-2">{qs.map(renderRow)}</ul>
                </div>
              );
            })}
          </div>
        );
      })()}

      <div className="flex items-center justify-between gap-2 pt-2">
        <button
          onClick={() => canBack && p.onChangeWizardIndex(p.wizardIndex - 1)}
          disabled={!canBack}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-surface disabled:opacity-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <button
          onClick={() => (isLast ? p.onGoReview() : p.onChangeWizardIndex(p.wizardIndex + 1))}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110"
        >
          {isLast ? "Review Score" : "Next"} <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </>
  );
}

function ReviewStep(p: SetupModalProps) {
  const { overall, hazardScores, gaps } = useMemo(
    () => computeScores(p.answers, p.skipped),
    [p.answers, p.skipped],
  );
  const skippedHazards = HAZARD_SECTION_IDS.filter((d) => p.skipped[d]);
  const fixNow = topFixNow(gaps);

  return (
    <>
      <div className="rounded-xl border border-border bg-surface/30 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-card-foreground/55">Overall Readiness</p>
        <div className="flex items-baseline gap-3">
          <p className="text-3xl font-bold" style={{ color: readinessColor(overall) }}>{overall}%</p>
          <p className="text-sm font-semibold" style={{ color: readinessColor(overall) }}>{readinessLabel(overall)}</p>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-card-foreground/55">Hazard Readiness</p>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {DISASTERS.map(({ id, label, Icon }) => {
            const s = hazardScores[id];
            return (
              <li key={id} className="flex items-center justify-between rounded-md border border-border bg-surface/30 px-3 py-2 text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" /> {label}
                </span>
                <span className="font-semibold tabular-nums" style={{ color: readinessColor(s) }}>
                  {s === null ? "Not Assessed" : `${s}%`}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {skippedHazards.length > 0 && (
        <div className="rounded-md border border-[color:var(--severity-moderate)]/40 bg-[color:var(--severity-moderate)]/5 p-3 text-xs text-[color:var(--severity-moderate)]">
          <b>Not assessed:</b>{" "}
          {skippedHazards.map((d) => DISASTERS.find((x) => x.id === d)?.label).join(", ")} · review before printing the final guide.
        </div>
      )}

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-card-foreground/55">Open Gaps ({gaps.length})</p>
        {gaps.length === 0 ? (
          <p className="mt-1 text-sm text-card-foreground/70">No open gaps. Nicely done.</p>
        ) : (
          <ul className="mt-1 space-y-1 text-sm">
            {gaps.map((g) => (
              <li key={g} className="flex items-start gap-1.5">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 text-[color:var(--severity-moderate)]" />{g}
              </li>
            ))}
          </ul>
        )}
      </div>

      {fixNow.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-card-foreground/55">Top Fix-Now Actions</p>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">
            {fixNow.map((g) => <li key={g}>{g}</li>)}
          </ol>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-2">
        <button
          onClick={() => p.onChangeWizardIndex(SECTIONS.length - 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-surface"
          // Send the user back into the wizard at the last section so they can adjust
          // via Back further; for now we expose a single "Back" to the wizard.
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <button
          onClick={p.onGeneratePlan}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110"
        >
          <Sparkles className="h-3.5 w-3.5" /> Generate Compass Plan
        </button>
      </div>
    </>
  );
}

function GeneratedStep(p: SetupModalProps) {
  const loc = p.draftLocation;
  if (!loc) return null;
  return (
    <>
      <div className="rounded-xl border border-[color:var(--severity-low)]/40 bg-[color:var(--severity-low)]/5 p-4">
        <p className="text-sm font-semibold text-foreground">{loc.name} · {readinessLabel(loc.readinessScore)}</p>
        <p className="mt-1 text-xs text-card-foreground/70">
          Readiness score: <b>{loc.readinessScore}%</b>
        </p>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-card-foreground/55">Generated route plans</p>
        <ul className="mt-1 grid gap-1.5 sm:grid-cols-2">
          {loc.routes.map((r) => (
            <li key={r.disaster} className="rounded-md border border-border bg-surface/40 px-2.5 py-1.5 text-xs">
              <b>{r.label}</b> — {r.firstAction}
            </li>
          ))}
        </ul>
      </div>

      {loc.gaps.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-card-foreground/55">Open gaps</p>
          <ul className="mt-1 space-y-1 text-sm">
            {loc.gaps.map((g) => (
              <li key={g} className="flex items-start gap-1.5">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 text-[color:var(--severity-moderate)]" />{g}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          onClick={p.onClose}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110"
        >
          View my Compass Plan <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </>
  );
}

function SeverityBars({ severity }: { severity: HazardRisk["severity"] }) {
  const { bars, color } = SEVERITY_META[severity];
  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-3 w-1.5 rounded-[1px]"
          style={{ background: i < bars ? color : "rgba(100,116,139,0.22)" }}
        />
      ))}
    </span>
  );
}
