import { STAGE_SLA, overallStatusFor, type AgentDef, type AiRecommendation, type Restaurant } from "../types";

export const AGENTS: AgentDef[] = [
  { id: "onboarding-controller", name: "Onboarding Controller", purpose: "Watches every restaurant's current stage and flags ones that haven't moved in a while.", automationLevel: "Recommend", humanApprovalRequired: false },
  { id: "sla-guardian", name: "SLA Guardian", purpose: "Compares real time-in-stage against the SOP's per-stage SLA table and flags at-risk or breached stages.", automationLevel: "Flag & Escalate", humanApprovalRequired: true },
];

function daysInStage(r: Restaurant): number {
  return Math.floor((Date.now() - r.stageChangedAt) / 86400000);
}

export function buildRecommendations(restaurants: Restaurant[]): AiRecommendation[] {
  const recs: AiRecommendation[] = [];
  let n = 0;
  const push = (agent: string, r: Restaurant, title: string, reason: string, impact: string, action: string, riskLevel: AiRecommendation["riskLevel"]) => {
    n += 1;
    recs.push({
      id: `REC-${String(n).padStart(4, "0")}`, agent, restaurantId: r.id, restaurantName: r.name,
      title, reason, impact, action, riskLevel, createdAt: new Date(r.updatedAt).toISOString(), status: "Awaiting human action",
    });
  };

  restaurants.forEach((r) => {
    if (r.approvalStatus !== "approved") return; // only surface insights for approved, live records
    const days = daysInStage(r);
    const sla = STAGE_SLA[r.stage];
    const ratio = sla.slaDays > 0 ? days / sla.slaDays : 0;

    if (days >= sla.escalateDay) {
      push("SLA Guardian", r, `SLA breached — ${r.stage}`,
        `${r.name} has been in "${r.stage}" for ${days} days (SLA is ${sla.slaDays} days, escalation at ${sla.escalateDay}).`,
        "Breach triggers Escalation Matrix Level 2 per SOP Ch.16.",
        `Escalate to ${sla.owner}.`, "Red");
    } else if (ratio >= 0.85) {
      push("SLA Guardian", r, `SLA at risk — ${r.stage}`,
        `${r.name} is at ${Math.round(ratio * 100)}% of its SLA allowance for "${r.stage}".`,
        "High risk of breach without action soon.",
        `Follow up with ${sla.owner}.`, "Amber");
    }

    if (days >= 14 && r.stage !== "Hypercare") {
      push("Onboarding Controller", r, `${r.name} hasn't progressed in ${days} days`,
        `Still sitting at "${r.stage}" (status: ${overallStatusFor(r.stage)}).`,
        "Long-stalled onboarding risks the restaurant disengaging from the pilot.",
        `Check in with ${r.assignedOps || r.assignedBD || "the assigned owner"}.`, "Amber");
    }
  });

  const order = { Red: 0, Amber: 1, Green: 2 };
  return recs.sort((a, b) => order[a.riskLevel] - order[b.riskLevel]);
}

export function agentStats(agentId: string, recs: AiRecommendation[], totalRestaurants: number) {
  const agent = AGENTS.find((a) => a.id === agentId)!;
  const mine = recs.filter((r) => r.agent === agent.name);
  return {
    agent, recommendations: mine,
    issuesDetected: mine.length,
    restaurantsAffected: new Set(mine.map((r) => r.restaurantId)).size,
    restaurantsMonitored: totalRestaurants,
  };
}
