/**
 * database/settings.ts
 * Stores app-level settings in Firestore.
 * Holds admin profiles containing name and phone number.
 */
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';

export interface AdminUserDoc {
  name: string;
  phone: string;
}

const SETTINGS_DOC = doc(db, 'settings', 'app');

// ── Seed initial admin accounts if document does not exist ────────────────────
const INITIAL_ADMINS: AdminUserDoc[] = [
  { name: 'Akhil KS', phone: '9972505709' },
  { name: 'System Admin', phone: '8123363394' },
];

export async function seedSettings() {
  const snap = await getDoc(SETTINGS_DOC);
  if (snap.exists()) {
    const data = snap.data();
    let currentAdmins: AdminUserDoc[] = data?.admins ?? [];
    
    // Ensure permanent admins are ALWAYS present in the DB
    let modified = false;
    for (const pAdmin of INITIAL_ADMINS) {
      if (!currentAdmins.some(a => a.phone === pAdmin.phone)) {
        currentAdmins.push(pAdmin);
        modified = true;
      }
    }
    
    if (modified) {
      await updateDoc(SETTINGS_DOC, { admins: currentAdmins });
    }
    return;
  }
  await setDoc(SETTINGS_DOC, { admins: INITIAL_ADMINS });
  console.log('[DB] Settings seeded with admins.');
}

// ── Real-time listener for admin users ─────────────────────────────────────
export function listenAdminNumbers(callback: (admins: AdminUserDoc[]) => void) {
  return onSnapshot(
    SETTINGS_DOC,
    (snap) => {
      const data = snap.data();
      let admins: AdminUserDoc[] = data?.admins ?? INITIAL_ADMINS;
      INITIAL_ADMINS.forEach(pAdmin => {
        if (!admins.some(a => a.phone === pAdmin.phone)) {
          admins = [...admins, pAdmin];
        }
      });
      callback(admins);
    },
    (error) => {
      console.error('[DB] listenAdminNumbers error:', error?.code, error?.message);
      callback(INITIAL_ADMINS);
    }
  );
}

// ── Add an admin profile ──────────────────────────────────────────────────────
export async function addAdminNumber(phone: string, name: string) {
  const snap = await getDoc(SETTINGS_DOC);
  const currentAdmins: AdminUserDoc[] = snap.data()?.admins ?? [];
  
  if (!currentAdmins.some(a => a.phone === phone)) {
    const updated = [...currentAdmins, { name, phone }];
    await updateDoc(SETTINGS_DOC, { admins: updated });
  }
}

// ── Remove an admin profile ───────────────────────────────────────────────────
export async function removeAdminNumber(phone: string) {
  // Prevent deleting permanent owner accounts
  if (phone === '9972505709' || phone === '8123363394') return;
  const snap = await getDoc(SETTINGS_DOC);
  const currentAdmins: AdminUserDoc[] = snap.data()?.admins ?? [];
  const updated = currentAdmins.filter(a => a.phone !== phone);
  await updateDoc(SETTINGS_DOC, { admins: updated });
}
