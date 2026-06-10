import type { DisasterKind } from "@/components/compass/DisasterPicker";
import type { DisasterType } from "@/types";

// Seeded Prepare-phase data: hazard risk profile, calm-map geometry, and the
// household readiness gaps. Shared by the overview Readiness Snapshot (Part A)
// and the Readiness Radar screen (Part B) so both read from one source. No
// backend, no live feeds — North Creek demo values only.

export type Severity = "high" | "moderate" | "low";

export const SEVERITY_META: Record<Severity, { label: string; bars: number; color: string }> = {
  high: { label: "High", bars: 3, color: "var(--severity-critical)" },
  moderate: { label: "Moderate", bars: 2, color: "var(--severity-moderate)" },
  low: { label: "Low", bars: 1, color: "var(--severity-low)" },
};

/** Which calm-map zone (if any) visualizes this hazard. */
export type HazardZone = "flood" | "fault" | "wui" | null;

export interface HazardRisk {
  id: string;
  kind: DisasterKind;
  disasterType: DisasterType;
  /** Compact label used in the severity strip (e.g. "Quake"). */
  shortLabel: string;
  severity: Severity;
  zone: HazardZone;
  /** Flood + earthquake get the full pre-mapped readiness treatment. */
  full: boolean;
  destinationName: string;
  destinationType: string;
  routeLine: string;
  firstAction: string;
  /** Earthquake: the route only matters after shaking stops. */
  postShaking?: boolean;
}

// Ordered to match the Part A severity strip: Flood · Heat · Hurricane · Wildfire · Quake.
export const HAZARD_RISKS: HazardRisk[] = [
  {
    id: "flood",
    kind: "Flood",
    disasterType: "flood",
    shortLabel: "Flood",
    severity: "high",
    zone: "flood",
    full: true,
    destinationName: "Hilltop Community Center",
    destinationType: "Higher-ground shelter",
    routeLine: "Route B · Hilltop Avenue",
    firstAction: "Move to higher ground.",
  },
  {
    id: "heat",
    kind: "Extreme Heat",
    disasterType: "heat",
    shortLabel: "Heat",
    severity: "moderate",
    zone: null,
    full: false,
    destinationName: "Hilltop Cooling Center",
    destinationType: "Cooling center",
    routeLine: "Short cooling route · travel in cooler hours",
    firstAction: "Get to a cooling center.",
  },
  {
    id: "hurricane",
    kind: "Hurricane",
    disasterType: "hurricane",
    shortLabel: "Hurricane",
    severity: "moderate",
    zone: null,
    full: false,
    destinationName: "Inland evacuation shelter",
    destinationType: "Evacuation shelter outside the zone",
    routeLine: "Inland route · leave before the deadline",
    firstAction: "Evacuate before the deadline.",
  },
  {
    id: "wildfire",
    kind: "Wildfire",
    disasterType: "wildfire",
    shortLabel: "Wildfire",
    severity: "low",
    zone: "wui",
    full: false,
    destinationName: "Shelter away from the fire path",
    destinationType: "Evacuation shelter",
    routeLine: "Fastest safe exit · backup route ready",
    firstAction: "Take the fastest safe exit.",
  },
  {
    id: "earthquake",
    kind: "Earthquake",
    disasterType: "earthquake",
    shortLabel: "Quake",
    severity: "low",
    zone: "fault",
    full: true,
    destinationName: "Lincoln Park",
    destinationType: "Open assembly area off the fault line",
    routeLine: "Post-shaking · only if your building is unsafe",
    firstAction: "Drop, Cover, Hold On — do not go outside.",
    postShaking: true,
  },
];

export function getHazard(id: string): HazardRisk {
  return HAZARD_RISKS.find((h) => h.id === id) ?? HAZARD_RISKS[0];
}

// ---- Seeded calm-map geometry (decorative risk zones, no routing) ----

/** Fault-line proximity band on the east side of North Creek. */
export const FAULT_LINE_BAND: [number, number][] = [
  [40.0185, -105.2545],
  [40.0345, -105.2495],
  [40.0355, -105.2525],
  [40.0195, -105.2575],
];

/** Wildland–urban interface edge along the NW hills. */
export const WUI_EDGE: [number, number][] = [
  [40.0345, -105.2775],
  [40.0395, -105.269],
  [40.04, -105.274],
  [40.036, -105.282],
];

/** Post-shaking assembly area, sited off the fault line. */
export const ASSEMBLY_POINT = { name: "Lincoln Park", lat: 40.0325, lng: -105.2655 };

// ---- Readiness gaps (household profile → fixable prep items) ----

export type GapFix = "volunteer" | "mark";

export interface PrepareGap {
  id: string;
  label: string;
  detail: string;
  fixedLabel: string;
  fix: GapFix;
  /** Pre-closed in the seed so the demo opens at 60% readiness with 2 gaps left. */
  closedByDefault: boolean;
}

