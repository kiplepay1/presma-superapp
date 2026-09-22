import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, RotateCcw } from "lucide-react";
import { useRestaurants } from "../lib/useRestaurants";
import { setRestaurantApproval } from "../lib/restaurants";
import { useAuth } from "../lib/AuthContext";
import { SectionCard, KpiCard } from "../components/Cards";
import type { Restaurant } from "../types";

export default function Approvals() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { restaurants, loading } = useRestaurants();
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const pending = restaurants.filter((r) => r.approvalStatus === "pending");
  const needsEdit = restaurants.filter((r) => r.approvalStatus === "needs_edit");
  const rejected = restaurants.filter((r) => r.approvalStatus === "rejected");

  const act = async (r: Restaurant, status: "approved" | "rejected" | "needs_edit") => {
    await setRestaurantApproval(r, status, noteDrafts[r.id] ?? "", user.email ?? "admin");
    setNoteDrafts((d) => ({ ...d, [r.id]: "" }));
  };

  if (loading) return <p className="py-16 text-center text-sm text-ink-faint">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Approvals</h1>
        <p className="text-sm text-ink-faint">Restaurant records added or edited by the team, awaiting admin review.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Pending" value={pending.length} tone="amber" />
        <KpiCard label="Needs Edit" value={needsEdit.length} tone="amber" />
        <KpiCard label="Rejected" value={rejected.length} tone="red" />
      </div>

      {!isAdmin && (
        <p className="rounded border border-border bg-surface px-4 py-3 text-sm text-ink-faint shadow-card">
          Only the administrator can approve, reject, or request edits here. You can see the status of submissions below.
        </p>
      )}

      <SectionCard title={`Pending (${pending.length})`}>
        {pending.length === 0 ? <p className="text-sm text-ink-faint">Nothing pending.</p> : (
          <ul className="space-y-3">
            {pending.map((r) => (
              <li key={r.id} className="rounded border border-border p-3">
                <div className="flex items-center justify-between">
                  <button onClick={() => navigate(`/restaurants/${r.id}`)} className="text-left">
                    <div className="text-sm font-medium hover:underline">{r.name}</div>
                    <div className="text-xs text-ink-faint">{r.stage} · submitted by {r.createdBy}</div>
                  </button>
                </div>
                {isAdmin && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      value={noteDrafts[r.id] ?? ""} onChange={(e) => setNoteDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                      placeholder="Optional note (shown if rejected / sent back)"
                      className="flex-1 rounded border border-border bg-surface px-2.5 py-1.5 text-xs outline-none focus:border-brand-500"
                    />
                    <button onClick={() => act(r, "approved")} className="flex items-center gap-1 rounded bg-status-green px-2.5 py-1.5 text-xs font-medium text-white hover:opacity-90"><Check size={13} /> Approve</button>
                    <button onClick={() => act(r, "needs_edit")} className="flex items-center gap-1 rounded border border-border px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-paper"><RotateCcw size={13} /> Ask to Edit</button>
                    <button onClick={() => act(r, "rejected")} className="flex items-center gap-1 rounded bg-status-red px-2.5 py-1.5 text-xs font-medium text-white hover:opacity-90"><X size={13} /> Reject</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {needsEdit.length > 0 && (
        <SectionCard title={`Sent Back for Edit (${needsEdit.length})`}>
          <ul className="space-y-2">
            {needsEdit.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm">
                <button onClick={() => navigate(`/restaurants/${r.id}`)} className="text-left hover:underline">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-ink-faint">{r.approvalNote}</div>
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {rejected.length > 0 && (
        <SectionCard title={`Rejected (${rejected.length})`}>
          <ul className="space-y-2">
            {rejected.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm">
                <button onClick={() => navigate(`/restaurants/${r.id}`)} className="text-left hover:underline">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-ink-faint">{r.approvalNote}</div>
                </button>
                {isAdmin && <button onClick={() => act(r, "approved")} className="rounded border border-border px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-paper">Approve instead</button>}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
