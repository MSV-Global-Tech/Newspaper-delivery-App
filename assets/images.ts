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
  'prathinidhi.webp':      require('./prathinidhi.webp'),

  // ── English newspaper logos ──
  'hindu.webp':           require('./hindu.webp'),
  'timesofindia.webp':    require('./timesofindia.webp'),
  'economictimes.webp':   require('./economictimes.webp'),
  'deccanherald.webp':    require('./deccanherald.webp'),
  'bangloremirror.webp':  require('./bangloremirror.webp'),
  'indianexpress.webp':   require('./indianexpress.webp'),

  // ── Telugu newspaper logos ──
  'sakshi.webp':         require('./sakshi.webp'),
  'andrajyothy.webp':    require('./andrajyothy.webp'),
  'eenadu.webp':         require('./eenadu.webp'),

  // ── Tamil newspaper logos ──
  'dinakar.webp':        require('./dinakar.webp'),
  'dinamalar.webp':      require('./dinamalar.webp'),
  'thanti.webp':         require('./thanti.webp'),

  // ── Hindi newspaper logos ──
  'rajasthanpatrika.webp': require('./rajasthanpatrika.webp'),

  // ── Kannada magazine logos ──
  'karmaveera.webp':      require('./magzines/karmaveera.webp'),
  'taranga.webp':         require('./magzines/taranga.webp'),
  'sudha.webp':           require('./magzines/sudha.webp'),
  'kasturi.webp':        require('./magzines/kasturi.webp'),
  'mayura.png':         require('./magzines/mayura.png'),
  'priyanka.webp':       require('./magzines/priyanka.webp'),
  'gruhashobha.webp':    require('./magzines/gruhashobha.webp'),
  'frontline.webp':      require('./magzines/frontline.webp'),
  'indiatoday.webp':     require('./magzines/indiatoday.webp'),
  'sportsstar.webp':     require('./magzines/sportsstar.webp'),
  'readersdigest.webp':  require('./magzines/readersdigest.webp'),
  'theweak.webp':        require('./magzines/theweak.webp'),
  'thuglak.png':         require('./magzines/thuglak.png'),
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
  'theHindu':               'hindu.webp',
  'the_hindu':              'hindu.webp',
  'the_hindu.png':          'hindu.webp',
  'the_hindu.webp':         'hindu.webp',
  'hindu':                  'hindu.webp',
  'HINDU':                  'hindu.webp',
  'Hindu':                  'hindu.webp',
  'hindu.webp':             'hindu.webp',

  // ── Times group ──
  'timesOfIndia':           'timesofindia.webp',
  'times_of_india':         'timesofindia.webp',
  'times_of_india.png':     'timesofindia.webp',
  'times_of_india.webp':    'timesofindia.webp',
  'timesofindia':           'timesofindia.webp',
  'timesofindia.webp':      'timesofindia.webp',
  'Times of India':         'timesofindia.webp',
  'times':                  'timesofindia.webp',
  'toi':                    'timesofindia.webp',

  // ── Economic Times ──
  'economictimes':          'economictimes.webp',
  'economictimes.webp':     'economictimes.webp',
  'economictimes.png':      'economictimes.webp',
  'Economic Times':         'economictimes.webp',
  'economic_times':         'economictimes.webp',
  'et':                     'economictimes.webp',

  // ── Deccan Herald ──
  'deccanherald':           'deccanherald.webp',
  'deccanherald.webp':      'deccanherald.webp',
  'deccanherald.png':       'deccanherald.webp',
  'Deccan Herald':          'deccanherald.webp',
  'deccan_herald':          'deccanherald.webp',

  // ── Bangalore Mirror ──
  'bangloremirror':         'bangloremirror.webp',
  'bangloremirror.webp':    'bangloremirror.webp',
  'bangloremirror.png':     'bangloremirror.webp',
  'Bangalore Mirror':       'bangloremirror.webp',
  'bangalore_mirror':       'bangloremirror.webp',

  // ── Indian Express ──
  'indianexpress':          'indianexpress.webp',
  'indianexpress.webp':     'indianexpress.webp',
  'indianexpress.png':      'indianexpress.webp',
  'Indian Express':         'indianexpress.webp',
  'indian_express':         'indianexpress.webp',
  'The Indian Express':     'indianexpress.webp',

  // ── Sakshi (Telugu) ──
  'sakshi':                 'sakshi.webp',
  'sakshi.webp':            'sakshi.webp',
  'sakshi.png':             'sakshi.webp',
  'Sakshi':                 'sakshi.webp',

  // ── Andra Jyothi (Telugu) ──
  'andrajyothy':            'andrajyothy.webp',
  'andrajyothy.webp':       'andrajyothy.webp',
  'andrajyothy.png':        'andrajyothy.webp',
  'Andra Jyothi':           'andrajyothy.webp',
  'andra_jyothi':           'andrajyothy.webp',
  'andhra jyothy':          'andrajyothy.webp',
  'Andhra Jyothi':          'andrajyothy.webp',

  // ── Eenadu (Telugu) ──
  'eenadu':                 'eenadu.webp',
  'eenadu.webp':            'eenadu.webp',
  'eenadu.png':             'eenadu.webp',
  'Eenadu':                 'eenadu.webp',

  // ── Dinakaran (Tamil) ──
  'dinakar':                'dinakar.webp',
  'dinakar.webp':           'dinakar.webp',
  'dinakar.png':            'dinakar.webp',
  'Dinakaran':              'dinakar.webp',
  'dinakaran':              'dinakar.webp',
  'dinakaran.webp':         'dinakar.webp',

  // ── Dinamalar (Tamil) ──
  'dinamalar':              'dinamalar.webp',
  'dinamalar.webp':         'dinamalar.webp',
  'dinamalar.png':          'dinamalar.webp',
  'Dinamalar':              'dinamalar.webp',

  // ── Thanthi (Tamil) ──
  'thanti':                 'thanti.webp',
  'thanti.webp':            'thanti.webp',
  'thanti.png':             'thanti.webp',
  'Thanthi':                'thanti.webp',
  'thanthi':                'thanti.webp',
  'thanthi.webp':           'thanti.webp',
  'Thanthi (Daily)':        'thanti.webp',
  'daily thanthi':          'thanti.webp',
  'Daily Thanthi':          'thanti.webp',

  // ── Rajasthan Patrika (Hindi) ──
  'rajasthanpatrika':       'rajasthanpatrika.webp',
  'rajasthanpatrika.webp':  'rajasthanpatrika.webp',
  'rajasthanpatrika.png':   'rajasthanpatrika.webp',
  'Rajasthan Patrika':      'rajasthanpatrika.webp',
  'rajasthan_patrika':      'rajasthanpatrika.webp',

  // ── Karmaveera (Kannada magazine) ──
  'karmaveera':             'karmaveera.webp',
  'karmaveera.webp':        'karmaveera.webp',
  'karmaveera.png':         'karmaveera.webp',
  'Karmaveera':             'karmaveera.webp',

  // ── Taranga (Kannada magazine) ──
  'taranga':                'taranga.webp',
  'taranga.webp':           'taranga.webp',
  'taranga.png':            'taranga.webp',
  'Taranga':                'taranga.webp',

  // ── Sudha (Kannada magazine) ──
  'sudha':                  'sudha.webp',
  'sudha.webp':             'sudha.webp',
  'sudha.png':              'sudha.webp',
  'Sudha':                  'sudha.webp',

  // ── Kasturi (Kannada magazine) ──
  'kasturi':                'kasturi.webp',
  'kasturi.webp':           'kasturi.webp',
  'kasturi.png':            'kasturi.webp',
  'Kasturi':                'kasturi.webp',

  // ── Mayura (Kannada magazine) ──
  'mayura':                 'mayura.png',
  'mayura.png':             'mayura.png',
  'mayura.webp':            'mayura.png',
  'Mayura':                 'mayura.png',

  // ── Priyanka (Kannada magazine) ──
  'priyanka':               'priyanka.webp',
  'priyanka.webp':          'priyanka.webp',
  'priyanka.png':           'priyanka.webp',
  'Priyanka':               'priyanka.webp',

  // ── Gruhasobha (Kannada magazine) ──
  'gruhashobha':            'gruhashobha.webp',
  'gruhashobha.webp':       'gruhashobha.webp',
  'gruhashobha.png':        'gruhashobha.webp',
  'Gruhasobha':             'gruhashobha.webp',

  // ── Frontline (English magazine) ──
  'frontline':              'frontline.webp',
  'frontline.webp':         'frontline.webp',
  'frontline.png':          'frontline.webp',
  'Frontline':              'frontline.webp',

  // ── India Today (English magazine) ──
  'indiatoday':             'indiatoday.webp',
  'indiatoday.webp':        'indiatoday.webp',
  'indiatoday.png':         'indiatoday.webp',
  'India Today':            'indiatoday.webp',
  'india_today':            'indiatoday.webp',

  'sportsstar':             'sportsstar.webp',
  'sportsstar.webp':        'sportsstar.webp',
  'sportsstar.png':         'sportsstar.webp',
  'Sportsstar':             'sportsstar.webp',
  'sportstar':              'sportsstar.webp',
  'sportstar.webp':         'sportsstar.webp',
  'sportstar.png':          'sportsstar.webp',
  'sports star':            'sportsstar.webp',
  'sports star.webp':       'sportsstar.webp',
  'sports star.png':        'sportsstar.webp',

  'readersdigest':          'readersdigest.webp',
  'readersdigest.webp':     'readersdigest.webp',
  'readersdigest.png':      'readersdigest.webp',
  'Readers Digest':         'readersdigest.webp',
  'readers digest':         'readersdigest.webp',
  'readers digest.webp':    'readersdigest.webp',
  'readers digest.png':     'readersdigest.webp',

  'the week':               'theweak.webp',
  'theweek':                'theweak.webp',
  'theweek.webp':           'theweak.webp',
  'theweek.png':            'theweak.webp',
  'the weak':               'theweak.webp',
  'theweak':                'theweak.webp',
  'theweak.webp':           'theweak.webp',
  'theweak.png':            'theweak.webp',

  'thuglak':                'thuglak.png',
  'thuglak.webp':           'thuglak.png',
  'thuglak.png':            'thuglak.png',
  'Thuglak':                'thuglak.png',
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