export const PREPARE_GAPS: PrepareGap[] = [
  {
    id: "ride",
    label: "No ride arranged",
    detail: "No vehicle available. Pre-match a volunteer driver before any warning.",
    fixedLabel: "Ride pre-assigned: Ana (truck · pet + accessibility)",
    fix: "volunteer",
    closedByDefault: false,
  },
  {
    id: "power",
    label: "No backup power plan",
    detail: "Plan for outages: charged batteries, device backup, neighbor check-in.",
    fixedLabel: "Backup power plan marked ready",
    fix: "mark",
    closedByDefault: false,
  },
  {
    id: "gobag",
    label: "Go-bag not confirmed",
    detail: "Medications, documents, and pet supplies packed and reachable.",
    fixedLabel: "Go-bag marked ready",
    fix: "mark",
    closedByDefault: true,
  },
  {
    id: "shelter",
    label: "Nearest suitable shelter not confirmed",
    detail: "Needs a pet-friendly, accessible, high-elevation shelter.",
    fixedLabel: "Confirmed: Hilltop Community Center",
    fix: "mark",
    closedByDefault: true,
  },
  {
    id: "contacts",
    label: "Emergency contacts not printed",
    detail: "A printed copy survives a dead phone.",
    fixedLabel: "Emergency contacts printed",
    fix: "mark",
    closedByDefault: true,
  },
];

/** Seeded snapshot numbers for the Part A overview card (static, non-interactive). */
export const SNAPSHOT_READINESS = 60;
export const SNAPSHOT_OPEN_GAPS = PREPARE_GAPS.filter((g) => !g.closedByDefault).length;
export const SNAPSHOT_TOP_GAP = PREPARE_GAPS.find((g) => !g.closedByDefault)?.label ?? "";

// ---- Rollup scale: Household → Community → Town → State → National ----

export type ReadinessScope = "household" | "community" | "town" | "state" | "national";

export interface ScopeMeta {
  id: ReadinessScope;
  label: string;
  place: string;
  blurb: string;
  /** State + national are situational-awareness aggregates, not actionable. */
  context: boolean;
}

export const SCOPE_META: ScopeMeta[] = [
  {
    id: "household",
    label: "Household",
    place: "your household",
    blurb: "your household profile and the gaps to close before the warning.",
    context: false,
  },
  {
    id: "community",
    label: "Community",
    place: "your block",
    blurb: "your neighboring households and who still needs pre-disaster support.",
    context: false,
  },
  {
    id: "town",
    label: "Town",
    place: "North Creek",
    blurb: "the whole town — households, shelters, and transport.",
    context: false,
  },
  {
    id: "state",
    label: "State",
    place: "Colorado",
    blurb: "statewide readiness, aggregated for situational awareness.",
    context: true,
  },
  {
    id: "national",
    label: "National",
    place: "United States",
    blurb: "the national picture, for situational awareness.",
    context: true,
  },
];

export function getScopeMeta(id: ReadinessScope): ScopeMeta {
  return SCOPE_META.find((s) => s.id === id) ?? SCOPE_META[0];
}

/** Readiness color by percentage — shared by rings and bars. */
export function readinessColor(value: number): string {
  if (value >= 80) return "var(--severity-low)";
  if (value >= 50) return "var(--severity-moderate)";
  return "var(--severity-critical)";
}

export interface CommunityMember {
  name: string;
  readiness: number;
  note: string;
}

// Five households on a typical block. "Need support" = readiness < 80.
export const COMMUNITY_MEMBERS: CommunityMember[] = [
  { name: "Household 1", readiness: 60, note: "Ride + backup-power gaps still open." },
  { name: "Household 2", readiness: 100, note: "Rehearsed — sheltering plan with high-ground relatives." },
  { name: "Household 3", readiness: 90, note: "Go-bag ready; confirming a check-in contact." },
  { name: "Household 4", readiness: 100, note: "Go-bag packed, shelter confirmed." },
  { name: "Household 5", readiness: 70, note: "Medication resupply plan still pending." },
];

export interface TownStat {
  label: string;
  value: string;
}

export interface RollupData {
  readiness: number;
  stats: TownStat[];
  note: string;
}

export const TOWN_READINESS: RollupData = {
  readiness: 72,
  stats: [
    { label: "Households ready", value: "3 of 5" },
    { label: "Shelters prep-confirmed", value: "2 of 3" },
    { label: "Drivers pre-matched", value: "1" },
    { label: "Open support requests", value: "2" },
  ],
  note: "North Creek is mostly rehearsed. Two households still need pre-disaster support, and one shelter needs an accessibility upgrade, before the next warning.",
};

// State + national are seeded situational-awareness aggregates (not live data).
export const STATE_READINESS: RollupData = {
  readiness: 64,
  stats: [
    { label: "Counties prepared", value: "41 of 64" },
    { label: "Shelters confirmed", value: "180+" },
    { label: "Households reached", value: "1.2M" },
    { label: "Open support requests", value: "230" },
  ],
  note: "Statewide readiness aggregates county programs across Colorado. Demo figures for situational awareness — not live data.",
};

export const NATIONAL_READINESS: RollupData = {
  readiness: 58,
  stats: [
    { label: "States reporting", value: "44 of 50" },
    { label: "Shelter network", value: "5,400+" },
    { label: "Households reached", value: "18M" },
    { label: "Programs active", value: "320" },
  ],
  note: "National rollup across participating states. Demo figures for situational awareness — not live data.",
};
