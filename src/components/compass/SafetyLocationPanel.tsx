import { useMemo, useState } from "react";
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
  Waves,
  Flame,
  Wind,
  Thermometer,
  Activity,
  X,
} from "lucide-react";

/**
 * Self-contained Saved Safety Location flow for the Prepare screen.
 *
 * - No backend, no localStorage — React state only.
 * - Default selection: St. John Fisher University (preloaded "Plan Ready").
 * - Use My Location / Enter Manually create session-only custom locations
 *   that move from "Needs Readiness Setup" to "Plan Ready" after onboarding.
 */

type Disaster = "flood" | "earthquake" | "wildfire" | "hurricane" | "heat";

interface RoutePlan {
  disaster: Disaster;
  label: string;
  firstAction: string;
  destination: string;
  safeRoute: string;
  avoid: string;
  why: string;
}

interface OnboardingAnswers {
  people: string;
  elderly: boolean;
  children: boolean;
  pets: boolean;
  medical: boolean;
  powerMedical: boolean;
  accessibility: boolean;
  vehicle: boolean;
  backupTransport: boolean;
  goBag: boolean;
  contactsPrinted: boolean;
  backupPower: boolean;
  drillPracticed: boolean;
  commsPlan: boolean;
  shelterKnown: boolean;
  floodHigherGround: boolean;
  floodAvoidLowRoads: boolean;
  heatCooling: boolean;
  heatBackupPower: boolean;
  hurricaneShelter: boolean;
  hurricanePetAccess: boolean;
  wildfirePrimaryExit: boolean;
  wildfireBackupExit: boolean;
  earthquakeDropCover: boolean;
  earthquakeAssembly: boolean;
}

interface SavedLocation {
  id: string;
  name: string;
  type: string;
  area: string;
  ready: boolean;
  preloaded?: boolean;
  answers?: OnboardingAnswers;
  routes: RoutePlan[];
  readinessScore: number;
  gaps: string[];
}

const DISASTERS: { id: Disaster; label: string; Icon: typeof Waves }[] = [
  { id: "flood", label: "Flood", Icon: Waves },
  { id: "earthquake", label: "Earthquake", Icon: Activity },
  { id: "wildfire", label: "Wildfire", Icon: Flame },
  { id: "hurricane", label: "Hurricane", Icon: Wind },
  { id: "heat", label: "Extreme Heat", Icon: Thermometer },
];

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
    disaster: "wildfire",
    label: "Wildfire",
    firstAction: "Evacuate via primary exit; check air quality alerts",
    destination: "Off-campus shelter via I-490 W",
    safeRoute: "Campus Dr → East Ave → I-490 W toward downtown Rochester",
    avoid: "Wooded perimeter trails, Ellison Park access roads",
    why: "Primary highway exit clears campus quickly; backup is Fairport Rd south.",
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
    disaster: "heat",
    label: "Extreme Heat",
    firstAction: "Move indoors to a cooled common area; hydrate",
    destination: "Campus Center — air-conditioned commons",
    safeRoute: "Shaded walkway via Kearney Hall → Campus Center",
    avoid: "Athletic fields, asphalt lots, midday direct sun",
    why: "Always-cooled common space with charging stations and water access.",
  },
];

const SJFU: SavedLocation = {
  id: "sjfu",
  name: "St. John Fisher University",
  type: "Campus",
  area: "3690 East Ave, Pittsford, NY",
  ready: true,
  preloaded: true,
  routes: SJFU_ROUTES,
  readinessScore: 92,
  gaps: ["Confirm pet-friendly shelter capacity", "Refresh quarterly drill schedule"],
};

const LOCATION_TYPES = ["Home", "School", "Campus", "Community Center", "Church", "Business", "Other"];
const NAME_PRESETS = ["Home", "School", "Community Center"];

