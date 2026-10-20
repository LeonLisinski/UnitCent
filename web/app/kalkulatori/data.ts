// Kalkulatori: jedan izvor za stranice, popis, sitemap i llms.txt. Svaki ima svoju stranicu (Google vidi sadržaj),
// jedan veliki rezultat i kratko objašnjenje kako se računa.

export type CalcSlug = "dnevni-budzet" | "pretplate" | "fond-za-hitne" | "cilj-stednje" | "sitni-troskovi";

export interface CalcInfo {
  slug: CalcSlug;
  /** Kratki naziv (popis, kartica u članku). */
  name: string;
  /** H1 i <title>: pitanje kako ga ljudi pretražuju. */
  title: string;
  /** Meta opis, 140 do 160 znakova. */
  description: string;
  icon: string;
  /** Jedna rečenica ispod naslova. */
  lead: string;
  /** „Kako računamo“: kratko i točno. */
  how: string[];
  faq: { q: string; a: string }[];
  /** Slugovi povezanih članaka. */
  related: string[];
}

export const CALCULATORS: CalcInfo[] = [
  {
    slug: "dnevni-budzet",
    name: "Dnevni budžet",
    title: "Koliko dnevno smijem potrošiti? Kalkulator dnevnog budžeta",
    description: "Upiši primanja, fiksne troškove i štednju pa odmah vidi koliko danas smiješ potrošiti do kraja mjeseca. Besplatno, bez prijave i bez spremanja podataka.",
    icon: "target",
    lead: "Primanja minus fiksni troškovi i štednja, podijeljeno s danima koji su ostali.",
    how: [
      "Za trošenje = primanja − fiksni troškovi (najam, režije, pretplate) − štednja.",
      "Dnevni budžet = (za trošenje − ono što si ovaj mjesec već potrošio) ÷ preostali dani, uključujući danas.",
      "Ako jedan dan potrošiš manje, ostatak se raspodijeli na sljedeće dane. Ako potrošiš više, sutrašnji iznos se smanji.",
    ],
    faq: [
      { q: "Zašto se danas računa kao preostali dan?", a: "Jer i danas još možeš trošiti. Zato se iznos dijeli s brojem dana uključujući današnji." },
      { q: "Ulaze li pretplate u dnevni budžet?", a: "Ne izravno. Pretplate i ostali fiksni troškovi oduzimaju se odmah na početku, pa dnevni budžet pokazuje samo ono što smiješ slobodno potrošiti." },
      { q: "Spremaju li se moji podaci?", a: "Ne. Kalkulator radi samo u tvom pregledniku i ništa ne šalje." },
    ],
    related: ["koliko-dnevno-smijem-potrositi", "kako-napraviti-mjesecni-budzet", "pravilo-50-30-20"],
  },
  {
    slug: "pretplate",
    name: "Pretplate godišnje",
    title: "Koliko me godišnje koštaju pretplate? Kalkulator pretplata",
    description: "Upiši svoje pretplate i vidi koliko te koštaju mjesečno, godišnje i kroz pet godina. Streaming, glazba, mobitel, teretana i ostalo na jednom mjestu.",
    icon: "repeat",
    lead: "Mali mjesečni iznosi brzo narastu. Upiši pretplate i vidi godišnji zbroj.",
    how: [
      "Godišnje = zbroj mjesečnih pretplata × 12.",
      "Pet godina = godišnji zbroj × 5 (bez poskupljenja, koja se u praksi događaju).",
    ],
    faq: [
      { q: "Što se ubraja u pretplate?", a: "Sve što se plaća svaki mjesec automatski: streaming, glazba, oblak, mobitel, internet, teretana, aplikacije. Godišnje pretplate podijeli s 12." },
      { q: "Kako najlakše smanjiti pretplate?", a: "Jednom mjesečno prođi popis i otkaži ono što nisi koristio zadnjih 30 dana. Uslugu možeš ponovno uključiti kad ti zatreba." },
    ],
    related: ["pretplate-koje-zaboravimo", "godisnji-troskovi", "kategorije-troskova"],
  },
  {
    slug: "fond-za-hitne",
    name: "Fond za hitne slučajeve",
    title: "Koliko mi treba za fond za hitne slučajeve? Kalkulator",
    description: "Izračunaj koliko novca trebaš imati sa strane za hitne slučajeve i za koliko mjeseci ćeš ga skupiti uz tvoju mjesečnu štednju. Brzo, besplatno i bez prijave.",
    icon: "shield",
    lead: "Rezerva za neočekivano: kvar auta, zubar, gubitak posla.",
    how: [
      "Cilj = nužni mjesečni troškovi × broj mjeseci (uobičajeno 3 do 6).",
      "Nedostaje = cilj − ono što već imaš.",
      "Mjeseci do cilja = nedostaje ÷ mjesečna štednja, zaokruženo na cijeli mjesec naviše.",
    ],
    faq: [
      { q: "Tri ili šest mjeseci?", a: "Tri mjeseca je dobar početak. Šest ima smisla ako imaš neredovita primanja, uzdržavaš obitelj ili ti je posao manje siguran." },
      { q: "Gdje držati fond?", a: "Odvojeno od tekućeg računa, ali dostupno u nekoliko dana: na štednom računu ili oročenju koje se može razročiti." },
    ],
    related: ["fond-za-hitne-slucajeve", "kako-poceti-stedjeti", "budzet-neredovita-primanja"],
  },
  {
    slug: "cilj-stednje",
    name: "Cilj štednje",
    title: "Kad ću uštedjeti za svoj cilj? Kalkulator štednje",
    description: "Upiši koliko želiš uštedjeti, koliko već imaš i koliko odvajaš mjesečno. Kalkulator pokaže za koliko mjeseci i do kojeg datuma ćeš skupiti iznos.",
    icon: "target",
    lead: "Godišnji odmor, auto, laptop: koliko ti mjeseci treba?",
    how: [
      "Nedostaje = cilj − ono što već imaš.",
      "Mjeseci = nedostaje ÷ mjesečna štednja, zaokruženo naviše; datum je toliko mjeseci od danas.",
      "Kamate se ne računaju, pa je stvarni rezultat malo bolji ako novac stoji na štednji.",
    ],
    faq: [
      { q: "Koliko mjesečno trebam štedjeti da stignem do datuma?", a: "Podijeli iznos koji nedostaje s brojem mjeseci do datuma. Promijeni mjesečni iznos u kalkulatoru dok datum ne bude onaj koji želiš." },
      { q: "Što ako neki mjesec ne uspijem odvojiti?", a: "Ništa strašno. Cilj se pomakne za mjesec. Važnije je odvajati redovito, makar i manji iznos." },
    ],
    related: ["kako-poceti-stedjeti", "godisnji-troskovi", "pravilo-50-30-20"],
  },
  {
    slug: "sitni-troskovi",
    name: "Sitni trošak",
    title: "Koliko godišnje košta kava ili drugi sitni trošak? Kalkulator",
    description: "Kava, grickalice, dostava: upiši koliko košta i koliko puta tjedno, pa vidi koliko to izađe mjesečno, godišnje i kroz deset godina. Bez osude, samo brojke.",
    icon: "cup",
    lead: "Bez osude, samo brojke: koliko izađe nešto sitno kroz godinu.",
    how: [
      "Godišnje = cijena × puta tjedno × 52 tjedna.",
      "Mjesečno = godišnje ÷ 12; deset godina = godišnje × 10 (bez poskupljenja).",
    ],
    faq: [
      { q: "Znači li to da ne smijem piti kavu vani?", a: "Ne. Smisao nije odricanje, nego da znaš koliko nešto košta. Onda sam odlučiš je li ti vrijedno." },
      { q: "Kako najlakše smanjiti sitne troškove?", a: "Odluči unaprijed koliko tjedno želiš potrošiti na sitnice i prati to. Kad imaš granicu, lakše je reći ne kad nije vrijedno." },
    ],
    related: ["impulzivna-kupnja", "kako-pratiti-troskove", "kako-smanjiti-troskove-hrane"],
  },
];

export const getCalc = (slug: string) => CALCULATORS.find((c) => c.slug === slug);
