/**
 * database/vendors.ts
 * Stores vendor profiles in the 'vendors' collection.
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
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

export interface VendorPayment {
  id: string;
  amount: number;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  screenshot: string;
}

export interface VendorBillItem {
  id: string;
  name: string;
  amount: number;
}

export interface VendorBill {
  id: string;
  month: string;
  date: string;
  deadline?: string; // ISO string
  items: VendorBillItem[];
  totalAmount: number;
  status: 'Unpaid' | 'Paid' | 'Pending Approval';
  paymentProof?: string;
  paidAt?: string;
}

export interface VendorDoc {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  secretCode: string; // Last 4 digits of phone
  paymentAmount?: number; // Kept for backwards compatibility
  deadline?: string; // ISO String
  bills?: VendorBill[];
  paymentHistory: VendorPayment[];
  createdAt?: string;
  currentSessionToken?: string;
}

const COL = 'vendors';

export async function saveVendor(vendor: VendorDoc) {
  // Use the id as the document ID for easy reference
  await setDoc(doc(db, COL, vendor.id), vendor, { merge: true });
}

export async function fetchVendorById(id: string): Promise<VendorDoc | null> {
  const snap = await getDoc(doc(db, COL, id));
  return snap.exists() ? (snap.data() as VendorDoc) : null;
}

export async function fetchVendorByCode(secretCode: string): Promise<VendorDoc | null> {
  const q = query(collection(db, COL), where("secretCode", "==", secretCode));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data() as VendorDoc;
  }
  return null;
}

export function listenVendors(callback: (docs: VendorDoc[]) => void) {
  return onSnapshot(
    collection(db, COL),
    (snap) => {
      const items = snap.docs.map((d) => d.data() as VendorDoc);
      callback(items);
    },
    (error) => {
      console.error('[DB] listenVendors error:', error?.code, error?.message);
    }
  );
}

export function listenVendor(id: string, callback: (doc: VendorDoc | null) => void) {
  return onSnapshot(
    doc(db, COL, id),
    (snap) => {
      callback(snap.exists() ? (snap.data() as VendorDoc) : null);
    },
    (error) => {
      console.error('[DB] listenVendor error:', error?.code, error?.message);
    }
  );
}

export async function updateVendor(id: string, data: Partial<VendorDoc>) {
  await updateDoc(doc(db, COL, id), data);
}

export async function deleteVendor(id: string) {
  await deleteDoc(doc(db, COL, id));
}
