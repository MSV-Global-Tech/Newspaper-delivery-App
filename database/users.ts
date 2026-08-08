/**
 * database/users.ts
 * Stores user profiles in the 'users' collection, keyed by phone number.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';

export interface UserDoc {
  name: string;
  phone: string;
  address: string;
  isAdmin: boolean;
  customerKind?: 'new' | 'legacy';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  createdAt?: any;
}

const COL = 'users';

// ── Save or overwrite a user profile ────────────────────────────────────────
export async function saveUser(user: UserDoc) {
  await setDoc(doc(db, COL, user.phone), user, { merge: true });
}

// ── Fetch a user profile by phone number ────────────────────────────────────
export async function fetchUser(phone: string): Promise<UserDoc | null> {
  const snap = await getDoc(doc(db, COL, phone));
  return snap.exists() ? (snap.data() as UserDoc) : null;
}

export async function listUsers(): Promise<UserDoc[]> {
  const snap = await getDocs(collection(db, COL));
  return snap.docs.map((d) => d.data() as UserDoc);
}

export function listenUsers(callback: (docs: UserDoc[]) => void) {
  return onSnapshot(
    collection(db, COL),
    (snap) => {
      const items = snap.docs.map((d) => d.data() as UserDoc);
      callback(items);
    },
    (error) => {
      console.error('[DB] listenUsers error:', error?.code, error?.message);
    }
  );
}

export async function updateUser(phone: string, data: Partial<UserDoc>) {
  await updateDoc(doc(db, COL, phone), data);
}

// ── Delete a user profile ────────────────────────────────────────────────────
export async function deleteUser(phone: string) {
  await deleteDoc(doc(db, COL, phone));
}
