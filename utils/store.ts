/**
 * utils/store.ts
 * In-memory state cache backed by Firebase Firestore.
 * All reads are synchronous (from local cache).
 * All writes go to both local cache and Firestore for instant UI + persistence.
 */
import { IMAGES } from '../assets/images';
import {
  listenDeliveries,
  addDelivery,
  updateDeliveryStatus as fbUpdateDeliveryStatus,
  seedDeliveries,
  listenPapers,
  addPaper as fbAddPaper,
  seedPapers,
  listenAdminNumbers,
  addAdminNumber as fbAddAdminNumber,
  removeAdminNumber as fbRemoveAdminNumber,
  seedSettings,
  saveUser,
  listenAgents,
  addAgent as fbAddAgent,
  deleteAgent as fbDeleteAgent,
  seedAgents,
} from '../database';
import type { AgentDoc, AdminUserDoc } from '../database';

export type { AgentDoc, AdminUserDoc };

// ── Types ────────────────────────────────────────────────────────────────────
export interface User {
  name: string;
  phone: string;
  address: string;
  isAdmin: boolean;
}

export interface Delivery {
  id: string;
  name: string;
  phone?: string;
  address: string;
  paperName: string;
  src: any;
  status: 'Pending' | 'Delivered' | 'Skipped';
  time: string;
  priceDay?: number;
  priceMonth?: number;
  plan?: string;
  startDate?: string;
  days?: string[];
  paymentMethod?: string;
}

export interface Newspaper {
  id: string;
  name: string;
  language: string;
  priceDay: number;
  priceMonth: number;
  rating: number;
  src: any;
}

// ── Image key → require() mapping ────────────────────────────────────────────
// Firestore can't store require() objects, so we store a string key and resolve here.
export function resolveImage(imageSrc: string): any {
  switch (imageSrc) {
    case 'vijayavani':    return IMAGES.vijayavani;
    case 'prajavani':     return IMAGES.prajavani;
    case 'the_hindu':     return IMAGES.theHindu;
    case 'times_of_india':return IMAGES.timesOfIndia;
    default:
      // If it looks like a URL (Firebase Storage download URL), use it directly
      if (imageSrc?.startsWith('http')) return { uri: imageSrc };
      return IMAGES.vijayavani; // fallback
  }
}

// ── Local in-memory cache (initial values shown until Firebase responds) ──────
let currentUser: User | null = null;

let availablePapers: Newspaper[] = [
  { id: '1', name: 'Vijayavani',     language: 'Kannada', priceDay: 6,  priceMonth: 180, rating: 4.6, src: IMAGES.vijayavani },
  { id: '2', name: 'Prajavani',      language: 'Kannada', priceDay: 7,  priceMonth: 210, rating: 4.5, src: IMAGES.prajavani },
  { id: '3', name: 'The Hindu',      language: 'English', priceDay: 10, priceMonth: 300, rating: 4.7, src: IMAGES.theHindu },
  { id: '4', name: 'Times of India', language: 'English', priceDay: 8,  priceMonth: 240, rating: 4.3, src: IMAGES.timesOfIndia },
  { id: '5', name: 'Dinamalar',      language: 'Tamil',   priceDay: 6,  priceMonth: 160, rating: 4.4, src: IMAGES.vijayavani },
  { id: '6', name: 'Dainik Bhaskar', language: 'Hindi',   priceDay: 5,  priceMonth: 150, rating: 4.2, src: IMAGES.prajavani },
];

let adminUsers: AdminUserDoc[] = [
  { name: 'System Admin', phone: '8123363394' },
  { name: 'Akhil KS', phone: '9972505709' },
];

let deliveries: Delivery[] = [];

let agents: AgentDoc[] = [
  {
    id: 'seed-1',
    name: 'Akhil KS',
    phone: '9972505709',
    area: 'Mahalakshmi Layout',
    location: 'North Bengaluru',
    isActive: true,
  },
];

const listeners = new Set<() => void>();

// ── Pub/Sub ──────────────────────────────────────────────────────────────────
function notify() {
  listeners.forEach((l) => l());
}