function blankAnswers(): OnboardingAnswers {
  return {
    people: "1-3",
    elderly: false,
    children: false,
    pets: false,
    medical: false,
    powerMedical: false,
    accessibility: false,
    vehicle: true,
    backupTransport: false,
    goBag: false,
    contactsPrinted: false,
    backupPower: false,
    drillPracticed: false,
    commsPlan: false,
    shelterKnown: false,
    floodHigherGround: false,
    floodAvoidLowRoads: false,
    heatCooling: false,
    heatBackupPower: false,
    hurricaneShelter: false,
    hurricanePetAccess: false,
    wildfirePrimaryExit: false,
    wildfireBackupExit: false,
    earthquakeDropCover: false,
    earthquakeAssembly: false,
  };
}

const BOOL_KEYS: (keyof OnboardingAnswers)[] = [
  "vehicle", "backupTransport", "goBag", "contactsPrinted", "backupPower",
  "drillPracticed", "commsPlan", "shelterKnown",
  "floodHigherGround", "floodAvoidLowRoads", "heatCooling", "heatBackupPower",
  "hurricaneShelter", "hurricanePetAccess", "wildfirePrimaryExit",
  "wildfireBackupExit", "earthquakeDropCover", "earthquakeAssembly",
];

function scoreFromAnswers(a: OnboardingAnswers): { score: number; gaps: string[] } {
  const positives = BOOL_KEYS.filter((k) => a[k]).length;
  const score = Math.round((positives / BOOL_KEYS.length) * 100);
  const gaps: string[] = [];
  if (!a.goBag) gaps.push("Pack a go-bag");
  if (!a.shelterKnown) gaps.push("Identify a shelter destination");
  if (!a.commsPlan) gaps.push("Create a communication plan");
  if (!a.backupPower) gaps.push("Set a backup power plan");
  if (!a.drillPracticed) gaps.push("Practice a household/site drill");
  if (!a.contactsPrinted) gaps.push("Print emergency contacts");
  if (a.powerMedical && !a.backupPower) gaps.push("Critical: power-dependent medical equipment without backup");
  if (!a.vehicle && !a.backupTransport) gaps.push("Arrange backup transportation");
  return { score, gaps: gaps.slice(0, 6) };
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
      disaster: "wildfire", label: "Wildfire",
      firstAction: "Evacuate early using your primary exit",
      destination: "Designated regional shelter away from fire path",
      safeRoute: "Primary: main highway away from fire direction. Backup: secondary route.",
      avoid: "Forested roads, canyons, single-exit neighborhoods",
      why: "Early evacuation avoids road closures and smoke-blocked exits.",
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
      disaster: "heat", label: "Extreme Heat",
      firstAction: "Move to a cooled space; hydrate every 15 minutes",
      destination: "Nearest cooling center, library, or air-conditioned space",
      safeRoute: "Shaded walking route; avoid direct sun between 11am–4pm",
      avoid: "Parked cars, asphalt lots, sustained outdoor activity",
      why: "Air-conditioned space prevents heatstroke; hydration sustains core temp.",
    },
  ];
}

type SetupMode = null | "device" | "manual";

