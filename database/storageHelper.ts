/**
 * Firebase Free Tier Optimizations
 *
 * Free Tier Limits:
 * - Firestore: 50K reads/day, 20K writes/day
 * - Storage: 5GB total
 * - Document size: 1MB max
 *
 * Current Setup:
 * - USE_STORAGE = true (uses Firebase Storage for screenshots - 5GB free tier)
 * - Max image size: 800KB (safe under 1MB document limit)
 * - Compression: 0.8 quality for screenshots
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
import { compressImageForUpload } from '../utils/imageCompression';

const NEWSPAPER_LOGOS_FOLDER = 'newspaper_logos';

/**
 * Storage enabled for free tier optimization.
 * Using Firebase Storage (5GB free tier) for screenshots.
 * URLs stored in Firestore documents instead of base64 strings.
 * This increases capacity from ~200 users to ~1,000+ users.
 */
export const USE_STORAGE = true;

function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      resolve(xhr.response);
    };
    xhr.onerror = (e) => {
      reject(new Error('uriToBlob failed: ' + (e as any)?.message));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

function uriToBase64(uri: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ''));
      reader.onerror = (e) => reject(new Error('FileReader failed: ' + (e as any)?.message));
      reader.readAsDataURL(xhr.response);
    };
    xhr.onerror = (e) => reject(new Error('uriToBase64 failed: ' + (e as any)?.message));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

function sanitizeName(name: string): string {
  return (name || 'paper')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40) || 'paper';
}

function guessMime(uri: string): { ext: string; mime: string } {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return { ext: 'png', mime: 'image/png' };
  if (lower.endsWith('.webp')) return { ext: 'webp', mime: 'image/webp' };
  if (lower.endsWith('.gif')) return { ext: 'gif', mime: 'image/gif' };
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return { ext: 'jpg', mime: 'image/jpeg' };
  return { ext: 'jpg', mime: 'image/jpeg' };
}

function extractStoragePath(downloadUrl: string): string | null {
  try {
    const decoded = decodeURIComponent(downloadUrl);
    const match = decoded.match(/\/o\/(.+?)(?:\?|$)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function uploadNewspaperLogo(
  localUri: string,
  paperName: string,
): Promise<string> {
  if (!localUri) return '';

  // ── Fallback: encode as base64 data URL ──────────────────────────────────
  // Free Spark plan does not allow Storage without upgrading.  In that case
  // we embed the logo directly into the Firestore document so every user's
  // device still gets the image via Firestore sync.
  if (!USE_STORAGE) {
    // Compress image first if it's large
    const compressed = await compressImageForUpload(localUri, 300, 300, 70);
    const uriToUse = compressed.wasCompressed ? compressed.uri : localUri;

    const dataUrl = await uriToBase64(uriToUse);
    const sizeKB = Math.round(dataUrl.length / 1.33 / 1024);
    // Reduced from 900KB to 800KB for safety margin
    if (sizeKB > 800) {
      throw new Error(
        `Image is too large (~${sizeKB} KB after encoding).  ` +
        'Firestore documents are limited to 1 MB.  Please choose a smaller ' +
        'image or compress it further.'
      );
    }
    return dataUrl;
  }

  // ── Storage path (only when USE_STORAGE = true) ──────────────────────────
  const { ext, mime } = guessMime(localUri);
  const safeName = sanitizeName(paperName || 'paper');
  const timestamp = Date.now();
  const objectPath = `${NEWSPAPER_LOGOS_FOLDER}/${safeName}_${timestamp}.${ext}`;

  const blob = await uriToBlob(localUri);
  try {
    const storageRef = ref(storage, objectPath);
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: mime,
      cacheControl: 'public, max-age=2592000',
    });
    const publicUrl = await getDownloadURL(snapshot.ref);
    return publicUrl;
  } finally {
    if (typeof (blob as any).close === 'function') {
      try { (blob as any).close(); } catch { /* noop */ }
    }
  }
}

export async function uploadImage(localUri: string, fullStoragePath: string): Promise<string> {
  if (!localUri) return '';

  if (!USE_STORAGE) {
    // Compress image first if it's large (e.g., payment screenshots)
    const compressed = await compressImageForUpload(localUri, 800, 800, 60);
    const uriToUse = compressed.wasCompressed ? compressed.uri : localUri;

    const dataUrl = await uriToBase64(uriToUse);
    const sizeKB = Math.round(dataUrl.length / 1.33 / 1024);
    // Reduced from 900KB to 800KB for safety margin
    if (sizeKB > 800) {
      throw new Error(
        `Image is too large (~${sizeKB} KB after encoding).  ` +
        'Firestore documents are limited to 1 MB.  Please choose a smaller ' +
        'image or compress it further.'
      );
    }
    return dataUrl;
  }

  const { mime } = guessMime(localUri);
  const blob = await uriToBlob(localUri);
  try {
    const storageRef = ref(storage, fullStoragePath);
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: mime,
      cacheControl: 'public, max-age=2592000',
    });
    return await getDownloadURL(snapshot.ref);
  } finally {
    if (typeof (blob as any).close === 'function') {
      try { (blob as any).close(); } catch { /* noop */ }
    }
  }
}

export async function deleteImage(pathOrUrl: string): Promise<void> {
  if (!pathOrUrl) return;

  // If Storage is disabled, or the "URL" is actually an inline data:image
  // string (base64), there's nothing in a bucket to clean up.
  if (!USE_STORAGE || /^data:/i.test(pathOrUrl)) {
    return;
  }

  let storagePath: string | null = null;
  if (/^https?:\/\//i.test(pathOrUrl)) {
    storagePath = extractStoragePath(pathOrUrl);
  } else if (pathOrUrl.startsWith(NEWSPAPER_LOGOS_FOLDER + '/')) {
    storagePath = pathOrUrl;
  }

  if (!storagePath) {
    return;
  }

  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (e: any) {
    const code = String(e?.code ?? '').toLowerCase();
    if (code === 'storage/object-not-found') return;
    console.warn('[storageHelper] deleteImage failed:', code || e?.message);
  }
}
