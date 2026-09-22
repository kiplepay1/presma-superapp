import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRestaurants } from "../lib/useRestaurants";
import { STAGE_SLA, type TaskItem } from "../types";
import { StatusBadge } from "../components/Badges";
import { KpiCard } from "../components/Cards";

const FILTERS = ["All", "Overdue", "AI Recommended", "Blocked"] as const;

function buildTasks(restaurants: ReturnType<typeof useRestaurants>["restaurants"]): TaskItem[] {
  return restaurants
    .filter((r) => r.approvalStatus === "approved" && r.stage !== "BAU Handover")
    .map((r) => {
      const days = Math.floor((Date.now() - r.stageChangedAt) / 86400000);
      const sla = STAGE_SLA[r.stage];
      const overdue = days >= sla.escalateDay;
      const atRisk = days >= sla.slaDays;
      return {
        id: r.id, title: `Move "${r.name}" forward from ${r.stage}`,
        restaurantId: r.id, restaurantName: r.name, stage: r.stage,
        assignee: r.assignedOps || r.assignedBD || r.assignedTech || sla.owner,
        priority: overdue ? "Critical" : atRisk ? "High" : "Medium",
        dueDate: new Date(r.stageChangedAt + sla.slaDays * 86400000).toLocaleDateString(),
        status: overdue ? "Overdue" : "Open",
        aiRecommended: overdue || atRisk,
        dependency: null,
      } as TaskItem;
    })
    .sort((a, b) => ({ Critical: 0, High: 1, Medium: 2, Low: 3 }[a.priority] - { Critical: 0, High: 1, Medium: 2, Low: 3 }[b.priority]));
}

export default function Tasks() {
  const navigate = useNavigate();
  const { restaurants, loading } = useRestaurants();
  const all = useMemo(() => buildTasks(restaurants), [restaurants]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const rows = all.filter((t) => {
    if (filter === "Overdue") return t.status === "Overdue";
    if (filter === "AI Recommended") return t.aiRecommended;
    if (filter === "Blocked") return t.status === "Blocked";
    return true;
  });

  if (loading) return <p className="py-16 text-center text-sm text-ink-faint">Loading…</p>;

  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-semibold">Tasks & SLA</h1><p className="text-sm text-ink-faint">Auto-generated from real time-in-stage vs the SOP's SLA table — no manual task entry needed.</p></div>
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Overdue" value={all.filter((t) => t.status === "Overdue").length} tone="red" onClick={() => setFilter("Overdue")} />
        <KpiCard label="AI Recommended" value={all.filter((t) => t.aiRecommended).length} tone="amber" onClick={() => setFilter("AI Recommended")} />
        <KpiCard label="Open" value={all.length} onClick={() => setFilter("All")} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-3 py-1 text-xs font-medium ${filter === f ? "border-brand-500 bg-brand-50 text-brand-700" : "border-border text-ink-soft hover:bg-paper"}`}>{f}</button>
        ))}
      </div>
      <div className="overflow-hidden rounded border border-border bg-surface shadow-card">
        {rows.length === 0 ? <p className="px-4 py-8 text-center text-sm text-ink-faint">No tasks match this filter.</p> : (
          <table className="w-full text-left text-sm">
            <thead className="bg-paper"><tr className="border-b border-border text-[11px] uppercase tracking-wide text-ink-faint">
              <th className="px-4 py-2.5 font-medium">Task</th><th className="px-3 py-2.5 font-medium">Assignee</th>
              <th className="px-3 py-2.5 font-medium">Priority</th><th className="px-3 py-2.5 font-medium">SLA Due</th>
              <th className="px-3 py-2.5 font-medium">Status</th><th className="px-3 py-2.5 font-medium">AI</th>
            </tr></thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="cursor-pointer border-b border-border last:border-0 hover:bg-paper" onClick={() => navigate(`/restaurants/${t.restaurantId}`)}>
                  <td className="px-4 py-2 font-medium">{t.title}</td>
                  <td className="px-3 py-2 text-ink-soft">{t.assignee}</td>
                  <td className="px-3 py-2"><span className={`text-xs font-semibold ${t.priority === "Critical" ? "text-status-red" : t.priority === "High" ? "text-status-amber" : "text-ink-soft"}`}>{t.priority}</span></td>
                  <td className="px-3 py-2 text-ink-faint">{t.dueDate}</td>
                  <td className="px-3 py-2"><StatusBadge status={t.status} /></td>
                  <td className="px-3 py-2 text-xs">{t.aiRecommended ? "✓" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
