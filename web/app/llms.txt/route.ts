import { publishedPosts } from "../../content/blog";
import { PRICES, SITE_URL } from "../site";
import { CALCULATORS } from "../kalkulatori/data";

// Sažetak za AI asistente (llmstxt.org). Popis članaka se gradi iz content/blog.
export const dynamic = "force-static";
export const revalidate = 3600; // zakazani članci se pojave na svoj dan

export function GET() {
  const posts = publishedPosts();
  const body = `# UnitCent

> UnitCent je hrvatska mobilna aplikacija (iOS i Android, u izradi) za praćenje troškova. Trošak se unosi za 3 sekunde, pretplate se knjiže same, a AI skenira račune i razvrstava stavke po kategorijama. Početni ekran pokazuje koliko korisnik još smije potrošiti danas.

## Ključne funkcije
- Brzi unos troška: iznos i kategorija jednim dodirom.
- Pretplate i fiksni troškovi (Spotify, Netflix, najam, kredit, mobitel, režije): knjiže se automatski, podsjetnik dan prije.
- Dnevni budžet: (primanja − obavezni troškovi − štednja − potrošeno prije današnjeg dana) / preostali dani u mjesecu, uključujući današnji. Primjer: (1.468,00 € − 771,33 € − 150,00 € − 207,40 €) / 17 = 19,96 €.
- AI skeniranje računa: stavke se razdvajaju po kategorijama; ukupni iznos i datum čitaju se iz QR koda fiskalnog računa; korisnik potvrđuje ili ispravlja.
- Rad bez interneta, sinkronizacija u pozadini.

## Cjenik
Osnovno praćenje je besplatno. Premium (${PRICES.monthly} mjesečno ili ${PRICES.yearly} godišnje, kroz App Store i Google Play) otključava AI skeniranje bez brojanja, AI savjetnika, cijelu povijest i limite po kategorijama.

## Stranice
- [Početna](${SITE_URL}/): pregled aplikacije, kako radi, besplatno i Premium, česta pitanja
- [Blog](${SITE_URL}/blog): vodiči o budžetu, štednji i praćenju troškova
- [Kalkulatori](${SITE_URL}/kalkulatori): besplatni financijski kalkulatori, rade u pregledniku
- [Privatnost](${SITE_URL}/privatnost): kako se postupa s podacima
- [Uvjeti korištenja](${SITE_URL}/uvjeti): besplatno i Premium, pošteno korištenje AI skeniranja, pretplata

## Kalkulatori
${CALCULATORS.map((c) => `- [${c.name}](${SITE_URL}/kalkulatori/${c.slug}): ${c.description}`).join("\n")}

## Blog
${posts.map((p) => `- [${p.title}](${SITE_URL}/blog/${p.slug}): ${p.description}`).join("\n")}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
