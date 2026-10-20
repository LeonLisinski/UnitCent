import type { Post } from "../types";

export const post: Post = {
  slug: "izazov-bez-trosenja",
  title: "Izazov bez trošenja: tjedan ili mjesec bez nepotrebnih kupnji",
  description:
    "Što je izazov bez trošenja, kako postaviti pravila koja su realna, što smiješ kupovati, kako izdržati i što napraviti s novcem koji ostane.",
  category: "Štednja",
  published: "2027-01-19",
  summary: [
    "Izazov bez trošenja znači određeno razdoblje bez kupnji izvan nužnih troškova.",
    "Pravila zapiši unaprijed: što je nužno (hrana, računi, prijevoz), a što ne.",
    "Najveća vrijednost nije ušteda, nego to što vidiš koje kupnje su navika, a ne potreba.",
  ],
  body: `
Izazov bez trošenja (eng. no-spend challenge) je jednostavan: određeno vrijeme ne kupuješ ništa osim nužnoga. Može trajati vikend, tjedan ili mjesec. Ušteda je dobrodošla, ali glavna korist je drugdje: shvatiš koliko kupnji je navika.

## Pravila prije početka

Izazov propada kad pravila nisu jasna. Zapiši ih prije nego počneš:

### Dopušteno

- hrana za kuću (prema popisu)
- računi, najam, rate, pretplate koje već imaš
- prijevoz do posla i nužne obaveze
- lijekovi i zdravlje

### Nije dopušteno

- hrana i piće vani, dostava
- odjeća, kozmetika, gadgeti
- kupnje „jer je sniženo“
- nove pretplate

::tip Ako ti je mjesec previše, počni s vikendom. Dva dana bez trošenja izvan nužnoga je dobar test.

## Koliko se može uštedjeti

Ovisi o tome koliko inače trošiš na nenužno. Pomaže pogledati jednu naviku i izračunati njezin godišnji trošak.

::calc sitni-troskovi | Koliko godišnje košta jedna navika? | Cijena i koliko puta tjedno

::stat 2 € × 5 | tjedno | kava vani
::stat 520 € | godišnje | samo ta jedna navika

## Kako izdržati

- **Isključi obavijesti** iz trgovina i aplikacija za dostavu na vrijeme izazova.
- **Napravi popis „kupit ću nakon“**. Stvari koje poželiš upiši na popis. Na kraju izazova pogledaj koliko ih još želiš.
- **Zamijeni, ne samo izbaci**: kava od kuće u termosici, druženje kod kuće umjesto izlaska, šetnja umjesto kupovine.
- **Reci nekome.** Lakše je izdržati kad netko zna.

::warn Ako se izazov pretvori u kažnjavanje i stres, prilagodi pravila. Cilj je svjesnost, ne patnja. Mjesec koji te iscrpi vjerojatno se neće ponoviti.

## Što napraviti s uštedom

Novac koji nisi potrošio prebaci na štednju odmah na kraju izazova. Ako ostane na tekućem računu, potrošit će se u sljedećem tjednu. Dobra ideja je usmjeriti ga na konkretan cilj, da ušteda ima vidljiv rezultat.

## Nakon izazova

Pogledaj popis „kupit ću nakon“. Ono što i dalje želiš i stane u budžet, kupi bez griže savjesti. Ono što više ne želiš je pravi rezultat izazova. Neke navike možda zadržiš i dalje, npr. jedan dan tjedno bez trošenja.
`,
  faq: [
    {
      q: "Što je izazov bez trošenja?",
      a: "Razdoblje (vikend, tjedan ili mjesec) u kojem ne kupuješ ništa osim nužnoga: hrane za kuću, računa, prijevoza i zdravlja.",
    },
    {
      q: "Smijem li kupovati hranu tijekom izazova?",
      a: "Hranu za kuću da, prema popisu. Hrana i piće vani te dostava obično nisu dopušteni.",
    },
  ],
  related: ["impulzivna-kupnja", "kako-poceti-stedjeti", "kako-smanjiti-troskove-hrane"],
};
