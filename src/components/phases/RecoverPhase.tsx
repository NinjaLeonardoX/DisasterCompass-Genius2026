import { useEffect, useState } from "react";
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
  Droplet,
  Utensils,
  Pill,
  BedDouble,
  BatteryCharging,
  Car,
  Sparkle,
  Stethoscope,
  Shirt,
  Wrench,
  Wifi,
  Baby,
  Accessibility,
  HeartPulse,
  PawPrint,
  Users,
  LocateFixed,
  Truck,
  Hammer,
  Radio,
  Megaphone,
  Globe,
  MessageSquare,
  Share2,
  Printer,
  Building2,
  Eye,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { useLocation } from "../LocationContext";


type Status = "Draft" | "Posted" | "Matched" | "In Progress" | "Completed";

type BroadcastChannel =
  | "board"
  | "volunteers"
  | "partners"
  | "website"
  | "sms"
  | "social"
  | "print";

type Need = {
  id: string;
  what: string;
  where: string;
  urgency: "Urgent" | "Soon" | "Whenever";
  vulnerable?: string;
  status: Status;
  helper?: string;
  channels?: BroadcastChannel[];
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
    status: "Posted",
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
    status: "Posted",
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
  Draft: "var(--severity-low)",
  Posted: "var(--severity-high)",
  Matched: "var(--severity-moderate)",
  "In Progress": "var(--severity-moderate)",
  Completed: "var(--severity-low)",
};

const NEEDS_STORAGE_KEY = "recover:needs";

