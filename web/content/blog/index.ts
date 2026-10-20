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

export type { Post } from "./types";

/* Novi članak: dodaj datoteku u posts/ i uvezi je ovdje. Redoslijed = redoslijed na /blog (za isti datum). */
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
];

export function wordCount(s: string) {
  return s.replace(/\]\([^)]*\)/g, " ").replace(/[#>*|]/g, " ").split(/\s+/).filter(Boolean).length;
}

export const readingMinutes = (p: Post) => Math.max(1, Math.round(wordCount(p.body) / 200));

/** Najnoviji prvi; isti datum: redoslijed iz ALL (sort je stabilan). */
export const posts: Post[] = [...ALL].sort((a, b) => b.published.localeCompare(a.published));

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);
