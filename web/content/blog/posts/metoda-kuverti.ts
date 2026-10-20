import type { Post } from "../types";

export const post: Post = {
  slug: "metoda-kuverti",
  title: "Metoda kuverti: budžet koji se vidi i osjeti",
  description:
    "Što je metoda kuverti, kako je primijeniti s gotovinom ili digitalno, za koje kategorije troškova najbolje radi i kako je spojiti s dnevnim budžetom.",
  category: "Budžet",
  published: "2026-11-10",
  summary: [
    "Metoda kuverti dijeli novac za trošenje po kategorijama: kad je kuverta prazna, za tu kategoriju je mjesec gotov.",
    "Najbolje radi za kategorije u kojima se najlakše pretjera: hrana, izlasci, sitnice.",
    "Danas se može voditi i bez gotovine, kao mjesečni limit po kategoriji.",
  ],
  body: `
Metoda kuverti je jedna od najstarijih metoda budžetiranja, i dalje je jedna od najučinkovitijih. Ideja je jednostavna: na početku mjeseca novac za trošenje podijeliš u kuverte, jednu po kategoriji. Hrana ide u jednu, izlasci u drugu, gorivo u treću. Kad je kuverta prazna, za tu kategoriju nema više trošenja do sljedećeg mjeseca.

## Zašto radi

Plaćanje karticom je bezbolno. Iznos se ne vidi, račun se ne smanjuje pred očima, a mali troškovi se zbrajaju neprimjetno. Kuverta vraća taj osjećaj: vidiš koliko je ostalo prije nego što kupiš.

Drugi razlog je granica. Ako za izlaske imaš 80 € i potrošiš 60 € u prvom tjednu, znaš da ostatak mjeseca moraš usporiti. Bez granice to saznaš tek kad je mjesec gotov.

## Kako početi

1. **Izračunaj koliko imaš za trošenje.** To su primanja minus fiksni troškovi i štednja. Ako nisi siguran kako, pogledaj [kako napraviti mjesečni budžet](/blog/kako-napraviti-mjesecni-budzet).
2. **Odaberi 3 do 5 kategorija.** Ne trebaš kuvertu za sve, samo za ono gdje najčešće pretjeraš.
3. **Podijeli iznos.** Ostatak koji ne ide u kuverte ostaje za nepredviđeno.
4. **Pridržavaj se pravila**: kad je kuverta prazna, ne posuđuješ iz druge bez odluke.

::bars Primjer: kuverte za mjesec
Hrana | 300
Gorivo | 120
Izlasci | 80
Sitnice i kućanstvo | 46

U ovom primjeru za trošenje je 546 € (raspoloživo nakon fiksnih troškova i štednje), podijeljeno u četiri kuverte.

## Kuverte bez gotovine

Gotovina je najvidljivija, ali nije svima praktična. Ista pravila mogu se primijeniti digitalno:

- **mjesečni limit po kategoriji** u aplikaciji za praćenje troškova
- **zasebni podračuni** u banci za pojedine kategorije
- **predplaćena kartica** samo za jednu kategoriju (npr. izlaske)

Bitno je da u trenutku kupnje vidiš koliko je ostalo, ne tek na kraju mjeseca.

::tip Počni s jednom kuvertom za kategoriju u kojoj najčešće pretjeraš. Kad ti uđe u naviku, dodaj drugu.

## Što kad kuverta ostane puna

Ako na kraju mjeseca u kuverti ostane novac, imaš tri dobre opcije: prebaciti ga u štednju, ostaviti ga kao rezervu za sljedeći mjesec ili smanjiti iznos te kuverte, jer je očito bio prevelik.

::warn Kuverta za hranu ne bi smjela biti premala. Ako svaki mjesec ostaneš bez novca za hranu prije kraja, iznos nije realan i stvara stres. Bolje je smanjiti izlaske nego živjeti na rubu.

## Kuverte i dnevni budžet

Kuverte pokazuju koliko je ostalo po kategoriji, a dnevni budžet koliko je ostalo danas. Zajedno daju potpunu sliku: koliko smiješ potrošiti i na što. U UnitCentu kategorija može imati mjesečni limit (Premium), a dnevni budžet ostaje isti za sve.
`,
  faq: [
    {
      q: "Što je metoda kuverti?",
      a: "Novac za trošenje na početku mjeseca dijeliš po kategorijama (hrana, izlasci, gorivo). Kad je novac za neku kategoriju potrošen, do sljedećeg mjeseca u njoj više ne trošiš.",
    },
    {
      q: "Može li metoda kuverti bez gotovine?",
      a: "Može. Umjesto papirnatih kuverti koristi mjesečni limit po kategoriji u aplikaciji ili zasebne podračune u banci. Važno je da prije kupnje vidiš koliko je ostalo.",
    },
  ],
  related: ["kako-napraviti-mjesecni-budzet", "kategorije-troskova", "nulti-budzet"],
};
