import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Download, ClipboardCheck } from "lucide-react";
import { useRestaurants } from "../lib/useRestaurants";
import { useAuth } from "../lib/AuthContext";
import { buildRecommendations } from "../lib/agents";
import { overallStatusFor } from "../types";
import { StatusBadge, RiskPill } from "../components/Badges";

export default function ReportPrint() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { restaurants, loading } = useRestaurants();
  const recs = buildRecommendations(restaurants);

  const live = restaurants.filter((r) => ["Hypercare", "BAU Handover", "Go-Live"].includes(r.stage)).length;
  const pendingReview = restaurants.filter((r) => r.approvalStatus !== "approved").length;
  const flagged = recs.filter((r) => r.riskLevel === "Red").length;

  if (loading) return <p className="py-16 text-center text-sm text-ink-faint">Loading…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="no-print flex items-center justify-between">
        <button onClick={() => navigate("/reports")} className="flex items-center gap-1.5 text-xs font-medium text-ink-faint hover:text-ink"><ArrowLeft size={14} /> Back to Reports</button>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-paper">
            <Printer size={15} /> Print
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600">
            <Download size={15} /> Download PDF
          </button>
        </div>
      </div>
      <p className="no-print -mt-2 text-xs text-ink-faint">"Download PDF" opens your browser's print dialog — choose "Save as PDF" as the destination.</p>

      <div className="rounded border border-border bg-surface p-8 shadow-card print:border-0 print:shadow-none">
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-500 text-white"><ClipboardCheck size={17} /></div>
              <div className="text-base font-semibold">Restaurant On-Boarding System — Onboarding Report</div>
            </div>
            <p className="mt-1 text-xs text-ink-faint">Generated {new Date().toLocaleString()} by {user.email}</p>
          </div>
        </div>

        <div className="my-5 grid grid-cols-4 gap-3">
          <Kpi label="Total Restaurants" value={restaurants.length} />
          <Kpi label="Live / Hypercare / BAU" value={live} tone="text-status-green" />
          <Kpi label="Pending Approval" value={pendingReview} tone="text-status-amber" />
          <Kpi label="SLA Flagged (Critical)" value={flagged} tone="text-status-red" />
        </div>

        <h3 className="mb-2 text-sm font-semibold">Restaurant Status</h3>
        <table className="mb-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wide text-ink-faint">
              <th className="py-1.5 font-medium">Restaurant</th><th className="py-1.5 font-medium">Owner</th>
              <th className="py-1.5 font-medium">Stage</th><th className="py-1.5 font-medium">Status</th><th className="py-1.5 font-medium">Risk</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="py-1.5 font-medium">{r.name}</td>
                <td className="py-1.5 text-ink-soft">{r.ownerName}</td>
                <td className="py-1.5 text-ink-soft">{r.stage}</td>
                <td className="py-1.5"><StatusBadge status={overallStatusFor(r.stage)} /></td>
                <td className="py-1.5"><RiskPill level={r.riskLevel} /></td>
              </tr>
            ))}
            {restaurants.length === 0 && (
              <tr><td colSpan={5} className="py-4 text-center text-ink-faint">No restaurants to report on yet.</td></tr>
            )}
          </tbody>
        </table>

        <h3 className="mb-2 text-sm font-semibold">Flagged Issues</h3>
        {recs.length === 0 ? (
          <p className="text-sm text-ink-faint">No issues currently flagged by AI agents.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {recs.map((r) => (
              <li key={r.id} className="border-b border-border pb-1.5 last:border-0">
                <span className="font-medium">{r.restaurantName}</span> — <span className="text-ink-soft">{r.reason}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded bg-paper px-3 py-2.5 print:border print:border-border">
      <div className="text-[11px] text-ink-faint">{label}</div>
      <div className={`text-xl font-semibold ${tone ?? ""}`}>{value}</div>
    </div>
  );
}
