import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, Bot } from "lucide-react";
import type { AiRecommendation, AgentDef } from "../types";
import { RiskPill } from "./Badges";

export function KpiCard({ label, value, sub, tone, onClick }: { label: string; value: string | number; sub?: string; tone?: "green" | "amber" | "red"; onClick?: () => void }) {
  const toneColor = tone === "red" ? "text-status-red" : tone === "amber" ? "text-status-amber" : tone === "green" ? "text-status-green" : "text-ink";
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded border border-border bg-surface px-4 py-3.5 text-left shadow-card transition hover:border-border-strong ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <div className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">{label}</div>
      <div className={`text-2xl font-semibold tabular-nums ${toneColor}`}>{value}</div>
      {sub && <div className="text-xs text-ink-faint">{sub}</div>}
    </button>
  );
}

export function SectionCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded border border-border bg-surface shadow-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function InsightCard({ rec, onDismiss }: { rec: AiRecommendation; onDismiss?: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="rounded border border-border bg-surface p-3.5 shadow-card">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-600">
          <Sparkles size={12} /> AI Insight — {rec.agent}
        </div>
        <RiskPill level={rec.riskLevel} />
      </div>
      <div className="text-sm font-medium">{rec.title}</div>
      <div className="mt-1 text-xs text-ink-soft">{rec.reason}</div>
      <div className="mt-1.5 text-xs text-ink-faint"><span className="font-medium text-ink-soft">Impact:</span> {rec.impact}</div>
      <div className="mt-0.5 text-xs text-ink-faint"><span className="font-medium text-ink-soft">Recommended action:</span> {rec.action}</div>
      <div className="mt-3 flex gap-2">
        {rec.restaurantId && (
          <button onClick={() => navigate(`/restaurants/${rec.restaurantId}`)} className="flex items-center gap-1 rounded bg-brand-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-600">
            View Restaurant <ArrowRight size={12} />
          </button>
        )}
        <button className="rounded border border-border px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-paper">Create Task</button>
        {onDismiss && <button onClick={onDismiss} className="rounded px-2.5 py-1.5 text-xs font-medium text-ink-faint hover:bg-paper">Dismiss</button>}
      </div>
    </div>
  );
}

export function AgentCard({ agent, issuesDetected, restaurantsAffected }: { agent: AgentDef; issuesDetected: number; restaurantsAffected: number }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(`/agents/${agent.id}`)} className="flex flex-col gap-3 rounded border border-border bg-surface p-4 text-left shadow-card hover:border-border-strong">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-50 text-brand-600"><Bot size={16} /></div>
          <div>
            <div className="text-sm font-semibold">{agent.name}</div>
            <div className="flex items-center gap-1 text-[11px] text-status-green"><span className="h-1.5 w-1.5 rounded-full bg-status-green" /> Active</div>
          </div>
        </div>
      </div>
      <p className="text-xs leading-relaxed text-ink-soft">{agent.purpose}</p>
      <div className="flex items-center justify-between border-t border-border pt-2.5 text-xs">
        <div><span className="font-semibold">{issuesDetected}</span> <span className="text-ink-faint">issues detected</span></div>
        <div><span className="font-semibold">{restaurantsAffected}</span> <span className="text-ink-faint">restaurants affected</span></div>
      </div>
      <div className="flex items-center justify-between text-[11px] text-ink-faint">
        <span>{agent.automationLevel}</span>
        <span>{agent.humanApprovalRequired ? "Human approval required" : "Auto-monitor"}</span>
      </div>
    </button>
  );
}
