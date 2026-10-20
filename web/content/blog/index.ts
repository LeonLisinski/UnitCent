import type { Post } from "./types";
import { post as aplikacijeZaPracenjeTroskova } from "./posts/aplikacije-za-pracenje-troskova";
import { post as budzetNeredovitaPrimanja } from "./posts/budzet-neredovita-primanja";
import { post as budzetZaParove } from "./posts/budzet-za-parove";
import { post as budzetZaStudente } from "./posts/budzet-za-studente";
import { post as fiskalniRacunQrKod } from "./posts/fiskalni-racun-qr-kod";
import { post as fondZaHitneSlucajeve } from "./posts/fond-za-hitne-slucajeve";
import { post as godisnjiTroskovi } from "./posts/godisnji-troskovi";
import { post as impulzivnaKupnja } from "./posts/impulzivna-kupnja";
import { post as kakoIzaciIzMinusa } from "./posts/kako-izaci-iz-minusa";
import { post as kakoNapravitiMjesecniBudzet } from "./posts/kako-napraviti-mjesecni-budzet";
import { post as kakoPocetiStedjeti } from "./posts/kako-poceti-stedjeti";
import { post as kakoPratitiTroskove } from "./posts/kako-pratiti-troskove";
import { post as kakoPricatiONovcuUVezi } from "./posts/kako-pricati-o-novcu-u-vezi";
import { post as kakoSmanjitiRacuneZaRezije } from "./posts/kako-smanjiti-racune-za-rezije";
import { post as kakoSmanjitiTroskoveHrane } from "./posts/kako-smanjiti-troskove-hrane";
import { post as kategorijeTroskova } from "./posts/kategorije-troskova";
import { post as kolikoDnevnoSmijemPotrositi } from "./posts/koliko-dnevno-smijem-potrositi";
import { post as obiteljskiBudzet } from "./posts/obiteljski-budzet";
import { post as pravilo503020 } from "./posts/pravilo-50-30-20";
import { post as pretplateKojeZaboravimo } from "./posts/pretplate-koje-zaboravimo";
import { post as troskoviZivotaUHrvatskoj } from "./posts/troskovi-zivota-u-hrvatskoj";

// Zakazani članci (jedan tjedno od 27. 10. 2026.)
import { post as bozicniBudzet } from "./posts/bozicni-budzet";
import { post as kolikoKostaAuto } from "./posts/koliko-kosta-auto";
import { post as metodaKuverti } from "./posts/metoda-kuverti";
import { post as crniPetak } from "./posts/crni-petak";
import { post as troskoviGrijanja } from "./posts/troskovi-grijanja";
import { post as bozicnicaIDodatniNovac } from "./posts/bozicnica-i-dodatni-novac";
import { post as gotovinskiKreditIliStednja } from "./posts/gotovinski-kredit-ili-stednja";
import { post as financijskiCiljeviZaNovuGodinu } from "./posts/financijski-ciljevi-za-novu-godinu";
import { post as godisnjiPregledTroskova } from "./posts/godisnji-pregled-troskova";
import { post as kakoPrezivjetiSijecanj } from "./posts/kako-prezivjeti-sijecanj";
import { post as odPlaceDoPlace } from "./posts/od-place-do-place";
import { post as nultiBudzet } from "./posts/nulti-budzet";
import { post as izazovBezTrosenja } from "./posts/izazov-bez-trosenja";
import { post as racunZaMobitelIInternet } from "./posts/racun-za-mobitel-i-internet";
import { post as kakoVratitiDugove } from "./posts/kako-vratiti-dugove";
import { post as stednjaZaDjecu } from "./posts/stednja-za-djecu";
import { post as kolikoKostaKucniLjubimac } from "./posts/koliko-kosta-kucni-ljubimac";
import { post as inflacijaIBudzet } from "./posts/inflacija-i-budzet";
import { post as stednjaZaGodisnjiOdmor } from "./posts/stednja-za-godisnji-odmor";
import { post as proljetnoCiscenjeFinancija } from "./posts/proljetno-ciscenje-financija";

export type { Post } from "./types";

/*
 * Novi članak: dodaj datoteku u posts/ i uvezi je ovdje. Redoslijed = redoslijed na /blog (za isti datum).
 * Zakazani članci: `published` u budućnosti. Članak ne postoji na webu (popis, stranica, sitemap, llms.txt, OG slika)
 * dok taj dan ne dođe po zagrebačkom vremenu; stranice se same osvježavaju (revalidate), bez novog pusha.
 */
const ALL: Post[] = [
  kolikoDnevnoSmijemPotrositi,
  kakoNapravitiMjesecniBudzet,
  pravilo503020,
  kakoPratitiTroskove,
  pretplateKojeZaboravimo,
  fondZaHitneSlucajeve,
  troskoviZivotaUHrvatskoj,
  fiskalniRacunQrKod,
  aplikacijeZaPracenjeTroskova,
  kakoPocetiStedjeti,
  kakoIzaciIzMinusa,
  kakoSmanjitiRacuneZaRezije,
  kakoSmanjitiTroskoveHrane,
  impulzivnaKupnja,
  godisnjiTroskovi,
  kategorijeTroskova,
  budzetZaStudente,
  obiteljskiBudzet,
  budzetZaParove,
  kakoPricatiONovcuUVezi,
  budzetNeredovitaPrimanja,
  bozicniBudzet,
  kolikoKostaAuto,
  metodaKuverti,
  crniPetak,
  troskoviGrijanja,
  bozicnicaIDodatniNovac,
  gotovinskiKreditIliStednja,
  financijskiCiljeviZaNovuGodinu,
  godisnjiPregledTroskova,
  kakoPrezivjetiSijecanj,
  odPlaceDoPlace,
  nultiBudzet,
  izazovBezTrosenja,
  racunZaMobitelIInternet,
  kakoVratitiDugove,
  stednjaZaDjecu,
  kolikoKostaKucniLjubimac,
  inflacijaIBudzet,
  stednjaZaGodisnjiOdmor,
  proljetnoCiscenjeFinancija,
];

export function wordCount(s: string) {
  return s.replace(/\]\([^)]*\)/g, " ").replace(/[#>*|]/g, " ").split(/\s+/).filter(Boolean).length;
}

export const readingMinutes = (p: Post) => Math.max(1, Math.round(wordCount(p.body) / 200));

/** Svi članci, i zakazani. Najnoviji prvi; isti datum: redoslijed iz ALL (sort je stabilan). */
export const allPosts: Post[] = [...ALL].sort((a, b) => b.published.localeCompare(a.published));

/** Današnji datum u Zagrebu (YYYY-MM-DD). */
export function todayZagreb(now = new Date()): string {
  // Samo lokalno (npm run dev): BLOG_TODAY=2027-03-31 prikazuje i zakazane članke do tog datuma. U produkciji se ne koristi.
  const preview = process.env.NODE_ENV !== "production" ? process.env.BLOG_TODAY : undefined;
  if (preview && /^\d{4}-\d{2}-\d{2}$/.test(preview)) return preview;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zagreb" }).format(now);
}

/** Objavljeni članci (datum objave je danas ili prije). Računa se pri svakom pozivu, ne pri učitavanju modula. */
export function publishedPosts(today = todayZagreb()): Post[] {
  return allPosts.filter((p) => p.published <= today);
}

/** Objavljeni članak po slugu; zakazani prije datuma ne postoji. */
export const getPost = (slug: string) => publishedPosts().find((p) => p.slug === slug);
// Stranice bloga imaju `export const revalidate = 3600` (Next traži doslovnu vrijednost, pa nije zajednička konstanta).
