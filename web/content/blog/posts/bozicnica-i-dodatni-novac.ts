import type { Post } from "../types";

export const post: Post = {
  slug: "bozicnica-i-dodatni-novac",
  title: "Božićnica, bonus ili povrat: što pametno napraviti s dodatnim novcem",
  description:
    "Dodatni novac lako nestane u tjedan dana. Jednostavno pravilo za podjelu božićnice, bonusa ili povrata: dio za dug ili rezervu, dio za cilj, dio za užitak.",
  category: "Štednja",
  published: "2026-12-01",
  summary: [
    "Dodatni novac koji nije planiran najčešće se potroši na sitnice, pa ga vrijedi podijeliti odmah kad stigne.",
    "Jednostavno pravilo: dio za skupe dugove ili rezervu, dio za cilj, dio za užitak bez griže savjesti.",
    "Odluka unaprijed, prije nego novac stigne, puno je lakša od odluke kad je već na računu.",
  ],
  body: `
Božićnica, godišnji bonus, regres, povrat poreza, novac od prodaje stvari. Svaki od njih je mali dar budžetu, jer nije potreban za redovne troškove. Upravo zato lako nestane: nema plana, pa se potroši na ono što se nađe.

## Zašto dodatni novac brzo nestaje

Novac koji stigne izvan redovne plaće psihološki djeluje kao „slobodan“. Lakše ga je potrošiti na nešto što inače ne bi kupio, i to u malim iznosima koji se ne pamte. Za dva tjedna ostane pitanje gdje je otišao.

Pomaže jedno: **odluka prije nego što novac stigne.**

## Pravilo podjele

Jednostavna podjela koja radi za većinu ljudi:

::stat 50 % | sigurnost | skupi dug ili fond za hitne slučajeve
::stat 30 % | cilj | štednja za nešto konkretno
::stat 20 % | užitak | bez griže savjesti

Postoci nisu zakon. Ako imaš skupi dug (minus na računu, kreditna kartica), veći dio ide tamo. Ako je fond za hitne slučajeve već pun, veći dio može ići cilju.

## 1. Sigurnost: dug ili rezerva

- **Skupi dug prvi.** Minus na tekućem računu i dug na kreditnoj kartici obično imaju najviše kamate. Svaki euro koji ga smanji je sigurna „zarada“.
- **Ako dugova nema**, dio ide u fond za hitne slučajeve dok ne dođe do cilja.

::calc fond-za-hitne | Koliko mi treba za fond za hitne slučajeve? | Cilj i koliko ti mjeseci treba do njega

## 2. Cilj: nešto konkretno

Odaberi jedan cilj s iznosom i rokom: godišnji odmor, novi laptop, tečaj, polog za stan. Dodatni novac ga može značajno približiti, a vidljiv napredak motivira da nastaviš i redovnom štednjom.

## 3. Užitak: dopušteno i planirano

Dio dodatnog novca smiješ potrošiti na nešto što te veseli. Planirani užitak ne kvari budžet, nego ga čini održivim. Kad nema ničega za sebe, budžet se obično napusti.

::tip Kad novac stigne, odmah ga prebaci po dijelovima: sigurnost i cilj na zasebne račune, užitak ostaje. Ono što nije na tekućem računu, ne trošiš usput.

## Primjer

Za božićnicu od 400 €: 200 € ide za smanjenje minusa, 120 € na štednju za ljetovanje, 80 € za blagdanski izlazak. Novac je potrošen, ali svaki dio ima svoju svrhu.

::warn Ne računaj na dodatni novac u redovnom budžetu dok ga nemaš. Ako božićnica kasni ili je manja nego što si mislio, mjesečni plan ne smije ovisiti o njoj.

## Dodatni novac u budžetu

Ako dodatni novac upišeš kao prihod u mjesecu kad stigne, dio za užitak povećava ono što smiješ potrošiti, a dio za štednju i dug odmah izdvojiš. U UnitCentu se neplanirani prihod dodaje raspoloživom iznosu tog mjeseca, pa se odmah vidi u dnevnom budžetu.
`,
  faq: [
    {
      q: "Što napraviti s božićnicom?",
      a: "Odluči unaprijed i podijeli je čim stigne: dio za skupe dugove ili fond za hitne slučajeve, dio za konkretan cilj štednje, a dio za nešto što te veseli.",
    },
    {
      q: "Je li bolje vratiti dug ili štedjeti?",
      a: "Skupi dug (minus, kreditna kartica) najčešće ima veću kamatu od bilo koje štednje, pa ga vrijedi prvo smanjiti. Malu rezervu za hitne slučajeve ipak je dobro imati i dok vraćaš dug.",
    },
  ],
  related: ["fond-za-hitne-slucajeve", "kako-izaci-iz-minusa", "kako-poceti-stedjeti"],
};
