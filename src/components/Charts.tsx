import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { STAGE_NAMES, STAGE_SLA, ONBOARDING_PHASES, type Restaurant } from "../types";

export function PipelineFunnel({ restaurants }: { restaurants: Restaurant[] }) {
  const data = ONBOARDING_PHASES.map((phase) => ({
    name: phase.name,
    count: restaurants.filter((r) => phase.stages.includes(r.stage)).length,
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--c-border))" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "rgb(var(--c-ink-faint))" }} allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12, fill: "rgb(var(--c-ink))" }} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid rgb(var(--c-border))", background: "rgb(var(--c-surface))" }} />
        <Bar dataKey="count" fill="#0E6B5C" radius={[0, 3, 3, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SlaPerformanceChart({ restaurants }: { restaurants: Restaurant[] }) {
  const data = STAGE_NAMES.map((stage) => {
    const here = restaurants.filter((r) => r.stage === stage);
    const breach = here.filter((r) => {
      const days = Math.floor((Date.now() - r.stageChangedAt) / 86400000);
      return days >= STAGE_SLA[stage].escalateDay;
    }).length;
    return { name: stage.split(" ").slice(0, 2).join(" "), onTrack: here.length - breach, breach };
  });
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ left: -20, right: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--c-border))" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 9, fill: "rgb(var(--c-ink-faint))" }} interval={0} angle={-35} textAnchor="end" height={70} />
        <YAxis tick={{ fontSize: 11, fill: "rgb(var(--c-ink-faint))" }} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid rgb(var(--c-border))", background: "rgb(var(--c-surface))" }} />
        <Bar dataKey="onTrack" stackId="a" fill="#1F8A5F" name="On track" radius={[0, 0, 0, 0]} />
        <Bar dataKey="breach" stackId="a" fill="#C0392B" name="SLA breach" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const RISK_COLORS: Record<string, string> = { Low: "#1F8A5F", Medium: "#B7791F", High: "#C0392B" };
export function RiskDistributionChart({ restaurants }: { restaurants: Restaurant[] }) {
  const data = ["Low", "Medium", "High"].map((level) => ({ name: level, count: restaurants.filter((r) => r.riskLevel === level).length }));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--c-border))" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "rgb(var(--c-ink))" }} />
        <YAxis tick={{ fontSize: 11, fill: "rgb(var(--c-ink-faint))" }} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid rgb(var(--c-border))", background: "rgb(var(--c-surface))" }} />
        <Bar dataKey="count" radius={[3, 3, 0, 0]} barSize={40}>
          {data.map((d) => <Cell key={d.name} fill={RISK_COLORS[d.name]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
