import type { Post } from "../types";

export const post: Post = {
  slug: "fiskalni-racun-qr-kod",
  title: "Fiskalni račun i QR kod: što znače JIR i ZKI i kako provjeriti račun",
  description:
    "Što mora pisati na fiskalnom računu, što su JIR, ZKI i QR kod, kako provjeriti je li račun prijavljen Poreznoj upravi i kako ti računi pomažu u praćenju troškova.",
  category: "Alati",
  published: "2026-10-20",
  summary: [
    "Fiskalizirani račun ima JIR (jedinstveni identifikator računa), ZKI (zaštitni kod izdavatelja) i QR kod.",
    "QR kod sadrži poveznicu na provjeru, JIR ili ZKI, datum i vrijeme te ukupni iznos računa.",
    "Račun možeš provjeriti skeniranjem QR koda, u aplikaciji mPorezna ili na stranici za provjeru računa Porezne uprave.",
  ],
  body: `
Svaki put kad platiš u dućanu, kafiću ili kod frizera, dobiješ fiskalni račun. Većina ljudi ga baci bez pogleda. A na njemu su podaci koji štite tebe kao kupca i koji ti mogu pomoći u praćenju troškova.

## Što je fiskalizacija

Fiskalizacija je sustav u kojem izdavatelj računa (trgovina, ugostitelj, obrtnik) svaki račun u trenutku izdavanja elektronički prijavljuje Poreznoj upravi. Cilj je smanjiti sivu ekonomiju: ako je račun prijavljen, prijavljen je i prihod.

Pravni okvir čine Zakon o fiskalizaciji (Narodne novine 89/2025) i Pravilnik o fiskalizaciji računa u krajnjoj potrošnji koji se primjenjuje od 1. siječnja 2026. Tko je sve obveznik i koje su iznimke, propisuje zakon.

## Što mora pisati na fiskalnom računu

Prema Poreznoj upravi, fiskalizirani račun uz uobičajene podatke (izdavatelj, OIB, broj računa, stavke, iznos, PDV) mora sadržavati i:

- **vrijeme izdavanja** računa
- **oznaku operatera**, osobe koja je izdala račun
- **način plaćanja** (gotovina, kartica, ostalo)
- **JIR**: jedinstveni identifikator računa
- **ZKI**: zaštitni kod izdavatelja
- **QR kod**

### Što je JIR

JIR je jedinstveni identifikator računa. Kad naplatni uređaj pošalje podatke o računu, Porezna uprava vraća JIR, a uređaj ga ispisuje na račun. JIR na računu znači da je račun zaprimljen kod Porezne uprave.

### Što je ZKI

ZKI je zaštitni kod izdavatelja. To je alfanumerički zapis koji potvrđuje vezu između izdavatelja (obveznika fiskalizacije) i izdanog računa. Generira ga sam naplatni uređaj prije slanja podataka.

### Što je u QR kodu

QR kod na računu sadrži minimalni set podataka propisan pravilnikom:

- adresu stranice Porezne uprave za provjeru računa
- JIR ili ZKI
- datum i vrijeme izdavanja
- ukupni iznos računa

QR kod ne sadrži popis kupljenih stavki. Te podatke treba pročitati s ispisanog računa.

## Kako provjeriti račun

Porezna uprava navodi tri načina provjere:

1. **Skeniranjem QR koda** kamerom mobitela, koji otvara stranicu za provjeru.
2. **U aplikaciji mPorezna.**
3. **U aplikaciji Provjera računa** Porezne uprave ([porezna.gov.hr/rn](https://porezna.gov.hr/rn/)), gdje upisuješ podatke s računa.

Provjerom vidiš je li račun stvarno prijavljen. Ako provjera ne uspije, ili ako račun nema JIR, to je razlog da se obratiš Poreznoj upravi.

### „Ovo nije fiskalizirani račun“

Neki dokumenti prethode računu, na primjer predračun ili ispis narudžbe u restoranu. Na njima mora jasno pisati da nisu fiskalizirani račun. Ako dobiješ samo takav dokument, imaš pravo tražiti pravi račun.

## Zašto ti je račun koristan

### Zaštita kupca

Račun je dokaz kupnje. Treba ti za reklamaciju, jamstvo, zamjenu proizvoda i povrat. Za veće kupnje (elektronika, kućanski aparati) čuvaj račun cijelo vrijeme jamstva. Termalni papir s vremenom izblijedi, pa je dobro račun fotografirati ili skenirati.

### Praćenje troškova

Račun je gotov zapis troška: datum, vrijeme, iznos, trgovac i, najvažnije, popis stavki. Upravo stavke otkrivaju na što zapravo trošiš. Račun iz dućana od 20,65 € može sadržavati namirnice, kozmetiku i sredstva za čišćenje, dakle tri različite kategorije.

Ako ne voliš upisivati troškove odmah, možeš skupljati račune i upisati ih jednom dnevno. Neke aplikacije, uključujući UnitCent, mogu fotografirati račun, pročitati stavke i razvrstati ih po kategorijama, a ukupni iznos i datum pročitati iz QR koda.

### Usporedba cijena

Stari računi su i mala baza cijena. Usporedi iste proizvode iz različitih trgovina i vidjet ćeš gdje je kupnja povoljnija.

## Što učiniti s računima

- **Mali svakodnevni računi:** upiši iznos u praćenje troškova i baci račun.
- **Računi za jamstvo:** fotografiraj ih i čuvaj original do isteka jamstva.
- **Računi za povrat ili reklamaciju:** čuvaj ih barem do isteka roka za povrat.
- **Računi koje dijeliš s drugima** (zajednički troškovi): fotografiraj ih da imaš dokaz tko je platio.

Više o tome kako iskoristiti račune za praćenje troškova pročitaj u članku [Kako pratiti troškove](/blog/kako-pratiti-troskove).
`,
  faq: [
    {
      q: "Što je JIR na računu?",
      a: "JIR je jedinstveni identifikator računa koji dodjeljuje Porezna uprava kad zaprimi podatke o računu. Ispisuje se na račun i potvrđuje da je račun prijavljen.",
    },
    {
      q: "Što je ZKI na računu?",
      a: "ZKI je zaštitni kod izdavatelja. To je alfanumerički zapis koji generira naplatni uređaj i koji potvrđuje vezu između izdavatelja i izdanog računa.",
    },
    {
      q: "Što sadrži QR kod na fiskalnom računu?",
      a: "Adresu stranice za provjeru računa, JIR ili ZKI, datum i vrijeme izdavanja te ukupni iznos. Popis stavki nije u QR kodu.",
    },
    {
      q: "Kako provjeriti fiskalni račun?",
      a: "Skeniraj QR kod mobitelom, koristi aplikaciju mPorezna ili upiši podatke s računa u aplikaciju Provjera računa Porezne uprave (porezna.gov.hr/rn).",
    },
  ],
  sources: [
    { label: "Porezna uprava: Kako prepoznati ispravan račun?", url: "https://porezna-uprava.gov.hr/hr/kako-prepoznati-ispravan-racun/8613" },
    { label: "Zakon o fiskalizaciji, Narodne novine 89/2025", url: "https://narodne-novine.nn.hr/clanci/sluzbeni/full/2025_06_89_1233.html" },
  ],
  related: ["kako-pratiti-troskove", "aplikacije-za-pracenje-troskova", "kategorije-troskova"],
};
