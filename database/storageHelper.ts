/**
 * database/storageHelper.ts
 *
 * Uploads newspaper logos (and other images) from a local device URI to
 * Firebase Storage, then returns the public HTTPS download URL so that
 * EVERY user's device can render the image (not just the admin's phone).
 *
 * Why this fix matters:
 *   Before: uploadNewspaperLogo() just returned the local `content://` or
 *           `file://` URI from expo-image-picker.  That path only exists on
 *           the admin's device.  Other phones downloaded the same string from
 *           Firestore, tried to load `{ uri: "content://..." }` and got
 *           nothing — only the paper's name was visible.
 *   After:  We read the local file as a Blob, upload it to Firebase Storage
 *           at `newspaper_logos/<name>_<ts>.<ext>`, and call getDownloadURL().
 *           The resulting `https://firebasestorage.googleapis.com/...` URL is
 *           publicly accessible from any device.
 *
 * Firebase Storage security rules (set in Firebase Console → Storage → Rules):
 *   To make this work your bucket must allow public read + authenticated
 *   (or admin) write.  A good ruleset for this app:
 *
 *       rules_version = '2';
 *       service firebase.storage {
 *         match /b/{bucket}/o {
 *           match /newspaper_logos/{allPaths=**} {
 *             allow read;
 *             allow write: if true;   // tighten to admin-only if you add auth
 *           }
 *         }
 *       }
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

const NEWSPAPER_LOGOS_FOLDER = 'newspaper_logos';

/**
 * Whether to use Firebase Storage (if enabled) OR encode images as base64
 * data-URLs and store them directly inside Firestore documents.
 *
 * Firebase Console shows an "upgrade plan" prompt for Storage on the free
 * Spark plan, meaning Storage isn't enabled for the project.  In that case
 * we can still sync logos across every user's device: Firestore documents
 * are already synced via the free tier, so base64 data URLs embedded in
 * `newspapers.imageSrc` propagate to all client phones naturally.
 *
 * Tradeoff: Firestore docs max out at 1 MiB.  WEBP/JPEG logos at 500×500
 * are typically 20–70 KB, which fits comfortably.
 */
export const USE_STORAGE = false;

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
    const dataUrl = await uriToBase64(localUri);
    const sizeKB = Math.round(dataUrl.length / 1.33 / 1024);
    if (sizeKB > 900) {
      throw new Error(
        `Logo is too large (~${sizeKB} KB after encoding).  ` +
        'Firestore documents are limited to 1 MB.  Please choose a smaller ' +
        'image or enable Firebase Storage.'
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
    return await uriToBase64(localUri);
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
