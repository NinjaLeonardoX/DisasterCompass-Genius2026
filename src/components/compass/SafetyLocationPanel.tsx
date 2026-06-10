import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useLocation } from "../LocationContext";
import { usePhase } from "../PhaseContext";
import { forwardGeocode, inferLocationType, type GeocodeResult, type PlaceSuggestion } from "@/lib/geocoding";
import { HAZARD_RISKS, SEVERITY_META, type HazardRisk } from "@/data/prepare";
import { generateCompassPlan } from "@/lib/compass-plan.functions";
import { lookupPlaceDetails } from "@/lib/place-lookup.functions";
import { PlaceAutocomplete } from "./PlaceAutocomplete";

const PrepareRiskMap = lazy(() => import("./PrepareRiskMap"));
import { RouteTrainingPanel } from "./RouteTrainingPanel";
import {
  MapPin,
  LocateFixed,
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

interface Question {
  key: string;
  q: string;
  /** Optional human-readable gap label when answered "no". */
  gap?: string;
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
      { key: "higher", q: "Do you know your nearest higher-ground location?", gap: "Higher-ground destination not confirmed" },
      { key: "avoid", q: "Do you know which roads, bridges, or underpasses to avoid?", gap: "Flood-avoid roads not mapped" },
      { key: "route", q: "Do you have a route that avoids low areas?", gap: "Flood-safe route not confirmed" },
      { key: "transport", q: "Is transportation arranged if you must leave?", gap: "No transportation arranged" },
      { key: "blocked", q: "Do you know what to do if water blocks your route?", gap: "No backup plan if route is blocked" },
      { key: "bag", q: "Is your go-bag ready to leave quickly?", gap: "Go-bag not ready" },
    ],
  },
  {
    id: "earthquake",
    title: "Earthquake Readiness",
    questions: [
      { key: "drop", q: "Has everyone practiced Drop, Cover, and Hold On?", gap: "Drop/Cover/Hold not practiced" },
      { key: "indoor", q: "Do you know where to shelter indoors?", gap: "Indoor shelter spot not chosen" },
      { key: "assembly", q: "Do you know the outdoor assembly point after shaking stops?", gap: "Assembly area not confirmed" },
      { key: "avoid", q: "Do you know what areas to avoid after shaking?", gap: "Post-shaking avoid zones unclear" },
      { key: "contacts", q: "Are emergency contacts printed?", gap: "Emergency contacts not printed" },
      { key: "bag", q: "Is the go-bag accessible after shaking?", gap: "Go-bag not accessible" },
    ],
  },
  {
    id: "heat",
    title: "Extreme Heat Readiness",
    questions: [
      { key: "cooling", q: "Do you know your nearest cooling center?", gap: "Cooling center not confirmed" },
      { key: "backup", q: "Do you have a backup cooling plan if power fails?", gap: "Backup cooling plan missing" },
      { key: "water", q: "Is water available for the household/group?", gap: "Water supply not confirmed" },
      { key: "risk", q: "Are elderly, children, or medical-risk people identified?", gap: "Medical-risk people not identified" },
      { key: "charging", q: "Do you have a charging plan for phones or medical devices?", gap: "Charging plan missing" },
      { key: "transport", q: "Is transport arranged if cooling is needed?", gap: "Cooling transport not arranged" },
    ],
  },
  {
    id: "hurricane",
    title: "Hurricane Readiness",
    questions: [
      { key: "route", q: "Do you know your evacuation or shelter route?", gap: "Shelter route not confirmed" },
      { key: "stay", q: "Do you know where to shelter if you stay?", gap: "Stay-in-place shelter not chosen" },
      { key: "pets", q: "Is the shelter pet/accessibility compatible?", gap: "Pet/accessibility shelter fit not confirmed" },
      { key: "transport", q: "Is transportation arranged before roads fill?", gap: "Transportation not arranged" },
      { key: "bag", q: "Is your go-bag ready for several days?", gap: "Multi-day go-bag not ready" },
      { key: "contact", q: "Do you know who to contact if separated?", gap: "Contact plan missing" },
    ],
  },
  {
    id: "wildfire",
    title: "Wildfire Readiness",
    questions: [
      { key: "primary", q: "Do you know your primary exit route?", gap: "Primary exit not confirmed" },
      { key: "backup", q: "Do you know your backup exit route?", gap: "Backup route not confirmed" },
      { key: "bag", q: "Is your go-bag ready?", gap: "Go-bag not ready" },
      { key: "wind", q: "Do you know what direction to avoid if fire or smoke spreads?", gap: "Smoke-avoid direction unclear" },
      { key: "transport", q: "Is transportation ready?", gap: "Transportation not ready" },
      { key: "items", q: "Are pets, medications, and documents ready to move quickly?", gap: "Pet/medication/document plan missing" },
    ],
  },
  {
    id: "winter",
    title: "Winter Storm Readiness",
    questions: [
      { key: "warming", q: "Do you know your nearest warming center?", gap: "Warming center not confirmed" },
      { key: "heat", q: "Do you have a backup heat plan if power fails?", gap: "Backup heat plan missing" },
      { key: "supplies", q: "Do you have food, water, and medications for several days?", gap: "Food/water/medicine supply not confirmed" },
      { key: "charging", q: "Do you have a phone or medical-device charging plan?", gap: "Charging plan missing" },
      { key: "roads", q: "Do you know which icy roads, bridges, or steep routes to avoid?", gap: "Winter-safe route not confirmed" },
      { key: "transport", q: "Is transportation arranged if you must go to a warming center?", gap: "Warming-center transport not arranged" },
    ],
  },
];