export function SafetyLocationPanel() {
  const [locations, setLocations] = useState<SavedLocation[]>([SJFU]);
  const [selectedId, setSelectedId] = useState<string>(SJFU.id);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Setup flow state
  const [setupMode, setSetupMode] = useState<SetupMode>(null);
  const [draftName, setDraftName] = useState("Home");
  const [draftType, setDraftType] = useState("Home");
  const [draftArea, setDraftArea] = useState("");
  const [setupStep, setSetupStep] = useState<"name" | "questions" | "results">("name");
  const [answers, setAnswers] = useState<OnboardingAnswers>(blankAnswers());
  const [draftLocationId, setDraftLocationId] = useState<string | null>(null);

  const [selectedDisaster, setSelectedDisaster] = useState<Disaster>("flood");

  const selected = locations.find((l) => l.id === selectedId) ?? SJFU;
  const currentRoute = useMemo(
    () => selected.routes.find((r) => r.disaster === selectedDisaster) ?? selected.routes[0],
    [selected, selectedDisaster],
  );

  function startDeviceFlow() {
    setSetupMode("device");
    setDraftName("Home");
    setDraftType("Home");
    // Mock "current location" area string
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
    setDraftLocationId(null);
  }

  function createDraftAndStartQuestions() {
    const id = `loc-${Date.now()}`;
    const draft: SavedLocation = {
      id,
      name: draftName.trim() || "My location",
      type: draftType,
      area: draftArea.trim() || (setupMode === "device" ? "Current location" : ""),
      ready: false,
      routes: [],
      readinessScore: 0,
      gaps: [],
    };
    setLocations((ls) => [...ls, draft]);
    setDraftLocationId(id);
    setSelectedId(id);
    setAnswers(blankAnswers());
    setSetupStep("questions");
  }

  function finishOnboarding() {
    if (!draftLocationId) return;
    const { score, gaps } = scoreFromAnswers(answers);
    const routes = genericRoutes(draftName, draftArea);
    setLocations((ls) =>
      ls.map((l) =>
        l.id === draftLocationId
          ? { ...l, ready: true, answers, routes, readinessScore: score, gaps }
          : l,
      ),
    );
    setSetupStep("results");
  }

  function closeAfterResults() {
    setSetupMode(null);
    setSetupStep("name");
    setDraftLocationId(null);
  }

  function printGuide() {
    const title = `${selected.name} DisasterCompass Safety Guide`;
    const r = currentRoute;
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title>
<style>
  body{font-family:ui-sans-serif,system-ui,sans-serif;color:#0f172a;max-width:720px;margin:2rem auto;padding:0 1rem;line-height:1.5}
  h1{font-size:22px;margin:0 0 4px}
  h2{font-size:14px;text-transform:uppercase;letter-spacing:.1em;color:#64748b;margin:24px 0 6px}
  .pill{display:inline-block;background:#dcfce7;color:#166534;font-weight:600;padding:2px 10px;border-radius:999px;font-size:12px;margin-left:8px}
  .row{margin:6px 0}
  .muted{color:#475569;font-size:13px}
  ul{padding-left:18px;margin:6px 0}
  .disclaimer{margin-top:32px;padding:12px;border:1px solid #fde68a;background:#fffbeb;border-radius:8px;font-size:12px;color:#92400e}
</style></head><body>
<h1>${title} <span class="pill">Plan Ready</span></h1>
<div class="muted">${selected.type} · ${selected.area || ""}</div>

<h2>Readiness</h2>
<div class="row"><b>Score:</b> ${selected.readinessScore}%</div>

<h2>Selected Disaster</h2>
<div class="row"><b>${r?.label ?? ""}</b></div>

<h2>Recommended Action</h2>
<div class="row">${r?.firstAction ?? ""}</div>

<h2>Safe Destination</h2>
<div class="row">${r?.destination ?? ""}</div>

<h2>Safe Route</h2>
<div class="row">${r?.safeRoute ?? ""}</div>

<h2>Avoid Areas</h2>
<div class="row">${r?.avoid ?? ""}</div>

<h2>Open Gaps</h2>
<ul>${(selected.gaps.length ? selected.gaps : ["No open gaps recorded."]).map((g) => `<li>${g}</li>`).join("")}</ul>

<div class="disclaimer">DisasterCompass complements official alerts, campus safety instructions, and emergency services; it does not replace 911. Actions and routes are rules-based and explainable.</div>
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
  }

  return (
    <section className="dc-card overflow-hidden">
      {/* Header row: dropdown + actions */}
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
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[color:var(--severity-low)]/15 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--severity-low)] ring-1 ring-[color:var(--severity-low)]/30">
                  {selected.ready ? "Plan Ready" : "Needs Readiness Setup"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="inline-flex min-w-[260px] items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-left text-xs font-medium text-foreground hover:bg-surface"
              >
                <span className="truncate">
                  {selected.name} · {selected.ready ? "Plan Ready" : "Needs Readiness Setup"}
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
                              <span className={`block text-[11px] ${l.ready ? "text-[color:var(--severity-low)]" : "text-[color:var(--severity-moderate)]"}`}>
                                {l.ready ? "Plan Ready" : "Needs Readiness Setup"}
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

            <button
              onClick={startDeviceFlow}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface"
            >
              <LocateFixed className="h-3.5 w-3.5" />
              Use My Location
            </button>
            <button
              onClick={startManualFlow}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface"
            >
              <Pencil className="h-3.5 w-3.5" />
              Enter Manually
            </button>
          </div>
        </div>
      </div>

      {/* Body: selected location summary */}
      <div className="p-5">
        {selected.preloaded ? (
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--severity-low)]">
              Campus Community Safety Guide
            </p>
            <h3 className="mt-1 text-xl font-bold tracking-tight">
              Preparedness Mode · Plan Ready
            </h3>
            <p className="mt-1 text-sm text-card-foreground/75">
              This location already has preloaded preparedness data and pre-mapped safety routes.
            </p>
            <p className="mt-2 text-xs italic text-card-foreground/65">
              Plan already prepared. Review routes, fix gaps, or print the guide.
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
          <div className="mb-4 rounded-xl border border-[color:var(--severity-moderate)]/40 bg-[color:var(--severity-moderate)]/5 p-4">
            <p className="text-sm font-semibold text-foreground">
              Answer a few readiness questions so DisasterCompass can build your Compass Plan.
            </p>
            <button
              onClick={() => {
                setDraftLocationId(selected.id);
                setSetupMode("manual");
                setSetupStep("questions");
                setAnswers(blankAnswers());
              }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110"
            >
              Start readiness setup <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {selected.ready && (
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="space-y-4">
              {/* Readiness score + gaps */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-surface/40 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-card-foreground/55">
                    Readiness Score
                  </p>
                  <p className="mt-1 text-3xl font-bold text-foreground">{selected.readinessScore}%</p>
                </div>
                <div className="rounded-xl border border-border bg-surface/40 p-4 sm:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-card-foreground/55">
                    Readiness Gaps
                  </p>
                  {selected.gaps.length === 0 ? (
                    <p className="mt-1 text-sm text-card-foreground/70">No open gaps.</p>
                  ) : (
                    <ul className="mt-1 space-y-1">
                      {selected.gaps.map((g) => (
                        <li key={g} className="flex items-start gap-1.5 text-sm text-card-foreground/80">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--severity-moderate)]" />
                          {g}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

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
                        <Icon className="h-3.5 w-3.5" />
                        {label}
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
                <Printer className="h-3.5 w-3.5" />
                Print Safety Guide
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Setup modal */}
      {setupMode && (
        <SetupModal
          mode={setupMode}
          step={setupStep}
          draftName={draftName}
          draftType={draftType}
          draftArea={draftArea}
          answers={answers}
          onChangeName={setDraftName}
          onChangeType={setDraftType}
          onChangeArea={setDraftArea}
          onChangeAnswers={setAnswers}
          onCancel={cancelSetup}
          onNextFromName={createDraftAndStartQuestions}
          onFinishQuestions={finishOnboarding}
          onClose={closeAfterResults}
          resultLocation={draftLocationId ? locations.find((l) => l.id === draftLocationId) ?? null : null}
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

interface SetupModalProps {
  mode: "device" | "manual";
  step: "name" | "questions" | "results";
  draftName: string;
  draftType: string;
  draftArea: string;
  answers: OnboardingAnswers;
  onChangeName: (s: string) => void;
  onChangeType: (s: string) => void;
  onChangeArea: (s: string) => void;
  onChangeAnswers: (a: OnboardingAnswers) => void;
  onCancel: () => void;
  onNextFromName: () => void;
  onFinishQuestions: () => void;
  onClose: () => void;
  resultLocation: SavedLocation | null;
}

function SetupModal(p: SetupModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={p.onCancel}>
      <div
        className="max-h-[88vh] w-full max-w-2xl overflow-auto rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-card-foreground/55">
              {p.mode === "device" ? "Use My Location" : "Enter Manually"} · Readiness mode
            </p>
            <p className="text-sm font-semibold">
              {p.step === "name" && "Name your safety location"}
              {p.step === "questions" && "Readiness questionnaire"}
              {p.step === "results" && "Your Compass Plan is ready"}
            </p>
          </div>
          <button onClick={p.onCancel} className="rounded-md p-1 text-card-foreground/60 hover:bg-surface">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {p.step === "name" && <NameStep {...p} />}
          {p.step === "questions" && <QuestionsStep {...p} />}
          {p.step === "results" && <ResultsStep {...p} />}
        </div>
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
          <p className="text-xs text-card-foreground/65">
            {p.draftArea || "Detecting…"}
          </p>
        </div>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-card-foreground/55">
          Location name
        </span>
        <input
          value={p.draftName}
          onChange={(e) => p.onChangeName(e.target.value)}
          maxLength={60}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        />
        <div className="mt-1 flex flex-wrap gap-1.5">
          {NAME_PRESETS.map((n) => (
            <button
              key={n}
              onClick={() => p.onChangeName(n)}
              className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] hover:bg-surface"
            >
              {n}
            </button>
          ))}
        </div>
      </label>

      {p.mode === "manual" && (
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-card-foreground/55">
            Address or area
          </span>
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
        <span className="text-[11px] font-semibold uppercase tracking-wide text-card-foreground/55">
          Location type
        </span>
        <select
          value={p.draftType}
          onChange={(e) => p.onChangeType(e.target.value)}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        >
          {LOCATION_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
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
          {p.mode === "device" ? "Create My Compass Plan" : "Continue"}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </>
  );
}

function QuestionsStep(p: SetupModalProps) {
  const a = p.answers;
  const set = (patch: Partial<OnboardingAnswers>) => p.onChangeAnswers({ ...a, ...patch });

  return (
    <>
      <Section title="Household / Site Profile">
        <label className="flex items-center justify-between gap-2 text-sm">
          <span>How many people are usually here?</span>
          <select
            value={a.people}
            onChange={(e) => set({ people: e.target.value })}
            className="rounded-md border border-border bg-background px-2 py-1 text-sm"
          >
            <option>1-3</option>
            <option>4-6</option>
            <option>7-15</option>
            <option>15+</option>
          </select>
        </label>
        <Toggle label="Elderly people present" value={a.elderly} onChange={(v) => set({ elderly: v })} />
        <Toggle label="Toddlers or children" value={a.children} onChange={(v) => set({ children: v })} />
        <Toggle label="Pets" value={a.pets} onChange={(v) => set({ pets: v })} />
        <Toggle label="Medical needs" value={a.medical} onChange={(v) => set({ medical: v })} />
        <Toggle label="Power-dependent medical equipment" value={a.powerMedical} onChange={(v) => set({ powerMedical: v })} />
        <Toggle label="Accessibility needs" value={a.accessibility} onChange={(v) => set({ accessibility: v })} />
        <Toggle label="Vehicle available" value={a.vehicle} onChange={(v) => set({ vehicle: v })} />
        <Toggle label="Backup transportation arranged" value={a.backupTransport} onChange={(v) => set({ backupTransport: v })} />
      </Section>

      <Section title="Preparedness Basics">
        <Toggle label="Go-bag ready" value={a.goBag} onChange={(v) => set({ goBag: v })} />
        <Toggle label="Emergency contacts printed" value={a.contactsPrinted} onChange={(v) => set({ contactsPrinted: v })} />
        <Toggle label="Backup power plan" value={a.backupPower} onChange={(v) => set({ backupPower: v })} />
        <Toggle label="Family or group drill practiced" value={a.drillPracticed} onChange={(v) => set({ drillPracticed: v })} />
        <Toggle label="Communication plan ready" value={a.commsPlan} onChange={(v) => set({ commsPlan: v })} />
        <Toggle label="Shelter destination known" value={a.shelterKnown} onChange={(v) => set({ shelterKnown: v })} />
      </Section>

      <Section title="Hazard-Specific Readiness">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-card-foreground/55">Flood</p>
        <Toggle label="Know higher-ground route" value={a.floodHigherGround} onChange={(v) => set({ floodHigherGround: v })} />
        <Toggle label="Avoid low roads and underpasses" value={a.floodAvoidLowRoads} onChange={(v) => set({ floodAvoidLowRoads: v })} />
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-card-foreground/55">Extreme Heat</p>
        <Toggle label="Cooling location known" value={a.heatCooling} onChange={(v) => set({ heatCooling: v })} />
        <Toggle label="Backup power or charging available" value={a.heatBackupPower} onChange={(v) => set({ heatBackupPower: v })} />
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-card-foreground/55">Hurricane</p>
        <Toggle label="Shelter route known" value={a.hurricaneShelter} onChange={(v) => set({ hurricaneShelter: v })} />
        <Toggle label="Pet or accessibility shelter needs handled" value={a.hurricanePetAccess} onChange={(v) => set({ hurricanePetAccess: v })} />
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-card-foreground/55">Wildfire</p>
        <Toggle label="Primary exit known" value={a.wildfirePrimaryExit} onChange={(v) => set({ wildfirePrimaryExit: v })} />
        <Toggle label="Backup exit known" value={a.wildfireBackupExit} onChange={(v) => set({ wildfireBackupExit: v })} />
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-card-foreground/55">Earthquake</p>
        <Toggle label="Drop, Cover, Hold On practiced" value={a.earthquakeDropCover} onChange={(v) => set({ earthquakeDropCover: v })} />
        <Toggle label="Outdoor assembly area known" value={a.earthquakeAssembly} onChange={(v) => set({ earthquakeAssembly: v })} />
      </Section>

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={p.onCancel} className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-surface">
          Cancel
        </button>
        <button
          onClick={p.onFinishQuestions}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110"
        >
          Generate Route Plans <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </>
  );
}

function ResultsStep(p: SetupModalProps) {
  const loc = p.resultLocation;
  if (!loc) return null;
  return (
    <>
      <div className="rounded-xl border border-[color:var(--severity-low)]/40 bg-[color:var(--severity-low)]/5 p-4">
        <p className="text-sm font-semibold text-foreground">{loc.name} · Plan Ready</p>
        <p className="mt-1 text-xs text-card-foreground/70">
          Readiness score: <b>{loc.readinessScore}%</b>
        </p>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-card-foreground/55">Open gaps</p>
        {loc.gaps.length === 0 ? (
          <p className="mt-1 text-sm text-card-foreground/70">No open gaps. Nicely done.</p>
        ) : (
          <ul className="mt-1 space-y-1 text-sm">
            {loc.gaps.map((g) => (
              <li key={g} className="flex items-start gap-1.5">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 text-[color:var(--severity-moderate)]" />
                {g}
              </li>
            ))}
          </ul>
        )}
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface/30 p-3">
      <p className="text-sm font-bold text-foreground">{title}</p>
      <div className="mt-2 space-y-1.5">{children}</div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-1 py-1 text-sm hover:bg-surface/50">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative h-5 w-9 rounded-full transition-colors ${value ? "bg-[color:var(--severity-low)]" : "bg-card-foreground/20"}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${value ? "left-[18px]" : "left-0.5"}`} />
      </button>
    </label>
  );
}
