// ═══════════════════════════════════════════════════════════════════════════════
// database/papers_catalog.ts
// ═══════════════════════════════════════════════════════════════════════════════
// 🔴 SINGLE SOURCE OF TRUTH — THE ONLY FILE YOU NEED TO EDIT FOR PAPER CHANGES.
//
//   • To rename a paper (e.g. "The Hindu" → "The Hindu Daily")
//       → change the `name` field below. Done.
//
//   • To change a paper's price, language, category (Paper/Magazine), rating
//       → change the field below. Done.
//
//   • To change/swap the image for a paper:
//       → change `image` below to the EXACT FILENAME in assets/ folder.
//         Examples:  'vijayavani.webp'  'hindu.webp'  'sakshi.jpg'
//       → Then add ONE line in assets/images.ts:
//             'yourfile.webp': require('./yourfile.webp'),
//         (Key and filename are identical — no tricks, no aliases.)
//
//       ⚠️ That's it. Change extension (png ↔ webp) in BOTH places, 1 line each.
//          No other file needs edits for image format/name changes.
//
//   • To add a NEW paper/magazine:
//       → Add one entry below. Add one asset require() in assets/images.ts. Done.
//
// EVERYTHING ELSE (Firestore seed, store fallback, all UI screens) reads FROM HERE.
// ═══════════════════════════════════════════════════════════════════════════════

export type CatalogCategory = 'Paper' | 'Magazine';

