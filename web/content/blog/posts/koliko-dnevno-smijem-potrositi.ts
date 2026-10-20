import type { Post } from "../types";

export const post: Post = {
  slug: "koliko-dnevno-smijem-potrositi",
  title: "Koliko dnevno smijem potrošiti? Jednostavna formula za dnevni budžet",
  description:
    "Izračunaj svoj dnevni budžet u tri koraka: primanja minus obavezni troškovi i štednja, podijeljeno s danima do kraja mjeseca. Uz primjer s brojkama.",
  category: "Budžet",
  published: "2026-10-20",
  summary: [
    "Dnevni budžet = (primanja − obavezni troškovi − štednja − već potrošeno) ÷ preostali dani u mjesecu, uključujući današnji.",
    "Obavezne troškove i štednju makni na početku mjeseca, prije nego što išta potrošiš.",
    "Računaj ga jednom ujutro. Ako danas potrošiš manje, sutrašnji budžet malo naraste, a ako potrošiš više, malo se smanji.",
  ],
  body: `
Mjesečni budžet od nekoliko stotina eura teško je osjetiti. Kad u utorak stojiš pred blagajnom, ne pomaže ti broj „546 € za ovaj mjesec“. Pomaže ti jedan manji broj: koliko smiješ potrošiti **danas**, a da do kraja mjeseca ostaneš u planu. Taj broj zovemo dnevni budžet.

U ovom članku pokazujemo formulu, primjer s brojkama i najčešće greške.

## Formula u jednoj rečenici

Od mjesečnih primanja oduzmi obavezne troškove i štednju, zatim oduzmi ono što si ovaj mjesec već potrošio, a ostatak podijeli s brojem dana koji su ostali do kraja mjeseca, uključujući današnji.

> Dnevni budžet = (primanja − obavezno − štednja − potrošeno prije današnjeg dana) ÷ preostali dani uključujući danas

Sve što potrošiš tijekom dana oduzimaš od tog iznosa. Razlika je ono što ti je **ostalo za danas**.

## Korak 1: koliko ti stvarno ostaje za trošenje

Prvo izračunaj iznos koji je slobodan za svakodnevne troškove:

- **Primanja**: neto plaća i druga redovna primanja koja stižu ovaj mjesec.
- **Obavezno**: sve što moraš platiti bez obzira na to kako se ponašaš. Najam ili rata kredita, režije, mobitel, internet, osiguranje, vrtić, pretplate.
- **Štednja**: iznos koji odvajaš čim stigne plaća. Ako ga ostaviš „za kraj mjeseca“, obično ga neće biti.

Primjer:

| Stavka | Iznos |
| --- | --- |
| Primanja | 1.468,00 € |
| Obavezno (11 stavki) | − 771,33 € |
| Štednja | − 150,00 € |
| **Raspoloživo za trošenje** | **546,67 €** |

Tih 546,67 € pokriva hranu, gorivo, kavu, izlaske, odjeću i sve ostalo što nije unaprijed dogovoreno.

## Korak 2: oduzmi ono što si već potrošio

Formula radi bilo koji dan u mjesecu, ne samo prvog. Recimo da je danas 14. u mjesecu od 30 dana i da si do jutros potrošio 207,40 €. Ostaje ti:

546,67 € − 207,40 € = **339,27 €**

Važno: u „potrošeno“ ne ubrajaš pretplate i režije koje si već stavio pod obavezno. Inače bi ih oduzeo dvaput.

## Korak 3: podijeli s danima koji su ostali

Od 14. do 30. uključivo ima 17 dana. Današnji dan se broji jer danas još trošiš.

339,27 € ÷ 17 = **19,96 €**

To je tvoj dnevni budžet za danas. Ako na ručak potrošiš 8 €, ostalo za danas je 11,96 €.

## Zašto se broj mijenja svaki dan (i zašto je to dobro)

Dnevni budžet računaš jednom, ujutro, i on vrijedi cijeli dan. Sutra ujutro računaš ponovno s novim stanjem:

- Ako danas potrošiš manje od 19,96 €, ušteda se rasporedi na preostale dane i sutrašnji budžet je malo veći.
- Ako potrošiš više, razlika se također rasporedi, pa je sutrašnji budžet malo manji.

Tako jedan skup dan ne ruši cijeli mjesec. Ne moraš ništa „vraćati“ isti tjedan; formula to sama rasporedi. Ipak, ako nekoliko dana zaredom budeš preko, broj će brzo padati, i to je signal da usporiš.

## Najčešće greške

### Zaboravljeni godišnji troškovi

Registracija auta, osiguranje kuće ili godišnja pretplata ne dolaze svaki mjesec, ali dolaze. Ako ih ne planiraš, jedan mjesec u godini bit će katastrofa. Rješenje je da godišnji iznos podijeliš s 12 i mjesečno ga stavljaš pod obavezno ili u zasebnu štednju. Više o tome u članku [Godišnji troškovi koje svi zaborave](/blog/godisnji-troskovi).

### Računanje s bruto plaćom

Uvijek računaj s iznosom koji stvarno sjeda na račun. Ako primanja variraju, uzmi niži, siguran iznos. Pogledaj i [budžet s neredovitim primanjima](/blog/budzet-neredovita-primanja).

### Dnevni budžet kao cilj

19,96 € nije iznos koji moraš potrošiti. To je gornja granica. Dani kad potrošiš nula eura sasvim su normalni i pomažu ti za dane kad ide veća kupnja.

### Velike kupnje bez plana

Tjedna kupnja u dućanu od 60 € pojest će budžet za tri dana. To je u redu dok god znaš da sljedećih dana trošiš manje. Ako ti to smeta, napravi zasebnu stavku „namirnice“ s tjednim iznosom.

## Kako to pratiti bez tablice

Formulu možeš voditi na papiru ili u tablici: svako jutro upišeš potrošeno do sada i podijeliš s preostalim danima. Radi, ali traži disciplinu. Zato smo napravili UnitCent: aplikacija sama računa dnevni budžet iz tvog plana, pretplate knjiži automatski, a početni ekran pokazuje koliko ti je ostalo za danas.

Bez obzira na alat, najvažnije je da broj vidiš **prije** kupnje, a ne na kraju mjeseca.
`,
  faq: [
    {
      q: "Je li današnji dan uključen u preostale dane?",
      a: "Da. Danas još trošiš, pa se današnji dan broji. Ako je 14. u mjesecu od 30 dana, preostalih dana je 17.",
    },
    {
      q: "Što ako sam jedan dan potrošio puno više?",
      a: "Razlika se rasporedi na preostale dane, pa je dnevni budžet sljedećih dana malo manji. Jedan skup dan ne ruši mjesec, ali nekoliko zaredom brzo smanji iznos.",
    },
    {
      q: "Ulaze li pretplate u potrošeno?",
      a: "Ne. Pretplate i drugi fiksni troškovi već su oduzeti kao „obavezno“. Kad bi ih brojao i u potrošeno, oduzeo bi ih dvaput.",
    },
    {
      q: "Što ako počnem pratiti usred mjeseca?",
      a: "Procijeni koliko si već potrošio ovaj mjesec, na primjer iz stanja na računu, i taj iznos upiši kao potrošeno prije današnjeg dana. Formula radi od bilo kojeg dana.",
    },
  ],
  related: ["kako-napraviti-mjesecni-budzet", "pravilo-50-30-20", "kako-pratiti-troskove"],
};
