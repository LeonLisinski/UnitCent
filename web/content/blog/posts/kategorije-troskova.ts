import type { Post } from "../types";

export const post: Post = {
  slug: "kategorije-troskova",
  title: "Kategorije troškova: kako ih postaviti da budžet ima smisla",
  description:
    "Koje kategorije troškova koristiti u kućnom budžetu, koliko ih treba i kako razvrstati mješovite račune. S primjerom osnovnog popisa kategorija.",
  category: "Budžet",
  published: "2026-10-20",
  summary: [
    "Za početak je dovoljno pet do osam kategorija. Više kategorija znači sporiji unos i lakše odustajanje.",
    "Dobra kategorija odgovara na pitanje „gdje mogu nešto promijeniti“, a ne samo „što je to bilo“.",
    "Mješovite račune (dućan s hranom i kozmetikom) razdvoji po stavkama ili ih stavi u najveću kategoriju.",
  ],
  body: `
Kategorije su kostur budžeta. Ako su previše općenite, ne vidiš ništa korisno. Ako su previše detaljne, unos postaje posao i odustaješ. Dobar skup kategorija je negdje između i, što je najvažnije, odgovara tvom životu.

## Zašto uopće kategorije

Bez kategorija znaš koliko si potrošio. S kategorijama znaš **na što**. A to je pitanje koje vodi do odluke: „Hrana: 32 € preko plana“ je korisna informacija. „Potrošio si 600 €“ nije.

Kategorije ti pomažu da:

- vidiš gdje odlazi najviše novca
- postaviš mjesečni plan za kategorije koje ti najčešće pobjegnu
- usporediš mjesece i vidiš trend

## Koliko kategorija

Za početak **pet do osam**. To je dovoljno za korisnu sliku, a malo da unos ostane brz. Kategorije uvijek možeš razdvojiti kasnije, kad vidiš da ti nešto treba detaljnije.

Znak da imaš previše kategorija: često razmišljaš u koju bi stavio trošak, ili imaš kategorije s jednim troškom mjesečno.

## Osnovni popis

Ovaj popis pokriva većinu kućanstava. Prilagodi ga.

| Kategorija | Što ulazi |
| --- | --- |
| Hrana | dućan, pekara, tržnica |
| Kafići i restorani | kava, ručak vani, dostava |
| Prijevoz | gorivo, javni prijevoz, parking, cestarina |
| Stan | najam, režije, kućanske potrepštine, popravci |
| Zdravlje | ljekarna, liječnik, zubar |
| Pretplate | streaming, glazba, oblak, teretana |
| Zabava i hobiji | izlasci, kino, sport, knjige |
| Ostalo | sve što ne pripada drugdje |

### Odvojeno: obavezno i varijabilno

Korisno je razlikovati dvije vrste troškova:

- **Obavezni (fiksni):** najam, režije, rate, pretplate. Uneseš ih jednom i ponavljaju se.
- **Varijabilni:** hrana, kafići, gorivo, izlasci. Tu svakodnevno donosiš odluke.

Kod varijabilnih troškova kategorije su najkorisnije, jer tamo možeš nešto promijeniti.

## Kako odabrati vlastite kategorije

### Kreni od izvoda

Pogledaj izvode za zadnja dva do tri mjeseca i grupiraj troškove. Kategorije koje se same nameću obično su prave.

### Odvoji ono što želiš promijeniti

Ako znaš da ti dostava hrane pojede puno novca, napravi joj vlastitu kategoriju umjesto da je skrivaš u „hrani“. Kategorija treba pokazati problem, a ne ga sakriti.

### Spoji ono što ti nije važno

Ako ti nije važno razlikovati kino od koncerta, oba stavi u „zabavu“. Detalj bez odluke samo usporava unos.

### Kategorija „ostalo“ je u redu

Ali ako „ostalo“ postane najveća kategorija, vrijeme je da pogledaš što je u njoj i napraviš novu kategoriju.

## Mješoviti računi

Račun iz dućana često sadrži stvari iz više kategorija: namirnice, kozmetiku, sredstva za čišćenje, možda hranu za ljubimca. Dvije su mogućnosti:

1. **Razdvoji po stavkama.** Točnije, ali sporije ako radiš ručno. Primjer: račun od 20,65 € podijeliš na hranu 10,46 €, auto 4,99 € i kućanstvo 5,20 €.
2. **Cijeli račun u najveću kategoriju.** Brže, a dovoljno točno ako je većina računa jedne vrste.

Neke aplikacije razdvajaju stavke automatski. UnitCent, na primjer, skenira račun i svaku stavku svrstava u kategoriju, a ti samo potvrdiš ili ispraviš. Kako pročitati fiskalni račun, objašnjavamo u članku [Fiskalni račun i QR kod](/blog/fiskalni-racun-qr-kod).

## Mjesečni plan po kategoriji

Kad mjesec ili dva pratiš troškove, za kategorije koje ti najčešće pobjegnu postavi mjesečni iznos. Na primjer: kafići i restorani 70 € mjesečno. Ne treba plan za svaku kategoriju. Dovoljno je za dvije ili tri problematične.

Kad vidiš „Kafići: 15 € do plana“, lakše ćeš odlučiti o sljedećoj kavi nego kad gledaš samo ukupni iznos.

## Najčešće greške

- **Previše kategorija na početku.** Kreni jednostavno, razdvajaj kasnije.
- **Kategorije koje se preklapaju.** „Hrana“ i „dućan“ zbunjuju. Svaki trošak treba imati jedno očito mjesto.
- **Mijenjanje kategorija svaki mjesec.** Onda ne možeš uspoređivati mjesece. Promjene radi rijetko.
- **Kategorije po trgovini umjesto po namjeni.** „Konzum“ nije kategorija. Ono što si kupio jest.

## Primjer za različite situacije

- **Student:** hrana, menza i kafići, prijevoz, studij, izlasci, ostalo.
- **Obitelj:** hrana, djeca, stan, prijevoz, zdravlje, pretplate, ostalo. Više u članku [Obiteljski budžet](/blog/obiteljski-budzet).
- **Par:** zajedničke kategorije za stan i hranu, a osobne za ostalo. Više u članku [Zajednički budžet u vezi](/blog/budzet-za-parove).

Kategorije su alat, a ne cilj. Ako ti pomažu donijeti bolju odluku, dobre su.
`,
  faq: [
    {
      q: "Koliko kategorija troškova treba imati?",
      a: "Za početak pet do osam. To je dovoljno za korisnu sliku, a unos ostaje brz. Kategorije možeš razdvojiti kasnije ako trebaš više detalja.",
    },
    {
      q: "Kamo staviti račun iz dućana na kojem je više vrsta stvari?",
      a: "Ili ga razdvoji po stavkama u više kategorija, ili cijeli iznos stavi u kategoriju kojoj pripada najveći dio računa. Neke aplikacije stavke razdvajaju automatski.",
    },
    {
      q: "Jesu li pretplate zasebna kategorija?",
      a: "Korisno je da jesu, jer ih tako lako vidiš i provjeravaš. Kao obavezni troškovi ponavljaju se svaki mjesec bez ručnog unosa.",
    },
  ],
  related: ["kako-pratiti-troskove", "kako-napraviti-mjesecni-budzet", "fiskalni-racun-qr-kod"],
};
