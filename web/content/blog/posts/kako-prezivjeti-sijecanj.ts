import type { Post } from "../types";

export const post: Post = {
  slug: "kako-prezivjeti-sijecanj",
  title: "Kako preživjeti siječanj, najduži mjesec u godini",
  description:
    "Plaća stiže, a prosinac je već potrošio dio siječnja. Kako izračunati koliko dnevno smiješ potrošiti do sljedeće plaće i proći siječanj bez novog minusa.",
  category: "Budžet",
  published: "2026-12-29",
  summary: [
    "Siječanj se čini dugim jer prosinac često potroši dio njegovog novca: kartice, rate i poklone plaćamo kasnije.",
    "Prvi korak je točan broj: koliko imaš do sljedeće plaće i koliko je to dnevno.",
    "Dnevni iznos daje kontrolu bez odricanja od svega: znaš kada smiješ, a kada trebaš usporiti.",
  ],
  body: `
Siječanj ima 31 dan, ali mnogima se čini da ih ima 60. Prosinac je bio skup, dio troškova stiže tek sada (kartice, rate, kupnje „plati poslije“), a zimski računi su najveći u godini. Dobra vijest: siječanj je predvidiv, pa ga se može isplanirati.

## Korak 1: točan broj

Prije svega, saznaj koliko stvarno imaš. Od stanja na računu oduzmi sve što još mora otići do sljedeće plaće:

- rate i kartice koje dolaze na naplatu
- režije, najam, pretplate
- iznos koji odvajaš za štednju (ako ga ovaj mjesec možeš zadržati)

Ono što ostane je novac za trošenje do sljedeće plaće.

## Korak 2: dnevni iznos

Taj iznos podijeli s brojem dana do sljedeće plaće, uključujući danas. To je koliko smiješ potrošiti svaki dan.

::stat 420 € | do plaće | primjer nakon svih računa
::stat 20 € | dnevno | 420 € ÷ 21 dan

::calc dnevni-budzet | Koliko dnevno smijem potrošiti? | Primanja, troškovi i dani do kraja mjeseca

Dnevni iznos ne znači da svaki dan moraš potrošiti točno toliko. Ako danas potrošiš 12 €, sutra imaš malo više. Ako potrošiš 35 €, sutra je manje. Važno je da u svakom trenutku znaš gdje si.

## Korak 3: tjedni ritam

- **Jedna velika kupnja hrane tjedno** prema popisu, umjesto svakodnevnih manjih.
- **Jedan dan bez trošenja** tjedno, ako ti odgovara izazov. Pogledaj [izazov bez trošenja](/blog/izazov-bez-trosenja).
- **Petkom pogledaj tjedan**: koliko je ostalo i koliko je dana do plaće.

::tip Ako ti siječanj svake godine ponavlja isti problem, prosinac počni planirati u listopadu. Pogledaj [božićni budžet](/blog/bozicni-budzet).

## Što izbjegavati

- **Novi minus da se pokrije stari.** Svaka posudba u siječnju je trošak u veljači.
- **„Kupi sad, plati poslije“** za stvari koje mogu pričekati.
- **Sniženja**: siječanjske rasprodaje su prilika samo za ono što ti stvarno treba.

::warn Ako vidiš da novca neće biti dovoljno za nužne troškove (stan, režije, hrana), javi se na vrijeme vjerovnicima ili dobavljačima i pitaj za odgodu ili obročnu otplatu. To je gotovo uvijek bolje od propuštene uplate.

## Nakon siječnja

Kad prođe, zapiši što je bilo najteže. Za većinu ljudi to su blagdanski troškovi koji su se prelili u siječanj. To je informacija za sljedeći prosinac, ne razlog za loš osjećaj.
`,
  faq: [
    {
      q: "Zašto je siječanj financijski težak?",
      a: "Dio blagdanskih troškova plaća se tek u siječnju (kartice, rate, odgođena plaćanja), a zimski računi su najveći. Uz to, plaća za prosinac često stiže ranije, pa je razdoblje do sljedeće plaće dulje.",
    },
    {
      q: "Kako izračunati koliko dnevno smijem potrošiti do plaće?",
      a: "Od stanja na računu oduzmi sve račune i rate koji dolaze do sljedeće plaće, a ostatak podijeli s brojem dana do plaće uključujući danas.",
    },
  ],
  related: ["koliko-dnevno-smijem-potrositi", "bozicni-budzet", "kako-izaci-iz-minusa"],
};
