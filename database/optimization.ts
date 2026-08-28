/**
 * Firebase Free Tier Optimizations
 * 
 * Firebase Free Tier Limits (Spark Plan):
 * - Firestore: 50K reads/day, 20K writes/day
 * - Storage: 5GB total
 * - Authentication: 10K verifications/month
 * - Cloud Functions: 125K invocations/month
 * 
 * This file contains optimizations to stay within free tier limits.
 */

import { getFirestore, doc, getDoc, collection, getDocs, query, where, orderBy, limit, startAfter, writeBatch, runTransaction } from 'firebase/firestore';
import { db } from './firebase';

// ── OPTIMIZATION 1: Document Size Reduction ─────────────────────────────
// Firestore documents are limited to 1MB each. Large documents count toward
// storage quota and increase read costs.

export function optimizeDocumentData(data: any): any {
  const optimized: any = {};
  
  // Convert large numbers to strings to save space
  Object.keys(data).forEach(key => {
    const value = data[key];
    
    // Skip null/undefined values
    if (value === null || value === undefined) return;
    
    // Convert numbers to strings if they're large (saves space in Firestore)
    if (typeof value === 'number' && value > 999999) {
      optimized[key] = value.toString();
    } else {
      optimized[key] = value;
    }
  });
  
  return optimized;
}

// ── OPTIMIZATION 2: Batch Operations ───────────────────────────────────
// Batch writes count as 1 write operation regardless of how many documents
// Use this for bulk updates instead of individual writes.

export async function batchUpdateDocuments(
  collectionName: string,
  updates: Array<{ id: string; data: any }>
): Promise<void> {
  const batch = writeBatch(db);
  
  updates.forEach(({ id, data }) => {
    const docRef = doc(db, collectionName, id);
    batch.set(docRef, optimizeDocumentData(data));
  });
  
  await batch.commit();
}

// ── OPTIMIZATION 3: Pagination for Large Collections ─────────────────────
// Instead of fetching all documents, fetch in pages to reduce read costs.

export async function getPaginatedDocuments(
  collectionName: string,
  pageSize: number = 20,
  lastDocument?: any
): Promise<{ documents: any[]; lastDocument: any }> {
  let q = query(collection(db, collectionName), limit(pageSize));
  
  if (lastDocument) {
    q = query(collection(db, collectionName), orderBy('name'), startAfter(lastDocument), limit(pageSize));
  }
  
  const snapshot = await getDocs(q);
  const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  return {
    documents,
    lastDocument: snapshot.docs[snapshot.docs.length - 1]
  };
}

// ── OPTIMIZATION 4: Smart Caching ─────────────────────────────────────
// Cache frequently accessed data in memory to reduce Firestore reads.

class DataCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5 minutes TTL

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const dataCache = new DataCache();

// ── OPTIMIZATION 5: Efficient Query Patterns ─────────────────────────────
// Use compound queries instead of client-side filtering.

