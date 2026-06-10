import { useState } from "react";
import {
  Compass,
  AlertTriangle,
  HandHeart,
  Home,
  CheckCircle2,
  MapPin,
  ArrowRight,
  Navigation,
  ShieldAlert,
  Phone,
  ClipboardList,
  Sparkles,
  Clock,
} from "lucide-react";
import { useLocation } from "../LocationContext";

type Status = "Open" | "Matched" | "In Progress" | "Completed";

type Need = {
  id: string;
  what: string;
  where: string;
  urgency: "Urgent" | "Soon" | "Whenever";
  vulnerable?: string;
  status: Status;
  helper?: string;
};

type HelpPoint = {
  id: string;
  offer: string;
  where: string;
  distance: string;
  available: string;
};

type SafePlace = {
  id: string;
  name: string;
  type: string;
  where: string;
  status: string;
};

type Progress = {
  id: string;
  what: string;
  where: string;
  status: Status;
};

const SEED_NEEDS: Need[] = [
  {
    id: "n1",
    what: "Drinking water (case of bottles)",
    where: "Near Maple Street",
    urgency: "Urgent",
    vulnerable: "Family with infant",
    status: "Open",
  },
  {
    id: "n2",
    what: "Medicine pickup from pharmacy",
    where: "Oak Ave & 3rd",
    urgency: "Urgent",
    vulnerable: "Elderly resident, no transport",
    status: "Matched",
    helper: "Ana (volunteer driver)",
  },
  {
    id: "n3",
    what: "Hot meal for 4",
    where: "Pine Road",
    urgency: "Soon",
    status: "Open",
  },
];

const SEED_HELP: HelpPoint[] = [
  {
    id: "h1",
    offer: "Bottled water (2 cases)",
    where: "Maple St area",
    distance: "1 mile away",
    available: "Now – 6 PM",
  },
  {
    id: "h2",
    offer: "Pickup truck + cleanup crew (2)",
    where: "Cedar Lane",
    distance: "3 miles away",
    available: "Tomorrow AM",
  },
  {
    id: "h3",
    offer: "Spare room (1 person, 3 nights)",
    where: "Downtown",
    distance: "2 miles away",
    available: "Tonight",
  },
];

const SEED_SAFE: SafePlace[] = [
  { id: "s1", name: "Community Center", type: "Shelter", where: "Civic Plaza", status: "Open · 80 beds" },
  { id: "s2", name: "Downtown Pharmacy", type: "Pharmacy", where: "Main St", status: "Reopened" },
  { id: "s3", name: "Library", type: "Charging station", where: "Elm St", status: "Open · WiFi" },
  { id: "s4", name: "St. Mary's Hall", type: "Food pickup", where: "Pine Rd", status: "11 AM – 4 PM" },
];

const SEED_PROGRESS: Progress[] = [
  { id: "p1", what: "Tree removal", where: "Pine Road", status: "In Progress" },
  { id: "p2", what: "Wellbeing checks (12 homes)", where: "Maple block", status: "Completed" },
  { id: "p3", what: "Route reopened", where: "Hwy 9 north", status: "Completed" },
  { id: "p4", what: "Power restoration", where: "West district", status: "In Progress" },
];

const URGENCY_TONE: Record<Need["urgency"], string> = {
  Urgent: "var(--severity-high)",
  Soon: "var(--severity-moderate)",
  Whenever: "var(--severity-low)",
};

const STATUS_TONE: Record<Status, string> = {
  Open: "var(--severity-high)",
  Matched: "var(--severity-moderate)",
  "In Progress": "var(--severity-moderate)",
  Completed: "var(--severity-low)",
};

