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

export interface DeliveryDoc {
  id: string;
  name: string;
  phone?: string;
  address: string;
  paperName: string;
  imageSrc: string;
  status: 'Pending' | 'Delivered';
  time: string;
  priceDay?: number;
  priceMonth?: number;
  plan?: string;
  startDate?: string;
  days?: string[];
  paymentMethod?: string;
  category?: 'Newspaper';
  quantity?: number;
  homeImageUri?: string;
  location?: { lat: number; lng: number };
  createdAt?: any;
}

const COL = 'deliveries';

export async function seedDeliveries() {
  return;
}

// ── Real-time listener ───────────────────────────────────────────────────────
export function listenDeliveries(callback: (docs: DeliveryDoc[]) => void) {
  let newsDocs: DeliveryDoc[] = [];

  const emit = () => {
    callback(newsDocs);
  };

  const unsubNews = onSnapshot(collectionGroup(db, 'newspaper'), (snap) => {
    newsDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DeliveryDoc));
    emit();
  }, (error) => console.error('[DB] listenDeliveries (newspaper) error:', error?.message));

  // Return a single unsubscribe function that cleans up all listeners
  return () => {
    unsubNews();
  };
}

// ── Add a new subscription delivery ─────────────────────────────────────────
export async function addDelivery(delivery: Omit<DeliveryDoc, 'id'>) {
  const phone = delivery.phone;
  if (!phone) {
    console.error("Cannot add delivery without a customer phone number");
    return '';
  }

  const categorySub = 'newspaper'; // Only newspaper deliveries supported

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
