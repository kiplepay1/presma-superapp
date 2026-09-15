import { useNavigate } from "react-router-dom";
import { useRestaurants } from "../lib/useRestaurants";
import { buildRecommendations } from "../lib/agents";
import { overallStatusFor } from "../types";
import { KpiCard, SectionCard, InsightCard } from "../components/Cards";
import { StatusBadge, RiskPill } from "../components/Badges";
import { useMode } from "../components/Shell";
import { PipelineFunnel, SlaPerformanceChart } from "../components/Charts";

export default function CommandCentre() {
  const navigate = useNavigate();
  const mode = useMode();
  const { restaurants, loading } = useRestaurants();
  const recs = buildRecommendations(restaurants);

  const counts = {
    total: restaurants.length,
    newApp: restaurants.filter((r) => overallStatusFor(r.stage) === "New Application").length,
    verification: restaurants.filter((r) => overallStatusFor(r.stage) === "In Verification").length,
    pendingApproval: restaurants.filter((r) => overallStatusFor(r.stage) === "Pending Approval").length,
    implementation: restaurants.filter((r) => overallStatusFor(r.stage) === "Implementation").length,
    readyGoLive: restaurants.filter((r) => overallStatusFor(r.stage) === "Ready for Go-Live").length,
    live: restaurants.filter((r) => overallStatusFor(r.stage) === "Live").length,
    hypercare: restaurants.filter((r) => overallStatusFor(r.stage) === "Hypercare").length,
    atRisk: recs.filter((r) => r.riskLevel === "Red").length,
    pendingReview: restaurants.filter((r) => r.approvalStatus !== "approved").length,
  };

  const goToStatus = (status: string) => navigate(`/restaurants?status=${encodeURIComponent(status)}`);

  if (loading) return <p className="py-16 text-center text-sm text-ink-faint">Loading…</p>;

  if (restaurants.length === 0) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="text-lg font-semibold">Welcome to Restaurant On-Boarding System</h1>
        <p className="mt-2 text-sm text-ink-faint">No restaurants yet. Add your first one from the Restaurants page to see live counts, pipeline stages, and AI insights here.</p>
        <button onClick={() => navigate("/restaurants")} className="mt-4 rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">Go to Restaurants</button>
      </div>
    );
  }

  if (mode === "Executive") {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Executive View</h1>
          <p className="text-sm text-ink-faint">PRESMA Ecosystem — Restaurant Onboarding, at a glance.</p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <KpiCard label="Total Restaurants" value={counts.total} onClick={() => navigate("/restaurants")} />
          <KpiCard label="Live" value={counts.live + counts.hypercare} tone="green" onClick={() => goToStatus("Live")} />
          <KpiCard label="In Pipeline" value={counts.total - counts.live - counts.hypercare} />
          <KpiCard label="Flagged by AI" value={counts.atRisk} tone="red" />
        </div>
        <SectionCard title="Top AI Recommendations">
          {recs.length === 0 ? <p className="text-sm text-ink-faint">Nothing flagged right now.</p> : (
            <div className="space-y-3">{recs.slice(0, 3).map((r) => <InsightCard key={r.id} rec={r} />)}</div>
          )}
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Command Centre</h1>
        <p className="text-sm text-ink-faint">Real-time view of all restaurants in the PRESMA onboarding pipeline.</p>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <KpiCard label="Total Restaurants" value={counts.total} onClick={() => navigate("/restaurants")} />
        <KpiCard label="New Applications" value={counts.newApp} onClick={() => goToStatus("New Application")} />
        <KpiCard label="Implementation" value={counts.implementation} onClick={() => goToStatus("Implementation")} />
        <KpiCard label="Ready for Go-Live" value={counts.readyGoLive} tone="amber" onClick={() => goToStatus("Ready for Go-Live")} />
        <KpiCard label="Live / Hypercare" value={counts.live + counts.hypercare} tone="green" onClick={() => goToStatus("Live")} />
        <KpiCard label="Pending Approval" value={counts.pendingApproval} tone="amber" onClick={() => goToStatus("Pending Approval")} />
        <KpiCard label="Awaiting Review" value={counts.pendingReview} tone="amber" onClick={() => navigate("/approvals")} />
        <KpiCard label="Flagged by AI" value={counts.atRisk} tone="red" onClick={() => navigate("/agents")} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <SectionCard title="Onboarding Funnel"><PipelineFunnel restaurants={restaurants} /></SectionCard>
          <SectionCard title="SLA Performance by Stage"><SlaPerformanceChart restaurants={restaurants} /></SectionCard>
          <SectionCard title="Recently Updated" action={<button onClick={() => navigate("/restaurants")} className="text-xs font-medium text-brand-600 hover:underline">View all</button>}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wide text-ink-faint">
                  <th className="pb-2 font-medium">Restaurant</th><th className="pb-2 font-medium">Stage</th>
                  <th className="pb-2 font-medium">Status</th><th className="pb-2 font-medium">Risk</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.slice(0, 8).map((r) => (
                  <tr key={r.id} className="cursor-pointer border-b border-border last:border-0 hover:bg-paper" onClick={() => navigate(`/restaurants/${r.id}`)}>
                    <td className="py-2 font-medium">{r.name}</td>
                    <td className="py-2 text-ink-soft">{r.stage}</td>
                    <td className="py-2"><StatusBadge status={overallStatusFor(r.stage)} /></td>
                    <td className="py-2"><RiskPill level={r.riskLevel} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">AI Recommendations</h3>
            <button onClick={() => navigate("/agents")} className="text-xs font-medium text-brand-600 hover:underline">Open AI Agent Hub</button>
          </div>
          {recs.length === 0 ? <p className="text-sm text-ink-faint">Nothing flagged right now.</p> : recs.slice(0, 5).map((r) => <InsightCard key={r.id} rec={r} />)}
        </div>
      </div>
    </div>
  );
}
