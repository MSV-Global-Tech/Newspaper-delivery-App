/**
 * database/storageHelper.ts
 * Firebase Storage is not available on the free Spark plan.
 * Cloud uploads are disabled, but admin-selected gallery images still work:
 * we simply return the local `file://` / content URI as-is.
 * resolvePaperImage() in assets/images.ts recognizes `file://` / `https?://`
 * patterns and passes them through as `{ uri }` Image sources.
 * To enable cloud image uploads, upgrade to the Blaze plan in Firebase Console.
 *
 * ⚠️ NO FALLBACK LOGO — if no image picked, return '' so the UI forces
 *    the admin to choose one (empty-state placeholder reminds them).
 */

export async function uploadNewspaperLogo(
  localUri: string,
  _paperName: string,
): Promise<string> {
  if (!localUri) return '';
  return localUri;
}

export async function uploadImage(localUri: string, _path: string): Promise<string> {
  if (!localUri) return '';
  return localUri;
}

export async function deleteImage(_path: string): Promise<void> {
  // no-op
}
