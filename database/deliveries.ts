/**
 * database/deliveries.ts
 * All Firestore operations for the 'deliveries' collection.
 * Delivery = a customer's subscription record tracked daily by the agent.
 */
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  setDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface DeliveryDoc {
  id: string;
  name: string;
  phone?: string;
  address: string;
  paperName: string;
  imageSrc: string;       // string key e.g. 'vijayavani' | 'prajavani' | 'the_hindu'
  status: 'Pending' | 'Delivered' | 'Skipped';
  time: string;
  priceDay?: number;
  priceMonth?: number;
  plan?: string;
  startDate?: string;
  days?: string[];
  paymentMethod?: string;
  createdAt?: any;
}

const COL = 'deliveries';

// ── Seed initial data if collection is empty ────────────────────────────────
const INITIAL_DELIVERIES: Omit<DeliveryDoc, 'id'>[] = [
  {
    name: 'Shivakumar',
    address: 'Koramangala, #42, 4th Block',
    paperName: 'Vijayavani',
    imageSrc: 'vijayavani',
    status: 'Pending',
    time: '5:30 AM',
    priceDay: 6,
    priceMonth: 180,
    plan: 'Monthly',
    startDate: '25 Jul 2025',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
  {
    name: 'Anjali Sharma',
    address: 'HSR Layout, Sector 3, #112',
    paperName: 'The Hindu',
    imageSrc: 'the_hindu',
    status: 'Delivered',
    time: '5:15 AM',
    priceDay: 10,
    priceMonth: 300,
    plan: 'Monthly',
    startDate: '20 Jul 2025',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  },
  {
    name: 'Ramesh Gowda',
    address: 'Indiranagar, 100ft Rd, #88',
    paperName: 'Prajavani',
    imageSrc: 'prajavani',
    status: 'Skipped',
    time: 'Paused',
    priceDay: 7,
    priceMonth: 210,
    plan: 'Monthly',
    startDate: '10 Jul 2025',
    days: ['Monday', 'Wednesday', 'Friday'],
  },
];

export async function seedDeliveries() {
  const snap = await getDocs(collection(db, COL));
  if (!snap.empty) return;
  for (const d of INITIAL_DELIVERIES) {
    await addDoc(collection(db, COL), { ...d, createdAt: serverTimestamp() })
      .catch(e => {
        if (String(e?.code || '').includes('resource-exhausted') || String(e?.message || '').includes('rate')) {
          console.warn('[DB] seedDeliveries rate-limited, pausing 1s...');
          return new Promise(r => setTimeout(() => addDoc(collection(db, COL), { ...d, createdAt: serverTimestamp() }).then(r as any).catch(() => {}), 1000));
        }
        throw e;
      });
  }
  console.log('[DB] Deliveries seeded.');
}

// ── Real-time listener ───────────────────────────────────────────────────────
export function listenDeliveries(callback: (docs: DeliveryDoc[]) => void) {
  return onSnapshot(
    collection(db, COL),
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DeliveryDoc));
      callback(items);
    },
    (error) => {
      console.error('[DB] listenDeliveries error:', error?.code, error?.message);
    }
  );
}

// ── Add a new subscription delivery ─────────────────────────────────────────
export async function addDelivery(delivery: Omit<DeliveryDoc, 'id'>) {
  const ref = await addDoc(collection(db, COL), {
    ...delivery,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ── Update delivery status ───────────────────────────────────────────────────
export async function updateDeliveryStatus(
  id: string,
  status: 'Pending' | 'Delivered' | 'Skipped',
) {
  await updateDoc(doc(db, COL, id), { status });
}
