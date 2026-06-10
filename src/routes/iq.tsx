import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Brain,
  Settings2,
  Save,
  Plus,
  Trash2,
  Send,
  MapPin,
  Sparkles,
  Cloud,
  Users,
  Siren,
  CheckCircle2,
  Radio,
  Route as RouteIcon,
  ArrowLeft,
  Edit3,
} from "lucide-react";
import { WeatherCard } from "@/components/WeatherCard";
import { forwardGeocode, type GeocodeResult } from "@/lib/geocoding";

export const Route = createFileRoute("/iq")({
  head: () => ({
    meta: [
      { title: "IQ Engine — Disaster Compass" },
      {
        name: "description",
        content:
          "Tune the route scoring rules, manage beacons and volunteers, and broadcast safe routes from the Route Safety IQ console.",
      },
    ],
  }),
  component: IQEnginePage,
});

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Weights = {
  distance: number;
  elevation: number;
  floodExposure: number;
  blockedRoads: number;
  shelterFit: number;
  accessibility: number;
};

type Model = { id: string; name: string; weights: Weights; savedAt: number };

type Beacon = {
  id: string;
  what: string;
  where: string;
  urgency: "Urgent" | "Soon" | "Whenever";
  status: "Open" | "Matched" | "Completed";
  helper?: string;
  createdAt: number;
};

type Volunteer = {
  id: string;
  name: string;
  skills: string[]; // e.g. ["water", "ride", "medicine"]
  area: string;
  vehicle: "Car" | "Truck" | "Van" | "None";
  available: boolean;
};

