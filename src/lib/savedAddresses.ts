import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

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

// Only the *active selection* stays local-per-browser (personal pick).
const ACTIVE_KEY = "dc:active-address-id";

type Row = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  display_name: string | null;
  city: string | null;
  county: string | null;
  state: string | null;
  state_code: string | null;
  country: string | null;
  country_code: string | null;
  saved_at: string;
};

function rowToAddress(r: Row): SavedAddress {
  return {
    id: r.id,
    name: r.name,
    address: r.address,
    lat: Number(r.lat),
    lng: Number(r.lng),
    displayName: r.display_name ?? undefined,
    city: r.city,
    county: r.county,
    state: r.state,
    stateCode: r.state_code,
    country: r.country,
    countryCode: r.country_code,
    savedAt: r.saved_at,
  };
}

function addressToRow(a: SavedAddress): Row {
  return {
    id: a.id,
    name: a.name,
    address: a.address,
    lat: a.lat,
    lng: a.lng,
    display_name: a.displayName ?? null,
    city: a.city ?? null,
    county: a.county ?? null,
    state: a.state ?? null,
    state_code: a.stateCode ?? null,
    country: a.country ?? null,
    country_code: a.countryCode ?? null,
    saved_at: a.savedAt,
  };
}

export async function listAddresses(): Promise<SavedAddress[]> {
  const { data, error } = await supabase
    .from("saved_addresses")
    .select("*")
    .order("saved_at", { ascending: false });
  if (error || !data) return [];
  return (data as Row[]).map(rowToAddress);
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

export async function upsertAddress(addr: SavedAddress): Promise<void> {
  const { error } = await supabase
    .from("saved_addresses")
    .upsert(addressToRow(addr) as never, { onConflict: "id" });
  if (error) throw error;
}

export async function deleteAddress(id: string): Promise<void> {
  const { error } = await supabase.from("saved_addresses").delete().eq("id", id);
  if (error) throw error;
  if (getActiveAddressId() === id) setActiveAddressId(null);
}

export function makeId() {
  return `addr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
