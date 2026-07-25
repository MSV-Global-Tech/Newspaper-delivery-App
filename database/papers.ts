/**
 * database/papers.ts
 * All Firestore operations for the 'newspapers' collection.
 *
 * ⚠️ DO NOT EDIT paper names/prices/images here.
 *    Edit 👉 database/papers_catalog.ts (single source of truth)
 */
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { PAPERS_CATALOG, PAPERS_CATALOG_WITH_IDS } from './papers_catalog';

export interface NewspaperDoc {
  id: string;
  name: string;
  language: string;
  category: 'Paper' | 'Magazine';
  priceDay: number;
  priceMonth: number;
  rating: number;
  imageSrc: string;
}

const COL = 'newspapers';

// ─────────────────────────────────────────────────────────────────────────────
// ✅ INITIAL_PAPERS IS DERIVED AUTOMATICALLY FROM THE SINGLE SOURCE CATALOG.
//    Any edit to papers_catalog.ts automatically updates the seed.
// ─────────────────────────────────────────────────────────────────────────────
export const INITIAL_PAPERS: Omit<NewspaperDoc, 'id'>[] = PAPERS_CATALOG.map((c) => ({
  name: c.name,
  language: c.language,
  category: c.category,
  priceDay: c.priceDay,
  priceMonth: c.priceMonth,
  rating: c.rating,
  imageSrc: c.image,
}));

const RETRYABLE_CODES = new Set([
  'resource-exhausted', 'unavailable', 'deadline-exceeded', 'internal',
  'permission-denied', 'failed-precondition', 'aborted',
]);

function isRetryable(e: any): boolean {
  const code = String(e?.code ?? '').toLowerCase();
  const msg = String(e?.message ?? '').toLowerCase();
  return RETRYABLE_CODES.has(code) ||
    msg.includes('rate limit') || msg.includes('quota') ||
    msg.includes('deadline') || msg.includes('unavailable') ||
    msg.includes('resource exhausted');
}

async function withRetry<T>(fn: () => Promise<T>, label = 'operation', maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e: any) {
      if (attempt < maxRetries && isRetryable(e)) {
        const delay = 500 * Math.pow(2, attempt);
        console.warn(`[DB] ${label} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`, e?.code || e?.message);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      console.error(`[DB] ${label} failed after ${attempt + 1} attempts:`, e?.code || e?.message);
      throw e;
    }
  }
  throw new Error('unreachable');
}

export async function seedPapers() {
  await withRetry(async () => {
    const snap = await getDocs(collection(db, COL));

    // ── 1) Empty collection → batch seed ──
    if (snap.empty) {
      const batch = writeBatch(db);
      for (const p of INITIAL_PAPERS) {
        const ref = doc(collection(db, COL));
        batch.set(ref, { ...p, createdAt: serverTimestamp() });
      }
      await batch.commit();
      console.log(`[DB] Papers seeded (new collection, ${INITIAL_PAPERS.length} items) via batch.`);
      return;
    }

    // ── 2) Smart migration: re-seed if ANY mismatch ──
    const existingNames = new Set(snap.docs.map(d => String((d.data() as any).name ?? '')));
    const hasCategory = snap.docs.every(d => typeof (d.data() as any).category === 'string');
    const countMatches = snap.docs.length === INITIAL_PAPERS.length;
    const allNamesPresent = INITIAL_PAPERS.every(p => existingNames.has(p.name));

    const needsReseed = !hasCategory || !countMatches || !allNamesPresent;

    if (needsReseed) {
      console.log(
        `[DB] Papers migration: hasCategory=${hasCategory}, ` +
        `countOK=${countMatches} (FB=${snap.docs.length}/need=${INITIAL_PAPERS.length}), ` +
        `allNamesOK=${allNamesPresent} → wiping & re-seeding via batch.`
      );

      const totalOps = snap.docs.length + INITIAL_PAPERS.length;
      if (totalOps <= 500) {
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        for (const p of INITIAL_PAPERS) {
          const ref = doc(collection(db, COL));
          batch.set(ref, { ...p, createdAt: serverTimestamp() });
        }
        await batch.commit();
      } else {
        const delBatch = writeBatch(db);
        snap.docs.forEach(d => delBatch.delete(d.ref));
        await delBatch.commit();

        for (let i = 0; i < INITIAL_PAPERS.length; i += 400) {
          const chunk = INITIAL_PAPERS.slice(i, i + 400);
          const addBatch = writeBatch(db);
          for (const p of chunk) {
            const ref = doc(collection(db, COL));
            addBatch.set(ref, { ...p, createdAt: serverTimestamp() });
          }
          await addBatch.commit();
          if (i + 400 < INITIAL_PAPERS.length) {
            await new Promise(r => setTimeout(r, 200));
          }
        }
      }
      console.log(`[DB] Papers re-seeded with full catalog (${INITIAL_PAPERS.length} items).`);
    } else {
      console.log(`[DB] Papers up-to-date (${INITIAL_PAPERS.length} items, no migration needed).`);
    }
  }, 'seedPapers');
}

// ── Real-time listener ───────────────────────────────────────────────────────
export function listenPapers(callback: (docs: NewspaperDoc[]) => void) {
  return onSnapshot(
    collection(db, COL),
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as NewspaperDoc));
      callback(items);
    },
    (error) => {
      console.error('[DB] listenPapers error:', error?.code, error?.message);
    }
  );
}

// ── Add a new paper ──────────────────────────────────────────────────────────
export async function addPaper(paper: Omit<NewspaperDoc, 'id'>) {
  const ref = await addDoc(collection(db, COL), {
    ...paper,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ── Update an existing paper ─────────────────────────────────────────────────
export async function updatePaper(id: string, data: Partial<Omit<NewspaperDoc, 'id'>>) {
  await updateDoc(doc(db, COL, id), data);
}

// ── Delete a paper ───────────────────────────────────────────────────────────
export async function deletePaper(id: string) {
  await deleteDoc(doc(db, COL, id));
}
