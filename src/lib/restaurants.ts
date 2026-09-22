import {
  collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, serverTimestamp, getDocs,
} from "firebase/firestore";
import { db, ADMIN_EMAIL } from "./firebase";
import type { NewRestaurantInput, Outlet, Restaurant } from "../types";

const COLLECTION = "crm_restaurants";

function generateId(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 4);
  return `PRSM-R-${stamp}${rand}`;
}

// Firestore's updateDoc/setDoc reject `undefined` outright ("Unsupported
// field value: undefined"). Two safety nets against that, since it's a
// classic Firestore gotcha that resurfaces every time a new optional field
// is added and an older document simply doesn't have it yet:

// 1) Read-side: normalize any document coming out of Firestore so every
// known field always has a real value, never undefined, no matter how old
// the document is or which fields existed when it was created.
function normalizeRestaurant(raw: any): Restaurant {
  return {
    ...raw,
    outlets: raw.outlets ?? [],
    notes: raw.notes ?? "",
    surveyUrl: raw.surveyUrl ?? "",
    logoUrl: raw.logoUrl ?? "",
    // Migrates the old single meetingPhotoUrl field (pre-multi-photo) into
    // the new array format, so nothing already saved gets lost.
    meetingPhotoUrls: raw.meetingPhotoUrls ?? (raw.meetingPhotoUrl ? [raw.meetingPhotoUrl] : []),
    approvalNote: raw.approvalNote ?? "",
    activity: raw.activity ?? [],
  } as Restaurant;
}

// 2) Write-side: strip any accidental `undefined` values before sending a
// payload to Firestore, so a missing default anywhere else in the app can
// never crash a save.
function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out = {} as T;
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) (out as any)[k] = v;
  }
  return out;
}

export function subscribeRestaurants(cb: (restaurants: Restaurant[]) => void): () => void {
  return onSnapshot(collection(db, COLLECTION), (snap) => {
    const rows = snap.docs.map((d) => normalizeRestaurant(d.data()));
    rows.sort((a, b) => b.updatedAt - a.updatedAt);
    cb(rows);
  });
}

export async function createRestaurant(input: NewRestaurantInput, actorEmail: string): Promise<Restaurant> {
  const id = generateId();
  const now = Date.now();
  const isAdmin = actorEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const restaurant: Restaurant = {
    ...input,
    id,
    createdBy: actorEmail,
    createdAt: now,
    updatedAt: now,
    stageChangedAt: now,
    approvalStatus: isAdmin ? "approved" : "pending",
    approvalNote: "",
    activity: [{ date: new Date(now).toISOString(), actor: actorEmail, event: `Restaurant created at stage "${input.stage}".` }],
  };
  await setDoc(doc(db, COLLECTION, id), stripUndefined({ ...restaurant, _ts: serverTimestamp() }));
  return restaurant;
}

// Full edit of restaurant fields (from the Edit form). Non-admin edits are
// sent back to "pending" so the admin can review the change before it's
// reflected as approved data.
export async function updateRestaurant(
  existing: Restaurant, patch: NewRestaurantInput, actorEmail: string
): Promise<void> {
  const isAdmin = actorEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const now = Date.now();
  const stageChanged = patch.stage !== existing.stage;
  const events = [...existing.activity];
  if (stageChanged) {
    events.push({ date: new Date(now).toISOString(), actor: actorEmail, event: `Stage changed from "${existing.stage}" to "${patch.stage}".` });
  } else {
    events.push({ date: new Date(now).toISOString(), actor: actorEmail, event: "Restaurant details updated." });
  }
  await updateDoc(doc(db, COLLECTION, existing.id), stripUndefined({
    ...patch,
    updatedAt: now,
    stageChangedAt: stageChanged ? now : existing.stageChangedAt,
    approvalStatus: isAdmin ? "approved" : "pending",
    approvalNote: isAdmin ? existing.approvalNote : "",
    activity: events,
  }));
}

// Quick stage-only update from the restaurant detail page.
export async function updateStage(existing: Restaurant, newStage: Restaurant["stage"], actorEmail: string): Promise<void> {
  const isAdmin = actorEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const now = Date.now();
  const events = [...existing.activity, {
    date: new Date(now).toISOString(), actor: actorEmail,
    event: `Stage changed from "${existing.stage}" to "${newStage}".`,
  }];
  await updateDoc(doc(db, COLLECTION, existing.id), stripUndefined({
    stage: newStage,
    updatedAt: now,
    stageChangedAt: now,
    approvalStatus: isAdmin ? "approved" : "pending",
    activity: events,
  }));
}

