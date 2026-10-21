import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Globe, User } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { useVendors } from "../lib/useVendors";
import { useRestaurants } from "../lib/useRestaurants";
import { computeVendorUsage } from "../lib/vendorStats";
import { createVendor, updateVendor, deleteVendor } from "../lib/vendors";
import { KpiCard } from "../components/Cards";
import VendorForm from "../components/VendorForm";
import type { Vendor, NewVendorInput } from "../types";

export default function Vendors() {
  const { isAdmin } = useAuth();
  const { vendors, loading } = useVendors();
  const { restaurants } = useRestaurants();
  const [showAdd, setShowAdd] = useState(false);
  const [addPrefill, setAddPrefill] = useState<Partial<NewVendorInput> | undefined>(undefined);
  const [editing, setEditing] = useState<Vendor | null>(null);

  const { usage, notSet } = useMemo(() => computeVendorUsage(restaurants, vendors), [restaurants, vendors]);
  const countFor = (v: Vendor) => usage.find((u) => u.vendorId === v.id)?.count ?? 0;
  const unlisted = usage.filter((u) => u.vendorId === null);

  if (!isAdmin) {
    return <p className="py-16 text-center text-sm text-ink-faint">The Vendors directory is only available to the administrator.</p>;
  }
  if (loading) return <p className="py-16 text-center text-sm text-ink-faint">Loading…</p>;

  const mainVendors = vendors.filter((v) => v.type === "main");
  const integrationVendors = vendors.filter((v) => v.type === "integration");

  const handleDelete = async (v: Vendor) => {
    const n = countFor(v);
    const warning = n > 0 ? ` ${n} restaurant(s) currently use it — they will keep the vendor name, but it will no longer be linked to a directory entry.` : "";
    if (!confirm(`Delete ${v.name}?${warning}`)) return;
    await deleteVendor(v.id);
  };

  const openAdd = (prefill?: Partial<NewVendorInput>) => { setAddPrefill(prefill); setShowAdd(true); };

  const VendorCard = ({ v }: { v: Vendor }) => (
    <div className="rounded border border-border bg-surface p-3 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium">{v.name}</div>
          {v.category && <span className="mt-1 inline-block rounded bg-status-blueBg px-1.5 py-0.5 text-[10px] font-medium text-status-blue">{v.category}</span>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {v.type === "integration" && (
            <span className="rounded bg-status-greenBg px-2 py-0.5 text-[11px] font-medium text-status-green">{countFor(v)} restaurant{countFor(v) === 1 ? "" : "s"}</span>
          )}
          <button onClick={() => setEditing(v)} className="text-ink-faint hover:text-ink" title="Edit"><Pencil size={14} /></button>
          <button onClick={() => handleDelete(v)} className="text-ink-faint hover:text-status-red" title="Delete"><Trash2 size={14} /></button>
        </div>
      </div>
      {v.description && <p className="mt-2 text-xs text-ink-soft">{v.description}</p>}
      {(v.contactPerson || v.website) && (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-ink-faint">
          {v.contactPerson && <span className="flex items-center gap-1"><User size={11} /> {v.contactPerson}</span>}
          {v.website && <a href={v.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-brand-600 hover:underline"><Globe size={11} /> Website</a>}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Vendors</h1>
          <p className="text-sm text-ink-faint">Admin only · main platform providers and the POS / integration vendors restaurants use.</p>
        </div>
        <button onClick={() => openAdd()} className="flex items-center gap-1.5 rounded bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600">
          <Plus size={15} /> Add Vendor
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Main Vendors" value={mainVendors.length} />
        <KpiCard label="Integration Vendors" value={integrationVendors.length} />
        <KpiCard label="Restaurants with a POS vendor" value={restaurants.length - notSet} tone="green" />
        <KpiCard label="Restaurants with no vendor set" value={notSet} tone={notSet > 0 ? "amber" : undefined} />
      </div>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Main vendors (platform / feature providers)</h2>
        {mainVendors.length === 0 ? (
          <p className="rounded border border-border bg-surface px-4 py-6 text-center text-sm text-ink-faint shadow-card">No main vendors added yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">{mainVendors.map((v) => <VendorCard key={v.id} v={v} />)}</div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Integration vendors (POS &amp; restaurant systems)</h2>
        {integrationVendors.length === 0 ? (
          <p className="rounded border border-border bg-surface px-4 py-6 text-center text-sm text-ink-faint shadow-card">No integration vendors added yet. Add one (e.g. a POS provider) so staff can pick it from a dropdown on each restaurant.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">{integrationVendors.map((v) => <VendorCard key={v.id} v={v} />)}</div>
        )}
      </section>

      {unlisted.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Named by staff, not in the directory yet</h2>
          <div className="rounded border border-border bg-surface shadow-card">
            {unlisted.map((u) => (
              <div key={u.key} className="flex items-center justify-between border-b border-border px-4 py-2.5 text-sm last:border-0">
                <div><span className="font-medium">{u.name}</span> <span className="text-ink-faint">· {u.count} restaurant{u.count === 1 ? "" : "s"}</span></div>
                <button onClick={() => openAdd({ name: u.name, type: "integration" })} className="rounded border border-border px-2.5 py-1 text-xs font-medium text-ink-soft hover:bg-paper">Add to directory</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {showAdd && (
        <VendorForm prefill={addPrefill} onClose={() => setShowAdd(false)} onSubmit={createVendor} />
      )}
      {editing && (
        <VendorForm initial={editing} onClose={() => setEditing(null)} onSubmit={(data) => updateVendor(editing.id, data)} />
      )}
    </div>
  );
}