// ── Bootstrap: seed Firestore + start real-time listeners ────────────────────
async function bootstrap() {
  try {
    await seedDeliveries();
    await seedPapers();
    await seedSettings();
    await seedAgents();

    // Listen to deliveries in real-time
    listenDeliveries((docs) => {
      deliveries = docs.map((d) => ({
        ...d,
        src: resolveImage(d.imageSrc),
      }));
      notify();
    });

    // Listen to papers in real-time
    listenPapers((docs) => {
      availablePapers = docs.map((d) => ({
        ...d,
        src: resolveImage(d.imageSrc),
      }));
      notify();
    });

    // Listen to admin numbers in real-time
    listenAdminNumbers((admins) => {
      adminUsers = admins;
      notify();
    });

    // Listen to agents in real-time
    listenAgents((docs) => {
      agents = docs;
      notify();
    });
  } catch (e) {
    console.warn('[Store] Firebase bootstrap error:', e);
    // App still works with local in-memory data if Firebase fails
  }
}

bootstrap();

// ── Public store API (unchanged — no imports in the app need to change) ───────
export const store = {
  getUser() {
    return currentUser;
  },

  setUser(user: User | null) {
    currentUser = user;
    // Persist to Firestore in background (no await — non-blocking)
    if (user) saveUser(user).catch(console.warn);
    notify();
  },

  getDeliveries() {
    return deliveries;
  },

  getPapers() {
    return availablePapers;
  },

  addPaper(paper: Omit<Newspaper, 'id' | 'rating'> & { imageKey?: string }) {
    const imageSrc = paper.imageKey ?? 'vijayavani';
    // Write to Firestore (real-time listener will update local cache)
    fbAddPaper({
      name: paper.name,
      language: paper.language,
      priceDay: paper.priceDay,
      priceMonth: paper.priceMonth,
      rating: 4.5,
      imageSrc,
    }).catch(console.warn);
  },

  addSubscription(sub: {
    paperName: string;
    plan: string;
    priceDay: number;
    priceMonth: number;
    startDate: string;
    days: string[];
    imageSource: any;
    paymentMethod: string;
    imageSrc?: string;
  }) {
    if (!currentUser) return;
    const imageSrc = sub.imageSrc ?? 'vijayavani';
    addDelivery({
      name: currentUser.name,
      phone: currentUser.phone,
      address: currentUser.address || 'Koramangala, Bengaluru',
      paperName: sub.paperName,
      imageSrc,
      status: 'Pending',
      time: '5:30 AM',
      priceDay: sub.priceDay,
      priceMonth: sub.priceMonth,
      plan: sub.plan,
      startDate: sub.startDate,
      days: sub.days,
      paymentMethod: sub.paymentMethod,
    }).catch(console.warn);
  },

  updateDeliveryStatus(id: string, status: 'Pending' | 'Delivered' | 'Skipped') {
    // Optimistic local update for instant UI feedback
    deliveries = deliveries.map((d) => (d.id === id ? { ...d, status } : d));
    notify();
    // Sync to Firestore
    fbUpdateDeliveryStatus(id, status).catch(console.warn);
  },

  getAdminNumbers() {
    return adminUsers;
  },

  addAdminNumber(phone: string, name: string) {
    if (!adminUsers.some(a => a.phone === phone)) {
      adminUsers = [...adminUsers, { name, phone }];
      notify();
    }
    fbAddAdminNumber(phone, name).catch(console.warn);
  },

  removeAdminNumber(phone: string) {
    adminUsers = adminUsers.filter((a) => a.phone !== phone);
    notify();
    fbRemoveAdminNumber(phone).catch(console.warn);
  },

  getAgents() {
    return agents;
  },

  addAgent(agent: Omit<AgentDoc, 'id'>) {
    const tempId = `local-${Date.now()}`;
    agents = [...agents, { ...agent, id: tempId }];
    notify();
    fbAddAgent(agent).catch(console.warn);
  },

  deleteAgent(id: string) {
    agents = agents.filter((a) => a.id !== id);
    notify();
    fbDeleteAgent(id).catch(console.warn);
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  notify() {
    notify();
  },
};
