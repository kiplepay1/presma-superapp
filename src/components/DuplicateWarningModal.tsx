import { AlertTriangle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { DuplicateMatch } from "../lib/duplicateCheck";

export default function DuplicateWarningModal({
  prospectName, matches, onUpdateExisting, onAddAnyway, onClose,
}: {
  prospectName: string;
  matches: DuplicateMatch[];
  onUpdateExisting: (restaurantId: string) => void;
  onAddAnyway: () => void;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const top = matches[0];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-md border border-border bg-surface shadow-pop" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-status-amber">
            <AlertTriangle size={16} /> Possible duplicate restaurant
          </div>
          <button onClick={onClose} className="text-ink-faint hover:text-ink"><X size={18} /></button>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-ink-soft">"{prospectName}" (from Geoapify) looks similar to {matches.length > 1 ? "existing PRESMA records" : "an existing PRESMA record"}:</p>

          <div className="mt-3 space-y-2">
            {matches.slice(0, 3).map((m) => (
              <div key={m.restaurant.id} className="rounded border border-border bg-paper px-3 py-2">
                <div className="text-sm font-medium">{m.restaurant.name}</div>
                <div className="mt-0.5 text-xs text-ink-faint">{m.reason} · {m.confidence === "high" ? "High confidence" : "Possible match"}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <button onClick={() => navigate(`/restaurants/${top.restaurant.id}`)} className="rounded border border-border px-3 py-2 text-left text-sm text-ink-soft hover:bg-paper">
              Use existing record →
            </button>
            <button onClick={() => onUpdateExisting(top.restaurant.id)} className="rounded border border-border px-3 py-2 text-left text-sm text-ink-soft hover:bg-paper">
              Update existing record with this info
            </button>
            <button onClick={onAddAnyway} className="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600">
              Add as new restaurant anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
