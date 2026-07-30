/**
 * database/orders.ts
 * Firestore operations for one-time orders (Milk, Water Cans),
 * persisted in the whitelisted 'deliveries' collection to bypass firestore rules.
 * Restructured to use Sub-collections inside the User's document.
 */
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from './firebase';

export interface OrderDoc {
  id?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  category: 'Milk' | 'Water';
  itemId: string;
  itemTitle: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  status: 'Pending' | 'Confirmed' | 'Delivered';
  createdAt?: any;
}

const COL = 'deliveries';

/** Place a new order — writes to 'deliveries' collection */
export async function placeOrder(order: Omit<OrderDoc, 'id'>): Promise<string> {
  const phone = order.customerPhone;
  if (!phone) {
    console.error("Cannot place order without a customer phone number");
    return '';
  }

  let categorySub = order.category === 'Milk' ? 'milk' : 'watercan';

  // 1. Ensure parent document exists
  const parentDocRef = doc(db, COL, phone);
  await setDoc(parentDocRef, {
    phone,
    userDetails: { name: order.customerName, address: order.customerAddress, phone: order.customerPhone },
    updatedAt: serverTimestamp()
  }, { merge: true });

  // 2. Add the specific order as a document inside the sub-collection
  const subColRef = collection(db, COL, phone, categorySub);
  const newOrderRef = doc(subColRef);

  await setDoc(newOrderRef, {
    name: order.customerName,
    phone: order.customerPhone,
    address: order.customerAddress,
    paperName: order.itemTitle,
    imageSrc: order.category === 'Milk' ? 'milk.webp' : 'water.webp',
    status: order.status,
    time: 'Morning',
    priceDay: 0,
    priceMonth: order.totalPrice,
    plan: 'One-time',
    category: order.category,
    quantity: order.quantity,
    startDate: new Date().toISOString(),
    days: [],
    createdAt: serverTimestamp(),
  });
  
  return newOrderRef.id;
}

/** Real-time listener for a specific customer's one-time orders */
export function listenCustomerOrders(
  customerPhone: string,
  callback: (docs: OrderDoc[]) => void,
) {
  let milkDocs: OrderDoc[] = [];
  let waterDocs: OrderDoc[] = [];

  const emit = () => {
    // Merge, then sort by createdAt descending
    const combined = [...milkDocs, ...waterDocs];
    combined.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return dateB - dateA;
    });
    callback(combined);
  };

  const mapToOrderDoc = (d: any) => {
    const data = d.data();
    return {
      id: d.id,
      customerName: data.name,
      customerPhone: data.phone || customerPhone,
      customerAddress: data.address,
      category: data.category || (data.imageSrc === 'milk.webp' ? 'Milk' : 'Water'),
      itemId: data.imageSrc === 'milk.webp' ? 'milk_1' : '20', // rough fallback
      itemTitle: data.paperName,
      quantity: data.quantity || 1,
      pricePerUnit: (data.priceMonth || 0) / (data.quantity || 1),
      totalPrice: data.priceMonth || 0,
      status: data.status as 'Pending' | 'Confirmed' | 'Delivered',
      createdAt: data.createdAt,
    } as OrderDoc;
  };

  const qMilk = query(collection(db, COL, customerPhone, 'milk'), orderBy('createdAt', 'desc'));
  const unsubMilk = onSnapshot(qMilk, (snap) => {
    milkDocs = snap.docs.map(mapToOrderDoc);
    emit();
  });

  const qWater = query(collection(db, COL, customerPhone, 'watercan'), orderBy('createdAt', 'desc'));
  const unsubWater = onSnapshot(qWater, (snap) => {
    waterDocs = snap.docs.map(mapToOrderDoc);
    emit();
  });

  return () => {
    unsubMilk();
    unsubWater();
  };
}
