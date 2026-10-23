/**
 * utils/store.ts
 * In-memory state cache backed by Firebase Firestore.
 * All reads are synchronous (from local cache).
 * All writes go to both local cache and Firestore for instant UI + persistence.
 *
 * ⚠️ DO NOT EDIT paper names/prices/category/image in this file.
 *    Edit 👉 database/papers_catalog.ts  (single source of truth)
 */
import { resolvePaperImage } from '../assets/images';
import {
  listenDeliveries,
  addDelivery,
  updateDeliveryStatus as fbUpdateDeliveryStatus,
  listenPapers,
  addPaper as fbAddPaper,
  updatePaper as fbUpdatePaper,
  deletePaper as fbDeletePaper,
  seedPapers,
  listenAppSettings,
  updatePaymentSettings as fbUpdatePaymentSettings,
  addAdminNumber as fbAddAdminNumber,
  removeAdminNumber as fbRemoveAdminNumber,
  seedSettings,
  saveUser,
  listenPayments,
  addPayment as fbAddPayment,
  updatePayment as fbUpdatePayment,
  PAPERS_CATALOG_WITH_IDS,
  listenVendors,
  listenUser,
} from '../database';
import type { AdminUserDoc, AppSettingsDoc, PaymentDoc, VendorDoc } from '../database';
import { setSessionUser } from './session';

export type { AdminUserDoc, VendorDoc };

// ── Types ────────────────────────────────────────────────────────────────────
export interface User {
  name: string;
  phone: string;
  address: string;
  isAdmin: boolean;
  customerKind?: 'new' | 'legacy';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  isVendor?: boolean;
  vendorData?: VendorDoc;
  sessionToken?: string;
  email?: string;
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
  category?: 'Newspaper' | 'Milk' | 'Water';
  quantity?: number;
  imageSrc?: string;
  homeImageUri?: string;
  location?: { lat: number; lng: number };
}

export interface Newspaper {
  id: string;
  name: string;
  language: string;
  category: 'Paper' | 'Magazine';
  priceDay: number;
  priceMonth: number;
  rating: number;
  src: any;
  imageSrc?: string;
}

export interface Payment {
  id: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  method: string;
  txnId: string;
  status: 'Paid' | 'Pending';
  forMonth: string;
  category?: 'Newspaper' | 'Milk' | 'Water';
  createdAt?: any;
}

// ── Image resolution ───────────────────────────────────────────────────────────────
// imageSrc = exact filename (with extension) stored in Firestore.
// resolvePaperImage() maps it to a React Native Image source.
export function resolveImage(imageSrc: string): any {
  return resolvePaperImage(imageSrc);
}

// ── Local in-memory cache (initial values shown until Firebase responds) ──────
let currentUser: User | null = null;

// ─────────────────────────────────────────────────────────────────────────────
// ✅ availablePapers IS DERIVED AUTOMATICALLY FROM THE SINGLE SOURCE CATALOG.
//    Any edit to database/papers_catalog.ts automatically updates this fallback.
//    (same stable IDs, same mapping rules as Firestore seed — 0 duplication.)
// ─────────────────────────────────────────────────────────────────────────────
let availablePapers: Newspaper[] = PAPERS_CATALOG_WITH_IDS.map((c) => ({
  id: c.stableId,
  name: c.name,
  language: c.language,
  category: c.category,
  priceDay: c.priceDay,
  priceMonth: c.priceMonth,
  rating: c.rating,
  imageSrc: c.image ?? '',
  src: resolvePaperImage(c.image ?? ''),
}));

let adminUsers: AdminUserDoc[] = [
  { name: 'System Admin', phone: '8123363394' },
  { name: 'Akhil KS', phone: '9972505709' },
];

let appSettings: AppSettingsDoc = {
  admins: adminUsers,
  paymentUpiId: '',
  paymentUpiName: '',
  paymentQrDataUrl: '',
};

let deliveries: Delivery[] = [];


let payments: Payment[] = [];
let currentCalendarMarks: Record<string, string> = {};
let allVendors: VendorDoc[] = [];

// ─────────────────────────────────────────────────────────────────────────────
// 🧊 CATALOG NAME → IMAGE LUT (built ONCE).
//    For every paper name that exists in the CATALOG:
//       → image ALWAYS comes from the catalog, period.
//    Old Firestore imageSrc values are COMPLETELY IGNORED for catalog papers.
//    Non-catalog papers (custom admin-added later) still use doc.imageSrc
//    because they aren't in the catalog at all.
//    This GUARANTEES: no 1-second "flash to wrong logo" when Firebase connects,
//    regardless of how stale the seeded `imageSrc` field in Firestore is.
// ─────────────────────────────────────────────────────────────────────────────
const CATALOG_NAME_TO_IMAGE: Map<string, string> = new Map(
  PAPERS_CATALOG_WITH_IDS.map((c) => [c.name, c.image])
);
const CATALOG_PAPERNAME_TO_IMAGE = (paperName: string | null | undefined, fallbackSrc?: string | null): string => {
  if (paperName != null) {
    const fromCatalog = CATALOG_NAME_TO_IMAGE.get(paperName);
    if (fromCatalog != null) return fromCatalog;
  }
  // Fall back to the document's imageSrc only for custom/admin papers.
  // It can be a file:// / content:// URI for gallery images OR empty ''
  // when no image has been picked yet — NEVER auto-assign a default logo.
  return fallbackSrc ?? '';
};

