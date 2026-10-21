import { useState } from "react";
import { X } from "lucide-react";
import type { NewVendorInput, Vendor, VendorType } from "../types";

export default function VendorForm({
  initial, prefill, onSubmit, onClose,
}: {
  initial?: Vendor;
  prefill?: Partial<NewVendorInput>;
  onSubmit: (data: NewVendorInput) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<NewVendorInput>(
    initial
      ? { name: initial.name, type: initial.type, category: initial.category, description: initial.description, contactPerson: initial.contactPerson, website: initial.website }
      : { name: "", type: "integration", category: "", description: "", contactPerson: "", website: "", ...prefill }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof NewVendorInput>(key: K, value: NewVendorInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Vendor name is required."); return; }
    setSaving(true); setError(null);
    try {
      await onSubmit({ ...form, name: form.name.trim() });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong saving this vendor.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full rounded border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-brand-500";
  const labelCls = "mb-1 block text-xs font-medium text-ink-soft";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-md border border-border bg-surface shadow-pop" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold">{initial ? "Edit Vendor" : "Add Vendor"}</h2>
          <button onClick={onClose} className="text-ink-faint hover:text-ink"><X size={18} /></button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div>
            <label className={labelCls}>Vendor Type *</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                ["main", "Main Vendor", "Provides PRESMA platform features"],
                ["integration", "Integration Vendor", "API-integrated, e.g. POS systems"],
              ] as [VendorType, string, string][]).map(([value, title, hint]) => (
                <button
                  key={value} type="button" onClick={() => set("type", value)}
                  className={`rounded border px-3 py-2 text-left ${form.type === value ? "border-brand-500 bg-brand-50" : "border-border hover:bg-paper"}`}
                >
                  <div className="text-sm font-medium">{title}</div>
                  <div className="text-[11px] text-ink-faint">{hint}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Vendor Name *</label>
            <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus />
          </div>

          <div>
            <label className={labelCls}>Category <span className="text-ink-faint">(e.g. Payments, POS, Loyalty)</span></label>
            <input className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value)} />
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea className={`${inputCls} min-h-16 resize-y`} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Contact Person</label>
              <input className={inputCls} value={form.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Website</label>
              <input className={inputCls} value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." />
            </div>
          </div>

          {error && <p className="text-xs text-status-red">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <button onClick={onClose} className="rounded border border-border px-3.5 py-1.5 text-sm font-medium text-ink-soft hover:bg-paper">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="rounded bg-brand-500 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60">
            {saving ? "Saving…" : initial ? "Save Changes" : "Add Vendor"}
          </button>
        </div>
      </div>
    </div>
  );
}
