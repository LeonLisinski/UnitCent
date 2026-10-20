import type { Post } from "../types";

export const post: Post = {
  slug: "nulti-budzet",
  title: "Nulti budžet: svaki euro dobije zadatak",
  description:
    "Što je nulti budžet (zero-based budget), kako ga složiti u 20 minuta na početku mjeseca i za koga je bolji od pravila 50/30/20 ili metode kuverti.",
  category: "Budžet",
  published: "2027-01-12",
  summary: [
    "U nultom budžetu primanja minus svi planirani iznosi daju nulu: svaki euro ima namjenu, uključujući štednju.",
    "Nula ne znači da sve potrošiš, nego da sve rasporediš, i to što ide na štednju.",
    "Odgovara onima koji žele potpunu kontrolu; zahtijeva 20 minuta na početku svakog mjeseca.",
  ],
  body: `
Većina budžeta odgovara na pitanje „koliko smijem potrošiti“. Nulti budžet odgovara na drugo: „što radi svaki moj euro?“. Na početku mjeseca svakom euru primanja daš zadatak, dok ne ostane nula neraspoređenih.

## Kako izgleda

Primanja minus sve kategorije (troškovi, štednja, dug) jednako je nula.

::bars Primjer nultog budžeta za 1.468 €
Stan i režije | 520
Pretplate i rate | 251
Hrana | 300
Gorivo i prijevoz | 110
Štednja | 150
Izlasci | 80
Ostalo i rezerva | 57

Zbroj kategorija je točno 1.468 €. Ništa nije „slobodno“, ali „ostalo i rezerva“ je kategorija za sitnice i nepredviđeno.

::stat 1.468 € | primanja | primjer
::stat 0 € | neraspoređeno | svaki euro ima namjenu

## Nula ne znači potrošiti sve

Najčešći nesporazum: nulti budžet ne traži da potrošiš sve. Štednja je kategorija kao i svaka druga. Ako 150 € ide na štednju, to je zadatak tih 150 €.

## Kako ga složiti u 20 minuta

1. **Upiši primanja** za mjesec. Ako su neredovita, uzmi najniži iznos koji sigurno stiže.
2. **Fiksni troškovi**: stan, režije, rate, pretplate.
3. **Štednja i dug**: odluči iznos prije varijabilnih troškova.
4. **Varijabilni troškovi**: hrana, gorivo, izlasci, po iskustvu prošlih mjeseci.
5. **Ostatak** rasporedi dok ne ostane nula: u rezervu, štednju ili kategoriju koja je bila tijesna.

::tip Ako prvi put radiš nulti budžet, uzmi izvod prošlog mjeseca kao polazište. Kategorije postavi prema stvarnim iznosima, ne idealnim, pa ih mijenjaj postupno.

## Tijekom mjeseca

Kad jedna kategorija premaši plan, novac ne nastaje iz ničega. Premjesti ga iz druge. Ako hrana treba 30 € više, izlasci dobiju 30 € manje. Tako budžet ostaje točan i vidiš posljedice odluka.

::warn Nulti budžet ne voli kašnjenje. Ako troškove upisuješ jednom tjedno ili rjeđe, kategorije gube smisao. Upisuj odmah ili barem svaki dan.

## Usporedba s drugim metodama

- **Pravilo 50/30/20** je jednostavnije: tri skupine, postotak primanja. Dobro za početak. Pogledaj [pravilo 50/30/20](/blog/pravilo-50-30-20).
- **Metoda kuverti** je nulti budžet za nekoliko kategorija, s fizičkom ili digitalnom granicom. Pogledaj [metodu kuverti](/blog/metoda-kuverti).
- **Dnevni budžet** pokazuje koliko danas smiješ, bez dijeljenja na mnogo kategorija. Najmanje rada.

Nulti budžet je najdetaljniji. Ako ti broj kategorija postane naporan, zadrži samo važne, a ostalo spoji u „ostalo“.

## Nulti budžet i dnevni iznos

Fiksni troškovi i štednja iz nultog budžeta su ono što se oduzima od primanja prije dnevnog izračuna. Varijabilne kategorije zajedno daju iznos za trošenje, koji podijeljen s danima daje dnevni budžet. Dvije metode se ne isključuju, nego nadopunjuju.
`,
  faq: [
    {
      q: "Što je nulti budžet?",
      a: "Metoda u kojoj na početku mjeseca svakom euru primanja dodijeliš namjenu (trošak, štednja, dug) dok neraspoređeni iznos ne bude nula.",
    },
    {
      q: "Znači li nulti budžet da potrošim sve?",
      a: "Ne. Štednja je jedna od kategorija. Nula znači da je sav novac raspoređen, ne potrošen.",
    },
  ],
  related: ["metoda-kuverti", "pravilo-50-30-20", "kako-napraviti-mjesecni-budzet"],
};
