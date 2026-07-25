// ═══════════════════════════════════════════════════════════════════════════════
// assets/images.ts
// ═══════════════════════════════════════════════════════════════════════════════
// 🔴 SECOND FILE YOU MAY NEED TO EDIT (only for asset file swaps).
//
//    RULE: Key = exact filename (case-sensitive, WITH extension).
//          Value = require('./that_exact_filename.ext')
//
//    ── Common edits: ──
//
//    ✅ Add a new image (e.g. sakshi.webp):
//       - Drop sakshi.webp in /assets/
//       - Add 1 line:  'sakshi.webp': require('./sakshi.webp'),
//       - In papers_catalog.ts set `image: 'sakshi.webp'` on the paper
//
//    ✅ Swap PNG → WEBP for existing image (e.g. vijayavani.png → vijayavani.webp):
//       - Delete vijayavani.png, add vijayavani.webp in /assets/
//       - Change this line (same key in map, update require path):
//             'vijayavani.webp': require('./vijayavani.webp'),
//       - In papers_catalog.ts change `image: 'vijayavani.png'` → `'vijayavani.webp'`
//       - Done. 2 lines total, both trivial.
//
//    ✅ Change case sensitivity matters, but resolvePaperImage() will try
//       case-insensitive fallback if exact key not found.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 👉 ONE LINE PER ASSET.
 *    Key = filename with extension.
 *    Value = require('./filename.ext').
 */
export const IMAGES: Record<string, any> = {
  // ── App UI images ──
  'onboarding.png': require('./onboarding.png'),
  'logo.png':       require('./logo.png'),

  // ── Newspaper / magazine logos ──
  'vijayavani.png':     require('./vijayavani.png'),
  'prajavani.png':      require('./prajavani.png'),
  'the_hindu.png':      require('./the_hindu.png'),
  'times_of_india.png': require('./the_hindu.png'),
  'hindu.webp':         require('./hindu.webp'),
};

/**
 * Resolves any image string (filename with extension, or URL) to a React Native
 * Image source. Handles:
 *   - exact filename key lookup in IMAGES
 *   - LEGACY ALIASES (every old imageSrc we've ever stored in Firestore, mapped
 *     to the current canonical asset — kills the "flash to wrong image" bug when
 *     Firebase connects with stale seed data).
 *   - case-insensitive fallback (covers caps/small typos)
 *   - strip-extension fallback (if someone forgot .png/.webp)
 *   - URL passthrough (http://, https://, file:// — admin-uploaded logos)
 */
const LEGACY_ALIAS_TO_CANONICAL: Record<string, string> = {
  // ── Vijayavani group ( Kannada papers ) ──
  'vijayavani':   'vijayavani.png',
  'vijayavani.png': 'vijayavani.png',
  'VIJAYAVANI':   'vijayavani.png',
  'Vijayavani':   'vijayavani.png',

  // ── Prajavani group ──
  'prajavani':    'prajavani.png',
  'prajavani.png': 'prajavani.png',

  // ── The Hindu group (various aliases used over time) ──
  'theHindu':     'the_hindu.png',
  'the_hindu':    'the_hindu.png',
  'the_hindu.png':'the_hindu.png',
  'hindu':        'the_hindu.png',
  'HINDU':        'the_hindu.png',
  'Hindu':        'the_hindu.png',
  // Your explicit separate hindu.webp — if you typed it, return the webp
  'hindu.webp':   'hindu.webp',

  // ── Times group ──
  'timesOfIndia': 'times_of_india.png',
  'times_of_india':'times_of_india.png',
  'times_of_india.png':'times_of_india.png',
  'times':        'times_of_india.png',
  'toi':          'times_of_india.png',
};

export function resolvePaperImage(image: string | null | undefined): any {
  // Empty string / null / undefined => NO IMAGE (caller should render placeholder)
  if (!image || image.trim().length === 0) return null;

  // 1) URLs / paths: admin-uploaded via Firebase Storage, gallery file://,
  //    Expo ImagePicker assets-library/content://, or raw absolute paths
  //    (Android sometimes returns /data/...  without any scheme).
  if (typeof image === 'string' &&
      (/^(https?:|file:|content:|assets-library:)/i.test(image) ||
       image.startsWith('/') ||
       image.startsWith('content://') ||
       image.startsWith('file://'))) {
    return { uri: image };
  }

  // 2) Exact key match (the normal / intended path)
  if (IMAGES[image] != null) return IMAGES[image];

  // 3) Legacy alias match — covers every old seed key we've ever used
  const viaAlias = LEGACY_ALIAS_TO_CANONICAL[image];
  if (viaAlias != null && IMAGES[viaAlias] != null) return IMAGES[viaAlias];

  // 4) Case-insensitive fallback (e.g. 'Hindu.webp' vs 'hindu.webp')
  const lower = image.toLowerCase();
  for (const k of Object.keys(IMAGES)) {
    if (k.toLowerCase() === lower) return IMAGES[k];
  }
  for (const alias of Object.keys(LEGACY_ALIAS_TO_CANONICAL)) {
    if (alias.toLowerCase() === lower) {
      const canon = LEGACY_ALIAS_TO_CANONICAL[alias];
      if (IMAGES[canon] != null) return IMAGES[canon];
    }
  }

  // 5) Extension strip fallback (someone typed 'vijayavani' not 'vijayavani.png')
  const bare = lower.replace(/\.[a-z0-9]+$/i, '');
  if (bare) {
    for (const k of Object.keys(IMAGES)) {
      const kbare = k.replace(/\.[a-z0-9]+$/i, '').toLowerCase();
      if (kbare === bare) return IMAGES[k];
    }
    for (const alias of Object.keys(LEGACY_ALIAS_TO_CANONICAL)) {
      const abare = alias.replace(/\.[a-z0-9]+$/i, '').toLowerCase();
      if (abare === bare) {
        const canon = LEGACY_ALIAS_TO_CANONICAL[alias];
        if (IMAGES[canon] != null) return IMAGES[canon];
      }
    }
  }

  // 6) Final fallback: no image => caller renders placeholder
  return null;
}
