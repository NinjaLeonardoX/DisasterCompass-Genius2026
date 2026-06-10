// Free, no-key geocoding via OpenStreetMap Nominatim.
// Usage policy: max 1 req/sec, descriptive UA, cache results.
// https://operations.osmfoundation.org/policies/nominatim/

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  city: string | null;
  county: string | null;
  state: string | null;
  stateCode: string | null;
  country: string | null;
  countryCode: string | null; // ISO 3166-1 alpha-2, lowercase
}

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  county?: string;
  state?: string;
  "ISO3166-2-lvl4"?: string;
  country?: string;
  country_code?: string;
}

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
}

const CACHE_KEY = "dc:geocode-cache:v1";
const memCache = new Map<string, GeocodeResult>();
let lastRequest = 0;

function loadCache(): Record<string, GeocodeResult> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, GeocodeResult>) : {};
  } catch {
    return {};
  }
}

function saveCache(key: string, value: GeocodeResult) {
  memCache.set(key, value);
  if (typeof window === "undefined") return;
  try {
    const all = loadCache();
    all[key] = value;
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(all));
  } catch {
    /* quota */
  }
}

function fromCache(key: string): GeocodeResult | null {
  if (memCache.has(key)) return memCache.get(key)!;
  const all = loadCache();
  const hit = all[key];
  if (hit) memCache.set(key, hit);
  return hit ?? null;
}

async function throttle() {
  const now = Date.now();
  const wait = Math.max(0, 1100 - (now - lastRequest));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequest = Date.now();
}

function normalize(input: string) {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

function pickCity(a: NominatimAddress | undefined): string | null {
  if (!a) return null;
  return a.city ?? a.town ?? a.village ?? a.hamlet ?? null;
}

function pickStateCode(a: NominatimAddress | undefined): string | null {
  if (!a) return null;
  // "ISO3166-2-lvl4": "US-NY" → "NY"
  const iso = a["ISO3166-2-lvl4"];
  if (iso && iso.includes("-")) return iso.split("-")[1] ?? null;
  return null;
}

function toResult(r: NominatimResponse): GeocodeResult {
  return {
    lat: Number.parseFloat(r.lat),
    lng: Number.parseFloat(r.lon),
    displayName: r.display_name,
    city: pickCity(r.address),
    county: r.address?.county ?? null,
    state: r.address?.state ?? null,
    stateCode: pickStateCode(r.address),
    country: r.address?.country ?? null,
    countryCode: r.address?.country_code?.toLowerCase() ?? null,
  };
}

export async function forwardGeocode(address: string, signal?: AbortSignal): Promise<GeocodeResult | null> {
  const key = `f:${normalize(address)}`;
  const cached = fromCache(key);
  if (cached) return cached;

  await throttle();
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", address);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "1");

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal,
    });
    if (!res.ok) return null;
    const arr = (await res.json()) as NominatimResponse[];
    if (!arr.length) return null;
    const out = toResult(arr[0]);
    if (!Number.isFinite(out.lat) || !Number.isFinite(out.lng)) return null;
    saveCache(key, out);
    return out;
  } catch {
    return null;
  }
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<GeocodeResult | null> {
  const key = `r:${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = fromCache(key);
  if (cached) return cached;

  await throttle();
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("zoom", "12");

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as NominatimResponse;
    const out = toResult(json);
    saveCache(key, out);
    return out;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Place autocomplete (multi-result Nominatim search)
// ─────────────────────────────────────────────────────────────────────────────

export interface PlaceSuggestion {
  displayName: string;
  name: string; // short name (e.g. "Lincoln High School")
  klass: string; // Nominatim "class" (e.g. amenity, building)
  type: string; // Nominatim "type" (e.g. school, hospital)
  lat: number;
  lng: number;
  city: string | null;
  state: string | null;
  country: string | null;
}

interface NominatimSearchItem extends NominatimResponse {
  name?: string;
  class?: string;
  type?: string;
}

export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
  limit = 6,
): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  await throttle();
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("namedetails", "1");
  url.searchParams.set("limit", String(limit));

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal,
    });
    if (!res.ok) return [];
    const arr = (await res.json()) as NominatimSearchItem[];
    return arr
      .map((r) => ({
        displayName: r.display_name,
        name: r.name || r.display_name.split(",")[0] || "",
        klass: r.class ?? "",
        type: r.type ?? "",
        lat: Number.parseFloat(r.lat),
        lng: Number.parseFloat(r.lon),
        city: pickCity(r.address),
        state: r.address?.state ?? null,
        country: r.address?.country ?? null,
      }))
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  } catch {
    return [];
  }
}

/** Map an OSM (class, type) pair to a Disaster Compass location type. */
export function inferLocationType(klass: string, type: string): string {
  const t = type.toLowerCase();
  const c = klass.toLowerCase();
  if (t === "school" || t === "kindergarten" || t === "college") return "School";
  if (t === "university") return "University";
  if (t === "hospital" || t === "clinic" || t === "doctors") return "Hospital";
  if (t === "place_of_worship" || c === "place_of_worship") return "Church";
  if (t === "library") return "Library";
  if (t === "community_centre" || t === "townhall") return "Community Center";
  if (t === "fire_station") return "Fire Station";
  if (t === "police") return "Police Station";
  if (c === "shop" || t === "supermarket" || t === "mall") return "Business";
  if (c === "office" || t === "office") return "Office";
  if (c === "tourism" || t === "hotel" || t === "motel") return "Lodging";
  if (c === "building" && (t === "apartments" || t === "residential" || t === "house")) return "Home";
  if (c === "highway" || c === "place") return "Home";
  return "Home";
}
