// Pure alerts adapter. No network, no React — types + mapping so it can be
// unit-tested and bundled to the client safely.

import type { OwmOneCallResponse } from "../api/alerts-owm.functions";

export type AlertSeverity = "low" | "moderate" | "high" | "critical";

export interface DisasterAlert {
  id: string;
  event: string;
  severity: AlertSeverity;
  source: string;
  start: number;
  end: number;
  description: string;
}

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  critical: 3,
  high: 2,
  moderate: 1,
  low: 0,
};

const CRITICAL_KEYWORDS = [
  "warning",
  "tornado",
  "hurricane",
  "tsunami",
  "extreme",
  "emergency",
];
const HIGH_KEYWORDS = ["severe", "flood", "fire", "evacuation"];
const MODERATE_KEYWORDS = ["watch", "advisory", "statement"];

function deriveSeverity(event: string, tags: string[] = []): AlertSeverity {
  const hay = [event, ...tags].join(" ").toLowerCase();
  if (CRITICAL_KEYWORDS.some((k) => hay.includes(k))) return "critical";
  if (HIGH_KEYWORDS.some((k) => hay.includes(k))) return "high";
  if (MODERATE_KEYWORDS.some((k) => hay.includes(k))) return "moderate";
  return "low";
}

export function mapOwmToAlerts(raw: OwmOneCallResponse): DisasterAlert[] {
  const alerts = raw.alerts ?? [];
  const mapped: DisasterAlert[] = alerts.map((a, i) => {
    const event = a.event ?? "Weather alert";
    const tags = a.tags ?? [];
    const start = a.start ?? 0;
    const end = a.end ?? 0;
    return {
      id: `${event}-${start}-${i}`,
      event,
      severity: deriveSeverity(event, tags),
      source: a.sender_name ?? "OpenWeatherMap",
      start,
      end,
      description: a.description ?? "",
    };
  });
  mapped.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
  return mapped;
}
