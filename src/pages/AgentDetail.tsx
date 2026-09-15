import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useRestaurants } from "../lib/useRestaurants";
import { AGENTS, agentStats, buildRecommendations } from "../lib/agents";
import { InsightCard } from "../components/Cards";

export default function AgentDetail() {
  const { id } = useParams();
  const { restaurants } = useRestaurants();
  const recs = buildRecommendations(restaurants);
  const agent = AGENTS.find((a) => a.id === id);
  if (!agent) return <p className="text-sm text-ink-faint">Agent not found.</p>;
  const stats = agentStats(agent.id, recs, restaurants.length);

  return (
    <div className="space-y-5">
      <Link to="/agents" className="flex w-fit items-center gap-1.5 text-xs font-medium text-ink-faint hover:text-ink"><ArrowLeft size={14} /> Back to AI Agent Hub</Link>

      <div className="rounded border border-border bg-surface p-5 shadow-card">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-status-green"><span className="h-1.5 w-1.5 rounded-full bg-status-green" /> Active</div>
        <h1 className="mt-1 text-lg font-semibold">{agent.name}</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">{agent.purpose}</p>
        <div className="mt-4 grid grid-cols-4 gap-4 border-t border-border pt-4 text-sm">
          <div><div className="text-xs text-ink-faint">Restaurants monitored</div><div className="text-lg font-semibold">{stats.restaurantsMonitored}</div></div>
          <div><div className="text-xs text-ink-faint">Issues detected</div><div className="text-lg font-semibold">{stats.issuesDetected}</div></div>
          <div><div className="text-xs text-ink-faint">Restaurants affected</div><div className="text-lg font-semibold">{stats.restaurantsAffected}</div></div>
          <div><div className="text-xs text-ink-faint">Automation level</div><div className="text-lg font-semibold">{agent.automationLevel}</div></div>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold">Current Recommendations</h2>
        {stats.recommendations.length === 0 ? (
          <p className="text-sm text-ink-faint">No open recommendations from this agent.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">{stats.recommendations.map((r) => <InsightCard key={r.id} rec={r} />)}</div>
        )}
      </div>
    </div>
  );
}
