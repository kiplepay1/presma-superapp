import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Circle, Clock, XCircle, PauseCircle } from "lucide-react";

const STATUS_STYLE: Record<string, { bg: string; fg: string; icon: ReactNode }> = {
  "Completed": { bg: "bg-status-greenBg", fg: "text-status-green", icon: <CheckCircle2 size={12} /> },
  "Live": { bg: "bg-status-greenBg", fg: "text-status-green", icon: <CheckCircle2 size={12} /> },
  "Healthy": { bg: "bg-status-greenBg", fg: "text-status-green", icon: <CheckCircle2 size={12} /> },
  "Ready": { bg: "bg-status-greenBg", fg: "text-status-green", icon: <CheckCircle2 size={12} /> },
  "In Progress": { bg: "bg-status-blueBg", fg: "text-status-blue", icon: <Clock size={12} /> },
  "Implementation": { bg: "bg-status-blueBg", fg: "text-status-blue", icon: <Clock size={12} /> },
  "UAT": { bg: "bg-status-blueBg", fg: "text-status-blue", icon: <Clock size={12} /> },
  "Hypercare": { bg: "bg-status-blueBg", fg: "text-status-blue", icon: <Clock size={12} /> },
  "Pending": { bg: "bg-status-amberBg", fg: "text-status-amber", icon: <PauseCircle size={12} /> },
  "At Risk": { bg: "bg-status-amberBg", fg: "text-status-amber", icon: <AlertTriangle size={12} /> },
  "Ready for Go-Live": { bg: "bg-status-amberBg", fg: "text-status-amber", icon: <AlertTriangle size={12} /> },
  "Waiting for Restaurant": { bg: "bg-status-amberBg", fg: "text-status-amber", icon: <PauseCircle size={12} /> },
  "Waiting for Vendor": { bg: "bg-status-amberBg", fg: "text-status-amber", icon: <PauseCircle size={12} /> },
  "Waiting for Internal Approval": { bg: "bg-status-amberBg", fg: "text-status-amber", icon: <PauseCircle size={12} /> },
  "Pending Approval": { bg: "bg-status-amberBg", fg: "text-status-amber", icon: <PauseCircle size={12} /> },
  "New Application": { bg: "bg-status-greyBg", fg: "text-status-grey", icon: <Circle size={12} /> },
  "Not Started": { bg: "bg-status-greyBg", fg: "text-status-grey", icon: <Circle size={12} /> },
  "In Verification": { bg: "bg-status-blueBg", fg: "text-status-blue", icon: <Clock size={12} /> },
  "Blocked": { bg: "bg-status-redBg", fg: "text-status-red", icon: <XCircle size={12} /> },
  "Overdue": { bg: "bg-status-redBg", fg: "text-status-red", icon: <XCircle size={12} /> },
  "Open": { bg: "bg-status-greyBg", fg: "text-status-grey", icon: <Circle size={12} /> },
  "Rejected": { bg: "bg-status-redBg", fg: "text-status-red", icon: <XCircle size={12} /> },
  "SLA Breach": { bg: "bg-status-redBg", fg: "text-status-red", icon: <XCircle size={12} /> },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { bg: "bg-status-greyBg", fg: "text-status-grey", icon: <Circle size={12} /> };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium ${s.bg} ${s.fg}`}>
      {s.icon}{status}
    </span>
  );
}

const RISK_STYLE: Record<string, string> = {
  Low: "bg-status-greenBg text-status-green", Green: "bg-status-greenBg text-status-green",
  Medium: "bg-status-amberBg text-status-amber", Amber: "bg-status-amberBg text-status-amber",
  High: "bg-status-redBg text-status-red", Red: "bg-status-redBg text-status-red",
};

export function RiskPill({ level }: { level: string }) {
  return <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${RISK_STYLE[level] ?? "bg-status-greyBg text-status-grey"}`}>{level}</span>;
}

export function ProgressBar({ pct, tone = "brand" }: { pct: number; tone?: "brand" | "amber" | "red" }) {
  const color = tone === "amber" ? "bg-status-amber" : tone === "red" ? "bg-status-red" : "bg-brand-500";
  return (
    <div className="h-1.5 w-full rounded-full bg-border">
      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}
