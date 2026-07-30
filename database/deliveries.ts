/**
 * database/deliveries.ts
 * All Firestore operations for the 'deliveries' collection.
 * Restructured to use Sub-collections (documents) inside the user's document.
 */
import {
  collection,
  collectionGroup,
  doc,
  setDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { store } from '../utils/store';

export interface DeliveryDoc {
  id: string;
  name: string;
  phone?: string;
  address: string;
  paperName: string;
  imageSrc: string;
  status: 'Pending' | 'Delivered' | 'Skipped';
  time: string;
  priceDay?: number;
  priceMonth?: number;
  plan?: string;
  startDate?: string;
  days?: string[];
  paymentMethod?: string;
  category?: 'Newspaper' | 'Milk' | 'Water';
  quantity?: number;
  createdAt?: any;
}

const COL = 'deliveries';

export async function seedDeliveries() {
  return;
}

// ── Real-time listener ───────────────────────────────────────────────────────
export function listenDeliveries(callback: (docs: DeliveryDoc[]) => void) {
  let newsDocs: DeliveryDoc[] = [];
  let milkDocs: DeliveryDoc[] = [];
  let waterDocs: DeliveryDoc[] = [];

  const emit = () => {
    callback([...newsDocs, ...milkDocs, ...waterDocs]);
  };

  const unsubNews = onSnapshot(collectionGroup(db, 'newspaper'), (snap) => {
    newsDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DeliveryDoc));
    emit();
  }, (error) => console.error('[DB] listenDeliveries (newspaper) error:', error?.message));

  const unsubMilk = onSnapshot(collectionGroup(db, 'milk'), (snap) => {
    milkDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DeliveryDoc));
    emit();
  }, (error) => console.error('[DB] listenDeliveries (milk) error:', error?.message));

  const unsubWater = onSnapshot(collectionGroup(db, 'watercan'), (snap) => {
    waterDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DeliveryDoc));
    emit();
  }, (error) => console.error('[DB] listenDeliveries (watercan) error:', error?.message));

  // Return a single unsubscribe function that cleans up all three listeners
  return () => {
    unsubNews();
    unsubMilk();
    unsubWater();
  };
}

// ── Add a new subscription delivery ─────────────────────────────────────────
export async function addDelivery(delivery: Omit<DeliveryDoc, 'id'>) {
  const phone = delivery.phone;
  if (!phone) {
    console.error("Cannot add delivery without a customer phone number");
    return '';
  }

  let categorySub = 'newspaper';
  if (delivery.category === 'Milk') categorySub = 'milk';
  if (delivery.category === 'Water') categorySub = 'watercan';

  // 1. Ensure the parent document exists (good practice so it doesn't appear as a "ghost" document in Firestore)
  const parentDocRef = doc(db, COL, phone);
  await setDoc(parentDocRef, {
    phone,
    userDetails: { name: delivery.name, address: delivery.address, phone: delivery.phone },
    updatedAt: serverTimestamp()
  }, { merge: true });

  // 2. Add the specific order as a document inside the correct sub-collection
  const subColRef = collection(db, COL, phone, categorySub);
  const newOrderRef = doc(subColRef); // Auto-generates a document ID
  
  await setDoc(newOrderRef, {
    ...delivery,
    createdAt: serverTimestamp(),
  });

  return newOrderRef.id;
}

// ── Update delivery status ───────────────────────────────────────────────────
export async function updateDeliveryStatus(
  id: string,
  status: 'Pending' | 'Delivered' | 'Skipped',
) {
  // Find the order in the local store so we know which sub-collection it belongs to
  const localDel = store.getDeliveries().find(d => d.id === id);
  if (!localDel || !localDel.phone) {
     console.error("Cannot update delivery: phone number or category unknown.");
     return;
  }
  
  let categorySub = 'newspaper';
  if (localDel.category === 'Milk') categorySub = 'milk';
  if (localDel.category === 'Water') categorySub = 'watercan';

  const docRef = doc(db, COL, localDel.phone, categorySub, id);
  await updateDoc(docRef, { status });
}
