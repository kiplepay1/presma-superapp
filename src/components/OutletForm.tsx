import { useState } from "react";
import { X } from "lucide-react";
import type { Outlet, OutletStatus } from "../types";

const emptyForm: Omit<Outlet, "id"> = { location: "", contactPerson: "", phone: "", status: "Active" };

export default function OutletForm({
  initial, onSubmit, onClose,
}: {
  initial?: Outlet;
  onSubmit: (data: Omit<Outlet, "id">) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<Outlet, "id">>(initial ? { location: initial.location, contactPerson: initial.contactPerson, phone: initial.phone, status: initial.status } : emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.location.trim()) { setError("Outlet location is required."); return; }
    setSaving(true); setError(null);
    try {
      await onSubmit(form);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong saving this outlet.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full rounded border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-brand-500";
  const labelCls = "mb-1 block text-xs font-medium text-ink-soft";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm overflow-hidden rounded-md border border-border bg-surface shadow-pop" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold">{initial ? "Edit Outlet" : "Add Outlet"}</h2>
          <button onClick={onClose} className="text-ink-faint hover:text-ink"><X size={18} /></button>
        </div>
        <div className="space-y-3 px-5 py-4">
          <div>
            <label className={labelCls}>Location *</label>
            <input className={inputCls} value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Klang, Selangor" autoFocus />
          </div>
          <div>
            <label className={labelCls}>Contact Person</label>
            <input className={inputCls} value={form.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+6012-3456789" />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value as OutletStatus)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          {error && <p className="text-xs text-status-red">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <button onClick={onClose} className="rounded border border-border px-3.5 py-1.5 text-sm font-medium text-ink-soft hover:bg-paper">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="rounded bg-brand-500 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60">
            {saving ? "Saving…" : initial ? "Save Changes" : "Add Outlet"}
          </button>
        </div>
      </div>
    </div>
  );
}
