import type { DisasterKind } from "./DisasterPicker";
import { useLocation } from "@/components/LocationContext";


interface Community {
  name: string;
  households: number;
  risk: "High" | "Elevated" | "Moderate";
  readiness: number; // 0–100
  reason: string;
}

// Realistic but in-memory: 3 nearby communities per hazard, ranked by risk.
// Numbers reflect plausible small-town counts and FEMA-style readiness gaps
// (shelter access, transport, registered vulnerable residents).
const COMMUNITIES: Record<DisasterKind, Community[]> = {
  Flood: [
    { name: "North Creek (Riverside)", households: 412, risk: "High", readiness: 48, reason: "Floodplain, 1 bridge out, low vehicle access" },
    { name: "Mill District", households: 287, risk: "Elevated", readiness: 64, reason: "Storm drains undersized, 2 shelters within 2 mi" },
    { name: "Eastside", households: 531, risk: "Moderate", readiness: 81, reason: "Above flood line, accessible shelter" },
  ],
  Wildfire: [
    { name: "Ridge Hollow", households: 198, risk: "High", readiness: 41, reason: "WUI zone, single egress road, dry fuels" },
    { name: "Pinecrest", households: 264, risk: "Elevated", readiness: 59, reason: "Defensible space partial, 2 evac routes" },
    { name: "Downtown North Creek", households: 612, risk: "Moderate", readiness: 78, reason: "Hydrant grid, paved buffer" },
  ],
  Hurricane: [
    { name: "Bayshore", households: 356, risk: "High", readiness: 52, reason: "Surge zone A, 38% mobile homes" },
    { name: "Harbor Flats", households: 221, risk: "Elevated", readiness: 67, reason: "Surge zone B, shutters on file" },
    { name: "Uptown Ridge", households: 489, risk: "Moderate", readiness: 84, reason: "Elev. 60 ft, hardened shelter" },
  ],
  Earthquake: [
    { name: "Old Town (URM)", households: 174, risk: "High", readiness: 39, reason: "Unreinforced masonry, pre-1970 stock" },
    { name: "Schoolhouse District", households: 312, risk: "Elevated", readiness: 62, reason: "Retrofitted school as assembly point" },
    { name: "Hilltop Estates", households: 428, risk: "Moderate", readiness: 80, reason: "Modern code, open assembly areas" },
  ],
  "Extreme Heat": [
    { name: "Senior Village", households: 142, risk: "High", readiness: 44, reason: "62% age 65+, 28% no AC, power-dep. devices" },
    { name: "Mill District", households: 287, risk: "Elevated", readiness: 61, reason: "Older housing, cooling center 1.4 mi" },
    { name: "Eastside", households: 531, risk: "Moderate", readiness: 82, reason: "AC penetration high, library cooling center" },
  ],
};

const RISK_TONE: Record<Community["risk"], string> = {
  High: "bg-red-50 text-red-700 ring-1 ring-red-200",
  Elevated: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  Moderate: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
};

function readinessTone(score: number) {
  if (score < 55) return { bar: "bg-red-500", text: "text-red-600" };
  if (score < 75) return { bar: "bg-amber-500", text: "text-amber-600" };
  return { bar: "bg-emerald-500", text: "text-emerald-600" };
}

export function CommunityReadiness({ disaster }: { disaster: DisasterKind }) {
  const list = COMMUNITIES[disaster];
  const { resolved, source } = useLocation();
  const scope = resolved?.city
    ? `${resolved.city}${resolved.state ? `, ${resolved.state}` : ""}`
    : null;
  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-card-foreground/55">
          Communities most likely to be hit
          {scope && <span className="ml-1 normal-case tracking-normal text-card-foreground/45">· near {scope}</span>}
        </p>
        <p className="text-[11px] text-card-foreground/45">
          Readiness = shelter access · transport · vulnerable residents
        </p>
      </div>
      {source === "seed" && (
        <p className="mt-1 text-[11px] italic text-card-foreground/55">
          Illustrative example — set your address above to anchor this to your real area.
        </p>
      )}
      <ul className="mt-3 space-y-2">
        {list.map((c) => {
          const tone = readinessTone(c.readiness);
          return (
            <li
              key={c.name}
              className="rounded-lg border border-border bg-white/60 px-3 py-2.5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-card-foreground">
                      {c.name}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${RISK_TONE[c.risk]}`}
                    >
                      {c.risk} risk
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-card-foreground/60">
                    {c.households} households · {c.reason}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-lg font-bold leading-none ${tone.text}`}>
                    {c.readiness}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-card-foreground/45">
                    readiness
                  </p>
                </div>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full ${tone.bar}`}
                  style={{ width: `${c.readiness}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
