/**
 * utils/updateChecker.ts
 *
 * Checks for a new app version by fetching `version.json` from GitHub.
 * To use:
 *   1. Push this repo to GitHub.
 *   2. Set GITHUB_VERSION_URL below to the raw URL of your version.json.
 *      Example: https://raw.githubusercontent.com/YourUser/YourRepo/main/version.json
 *   3. When you release a new APK, bump the version in version.json and push to GitHub.
 *   4. Set downloadUrl in version.json to your GitHub Releases page or direct APK link.
 */

// ─── CONFIG ────────────────────────────────────────────────────────────────────
// Replace this URL with your own GitHub raw content URL once you push to GitHub.
export const GITHUB_VERSION_URL =
  'https://raw.githubusercontent.com/MSV-Global-Tech/Newspaper-delivery-App/main/version.json';

// The current installed version of the app (keep this in sync with app.json → version)
export const CURRENT_VERSION = '1.0.0';
export const CURRENT_VERSION_CODE = 1;
// ───────────────────────────────────────────────────────────────────────────────

export interface RemoteVersionInfo {
  version: string;
  versionCode: number;
  mandatory: boolean;
  releaseNotes: string;
  downloadUrl: string;
  minSupportedVersionCode: number;
}

/**
 * Compares two semver strings.
 * Returns true if remote > current.
 */
function isNewerVersion(remote: string, current: string): boolean {
  const parse = (v: string) =>
    v.split('.').map((n) => parseInt(n, 10) || 0);
  const [rMaj, rMin, rPatch] = parse(remote);
  const [cMaj, cMin, cPatch] = parse(current);
  if (rMaj !== cMaj) return rMaj > cMaj;
  if (rMin !== cMin) return rMin > cMin;
  return rPatch > cPatch;
}

/**
 * Fetches version info from GitHub and returns it if an update is available.
 * Returns null if the app is already up-to-date or the check fails.
 */
export async function checkForUpdate(): Promise<RemoteVersionInfo | null> {
  try {
    const response = await fetch(GITHUB_VERSION_URL, {
      // Bypass any cache so we always get the latest version
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (!response.ok) return null;

    const remote: RemoteVersionInfo = await response.json();

    const updateAvailable =
      isNewerVersion(remote.version, CURRENT_VERSION) ||
      remote.versionCode > CURRENT_VERSION_CODE;

    return updateAvailable ? remote : null;
  } catch {
    // Silently fail — no internet, GitHub down, etc.
    return null;
  }
}
