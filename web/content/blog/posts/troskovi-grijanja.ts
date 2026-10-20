import type { Post } from "../types";

export const post: Post = {
  slug: "troskovi-grijanja",
  title: "Kako smanjiti troškove grijanja ove zime",
  description:
    "Praktični načini za niži račun za grijanje: temperatura po prostoriji, prozračivanje, brtvljenje, radijatori i kako zimski trošak rasporediti kroz cijelu godinu.",
  category: "Troškovi",
  published: "2026-11-24",
  summary: [
    "Svaki stupanj niže u prostoriji smanjuje potrošnju energije za grijanje, a razliku između 21 i 20 °C malo tko osjeti.",
    "Najveći gubici su kroz prozore i vrata: brtve i zavjese su jeftine, a učinak se vidi na računu.",
    "Zimske račune vrijedi rasporediti kroz cijelu godinu, da prosinac i siječanj ne budu šok.",
  ],
  body: `
Zima je mjesec za mjesecom viših računa. Bilo da grijete plinom, strujom, drvima ili toplinskom stanicom, dio troška ovisi o cijeni koju ne možete birati, a dio o navikama koje možete promijeniti. Ovo su promjene koje ne traže velika ulaganja.

## Temperatura: stupanj po stupanj

Uobičajena preporuka je da se snižavanjem temperature za jedan stupanj potrošnja energije za grijanje smanji za nekoliko posto. Razliku između 21 i 20 °C u dnevnom boravku većina ljudi jedva primijeti.

::stat 20 °C | dnevni boravak | ugodno za većinu
::stat 17 °C | spavaća soba | za san je dovoljno i hladnije

- **Ne griji prazne prostorije** jednako kao one u kojima boraviš. Zatvori vrata.
- **Noću i kad nisi doma** spusti temperaturu za nekoliko stupnjeva, ali ne gasi grijanje potpuno ako je jako hladno, jer ponovno zagrijavanje hladnih zidova traje.
- **Termostatski ventili** na radijatorima omogućuju različitu temperaturu po prostoriji.

## Prozračivanje: kratko i jako

Prozor stalno na kip hladi zidove i gubi toplinu satima. Bolje je nekoliko puta dnevno otvoriti prozore širom na 5 do 10 minuta. Zrak se zamijeni, a zidovi ostanu topli.

## Gubici kroz prozore i vrata

- **Brtve** na prozorima i vratima su jeftine i postavljaju se za jedno popodne.
- **Teške zavjese** noću zadržavaju toplinu. Danju ih otvori na sunčanoj strani.
- **Traka ispod ulaznih vrata** zaustavlja propuh.

::tip Upali svijeću ili upaljač uz rub prozora po vjetrovitom danu. Ako plamen titra, tu ulazi hladan zrak.

## Radijatori

- **Ne zaklanjaj ih** namještajem i dugim zavjesama.
- **Odzrači ih** na početku sezone ako su hladni pri vrhu.
- **Reflektirajuća folija** iza radijatora na vanjskom zidu vraća dio topline u prostoriju.

## Zimski račun kroz cijelu godinu

Grijanje je predvidiv trošak: znaš da dolazi svake zime. Pogledaj koliko si prošle godine platio od studenoga do ožujka, zbroji i podijeli s 12. Taj iznos odvajaj svaki mjesec, i ljeti. Neki dobavljači nude i jednake mjesečne rate kroz godinu s godišnjim obračunom; provjeri što nudi tvoj.

::bars Primjer: zimski računi za grijanje
Studeni | 90
Prosinac | 140
Siječanj | 160
Veljača | 130
Ožujak | 80

U ovom primjeru zima košta 600 €, odnosno 50 € mjesečno kroz cijelu godinu.

::warn Grijalice na struju brzo zagriju malu prostoriju, ali za dugotrajno grijanje većeg prostora mogu biti skupe. Provjeri snagu uređaja i cijenu struje prije nego što ih koristiš satima.

## Grijanje u budžetu

Ako račun za grijanje dolazi mjesečno, upiši ga kao fiksni trošak. Ako plaćaš drva ili pelete odjednom, podijeli iznos s brojem mjeseci grijanja ili s cijelom godinom, da dnevni budžet uvijek uključuje i zimu.
`,
  faq: [
    {
      q: "Koja je najbolja temperatura u stanu zimi?",
      a: "Za dnevni boravak većini je ugodno oko 20 °C, a za spavaću sobu dovoljno je i 17 do 18 °C. Svaki stupanj niže smanjuje potrošnju energije.",
    },
    {
      q: "Je li bolje držati grijanje stalno upaljeno ili ga gasiti?",
      a: "Kad nisi doma ili noću, spusti temperaturu za nekoliko stupnjeva umjesto potpunog gašenja, osobito po jakoj hladnoći, jer je ponovno zagrijavanje ohlađenih zidova sporo.",
    },
  ],
  related: ["kako-smanjiti-racune-za-rezije", "godisnji-troskovi", "troskovi-zivota-u-hrvatskoj"],
};
