import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { NewVendorInput, Vendor } from "../types";

const COLLECTION = "crm_vendors";

function generateId(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 4);
  return `VND-${stamp}${rand}`;
}

function normalizeVendor(raw: any): Vendor {
  return {
    ...raw,
    category: raw.category ?? "",
    description: raw.description ?? "",
    contactPerson: raw.contactPerson ?? "",
    website: raw.website ?? "",
  } as Vendor;
}

export function subscribeVendors(cb: (vendors: Vendor[]) => void): () => void {
  return onSnapshot(
    collection(db, COLLECTION),
    (snap) => {
      const rows = snap.docs.map((d) => normalizeVendor(d.data()));
      rows.sort((a, b) => a.name.localeCompare(b.name));
      cb(rows);
    },
    // If the Firestore rules for crm_vendors haven't been published yet (or
    // the user lacks access), degrade to an empty list instead of crashing.
    () => cb([])
  );
}

export async function createVendor(input: NewVendorInput): Promise<void> {
  const id = generateId();
  const now = Date.now();
  await setDoc(doc(db, COLLECTION, id), { ...input, id, createdAt: now, updatedAt: now });
}

export async function updateVendor(id: string, patch: NewVendorInput): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { ...patch, updatedAt: Date.now() });
}

export async function deleteVendor(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
