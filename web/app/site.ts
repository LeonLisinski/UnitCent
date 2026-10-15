// Jedan izvor istine za adresu, imena i FAQ (koristi se i u prikazu i u JSON-LD).
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://unitcent.com";
export const SITE_NAME = "UnitCent";
export const CONTACT_EMAIL = "podrska@unitcent.com";

// Ponuda uz prijavu na listu čekanja. Mijenjati samo uz odluku o stvarnoj ponudi:
// ovo je javno obećanje. Zasad namjerno bez konkretnog iznosa i roka.
export const WAITLIST_OFFER = "Prijavi se i dobij posebnu ponudu pri lansiranju.";

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
    a: "Osnovno praćenje troškova, pretplate i dnevni limit su besplatni bez ograničenja. Premium otključava neograničeno AI skeniranje računa i dodatne funkcije. Cijene objavljujemo uz lansiranje.",
  },
];
