/**
 * Članak na blogu. Tijelo (`body`) je jednostavan Markdown:
 * `## H2`, `### H3`, odlomci (prazan red između), `- ` popis, `1. ` numerirani popis,
 * `> ` istaknuti blok, tablice s `|`, te u tekstu **podebljano** i [poveznica](/blog/slug).
 */
export type Post = {
  slug: string;
  /** Naslov članka (H1 i <title>). */
  title: string;
  /** Meta opis, 140 do 160 znakova. */
  description: string;
  category: "Budžet" | "Štednja" | "Troškovi" | "Odnosi" | "Alati";
  /** ISO datum (YYYY-MM-DD). */
  published: string;
  updated?: string;
  /** „Ukratko“ na vrhu: 3 do 4 rečenice. */
  summary: string[];
  body: string;
  faq?: { q: string; a: string }[];
  /** Provjerljivi izvori (samo stvarni dokumenti). */
  sources?: { label: string; url: string }[];
  /** Slugovi povezanih članaka. */
  related?: string[];
};
