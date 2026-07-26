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
  'onboarding.webp': require('./onboarding.webp'),
  'logo.png':       require('./logo.png'),

  // ── Kannada newspaper logos (10 listed by user) ──
  'vijayavani.webp':       require('./vijayavani.webp'),
  'prajavani.webp':        require('./prajavani.webp'),
  'kannadaprabha.webp':    require('./kannadaprabha.webp'),
  'kolaravani.webp':       require('./kolaravani.webp'),
  'prajapragathi.webp':    require('./prajapragathi.webp'),
  'pravasiprapancha.webp': require('./pravasiprapancha.webp'),
  'udayavani.webp':        require('./udayavani.webp'),
  'vijaykarnataka.webp':   require('./vijaykarnataka.webp'),
  'vishwavaaradhi.webp':   require('./vishwavaaradhi.webp'),
  'vishwavani.webp':       require('./vishwavani.webp'),

  // ── English / other language newspaper logos ──
  'the_hindu.webp':      require('./hindu.webp'),
  'times_of_india.webp': require('./hindu.webp'),
  'hindu.webp':          require('./hindu.webp'),
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
  // ── App logos (recently WEBP → PNG migration) ──
  'logo':                   'logo.png',
  'logo.webp':              'logo.png',
  'logo.png':               'logo.png',
  'logo_foreground':        'logo.png',
  'logo_foreground.webp':   'logo.png',
  'logo_foreground.png':    'logo.png',
  'LOGO':                   'logo.png',

  // ── Vijayavani ──
  'vijayavani':             'vijayavani.webp',
  'vijayavani.png':         'vijayavani.webp',
  'vijayavani.webp':        'vijayavani.webp',
  'VIJAYAVANI':             'vijayavani.webp',
  'Vijayavani':             'vijayavani.webp',

  // ── Kannada Prabha (new: kannadaprabha.webp) ──
  'kannadaprabha':          'kannadaprabha.webp',
  'kannadaprabha.webp':     'kannadaprabha.webp',
  'kannada prabha':         'kannadaprabha.webp',
  'Kannada Prabha':         'kannadaprabha.webp',
  'kannada_prabha':         'kannadaprabha.webp',
  'kannadaprabha.png':      'kannadaprabha.webp',

  // ── Kolaravani (new: kolaravani.webp) ──
  'kolaravani':             'kolaravani.webp',
  'kolaravani.webp':        'kolaravani.webp',
  'kolaravani.png':         'kolaravani.webp',
  'Kolaravani':             'kolaravani.webp',

  // ── Prajapragathi (new: prajapragathi.webp) ──
  'prajapragathi':          'prajapragathi.webp',
  'prajapragathi.webp':     'prajapragathi.webp',
  'prajapragathi.png':      'prajapragathi.webp',
  'Prajapragathi':          'prajapragathi.webp',

  // ── Prajavani ──
  'prajavani':              'prajavani.webp',
  'prajavani.png':          'prajavani.webp',
  'prajavani.webp':         'prajavani.webp',
  'Prajavani':              'prajavani.webp',

  // ── Pravasi Prapancha (new: pravasiprapancha.webp) ──
  'pravasiprapancha':       'pravasiprapancha.webp',
  'pravasiprapancha.webp':  'pravasiprapancha.webp',
  'pravasiprapancha.png':   'pravasiprapancha.webp',
  'pravasi prapancha':      'pravasiprapancha.webp',
  'Pravasi Prapancha':      'pravasiprapancha.webp',
  'pravasi_prapancha':      'pravasiprapancha.webp',

  // ── Udayavani (new: udayavani.webp) ──
  'udayavani':              'udayavani.webp',
  'udayavani.webp':         'udayavani.webp',
  'udayavani.png':          'udayavani.webp',
  'Udayavani':              'udayavani.webp',

  // ── Vijay Karnataka (new: vijaykarnataka.webp) ──
  'vijaykarnataka':         'vijaykarnataka.webp',
  'vijaykarnataka.webp':    'vijaykarnataka.webp',
  'vijaykarnataka.png':     'vijaykarnataka.webp',
  'vijay karnataka':        'vijaykarnataka.webp',
  'Vijay Karnataka':        'vijaykarnataka.webp',
  'vijay_karnataka':        'vijaykarnataka.webp',

  // ── Vishwa Vaaridhi (new: vishwavaaradhi.webp) ──
  'vishwavaaradhi':         'vishwavaaradhi.webp',
  'vishwavaaradhi.webp':    'vishwavaaradhi.webp',
  'vishwavaaradhi.png':     'vishwavaaradhi.webp',
  'vishwa vaaridhi':        'vishwavaaradhi.webp',
  'Vishwa Vaaridhi':        'vishwavaaradhi.webp',
  'vishwa_vaaridhi':        'vishwavaaradhi.webp',
  'vishwavaridhi':          'vishwavaaradhi.webp',

  // ── Vishwavani (new: vishwavani.webp) ──
  'vishwavani':             'vishwavani.webp',
  'vishwavani.webp':        'vishwavani.webp',
  'vishwavani.png':         'vishwavani.webp',
  'Vishwavani':             'vishwavani.webp',

  // ── The Hindu group (various aliases used over time) ──
  'theHindu':               'the_hindu.webp',
  'the_hindu':              'the_hindu.webp',
  'the_hindu.png':          'the_hindu.webp',
  'the_hindu.webp':         'the_hindu.webp',
  'hindu':                  'the_hindu.webp',
  'HINDU':                  'the_hindu.webp',
  'Hindu':                  'the_hindu.webp',
  'hindu.webp':             'hindu.webp',

  // ── Times group ──
  'timesOfIndia':           'times_of_india.webp',
  'times_of_india':         'times_of_india.webp',
  'times_of_india.png':     'times_of_india.webp',
  'times_of_india.webp':    'times_of_india.webp',
  'times':                  'times_of_india.webp',
  'toi':                    'times_of_india.webp',
};

export function resolvePaperImage(image: string | null | undefined): any {
  // Empty string / null / undefined => NO IMAGE (caller should render placeholder)
  if (!image || image.trim().length === 0) return null;

  // 1) URLs / paths: admin-uploaded via Firebase Storage, gallery file://,
  //    Expo ImagePicker assets-library/content://, inline base64 data:,
  //    or raw absolute paths (Android sometimes returns /data/...  without
  //    any scheme).
  if (typeof image === 'string' &&
      (/^(https?:|file:|content:|assets-library:|data:)/i.test(image) ||
       image.startsWith('/') ||
       image.startsWith('content://') ||
       image.startsWith('file://') ||
       image.startsWith('data:'))) {
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
