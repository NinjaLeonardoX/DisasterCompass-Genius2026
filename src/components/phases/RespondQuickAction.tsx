import { useState } from "react";
import { AlertTriangle, ShieldCheck, AlertCircle, LifeBuoy, Siren } from "lucide-react";
import { MapPanel } from "../compass/MapPanel";
import { useHousehold } from "../LocationContext";
import { useRoutes, resolveDestinationShelter } from "@/lib/queries/routing";

type Status = "none" | "safe" | "stuck" | "needs_help" | "sos";

interface ActionDef {
  id: Exclude<Status, "none">;
  label: string;
  Icon: typeof ShieldCheck;
  className: string;
  message: string;
}

const ACTIONS: ActionDef[] = [
  {
    id: "safe",
    label: "I'm Safe",
    Icon: ShieldCheck,
    className:
      "bg-[color:var(--severity-low)] text-white hover:bg-[color:var(--severity-low)]/90 focus-visible:ring-[color:var(--severity-low)]",
    message: "Marked safe.",
  },
  {
    id: "stuck",
    label: "I'm Stuck",
    Icon: AlertCircle,
    className:
      "bg-[color:var(--severity-moderate)] text-white hover:bg-[color:var(--severity-moderate)]/90 focus-visible:ring-[color:var(--severity-moderate)]",
    message: "Marked stuck. Help request created.",
  },
  {
    id: "needs_help",
    label: "I Need Help",
    Icon: LifeBuoy,
    className:
      "bg-[color:var(--severity-critical)]/90 text-white hover:bg-[color:var(--severity-critical)] focus-visible:ring-[color:var(--severity-critical)]",
    message: "Help request sent to coordinator.",
  },
  {
    id: "sos",
    label: "Send SOS",
    Icon: Siren,
    className:
      "bg-[color:var(--severity-critical)] text-white hover:bg-[color:var(--severity-critical)]/90 focus-visible:ring-[color:var(--severity-critical)] ring-2 ring-[color:var(--severity-critical)]/40",
    message: "SOS sent to coordinator. Call 911 for life-threatening emergencies.",
  },
];

export function RespondQuickAction() {
  const [status, setStatus] = useState<Status>("none");
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const household = useHousehold();
  const home: [number, number] = [household.lat, household.lng];
  const destShelter = resolveDestinationShelter();
  const dest: [number, number] = destShelter ? [destShelter.lat, destShelter.lng] : home;
  const { data: routes } = useRoutes(home, dest);

  const onAction = (a: ActionDef) => {
    setStatus(a.id);
    setLastMessage(a.message);
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      {/* Alert banner */}
      <div
        role="alert"
        className="dc-glow-red flex items-start gap-3 rounded-2xl border border-[color:var(--severity-critical)]/40 bg-gradient-to-r from-[color:var(--severity-critical)]/15 via-white to-white p-4"
      >
        <span
          aria-hidden="true"
          className="dc-pulse mt-1 inline-flex h-3 w-3 shrink-0 rounded-full bg-[color:var(--severity-critical)]"
        />
        <AlertTriangle
          className="mt-0.5 h-6 w-6 shrink-0 text-[color:var(--severity-critical)]"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-base font-extrabold uppercase tracking-wide text-[color:var(--severity-critical)]">
            Active Alert
          </p>
          <p className="mt-1 text-sm font-medium text-foreground/85">
            Follow the safe route and avoid marked danger areas.
          </p>
        </div>
      </div>

      {/* Map */}
      <MapPanel
        disaster="Flood"
        routes={routes}
        selectedRouteId={selectedRouteId}
        onSelectRoute={setSelectedRouteId}
      />

      {/* Status confirmation */}
      {lastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-border bg-white px-4 py-3 text-center text-sm font-semibold text-foreground shadow-sm"
        >
          {lastMessage}
        </div>
      )}

      {/* Four large buttons */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ACTIONS.map((a) => {
          const active = status === a.id;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onAction(a)}
              aria-pressed={active}
              className={`flex min-h-[88px] items-center justify-center gap-3 rounded-2xl px-5 py-5 text-lg font-bold shadow-sm outline-none transition focus-visible:ring-4 focus-visible:ring-offset-2 ${a.className} ${active ? "ring-4 ring-offset-2" : ""}`}
            >
              <a.Icon className="h-6 w-6" aria-hidden="true" />
              {a.label}
            </button>
          );
        })}
      </div>

      {/* 911 safety note */}
      <p className="rounded-xl bg-card-foreground/5 px-4 py-3 text-center text-sm font-medium text-foreground/75">
        If life is in danger, call <span className="font-bold text-foreground">911</span> and follow
        official instructions.
      </p>
    </div>
  );
}
