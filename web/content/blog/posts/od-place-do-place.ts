import type { Post } from "../types";

export const post: Post = {
  slug: "od-place-do-place",
  title: "Kako prestati živjeti od plaće do plaće",
  description:
    "Kad je račun prazan prije sljedeće plaće: kako napraviti mali razmak, rezervu od jednog mjeseca i prekinuti krug, korak po korak i bez velikih odricanja.",
  category: "Budžet",
  published: "2027-01-05",
  summary: [
    "Život od plaće do plaće najčešće nije pitanje iznosa plaće, nego razmaka: nema rezerve između dva primanja.",
    "Cilj je jedan mjesec unaprijed: troškove ovog mjeseca plaćaš plaćom iz prošlog.",
    "Do toga se dolazi malim, redovitim koracima: svaki tjedan nekoliko eura više rezerve.",
  ],
  body: `
Plaća stigne, računi odu, i do kraja mjeseca svaki euro je izbrojen. Nekoliko dana prije sljedeće plaće račun je prazan ili u minusu. Ako ti je to poznato, nisi jedini, a izlaz postoji i ne traži dramatične promjene.

## Gdje je problem

Kad živiš od plaće do plaće, svaki trošak koji stigne u krivo vrijeme postaje kriza: popravak, rođendan, račun koji je veći nego inače. Nema razmaka između onoga što dolazi i onoga što odlazi. Rješenje nije nužno veća plaća, nego **rezerva**.

## Cilj: mjesec dana unaprijed

Idealno stanje je da troškove ovog mjeseca plaćaš novcem koji je stigao prošli mjesec. Plaća koja stigne danas čeka sljedeći mjesec. Tada datum plaće prestaje biti važan.

::stat 1 mjesec | razmak | troškovi ovog mjeseca iz prošle plaće
::stat 0 dana | stresa | kad datum plaće više nije važan

Do toga se ne dolazi odjednom. Ide u tri koraka.

## Korak 1: znati gdje si

Upiši stalne troškove (stan, režije, rate, pretplate) i izračunaj koliko ti ostaje za trošenje. Taj iznos podijeli s danima do sljedeće plaće. Dnevni iznos ti pokazuje jesi li na putu ili je sredina mjeseca već problem.

::calc dnevni-budzet | Koliko dnevno smijem potrošiti? | Primanja, fiksni troškovi i dani do kraja mjeseca

## Korak 2: mala rezerva

Prvi cilj je mala rezerva, npr. 200 do 500 €, na zasebnom računu. Ona pokriva troškove koji te sada bacaju u minus. Kako doći do nje:

- **5 do 10 € tjedno** automatski na štednju. Malo, ali stalno.
- **Jedan trošak manje** mjesečno: pretplata koju ne koristiš, jedan izlazak.
- **Prodaja** stvari koje ne koristiš.

::tip Kad ostvariš rezervu, ne smatraj je novcem za trošenje. To je tvoj „mjesec unaprijed“ u nastajanju.

## Korak 3: rasti do jednog mjeseca

Svaki mjesec dodaj rezervi koliko možeš, dok ne dosegne iznos jednog mjeseca troškova. Tada prestaješ ovisiti o datumu plaće. Nakon toga, štednja ide dalje prema pravom fondu za hitne slučajeve.

::calc fond-za-hitne | Koliko mi treba rezerve? | Izračunaj cilj i za koliko mjeseci ga možeš skupiti

## Najčešće zamke

- **Minus kao produžetak plaće.** Dopušteni minus djeluje kao vlastiti novac, ali ima kamatu i vraća te u krug. Pogledaj [kako izaći iz minusa](/blog/kako-izaci-iz-minusa).
- **Sitni troškovi.** Pojedinačno ništa, zajedno ozbiljan iznos. Kalkulator [sitnog troška](/kalkulatori/sitni-troskovi) pokazuje koliko.
- **„Nagrada“ na dan plaće.** Planiraj je, ali u iznosu koji stane u budžet.

::warn Ako je i nakon osnovnih troškova uvijek malo ili ništa, problem je možda u visini primanja ili velikim fiksnim troškovima (najam, rate). Tada vrijedi razmisliti o većim promjenama, a ne samo o rezanju sitnica.

## Mali koraci, stvarna razlika

Rezerva se ne gradi u mjesec dana. Ali svaki tjedan s nekoliko eura više između tebe i nule je tjedan s manje stresa. Za nekoliko mjeseci razlika je velika.
`,
  faq: [
    {
      q: "Kako prestati živjeti od plaće do plaće?",
      a: "Napravi malu rezervu na zasebnom računu, npr. 200 do 500 €, malim redovitim prijenosima. Zatim je postupno povećavaj do iznosa jednog mjeseca troškova, kada troškove plaćaš novcem iz prošle plaće.",
    },
    {
      q: "Koliko rezerve trebam?",
      a: "Prvi cilj je mala rezerva od nekoliko stotina eura, zatim jedan mjesec troškova, a dugoročno tri do šest mjeseci kao fond za hitne slučajeve.",
    },
  ],
  related: ["kako-izaci-iz-minusa", "fond-za-hitne-slucajeve", "koliko-dnevno-smijem-potrositi"],
};