export interface CatalogEntry {
  name: string;
  language: string;
  category: CatalogCategory;
  /** 0 = only monthly plan available (e.g. monthly magazines) */
  priceDay: number;
  priceMonth: number;
  /** star rating display (1.0 – 5.0) */
  rating: number;
  /**
   * Exact filename in /assets folder — with extension.
   *   Examples: 'vijayavani.webp' | 'hindu.webp' | 'sakshi.jpg'
   * Must match a key in assets/images.ts IMAGES object.
   */
  image: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 📰 THE ACTUAL CATALOG
// ─────────────────────────────────────────────────────────────────────────────
export const PAPERS_CATALOG: CatalogEntry[] = [
  // ─── KANNADA PAPERS ───
  { name: 'Vijayavani',          language: 'Kannada',  category: 'Paper', priceDay: 6, priceMonth: 180, rating: 4.6, image: 'vijayavani.webp'       },
  { name: 'Kannada Prabha',      language: 'Kannada',  category: 'Paper', priceDay: 7, priceMonth: 200, rating: 4.5, image: 'kannadaprabha.webp'     },
  { name: 'Prajavani',           language: 'Kannada',  category: 'Paper', priceDay: 7, priceMonth: 210, rating: 4.5, image: 'prajavani.webp'        },
  { name: 'Vijay Karnataka',     language: 'Kannada',  category: 'Paper', priceDay: 6, priceMonth: 180, rating: 4.4, image: 'vijaykarnataka.webp'   },
  { name: 'Prathinidhi',         language: 'Kannada',  category: 'Paper', priceDay: 6, priceMonth: 180, rating: 4.4, image: 'prathinidhi.webp'      },
  { name: 'Kolaravani',          language: 'Kannada',  category: 'Paper', priceDay: 6, priceMonth: 180, rating: 4.4, image: 'kolaravani.webp'       },
  { name: 'Prajapragathi',       language: 'Kannada',  category: 'Paper', priceDay: 6, priceMonth: 180, rating: 4.4, image: 'prajapragathi.webp'    },
  { name: 'Vishwavani',          language: 'Kannada',  category: 'Paper', priceDay: 6, priceMonth: 180, rating: 4.4, image: 'vishwavani.webp'       },
  { name: 'Vidyarthi Mitra',     language: 'Kannada',  category: 'Paper', priceDay: 5, priceMonth: 150, rating: 4.3, image: 'vidyarthimitra.webp'   },
  { name: 'Udayavani',           language: 'Kannada',  category: 'Paper', priceDay: 6, priceMonth: 180, rating: 4.4, image: 'udayavani.webp'        },
  { name: 'Vishwa Vaaridhi',     language: 'Kannada',  category: 'Paper', priceDay: 6, priceMonth: 180, rating: 4.4, image: 'vishwavaaradhi.webp'    },
  { name: 'Pravasi Prapancha',   language: 'Kannada',  category: 'Paper', priceDay: 6, priceMonth: 180, rating: 4.4, image: 'pravasiprapancha.webp'  },
  { name: 'Samyuktha Karnataka', language: 'Kannada',  category: 'Paper', priceDay: 6, priceMonth: 170, rating: 4.3, image: 'samyuktha.webp'        },

  // ─── ENGLISH PAPERS ───
  { name: 'The Hindu',           language: 'English',  category: 'Paper', priceDay: 10, priceMonth: 300, rating: 4.7, image: 'hindu.webp'          },
  { name: 'Times of India',      language: 'English',  category: 'Paper', priceDay: 8,  priceMonth: 240, rating: 4.3, image: 'timesofindia.webp'    },
  { name: 'Economic Times',      language: 'English',  category: 'Paper', priceDay: 9,  priceMonth: 270, rating: 4.5, image: 'economictimes.webp'  },
  { name: 'Deccan Herald',       language: 'English',  category: 'Paper', priceDay: 8,  priceMonth: 240, rating: 4.4, image: 'deccanherald.webp'   },
  { name: 'Bangalore Mirror',    language: 'English',  category: 'Paper', priceDay: 5,  priceMonth: 150, rating: 4.2, image: 'bangloremirror.webp' },
  { name: 'Indian Express',      language: 'English',  category: 'Paper', priceDay: 8,  priceMonth: 240, rating: 4.4, image: 'indianexpress.webp'  },
  { name: 'Wealth',              language: 'English',  category: 'Paper', priceDay: 10, priceMonth: 300, rating: 4.7, image: 'wealth.webp'          },

  // ─── TELUGU PAPERS ───
  { name: 'Sakshi',              language: 'Telugu',   category: 'Paper', priceDay: 6, priceMonth: 180, rating: 4.4, image: 'sakshi.webp'        },
  { name: 'Andra Jyothi',        language: 'Telugu',   category: 'Paper', priceDay: 6, priceMonth: 180, rating: 4.4, image: 'andrajyothy.webp'    },
  { name: 'Eenadu',              language: 'Telugu',   category: 'Paper', priceDay: 6, priceMonth: 180, rating: 4.5, image: 'eenadu.webp'        },

  // ─── TAMIL PAPERS ───
  { name: 'Dinakaran',           language: 'Tamil',    category: 'Paper', priceDay: 6, priceMonth: 170, rating: 4.4, image: 'dinakar.webp'       },
  { name: 'Dinamalar',           language: 'Tamil',    category: 'Paper', priceDay: 6, priceMonth: 160, rating: 4.4, image: 'dinamalar.webp'     },
  { name: 'Thanthi (Daily)',     language: 'Tamil',    category: 'Paper', priceDay: 6, priceMonth: 170, rating: 4.5, image: 'thanti.webp'        },

  // ─── MALAYALAM PAPERS ───
  { name: 'Malayala Manorama (Malabar)',  language: 'Malayalam', category: 'Paper', priceDay: 7, priceMonth: 200, rating: 4.5, image: 'prajavani.webp'  },
  { name: 'Malayala Manorama (Kottayam)', language: 'Malayalam', category: 'Paper', priceDay: 7, priceMonth: 200, rating: 4.5, image: 'vijayavani.webp' },

  // ─── HINDI PAPERS ───
  { name: 'Rajasthan Patrika',   language: 'Hindi',    category: 'Paper', priceDay: 5, priceMonth: 150, rating: 4.2, image: 'rajasthanpatrika.webp' },

  // ─── KANNADA MAGAZINES ───
  { name: 'Kasturi',             language: 'Kannada',  category: 'Magazine', priceDay: 0, priceMonth: 40, rating: 4.5, image: 'kasturi.webp'     },
  { name: 'Karmaveera',          language: 'Kannada',  category: 'Magazine', priceDay: 0, priceMonth: 50, rating: 4.6, image: 'karmaveera.webp' },
  { name: 'Taranga',             language: 'Kannada',  category: 'Magazine', priceDay: 0, priceMonth: 60, rating: 4.5, image: 'taranga.webp'     },
  { name: 'Sudha',               language: 'Kannada',  category: 'Magazine', priceDay: 0, priceMonth: 50, rating: 4.4, image: 'sudha.webp'        },
  { name: 'Mayura',              language: 'Kannada',  category: 'Magazine', priceDay: 0, priceMonth: 60, rating: 4.5, image: 'mayura.png'       },
  { name: 'Gruhasobha',          language: 'Kannada',  category: 'Magazine', priceDay: 0, priceMonth: 70, rating: 4.3, image: 'gruhashobha.webp' },
  { name: 'Priyanka',            language: 'Kannada',  category: 'Magazine', priceDay: 0, priceMonth: 45, rating: 4.3, image: 'priyanka.webp'     },

  // ─── ENGLISH MAGAZINES ───
  { name: 'Frontline',           language: 'English',  category: 'Magazine', priceDay: 0, priceMonth: 80,  rating: 4.6, image: 'frontline.webp'      },
  { name: 'Sportstar',           language: 'English',  category: 'Magazine', priceDay: 0, priceMonth: 60,  rating: 4.5, image: 'sportsstar.webp'     },
  { name: 'India Today',         language: 'English',  category: 'Magazine', priceDay: 0, priceMonth: 90,  rating: 4.6, image: 'indiatoday.webp'     },
  { name: "Reader's Digest",     language: 'English',  category: 'Magazine', priceDay: 0, priceMonth: 100, rating: 4.5, image: 'readersdigest.webp'  },
  { name: 'The Week',            language: 'English',  category: 'Magazine', priceDay: 0, priceMonth: 80,  rating: 4.4, image: 'theweak.webp'       },

  // ─── TAMIL MAGAZINES ───
  { name: 'Thuglak',             language: 'Tamil',    category: 'Magazine', priceDay: 0, priceMonth: 40, rating: 4.6, image: 'thuglak.png'     },

  // ─── MALAYALAM MAGAZINES ───
  { name: 'Malayalam Book',      language: 'Malayalam', category: 'Magazine', priceDay: 0, priceMonth: 60, rating: 4.3, image: 'vijayavani.webp' },
];

// Stable numeric IDs (same for Firestore seed AND local fallback).
// Edit order above — IDs auto-regenerate from the position.
export const PAPERS_CATALOG_WITH_IDS: Array<CatalogEntry & { stableId: string }> =
  PAPERS_CATALOG.map((e, i) => ({ ...e, stableId: String(i + 1) }));

// ═══════════════════════════════════════════════════════════════════════════════
// END OF EDITABLE CATALOG. Don't edit below.
// ═══════════════════════════════════════════════════════════════════════════════