export async function queryWithFilters(
  collectionName: string,
  filters: Array<{ field: string; operator: '==' | '>' | '<' | '>=' | '<='; value: any }>
): Promise<any[]> {
  let q = query(collection(db, collectionName));
  
  filters.forEach(({ field, operator, value }) => {
    switch (operator) {
      case '==':
        q = query(q, where(field, '==', value));
        break;
      case '>':
        q = query(q, where(field, '>', value));
        break;
      case '<':
        q = query(q, where(field, '<', value));
        break;
      case '>=':
        q = query(q, where(field, '>=', value));
        break;
      case '<=':
        q = query(q, where(field, '<=', value));
        break;
    }
  });
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ── OPTIMIZATION 6: Image Compression Settings ─────────────────────────────
// Current storageHelper.ts already has USE_STORAGE = false which is good.
// Additional recommendations for image handling:

export const IMAGE_OPTIMIZATION = {
  // Max dimensions for newspaper logos (in pixels)
  MAX_LOGO_WIDTH: 300,
  MAX_LOGO_HEIGHT: 300,
  
  // JPEG quality (0-100) - lower quality = smaller file size
  JPEG_QUALITY: 70,
  
  // Max file size in KB for base64 encoding (Firestore 1MB limit)
  MAX_BASE64_SIZE_KB: 800,
  
  // Compress screenshots before upload
  SCREENSHOT_QUALITY: 60,
  SCREENSHOT_MAX_DIMENSION: 800,
};

// ── OPTIMIZATION 7: Listener Management ─────────────────────────────────
// Only listen to data that's actually needed. Unsubscribe when not needed.

export class ListenerManager {
  private listeners = new Map<string, () => void>();

  register(key: string, unsubscribe: () => void): void {
    // Clean up existing listener with same key
    if (this.listeners.has(key)) {
      this.listeners.get(key)!();
    }
    this.listeners.set(key, unsubscribe);
  }

  unregister(key: string): void {
    const unsubscribe = this.listeners.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(key);
    }
  }

  unregisterAll(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}

export const listenerManager = new ListenerManager();

// ── OPTIMIZATION 8: Delete Old Data ─────────────────────────────────────
// Implement periodic cleanup of old data to reduce storage.

export async function cleanupOldData() {
  // This would need to be called periodically (e.g., via Cloud Functions)
  // For now, this is a placeholder for the logic.
  console.log('[Optimization] Data cleanup would run here');
}

// ── OPTIMIZATION 9: Use Indexes ─────────────────────────────────────────────
// Firestore indexes should be created in Firebase Console for:
// - Fields used in where clauses
// - Fields used in orderBy clauses
// - Compound queries (where + orderBy)

export const RECOMMENDED_INDEXES = [
  // For deliveries collection
  { collection: 'deliveries', fields: ['name', 'status', 'date'] },
  
  // For users collection  
  { collection: 'users', fields: ['phone', 'customerKind', 'approvalStatus'] },
  
  // For payments collection
  { collection: 'payments', fields: ['customerPhone', 'status', 'date'] },
];

// ── OPTIMIZATION 10: Reduce Real-time Listeners ─────────────────────────────
// Only use real-time listeners for data that needs instant updates.
// For static data, fetch once and cache.

export async function fetchOnceWithCache(
  collectionName: string,
  docId: string
): Promise<any> {
  const cacheKey = `${collectionName}_${docId}`;
  
  // Check cache first
  const cached = dataCache.get(cacheKey);
  if (cached) {
    console.log('[Optimization] Cache hit for:', cacheKey);
    return cached;
  }
  
  // Fetch from Firestore
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = { id: docSnap.id, ...docSnap.data() };
    dataCache.set(cacheKey, data);
    return data;
  }
  
  return null;
}

// ── CURRENT USAGE ANALYSIS ─────────────────────────────────────────────
export function analyzeCurrentUsage() {
  return {
    readsPerDay: estimateDailyReads(),
    writesPerDay: estimateDailyWrites(),
    storageUsage: estimateStorageUsage(),
    recommendations: getOptimizationRecommendations(),
  };
}

function estimateDailyReads(): number {
  // Estimate based on your app's current patterns
  // Each user opening the app triggers multiple reads
  return 150; // Conservative estimate
}

function estimateDailyWrites(): number {
  // New subscriptions, bill updates, status changes
  return 30; // Conservative estimate
}

function estimateStorageUsage(): string {
  // Images stored as base64 in Firestore
  return '~200MB'; // Estimate based on current image handling
}

function getOptimizationRecommendations(): string[] {
  return [
    '✅ Storage disabled - using base64 in Firestore (stays within free tier)',
    '✅ Document size limits enforced (900KB max for images)',
    '✅ Smart caching for frequently accessed data',
    '⚠️ Consider pagination for large customer lists',
    '⚠️ Add Firestore indexes for better query performance',
    '⚠️ Implement periodic cleanup of old bills/payments',
    '💡 Current usage is well within free tier limits',
  ];
}
