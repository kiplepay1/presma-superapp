import { GEOAPIFY_API_KEY } from "./geoapifyConfig";

export interface PlaceResult {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  website: string | null;
  category: string | null;
  lat: number;
  lon: number;
}

function checkKey() {
  if (!GEOAPIFY_API_KEY || GEOAPIFY_API_KEY.includes("PASTE_YOUR")) {
    throw new Error("Geoapify API key is not set yet — add it in src/lib/geoapifyConfig.ts.");
  }
}

// ---------------------------------------------------------------------
// Session-lifetime cache — avoids re-hitting Geoapify for the exact same
// area+radius or name+area query more than once per browser session.
// Cleared on page reload; that's fine, the point is avoiding repeat calls
// within one working session, not permanent storage (Firebase is that).
// ---------------------------------------------------------------------
const nearbyCache = new Map<string, PlaceResult[]>();
const nameCache = new Map<string, PlaceResult[]>();
const geocodeCache = new Map<string, { lat: number; lon: number } | null>();

// Resolves a free-text area like "Petaling Jaya, Selangor, Malaysia" into
// coordinates, using Geoapify's free Geocoding API.
export async function geocodeArea(text: string): Promise<{ lat: number; lon: number } | null> {
  checkKey();
  const cacheKey = text.toLowerCase().trim();
  if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey)!;
  const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(text)}&apiKey=${GEOAPIFY_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding failed (${res.status}). Check your Geoapify API key.`);
  const data = await res.json();
  const feature = data?.features?.[0];
  const result = feature ? { lat: feature.geometry.coordinates[1], lon: feature.geometry.coordinates[0] } : null;
  geocodeCache.set(cacheKey, result);
  return result;
}

// Fetches richer contact details (phone, website) for a single place — the
// base Places/Geocoding search responses often omit these even when
// Geoapify's Place Details endpoint actually has them recorded.
async function getPlaceDetails(placeId: string): Promise<{ phone: string | null; website: string | null }> {
  try {
    const url = `https://api.geoapify.com/v2/place-details?id=${encodeURIComponent(placeId)}&features=details&apiKey=${GEOAPIFY_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return { phone: null, website: null };
    const data = await res.json();
    const props = data?.features?.[0]?.properties;
    const contact = props?.contact ?? {};
    const raw = props?.datasource?.raw ?? {};
    return {
      phone: contact.phone ?? raw.phone ?? raw["contact:phone"] ?? raw.mobile ?? null,
      website: contact.website ?? props?.website ?? raw.website ?? null,
    };
  } catch {
    return { phone: null, website: null };
  }
}

async function enrichWithDetails(results: PlaceResult[], cap = 15): Promise<PlaceResult[]> {
  const toEnrich = results.slice(0, cap).filter((r) => !r.phone && r.id);
  if (toEnrich.length === 0) return results;
  const details = await Promise.all(toEnrich.map((r) => getPlaceDetails(r.id)));
  const byId = new Map(toEnrich.map((r, i) => [r.id, details[i]]));
  return results.map((r) => {
    const extra = byId.get(r.id);
    return extra ? { ...r, phone: r.phone ?? extra.phone, website: extra.website } : r;
  });
}

// Turns Geoapify's category slugs (e.g. "catering.restaurant.indian") and any
// OSM cuisine tag into a short, human-readable label for the result card.
function extractCategory(props: any): string | null {
  const cuisine = props?.datasource?.raw?.cuisine as string | undefined;
  if (cuisine) return cuisine.split(";").map((c) => c.trim()).join(", ");
  const categories = (props?.categories ?? []) as string[];
  const specific = categories.find((c) => c.startsWith("catering.restaurant.") || c.includes("indian") || c.includes("asian"));
  if (specific) return specific.split(".").pop()!.replace(/_/g, " ");
  return categories.length ? "Restaurant" : null;
}

const MAMAK_KEYWORDS = /mamak|nasi kandar|banana leaf|restoran|tandoori|briyani|biryani/i;

// Searches restaurants near a point using Geoapify's free Places API. Every
// result Geoapify actually returns is shown — likely-mamak names are just
// sorted first as a convenience, never hidden. This is only ever called
// explicitly (the "Discover more restaurants" button) — never automatically
// on page load or on every keystroke — and results are cached per
// area+radius for the rest of the session to avoid repeat calls.
export async function searchNearbyRestaurants(lat: number, lon: number, radiusMeters = 6000): Promise<PlaceResult[]> {
  checkKey();
  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)},${radiusMeters}`;
  if (nearbyCache.has(cacheKey)) return nearbyCache.get(cacheKey)!;

  const categories = "catering.restaurant.indian,catering.restaurant.asian,catering.restaurant";
  const url = `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:${lon},${lat},${radiusMeters}&bias=proximity:${lon},${lat}&limit=50&apiKey=${GEOAPIFY_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Places search failed (${res.status}). Check your Geoapify API key and enabled plan.`);
  const data = await res.json();
  const features = (data?.features ?? []) as any[];

  const results: PlaceResult[] = features
    .filter((f) => f.properties?.name)
    .map((f) => ({
      id: f.properties.place_id ?? `${f.properties.name}-${f.geometry.coordinates.join(",")}`,
      name: f.properties.name as string,
      address: f.properties.formatted as string,
      phone: (f.properties.contact?.phone as string) ?? (f.properties.datasource?.raw?.phone as string) ?? null,
      website: (f.properties.contact?.website as string) ?? (f.properties.website as string) ?? null,
      category: extractCategory(f.properties),
      lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0],
    }));

  const sorted = results.sort((a, b) => Number(MAMAK_KEYWORDS.test(b.name)) - Number(MAMAK_KEYWORDS.test(a.name)));
  const enriched = await enrichWithDetails(sorted);
  nearbyCache.set(cacheKey, enriched);
  return enriched;
}

// Searches for a specific restaurant by name, scoped to an area — uses
// Geoapify's Geocoding API (which indexes named places, not just addresses)
// since the Places category endpoint only supports location+category
// filtering, not free-text name search. Only called on explicit button
// click, and cached per name+area for the session.
export async function searchByName(name: string, areaContext: string): Promise<PlaceResult[]> {
  checkKey();
  const cacheKey = `${name.toLowerCase().trim()}|${areaContext.toLowerCase().trim()}`;
  if (nameCache.has(cacheKey)) return nameCache.get(cacheKey)!;

  const text = `${name}, ${areaContext}, Malaysia`;
  const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(text)}&type=amenity&limit=10&apiKey=${GEOAPIFY_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Search failed (${res.status}). Check your Geoapify API key.`);
  const data = await res.json();
  const features = (data?.features ?? []) as any[];
  const results: PlaceResult[] = features
    .filter((f) => f.properties?.name)
    .map((f) => ({
      id: f.properties.place_id ?? `${f.properties.name}-${f.geometry.coordinates.join(",")}`,
      name: f.properties.name as string,
      address: f.properties.formatted as string,
      phone: (f.properties.contact?.phone as string) ?? null,
      website: (f.properties.contact?.website as string) ?? null,
      category: extractCategory(f.properties),
      lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0],
    }));
  const enriched = await enrichWithDetails(results);
  nameCache.set(cacheKey, enriched);
  return enriched;
}

// One-click manual fallback — opens a Google Maps search for this exact
// business, where Google's own (often more complete) listing can be
// checked by hand when Geoapify/OSM data is incomplete.
export function googleSearchUrl(name: string, address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`)}`;
}