type Broadcast = {
  id: string;
  origin: string;
  destination: string;
  rule: string;
  score: number;
  sentAt: number;
  recipients: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_WEIGHTS: Weights = {
  distance: 20,
  elevation: 15,
  floodExposure: 25,
  blockedRoads: 20,
  shelterFit: 10,
  accessibility: 10,
};

const SEED_BEACONS: Beacon[] = [
  { id: "b1", what: "Drinking water", where: "Maple St & 4th", urgency: "Urgent", status: "Open", createdAt: Date.now() - 9e5 },
  { id: "b2", what: "Medicine pickup", where: "Oak Ave & 3rd", urgency: "Urgent", status: "Matched", helper: "Ana", createdAt: Date.now() - 6e5 },
  { id: "b3", what: "Wellness check", where: "Pine Road", urgency: "Soon", status: "Open", createdAt: Date.now() - 3e5 },
];

const SEED_VOLUNTEERS: Volunteer[] = [
  { id: "v1", name: "Ana R.", skills: ["medicine", "ride"], area: "Oak Ave", vehicle: "Car", available: true },
  { id: "v2", name: "Marco D.", skills: ["water", "truck", "cleanup"], area: "Cedar Lane", vehicle: "Truck", available: true },
  { id: "v3", name: "Priya S.", skills: ["wellness", "ride"], area: "Pine Road", vehicle: "Car", available: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// Storage helpers
// ─────────────────────────────────────────────────────────────────────────────

function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value]);
  return [value, setValue] as const;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scoring
// ─────────────────────────────────────────────────────────────────────────────

type SampleRoute = {
  id: string;
  label: string;
  // Per-factor sub-scores (0–100). Higher is better/safer.
  factors: Weights;
};

const SAMPLE_ROUTES: SampleRoute[] = [
  {
    id: "r1",
    label: "Main St → Community Center",
    factors: { distance: 80, elevation: 70, floodExposure: 90, blockedRoads: 95, shelterFit: 85, accessibility: 80 },
  },
  {
    id: "r2",
    label: "River Rd → North Heights",
    factors: { distance: 65, elevation: 90, floodExposure: 40, blockedRoads: 60, shelterFit: 70, accessibility: 65 },
  },
  {
    id: "r3",
    label: "Hwy 9 → Civic Plaza Shelter",
    factors: { distance: 50, elevation: 80, floodExposure: 75, blockedRoads: 80, shelterFit: 95, accessibility: 90 },
  },
];

function scoreRoute(weights: Weights, factors: Weights): number {
  const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  const sum = (Object.keys(weights) as (keyof Weights)[])
    .reduce((acc, k) => acc + (weights[k] / total) * factors[k], 0);
  return Math.round(sum);
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

function IQEnginePage() {
  const [weights, setWeights] = useLocalState<Weights>("iq:weights", DEFAULT_WEIGHTS);
  const [models, setModels] = useLocalState<Model[]>("iq:models", []);
  const [beacons, setBeacons] = useLocalState<Beacon[]>("iq:beacons", SEED_BEACONS);
  const [volunteers, setVolunteers] = useLocalState<Volunteer[]>("iq:volunteers", SEED_VOLUNTEERS);
  const [broadcasts, setBroadcasts] = useLocalState<Broadcast[]>("iq:broadcasts", []);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--severity-moderate)]">
            <Brain className="h-3.5 w-3.5" /> Engine console
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">IQ Engine</h1>
          <p className="mt-1 max-w-2xl text-sm text-[color:var(--muted-foreground)]">
            Configure the rules behind GO / STAY / WAIT, save scoring models, manage beacons and volunteers, and
            broadcast safe routes from the Route Safety IQ console.
          </p>
        </div>
        <Link to="/compass" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-card-foreground/5">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Compass
        </Link>
      </header>

      <RouteSafetyIQ
        weights={weights}
        beaconCount={beacons.filter((b) => b.status !== "Completed").length}
        onBroadcast={(b) => setBroadcasts((prev) => [b, ...prev].slice(0, 20))}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <RulesPanel weights={weights} setWeights={setWeights} models={models} setModels={setModels} />
        <ScorePanel weights={weights} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BeaconsPanel beacons={beacons} setBeacons={setBeacons} volunteers={volunteers} />
        <VolunteersPanel volunteers={volunteers} setVolunteers={setVolunteers} />
      </div>

      <BroadcastsPanel broadcasts={broadcasts} setBroadcasts={setBroadcasts} />
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Route Safety IQ
// ─────────────────────────────────────────────────────────────────────────────

function RouteSafetyIQ({
  weights,
  beaconCount,
  onBroadcast,
}: {
  weights: Weights;
  beaconCount: number;
  onBroadcast: (b: Broadcast) => void;
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState<GeocodeResult | null>(null);
  const [routes, setRoutes] = useState<SampleRoute[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  const scored = useMemo(
    () =>
      routes
        .map((r) => ({ route: r, score: scoreRoute(weights, r.factors) }))
        .sort((a, b) => b.score - a.score),
    [routes, weights],
  );

  async function lookup() {
    if (query.trim().length < 3) {
      setError("Type a city, school, or address (3+ chars).");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const geo = await forwardGeocode(query);
      if (!geo) {
        setError("Couldn't find that location. Try a more specific address.");
        return;
      }
      setOrigin(geo);
      setRoutes(SAMPLE_ROUTES);
      setSelectedId(SAMPLE_ROUTES[0].id);
      setSent(null);
    } finally {
      setLoading(false);
    }
  }

  function broadcast() {
    if (!origin || !selectedId) return;
    const pick = scored.find((s) => s.route.id === selectedId);
    if (!pick) return;
    const b: Broadcast = {
      id: `bc${Date.now()}`,
      origin: origin.displayName.split(",").slice(0, 2).join(","),
      destination: pick.route.label,
      rule: "Top-scored route under current weights",
      score: pick.score,
      sentAt: Date.now(),
      recipients: beaconCount,
    };
    onBroadcast(b);
    setSent(`Transmitted to ${beaconCount} beacon${beaconCount === 1 ? "" : "s"}.`);
  }

  return (
    <section className="dc-card dc-elev-hero overflow-hidden p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[color:var(--severity-moderate)]" />
          <h2 className="text-lg font-bold tracking-tight">Route Safety IQ</h2>
        </div>
        <span className="text-[11px] text-card-foreground/60">Weather + rules + routes, transmitted to beacons.</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[260px]">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-card-foreground/50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookup()}
            placeholder="Type a location (e.g. Tampa, FL or Lincoln High School)…"
            className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm text-foreground"
          />
        </div>
        <button
          onClick={lookup}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--severity-moderate)] px-4 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Looking up…" : "Look up"}
        </button>
      </div>

      {error && <p className="mt-2 text-xs font-medium text-[color:var(--severity-high)]">{error}</p>}

      {origin && (
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-white p-3 text-xs">
              <p className="font-semibold text-card-foreground/70">Origin</p>
              <p className="text-sm font-bold">{origin.displayName}</p>
              <p className="text-card-foreground/60">
                {origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}
              </p>
            </div>
            <WeatherCard lat={origin.lat} lng={origin.lng} />
          </div>

          <div className="rounded-xl border border-border bg-white p-4">
            <div className="flex items-center gap-2">
              <RouteIcon className="h-4 w-4 text-[color:var(--severity-low)]" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Generated routes</h3>
            </div>
            <p className="mt-1 text-[11px] text-card-foreground/60">Scored with current weights. Pick one to transmit.</p>
            <ul className="mt-3 space-y-2">
              {scored.map(({ route, score }, i) => {
                const selected = selectedId === route.id;
                const tone =
                  score >= 80 ? "var(--severity-low)" : score >= 60 ? "var(--severity-moderate)" : "var(--severity-high)";
                return (
                  <li key={route.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(route.id)}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left text-sm transition ${
                        selected ? "border-transparent shadow-sm" : "border-border bg-background hover:bg-card-foreground/5"
                      }`}
                      style={
                        selected
                          ? { background: `color-mix(in oklab, ${tone} 12%, transparent)`, boxShadow: `0 0 0 2px ${tone}` }
                          : undefined
                      }
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          #{i + 1} · {route.label}
                        </p>
                        <p className="text-[11px] text-card-foreground/60">
                          dist {route.factors.distance} · elev {route.factors.elevation} · flood {route.factors.floodExposure}
                        </p>
                      </div>
                      <span
                        className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold"
                        style={{ background: `color-mix(in oklab, ${tone} 18%, transparent)`, color: tone }}
                      >
                        {score}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] text-card-foreground/60">
                {beaconCount} active beacon{beaconCount === 1 ? "" : "s"} will receive this route.
              </p>
              <button
                onClick={broadcast}
                disabled={!selectedId || beaconCount === 0}
                className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--severity-low)] px-4 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" /> Transmit to beacons
              </button>
            </div>
            {sent && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[color:var(--severity-low)]">
                <CheckCircle2 className="h-3.5 w-3.5" /> {sent}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Rules + saved models
// ─────────────────────────────────────────────────────────────────────────────

const WEIGHT_LABELS: Record<keyof Weights, string> = {
  distance: "Distance",
  elevation: "Elevation gain",
  floodExposure: "Flood exposure",
  blockedRoads: "Blocked-road avoidance",
  shelterFit: "Shelter fit",
  accessibility: "Accessibility",
};

function RulesPanel({
  weights,
  setWeights,
  models,
  setModels,
}: {
  weights: Weights;
  setWeights: (w: Weights) => void;
  models: Model[];
  setModels: (m: Model[]) => void;
}) {
  const [modelName, setModelName] = useState("");
  const total = Object.values(weights).reduce((a, b) => a + b, 0);

  function save() {
    const name = modelName.trim() || `Model ${models.length + 1}`;
    setModels([{ id: `m${Date.now()}`, name, weights, savedAt: Date.now() }, ...models]);
    setModelName("");
  }

  return (
    <section className="dc-card p-5">
      <div className="flex items-center gap-2">
        <Settings2 className="h-4 w-4 text-[color:var(--severity-moderate)]" />
        <h3 className="text-sm font-bold uppercase tracking-wider">Rules · Route weights</h3>
      </div>
      <p className="mt-1 text-xs text-card-foreground/65">
        Total weight: <span className="font-semibold text-foreground">{total}</span> (auto-normalized when scoring).
      </p>

      <div className="mt-4 space-y-3">
        {(Object.keys(weights) as (keyof Weights)[]).map((k) => (
          <div key={k}>
            <div className="flex items-center justify-between text-xs">
              <label htmlFor={`w-${k}`} className="font-semibold">{WEIGHT_LABELS[k]}</label>
              <span className="font-mono text-card-foreground/70">{weights[k]}</span>
            </div>
            <input
              id={`w-${k}`}
              type="range"
              min={0}
              max={50}
              value={weights[k]}
              onChange={(e) => setWeights({ ...weights, [k]: Number(e.target.value) })}
              className="mt-1 w-full accent-[color:var(--severity-moderate)]"
            />
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
        <input
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          placeholder="Model name (e.g. Coastal · Hurricane)"
          className="flex-1 min-w-[200px] rounded-lg border border-border bg-white px-3 py-1.5 text-xs"
        />
        <button onClick={save} className="inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--severity-moderate)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110">
          <Save className="h-3.5 w-3.5" /> Save model
        </button>
        <button onClick={() => setWeights(DEFAULT_WEIGHTS)} className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-card-foreground/5">
          Reset
        </button>
      </div>

      {models.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-card-foreground/65">Saved models</p>
          <ul className="space-y-1.5">
            {models.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-white p-2 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{m.name}</p>
                  <p className="text-card-foreground/55">{new Date(m.savedAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setWeights(m.weights)} className="rounded-md border border-border px-2 py-1 font-semibold hover:bg-card-foreground/5">
                    Load
                  </button>
                  <button onClick={() => setModels(models.filter((x) => x.id !== m.id))} className="rounded-md p-1 text-[color:var(--severity-high)] hover:bg-card-foreground/5" aria-label="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Score panel
// ─────────────────────────────────────────────────────────────────────────────

function ScorePanel({ weights }: { weights: Weights }) {
  const scored = useMemo(
    () =>
      SAMPLE_ROUTES.map((r) => ({ route: r, score: scoreRoute(weights, r.factors) })).sort((a, b) => b.score - a.score),
    [weights],
  );
  return (
    <section className="dc-card p-5">
      <div className="flex items-center gap-2">
        <RouteIcon className="h-4 w-4 text-[color:var(--severity-low)]" />
        <h3 className="text-sm font-bold uppercase tracking-wider">Route score calculation</h3>
      </div>
      <p className="mt-1 text-xs text-card-foreground/65">
        Live preview against three sample routes. Score = weighted sum (normalized) of per-factor sub-scores.
      </p>
      <ul className="mt-4 space-y-3">
        {scored.map(({ route, score }) => {
          const tone = score >= 80 ? "var(--severity-low)" : score >= 60 ? "var(--severity-moderate)" : "var(--severity-high)";
          return (
            <li key={route.id} className="rounded-lg border border-border bg-white p-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{route.label}</p>
                <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: `color-mix(in oklab, ${tone} 18%, transparent)`, color: tone }}>
                  {score}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-card-foreground/10">
                <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: tone }} />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-card-foreground/60">
                {(Object.keys(route.factors) as (keyof Weights)[]).map((k) => (
                  <span key={k}>
                    {WEIGHT_LABELS[k]}: <span className="font-mono text-card-foreground/80">{route.factors[k]}</span>
                  </span>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Beacons CRUD
// ─────────────────────────────────────────────────────────────────────────────

const URGENCY_TONE: Record<Beacon["urgency"], string> = {
  Urgent: "var(--severity-high)",
  Soon: "var(--severity-moderate)",
  Whenever: "var(--severity-low)",
};

function matchBeacon(b: Beacon, volunteers: Volunteer[]): Volunteer | null {
  const need = b.what.toLowerCase();
  const candidates = volunteers
    .filter((v) => v.available)
    .filter((v) => v.skills.some((s) => need.includes(s)));
  return candidates[0] ?? null;
}

function BeaconsPanel({
  beacons,
  setBeacons,
  volunteers,
}: {
  beacons: Beacon[];
  setBeacons: (b: Beacon[]) => void;
  volunteers: Volunteer[];
}) {
  const [what, setWhat] = useState("");
  const [where, setWhere] = useState("");
  const [urgency, setUrgency] = useState<Beacon["urgency"]>("Urgent");

  function add() {
    if (!what.trim() || !where.trim()) return;
    setBeacons([
      { id: `b${Date.now()}`, what: what.trim(), where: where.trim(), urgency, status: "Open", createdAt: Date.now() },
      ...beacons,
    ]);
    setWhat("");
    setWhere("");
  }

  function setStatus(id: string, status: Beacon["status"]) {
    setBeacons(beacons.map((b) => (b.id === id ? { ...b, status } : b)));
  }

  function autoMatch(id: string) {
    const b = beacons.find((x) => x.id === id);
    if (!b) return;
    const v = matchBeacon(b, volunteers);
    if (!v) return;
    setBeacons(beacons.map((x) => (x.id === id ? { ...x, helper: v.name, status: "Matched" } : x)));
  }

  return (
    <section className="dc-card p-5">
      <div className="flex items-center gap-2">
        <Siren className="h-4 w-4 text-[color:var(--severity-high)]" />
        <h3 className="text-sm font-bold uppercase tracking-wider">Beacons · need help</h3>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
        <input value={what} onChange={(e) => setWhat(e.target.value)} placeholder="What (e.g. water)" className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs" />
        <input value={where} onChange={(e) => setWhere(e.target.value)} placeholder="Where" className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs" />
        <select value={urgency} onChange={(e) => setUrgency(e.target.value as Beacon["urgency"])} className="rounded-lg border border-border bg-white px-2 py-1.5 text-xs">
          <option>Urgent</option>
          <option>Soon</option>
          <option>Whenever</option>
        </select>
        <button onClick={add} className="inline-flex items-center gap-1 rounded-lg bg-[color:var(--severity-high)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110">
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {beacons.map((b) => {
          const tone = URGENCY_TONE[b.urgency];
          return (
            <li key={b.id} className="rounded-lg border border-border bg-white p-3 text-xs">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: tone }} />
                    <p className="font-semibold">{b.what}</p>
                    <span className="rounded-full bg-card-foreground/5 px-2 py-0.5 text-[10px] font-semibold">{b.urgency}</span>
                  </div>
                  <p className="mt-0.5 text-card-foreground/65">
                    {b.where} {b.helper && `· helper: ${b.helper}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <select
                    value={b.status}
                    onChange={(e) => setStatus(b.id, e.target.value as Beacon["status"])}
                    className="rounded-md border border-border bg-white px-1.5 py-1 text-[11px]"
                  >
                    <option>Open</option>
                    <option>Matched</option>
                    <option>Completed</option>
                  </select>
                  {b.status === "Open" && (
                    <button onClick={() => autoMatch(b.id)} className="rounded-md border border-border px-2 py-1 text-[11px] font-semibold hover:bg-card-foreground/5">
                      Auto-match
                    </button>
                  )}
                  <button onClick={() => setBeacons(beacons.filter((x) => x.id !== b.id))} className="rounded-md p-1 text-[color:var(--severity-high)] hover:bg-card-foreground/5" aria-label="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
        {beacons.length === 0 && <li className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-card-foreground/55">No beacons yet.</li>}
      </ul>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Volunteers CRUD
// ─────────────────────────────────────────────────────────────────────────────

function VolunteersPanel({
  volunteers,
  setVolunteers,
}: {
  volunteers: Volunteer[];
  setVolunteers: (v: Volunteer[]) => void;
}) {
  const [name, setName] = useState("");
  const [skills, setSkills] = useState("");
  const [area, setArea] = useState("");
  const [vehicle, setVehicle] = useState<Volunteer["vehicle"]>("Car");
  const [editing, setEditing] = useState<string | null>(null);

  function add() {
    if (!name.trim()) return;
    setVolunteers([
      {
        id: `v${Date.now()}`,
        name: name.trim(),
        skills: skills.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
        area: area.trim() || "Nearby",
        vehicle,
        available: true,
      },
      ...volunteers,
    ]);
    setName("");
    setSkills("");
    setArea("");
  }

  function toggleAvailable(id: string) {
    setVolunteers(volunteers.map((v) => (v.id === id ? { ...v, available: !v.available } : v)));
  }

  return (
    <section className="dc-card p-5">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-[color:var(--severity-low)]" />
        <h3 className="text-sm font-bold uppercase tracking-wider">Volunteers · matching pool</h3>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto_auto]">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs" />
        <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Skills (water, ride…)" className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs" />
        <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Area" className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs" />
        <select value={vehicle} onChange={(e) => setVehicle(e.target.value as Volunteer["vehicle"])} className="rounded-lg border border-border bg-white px-2 py-1.5 text-xs">
          <option>Car</option>
          <option>Truck</option>
          <option>Van</option>
          <option>None</option>
        </select>
        <button onClick={add} className="inline-flex items-center gap-1 rounded-lg bg-[color:var(--severity-low)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110">
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {volunteers.map((v) => {
          const isEditing = editing === v.id;
          return (
            <li key={v.id} className="rounded-lg border border-border bg-white p-3 text-xs">
              {isEditing ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <input value={v.name} onChange={(e) => setVolunteers(volunteers.map((x) => (x.id === v.id ? { ...x, name: e.target.value } : x)))} className="rounded-md border border-border px-2 py-1" />
                  <input value={v.area} onChange={(e) => setVolunteers(volunteers.map((x) => (x.id === v.id ? { ...x, area: e.target.value } : x)))} className="rounded-md border border-border px-2 py-1" />
                  <input
                    value={v.skills.join(", ")}
                    onChange={(e) => setVolunteers(volunteers.map((x) => (x.id === v.id ? { ...x, skills: e.target.value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) } : x)))}
                    className="rounded-md border border-border px-2 py-1 sm:col-span-2"
                  />
                  <button onClick={() => setEditing(null)} className="rounded-md bg-[color:var(--severity-moderate)] px-2 py-1 text-white">
                    Done
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {v.name} <span className="font-normal text-card-foreground/55">· {v.area} · {v.vehicle}</span>
                    </p>
                    <p className="text-card-foreground/65">skills: {v.skills.length ? v.skills.join(", ") : "—"}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleAvailable(v.id)}
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${v.available ? "bg-[color:var(--severity-low)]/15 text-[color:var(--severity-low)]" : "bg-card-foreground/10 text-card-foreground/60"}`}
                    >
                      {v.available ? "Available" : "Off"}
                    </button>
                    <button onClick={() => setEditing(v.id)} className="rounded-md p-1 hover:bg-card-foreground/5" aria-label="Edit">
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setVolunteers(volunteers.filter((x) => x.id !== v.id))} className="rounded-md p-1 text-[color:var(--severity-high)] hover:bg-card-foreground/5" aria-label="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
        {volunteers.length === 0 && <li className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-card-foreground/55">No volunteers yet.</li>}
      </ul>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Broadcasts log
// ─────────────────────────────────────────────────────────────────────────────

function BroadcastsPanel({
  broadcasts,
  setBroadcasts,
}: {
  broadcasts: Broadcast[];
  setBroadcasts: (b: Broadcast[]) => void;
}) {
  return (
    <section className="dc-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-[color:var(--severity-moderate)]" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Broadcast log</h3>
        </div>
        {broadcasts.length > 0 && (
          <button onClick={() => setBroadcasts([])} className="text-[11px] font-semibold text-card-foreground/60 hover:text-foreground">
            Clear
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-card-foreground/65">Last 20 routes transmitted from the Route Safety IQ console.</p>
      <ul className="mt-3 space-y-2">
        {broadcasts.map((b) => (
          <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-white p-3 text-xs">
            <div className="min-w-0">
              <p className="truncate font-semibold">
                {b.origin} → {b.destination}
              </p>
              <p className="text-card-foreground/60">
                {new Date(b.sentAt).toLocaleString()} · score {b.score} · {b.recipients} recipient{b.recipients === 1 ? "" : "s"}
              </p>
              <p className="text-card-foreground/55">{b.rule}</p>
            </div>
            <Cloud className="h-4 w-4 text-card-foreground/40" />
          </li>
        ))}
        {broadcasts.length === 0 && <li className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-card-foreground/55">No broadcasts yet.</li>}
      </ul>
    </section>
  );
}
