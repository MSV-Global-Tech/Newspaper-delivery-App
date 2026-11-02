import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

export interface PaymentDoc {
  id: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  method: string;
  txnId: string;
  status: 'Paid' | 'Pending';
  forMonth: string;
  category?: 'Newspaper' | 'Milk' | 'Water';
  paperName?: string;
  screenshotUrl?: string;
  createdAt?: any;
}

const COL = 'payments';

export function listenPayments(
  callback: (docs: PaymentDoc[]) => void,
  opts?: { customerPhone?: string }
) {
  const base = collection(db, COL);
  const q = opts?.customerPhone
    ? query(base, where('customerPhone', '==', opts.customerPhone), orderBy('createdAt', 'desc'))
    : query(base, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentDoc));
      callback(items);
    },
    (error) => {
      console.error('[DB] listenPayments error:', error?.code, error?.message);
    }
  );
}

export async function addPayment(payment: Omit<PaymentDoc, 'id'>) {
  const ref = await addDoc(collection(db, COL), {
    ...payment,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePayment(id: string, data: Partial<Omit<PaymentDoc, 'id'>>) {
  await updateDoc(doc(db, COL, id), data);
}