const HAZARD_SECTION_IDS: Disaster[] = ["flood", "earthquake", "heat", "hurricane", "wildfire", "winter"];

// ─────────────────────────────────────────────────────────────────────────────
// Seeded SJFU plan
// ─────────────────────────────────────────────────────────────────────────────

const SJFU_ROUTES: RoutePlan[] = [
  {
    disaster: "flood",
    label: "Flood",
    firstAction: "Move to higher ground immediately",
    destination: "Lavery Library (upper floors) · on-campus high ground",
    safeRoute: "East Ave → Campus Dr → Lavery Library entrance",
    avoid: "Irondequoit Creek crossings, low underpasses on East Ave",
    why: "Lavery Library sits above the local floodplain and is the closest sheltered upper-floor space.",
  },
  {
    disaster: "earthquake",
    label: "Earthquake",
    firstAction: "Drop, Cover, Hold On — then go to outdoor assembly",
    destination: "Polisseni Track & Field — open outdoor assembly area",
    safeRoute: "Exit nearest building → walk around brick facades → Polisseni Field",
    avoid: "Brick facades, glass atriums, parking structures",
    why: "Open field clear of falling debris; pre-designated campus muster point.",
  },
  {
    disaster: "heat",
    label: "Extreme Heat",
    firstAction: "Move indoors to a cooled common area; hydrate",
    destination: "Campus Center — air-conditioned commons",
    safeRoute: "Shaded walkway via Kearney Hall → Campus Center",
    avoid: "Athletic fields, asphalt lots, midday direct sun",
    why: "Always-cooled common space with charging stations and water access.",
  },
  {
    disaster: "hurricane",
    label: "Hurricane",
    firstAction: "Shelter in place in an interior ground-floor room",
    destination: "Student Wellness Center — interior corridors",
    safeRoute: "Cross via covered walkways → Student Wellness Center",
    avoid: "Quad open spaces, windowed lounges, tree-lined paths",
    why: "Reinforced interior space rated for high-wind shelter; pet-friendly room available.",
  },
  {
    disaster: "wildfire",
    label: "Wildfire",
    firstAction: "Evacuate via primary exit; check air quality alerts",
    destination: "Off-campus shelter via I-490 W",
    safeRoute: "Campus Dr → East Ave → I-490 W toward downtown Rochester",
    avoid: "Wooded perimeter trails, Ellison Park access roads",
    why: "Primary highway exit clears campus quickly; backup is Fairport Rd south.",
  },
  {
    disaster: "winter",
    label: "Winter Storm",
    firstAction: "Walk indoors via the main walkway to the campus warming center",
    destination: "Campus Warming & Charging Center — Campus Center commons",
    safeRoute: "Winter Safe Route — Main Walkway / Main Road → Campus Center",
    avoid: "Icy bridge path, steep service road, exposed outer walkway, unplowed parking edge",
    why: "Winter route avoids icy bridges and exposed paths; warming center keeps power and heat.",
  },
];

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

