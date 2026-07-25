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
//         Examples:  'vijayavani.png'  'hindu.webp'  'sakshi.jpg'
//       → Then add ONE line in assets/images.ts:
//             'yourfile.png': require('./yourfile.png'),
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
   *   Examples: 'vijayavani.png' | 'hindu.webp' | 'sakshi.jpg'
   * Must match a key in assets/images.ts IMAGES object.
   */
  image: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 📰 THE ACTUAL CATALOG
// ─────────────────────────────────────────────────────────────────────────────
export const PAPERS_CATALOG: CatalogEntry[] = [
  // ─── KANNADA PAPERS ───
  { name: 'Vijayavani',          language: 'Kannada',  category: 'Paper', priceDay: 6, priceMonth: 180, rating: 4.6, image: 'hindu.webp'         },
  { name: 'Kannada Prabha',      language: 'Kannada',  category: 'Paper', priceDay: 7, priceMonth: 200, rating: 4.5, image: 'hindu.webp'     },
  { name: 'Prajavani',           language: 'Kannada',  category: 'Paper', priceDay: 7, priceMonth: 210, rating: 4.5, image: 'prajavani.png'      },
  { name: 'Vijay Karnataka',     language: 'Kannada',  category: 'Paper', priceDay: 6, priceMonth: 180, rating: 4.4, image: 'vijayavani.png'     },
  { name: 'Prathinidhi',         language: 'Kannada',  category: 'Paper', priceDay: 6, priceMonth: 180, rating: 4.4, image: 'vijayavani.png'     },
  { name: 'Kolaravani',          language: 'Kannada',  category: 'Paper', priceDay: 6, priceMonth: 180, rating: 4.4, image: 'vijayavani.png'     },
  { name: 'Prajapragathi',       language: 'Kannada',  category: 'Paper', priceDay: 6, priceMonth: 180, rating: 4.4, image: 'vijayavani.png'     },
  { name: 'Vishwavani',          language: 'Kannada',  category: 'Paper', priceDay: 6, priceMonth: 180, rating: 4.4, image: 'vijayavani.png'     },
  { name: 'Vidyarthi Mitra',     language: 'Kannada',  category: 'Paper', priceDay: 5, priceMonth: 150, rating: 4.3, image: 'prajavani.png'      },
  { name: 'Udayavani',           language: 'Kannada',  category: 'Paper', priceDay: 6, priceMonth: 180, rating: 4.4, image: 'vijayavani.png'     },
  { name: 'Vishwa Vaaridhi',     language: 'Kannada',  category: 'Paper', priceDay: 6, priceMonth: 180, rating: 4.4, image: 'vijayavani.png'     },
  { name: 'Pravasi Prapancha',   language: 'Kannada',  category: 'Paper', priceDay: 6, priceMonth: 180, rating: 4.4, image: 'vijayavani.png'     },
  { name: 'Samyuktha Karnataka', language: 'Kannada',  category: 'Paper', priceDay: 6, priceMonth: 170, rating: 4.3, image: 'vijayavani.png'     },

  // ─── ENGLISH PAPERS ───
  { name: 'The Hindu',           language: 'English',  category: 'Paper', priceDay: 10, priceMonth: 300, rating: 4.7, image: 'the_hindu.png'      },
  { name: 'Times of India',      language: 'English',  category: 'Paper', priceDay: 8,  priceMonth: 240, rating: 4.3, image: 'times_of_india.png' },
  { name: 'Economic Times',      language: 'English',  category: 'Paper', priceDay: 9,  priceMonth: 270, rating: 4.5, image: 'the_hindu.png'      },
  { name: 'Deccan Herald',       language: 'English',  category: 'Paper', priceDay: 8,  priceMonth: 240, rating: 4.4, image: 'times_of_india.png' },
  { name: 'Bangalore Mirror',    language: 'English',  category: 'Paper', priceDay: 5,  priceMonth: 150, rating: 4.2, image: 'times_of_india.png' },
  { name: 'Indian Express',      language: 'English',  category: 'Paper', priceDay: 8,  priceMonth: 240, rating: 4.4, image: 'the_hindu.png'      },
  { name: 'Wealth',              language: 'English',  category: 'Paper', priceDay: 10, priceMonth: 300, rating: 4.7, image: 'the_hindu.png'      },

  // ─── TELUGU PAPERS ───
  { name: 'Sakshi',              language: 'Telugu',   category: 'Paper', priceDay: 6, priceMonth: 180, rating: 4.4, image: 'vijayavani.png'     },
  { name: 'Andra Jyothi',        language: 'Telugu',   category: 'Paper', priceDay: 6, priceMonth: 180, rating: 4.4, image: 'vijayavani.png'     },
  { name: 'Eenadu',              language: 'Telugu',   category: 'Paper', priceDay: 6, priceMonth: 180, rating: 4.5, image: 'prajavani.png'      },

  // ─── TAMIL PAPERS ───
  { name: 'Dinakaran',           language: 'Tamil',    category: 'Paper', priceDay: 6, priceMonth: 170, rating: 4.4, image: 'vijayavani.png'     },
  { name: 'Dinamalar',           language: 'Tamil',    category: 'Paper', priceDay: 6, priceMonth: 160, rating: 4.4, image: 'vijayavani.png'     },
  { name: 'Thanthi (Daily)',     language: 'Tamil',    category: 'Paper', priceDay: 6, priceMonth: 170, rating: 4.5, image: 'prajavani.png'      },

  // ─── MALAYALAM PAPERS ───
  { name: 'Malayala Manorama (Malabar)',  language: 'Malayalam', category: 'Paper', priceDay: 7, priceMonth: 200, rating: 4.5, image: 'prajavani.png'  },
  { name: 'Malayala Manorama (Kottayam)', language: 'Malayalam', category: 'Paper', priceDay: 7, priceMonth: 200, rating: 4.5, image: 'vijayavani.png' },

  // ─── HINDI PAPERS ───
  { name: 'Rajasthan Patrika',   language: 'Hindi',    category: 'Paper', priceDay: 5, priceMonth: 150, rating: 4.2, image: 'prajavani.png'      },

  // ─── KANNADA MAGAZINES ───
  { name: 'Kasturi',             language: 'Kannada',  category: 'Magazine', priceDay: 0, priceMonth: 40, rating: 4.5, image: 'vijayavani.png' },
  { name: 'Karmaveera',          language: 'Kannada',  category: 'Magazine', priceDay: 0, priceMonth: 50, rating: 4.6, image: 'vijayavani.png' },
  { name: 'Taranga',             language: 'Kannada',  category: 'Magazine', priceDay: 0, priceMonth: 60, rating: 4.5, image: 'prajavani.png'  },
  { name: 'Sudha',               language: 'Kannada',  category: 'Magazine', priceDay: 0, priceMonth: 50, rating: 4.4, image: 'prajavani.png'  },
  { name: 'Mayura',              language: 'Kannada',  category: 'Magazine', priceDay: 0, priceMonth: 60, rating: 4.5, image: 'vijayavani.png' },
  { name: 'Gruhasobha',          language: 'Kannada',  category: 'Magazine', priceDay: 0, priceMonth: 70, rating: 4.3, image: 'vijayavani.png' },
  { name: 'Priyanka',            language: 'Kannada',  category: 'Magazine', priceDay: 0, priceMonth: 45, rating: 4.3, image: 'prajavani.png'  },

  // ─── ENGLISH MAGAZINES ───
  { name: 'Frontline',           language: 'English',  category: 'Magazine', priceDay: 0, priceMonth: 80,  rating: 4.6, image: 'the_hindu.png'      },
  { name: 'Sportstar',           language: 'English',  category: 'Magazine', priceDay: 0, priceMonth: 60,  rating: 4.5, image: 'times_of_india.png' },
  { name: 'India Today',         language: 'English',  category: 'Magazine', priceDay: 0, priceMonth: 90,  rating: 4.6, image: 'the_hindu.png'      },
  { name: "Reader's Digest",     language: 'English',  category: 'Magazine', priceDay: 0, priceMonth: 100, rating: 4.5, image: 'times_of_india.png' },
  { name: 'The Week',            language: 'English',  category: 'Magazine', priceDay: 0, priceMonth: 80,  rating: 4.4, image: 'the_hindu.png'      },

  // ─── TAMIL MAGAZINES ───
  { name: 'Thuglak',             language: 'Tamil',    category: 'Magazine', priceDay: 0, priceMonth: 40, rating: 4.6, image: 'prajavani.png'  },

  // ─── MALAYALAM MAGAZINES ───
  { name: 'Malayalam Book',      language: 'Malayalam', category: 'Magazine', priceDay: 0, priceMonth: 60, rating: 4.3, image: 'vijayavani.png' },
];

// Stable numeric IDs (same for Firestore seed AND local fallback).
// Edit order above — IDs auto-regenerate from the position.
export const PAPERS_CATALOG_WITH_IDS: Array<CatalogEntry & { stableId: string }> =
  PAPERS_CATALOG.map((e, i) => ({ ...e, stableId: String(i + 1) }));

// ═══════════════════════════════════════════════════════════════════════════════
// END OF EDITABLE CATALOG. Don't edit below.
// ═══════════════════════════════════════════════════════════════════════════════
