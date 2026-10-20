import type { Post } from "../types";

export const post: Post = {
  slug: "financijski-ciljevi-za-novu-godinu",
  title: "Financijski ciljevi za novu godinu koji prežive veljaču",
  description:
    "Zašto većina novogodišnjih odluka o novcu propadne do veljače i kako postaviti cilj koji traje: iznos, rok, mali mjesečni korak i automatski prijenos.",
  category: "Štednja",
  published: "2026-12-15",
  summary: [
    "Cilj „štedjet ću više“ nije cilj. Cilj ima iznos, rok i mjesečni korak.",
    "Jedan do tri cilja godišnje su dovoljni; deset ciljeva znači nijedan.",
    "Automatski prijenos na dan plaće radi bolje od volje.",
  ],
  body: `
Svakog siječnja odlučimo da ćemo ove godine štedjeti više, trošiti manje i napokon srediti financije. Do veljače većina tih odluka nestane. Ne zato što nismo dovoljno disciplinirani, nego zato što su odluke preopćenite.

## Od želje do cilja

„Štedjet ću više“ je želja. Cilj ima tri dijela:

- **iznos**: koliko točno
- **rok**: do kada
- **korak**: koliko mjesečno

::stat 1.200 € | do srpnja | za ljetovanje
::stat 150 € | mjesečno | od siječnja do kolovoza

„Uštedjet ću 1.200 € za ljetovanje do srpnja, odvajajući 150 € mjesečno“ je cilj. Znaš što radiš svaki mjesec i znaš jesi li na putu.

::calc cilj-stednje | Kad ću skupiti iznos? | Upiši cilj, ono što već imaš i mjesečni iznos

## Manje ciljeva, više uspjeha

Jedan do tri cilja godišnje su dovoljni. Dobar redoslijed za većinu ljudi:

1. **Mala rezerva** za hitne slučajeve (npr. 500 € ili jedan mjesec troškova).
2. **Skupi dug**, ako postoji: minus, kreditna kartica.
3. **Jedan cilj koji te veseli**: putovanje, nešto za dom, tečaj.

## Zašto odluke propadnu i kako to izbjeći

### Previše odjednom

Ako odlučiš štedjeti 30 % primanja od prvog dana, a do sada nisi štedio ništa, budžet će puknuti u prvom tjednu. Počni s iznosom koji ne boli, a povećavaj ga svaka tri mjeseca.

### Oslanjanje na volju

Volja je najjača u siječnju i slabi svaki tjedan. Automatski prijenos na dan plaće ne treba volju.

::tip Postavi trajni nalog na štednju za dan nakon plaće. Novac koji nikad ne vidiš na tekućem računu, ne trošiš.

### Nema praćenja

Ako ne vidiš napredak, cilj se zaboravi. Jednom mjesečno pogledaj koliko si uštedio i koliko je ostalo do cilja.

### Jedan loš mjesec znači odustajanje

Prosinac s puno troškova ili neočekivani popravak ne poništavaju cilj. Pomakni rok za mjesec ili smanji iznos jedan mjesec, ali nemoj odustati.

## Cilj u dnevnom budžetu

Mjesečni korak prema cilju upiši kao štednju u plan. Tada je izuzet iz iznosa za trošenje, a dnevni budžet pokazuje koliko smiješ potrošiti nakon što je štednja već odvojena. Tako cilj ne ovisi o tome što ostane na kraju mjeseca, jer na kraju mjeseca obično ne ostane ništa.
`,
  faq: [
    {
      q: "Kako postaviti financijski cilj?",
      a: "Cilj ima iznos, rok i mjesečni korak. Na primjer: 1.200 € do srpnja, 150 € mjesečno. Iznos podijeli s brojem mjeseci do roka i postavi automatski prijenos.",
    },
    {
      q: "Koliko financijskih ciljeva imati odjednom?",
      a: "Jedan do tri. Dobar redoslijed je mala rezerva za hitne slučajeve, zatim skupi dug, pa jedan cilj koji te veseli.",
    },
  ],
  related: ["kako-poceti-stedjeti", "stednja-za-godisnji-odmor", "fond-za-hitne-slucajeve"],
};
