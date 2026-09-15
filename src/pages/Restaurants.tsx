import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { useRestaurants } from "../lib/useRestaurants";
import { createRestaurant } from "../lib/restaurants";
import { overallStatusFor, type RiskLevel } from "../types";
import { StatusBadge, RiskPill } from "../components/Badges";
import { useAuth } from "../lib/AuthContext";
import RestaurantForm from "../components/RestaurantForm";

const STATUS_FILTERS = ["New Application", "In Verification", "Pending Approval", "Implementation", "Ready for Go-Live", "Live", "Hypercare", "BAU"];

export default function Restaurants() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { restaurants, loading } = useRestaurants();
  const [params, setParams] = useSearchParams();
  const statusFilter = params.get("status") ?? "";
  const stageFilter = params.get("stage") ?? "";
  const [q, setQ] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "">("");
  const [showAdd, setShowAdd] = useState(false);

  const rows = useMemo(() => {
    return restaurants.filter((r) => {
      if (statusFilter && overallStatusFor(r.stage) !== statusFilter) return false;
      if (stageFilter && r.stage !== stageFilter) return false;
      if (riskFilter && r.riskLevel !== riskFilter) return false;
      if (q && !r.name.toLowerCase().includes(q.toLowerCase()) && !r.id.toLowerCase().includes(q.toLowerCase()) && !r.ownerName.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [restaurants, statusFilter, stageFilter, riskFilter, q]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Restaurants</h1>
          <p className="text-sm text-ink-faint">{rows.length} of {restaurants.length} restaurants{statusFilter ? ` · ${statusFilter}` : ""}{stageFilter ? ` · ${stageFilter}` : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, owner, or ID…" className="w-64 rounded border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-brand-500" />
          <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value as RiskLevel | "")} className="rounded border border-border bg-surface px-2.5 py-1.5 text-sm">
            <option value="">All risk</option><option value="Low">Low risk</option><option value="Medium">Medium risk</option><option value="High">High risk</option>
          </select>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 rounded bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600">
            <Plus size={15} /> Add Restaurant
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setParams({})} className={`rounded-full border px-3 py-1 text-xs font-medium ${!statusFilter ? "border-brand-500 bg-brand-50 text-brand-700" : "border-border text-ink-soft hover:bg-paper"}`}>All</button>
        {STATUS_FILTERS.map((s) => (
          <button key={s} onClick={() => setParams({ status: s })} className={`rounded-full border px-3 py-1 text-xs font-medium ${statusFilter === s ? "border-brand-500 bg-brand-50 text-brand-700" : "border-border text-ink-soft hover:bg-paper"}`}>{s}</button>
        ))}
      </div>

      <div className="overflow-hidden rounded border border-border bg-surface shadow-card">
        {loading ? (
          <p className="px-4 py-10 text-center text-sm text-ink-faint">Loading restaurants…</p>
        ) : restaurants.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <p className="text-sm text-ink-faint">No restaurants yet — add your first one to get started.</p>
            <button onClick={() => setShowAdd(true)} className="mt-3 inline-flex items-center gap-1.5 rounded bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600">
              <Plus size={15} /> Add Restaurant
            </button>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-paper">
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-2.5 font-medium">Restaurant</th>
                <th className="px-3 py-2.5 font-medium">Owner</th>
                <th className="px-3 py-2.5 font-medium">Outlets</th>
                <th className="px-3 py-2.5 font-medium">Stage</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Risk</th>
                <th className="px-3 py-2.5 font-medium">Approval</th>
                <th className="px-3 py-2.5 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} onClick={() => navigate(`/restaurants/${r.id}`)} className="cursor-pointer border-b border-border last:border-0 hover:bg-paper">
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-ink-faint">{r.id}</div>
                  </td>
                  <td className="px-3 py-2.5 text-ink-soft">{r.ownerName}</td>
                  <td className="px-3 py-2.5 text-ink-soft">{r.outlets.length || "—"}</td>
                  <td className="px-3 py-2.5 text-ink-soft">{r.stage}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={overallStatusFor(r.stage)} /></td>
                  <td className="px-3 py-2.5"><RiskPill level={r.riskLevel} /></td>
                  <td className="px-3 py-2.5">
                    {r.approvalStatus === "approved" ? <span className="text-xs text-status-green">Approved</span>
                      : r.approvalStatus === "pending" ? <span className="text-xs text-status-amber">Pending</span>
                      : r.approvalStatus === "needs_edit" ? <span className="text-xs text-status-amber">Needs Edit</span>
                      : <span className="text-xs text-status-red">Rejected</span>}
                  </td>
                  <td className="px-3 py-2.5 text-ink-faint">{new Date(r.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <RestaurantForm
          onClose={() => setShowAdd(false)}
          onSubmit={async (data) => { await createRestaurant(data, user.email ?? "unknown"); }}
        />
      )}
    </div>
  );
}
