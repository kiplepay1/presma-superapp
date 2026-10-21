import type { Restaurant, Vendor } from "../types";

export interface VendorUsage {
  key: string;
  name: string;
  vendorId: string | null; // null when staff typed a vendor that isn't in the directory yet
  count: number;
}

// Counts how many restaurants use each POS/integration vendor. Matches on the
// directory entry's id first, then falls back to a case-insensitive name match
// so a vendor typed in by staff lines up with the directory once admin adds it.
export function computeVendorUsage(restaurants: Restaurant[], vendors: Vendor[]): { usage: VendorUsage[]; notSet: number } {
  const integration = vendors.filter((v) => v.type === "integration");
  const byId = new Map(integration.map((v) => [v.id, v]));
  const byName = new Map(integration.map((v) => [v.name.trim().toLowerCase(), v]));

  const counts = new Map<string, VendorUsage>();
  let notSet = 0;

  for (const r of restaurants) {
    const typed = (r.posVendorName ?? "").trim();
    if (!typed && !r.posVendorId) { notSet += 1; continue; }

    const matched = (r.posVendorId && byId.get(r.posVendorId)) || byName.get(typed.toLowerCase()) || null;
    const key = matched ? matched.id : `name:${typed.toLowerCase()}`;
    const name = matched ? matched.name : typed;
    const existing = counts.get(key);
    if (existing) existing.count += 1;
    else counts.set(key, { key, name, vendorId: matched ? matched.id : null, count: 1 });
  }

  const usage = [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return { usage, notSet };
}
