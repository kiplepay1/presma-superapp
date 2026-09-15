import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, Sparkles } from "lucide-react";
import { useRestaurants } from "../lib/useRestaurants";
import { buildRecommendations } from "../lib/agents";
import { overallStatusFor, STAGE_SLA, type Restaurant } from "../types";
import { StatusBadge, RiskPill } from "./Badges";

const SUGGESTIONS = [
  "Show me all restaurants at risk of missing SLA",
  "Which restaurants are ready for Go-Live?",
  "Which restaurants are pending approval?",
  "Give me today's onboarding summary",
];

function answerQuery(q: string, restaurants: Restaurant[]) {
  const query = q.toLowerCase();
  const recs = buildRecommendations(restaurants);

  if (query.includes("sla") && (query.includes("risk") || query.includes("miss"))) {
    const hits = restaurants.filter((r) => {
      const days = Math.floor((Date.now() - r.stageChangedAt) / 86400000);
      return days >= STAGE_SLA[r.stage].slaDays;
    });
    return { text: `${hits.length} restaurant(s) are at or past their SLA allowance.`, restaurants: hits.slice(0, 8) };
  }
  if (query.includes("go-live") || query.includes("go live")) {
    const hits = restaurants.filter((r) => overallStatusFor(r.stage) === "Ready for Go-Live");
    return { text: `${hits.length} restaurant(s) are at the Ready for Go-Live stage.`, restaurants: hits.slice(0, 8) };
  }
  if (query.includes("pending") || query.includes("approval")) {
    const hits = restaurants.filter((r) => r.approvalStatus === "pending");
    return { text: `${hits.length} restaurant(s) are awaiting admin approval.`, restaurants: hits.slice(0, 8) };
  }
  if (query.includes("summary") || query.includes("today")) {
    const red = recs.filter((r) => r.riskLevel === "Red").length;
    const amber = recs.filter((r) => r.riskLevel === "Amber").length;
    return { text: `${restaurants.length} restaurants in the pipeline. ${red} critical issue(s), ${amber} at-risk item(s) flagged by AI agents.`, restaurants: [] };
  }
  const hits = restaurants.filter((r) => r.name.toLowerCase().includes(query) || r.id.toLowerCase().includes(query) || r.ownerName.toLowerCase().includes(query));
  return { text: hits.length ? `Found ${hits.length} matching restaurant(s).` : "No structured answer for that yet — try one of the suggestions, or search a restaurant name.", restaurants: hits.slice(0, 8) };
}

export default function CommandBar({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { restaurants } = useRestaurants();
  const result = useMemo(() => (q.trim().length > 2 ? answerQuery(q, restaurants) : null), [q, restaurants]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 pt-24" onClick={onClose}>
      <div className="w-full max-w-xl overflow-hidden rounded-md border border-border bg-surface shadow-pop" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search size={16} className="text-ink-faint" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ask AI or search…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-faint"
          />
          <kbd className="rounded border border-border-strong px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">Esc</kbd>
        </div>

        {!result && (
          <div className="p-2">
            <div className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint">Try asking</div>
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => setQ(s)} className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-sm text-ink-soft hover:bg-paper">
                <Sparkles size={14} className="text-brand-500" /> {s}
              </button>
            ))}
          </div>
        )}

        {result && (
          <div className="max-h-96 overflow-y-auto p-3">
            <div className="mb-2 flex items-start gap-2 rounded bg-brand-50 p-2.5 text-sm text-brand-700">
              <Sparkles size={15} className="mt-0.5 shrink-0" /> {result.text}
            </div>
            {result.restaurants.map((r) => (
              <button
                key={r.id}
                onClick={() => { navigate(`/restaurants/${r.id}`); onClose(); }}
                className="flex w-full items-center justify-between rounded px-2.5 py-2 text-left text-sm hover:bg-paper"
              >
                <div>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-ink-faint">{r.stage}</div>
                </div>
                <div className="flex items-center gap-2">
                  <RiskPill level={r.riskLevel} />
                  <StatusBadge status={overallStatusFor(r.stage)} />
                  <ArrowRight size={14} className="text-ink-faint" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