export async function deleteRestaurant(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

// --- Outlet sub-profiles -----------------------------------------------
// Stored as a structured array field on the restaurant document — each
// outlet gets its own id/location/contact/status, editable independently.

function nextOutletId(existing: Outlet[]): string {
  const n = existing.length + 1;
  return `PRSM-O-${String(n).padStart(2, "0")}`;
}

export async function addOutlet(
  restaurant: Restaurant, input: Omit<Outlet, "id">, actorEmail: string
): Promise<void> {
  const outlet: Outlet = stripUndefined({ ...input, id: nextOutletId(restaurant.outlets) });
  const now = Date.now();
  const events = [...restaurant.activity, {
    date: new Date(now).toISOString(), actor: actorEmail, event: `Outlet added: ${outlet.location} (${outlet.id}).`,
  }];
  await updateDoc(doc(db, COLLECTION, restaurant.id), stripUndefined({
    outlets: [...restaurant.outlets, outlet], updatedAt: now, activity: events,
  }));
}

export async function updateOutlet(
  restaurant: Restaurant, outletId: string, patch: Omit<Outlet, "id">, actorEmail: string
): Promise<void> {
  const now = Date.now();
  const outlets = restaurant.outlets.map((o) => (o.id === outletId ? stripUndefined({ ...patch, id: outletId }) : o));
  const events = [...restaurant.activity, {
    date: new Date(now).toISOString(), actor: actorEmail, event: `Outlet updated: ${patch.location} (${outletId}).`,
  }];
  await updateDoc(doc(db, COLLECTION, restaurant.id), stripUndefined({ outlets, updatedAt: now, activity: events }));
}

export async function deleteOutlet(restaurant: Restaurant, outletId: string, actorEmail: string): Promise<void> {
  const now = Date.now();
  const removed = restaurant.outlets.find((o) => o.id === outletId);
  const outlets = restaurant.outlets.filter((o) => o.id !== outletId);
  const events = [...restaurant.activity, {
    date: new Date(now).toISOString(), actor: actorEmail, event: `Outlet removed: ${removed?.location ?? outletId}.`,
  }];
  await updateDoc(doc(db, COLLECTION, restaurant.id), stripUndefined({ outlets, updatedAt: now, activity: events }));
}

export async function setRestaurantApproval(
  restaurant: Restaurant, status: "approved" | "rejected" | "needs_edit", note: string, adminEmail: string
): Promise<void> {
  const now = Date.now();
  const label = status === "approved" ? "approved" : status === "rejected" ? "rejected" : "sent back for edits";
  const events = [...restaurant.activity, {
    date: new Date(now).toISOString(), actor: adminEmail,
    event: `Submission ${label}${note ? ` — "${note}"` : ""}.`,
  }];
  await updateDoc(doc(db, COLLECTION, restaurant.id), stripUndefined({
    approvalStatus: status, approvalNote: note, updatedAt: now, activity: events,
  }));
}

export async function exportRestaurantsCsv(): Promise<string> {
  const snap = await getDocs(collection(db, COLLECTION));
  const rows = snap.docs.map((d) => normalizeRestaurant(d.data()));
  const headers = ["ID", "Name", "Owner", "Phone", "Email", "Business Type", "Registration No", "Outlet Count", "Outlets", "Stage", "Risk", "Assigned BD", "Assigned Ops", "Assigned Tech", "Approval Status", "Survey Document", "Created By", "Created At"];
  const lines = [headers.join(",")];
  rows.forEach((r) => {
    const outletsSummary = r.outlets.map((o) => `${o.location} (${o.status})`).join("; ");
    lines.push([
      r.id, r.name, r.ownerName, r.ownerPhone, r.ownerEmail, r.businessType, r.registrationNo,
      String(r.outlets.length), `"${outletsSummary}"`, r.stage, r.riskLevel, r.assignedBD, r.assignedOps, r.assignedTech,
      r.approvalStatus, r.surveyUrl || "", r.createdBy, new Date(r.createdAt).toISOString(),
    ].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","));
  });
  return lines.join("\n");
}

export async function deleteAllRestaurants(): Promise<void> {
  const snap = await getDocs(collection(db, COLLECTION));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}
