/**
 * database/users.ts
 * Stores user profiles in the 'users' collection, keyed by phone number.
 */
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';

export interface UserDoc {
  name: string;
  phone: string;
  address: string;
  isAdmin: boolean;
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

// ── Delete a user profile ────────────────────────────────────────────────────
export async function deleteUser(phone: string) {
  await deleteDoc(doc(db, COL, phone));
}