const MY_ADDRESS: SavedLocation = {
  id: "my-address",
  name: "My Address",
  type: "Home",
  area: "",
  ready: false,
  answers: blankAnswers(),
  skipped: blankSkipped(),
  routes: [],
  readinessScore: 0,
  hazardScores: { flood: null, earthquake: null, heat: null, hurricane: null, wildfire: null, winter: null },
  gaps: [],
};

const SJFU: SavedLocation = {
  id: "sjfu",
  name: "St. John Fisher University",
  type: "Campus",
  area: "3690 East Ave, Pittsford, NY",
  ready: true,
  geo: {
    lat: 43.0913,
    lng: -77.524,
    displayName: "St. John Fisher University, 3690 East Ave, Pittsford, NY",
    city: "Pittsford",
    county: "Monroe County",
    state: "New York",
    stateCode: "NY",
    country: "United States",
    countryCode: "us",
  },
  preloaded: true,
  answers: allYesAnswers(),
  skipped: blankSkipped(),
  routes: SJFU_ROUTES,
  readinessScore: 92,
  hazardScores: { flood: 95, earthquake: 90, heat: 95, hurricane: 90, wildfire: 88, winter: 92 },
  gaps: ["Confirm pet-friendly shelter capacity", "Refresh quarterly drill schedule"],
};

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
    peopleTab: "Household",
    peopleHeading: "Who lives here",
    peopleIntro: "Who needs to be accounted for when an alert fires — family, pets, and access needs.",
    baseTitle: "Household Profile",
    baseIntro: "Tell us about the people, pets, and access needs in your household so the plan accounts for everyone.",
    planIntro: "Your household Compass Plan is ready. Review routes, fix gaps, or print the guide.",
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
  const [locations, setLocations] = useState<SavedLocation[]>([MY_ADDRESS, SJFU]);
  const [selectedId, setSelectedId] = useState<string>(MY_ADDRESS.id);
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
  const [bodyTab, setBodyTab] = useState<"overview" | "people" | "risk" | "routes" | "gaps">("overview");
  const [riskHazardId, setRiskHazardId] = useState<string>("flood");
  const [mapMounted, setMapMounted] = useState(false);
  useEffect(() => setMapMounted(true), []);
  const { activePhase } = usePhase();
  const showRiskMap = activePhase === "prepare";

  const selected = locations.find((l) => l.id === selectedId) ?? SJFU;
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
    setDraftArea("Detected near your current location");
    setSetupStep("name");
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

                {/* Gaps tab */}
                {bodyTab === "gaps" && (
                  <div className="rounded-xl border border-border bg-surface/40 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-card-foreground/55">
                      Open Gaps
                    </p>
                    {selected.gaps.length === 0 ? (
                      <p className="mt-1 text-sm text-card-foreground/70">No open gaps recorded. Nicely done.</p>
                    ) : (
                      <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                        {selected.gaps.map((g) => (
                          <li key={g} className="flex items-start gap-1.5 text-sm text-card-foreground/80">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--severity-moderate)]" />
                            {g}
                          </li>
                        ))}
                      </ul>
                    )}
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
          <p className="font-semibold text-black">Detected location</p>
          <p className="text-xs text-black">{p.draftArea || "Detecting…"}</p>
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
              className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--severity-moderate)]/40 bg-[color:var(--severity-moderate)]/10 px-2.5 py-1 text-[11px] font-semibold text-[color:var(--severity-moderate)] hover:brightness-95 disabled:opacity-60"
              title="Use AI to fill address, type, and coordinates"
            >
              <Sparkles className={`h-3.5 w-3.5 ${aiLoading ? "animate-pulse" : ""}`} />
              {aiLoading ? "Generating…" : "Generate with AI"}
            </button>
          </div>
          <PlaceAutocomplete
            value={p.draftArea}
            onChange={p.onChangeArea}
            onSelect={p.onSelectPlace}
            placeholder="Try a school, hospital, business, or address…"
          />
          <span className="text-[11px] text-black/60">
            Pick a result, or type a name and tap <span className="font-semibold">Generate with AI</span> to auto-fill address and type.
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

      <ul className="space-y-2">
        {section.questions.map((q) => {
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
        })}
      </ul>

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
