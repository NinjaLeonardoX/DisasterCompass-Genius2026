// Free, no-key, CORS-friendly National Weather Service alerts.
// Docs: https://www.weather.gov/documentation/services-web-api

export type NwsSeverity =
  | "Extreme"
  | "Severe"
  | "Moderate"
  | "Minor"
  | "Unknown";

export interface NwsAlert {
  id: string;
  event: string;
  severity: NwsSeverity;
  headline: string;
  areaDesc: string;
  sent: string;
  ends: string | null;
}

export interface NwsResult {
  alerts: NwsAlert[];
  fetchedAt: string;
  sourceUrl: string;
}

interface NwsFeature {
  id?: string;
  properties: {
    event?: string;
    severity?: string;
    headline?: string;
    areaDesc?: string;
    sent?: string;
    ends?: string | null;
  };
}

interface NwsResponse {
  features?: NwsFeature[];
}

const VALID_SEVERITY: ReadonlyArray<NwsSeverity> = [
  "Extreme",
  "Severe",
  "Moderate",
  "Minor",
  "Unknown",
];

function toSeverity(s: string | undefined): NwsSeverity {
  const v = (s ?? "Unknown") as NwsSeverity;
  return VALID_SEVERITY.includes(v) ? v : "Unknown";
}

function normalize(json: NwsResponse, sourceUrl: string): NwsResult {
  const features = Array.isArray(json.features) ? json.features : [];
  const alerts: NwsAlert[] = features.map((f, i) => ({
    id: f.id ?? `nws-${i}`,
    event: f.properties.event ?? "Unknown event",
    severity: toSeverity(f.properties.severity),
    headline: f.properties.headline ?? f.properties.event ?? "",
    areaDesc: f.properties.areaDesc ?? "",
    sent: f.properties.sent ?? "",
    ends: f.properties.ends ?? null,
  }));
  return { alerts, fetchedAt: new Date().toISOString(), sourceUrl };
}

async function fetchJson(url: string, signal?: AbortSignal): Promise<NwsResult | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/geo+json",
      },
      signal,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as NwsResponse;
    return normalize(json, url);
  } catch {
    return null;
  }
}

/** Active alerts for a single point (community-level). US only. */
export function fetchAlertsByPoint(lat: number, lng: number, signal?: AbortSignal) {
  const url = `https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lng.toFixed(4)}`;
  return fetchJson(url, signal);
}

/** Active alerts for a US state (e.g. "NY", "TX"). */
export function fetchAlertsByState(stateCode: string, signal?: AbortSignal) {
  const code = stateCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return Promise.resolve(null);
  const url = `https://api.weather.gov/alerts/active?area=${code}`;
  return fetchJson(url, signal);
}

/** Active alerts nationwide (US). */
export function fetchAlertsNational(signal?: AbortSignal) {
  return fetchJson("https://api.weather.gov/alerts/active", signal);
}
