import type { Post } from "../types";

export const post: Post = {
  slug: "koliko-kosta-kucni-ljubimac",
  title: "Koliko košta kućni ljubimac mjesečno i godišnje",
  description:
    "Hrana, veterinar, cijepljenje, oprema, čuvanje: koliko stvarno košta pas ili mačka, kako izračunati vlastiti iznos i kako se pripremiti za veće veterinarske račune.",
  category: "Troškovi",
  published: "2027-02-16",
  summary: [
    "Trošak ljubimca nije samo hrana: veterinar, cijepljenja, oprema, njega i čuvanje dolaze kroz godinu.",
    "Veterinarski hitni slučajevi su najveći rizik, pa vrijedi imati malu rezervu samo za ljubimca.",
    "Godišnje troškove podijeli s 12 i odvajaj svaki mjesec, kao za auto ili registraciju.",
  ],
  body: `
Ljubimac je član obitelji, a i član budžeta. Mjesečni trošak hrane je očit, ali ostalo dolazi rjeđe i zato se lako podcijeni. Prije nego uzmeš ljubimca, ili ako ga već imaš i želiš pregled, ovo su skupine troškova.

## Redovni troškovi

- **hrana i poslastice**
- **pijesak** (za mačke)
- **njega**: šamponi, šišanje, kandže
- **antiparazitici** (protiv buha, krpelja, glista)

## Godišnji troškovi

- **cijepljenja i pregledi** kod veterinara
- **oprema**: povodac, ogrlica, krevet, igračke koje se troše
- **čuvanje** kad putuješ (hotel za ljubimce, čuvar)
- **osiguranje** ljubimca, ako ga imaš

## Jednokratni i neočekivani troškovi

- početna oprema, mikročip, kastracija ili sterilizacija
- **bolest ili ozljeda**: najveći i najmanje predvidiv trošak

## Primjer: pas srednje veličine

Ovo je primjer; tvoji iznosi ovise o veličini, prehrani i zdravlju ljubimca.

::bars Primjer: mjesečni trošak psa srednje veličine
Hrana | 45
Antiparazitici | 10
Veterinar (godišnje ÷ 12) | 12
Oprema i igračke | 6
Njega | 5
Čuvanje (godišnje ÷ 12) | 10

::stat 88 € | mjesečno | primjer za psa srednje veličine
::stat 1.056 € | godišnje | bez hitnih slučajeva

## Rezerva za veterinara

Operacija ili liječenje mogu stajati nekoliko stotina eura, a ponekad i više. Dvije opcije:

- **rezerva samo za ljubimca**, npr. 300 do 500 €, na zasebnom računu
- **osiguranje ljubimca**, ako je dostupno i isplativo za tvoju situaciju; pažljivo pročitaj što pokriva

::calc cilj-stednje | Koliko brzo mogu skupiti rezervu za veterinara? | Upiši iznos i mjesečni dio

::tip Redovni pregledi i cijepljenja jeftiniji su od liječenja. Prevencija je i ovdje najbolja ušteda.

## Kako smanjiti trošak, bez štednje na zdravlju

- **Kupuj hranu u većim pakiranjima**, ako je ljubimac na njoj već dulje i dobro je podnosi.
- **Usporedi cijene** istih proizvoda u više trgovina i internet trgovina.
- **Dogovori se s prijateljima** za uzajamno čuvanje ljubimaca dok ste na putu.
- **Igračke od kuće**: karton, stara lopta, uže, za većinu ljubimaca jednako zanimljivi.

::warn Ne mijenjaj hranu naglo zbog cijene. Promjenu radi postupno i, ako ljubimac ima posebne potrebe, uz savjet veterinara.

## U budžetu

Ljubimca uvedi kao zasebnu kategoriju. Hranu i redovne troškove prati kao svakodnevne, a godišnje (cijepljenja, čuvanje) podijeli s 12. Tako znaš koliko stvarno košta i nisi iznenađen računom.
`,
  faq: [
    {
      q: "Koliko mjesečno košta pas?",
      a: "Ovisi o veličini, hrani i zdravlju. Uz hranu, uračunaj antiparazitike, veterinara, opremu, njegu i čuvanje. Za psa srednje veličine primjer je oko 90 € mjesečno, bez hitnih slučajeva.",
    },
    {
      q: "Trebam li rezervu za veterinara?",
      a: "Da, jer bolest ili ozljeda mogu stajati nekoliko stotina eura. Mala rezerva samo za ljubimca ili osiguranje smanjuju rizik od velikog iznenadnog troška.",
    },
  ],
  related: ["kategorije-troskova", "godisnji-troskovi", "fond-za-hitne-slucajeve"],
};
