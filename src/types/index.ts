// ---------------------------------------------------------------------------
// Restaurant On-Boarding System — core data model (real-data CRM version)
// Stage names/SLA table still follow PRESMA_Restaurant_Onboarding_SOP.docx
// ---------------------------------------------------------------------------

export type RiskLevel = "Low" | "Medium" | "High";

export const STAGE_NAMES = [
  "Pilot Agreement",
  "Registration",
  "Document Collection",
  "Document Verification",
  "Business Due Diligence",
  "Operations Approval",
  "Technical Assessment",
  "Vendor Integration Request",
  "Vendor Approval",
  "Account Provisioning",
  "Restaurant Configuration",
  "Module Activation",
  "User Acceptance Testing",
  "Restaurant Training",
  "Go-Live Approval",
  "Go-Live",
  "Hypercare",
  "BAU Handover",
] as const;

export type StageName = (typeof STAGE_NAMES)[number];

// SOP Ch.16.3 — SLA per stage, in working days, and the day escalation triggers
export const STAGE_SLA: Record<StageName, { slaDays: number; escalateDay: number; owner: string }> = {
  "Pilot Agreement": { slaDays: 5, escalateDay: 7, owner: "BD Officer" },
  "Registration": { slaDays: 2, escalateDay: 4, owner: "BD Officer" },
  "Document Collection": { slaDays: 7, escalateDay: 10, owner: "Onboarding Executive" },
  "Document Verification": { slaDays: 3, escalateDay: 5, owner: "Verification Officer" },
  "Business Due Diligence": { slaDays: 5, escalateDay: 8, owner: "Operations Executive" },
  "Operations Approval": { slaDays: 2, escalateDay: 4, owner: "Operations Manager" },
  "Technical Assessment": { slaDays: 3, escalateDay: 5, owner: "Technical Officer" },
  "Vendor Integration Request": { slaDays: 3, escalateDay: 5, owner: "Technical Officer" },
  "Vendor Approval": { slaDays: 8, escalateDay: 12, owner: "Vendor Management" },
  "Account Provisioning": { slaDays: 2, escalateDay: 3, owner: "Systems Administrator" },
  "Restaurant Configuration": { slaDays: 4, escalateDay: 6, owner: "Technical Officer" },
  "Module Activation": { slaDays: 2, escalateDay: 3, owner: "Systems Administrator" },
  "User Acceptance Testing": { slaDays: 3, escalateDay: 5, owner: "QA Officer" },
  "Restaurant Training": { slaDays: 3, escalateDay: 5, owner: "Training Officer" },
  "Go-Live Approval": { slaDays: 1, escalateDay: 2, owner: "Project Director" },
  "Go-Live": { slaDays: 1, escalateDay: 1, owner: "Operations Manager" },
  "Hypercare": { slaDays: 30, escalateDay: 60, owner: "Support Team" },
  "BAU Handover": { slaDays: 2, escalateDay: 4, owner: "PMO" },
};

export const ONBOARDING_PHASES: { name: string; stages: StageName[] }[] = [
  { name: "Pre-Onboarding", stages: ["Pilot Agreement", "Registration"] },
  { name: "Onboarding", stages: ["Document Collection", "Document Verification", "Business Due Diligence", "Operations Approval"] },
  { name: "Implementation", stages: ["Technical Assessment", "Vendor Integration Request", "Vendor Approval", "Account Provisioning", "Restaurant Configuration", "Module Activation", "User Acceptance Testing", "Restaurant Training"] },
  { name: "Go-Live", stages: ["Go-Live Approval", "Go-Live"] },
  { name: "Hypercare", stages: ["Hypercare"] },
  { name: "BAU", stages: ["BAU Handover"] },
];

// Maps a stage to the coarser status band shown on KPI cards / filters.
export function overallStatusFor(stage: StageName): string {
  const idx = STAGE_NAMES.indexOf(stage);
  if (idx <= 1) return "New Application";
  if (idx <= 3) return "In Verification";
  if (idx === 4 || idx === 5) return "Pending Approval";
  if (idx >= 6 && idx <= 13) return "Implementation";
  if (idx === 14) return "Ready for Go-Live";
  if (idx === 15) return "Live";
  if (idx === 16) return "Hypercare";
  return "BAU";
}

export type ApprovalStatus = "approved" | "pending" | "rejected" | "needs_edit";

export interface ActivityEvent {
  date: string; // ISO timestamp
  actor: string; // email or display name
  event: string;
}

export type OutletStatus = "Active" | "Inactive";

export interface Outlet {
  id: string; // PRSM-O-<seq> auto-generated
  location: string;
  contactPerson: string;
  phone: string;
  status: OutletStatus;
  lat?: number | null; // populated when the outlet came from the Locator
  lon?: number | null;
}

export interface Restaurant {
  id: string; // PRSM-R-##### auto-generated
  name: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  businessType: "Sole Proprietorship" | "Partnership" | "Sdn Bhd";
  registrationNo: string;
  outlets: Outlet[]; // structured sub-profiles — a restaurant/owner may run multiple outlets
  // Provenance metadata — only set when the record came from the Restaurant
  // Locator (Geoapify discovery). Manually-added restaurants leave these
  // undefined. Used purely for duplicate detection and a "source" badge —
  // never overwrites PRESMA's own data once a restaurant exists.
  source?: "manual" | "locator";
  geoapifyPlaceId?: string | null;
  category?: string | null;
  stage: StageName;
  riskLevel: RiskLevel;
  assignedBD: string;
  assignedOps: string;
  assignedTech: string;
  notes: string;
  surveyUrl: string; // link to externally-hosted survey PDF (e.g. OneDrive), optional
  logoUrl: string; // link to externally-hosted restaurant logo image, optional
  meetingPhotoUrls: string[]; // links to externally-hosted photos from the survey visit, optional
  approvalStatus: ApprovalStatus;
  approvalNote: string; // admin's note when rejecting / requesting edits
  createdBy: string; // email of whoever added the record
  createdAt: number; // ms epoch
  updatedAt: number;
  stageChangedAt: number; // when `stage` last changed — drives real SLA tracking
  activity: ActivityEvent[];
}

export type NewRestaurantInput = Omit<
  Restaurant,
  "id" | "createdAt" | "updatedAt" | "stageChangedAt" | "activity" | "approvalStatus" | "approvalNote" | "createdBy"
>;

export interface TaskItem {
  id: string;
  title: string;
  restaurantId: string;
  restaurantName: string;
  stage: StageName;
  assignee: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  dueDate: string;
  status: "Open" | "Blocked" | "Overdue";
  aiRecommended: boolean;
  dependency: string | null;
}

export interface AiRecommendation {
  id: string;
  agent: string;
  restaurantId: string | null;
  restaurantName: string | null;
  title: string;
  reason: string;
  impact: string;
  action: string;
  riskLevel: "Green" | "Amber" | "Red";
  createdAt: string;
  status: "Awaiting human action" | "Acknowledged" | "Dismissed";
}

export interface AgentDef {
  id: string;
  name: string;
  purpose: string;
  automationLevel: "Monitor" | "Recommend" | "Flag & Escalate";
  humanApprovalRequired: boolean;
}
