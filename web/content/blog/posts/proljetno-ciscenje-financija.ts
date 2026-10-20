import type { Post } from "../types";

export const post: Post = {
  slug: "proljetno-ciscenje-financija",
  title: "Proljetno čišćenje financija: popis za jedno popodne",
  description:
    "Popis od deset koraka za jedno popodne: pretplate, računi, osiguranja, dokumenti, lozinke, rezerva i plan. Sredi financije jednom godišnje i olakšaj ostatak godine.",
  category: "Alati",
  published: "2027-03-09",
  summary: [
    "Jednom godišnje vrijedi provjeriti sve što se događa samo od sebe: pretplate, ugovore, osiguranja, trajne naloge.",
    "Popis od deset koraka staje u jedno popodne i najčešće donosi konkretnu uštedu.",
    "Najvrjedniji rezultat je pregled: znaš što plaćaš, zašto i do kada.",
  ],
  body: `
Proljeće je vrijeme kad otvaramo prozore i čistimo ormare. Financije zaslužuju isto. Jednom godišnje pregledaj sve što se plaća samo od sebe i sve što si odgađao. Treba ti jedno popodne i popis.

## Popis za jedno popodne

### 1. Pretplate

Prođi sve pretplate: streaming, aplikacije, oblak, članarine. Za svaku pitaj: jesam li je koristio u zadnjih mjesec dana? Ako ne, otkaži.

::calc pretplate | Koliko me koštaju pretplate godišnje? | Zbroji ih i vidi koliko možeš uštedjeti

### 2. Trajni nalozi i izravna terećenja

U internet bankarstvu pogledaj sve trajne naloge i odobrena izravna terećenja. Ugasi ona koja više ne trebaš.

### 3. Tarife i ugovori

Mobitel, internet, struja, plin. Ističe li neka ugovorna obveza? Postoji li jeftinija tarifa za tvoju potrošnju? Pogledaj [kako smanjiti račun za mobitel i internet](/blog/racun-za-mobitel-i-internet).

### 4. Osiguranja

Auto, stan, život, putno. Pokrivaju li ono što ti treba? Plaćaš li dvaput isto (npr. putno osiguranje uz karticu koja ga već uključuje)?

### 5. Kamate i naknade

Pogledaj naknade za vođenje računa i kartica te kamatu na minus. Ponekad je promjena paketa računa jednostavna ušteda.

### 6. Rezerva

Koliko imaš u fondu za hitne slučajeve? Je li cilj još realan?

::calc fond-za-hitne | Koliko mi treba rezerve? | Provjeri cilj i koliko ti nedostaje

### 7. Dugovi

Popiši sve dugove: iznos, kamata, rata. Imaš li plan otplate? Pogledaj [kako vratiti dugove](/blog/kako-vratiti-dugove).

### 8. Godišnji troškovi

Što te čeka ove godine: registracija, osiguranja, pokloni, odmor? Zbroji i podijeli s 12.

### 9. Dokumenti

Složi na jedno mjesto ugovore, police, jamstvene listove i važne račune. Digitalno ili u mapi, ali da se zna gdje je.

### 10. Pristupi i lozinke

Provjeri imaš li pristup svim financijskim računima i aplikacijama te koristiš li sigurne, različite lozinke i dvofaktorsku prijavu.

::tip Kalendarski podsjetnik za isti datum sljedeće godine pretvara ovo u naviku. Drugi put ide brže, jer je pola posla već napravljeno.

## Rezultat

::stat 10 | koraka | jedno popodne
::stat 1 | pregled | sve što plaćaš, zašto i do kada

Ako u pregledu nađeš samo dvije pretplate i jednu skuplju tarifu, ušteda za godinu može biti nekoliko stotina eura. Ali najveća vrijednost je mir: znaš što se događa s tvojim novcem.

::warn Kod otkazivanja ugovora provjeri otkazni rok i eventualne naknade za prijevremeni raskid, da ušteda ne postane trošak.
`,
  faq: [
    {
      q: "Što provjeriti kad sređujem financije?",
      a: "Pretplate, trajne naloge, tarife i ugovore, osiguranja, naknade banke, rezervu za hitne slučajeve, dugove, godišnje troškove, dokumente i pristupe računima.",
    },
    {
      q: "Koliko često pregledati financije?",
      a: "Detaljni pregled jednom godišnje, a kratki mjesečni pregled troškova po kategorijama. Ako troškove pratiš svakodnevno, godišnji pregled traje kratko.",
    },
  ],
  related: ["godisnji-pregled-troskova", "pretplate-koje-zaboravimo", "racun-za-mobitel-i-internet"],
};
