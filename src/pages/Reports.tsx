import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";
import { useRestaurants } from "../lib/useRestaurants";
import { useVendors } from "../lib/useVendors";
import { useAuth } from "../lib/AuthContext";
import { computeVendorUsage } from "../lib/vendorStats";
import { buildRecommendations } from "../lib/agents";
import { SectionCard } from "../components/Cards";
import { PipelineFunnel, SlaPerformanceChart, RiskDistributionChart, VendorDistributionChart } from "../components/Charts";

export default function Reports() {
  const navigate = useNavigate();
  const { restaurants, loading } = useRestaurants();
  const { isAdmin } = useAuth();
  const { vendors } = useVendors();
  const { usage, notSet } = computeVendorUsage(restaurants, vendors);
  const vendorChartData = [...usage.map((u) => ({ name: u.name, count: u.count })), ...(notSet > 0 ? [{ name: "Not set", count: notSet }] : [])];
  const recs = buildRecommendations(restaurants);
  const live = restaurants.filter((r) => r.stage === "Hypercare" || r.stage === "BAU Handover" || r.stage === "Go-Live").length;
  const pendingReview = restaurants.filter((r) => r.approvalStatus !== "approved").length;

  if (loading) return <p className="py-16 text-center text-sm text-ink-faint">Loading…</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Reports & Analytics</h1>
          <p className="text-sm text-ink-faint">Live analytics computed from your real restaurant data.</p>
        </div>
        <button onClick={() => navigate("/reports/print")} className="flex items-center gap-1.5 rounded bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600">
          <FileText size={15} /> Generate Management Report
        </button>
      </div>

      {restaurants.length === 0 ? (
        <p className="rounded border border-border bg-surface px-4 py-10 text-center text-sm text-ink-faint shadow-card">Add restaurants to see analytics here.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <SectionCard title="Restaurant Onboarding Funnel"><PipelineFunnel restaurants={restaurants} /></SectionCard>
            <SectionCard title="SLA Performance by Stage"><SlaPerformanceChart restaurants={restaurants} /></SectionCard>
            <SectionCard title="Restaurants by Risk Rating"><RiskDistributionChart restaurants={restaurants} /></SectionCard>
            <SectionCard title="Management Summary">
              <ul className="space-y-1.5 text-sm text-ink-soft">
                <li>• <span className="font-medium text-ink">{restaurants.length}</span> restaurants currently tracked.</li>
                <li>• <span className="font-medium text-ink">{live}</span> restaurants Live, in Hypercare, or BAU.</li>
                <li>• <span className="font-medium text-ink">{pendingReview}</span> record(s) awaiting admin approval.</li>
                <li>• <span className="font-medium text-ink">{recs.filter((r) => r.riskLevel === "Red").length}</span> critical AI-flagged issues open.</li>
              </ul>
            </SectionCard>
          </div>

          {isAdmin && (
            <SectionCard title="POS / Integration Vendor Distribution (admin only)">
              {vendorChartData.length === 0 ? (
                <p className="text-sm text-ink-faint">No vendor data yet — set a POS vendor on a restaurant to see it here.</p>
              ) : (
                <VendorDistributionChart data={vendorChartData} />
              )}
              <p className="mt-2 text-xs text-ink-faint">
                {vendors.filter((v) => v.type === "main").length} main vendor(s) and {vendors.filter((v) => v.type === "integration").length} integration vendor(s) in the directory.
              </p>
            </SectionCard>
          )}

          <SectionCard title="Flagged Issues">
            {recs.length === 0 ? <p className="text-sm text-ink-faint">Nothing flagged right now.</p> : (
              <ul className="space-y-2 text-sm">
                {recs.slice(0, 8).map((r) => (
                  <li key={r.id} className="border-b border-border pb-2 last:border-0">
                    <div className="font-medium">{r.restaurantName}</div>
                    <div className="text-xs text-ink-faint">{r.reason}</div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}
