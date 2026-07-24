/**
 * database/settings.ts
 * Stores app-level settings in Firestore.
 * Currently holds the list of admin phone numbers.
 */
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from './firebase';

const SETTINGS_DOC = doc(db, 'settings', 'app');

// ── Seed initial admin numbers if document does not exist ────────────────────
const INITIAL_ADMIN_NUMBERS = ['8123363394', '9972505709'];

export async function seedSettings() {
  const snap = await getDoc(SETTINGS_DOC);
  if (snap.exists()) return;
  await setDoc(SETTINGS_DOC, { adminNumbers: INITIAL_ADMIN_NUMBERS });
  console.log('[DB] Settings seeded.');
}

// ── Real-time listener for admin numbers ─────────────────────────────────────
export function listenAdminNumbers(callback: (numbers: string[]) => void) {
  return onSnapshot(SETTINGS_DOC, (snap) => {
    const data = snap.data();
    callback(data?.adminNumbers ?? []);
  });
}

// ── Add an admin number ──────────────────────────────────────────────────────
export async function addAdminNumber(phone: string) {
  await updateDoc(SETTINGS_DOC, { adminNumbers: arrayUnion(phone) });
}

// ── Remove an admin number ───────────────────────────────────────────────────
export async function removeAdminNumber(phone: string) {
  await updateDoc(SETTINGS_DOC, { adminNumbers: arrayRemove(phone) });
}
