import { z } from "zod";

export const SavedAddressSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(60),
  address: z.string().trim().min(5).max(200),
  lat: z.number().finite(),
  lng: z.number().finite(),
  displayName: z.string().max(300).optional(),
  city: z.string().nullable().optional(),
  county: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  stateCode: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  countryCode: z.string().nullable().optional(),
  savedAt: z.string(),
});
export type SavedAddress = z.infer<typeof SavedAddressSchema>;

const LIST_KEY = "dc:saved-addresses:v1";
const ACTIVE_KEY = "dc:active-address-id";

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

export function listAddresses(): SavedAddress[] {
  const raw = safeRead<unknown[]>(LIST_KEY, []);
  const out: SavedAddress[] = [];
  for (const item of raw) {
    const parsed = SavedAddressSchema.safeParse(item);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

export function getActiveAddressId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function setActiveAddressId(id: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (id) window.localStorage.setItem(ACTIVE_KEY, id);
    else window.localStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* ignore */
  }
}

export function upsertAddress(addr: SavedAddress): SavedAddress[] {
  const list = listAddresses();
  const idx = list.findIndex((a) => a.id === addr.id);
  if (idx >= 0) list[idx] = addr;
  else list.unshift(addr);
  safeWrite(LIST_KEY, list);
  return list;
}

export function deleteAddress(id: string): SavedAddress[] {
  const list = listAddresses().filter((a) => a.id !== id);
  safeWrite(LIST_KEY, list);
  if (getActiveAddressId() === id) setActiveAddressId(null);
  return list;
}

export function makeId() {
  return `addr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
