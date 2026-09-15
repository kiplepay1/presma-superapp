import {
  doc, getDoc, setDoc, updateDoc, collection, onSnapshot, serverTimestamp,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db, ADMIN_EMAIL } from "./firebase";

export type AccessStatus = "pending" | "approved" | "rejected";

export interface AccessRecord {
  uid: string;
  email: string;
  name: string;
  photoURL: string | null;
  status: AccessStatus;
}

// Keyed by Firebase Auth UID (not a sanitized email) — this lets Firestore
// rules check "is this my own doc?" using the path segment alone, which
// works even before the document exists (avoids permission-denied on the
// very first read for a brand-new user).
export async function ensureAccessRequest(user: User): Promise<AccessRecord> {
  const email = (user.email ?? "").toLowerCase();
  if (email === ADMIN_EMAIL.toLowerCase()) {
    return { uid: user.uid, email, name: user.displayName ?? "Admin", photoURL: user.photoURL, status: "approved" };
  }
  const ref = doc(db, "access", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as AccessRecord;

  const record: AccessRecord = {
    uid: user.uid, email, name: user.displayName ?? "", photoURL: user.photoURL, status: "pending",
  };
  await setDoc(ref, { ...record, requestedAt: serverTimestamp() });
  return record;
}

export function subscribeAllAccess(cb: (records: AccessRecord[]) => void): () => void {
  return onSnapshot(collection(db, "access"), (snap) => {
    cb(snap.docs.map((d) => d.data() as AccessRecord));
  });
}

export async function setAccessStatus(uid: string, status: AccessStatus): Promise<void> {
  const ref = doc(db, "access", uid);
  await updateDoc(ref, { status, decidedAt: serverTimestamp() });
}
