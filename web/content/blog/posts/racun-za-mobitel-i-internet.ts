import type { Post } from "../types";

export const post: Post = {
  slug: "racun-za-mobitel-i-internet",
  title: "Kako smanjiti račun za mobitel i internet",
  description:
    "Provjeri koliko podataka i minuta stvarno trošiš, usporedi tarife, iskoristi kraj obveznog razdoblja i pakete za kućanstvo te smanji mjesečni račun bez gubitka kvalitete.",
  category: "Troškovi",
  published: "2027-01-26",
  summary: [
    "Mnogi plaćaju tarifu veću od onoga što stvarno koriste. Prvi korak je pogledati potrošnju u zadnja tri mjeseca.",
    "Kraj ugovorne obveze je najbolji trenutak za pregovor ili promjenu operatera.",
    "Pakete i dodatke koje ne koristiš (TV paketi, osiguranja uređaja, usluge s naplatom) vrijedi provjeriti na računu.",
  ],
  body: `
Mobitel i internet su troškovi koje plaćamo svaki mjesec bez razmišljanja. Ugovor potpišemo, tarifu zaboravimo, a račun stiže. Upravo zato su često mjesto gdje se može uštedjeti bez ikakvog odricanja.

## Korak 1: koliko stvarno trošiš

U aplikaciji ili na računu operatera pogledaj potrošnju u zadnja tri mjeseca:

- koliko mobilnih podataka (GB)
- koliko minuta i poruka
- koliko si platio dodatno (roaming, posebne usluge)

Ako trošiš 5 GB, a plaćaš 50 GB ili neograničeno, plaćaš rezervu koju ne koristiš.

::stat 3 mjeseca | potrošnje | prije promjene tarife
::stat 1 | pitanje | trebam li stvarno sve što plaćam?

## Korak 2: usporedi tarife

Usporedi tarife više operatera za svoju stvarnu potrošnju, uključujući manje operatere i tarife bez ugovorne obveze. Gledaj ukupnu cijenu kroz cijelo razdoblje, ne samo prve mjesece s popustom.

::tip Kod ponude „prva tri mjeseca upola cijene“ izračunaj prosječnu mjesečnu cijenu kroz cijelo razdoblje obveze. Tek tada usporedi.

## Korak 3: kraj obveznog razdoblja

Kad istekne ugovorna obveza, imaš najviše pregovaračke moći. Prije isteka:

1. zapiši trenutne uvjete i cijenu
2. pogledaj ponude konkurencije
3. nazovi operatera i pitaj za bolju ponudu ili nižu tarifu
4. ako ne dobiješ ništa, razmisli o prelasku (broj se može zadržati)

## Korak 4: pregled računa

Na računu potraži stavke koje ne prepoznaješ:

- dodatni TV paketi koje ne gledaš
- osiguranje uređaja koje ti ne treba
- usluge s posebnom naplatom (pretplate preko broja)
- najam opreme koju bi mogao kupiti

::warn Usluge s posebnom naplatom (igre, glasanja, pretplate preko SMS-a) ponekad se aktiviraju slučajno. Ako ih vidiš na računu, javi se operateru; obično ih možeš i trajno blokirati.

## Kućanstvo kao cjelina

Ako u kućanstvu ima više korisnika, paketi za obitelj (više SIM kartica i kućni internet) mogu biti povoljniji od odvojenih ugovora. Usporedi ukupni iznos svih ugovora s paketom.

## Koliko vrijedi ušteda

Ušteda od 10 € mjesečno na jednom ugovoru je 120 € godišnje. Na dva ili tri ugovora u kućanstvu brojka postaje ozbiljna.

::calc pretplate | Koliko me koštaju svi mjesečni ugovori? | Zbroji mobitel, internet i pretplate

## U budžetu

Račun za mobitel i internet upiši kao fiksni trošak s datumom naplate. Kad se iznos promijeni (nova tarifa, istek popusta), odmah ga ažuriraj, da dnevni budžet ostane točan.
`,
  faq: [
    {
      q: "Kako smanjiti račun za mobitel?",
      a: "Pogledaj stvarnu potrošnju u zadnja tri mjeseca, usporedi tarife više operatera za tu potrošnju i pregovaraj ili promijeni operatera na kraju ugovorne obveze. Provjeri i dodatne usluge na računu.",
    },
    {
      q: "Mogu li zadržati broj ako promijenim operatera?",
      a: "Da, broj se može prenijeti kod promjene operatera. Prije prijenosa provjeri ističe li ugovorna obveza kod trenutnog operatera.",
    },
  ],
  related: ["pretplate-koje-zaboravimo", "kako-smanjiti-racune-za-rezije", "godisnji-pregled-troskova"],
};
