import type { Post } from "../types";

export const post: Post = {
  slug: "kako-pratiti-troskove",
  title: "Kako pratiti troškove (a da ne odustaneš nakon tjedan dana)",
  description:
    "Bilježnica, tablica, bankovna aplikacija ili aplikacija za troškove: usporedba metoda praćenja troškova i navike koje pomažu da izdržiš duže od tjedan dana.",
  category: "Troškovi",
  published: "2026-10-20",
  summary: [
    "Najbolja metoda praćenja troškova je ona koju ćeš koristiti svaki dan. Brzina unosa važnija je od broja kategorija.",
    "Unosi trošak odmah nakon plaćanja. Navečer se sjetiš tek dijela troškova.",
    "Jednom tjedno odvoji pet minuta za pregled: gdje si bio preko plana i zašto.",
  ],
  body: `
Praćenje troškova zvuči jednostavno: zapiši što potrošiš. U praksi većina ljudi izdrži desetak dana. Zatim propuste jedan dan, pa dva, i bilježnica završi u ladici. Problem obično nije volja nego metoda koja traži previše truda.

Ovaj članak uspoređuje najčešće metode i daje navike koje stvarno pomažu.

## Zašto uopće pratiti troškove

Bez praćenja imaš osjećaj, a ne podatak. Većina nas misli da zna gdje odlazi novac, dok ne vidi zbroj. Česti „aha“ trenuci:

- male svakodnevne kupnje (kava, pekara, kiosk) zbrojene kroz mjesec
- dostava hrane koja je „samo ponekad“
- pretplate koje se naplaćuju, a ne koriste se
- gotovina koja nestane bez traga

Praćenje nije cilj samo po sebi. Cilj je donijeti bolju odluku **prije** sljedeće kupnje.

## Četiri metode: prednosti i mane

### 1. Bilježnica ili papir

Zapisuješ datum, iznos i na što si potrošio.

- **Za:** ništa ne košta, nema tehnike, pisanje rukom pojačava svjesnost.
- **Protiv:** nemaš je uvijek uz sebe, zbrajanje traje, nema pregleda po kategorijama.

Dobra je za prvi mjesec, kad želiš samo vidjeti stanje.

### 2. Tablica (Excel, Google Sheets, Numbers)

Retci su troškovi, stupci datum, iznos i kategorija. Zbrojevi i grafovi rade se formulama.

- **Za:** potpuna kontrola, besplatno, možeš je prilagoditi do zadnjeg detalja.
- **Protiv:** unos na mobitelu je spor, lako se pokvari formula, traži disciplinu.

Odlična je za ljude koji vole brojke i jednom tjedno prepisuju troškove iz izvoda.

### 3. Aplikacija banke

Većina hrvatskih banaka u mobilnom bankarstvu prikazuje troškove po kategorijama na temelju kartičnih plaćanja.

- **Za:** automatski je, ne moraš ništa upisivati.
- **Protiv:** ne vidi gotovinu ni troškove s drugih računa i kartica, kategorije su često netočne (trgovački centar nije „hrana“), i gledaš unazad, a ne unaprijed.

Korisna je za provjeru, ali rijetko daje odgovor koliko smiješ potrošiti danas.

### 4. Aplikacija za praćenje troškova

Aplikacije za budžet kombiniraju unos, kategorije, ponavljajuće troškove i plan. Neke se spajaju na banku, neke se temelje na ručnom unosu ili skeniranju računa. Usporedbu najčešćih opcija pronađi u članku [Aplikacije za praćenje troškova](/blog/aplikacije-za-pracenje-troskova).

- **Za:** unos je brz, uvijek je pri ruci, pretplate se ponavljaju same, pregled je automatski.
- **Protiv:** treba odabrati aplikaciju koja ti odgovara, neke su složene ili skupe.

## Navike koje odlučuju hoćeš li izdržati

### Unesi trošak odmah

Najvažnije pravilo. Trošak upisan na blagajni ili odmah nakon nje je točan. Trošak koji pokušavaš rekonstruirati navečer često je pogrešan ili zaboravljen. Ako unos traje dulje od nekoliko sekundi, nećeš ga raditi odmah. Zato je brzina unosa važnija od svih drugih funkcija.

### Manje kategorija

Deset kategorija znači deset odluka pri svakom unosu. Kreni s pet ili šest: hrana, prijevoz, stan, izlasci, zdravlje, ostalo. Detalje dodaj kasnije, ako ih stvarno trebaš. Vodič za odabir je u članku [Kategorije troškova](/blog/kategorije-troskova).

### Fiksne troškove upiši jednom

Najam, režije i pretplate ne trebaš upisivati svaki mjesec ručno. Unesi ih jednom kao ponavljajuće i fokusiraj se samo na varijabilne troškove, jer tamo donosiš odluke.

### Ne preskači gotovinu

Gotovina je najčešća rupa u praćenju. Kad podigneš gotovinu, nemoj je upisati kao trošak, nego upisuj ono na što je potrošiš. Ako je to previše posla, podizanje gotovine upiši kao trošak „ostalo“ i barem znaš koliko je otišlo.

### Pregled jednom tjedno

Pet minuta nedjeljom: koliko si potrošio, gdje si bio iznad plana i ima li troškova koje nisi unio. Ne treba analiza, treba samo pogled.

### Ne odustaj nakon propuštenog dana

Ako propustiš dan ili tjedan, nemoj kretati ispočetka. Procijeni propušteno, upiši jedan zbirni iznos i nastavi. Nesavršeno praćenje je mnogo bolje nego nikakvo.

## Računi kao izvor podataka

Svaki fiskalni račun u Hrvatskoj sadrži datum, vrijeme, ukupni iznos i QR kod. Ako čuvaš račune, možeš ih upisati kasnije, a neke aplikacije, uključujući UnitCent, mogu ih skenirati i razvrstati stavke po kategorijama. Što sve piše na računu, objašnjavamo u članku [Fiskalni račun i QR kod](/blog/fiskalni-racun-qr-kod).

## Što pratiti na kraju mjeseca

Tri pitanja su dovoljna:

1. Koliko sam ukupno potrošio na varijabilne troškove u odnosu na plan?
2. Koje su mi tri najveće kategorije?
3. Što ću sljedeći mjesec napraviti drugačije?

Ako odgovor na treće pitanje bude jedna konkretna stvar, praćenje je ispunilo svrhu.
`,
  faq: [
    {
      q: "Koliko dugo treba pratiti troškove?",
      a: "Barem tri mjeseca da vidiš obrasce, jer se neki troškovi ne pojavljuju svaki mjesec. Mnogima se navika zadrži i dulje jer im daje mir.",
    },
    {
      q: "Moram li upisivati svaku kavu?",
      a: "Da, barem na početku. Upravo su mali česti troškovi oni koje najviše podcjenjujemo. Ako ti je unos brz, to traje nekoliko sekundi.",
    },
    {
      q: "Je li dovoljna aplikacija banke?",
      a: "Za pregled kartičnih plaćanja jest, ali ne vidi gotovinu ni druge račune, a kategorije su često netočne. Za planiranje unaprijed obično treba nešto više.",
    },
  ],
  related: ["aplikacije-za-pracenje-troskova", "kategorije-troskova", "kako-napraviti-mjesecni-budzet"],
};