const listeners = new Set<() => void>();

// ── Pub/Sub ──────────────────────────────────────────────────────────────────
function notify() {
  listeners.forEach((l) => l());
}

let paymentsUnsubscribe: (() => void) | null = null;

function startPaymentsListener(user: User | null) {
  if (paymentsUnsubscribe) {
    paymentsUnsubscribe();
    paymentsUnsubscribe = null;
  }
  if (!user) {
    payments = [];
    notify();
    return;
  }
  try {
    paymentsUnsubscribe = listenPayments(
      (docs) => {
        payments = docs;
        notify();
      },
      user.isAdmin ? undefined : { customerPhone: user.phone }
    );
  } catch (e) {
    console.warn('[Store] listenPayments failed:', e);
  }
}

// ── Real-time listener for the logged-in customer's own Firestore doc ─────────
// This ensures bills added by admin appear in the customer app without re-login.
let userDocUnsubscribe: (() => void) | null = null;

function startUserListener(user: User | null) {
  if (userDocUnsubscribe) {
    userDocUnsubscribe();
    userDocUnsubscribe = null;
  }
  // Only listen for regular customers (not admin, not vendor)
  if (!user || user.isAdmin || user.isVendor) return;
  try {
    userDocUnsubscribe = listenUser(user.phone, (doc) => {
      if (!doc || !currentUser) return;
      // Merge fresh Firestore fields (bills, approvalStatus, etc.) into currentUser
      currentUser = {
        ...currentUser,
        customerKind: doc.customerKind ?? currentUser.customerKind,
        approvalStatus: doc.approvalStatus ?? currentUser.approvalStatus,
        bills: (doc as any).bills,
        paymentHistory: (doc as any).paymentHistory,
      } as any;
      notify();
    });
  } catch (e) {
    console.warn('[Store] listenUser failed:', e);
  }
}

