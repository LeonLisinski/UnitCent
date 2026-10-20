import type { Post } from "../types";

export const post: Post = {
  slug: "koliko-kosta-auto",
  title: "Koliko stvarno košta auto mjesečno",
  description:
    "Gorivo je samo dio priče. Kako izračunati pravi mjesečni trošak auta: registracija, osiguranje, servis, gume, parking i gubitak vrijednosti, s primjerom.",
  category: "Troškovi",
  published: "2026-11-03",
  summary: [
    "Pravi trošak auta je gorivo plus sve što dolazi jednom ili dvaput godišnje: registracija, osiguranje, servis, gume.",
    "Kad godišnje troškove podijeliš s 12, mjesečni iznos je obično znatno veći od računa za gorivo.",
    "Taj mjesečni dio vrijedi odvajati unaprijed, da registracija i servis ne budu iznenađenje.",
  ],
  body: `
Na pitanje koliko ih auto košta, većina ljudi kaže koliko mjesečno daju za gorivo. To je razumljivo, jer gorivo plaćamo često i vidimo ga. Ostalo dolazi rjeđe, pa ga zaboravimo do dana kad stigne račun za registraciju ili servis.

## Od čega se sastoji trošak auta

### Redovni troškovi

- **gorivo ili struja**
- **parking i cestarine**
- **pranje i sitnice**

### Godišnji i povremeni troškovi

- **registracija i tehnički pregled**
- **osiguranje** (obvezno, po želji i kasko)
- **redovni servis** (ulje, filteri, pregled)
- **gume** (zimske i ljetne, zamjena i čuvanje)
- **popravci** koji nisu redovni, ali se događaju

### Trošak koji ne vidiš

Auto s godinama vrijedi manje. Taj gubitak vrijednosti ne plaćaš svaki mjesec, ali ga osjetiš kad auto prodaš ili mijenjaš.

## Primjer izračuna

Ovo je primjer za manji obiteljski auto i oko 12.000 km godišnje. Tvoji iznosi bit će drukčiji, ali način računanja je isti.

::bars Primjer: mjesečni trošak auta
Gorivo | 120
Osiguranje | 35
Registracija i pregled | 20
Servis | 25
Gume | 15
Parking i cestarine | 25
Popravci (rezerva) | 20

::stat 260 € | mjesečno | primjer: gorivo je manje od polovice
::stat 3.120 € | godišnje | bez gubitka vrijednosti auta

U ovom primjeru gorivo je 120 €, a ukupni mjesečni trošak 260 €. Razlika od 140 € dolazi iz troškova koje ne plaćaš svaki mjesec.

## Kako izračunati svoj iznos

1. Uzmi zadnjih 12 mjeseci izvoda ili računa.
2. Zbroji sve što se odnosi na auto, po skupinama iz popisa.
3. Za ono čega nema u zadnjih 12 mjeseci (gume, veći servis), procijeni koliko traje i podijeli cijenu s brojem godina.
4. Ukupni godišnji iznos podijeli s 12.

::tip Godišnje troškove auta (registracija, osiguranje, servis, gume) podijeli s 12 i taj iznos odvajaj svaki mjesec na zaseban račun. Kad dođe registracija, novac je već tu.

## Kako smanjiti trošak, bez odricanja od auta

- **Usporedi osiguranje** prije obnove. Razlike među osiguravateljima mogu biti velike za isto pokriće.
- **Redovni servis** je jeftiniji od velikog popravka. Prati preporuke proizvođača.
- **Tlak u gumama** utječe na potrošnju i trošenje guma. Provjeri ga jednom mjesečno.
- **Kraće vožnje pješice ili biciklom** smanjuju potrošnju više nego što se čini, jer je hladan motor najmanje učinkovit.
- **Planiraj vožnje**: jedna vožnja s više obaveza umjesto tri odvojene.

## Auto u budžetu

Gorivo upisuj kao svakodnevni trošak. Osiguranje, registraciju i servis upiši kao fiksne troškove podijeljene na mjesece, da ih dnevni budžet već uračunava. Tako auto prestaje biti izvor iznenađenja i postaje broj koji poznaješ.
`,
  faq: [
    {
      q: "Koliko košta auto mjesečno?",
      a: "Ovisi o autu, kilometraži i osiguranju. Zbroji gorivo, osiguranje, registraciju, servis, gume, parking i rezervu za popravke za godinu dana i podijeli s 12. Ukupni iznos je obično znatno veći od samog goriva.",
    },
    {
      q: "Kako se pripremiti za registraciju auta?",
      a: "Podijeli prošlogodišnji iznos registracije i osiguranja s 12 i odvajaj taj dio svaki mjesec. Kad dođe rok, novac je već skupljen.",
    },
  ],
  related: ["godisnji-troskovi", "kategorije-troskova", "fond-za-hitne-slucajeve"],
};
