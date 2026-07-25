/**
 * database/agents.ts
 * Firestore operations for the 'agents' collection.
 * Each agent is a delivery person covering a specific area in Bengaluru.
 */
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface AgentDoc {
  id: string;
  name: string;
  phone: string;
  area: string;       // e.g. "Mahalakshmi Layout"
  location: string;   // e.g. "North Bengaluru"
  isActive: boolean;
}

const COL = 'agents';

// ── Seed initial agents if collection is empty ────────────────────────────────
const INITIAL_AGENTS: Omit<AgentDoc, 'id'>[] = [
  {
    name: 'Akhil KS',
    phone: '9972505709',
    area: 'Mahalakshmi Layout',
    location: 'North Bengaluru',
    isActive: true,
  },
];

export async function seedAgents() {
  const snap = await getDocs(collection(db, COL));
  if (!snap.empty) return;
  for (const agent of INITIAL_AGENTS) {
    await addDoc(collection(db, COL), { ...agent, createdAt: serverTimestamp() });
  }
  console.log('[DB] Agents seeded.');
}

// ── Real-time listener ────────────────────────────────────────────────────────
export function listenAgents(callback: (docs: AgentDoc[]) => void) {
  return onSnapshot(
    collection(db, COL),
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AgentDoc));
      callback(items);
    },
    (error) => {
      console.error('[DB] listenAgents error:', error?.code, error?.message);
    }
  );
}

// ── Add agent ─────────────────────────────────────────────────────────────────
export async function addAgent(agent: Omit<AgentDoc, 'id'>) {
  const ref = await addDoc(collection(db, COL), {
    ...agent,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ── Update agent ──────────────────────────────────────────────────────────────
export async function updateAgent(id: string, data: Partial<Omit<AgentDoc, 'id'>>) {
  await updateDoc(doc(db, COL, id), data);
}

// ── Delete agent ──────────────────────────────────────────────────────────────
export async function deleteAgent(id: string) {
  await deleteDoc(doc(db, COL, id));
}