// ── Bootstrap: seed Firestore + start real-time listeners ────────────────────
async function bootstrap() {
  // ═══════════════════════════════════════════════════════════════════
  // STEP 1: START LISTENERS FIRST — critical!
  // Listeners must ALWAYS be attached even if seeding fails or rate-limits.
  // Otherwise the app stays stuck with static local data forever.
  // ═══════════════════════════════════════════════════════════════════
  try {
    listenDeliveries((docs) => {
      deliveries = docs.map((d) => {
        const finalImageSrc = CATALOG_PAPERNAME_TO_IMAGE(d.paperName, d.imageSrc);
        return { ...d, imageSrc: finalImageSrc, src: resolveImage(finalImageSrc) };
      });
      notify();
    });

    listenPapers((docs) => {
      availablePapers = docs.map((d) => {
        const finalImageSrc = CATALOG_PAPERNAME_TO_IMAGE(d.name, d.imageSrc);
        return {
          id: d.id,
          name: d.name,
          language: d.language,
          category: (d as any).category ?? 'Paper',
          priceDay: d.priceDay,
          priceMonth: d.priceMonth,
          rating: d.rating,
          imageSrc: finalImageSrc,
          src: resolveImage(finalImageSrc),
        };
      });
      notify();
    });

    listenAppSettings((settings) => {
      appSettings = settings;
      adminUsers = settings.admins;
      notify();
    });


    listenVendors((docs) => {
      allVendors = docs;
      // If the current user is a vendor, we should update their session with new vendor data
      if (currentUser?.isVendor && currentUser.vendorData?.secretCode) {
        const updatedVendor = docs.find(v => v.secretCode === currentUser!.vendorData!.secretCode);
        if (updatedVendor) {
          currentUser = { ...currentUser, vendorData: updatedVendor };
        }
      }
      notify();
    });
  } catch (e) {
    console.warn('[Store] Listener attach failed (continuing with local data):', e);
  }

  // ═══════════════════════════════════════════════════════════════════
  // STEP 2: RUN SEEDS IN BACKGROUND (non-blocking, tolerant to failures)
  // Each seed is wrapped in its own try/catch so one failure
  // (e.g. rate limit on papers) doesn't prevent the others from running.
  // ═══════════════════════════════════════════════════════════════════
  try {
    await seedSettings().catch(e => console.warn('[Store] seedSettings failed:', e?.code || e?.message));
  } catch {}

  try {
    // Papers is the largest/most-likely to rate-limit, run it last
    await seedPapers().catch(e => console.warn('[Store] seedPapers failed:', e?.code || e?.message));
  } catch {}
  // Start dynamic payments listener with loaded user
  startPaymentsListener(currentUser);
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
    setSessionUser(user).catch(() => {});
    startPaymentsListener(user);
    startUserListener(user);
    notify();
  },

  getDeliveries() {
    return deliveries;
  },

  getPapers() {
    return availablePapers;
  },

  addPaper(paper: Omit<Newspaper, 'id' | 'rating' | 'src'> & { imageKey?: string }) {
    const imageSrc = paper.imageKey ?? '';
    const category = paper.category ?? 'Paper';
    const tempId = `local-${Date.now()}`;
    const newPaperLocal: Newspaper = {
      id: tempId,
      name: paper.name,
      language: paper.language,
      category,
      priceDay: paper.priceDay,
      priceMonth: paper.priceMonth,
      rating: 4.5,
      imageSrc,
      src: resolveImage(imageSrc),
    };
    availablePapers = [...availablePapers, newPaperLocal];
    notify();
    fbAddPaper({
      name: paper.name,
      language: paper.language,
      category,
      priceDay: paper.priceDay,
      priceMonth: paper.priceMonth,
      rating: 4.5,
      imageSrc,
    })
      .then((firestoreId) => {
        availablePapers = availablePapers.map((p) => (p.id === tempId ? { ...p, id: firestoreId } : p));
        notify();
      })
      .catch(console.warn);
  },

  updatePaper(id: string, data: Partial<Omit<Newspaper, 'id' | 'src'>> & { imageKey?: string }) {
    const imageSrc = data.imageKey;
    const localData: Partial<Newspaper> = {
      name: data.name,
      language: data.language,
      category: data.category,
      priceDay: data.priceDay,
      priceMonth: data.priceMonth,
      rating: data.rating,
    };
    if (imageSrc !== undefined) {
      localData.imageSrc = imageSrc;
      localData.src = resolveImage(imageSrc);
    }
    availablePapers = availablePapers.map((p) => (p.id === id ? { ...p, ...localData } : p));
    notify();
    const fbData: any = { ...data };
    delete fbData.imageKey;
    if (imageSrc !== undefined) fbData.imageSrc = imageSrc;
    fbUpdatePaper(id, fbData).catch(console.warn);
  },

  deletePaper(id: string) {
    availablePapers = availablePapers.filter((p) => p.id !== id);
    notify();
    fbDeletePaper(id).catch(console.warn);
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
    homeImageUri?: string;
    category?: 'Newspaper' | 'Milk' | 'Water';
    quantity?: number;
    location?: { lat: number; lng: number };
  }) {
    if (!currentUser) {
      console.error('[Store] Cannot add subscription: No current user');
      return;
    }
    if (!currentUser.phone) {
      console.error('[Store] Cannot add subscription: User has no phone number');
      return;
    }

    // Use imageSrc if provided, otherwise try to derive from imageSource
    const imageSrc = sub.imageSrc ?? (typeof sub.imageSource === 'string' ? sub.imageSource : '');

    console.log('[Store] Adding subscription:', {
      name: currentUser.name,
      phone: currentUser.phone,
      paperName: sub.paperName,
      plan: sub.plan,
      category: sub.category,
    });

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
      category: sub.category ?? 'Newspaper',
      quantity: sub.quantity ?? 1,
      homeImageUri: sub.homeImageUri,
      location: sub.location,
    })
      .then((id) => {
        console.log('[Store] Subscription added successfully with ID:', id);
      })
      .catch((error) => {
        console.error('[Store] Failed to add subscription:', error);
      });
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

  getAppSettings() {
    return appSettings;
  },

  updatePaymentSettings(data: Partial<Pick<AppSettingsDoc, 'paymentUpiId' | 'paymentUpiName' | 'paymentQrDataUrl'>>) {
    appSettings = { ...appSettings, ...data };
    notify();
    fbUpdatePaymentSettings(data).catch(console.warn);
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


  getPayments() {
    return payments;
  },

  getAllVendors() {
    return allVendors;
  },

  addPayment(payment: Omit<PaymentDoc, 'id'>) {
    const tempId = `local-${Date.now()}`;
    payments = [{ ...payment, id: tempId } as any, ...payments];
    notify();
    fbAddPayment(payment).catch(console.warn);
  },

  updatePayment(id: string, data: Partial<Omit<PaymentDoc, 'id'>>) {
    payments = payments.map((p) => (p.id === id ? ({ ...p, ...data } as any) : p));
    notify();
    fbUpdatePayment(id, data).catch(console.warn);
  },

  getCalendarMarks() {
    return currentCalendarMarks;
  },

  setCalendarMark(dateKey: string, status: string) {
    if (currentCalendarMarks[dateKey] === status) {
      const next = { ...currentCalendarMarks };
      delete next[dateKey];
      currentCalendarMarks = next;
    } else {
      currentCalendarMarks = { ...currentCalendarMarks, [dateKey]: status };
    }
    notify();
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
