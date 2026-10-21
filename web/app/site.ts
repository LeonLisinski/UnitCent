// Jedan izvor istine za adresu, imena i FAQ (koristi se i u prikazu i u JSON-LD).
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://unitcent.com";
export const SITE_NAME = "UnitCent";
export const CONTACT_EMAIL = "support@unitcent.com";

// Ponuda uz prijavu na listu čekanja. Mijenjati samo uz odluku o stvarnoj ponudi:
// ovo je javno obećanje. Zasad namjerno bez konkretnog iznosa i roka.
export const WAITLIST_OFFER = "Prijavi se i dobij posebnu ponudu pri lansiranju.";

// Cjenik Premiuma (isti kao u aplikaciji, apps/mobile/src/premium.ts). Plaća se kroz App Store / Google Play.
export const PRICES = { monthly: "2,99 €", yearly: "19,99 €", yearlyPerMonth: "1,67 €" } as const;

/**
 * Sidrena cijena (Odluka NN 101/26, od 1. 10. 2026. i za pružatelje usluga): cijena na dan 10. 9. 2026., istaknuta uz
 * trenutnu. Premium se tada još nije prodavao, pa sidrene cijene nema (null). Ako je knjigovođa/pravnik drukčije
 * protumači ili se cijena promijeni nakon lansiranja, ovdje upisati npr. { date: "10. 9. 2026.", monthly: "2,99 €", yearly: "19,99 €" }.
 */
export const PRICE_ANCHOR: { date: string; monthly: string; yearly: string } | null = null;

export const FAQ: { q: string; a: string }[] = [
  {
    q: "Jesu li moji podaci sigurni?",
    a: "Tvoji financijski podaci ne prodaju se i ne dijele s oglašivačima, a aplikacija nema reklama. Račun i sve podatke možeš izbrisati u aplikaciji kad god želiš.",
  },
  {
    q: "Radi li bez interneta?",
    a: "Da. Unos je trenutan i sprema se na mobitel, a sinkronizacija se odvija u pozadini kad si na mreži.",
  },
  {
    q: "Za koje je uređaje UnitCent?",
    a: "Za iPhone i Android. Aplikacija je u izradi, a čim bude spremna za testiranje, javit ćemo ti se e-mailom.",
  },
  {
    q: "Koliko košta?",
    a: "Osnovno praćenje troškova, pretplate i dnevni budžet su besplatni bez ograničenja. Premium košta 2,99 € mjesečno ili 19,99 € godišnje (1,67 € mjesečno) i otključava neograničeno AI skeniranje računa, uvide, budžete po kategoriji i cijelu povijest. Otkazuje se kad god želiš.",
  },
];
