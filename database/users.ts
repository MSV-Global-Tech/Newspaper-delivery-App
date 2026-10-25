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
  bills?: CustomerBill[];
  paymentHistory?: CustomerPayment[];
  email?: string;
  password?: string; // Store password for login verification
}

export interface CustomerBillItem {
  id: string;
  name: string;
  amount: number;
}

export interface CustomerBill {
  id: string;
  month: string;
  date: string;
  items: CustomerBillItem[];
  totalAmount: number;
  status: 'Unpaid' | 'Paid';
  paymentProof?: string;
  paidAt?: string;
}

export interface CustomerPayment {
  id: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Approved' | 'Rejected' | 'Pending';
  screenshot?: string;
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

// ── Fetch a user profile by email ────────────────────────────────────────────
export async function fetchUserByEmail(email: string): Promise<UserDoc | null> {
  const snap = await getDocs(collection(db, COL));
  const users = snap.docs.map((d) => d.data() as UserDoc);
  return users.find((u) => u.email === email) || null;
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

// ── Real-time listener for a single user (for customers to receive bill updates) ──
export function listenUser(phone: string, callback: (data: UserDoc | null) => void) {
  return onSnapshot(
    doc(db, COL, phone),
    (snap) => {
      callback(snap.exists() ? (snap.data() as UserDoc) : null);
    },
    (error) => {
      console.error('[DB] listenUser error:', error?.code, error?.message);
    }
  );
}

// ── Bills Management ────────────────────────────────────────────────────────
export async function updateCustomerBill(phone: string, bills: CustomerBill[]) {
  await updateDoc(doc(db, COL, phone), { bills });
}
