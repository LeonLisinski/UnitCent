import type { Post } from "../types";

export const post: Post = {
  slug: "kako-vratiti-dugove",
  title: "Kako vratiti dugove: metoda snježne grude i lavine",
  description:
    "Dvije provjerene metode za otplatu više dugova: snježna gruda (najmanji prvo) i lavina (najveća kamata prvo). Kako odabrati, s primjerom i planom korak po korak.",
  category: "Budžet",
  published: "2027-02-02",
  summary: [
    "Kod više dugova najprije plati minimalne rate svih, a sav višak usmjeri na jedan dug.",
    "Snježna gruda: najmanji dug prvi, za brze pobjede i motivaciju. Lavina: najveća kamata prva, za najmanji trošak.",
    "Kad jedan dug nestane, njegova rata ide na sljedeći, pa otplata svakim korakom ubrzava.",
  ],
  body: `
Minus na računu, kreditna kartica, kredit za auto, dug prijatelju. Kad dugova ima više, teško je znati odakle početi. Dvije metode daju jasan plan: obje počinju isto, a razlikuju se samo u redoslijedu.

## Zajedničko pravilo

1. Napravi popis svih dugova: iznos, kamata, minimalna rata.
2. Na **sve** dugove plaćaj minimalnu ratu, da ne nastanu zatezne kamate.
3. Sav dodatni novac usmjeri na **jedan** dug.
4. Kad je taj dug otplaćen, njegovu ratu i višak usmjeri na sljedeći.

Rata koja se „oslobodi“ ne nestaje u budžetu, nego se dodaje sljedećem dugu. Zato otplata svakim korakom ubrzava.

## Primjer: tri duga

::bars Primjer: dugovi
Kreditna kartica | 900
Minus na računu | 600
Kredit za namještaj | 2400

Uz kamate: kartica 18 %, minus 12 %, kredit 8 % (primjer). Za otplatu je dostupno 250 € mjesečno iznad minimalnih rata.

## Metoda snježne grude

Dugove poredaj **od najmanjeg prema najvećem**, bez obzira na kamatu. Prvi je minus (600 €), zatim kartica (900 €), pa kredit (2.400 €).

- **Prednost:** prvi dug nestane brzo. Vidljiva pobjeda motivira da nastaviš.
- **Mana:** možeš platiti malo više kamata ukupno.

## Metoda lavine

Dugove poredaj **od najveće kamate prema najmanjoj**. Prva je kartica (18 %), zatim minus (12 %), pa kredit (8 %).

- **Prednost:** najmanje ukupnih kamata, najjeftiniji put.
- **Mana:** ako je dug s najvećom kamatom i najveći, prva pobjeda dolazi sporije.

::stat Gruda | motivacija | najmanji dug prvi
::stat Lavina | najmanji trošak | najveća kamata prva

::tip Ako ti je teško ostati motiviran, kreni snježnom grudom. Ako ti je motivacija ok, a želiš platiti najmanje, kreni lavinom. Najvažnije je odabrati i ne stati.

## Odakle dodatni novac

- otkazane pretplate i promjena tarife
- dio božićnice, bonusa ili povrata (pogledaj [što s dodatnim novcem](/blog/bozicnica-i-dodatni-novac))
- prodaja stvari koje ne koristiš
- privremeno manje izlazaka

## Mala rezerva i dok vraćaš

Bez ikakve rezerve, prvi neočekivani trošak vraća te u dug. Zato je dobro i dok vraćaš dugove imati malu rezervu, npr. 300 do 500 €.

::warn Ako ne možeš platiti ni minimalne rate, javi se vjerovniku što prije i pitaj za reprogram ili odgodu. Propuštene rate donose zatezne kamate i troškove opomena.

## U budžetu

Minimalne rate upiši kao fiksne troškove, a dodatnu otplatu kao štednju (oduzima se prije dnevnog budžeta). Tako dnevni budžet pokazuje koliko smiješ potrošiti dok dugovi nestaju.
`,
  faq: [
    {
      q: "Koju metodu otplate dugova odabrati?",
      a: "Snježna gruda (najmanji dug prvi) bolje motivira jer brzo donosi prvu pobjedu. Lavina (najveća kamata prva) košta najmanje ukupno. Obje rade ako ih se držiš.",
    },
    {
      q: "Trebam li štedjeti dok vraćam dugove?",
      a: "Malu rezervu da, npr. 300 do 500 €, kako te prvi neočekivani trošak ne bi vratio u dug. Ostatak viška ide na otplatu.",
    },
  ],
  related: ["kako-izaci-iz-minusa", "gotovinski-kredit-ili-stednja", "bozicnica-i-dodatni-novac"],
};
