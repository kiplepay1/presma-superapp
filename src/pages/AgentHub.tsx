import { useRestaurants } from "../lib/useRestaurants";
import { AGENTS, agentStats, buildRecommendations } from "../lib/agents";
import { AgentCard, InsightCard } from "../components/Cards";

export default function AgentHub() {
  const { restaurants, loading } = useRestaurants();
  const recs = buildRecommendations(restaurants);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">AI Agent Hub</h1>
        <p className="text-sm text-ink-faint">Two agents that watch your real onboarding data and flag what needs attention — based on actual time-in-stage against the SOP's SLA table.</p>
      </div>

      {loading ? (
        <p className="text-sm text-ink-faint">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {AGENTS.map((a) => {
            const stats = agentStats(a.id, recs, restaurants.length);
            return <AgentCard key={a.id} agent={a} issuesDetected={stats.issuesDetected} restaurantsAffected={stats.restaurantsAffected} />;
          })}
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold">Current Findings</h2>
        {recs.length === 0 ? (
          <p className="rounded border border-border bg-surface px-4 py-8 text-center text-sm text-ink-faint shadow-card">No issues detected — every approved restaurant is within its SLA.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">{recs.map((r) => <InsightCard key={r.id} rec={r} />)}</div>
        )}
      </div>
    </div>
  );
}
