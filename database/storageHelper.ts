/**
 * database/storageHelper.ts
 * Firebase Storage is not available on the free Spark plan.
 * Image uploads are disabled — admin-added papers use local fallback images.
 * To enable cloud image uploads, upgrade to the Blaze plan in Firebase Console.
 */

export async function uploadNewspaperLogo(
  _localUri: string,
  _paperName: string,
): Promise<string> {
  // Return 'vijayavani' as the fallback image key — resolveImage() in store.ts
  // will map this to the local bundled asset.
  return 'vijayavani';
}

export async function uploadImage(_localUri: string, _path: string): Promise<string> {
  return 'vijayavani';
}

export async function deleteImage(_path: string): Promise<void> {
  // no-op
}