export function RecoverPhase() {
  const { household, activeAddress, resolved } = useLocation();
  const [needs, setNeeds] = useState<Need[]>(SEED_NEEDS);
  const [helpers, setHelpers] = useState<HelpPoint[]>(SEED_HELP);
  const [openForm, setOpenForm] = useState<null | "need" | "help">(null);

  const householdLabel = activeAddress?.name ?? "Your household";
  const scopeLabel = resolved?.city
    ? `${resolved.city}${resolved.state ? `, ${resolved.state}` : ""}`
    : household.locationName;

  const openCount = needs.filter((n) => n.status === "Open").length;
  const matchedCount = needs.filter((n) => n.status === "Matched" || n.status === "In Progress").length;
  const completedCount = needs.filter((n) => n.status === "Completed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--severity-low)]">
          Phase 3 · Recovery Compass
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">Recovery Compass</h2>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          Recovery Compass points help where it's needed most.
        </p>
      </div>

      {/* Scope strip */}
      <div className="dc-card flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs">
        <span className="inline-flex items-center gap-1.5 font-medium text-card-foreground/75">
          <MapPin className="h-3.5 w-3.5 text-[color:var(--severity-low)]" />
          Recovery scope: <span className="font-semibold text-foreground">{scopeLabel}</span>
        </span>
        <span className="text-card-foreground/55">Centered on {householdLabel}</span>
      </div>

      {/* Emergency note */}
      <div className="dc-card flex items-start gap-2 border-l-4 border-[color:var(--severity-high)] px-4 py-3 text-xs">
        <ShieldAlert className="mt-0.5 h-4 w-4 text-[color:var(--severity-high)]" />
        <p className="text-card-foreground/80">
          <span className="font-semibold text-foreground">For life-threatening emergencies, call 911</span> or
          your local emergency services. Recovery Compass is for non-emergency neighbor-to-neighbor recovery help.
        </p>
      </div>

      {/* Action buttons */}
      <div className="grid gap-3 sm:grid-cols-3">
        <button
          onClick={() => setOpenForm("need")}
          className="dc-card group flex items-center justify-between gap-3 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-bold">
              <AlertTriangle className="h-4 w-4 text-[color:var(--severity-high)]" />
              I Need Help
            </div>
            <p className="mt-1 text-xs text-card-foreground/65">Post a Need Beacon</p>
          </div>
          <ArrowRight className="h-4 w-4 opacity-50 transition group-hover:translate-x-1 group-hover:opacity-100" />
        </button>
        <button
          onClick={() => setOpenForm("help")}
          className="dc-card group flex items-center justify-between gap-3 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-bold">
              <HandHeart className="h-4 w-4 text-[color:var(--severity-low)]" />
              I Can Help
            </div>
            <p className="mt-1 text-xs text-card-foreground/65">Add a Help Point</p>
          </div>
          <ArrowRight className="h-4 w-4 opacity-50 transition group-hover:translate-x-1 group-hover:opacity-100" />
        </button>
        <a
          href="#compass"
          className="dc-card group flex items-center justify-between gap-3 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-bold">
              <Compass className="h-4 w-4 text-[color:var(--severity-moderate)]" />
              View Recovery Compass
            </div>
            <p className="mt-1 text-xs text-card-foreground/65">See needs, help, places</p>
          </div>
          <ArrowRight className="h-4 w-4 opacity-50 transition group-hover:translate-x-1 group-hover:opacity-100" />
        </a>
      </div>

      {/* Forms */}
      {openForm === "need" && (
        <NeedForm
          onClose={() => setOpenForm(null)}
          onSubmit={(n) => {
            setNeeds((prev) => [{ ...n, id: `n${Date.now()}`, status: "Open" }, ...prev]);
            setOpenForm(null);
          }}
        />
      )}
      {openForm === "help" && (
        <HelpForm
          onClose={() => setOpenForm(null)}
          onSubmit={(h) => {
            setHelpers((prev) => [{ ...h, id: `h${Date.now()}` }, ...prev]);
            setOpenForm(null);
          }}
        />
      )}

      {/* Compass visual */}
      <div id="compass" className="dc-card dc-elev-hero p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider">The Compass</h3>
          <span className="inline-flex items-center gap-1.5 text-xs text-card-foreground/65">
            <Sparkles className="h-3.5 w-3.5 text-[color:var(--severity-moderate)]" />
            {openCount} open · {matchedCount} in motion · {completedCount} completed
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
          {/* West col */}
          <CompassQuadrant
            label="WEST · Recovery Progress"
            icon={<CheckCircle2 className="h-4 w-4 text-[color:var(--severity-low)]" />}
            items={SEED_PROGRESS.map((p) => ({
              title: p.what,
              sub: p.where,
              tag: p.status,
              tagColor: STATUS_TONE[p.status],
            }))}
          />

          {/* Center compass */}
          <div className="flex flex-col items-center justify-between gap-4">
            <QuadHeader dir="NORTH" label="Urgent Needs" color="var(--severity-high)" />
            <div className="relative flex h-44 w-44 items-center justify-center rounded-full border-2 border-card-foreground/15 bg-card-foreground/[0.03]">
              <div className="absolute inset-4 rounded-full border border-dashed border-card-foreground/15" />
              <div className="absolute left-1/2 top-0 -translate-x-1/2 text-[10px] font-bold text-[color:var(--severity-high)]">
                N
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[color:var(--severity-low)]">
                E
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[color:var(--severity-moderate)]">
                S
              </div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[color:var(--severity-low)]">
                W
              </div>
              <div className="flex flex-col items-center text-center">
                <Navigation className="h-7 w-7 text-[color:var(--severity-moderate)]" />
                <p className="mt-1 text-[11px] font-semibold text-foreground">{householdLabel}</p>
                <p className="text-[10px] text-card-foreground/60">{scopeLabel}</p>
              </div>
            </div>
            <QuadHeader dir="SOUTH" label="Safe Places" color="var(--severity-moderate)" />
          </div>

          {/* East col */}
          <CompassQuadrant
            label="EAST · Available Help"
            icon={<HandHeart className="h-4 w-4 text-[color:var(--severity-low)]" />}
            items={helpers.map((h) => ({
              title: h.offer,
              sub: `${h.where} · ${h.distance}`,
              tag: h.available,
              tagColor: "var(--severity-low)",
            }))}
          />
        </div>

        {/* North & South strips */}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <CompassQuadrant
            label="NORTH · Urgent Needs"
            icon={<AlertTriangle className="h-4 w-4 text-[color:var(--severity-high)]" />}
            items={needs.map((n) => ({
              title: n.what,
              sub: `${n.where}${n.vulnerable ? ` · ${n.vulnerable}` : ""}`,
              tag: n.urgency,
              tagColor: URGENCY_TONE[n.urgency],
            }))}
          />
          <CompassQuadrant
            label="SOUTH · Safe Places"
            icon={<Home className="h-4 w-4 text-[color:var(--severity-moderate)]" />}
            items={SEED_SAFE.map((s) => ({
              title: `${s.name} (${s.type})`,
              sub: s.where,
              tag: s.status,
              tagColor: "var(--severity-low)",
            }))}
          />
        </div>
      </div>

      {/* Compass Match */}
      <div className="dc-card p-5">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-[color:var(--severity-moderate)]" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Compass Match</h3>
        </div>
        <p className="mt-1 text-xs text-card-foreground/65">
          Each Need Beacon is matched to the closest useful Help Point — weighted by location, urgency,
          type of need, volunteer availability, and vulnerability.
        </p>
        <ul className="mt-4 space-y-3">
          {needs.map((n) => {
            const match = helpers.find((h) =>
              n.what.toLowerCase().includes("water")
                ? h.offer.toLowerCase().includes("water")
                : n.what.toLowerCase().includes("medicine")
                  ? h.offer.toLowerCase().includes("truck") || h.offer.toLowerCase().includes("room")
                  : true,
            );
            return (
              <li
                key={n.id}
                className="grid items-center gap-3 rounded-xl bg-card-foreground/[0.04] p-3 md:grid-cols-[1fr_auto_1fr_auto]"
              >
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: URGENCY_TONE[n.urgency] }}
                    />
                    {n.what}
                  </div>
                  <p className="text-xs text-card-foreground/65">
                    {n.where}
                    {n.vulnerable ? ` · ${n.vulnerable}` : ""}
                  </p>
                </div>
                <ArrowRight className="hidden h-4 w-4 text-card-foreground/40 md:block" />
                <div>
                  {match ? (
                    <>
                      <p className="text-sm font-semibold">{match.offer}</p>
                      <p className="text-xs text-card-foreground/65">
                        {match.where} · {match.distance} · {match.available}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-card-foreground/60">Waiting for a Help Point…</p>
                  )}
                </div>
                <span
                  className="justify-self-start rounded-full px-2.5 py-1 text-[11px] font-semibold md:justify-self-end"
                  style={{
                    background: `color-mix(in oklab, ${STATUS_TONE[n.status]} 15%, transparent)`,
                    color: STATUS_TONE[n.status],
                  }}
                >
                  {n.status}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-card-foreground/65">
          <Clock className="h-3.5 w-3.5" />
          Status flow:
          {(["Open", "Matched", "In Progress", "Completed"] as Status[]).map((s, i, arr) => (
            <span key={s} className="inline-flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 font-semibold"
                style={{
                  background: `color-mix(in oklab, ${STATUS_TONE[s]} 15%, transparent)`,
                  color: STATUS_TONE[s],
                }}
              >
                {s}
              </span>
              {i < arr.length - 1 && <span>→</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Privacy + offline */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="dc-card p-5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-[color:var(--severity-moderate)]" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Privacy & Safety</h3>
          </div>
          <ul className="mt-3 space-y-2 text-xs text-card-foreground/80">
            <li>• Public users only see general locations (street or landmark).</li>
            <li>• Exact addresses are visible only to trusted coordinators.</li>
            <li>• Volunteers only see details for tasks assigned to them.</li>
            <li>
              • <span className="font-semibold text-foreground">For life-threatening emergencies, call 911</span>{" "}
              or local emergency services.
            </li>
          </ul>
        </div>
        <div className="dc-card p-5">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-[color:var(--severity-low)]" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Offline Backup</h3>
          </div>
          <p className="mt-2 text-xs text-card-foreground/75">
            If internet or power is down, Recovery Compass can run as a paper board at a school, church, shelter,
            or community center.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="rounded-lg bg-[color:var(--severity-high)]/10 p-2 font-semibold text-[color:var(--severity-high)]">
              Need Help
            </div>
            <div className="rounded-lg bg-[color:var(--severity-low)]/10 p-2 font-semibold text-[color:var(--severity-low)]">
              Can Help
            </div>
            <div className="rounded-lg bg-card-foreground/5 p-2 font-semibold text-card-foreground/70">
              Completed
            </div>
          </div>
          <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-card-foreground/65">
            <Phone className="h-3.5 w-3.5" /> A coordinator collects cards and reads them aloud each hour.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Small subcomponents ---------- */

function QuadHeader({ dir, label, color }: { dir: string; label: string; color: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color }}>
        {dir}
      </p>
      <p className="text-xs font-semibold text-card-foreground/80">{label}</p>
    </div>
  );
}

function CompassQuadrant({
  label,
  icon,
  items,
}: {
  label: string;
  icon: React.ReactNode;
  items: { title: string; sub: string; tag: string; tagColor: string }[];
}) {
  return (
    <div className="rounded-2xl bg-card-foreground/[0.03] p-4 ring-1 ring-card-foreground/10">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-card-foreground/75">
        {icon}
        {label}
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((it, i) => (
          <li key={i} className="rounded-lg bg-background/60 p-2.5 text-xs ring-1 ring-card-foreground/5">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-foreground">{it.title}</p>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{
                  background: `color-mix(in oklab, ${it.tagColor} 15%, transparent)`,
                  color: it.tagColor,
                }}
              >
                {it.tag}
              </span>
            </div>
            <p className="mt-0.5 text-card-foreground/65">{it.sub}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs">
      <span className="font-semibold text-card-foreground/80">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-card-foreground/15 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-[color:var(--severity-moderate)] focus:ring-2 focus:ring-[color:var(--severity-moderate)]/20";

function NeedForm({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (n: Omit<Need, "id" | "status">) => void;
}) {
  const [what, setWhat] = useState("");
  const [where, setWhere] = useState("");
  const [urgency, setUrgency] = useState<Need["urgency"]>("Urgent");
  const [when, setWhen] = useState("");
  const [vuln, setVuln] = useState("");

  return (
    <form
      className="dc-card space-y-3 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!what.trim() || !where.trim()) return;
        onSubmit({
          what: what.trim().slice(0, 120),
          where: where.trim().slice(0, 120),
          urgency,
          vulnerable: vuln.trim().slice(0, 120) || undefined,
        });
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider">I Need Help</h3>
        <button type="button" onClick={onClose} className="text-xs text-card-foreground/60 hover:text-foreground">
          Cancel
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="What do you need?">
          <input className={inputCls} value={what} onChange={(e) => setWhat(e.target.value)} maxLength={120} placeholder="e.g. drinking water" />
        </Field>
        <Field label="Where / nearest landmark">
          <input className={inputCls} value={where} onChange={(e) => setWhere(e.target.value)} maxLength={120} placeholder="e.g. Maple St & 4th" />
        </Field>
        <Field label="How urgent?">
          <select className={inputCls} value={urgency} onChange={(e) => setUrgency(e.target.value as Need["urgency"])}>
            <option>Urgent</option>
            <option>Soon</option>
            <option>Whenever</option>
          </select>
        </Field>
        <Field label="When do you need it?">
          <input className={inputCls} value={when} onChange={(e) => setWhen(e.target.value)} maxLength={60} placeholder="e.g. within 2 hours" />
        </Field>
        <div className="md:col-span-2">
          <Field label="Are you elderly, disabled, without transport, or have a medical need? (optional)">
            <input className={inputCls} value={vuln} onChange={(e) => setVuln(e.target.value)} maxLength={120} placeholder="e.g. elderly, no transport" />
          </Field>
        </div>
      </div>
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-full bg-[color:var(--severity-high)] px-5 py-2 text-sm font-semibold text-white hover:brightness-110"
      >
        Post Need Beacon <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}

function HelpForm({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (h: Omit<HelpPoint, "id">) => void;
}) {
  const [offer, setOffer] = useState("");
  const [where, setWhere] = useState("");
  const [available, setAvailable] = useState("");
  const [distance, setDistance] = useState("");

  return (
    <form
      className="dc-card space-y-3 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!offer.trim() || !where.trim()) return;
        onSubmit({
          offer: offer.trim().slice(0, 120),
          where: where.trim().slice(0, 120),
          available: available.trim().slice(0, 60) || "Flexible",
          distance: distance.trim().slice(0, 40) || "Nearby",
        });
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider">I Can Help</h3>
        <button type="button" onClick={onClose} className="text-xs text-card-foreground/60 hover:text-foreground">
          Cancel
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="What can you offer?">
          <input className={inputCls} value={offer} onChange={(e) => setOffer(e.target.value)} maxLength={120} placeholder="e.g. bottled water, ride, spare room" />
        </Field>
        <Field label="Where are you located?">
          <input className={inputCls} value={where} onChange={(e) => setWhere(e.target.value)} maxLength={120} placeholder="e.g. Cedar Lane" />
        </Field>
        <Field label="When are you available?">
          <input className={inputCls} value={available} onChange={(e) => setAvailable(e.target.value)} maxLength={60} placeholder="e.g. tonight, weekends" />
        </Field>
        <Field label="How far can you travel?">
          <input className={inputCls} value={distance} onChange={(e) => setDistance(e.target.value)} maxLength={40} placeholder="e.g. 5 miles" />
        </Field>
      </div>
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-full bg-[color:var(--severity-low)] px-5 py-2 text-sm font-semibold text-white hover:brightness-110"
      >
        Add Help Point <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
