// Jedan izvor istine za adresu, imena i FAQ (koristi se i u prikazu i u JSON-LD).
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://unitcent.com";
export const SITE_NAME = "UnitCent";
export const CONTACT_EMAIL = "podrska@unitcent.com";

// Ponuda uz prijavu na listu čekanja. Mijenjati samo uz odluku o stvarnoj ponudi:
// ovo je javno obećanje. Zasad namjerno bez konkretnog iznosa i roka.
export const WAITLIST_OFFER = "Prijavi se i dobit ćeš posebnu ponudu pri lansiranju, prije svih ostalih.";

export const FAQ: { q: string; a: string }[] = [
  {
    q: "Što je UnitCent?",
    a: "UnitCent je hrvatska mobilna aplikacija za praćenje troškova. Trošak unosiš za 3 sekunde, pretplate se knjiže same, a početni ekran svaki dan pokazuje koliko još smiješ potrošiti.",
  },
  {
    q: "Kako radi dnevni limit?",
    a: "Od primanja oduzmeš obavezne troškove i željenu štednju. Ostatak se podijeli s brojem dana do kraja mjeseca. Rezultat je iznos koji danas smiješ potrošiti, a preračuna se sa svakim unosom.",
  },
  {
    q: "Kako AI skeniranje čita račune?",
    a: "Slikaš račun, a AI pročita stavke i razvrsta ih po kategorijama. Ukupni iznos i datum čitaju se iz QR koda fiskalnog računa, pa su pouzdani. Ti pregledaš prijedlog i jednim dodirom ispraviš što treba, a aplikacija pamti tvoje ispravke.",
  },
  {
    q: "Je li UnitCent besplatan?",
    a: "Osnovno praćenje troškova je besplatno bez ograničenja: unos, pretplate, dnevni limit i pregled. Premium otključava neograničeno AI skeniranje računa i dodatne funkcije. Točne cijene objavit ćemo uz lansiranje.",
  },
  {
    q: "Radi li bez interneta?",
    a: "Da. Unos je trenutan i sprema se na mobitel, a sinkronizacija se odvija u pozadini kad si na mreži.",
  },
  {
    q: "Jesu li moji podaci sigurni?",
    a: "Tvoji financijski podaci ne prodaju se i ne dijele s oglašivačima. Aplikacija nema reklama. Račun i sve podatke možeš izbrisati u aplikaciji kad god želiš.",
  },
  {
    q: "Mogu li prenijeti svoj Excel troškovnik?",
    a: "Uvoz iz Excela planiran je kao dio Premiuma, tako da postojeći troškovnik ne moraš prepisivati.",
  },
  {
    q: "Za koje je uređaje UnitCent?",
    a: "Aplikacija se razvija za iPhone i Android. Trenutno je u izradi, a kad bude spremna za testiranje, objavit ćemo je ovdje.",
  },
];
