// ═══════════════════════════════════════════════════════════════════════════════
// assets/images.ts
// ═══════════════════════════════════════════════════════════════════════════════

export const IMAGES: Record<string, any> = {
  // ── App UI images ──
  'onboarding.webp': require('./splash1.webp'),
  'splash1.webp':    require('./splash1.webp'),
  'splash2.webp':    require('./splash2.webp'),
  'logo.png':       require('./logo.png'),
  'milk.webp':      require('./Milk/milk.webp'),
  'water.webp':     require('./Milk/water.webp'),
  'newspaper.webp': require('./Milk/newspaper.webp'),

  // ── Kannada newspaper logos ──
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
  'vidyarthimitra.webp':   require('./vidyarthimitra.webp'),
  'samyuktha.webp':        require('./samyuktha.webp'),

  // ── English newspaper logos ──
  'hindu.webp':           require('./hindu.webp'),
  'timesofindia.webp':    require('./timesofindia.webp'),
  'economictimes.webp':   require('./economictimes.webp'),
  'deccanherald.webp':    require('./deccanherald.webp'),
  'bangloremirror.webp':  require('./bangloremirror.webp'),
  'indianexpress.webp':   require('./indianexpress.webp'),
  'wealth.webp':          require('./wealth.webp'),

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

const LEGACY_ALIAS_TO_CANONICAL: Record<string, string> = {
  // ── App logos ──
  'logo':                   'logo.png',
  'logo.webp':              'logo.png',
  'logo.png':               'logo.png',
  'logo_foreground':        'logo.png',
  'logo_foreground.webp':   'logo.png',
  'logo_foreground.png':    'logo.png',
  'LOGO':                   'logo.png',

  // ── Kannada ──
  'vijayavani':             'vijayavani.webp',
  'vijayavani.png':         'vijayavani.webp',
  'vijayavani.webp':        'vijayavani.webp',
  'VIJAYAVANI':             'vijayavani.webp',
  'Vijayavani':             'vijayavani.webp',

  'kannadaprabha':          'kannadaprabha.webp',
  'kannadaprabha.webp':     'kannadaprabha.webp',
  'kannada prabha':         'kannadaprabha.webp',
  'Kannada Prabha':         'kannadaprabha.webp',
  'kannada_prabha':         'kannadaprabha.webp',
  'kannadaprabha.png':      'kannadaprabha.webp',

  'kolaravani':             'kolaravani.webp',
  'kolaravani.webp':        'kolaravani.webp',
  'kolaravani.png':         'kolaravani.webp',
  'Kolaravani':             'kolaravani.webp',

  'prajapragathi':          'prajapragathi.webp',
  'prajapragathi.webp':     'prajapragathi.webp',
  'prajapragathi.png':      'prajapragathi.webp',
  'Prajapragathi':          'prajapragathi.webp',

  'prajavani':              'prajavani.webp',
  'prajavani.png':          'prajavani.webp',
  'prajavani.webp':         'prajavani.webp',
  'Prajavani':              'prajavani.webp',

  'pravasiprapancha':       'pravasiprapancha.webp',
  'pravasiprapancha.webp':  'pravasiprapancha.webp',
  'pravasiprapancha.png':   'pravasiprapancha.webp',
  'pravasi prapancha':      'pravasiprapancha.webp',
  'Pravasi Prapancha':      'pravasiprapancha.webp',
  'pravasi_prapancha':      'pravasiprapancha.webp',

  'udayavani':              'udayavani.webp',
  'udayavani.webp':         'udayavani.webp',
  'udayavani.png':          'udayavani.webp',
  'Udayavani':              'udayavani.webp',

  'vijaykarnataka':         'vijaykarnataka.webp',
  'vijaykarnataka.webp':    'vijaykarnataka.webp',
  'vijaykarnataka.png':     'vijaykarnataka.webp',
  'vijay karnataka':        'vijaykarnataka.webp',
  'Vijay Karnataka':        'vijaykarnataka.webp',
  'vijay_karnataka':        'vijaykarnataka.webp',

  'vishwavaaradhi':         'vishwavaaradhi.webp',
  'vishwavaaradhi.webp':    'vishwavaaradhi.webp',
  'vishwavaaradhi.png':     'vishwavaaradhi.webp',
  'vishwa vaaridhi':        'vishwavaaradhi.webp',
  'Vishwa Vaaridhi':        'vishwavaaradhi.webp',
  'vishwa_vaaridhi':        'vishwavaaradhi.webp',
  'vishwavaridhi':          'vishwavaaradhi.webp',

  'vishwavani':             'vishwavani.webp',
  'vishwavani.webp':        'vishwavani.webp',
  'vishwavani.png':         'vishwavani.webp',
  'Vishwavani':             'vishwavani.webp',
  
  'vidyarthimitra':         'vidyarthimitra.webp',
  'vidyarthimitra.webp':    'vidyarthimitra.webp',
  'vidyarthi mitra':        'vidyarthimitra.webp',
  'Vidyarthi Mitra':        'vidyarthimitra.webp',

  'samyuktha':              'samyuktha.webp',
  'samyuktha.webp':         'samyuktha.webp',
  'samyuktha karnataka':    'samyuktha.webp',
  'Samyuktha Karnataka':    'samyuktha.webp',

  // ── English ──
  'theHindu':               'hindu.webp',
  'the_hindu':              'hindu.webp',
  'the_hindu.png':          'hindu.webp',
  'the_hindu.webp':         'hindu.webp',
  'hindu':                  'hindu.webp',
  'HINDU':                  'hindu.webp',
  'Hindu':                  'hindu.webp',
  'hindu.webp':             'hindu.webp',

  'timesOfIndia':           'timesofindia.webp',
  'times_of_india':         'timesofindia.webp',
  'times_of_india.png':     'timesofindia.webp',
  'times_of_india.webp':    'timesofindia.webp',
  'timesofindia':           'timesofindia.webp',
  'timesofindia.webp':      'timesofindia.webp',
  'Times of India':         'timesofindia.webp',
  'times':                  'timesofindia.webp',
  'toi':                    'timesofindia.webp',

  'economictimes':          'economictimes.webp',
  'economictimes.webp':     'economictimes.webp',
  'economictimes.png':      'economictimes.webp',
  'Economic Times':         'economictimes.webp',
  'economic_times':         'economictimes.webp',
  'et':                     'economictimes.webp',

  'deccanherald':           'deccanherald.webp',
  'deccanherald.webp':      'deccanherald.webp',
  'deccanherald.png':       'deccanherald.webp',
  'Deccan Herald':          'deccanherald.webp',
  'deccan_herald':          'deccanherald.webp',

  'bangloremirror':         'bangloremirror.webp',
  'bangloremirror.webp':    'bangloremirror.webp',
  'bangloremirror.png':     'bangloremirror.webp',
  'Bangalore Mirror':       'bangloremirror.webp',
  'bangalore_mirror':       'bangloremirror.webp',

  'indianexpress':          'indianexpress.webp',
  'indianexpress.webp':     'indianexpress.webp',
  'indianexpress.png':      'indianexpress.webp',
  'Indian Express':         'indianexpress.webp',
  'indian_express':         'indianexpress.webp',
  'The Indian Express':     'indianexpress.webp',
  
  'wealth':                 'wealth.webp',
  'wealth.webp':            'wealth.webp',
  'Wealth':                 'wealth.webp',

  // ── Telugu ──
  'sakshi':                 'sakshi.webp',
  'sakshi.webp':            'sakshi.webp',
  'sakshi.png':             'sakshi.webp',
  'Sakshi':                 'sakshi.webp',

  'andrajyothy':            'andrajyothy.webp',
  'andrajyothy.webp':       'andrajyothy.webp',
  'andrajyothy.png':        'andrajyothy.webp',
  'Andra Jyothi':           'andrajyothy.webp',
  'andra_jyothi':           'andrajyothy.webp',
  'andhra jyothy':          'andrajyothy.webp',
  'Andhra Jyothi':          'andrajyothy.webp',

  'eenadu':                 'eenadu.webp',
  'eenadu.webp':            'eenadu.webp',
  'eenadu.png':             'eenadu.webp',
  'Eenadu':                 'eenadu.webp',

  // ── Tamil ──
  'dinakar':                'dinakar.webp',
  'dinakar.webp':           'dinakar.webp',
  'dinakar.png':            'dinakar.webp',
  'Dinakaran':              'dinakar.webp',
  'dinakaran':              'dinakar.webp',
  'dinakaran.webp':         'dinakar.webp',

  'dinamalar':              'dinamalar.webp',
  'dinamalar.webp':         'dinamalar.webp',
  'dinamalar.png':          'dinamalar.webp',
  'Dinamalar':              'dinamalar.webp',

  'thanti':                 'thanti.webp',
  'thanti.webp':            'thanti.webp',
  'thanti.png':             'thanti.webp',
  'Thanthi':                'thanti.webp',
  'thanthi':                'thanti.webp',
  'thanthi.webp':           'thanti.webp',
  'Thanthi (Daily)':        'thanti.webp',
  'daily thanthi':          'thanti.webp',
  'Daily Thanthi':          'thanti.webp',

  // ── Hindi ──
  'rajasthanpatrika':       'rajasthanpatrika.webp',
  'rajasthanpatrika.webp':  'rajasthanpatrika.webp',
  'rajasthanpatrika.png':   'rajasthanpatrika.webp',
  'Rajasthan Patrika':      'rajasthanpatrika.webp',
  'rajasthan_patrika':      'rajasthanpatrika.webp',

  // ── Kannada Magazines ──
  'karmaveera':             'karmaveera.webp',
  'karmaveera.webp':        'karmaveera.webp',
  'karmaveera.png':         'karmaveera.webp',
  'Karmaveera':             'karmaveera.webp',

  'taranga':                'taranga.webp',
  'taranga.webp':           'taranga.webp',
  'taranga.png':            'taranga.webp',
  'Taranga':                'taranga.webp',

  'sudha':                  'sudha.webp',
  'sudha.webp':             'sudha.webp',
  'sudha.png':              'sudha.webp',
  'Sudha':                  'sudha.webp',

  'kasturi':                'kasturi.webp',
  'kasturi.webp':           'kasturi.webp',
  'kasturi.png':            'kasturi.webp',
  'Kasturi':                'kasturi.webp',

  'mayura':                 'mayura.png',
  'mayura.png':             'mayura.png',
  'mayura.webp':            'mayura.png',
  'Mayura':                 'mayura.png',

  'priyanka':               'priyanka.webp',
  'priyanka.webp':          'priyanka.webp',
  'priyanka.png':           'priyanka.webp',
  'Priyanka':               'priyanka.webp',

  'gruhashobha':            'gruhashobha.webp',
  'gruhashobha.webp':       'gruhashobha.webp',
  'gruhashobha.png':        'gruhashobha.webp',
  'Gruhasobha':             'gruhashobha.webp',

  'frontline':              'frontline.webp',
  'frontline.webp':         'frontline.webp',
  'frontline.png':          'frontline.webp',
  'Frontline':              'frontline.webp',

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
  if (!image || image.trim().length === 0) return null;

  if (typeof image === 'string' &&
      (/^(https?:|file:|content:|assets-library:|data:)/i.test(image) ||
       image.startsWith('/') ||
       image.startsWith('content://') ||
       image.startsWith('file://') ||
       image.startsWith('data:'))) {
    return { uri: image };
  }

  if (IMAGES[image] != null) return IMAGES[image];

  const viaAlias = LEGACY_ALIAS_TO_CANONICAL[image];
  if (viaAlias != null && IMAGES[viaAlias] != null) return IMAGES[viaAlias];

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

  return null;
}
