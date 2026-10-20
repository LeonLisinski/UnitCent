import type { Post } from "../types";

export const post: Post = {
  slug: "godisnji-pregled-troskova",
  title: "Godišnji pregled troškova: 30 minuta koje vrijede cijelu godinu",
  description:
    "Kako na kraju godine u pola sata pregledati troškove: koliko je otišlo po kategorijama, koje pretplate ne koristiš i što promijeniti za sljedeću godinu.",
  category: "Alati",
  published: "2026-12-22",
  summary: [
    "Godišnji pregled pokazuje obrasce koje mjesec ne pokaže: sezonske troškove, rast kategorija, zaboravljene pretplate.",
    "Za pregled je dovoljno 30 minuta i tri pitanja: koliko, na što i što mijenjam.",
    "Rezultat su dvije ili tri konkretne promjene za iduću godinu, ne dugačak popis.",
  ],
  body: `
Mjesečni pregled pokazuje jesi li u planu. Godišnji pokazuje kamo ti stvarno ide novac. Između blagdana, kad je tempo sporiji, uzmi pola sata i pogledaj godinu iza sebe. Ne radi se o osudi, nego o brojkama.

## Što ti treba

- izvodi s računa ili kartice za cijelu godinu, ili aplikacija u kojoj pratiš troškove
- popis pretplata i fiksnih troškova
- 30 minuta bez žurbe

## Pitanje 1: koliko je otišlo ukupno

Zbroji sve troškove u godini i podijeli s 12. Usporedi s primanjima. Je li razlika ono što si očekivao? Ako je štednja na kraju godine manja nego što si mislio, odgovor je u sljedećem pitanju.

## Pitanje 2: na što

Rasporedi troškove po kategorijama. Najčešće se iznenadimo trima stvarima: hranom izvan kuće, sitnim kupnjama i pretplatama.

::bars Primjer: godišnji troškovi po kategorijama
Stan i režije | 5400
Hrana | 3600
Auto | 2900
Izlasci i hrana vani | 1500
Pretplate | 900
Odjeća | 700
Ostalo | 1100

U ovom primjeru izlasci i hrana vani su 1.500 € godišnje, više od odjeće i pretplata zajedno. Možda je to u redu, ali vrijedi znati.

::tip Usporedi kategorije s prošlom godinom, ako imaš podatke. Kategorija koja je narasla više od 20 % zaslužuje drugi pogled.

## Pretplate: najbrža ušteda

Prođi popis pretplata i za svaku odgovori: jesam li je koristio u zadnjih mjesec dana? Ako nisi, otkaži. Uvijek je možeš ponovno uključiti.

::calc pretplate | Koliko me godišnje koštaju pretplate? | Zbroji ih i vidi godišnji iznos

## Pitanje 3: što mijenjam

Odaberi **dvije do tri** konkretne promjene. Ne „trošit ću manje“, nego:

- otkazujem dvije pretplate koje ne koristim
- hrana vani najviše 100 € mjesečno
- 100 € mjesečno na štednju od siječnja, automatski

## Godišnji troškovi za sljedeću godinu

Iz pregleda izvuci troškove koji dolaze jednom godišnje: registracija, osiguranja, poklon za rođendane, godišnje pretplate. Zbroji ih i podijeli s 12. Taj iznos odvajaj svaki mjesec, da te iduće godine ništa ne iznenadi. Više o tome u članku [Godišnji troškovi koje svi zaborave](/blog/godisnji-troskovi).

::warn Pregled nije prilika za samokritiku. Cilj je razumjeti, ne kazniti se. Godina u kojoj si potrošio više nego što si htio i dalje je vrijedna, jer sada znaš na što.

## Pregled svaki mjesec

Ako troškove pratiš kroz godinu, godišnji pregled je pet minuta: podaci su već po kategorijama. U UnitCentu Pregled pokazuje mjesec po kategorijama, a s Premiumom vidiš cijelu povijest i usporedbe kroz godinu.
`,
  faq: [
    {
      q: "Kako napraviti godišnji pregled troškova?",
      a: "Zbroji troškove za cijelu godinu, rasporedi ih po kategorijama, provjeri pretplate i odaberi dvije do tri konkretne promjene za sljedeću godinu. Dovoljno je 30 minuta.",
    },
    {
      q: "Koje troškove najčešće podcijenimo?",
      a: "Najčešće hranu izvan kuće, sitne kupnje i pretplate, jer su pojedinačno mali iznosi koji se kroz godinu zbroje u velik iznos.",
    },
  ],
  related: ["godisnji-troskovi", "pretplate-koje-zaboravimo", "kategorije-troskova"],
};
