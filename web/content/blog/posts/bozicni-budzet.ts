import type { Post } from "../types";

export const post: Post = {
  slug: "bozicni-budzet",
  title: "Božićni budžet: kako proći blagdane bez siječanjskog minusa",
  description:
    "Pokloni, hrana, druženja i putovanja: kako na vrijeme složiti božićni budžet, rasporediti trošak na nekoliko mjeseci i ući u siječanj bez minusa na računu.",
  category: "Budžet",
  published: "2026-10-27",
  summary: [
    "Blagdani su predvidiv trošak, pa ih se može planirati kao i svaki drugi: iznos, popis i rok.",
    "Ako počneš krajem listopada, ukupni iznos dijeliš na dva mjeseca umjesto da sve padne na prosinac.",
    "Odvojeni iznos za blagdane ne dira dnevni budžet, pa i u prosincu znaš koliko smiješ potrošiti.",
  ],
  body: `
Prosinac je jedini mjesec u kojem gotovo svi troše više, a siječanj je mjesec u kojem to svi osjete. Razlog nije to što su blagdani skupi, nego to što ih rijetko tko planira. Trošak koji znaš da dolazi može se pripremiti, a kad se pripremi, prestaje biti iznenađenje.

## Korak 1: popiši na što stvarno ide novac

Većina blagdanskih troškova pada u pet skupina. Za svaku upiši iznos koji ti se čini realnim, ne idealnim:

- **pokloni** (obitelj, prijatelji, kolege, djeca)
- **hrana i piće** (Badnjak, Božić, Stara godina, gosti)
- **druženja** (izlasci, domjenci, poklon za domaćina)
- **putovanja** (posjet obitelji, gorivo, karte)
- **ukrasi i sitnice** (bor, svjetla, papir za zamatanje)

::bars Primjer božićnog budžeta
Pokloni | 220
Hrana i piće | 160
Druženja | 80
Putovanja | 60
Ukrasi i sitnice | 30

U ovom primjeru ukupno je 550 €. Tvoj iznos može biti manji ili veći, važno je da je tvoj.

## Korak 2: raspodijeli iznos na vrijeme

Ako 550 € pada na prosinac, to je jedna velika rupa. Ako počneš odvajati krajem listopada, to su dva manja iznosa.

::stat 275 € | mjesečno | 550 € podijeljeno na studeni i prosinac
::stat 550 € | odjednom | sve na prosinac i siječanjski minus

::calc cilj-stednje | Kad ću skupiti za blagdane? | Upiši iznos i koliko odvajaš mjesečno

## Korak 3: pokloni s popisom, ne s osjećajem

Najveći dio blagdanskog budžeta su pokloni, i tu se najlakše pretjera. Pomaže jednostavno pravilo: **ime, iznos, ideja**. Prije kupnje upiši svaku osobu i najviše koliko za nju trošiš. Kad je iznos zapisan, lakše je reći ne „još jednoj sitnici“.

::tip Dogovori se s obitelji ili prijateljima za tajnog Djeda Božićnjaka: svatko kupuje jedan poklon, a ne svima po jedan. Manje novca, manje stresa, a iznenađenje ostaje.

## Korak 4: hrana bez bacanja

Blagdanski stol obično ima više nego što stane u goste. Napravi jelovnik za svaki dan, kupuj prema popisu i ostavi mjesta za ostatke. Ono što ostane s Badnjaka često je ručak za Božić.

## Korak 5: u prosincu prati, ne pogađaj

Prosinac je mjesec u kojem se najlakše izgubi pregled, jer svaki dan ima neki mali trošak. Upisuj ih odmah. Ako je blagdanski iznos odvojen u planu, dnevni budžet za ostalo ostaje isti i znaš koliko smiješ potrošiti i usred blagdanske gužve.

::warn Kartice s odgodom plaćanja i „kupi sad, plati poslije“ ne smanjuju trošak, samo ga sele u siječanj. Ako ih koristiš, upiši trošak u mjesecu kad je nastao.

## Kad prođu blagdani

Prvog tjedna siječnja pogledaj koliko si stvarno potrošio po skupinama. Upiši to kao početni iznos za sljedeću godinu. Za godinu dana imat ćeš točnu brojku umjesto procjene, a božićni budžet postaje rutina.
`,
  faq: [
    {
      q: "Kada početi štedjeti za Božić?",
      a: "Što ranije, to je mjesečni iznos manji. Ako počneš krajem listopada, trošak dijeliš na dva mjeseca; ako počneš u siječnju, na cijelu godinu.",
    },
    {
      q: "Koliko potrošiti na blagdane?",
      a: "Onoliko koliko možeš odvojiti bez minusa i bez diranja fonda za hitne slučajeve. Iznos zapiši unaprijed i rasporedi ga po skupinama: pokloni, hrana, druženja, putovanja.",
    },
    {
      q: "Što ako sam već u minusu prije blagdana?",
      a: "Smanji popis poklona, dogovori zajedničke poklone i postavi niži iznos. Bolje skromniji prosinac nego dugi siječanj s kamatama na minus.",
    },
  ],
  related: ["godisnji-troskovi", "kako-prezivjeti-sijecanj", "impulzivna-kupnja"],
};
