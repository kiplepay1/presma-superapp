import type { PlaceResult } from "./places";
import type { Restaurant } from "../types";

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(restoran|restaurant|sdn\s*bhd|enterprise|kedai\s*makan)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function nameSimilarity(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const wordsA = new Set(na.split(" "));
  const wordsB = new Set(nb.split(" "));
  const shared = [...wordsA].filter((w) => wordsB.has(w) && w.length > 2).length;
  const denom = Math.max(wordsA.size, wordsB.size, 1);
  return shared / denom;
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface DuplicateMatch { restaurant: Restaurant; reason: string; confidence: "high" | "medium" }

// Checks a Geoapify prospect against existing PRESMA restaurants using
// several signals, since Geoapify place IDs will never match hand-entered
// restaurants: exact place-ID match, then name similarity combined with
// nearby coordinates (for restaurants that also came from the Locator and
// therefore have outlet coordinates), then name similarity alone as a
// lower-confidence fallback for manually-entered restaurants with no
// coordinates on file.
export function findPossibleDuplicates(prospect: PlaceResult, restaurants: Restaurant[]): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];

  for (const r of restaurants) {
    if (r.geoapifyPlaceId && r.geoapifyPlaceId === prospect.id) {
      matches.push({ restaurant: r, reason: "Same Geoapify place ID", confidence: "high" });
      continue;
    }

    const sim = nameSimilarity(r.name, prospect.name);
    const nearOutlet = r.outlets.find((o) => o.lat != null && o.lon != null && haversineMeters(o.lat!, o.lon!, prospect.lat, prospect.lon) < 300);

    if (sim >= 0.6 && nearOutlet) {
      matches.push({ restaurant: r, reason: `Similar name + nearby coordinates (${Math.round(haversineMeters(nearOutlet.lat!, nearOutlet.lon!, prospect.lat, prospect.lon))}m apart)`, confidence: "high" });
    } else if (sim >= 0.75) {
      matches.push({ restaurant: r, reason: "Very similar restaurant name", confidence: "medium" });
    }
  }

  return matches;
}
