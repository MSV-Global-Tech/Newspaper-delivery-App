/**
 * database/papers.ts
 * All Firestore operations for the 'newspapers' collection.
 */
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface NewspaperDoc {
  id: string;
  name: string;
  language: string;
  priceDay: number;
  priceMonth: number;
  rating: number;
  imageSrc: string;   // string key OR a Firebase Storage download URL for custom uploads
}

const COL = 'newspapers';

// ── Seed initial papers if collection is empty ───────────────────────────────
const INITIAL_PAPERS: Omit<NewspaperDoc, 'id'>[] = [
  { name: 'Vijayavani',    language: 'Kannada', priceDay: 6,  priceMonth: 180, rating: 4.6, imageSrc: 'vijayavani' },
  { name: 'Prajavani',     language: 'Kannada', priceDay: 7,  priceMonth: 210, rating: 4.5, imageSrc: 'prajavani' },
  { name: 'The Hindu',     language: 'English', priceDay: 10, priceMonth: 300, rating: 4.7, imageSrc: 'the_hindu' },
  { name: 'Times of India',language: 'English', priceDay: 8,  priceMonth: 240, rating: 4.3, imageSrc: 'times_of_india' },
  { name: 'Dinamalar',     language: 'Tamil',   priceDay: 6,  priceMonth: 160, rating: 4.4, imageSrc: 'vijayavani' },
  { name: 'Dainik Bhaskar',language: 'Hindi',   priceDay: 5,  priceMonth: 150, rating: 4.2, imageSrc: 'prajavani' },
];

export async function seedPapers() {
  const snap = await getDocs(collection(db, COL));
  if (!snap.empty) return;
  for (const p of INITIAL_PAPERS) {
    await addDoc(collection(db, COL), { ...p, createdAt: serverTimestamp() });
  }
  console.log('[DB] Papers seeded.');
}

// ── Real-time listener ───────────────────────────────────────────────────────
export function listenPapers(callback: (docs: NewspaperDoc[]) => void) {
  return onSnapshot(collection(db, COL), (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as NewspaperDoc));
    callback(items);
  });
}

// ── Add a new paper ──────────────────────────────────────────────────────────
export async function addPaper(paper: Omit<NewspaperDoc, 'id'>) {
  const ref = await addDoc(collection(db, COL), {
    ...paper,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ── Delete a paper ───────────────────────────────────────────────────────────
export async function deletePaper(id: string) {
  await deleteDoc(doc(db, COL, id));
}