export function RecoverPhase() {
  const { household, activeAddress, resolved } = useLocation();
  const [needs, setNeeds] = useState<Need[]>(() => {
    if (typeof window === "undefined") return SEED_NEEDS;
    try {
      const raw = window.localStorage.getItem(NEEDS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Need[];
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch {/* ignore */}
    return SEED_NEEDS;
  });
  const [helpers, setHelpers] = useState<HelpPoint[]>(SEED_HELP);
  const [openForm, setOpenForm] = useState<null | "need" | "help" | "broadcast">(null);
  const [draftNeed, setDraftNeed] = useState<Omit<Need, "id" | "status"> | null>(null);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(NEEDS_STORAGE_KEY, JSON.stringify(needs));
    } catch {/* ignore */}
  }, [needs]);

  const householdLabel = activeAddress?.name ?? "Your household";
  const scopeLabel = resolved?.city
    ? `${resolved.city}${resolved.state ? `, ${resolved.state}` : ""}`
    : household.locationName;

  const openCount = needs.filter((n) => n.status === "Posted").length;
  const matchedCount = needs.filter((n) => n.status === "Matched" || n.status === "In Progress").length;
  const completedCount = needs.filter((n) => n.status === "Completed").length;

  async function postBeacon(channels: BroadcastChannel[]) {
    if (!draftNeed) return;
    setSending(true);
    setToast(`Sending to ${channels.length} channel${channels.length === 1 ? "" : "s"}…`);
    try {
      // Mirror into IQ Engine state (localStorage) so the IQ broadcast log + beacons see it.
      const id = `n${Date.now()}`;
      const now = Date.now();

      // 1. Add to IQ beacons list
      try {
        const rawB = window.localStorage.getItem("iq:beacons");
        const list = rawB ? JSON.parse(rawB) : [];
        const iqBeacon = {
          id,
          what: draftNeed.what,
          where: draftNeed.where || scopeLabel,
          urgency: draftNeed.urgency,
          status: "Open",
          createdAt: now,
        };
        window.localStorage.setItem("iq:beacons", JSON.stringify([iqBeacon, ...list]));
      } catch {/* ignore */}

      // 2. Log to IQ broadcast log
      try {
        const rawL = window.localStorage.getItem("iq:broadcasts");
        const log = rawL ? JSON.parse(rawL) : [];
        const entry = {
          id: `bc${now}`,
          origin: scopeLabel || "Recover phase",
          destination: `${draftNeed.what}${draftNeed.where ? ` · ${draftNeed.where}` : ""}`,
          rule: `Need Beacon · ${draftNeed.urgency}`,
          score: draftNeed.urgency === "Urgent" ? 95 : draftNeed.urgency === "Soon" ? 75 : 55,
          sentAt: now,
          recipients: channels.length,
        };
        window.localStorage.setItem("iq:broadcasts", JSON.stringify([entry, ...log].slice(0, 20)));
      } catch {/* ignore */}

      await new Promise((r) => setTimeout(r, 500));

      setNeeds((prev) => [
        { ...draftNeed, id, status: "Posted", channels },
        ...prev,
      ]);
      setToast(`Posted to ${channels.length} channel${channels.length === 1 ? "" : "s"}. Logged in IQ Engine.`);
      setTimeout(() => setToast(null), 3500);
    } finally {
      setSending(false);
      setDraftNeed(null);
      setOpenForm(null);
    }
  }


  return (
    <div className="space-y-6">
      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-[color:var(--severity-moderate)]/40 bg-[color:var(--severity-moderate)]/10 px-4 py-2.5 text-sm font-semibold text-foreground">
          <Radio className={`h-4 w-4 text-[color:var(--severity-moderate)] ${sending ? "animate-pulse" : ""}`} />
          {toast}
        </div>
      )}
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
          detectedLocation={scopeLabel}
          onClose={() => setOpenForm(null)}
          onSubmit={(n) => {
            setDraftNeed(n);
            setOpenForm("broadcast");
          }}
        />
      )}
      {openForm === "broadcast" && draftNeed && (
        <BroadcastBeacon
          draft={draftNeed}
          sending={sending}
          onCancel={() => {
            if (sending) return;
            setDraftNeed(null);
            setOpenForm(null);
          }}
          onPost={postBeacon}
        />
      )}
      {openForm === "help" && (
        <HelpForm
          detectedLocation={scopeLabel}
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

        {/* Cross layout: NORTH on top, WEST | CENTER | EAST middle, SOUTH bottom */}
        <div className="mt-5 space-y-4">
          {/* NORTH */}
          <div className="mx-auto w-full md:w-2/3">
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
          </div>

          {/* WEST | CENTER COMPASS | EAST */}
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
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

            <div className="flex flex-col items-center justify-center">
              <div className="relative flex h-48 w-48 items-center justify-center rounded-full border-2 border-card-foreground/15 bg-card-foreground/[0.03]">
                <div className="absolute inset-4 rounded-full border border-dashed border-card-foreground/15" />
                <div className="absolute left-1/2 top-1 -translate-x-1/2 text-[10px] font-bold text-[color:var(--severity-high)]">
                  N
                </div>
                <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[color:var(--severity-low)]">
                  E
                </div>
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[color:var(--severity-moderate)]">
                  S
                </div>
                <div className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[color:var(--severity-low)]">
                  W
                </div>
                {/* Needle points NORTH (up) toward urgent help */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Navigation
                    className="h-12 w-12 text-[color:var(--severity-high)] drop-shadow"
                    aria-label="Compass pointing north toward urgent needs"
                  />
                </div>
                <div className="absolute bottom-3 flex flex-col items-center text-center">
                  <p className="text-[11px] font-semibold text-foreground">{householdLabel}</p>
                  <p className="text-[10px] text-card-foreground/60">{scopeLabel}</p>
                </div>
              </div>
              <p className="mt-2 text-center text-[11px] text-card-foreground/65">
                Pointing where help is needed most
              </p>
            </div>

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

          {/* SOUTH */}
          <div className="mx-auto w-full md:w-2/3">
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
          {(["Draft", "Posted", "Matched", "In Progress", "Completed"] as Status[]).map((s, i, arr) => (
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

// ── Icon picker data ────────────────────────────────────────────────────────

type Category = { id: string; label: string; Icon: LucideIcon };

const NEED_CATEGORIES: Category[] = [
  { id: "water", label: "Drinking water", Icon: Droplet },
  { id: "food", label: "Hot meal / food", Icon: Utensils },
  { id: "medicine", label: "Medicine / Rx", Icon: Pill },
  { id: "shelter", label: "Place to stay", Icon: BedDouble },
  { id: "power", label: "Power / charging", Icon: BatteryCharging },
  { id: "ride", label: "Ride / transport", Icon: Car },
  { id: "cleanup", label: "Cleanup help", Icon: Sparkle },
  { id: "wellness", label: "Wellness check", Icon: Stethoscope },
  { id: "clothes", label: "Clothes / blankets", Icon: Shirt },
  { id: "repair", label: "Home repair", Icon: Wrench },
  { id: "wifi", label: "Internet / WiFi", Icon: Wifi },
  { id: "petcare", label: "Pet care", Icon: PawPrint },
];

const HELP_CATEGORIES: Category[] = [
  { id: "water", label: "Bottled water", Icon: Droplet },
  { id: "food", label: "Cooked food", Icon: Utensils },
  { id: "medicine", label: "Pharmacy run", Icon: Pill },
  { id: "shelter", label: "Spare room / bed", Icon: BedDouble },
  { id: "power", label: "Charging / generator", Icon: BatteryCharging },
  { id: "ride", label: "Ride / pickup", Icon: Car },
  { id: "truck", label: "Truck + crew", Icon: Truck },
  { id: "cleanup", label: "Cleanup crew", Icon: Sparkle },
  { id: "tools", label: "Tools / repairs", Icon: Hammer },
  { id: "wifi", label: "WiFi hotspot", Icon: Wifi },
  { id: "wellness", label: "Wellness checks", Icon: HeartPulse },
  { id: "petcare", label: "Pet care", Icon: PawPrint },
];

type UrgencyOpt = { value: Need["urgency"]; label: string; Icon: LucideIcon; tone: string };
const URGENCY_OPTS: UrgencyOpt[] = [
  { value: "Urgent", label: "Urgent", Icon: AlertTriangle, tone: "var(--severity-high)" },
  { value: "Soon", label: "Soon", Icon: Clock, tone: "var(--severity-moderate)" },
  { value: "Whenever", label: "Whenever", Icon: CheckCircle2, tone: "var(--severity-low)" },
];

type AvailabilityOpt = { value: string; label: string; Icon: LucideIcon };
const AVAILABILITY_OPTS: AvailabilityOpt[] = [
  { value: "Now", label: "Right now", Icon: Sparkles },
  { value: "Today", label: "Today", Icon: Clock },
  { value: "Tonight", label: "Tonight", Icon: BedDouble },
  { value: "Tomorrow", label: "Tomorrow", Icon: ArrowRight },
  { value: "This week", label: "This week", Icon: CheckCircle2 },
];

type VulnerabilityTag = { id: string; label: string; Icon: LucideIcon };
const VULNERABILITY_TAGS: VulnerabilityTag[] = [
  { id: "infant", label: "Infant / kids", Icon: Baby },
  { id: "elderly", label: "Elderly", Icon: Users },
  { id: "medical", label: "Medical need", Icon: HeartPulse },
  { id: "accessibility", label: "Accessibility", Icon: Accessibility },
  { id: "no-transport", label: "No transport", Icon: Car },
  { id: "pets", label: "Pets", Icon: PawPrint },
];

// ── Reusable icon-grid picker ───────────────────────────────────────────────

function IconGrid<T extends { id?: string; value?: string; label: string; Icon: LucideIcon; tone?: string }>({
  options,
  selectedKey,
  onSelect,
  cols = "grid-cols-3 sm:grid-cols-4",
  accent = "var(--severity-moderate)",
}: {
  options: T[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  cols?: string;
  accent?: string;
}) {
  return (
    <div className={`grid gap-2 ${cols}`}>
      {options.map((opt) => {
        const key = (opt.id ?? opt.value) as string;
        const selected = selectedKey === key;
        const tone = opt.tone ?? accent;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center text-xs font-medium transition ${
              selected
                ? "border-transparent shadow-sm"
                : "border-card-foreground/15 bg-background hover:bg-card-foreground/5"
            }`}
            style={
              selected
                ? {
                    background: `color-mix(in oklab, ${tone} 14%, transparent)`,
                    color: tone,
                    boxShadow: `0 0 0 2px color-mix(in oklab, ${tone} 50%, transparent)`,
                  }
                : undefined
            }
          >
            <opt.Icon className="h-5 w-5" />
            <span className="leading-tight">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function MultiIconGrid({
  options,
  selectedIds,
  onToggle,
}: {
  options: VulnerabilityTag[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {options.map((opt) => {
        const selected = selectedIds.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onToggle(opt.id)}
            className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center text-[11px] font-medium transition ${
              selected
                ? "border-[color:var(--severity-moderate)] bg-[color:var(--severity-moderate)]/15 text-[color:var(--severity-moderate)]"
                : "border-card-foreground/15 bg-background text-card-foreground/80 hover:bg-card-foreground/5"
            }`}
          >
            <opt.Icon className="h-4 w-4" />
            <span className="leading-tight">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Location bar (auto-detect with override) ────────────────────────────────

function LocationBar({
  value,
  detected,
  onChange,
}: {
  value: string;
  detected: string;
  onChange: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="rounded-xl border border-card-foreground/15 bg-background p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 text-xs">
          <LocateFixed className="h-4 w-4 text-[color:var(--severity-low)]" />
          <span className="font-semibold text-card-foreground/80">Location detected:</span>
          <span className="font-semibold text-foreground">{value || detected || "Locating…"}</span>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[11px] font-semibold text-[color:var(--severity-moderate)] hover:underline"
          >
            Change
          </button>
        )}
      </div>
      {editing && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            autoFocus
            className={inputCls + " flex-1"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={120}
            placeholder="e.g. Maple St & 4th"
          />
          <button
            type="button"
            onClick={() => {
              onChange(detected);
              setEditing(false);
            }}
            className="rounded-full border border-card-foreground/15 px-3 py-1.5 text-[11px] font-semibold text-card-foreground/75 hover:bg-card-foreground/5"
          >
            Use detected
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-full bg-[color:var(--severity-moderate)] px-3 py-1.5 text-[11px] font-semibold text-white hover:brightness-110"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

// ── Forms ───────────────────────────────────────────────────────────────────

function NeedForm({
  detectedLocation,
  onClose,
  onSubmit,
}: {
  detectedLocation: string;
  onClose: () => void;
  onSubmit: (n: Omit<Need, "id" | "status">) => void;
}) {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [urgency, setUrgency] = useState<Need["urgency"]>("Urgent");
  const [vulnIds, setVulnIds] = useState<string[]>([]);
  const [where, setWhere] = useState(detectedLocation);

  useEffect(() => {
    if (detectedLocation && !where) setWhere(detectedLocation);
  }, [detectedLocation, where]);

  const category = NEED_CATEGORIES.find((c) => c.id === categoryId);
  const canSubmit = !!category && !!where.trim();

  return (
    <form
      className="dc-card space-y-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit || !category) return;
        const vulnLabel = vulnIds
          .map((id) => VULNERABILITY_TAGS.find((v) => v.id === id)?.label)
          .filter(Boolean)
          .join(", ");
        onSubmit({
          what: category.label,
          where: where.trim().slice(0, 120),
          urgency,
          vulnerable: vulnLabel || undefined,
        });
      }}
    >
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[color:var(--severity-high)]" />
          <h3 className="text-sm font-bold uppercase tracking-wider">I Need Help</h3>
        </div>
        <button type="button" onClick={onClose} className="text-xs text-card-foreground/60 hover:text-foreground">
          Cancel
        </button>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-card-foreground/70">
          What do you need?
        </p>
        <IconGrid options={NEED_CATEGORIES} selectedKey={categoryId} onSelect={setCategoryId} accent="var(--severity-high)" />
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-card-foreground/70">
          How urgent?
        </p>
        <IconGrid
          options={URGENCY_OPTS}
          selectedKey={urgency}
          onSelect={(v) => setUrgency(v as Need["urgency"])}
          cols="grid-cols-3"
        />
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-card-foreground/70">
          Anyone vulnerable in your household? <span className="font-normal text-card-foreground/55">(tap any)</span>
        </p>
        <MultiIconGrid
          options={VULNERABILITY_TAGS}
          selectedIds={vulnIds}
          onToggle={(id) => setVulnIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
        />
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-card-foreground/70">
          Where?
        </p>
        <LocationBar value={where} detected={detectedLocation} onChange={setWhere} />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="inline-flex items-center gap-2 rounded-full bg-[color:var(--severity-high)] px-5 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
      >
        Post Need Beacon <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}

function HelpForm({
  detectedLocation,
  onClose,
  onSubmit,
}: {
  detectedLocation: string;
  onClose: () => void;
  onSubmit: (h: Omit<HelpPoint, "id">) => void;
}) {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [available, setAvailable] = useState<string>("Now");
  const [where, setWhere] = useState(detectedLocation);

  useEffect(() => {
    if (detectedLocation && !where) setWhere(detectedLocation);
  }, [detectedLocation, where]);

  const category = HELP_CATEGORIES.find((c) => c.id === categoryId);
  const availability = AVAILABILITY_OPTS.find((a) => a.value === available);
  const canSubmit = !!category && !!where.trim();

  return (
    <form
      className="dc-card space-y-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit || !category) return;
        onSubmit({
          offer: category.label,
          where: where.trim().slice(0, 120),
          available: availability?.label ?? "Flexible",
          distance: "Nearby",
        });
      }}
    >
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2">
          <HandHeart className="h-4 w-4 text-[color:var(--severity-low)]" />
          <h3 className="text-sm font-bold uppercase tracking-wider">I Can Help</h3>
        </div>
        <button type="button" onClick={onClose} className="text-xs text-card-foreground/60 hover:text-foreground">
          Cancel
        </button>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-card-foreground/70">
          What can you offer?
        </p>
        <IconGrid options={HELP_CATEGORIES} selectedKey={categoryId} onSelect={setCategoryId} accent="var(--severity-low)" />
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-card-foreground/70">
          When are you available?
        </p>
        <IconGrid
          options={AVAILABILITY_OPTS}
          selectedKey={available}
          onSelect={setAvailable}
          cols="grid-cols-3 sm:grid-cols-5"
          accent="var(--severity-low)"
        />
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-card-foreground/70">
          Where are you?
        </p>
        <LocationBar value={where} detected={detectedLocation} onChange={setWhere} />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="inline-flex items-center gap-2 rounded-full bg-[color:var(--severity-low)] px-5 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
      >
        Add Help Point <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}

// ── Broadcast Beacon ────────────────────────────────────────────────────────

type ChannelOption = {
  id: BroadcastChannel;
  label: string;
  desc: string;
  Icon: LucideIcon;
  defaultOn?: boolean;
  requiresApproval?: boolean;
};

const BROADCAST_CHANNELS: ChannelOption[] = [
  { id: "board", label: "Recovery Compass Board", desc: "Visible inside the app to nearby residents and coordinators.", Icon: Compass, defaultOn: true },
  { id: "volunteers", label: "Nearby Help Warriors / Verified Volunteers", desc: "Direct alert to verified volunteers near your general location.", Icon: HandHeart },
  { id: "partners", label: "Partner Organizations", desc: "Shelters, churches, nonprofits, clinics, food banks, cleanup teams.", Icon: Building2 },
  { id: "website", label: "Community Website", desc: "Public page with private details removed.", Icon: Globe, requiresApproval: true },
  { id: "sms", label: "SMS / Email / Push Alert", desc: "Send to nearby volunteers who opted in to alerts.", Icon: MessageSquare },
  { id: "social", label: "Social Media Template", desc: "General location only. No address, phone, or medical details.", Icon: Share2, requiresApproval: true },
  { id: "print", label: "Offline Recovery Hub Printable Card", desc: "Printable card for a physical board at a school, church, or shelter.", Icon: Printer },
];

function redactForPublic(text: string): string {
  return text.replace(/\b\d{1,6}\s+(?=[A-Za-z])/g, "").trim();
}

function BroadcastBeacon({
  draft,
  sending,
  onCancel,
  onPost,
}: {
  draft: Omit<Need, "id" | "status">;
  sending: boolean;
  onCancel: () => void;
  onPost: (channels: BroadcastChannel[]) => void;
}) {
  const [selected, setSelected] = useState<BroadcastChannel[]>(
    BROADCAST_CHANNELS.filter((c) => c.defaultOn).map((c) => c.id),
  );
  const [showPreview, setShowPreview] = useState(false);

  const sensitive = !!draft.vulnerable;
  const toggle = (id: BroadcastChannel) =>
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const generalLocation = redactForPublic(draft.where);
  const publicPreview = `[${draft.urgency}] ${draft.what} needed near ${generalLocation}. Reply via Recovery Compass to help. (No exact address shared.)`;
  const internalPreview = `[${draft.urgency}] ${draft.what} — ${draft.where}${draft.vulnerable ? ` · Vulnerable: ${draft.vulnerable}` : ""}`;
  const hasPublic = selected.some((c) => c === "website" || c === "social");

  return (
    <div className="dc-card space-y-4 p-5">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2">
          <Radio className="h-4 w-4 text-[color:var(--severity-moderate)]" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Broadcast Beacon</h3>
        </div>
        <button type="button" onClick={onCancel} className="text-xs text-card-foreground/60 hover:text-foreground">
          Cancel
        </button>
      </div>

      <p className="text-xs text-card-foreground/70">
        Your Need Beacon is saved as a <span className="font-semibold text-foreground">Draft</span>. Choose where it should be broadcast before posting. By default it posts to the Recovery Compass Board first.
      </p>

      <div className="rounded-xl border border-card-foreground/15 bg-background p-3 text-xs">
        <p className="font-semibold text-foreground">{draft.what}</p>
        <p className="text-card-foreground/70">
          {draft.where} · {draft.urgency}
          {draft.vulnerable ? ` · ${draft.vulnerable}` : ""}
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-xl border-l-4 border-[color:var(--severity-high)] bg-[color:var(--severity-high)]/5 p-3 text-xs">
        <ShieldAlert className="mt-0.5 h-4 w-4 text-[color:var(--severity-high)]" />
        <p className="text-card-foreground/80">
          <span className="font-semibold text-foreground">For life-threatening emergencies, call 911</span> or local emergency services. Recovery Compass is for recovery support, not emergency rescue.
        </p>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-card-foreground/70">
          Broadcast this Need Beacon to:
        </p>
        <div className="grid gap-2">
          {BROADCAST_CHANNELS.map((c) => {
            const on = selected.includes(c.id);
            return (
              <label
                key={c.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                  on
                    ? "border-[color:var(--severity-moderate)] bg-[color:var(--severity-moderate)]/10"
                    : "border-card-foreground/15 bg-background hover:bg-card-foreground/5"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[color:var(--severity-moderate)]"
                  checked={on}
                  onChange={() => toggle(c.id)}
                />
                <c.Icon className="mt-0.5 h-4 w-4 text-[color:var(--severity-moderate)]" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                    {c.label}
                    {c.requiresApproval && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--severity-high)]/15 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--severity-high)]">
                        <Lock className="h-3 w-3" /> Coordinator approval
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-card-foreground/65">{c.desc}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {sensitive && hasPublic && (
        <div className="flex items-start gap-2 rounded-xl border-l-4 border-[color:var(--severity-moderate)] bg-[color:var(--severity-moderate)]/10 p-3 text-xs">
          <Eye className="mt-0.5 h-4 w-4 text-[color:var(--severity-moderate)]" />
          <p className="text-card-foreground/80">
            This beacon includes vulnerable household details. Public channels will be reviewed by a coordinator before going live.
          </p>
        </div>
      )}

      {showPreview && (
        <div className="space-y-2 rounded-xl border border-card-foreground/15 bg-background p-3 text-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-card-foreground/70">
            Public preview (website / social)
          </p>
          <p className="rounded-lg bg-card-foreground/5 p-2 text-card-foreground/85">{publicPreview}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-card-foreground/70">
            Coordinator / volunteer preview
          </p>
          <p className="rounded-lg bg-card-foreground/5 p-2 text-card-foreground/85">{internalPreview}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowPreview((p) => !p)}
          className="inline-flex items-center gap-2 rounded-full border border-card-foreground/20 px-4 py-2 text-sm font-semibold text-card-foreground/85 hover:bg-card-foreground/5"
        >
          <Eye className="h-4 w-4" />
          {showPreview ? "Hide preview" : "Preview Beacon"}
        </button>
        <button
          type="button"
          disabled={selected.length === 0 || sending}
          onClick={() => onPost(selected)}
          className="inline-flex items-center gap-2 rounded-full bg-[color:var(--severity-high)] px-5 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
        >
          <Megaphone className={`h-4 w-4 ${sending ? "animate-pulse" : ""}`} />
          {sending ? "Sending to beacon…" : "Post Beacon"}
        </button>
      </div>
    </div>
  );
}


