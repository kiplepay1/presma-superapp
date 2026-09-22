import { useState } from "react";
import { X } from "lucide-react";
import { STAGE_NAMES, type NewRestaurantInput, type Restaurant, type RiskLevel } from "../types";

const BUSINESS_TYPES = ["Sole Proprietorship", "Partnership", "Sdn Bhd"] as const;
const RISK_LEVELS: RiskLevel[] = ["Low", "Medium", "High"];

const emptyForm: NewRestaurantInput = {
  name: "", ownerName: "", ownerPhone: "", ownerEmail: "",
  businessType: "Sole Proprietorship", registrationNo: "",
  outlets: [], stage: "Pilot Agreement", riskLevel: "Low",
  assignedBD: "", assignedOps: "", assignedTech: "", notes: "", surveyUrl: "", logoUrl: "", meetingPhotoUrl: "",
};

export default function RestaurantForm({
  initial, prefill, onSubmit, onClose,
}: {
  initial?: Restaurant;
  prefill?: Partial<NewRestaurantInput>;
  onSubmit: (data: NewRestaurantInput) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<NewRestaurantInput>(
    initial ? {
      name: initial.name, ownerName: initial.ownerName, ownerPhone: initial.ownerPhone, ownerEmail: initial.ownerEmail,
      businessType: initial.businessType, registrationNo: initial.registrationNo, outlets: initial.outlets,
      stage: initial.stage, riskLevel: initial.riskLevel, assignedBD: initial.assignedBD,
      assignedOps: initial.assignedOps, assignedTech: initial.assignedTech, notes: initial.notes,
      surveyUrl: initial.surveyUrl ?? "", logoUrl: initial.logoUrl ?? "", meetingPhotoUrl: initial.meetingPhotoUrl ?? "",
    } : { ...emptyForm, ...prefill }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof NewRestaurantInput>(key: K, value: NewRestaurantInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.ownerName.trim()) {
      setError("Restaurant name and owner name are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(form);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong saving this restaurant.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full rounded border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-brand-500";
  const labelCls = "mb-1 block text-xs font-medium text-ink-soft";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-md border border-border bg-surface shadow-pop" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold">{initial ? "Edit Restaurant" : "Add Restaurant"}</h2>
          <button onClick={onClose} className="text-ink-faint hover:text-ink"><X size={18} /></button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label className={labelCls}>Restaurant Name *</label>
            <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Restoran Nasi Kandar Pelita" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Owner Name *</label>
              <input className={inputCls} value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Business Type</label>
              <select className={inputCls} value={form.businessType} onChange={(e) => set("businessType", e.target.value as NewRestaurantInput["businessType"])}>
                {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Owner Phone</label>
              <input className={inputCls} value={form.ownerPhone} onChange={(e) => set("ownerPhone", e.target.value)} placeholder="+6012-3456789" />
            </div>
            <div>
              <label className={labelCls}>Owner Email</label>
              <input className={inputCls} value={form.ownerEmail} onChange={(e) => set("ownerEmail", e.target.value)} placeholder="owner@example.com" />
            </div>
          </div>

          <div>
            <label className={labelCls}>Registration No. (SSM)</label>
            <input className={inputCls} value={form.registrationNo} onChange={(e) => set("registrationNo", e.target.value)} />
          </div>

          {initial && (
            <p className="rounded bg-paper px-3 py-2 text-xs text-ink-faint">Outlet locations are managed on the restaurant's detail page, under "Outlets" — this form only covers the restaurant's own details.</p>
          )}
          {!initial && (
            <p className="rounded bg-paper px-3 py-2 text-xs text-ink-faint">You'll be able to add outlet locations once this restaurant is created.</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Stage / Status *</label>
              <select className={inputCls} value={form.stage} onChange={(e) => set("stage", e.target.value as NewRestaurantInput["stage"])}>
                {STAGE_NAMES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Risk Level</label>
              <select className={inputCls} value={form.riskLevel} onChange={(e) => set("riskLevel", e.target.value as RiskLevel)}>
                {RISK_LEVELS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Assigned BD</label>
              <input className={inputCls} value={form.assignedBD} onChange={(e) => set("assignedBD", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Assigned Ops</label>
              <input className={inputCls} value={form.assignedOps} onChange={(e) => set("assignedOps", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Assigned Tech</label>
              <input className={inputCls} value={form.assignedTech} onChange={(e) => set("assignedTech", e.target.value)} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Notes</label>
            <textarea className={`${inputCls} min-h-16 resize-y`} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>

          <div>
            <label className={labelCls}>Survey Document Link <span className="text-ink-faint">(OneDrive/Google Drive/Dropbox link to the survey PDF)</span></label>
            <input className={inputCls} value={form.surveyUrl} onChange={(e) => set("surveyUrl", e.target.value)} placeholder="https://..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Logo Image Link <span className="text-ink-faint">(direct image link, not a share page)</span></label>
              <input className={inputCls} value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} placeholder="https://...jpg" />
            </div>
            <div>
              <label className={labelCls}>Survey Meeting Photo Link</label>
              <input className={inputCls} value={form.meetingPhotoUrl} onChange={(e) => set("meetingPhotoUrl", e.target.value)} placeholder="https://...jpg" />
            </div>
          </div>

          {error && <p className="text-xs text-status-red">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <button onClick={onClose} className="rounded border border-border px-3.5 py-1.5 text-sm font-medium text-ink-soft hover:bg-paper">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="rounded bg-brand-500 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60">
            {saving ? "Saving…" : initial ? "Save Changes" : "Add Restaurant"}
          </button>
        </div>
      </div>
    </div>
  );
}
