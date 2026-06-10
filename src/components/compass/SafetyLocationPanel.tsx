import { useEffect, useMemo, useState } from "react";
import { useLocation } from "../LocationContext";
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

function scoreSection(answers: SectionAnswers, skipped: boolean): number | null {
  if (skipped) return null;
  const answered = Object.values(answers).filter((a) => a !== null);
  if (answered.length === 0) return null;
  const yes = answered.filter((a) => a === "yes").length;
  return Math.round((yes / answered.length) * 100);
}

function computeScores(answers: AllAnswers, skipped: SkipMap): {
  overall: number;
  hazardScores: Record<Disaster, number | null>;
  gaps: string[];
} {
  const hazardScores = {} as Record<Disaster, number | null>;
  for (const d of HAZARD_SECTION_IDS) {
    hazardScores[d] = scoreSection(answers[d] ?? {}, skipped[d]);
  }
  // Overall = yes / answered across all non-skipped sections
  let yes = 0;
  let answered = 0;
  for (const s of SECTIONS) {
    if (skipped[s.id]) continue;
    for (const q of s.questions) {
      const a = answers[s.id]?.[q.key];
      if (a === null || a === undefined) continue;
      answered++;
      if (a === "yes") yes++;
    }
  }
  const overall = answered === 0 ? 0 : Math.round((yes / answered) * 100);

  // Gaps: every "no" answer that has a gap label
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
type SetupStep = "name" | "wizard" | "review" | "generated";

export function SafetyLocationPanel() {
  const { confirmLocation } = useLocation();
  const [locations, setLocations] = useState<SavedLocation[]>([MY_ADDRESS, SJFU]);
  const [selectedId, setSelectedId] = useState<string>(MY_ADDRESS.id);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Setup flow state
  const [setupMode, setSetupMode] = useState<SetupMode>(null);
  const [setupStep, setSetupStep] = useState<SetupStep>("name");
  const [draftName, setDraftName] = useState("Home");
  const [draftType, setDraftType] = useState("Home");
  const [draftArea, setDraftArea] = useState("");
  const [draftLocationId, setDraftLocationId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AllAnswers>(blankAnswers());
  const [skipped, setSkipped] = useState<SkipMap>(blankSkipped());
  const [wizardIndex, setWizardIndex] = useState(0); // 0..SECTIONS.length-1

  const [selectedDisaster, setSelectedDisaster] = useState<Disaster>("flood");

  const selected = locations.find((l) => l.id === selectedId) ?? SJFU;
  const currentRoute = useMemo(
    () => selected.routes.find((r) => r.disaster === selectedDisaster) ?? selected.routes[0],
    [selected, selectedDisaster],
  );

  // Confirm location whenever the active selection is ready (preloaded or user-generated).
  useEffect(() => {
    if (selected.ready) confirmLocation();
  }, [selected.ready, selected.id, confirmLocation]);

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
    setSetupStep("name");
  }
  function cancelSetup() {
    setSetupMode(null);
    setSetupStep("name");
    setAnswers(blankAnswers());
    setSkipped(blankSkipped());
    setWizardIndex(0);
    setDraftLocationId(null);
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

  function generatePlan() {
    if (!draftLocationId) return;
    const { overall, hazardScores, gaps } = computeScores(answers, skipped);
    const routes = genericRoutes(draftName, draftArea);
    setLocations((ls) =>
      ls.map((l) =>
        l.id === draftLocationId
          ? {
              ...l,
              ready: true,
              answers,
              skipped,
              routes,
              readinessScore: overall,
              hazardScores,
              gaps,
            }
          : l,
      ),
    );
    setSetupStep("generated");
  }

  function closeAfterResults() {
    setSetupMode(null);
    setSetupStep("name");
    setDraftLocationId(null);
    setAnswers(blankAnswers());
    setSkipped(blankSkipped());
    setWizardIndex(0);
  }

  function printGuide() {
    const title = `${selected.name} DisasterCompass Safety Guide`;
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

<div class="disclaimer">Follow official emergency instructions and call 911 for life-threatening emergencies. DisasterCompass provides pre-mapped preparedness guidance using preloaded safety data.</div>
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
                className="inline-flex min-w-[260px] items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-left text-xs font-medium text-foreground hover:bg-surface"
              >
                <span className="truncate">
                  {selected.name} · {selected.ready ? readinessLabel(selected.readinessScore) : "Needs Readiness Setup"}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 z-30 mt-1 w-[320px] overflow-hidden rounded-lg border border-border bg-card shadow-xl">
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
                            className={`flex w-full items-start gap-2 px-3 py-2 text-left text-xs hover:bg-surface ${active ? "bg-surface/70" : ""}`}
                          >
                            <MapPin className="mt-0.5 h-3.5 w-3.5 text-card-foreground/60" />
                            <span className="flex-1">
                              <span className="block font-semibold text-foreground">{l.name}</span>
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
              Your Compass Plan is ready. Review routes, fix gaps, or print the guide.
            </p>
          </div>
        ) : (
          <div className="mb-4">
            <h3 className="text-xl font-bold tracking-tight">Set your location</h3>
            <p className="mt-1 text-sm text-card-foreground/75">
              Choose how to add your address so DisasterCompass can build your Compass Plan.
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

        {selected.ready && (
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="space-y-4">
              {/* Score + hazard scores + gaps */}
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

              {selected.gaps.length > 0 && (
                <div className="rounded-xl border border-border bg-surface/40 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-card-foreground/55">
                    Open Gaps
                  </p>
                  <ul className="mt-1 grid gap-1 sm:grid-cols-2">
                    {selected.gaps.map((g) => (
                      <li key={g} className="flex items-start gap-1.5 text-sm text-card-foreground/80">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--severity-moderate)]" />
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disaster selector */}
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
        )}
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
          onChangeAnswers={setAnswers}
          onChangeSkipped={setSkipped}
          onChangeWizardIndex={setWizardIndex}
          onCancel={cancelSetup}
          onNextFromName={createDraftAndStartWizard}
          onGoReview={goToReview}
          onGeneratePlan={generatePlan}
          onClose={closeAfterResults}
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
  onChangeAnswers: (a: AllAnswers) => void;
  onChangeSkipped: (s: SkipMap) => void;
  onChangeWizardIndex: (i: number) => void;
  onCancel: () => void;
  onNextFromName: () => void;
  onGoReview: () => void;
  onGeneratePlan: () => void;
  onClose: () => void;
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
    return `Step 9 of ${totalSteps} · Compass Plan`;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={p.onCancel}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-card-foreground/55">
              {p.mode === "device" ? "Use My Location" : "Enter Manually"} · Readiness Onboarding
            </p>
            <p className="text-sm font-semibold">{stepLabel}</p>
          </div>
          <button onClick={p.onCancel} className="rounded-md p-1 text-card-foreground/60 hover:bg-surface">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar */}
        {p.step !== "name" && <ProgressBar step={p.step} wizardIndex={p.wizardIndex} totalSteps={totalSteps} />}

        <div className="space-y-4 p-5">
          {p.step === "name" && <NameStep {...p} />}
          {p.step === "wizard" && <WizardStep {...p} />}
          {p.step === "review" && <ReviewStep {...p} />}
          {p.step === "generated" && <GeneratedStep {...p} />}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ step, wizardIndex, totalSteps }: { step: SetupStep; wizardIndex: number; totalSteps: number }) {
  const current = step === "wizard" ? wizardIndex + 1 : step === "review" ? 8 : 9;
  const pct = Math.round((current / totalSteps) * 100);
  return (
    <div className="px-5 pt-3">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-card-foreground/10">
        <div className="h-full rounded-full bg-[color:var(--severity-low)] transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function NameStep(p: SetupModalProps) {
  return (
    <>
      {p.mode === "device" && (
        <div className="rounded-lg border border-border bg-surface/40 p-3 text-sm">
          <p className="font-semibold text-foreground">Detected location</p>
          <p className="text-xs text-card-foreground/65">{p.draftArea || "Detecting…"}</p>
        </div>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-card-foreground/55">Location name</span>
        <input
          value={p.draftName}
          onChange={(e) => p.onChangeName(e.target.value)}
          maxLength={60}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        />
        <div className="mt-1 flex flex-wrap gap-1.5">
          {NAME_PRESETS.map((n) => (
            <button key={n} onClick={() => p.onChangeName(n)} className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] hover:bg-surface">
              {n}
            </button>
          ))}
        </div>
      </label>

      {p.mode === "manual" && (
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-card-foreground/55">Address or area</span>
          <input
            value={p.draftArea}
            onChange={(e) => p.onChangeArea(e.target.value)}
            maxLength={200}
            placeholder="123 Main St, City, State"
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          />
        </label>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-card-foreground/55">Location type</span>
        <select
          value={p.draftType}
          onChange={(e) => p.onChangeType(e.target.value)}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        >
          {LOCATION_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={p.onCancel} className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-surface">
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

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-bold text-foreground">{section.title}</h3>
        {isSkipped && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--severity-moderate)]/15 px-2 py-0.5 text-[11px] font-semibold text-[color:var(--severity-moderate)]">
            <AlertTriangle className="h-3 w-3" /> Not assessed · review before printing final guide
          </span>
        )}
      </div>

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
