import { useNavigate } from "react-router-dom";
import { useRestaurants } from "../lib/useRestaurants";
import { STAGE_SLA, ONBOARDING_PHASES } from "../types";

export default function Pipeline() {
  const navigate = useNavigate();
  const { restaurants, loading } = useRestaurants();

  if (loading) return <p className="py-16 text-center text-sm text-ink-faint">Loading…</p>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Onboarding Pipeline</h1>
        <p className="text-sm text-ink-faint">18-step SOP workflow · click a stage to filter restaurants.</p>
      </div>

      {ONBOARDING_PHASES.map((phase) => (
        <div key={phase.name}>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">{phase.name}</div>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${phase.stages.length}, minmax(0, 1fr))` }}>
            {phase.stages.map((stageName) => {
              const here = restaurants.filter((r) => r.stage === stageName);
              const breached = here.filter((r) => {
                const days = Math.floor((Date.now() - r.stageChangedAt) / 86400000);
                return days >= STAGE_SLA[stageName].escalateDay;
              }).length;
              const avgDays = here.length
                ? Math.round(here.reduce((s, r) => s + Math.floor((Date.now() - r.stageChangedAt) / 86400000), 0) / here.length)
                : 0;

              return (
                <button
                  key={stageName}
                  onClick={() => navigate(`/restaurants?stage=${encodeURIComponent(stageName)}`)}
                  className="flex min-h-[120px] flex-col justify-between rounded border border-border bg-surface p-3 text-left shadow-card hover:border-brand-500"
                >
                  <div>
                    <div className="text-xs font-semibold leading-tight">{stageName}</div>
                    <div className="mt-0.5 text-[10px] text-ink-faint">SLA {STAGE_SLA[stageName].slaDays}d</div>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold tabular-nums">{here.length}</div>
                    <div className="text-[10px] text-ink-faint">currently here</div>
                  </div>
                  <div className="space-y-0.5 text-[10px]">
                    {breached > 0 && <div className="flex justify-between"><span className="text-ink-faint">SLA breach</span><span className="font-medium text-status-red">{breached}</span></div>}
                    <div className="flex justify-between text-ink-faint"><span>Avg. days here</span><span className="font-medium text-ink">{avgDays || "—"}</span></div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
