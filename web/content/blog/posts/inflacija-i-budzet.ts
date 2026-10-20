import type { Post } from "../types";

export const post: Post = {
  slug: "inflacija-i-budzet",
  title: "Inflacija i osobni budžet: kako se prilagoditi kad sve poskupljuje",
  description:
    "Kada cijene rastu, isti budžet kupuje manje. Kako prepoznati koje kategorije najviše rastu, prilagoditi plan i zaštititi štednju bez osjećaja da gubiš kontrolu.",
  category: "Budžet",
  published: "2027-02-23",
  summary: [
    "Inflacija znači da isti iznos kupuje manje. Budžet od prošle godine možda više nije realan.",
    "Tvoja osobna inflacija ovisi o tome na što trošiš; prati vlastite kategorije, ne samo službeni prosjek.",
    "Prilagodi plan na temelju stvarnih troškova i zaštiti štednju kao fiksnu stavku.",
  ],
  body: `
Kad sve poskupljuje, osjećaš to prvo na blagajni. Košarica koja je stajala 50 € sada stoji više, a plaća ne raste istim tempom. Inflaciju ne možeš kontrolirati, ali možeš kontrolirati kako ti budžet na nju odgovara.

## Što inflacija znači za tebe

Službena stopa inflacije je prosjek za cijelu zemlju. Tvoja **osobna inflacija** ovisi o tome na što trošiš. Ako veći dio ide na hranu i energiju, a one rastu brže od prosjeka, tvoji troškovi rastu brže od službene brojke.

Primjer kako ista stopa djeluje na novac kroz vrijeme:

::stat 100 € | danas | kupovna moć
::stat oko 86 € | za 5 godina | uz 3 % godišnje, ista količina stvari

## Korak 1: usporedi svoje kategorije

Pogledaj iste mjesece prošle i ove godine po kategorijama. Gdje je rast najveći? Najčešće su to hrana, režije i usluge.

::bars Primjer: rast troškova u godinu dana (mjesečno)
Hrana | 40
Režije | 25
Prijevoz | 10
Izlasci | 15

U ovom primjeru isti način života košta 90 € mjesečno više nego prije godinu dana.

## Korak 2: prilagodi plan

Budžet koji je bio realan prošle godine možda više nije. Ako ga ne prilagodiš, svaki mjesec ćeš biti „preko“, a to brzo obeshrabri.

- **Ažuriraj kategorije** prema stvarnim iznosima zadnja tri mjeseca.
- **Odluči gdje uštedjeti**, ako primanja nisu porasla: manje izlazaka, jeftinije marke, pregled pretplata.
- **Provjeri fiksne troškove**: tarife, osiguranja, ugovori koji se mogu pregovarati.

::tip Kod hrane najviše pomaže planiranje: tjedni jelovnik, popis za kupnju i manje bacanja. Pogledaj [kako smanjiti troškove hrane](/blog/kako-smanjiti-troskove-hrane).

## Korak 3: zaštiti štednju

Kad je budžet tijesan, štednja je prva koja nestane. Bolje je smanjiti iznos štednje nego je potpuno ukinuti. Čak i manji iznos zadržava naviku. Postavi ga kao fiksnu stavku koja se oduzima prije trošenja.

::warn Novac koji dugo stoji na tekućem računu bez kamata gubi vrijednost kroz inflaciju. Rezervu za hitne slučajeve drži dostupnom, ali razmisli o štednom računu s kamatom za novac koji ti ne treba svakodnevno.

## Kad primanja porastu

Ako dobiješ povišicu, prvo pokrij rast troškova, a dio povišice usmjeri na štednju prije nego što se navikneš na veći iznos. Tako štednja raste zajedno s primanjima.

## Inflacija i dnevni budžet

Dnevni budžet se računa iz tvog stvarnog plana, pa automatski prati promjene: ako upišeš veće fiksne troškove ili manja primanja, dnevni iznos se odmah prilagodi. Važno je da plan bude ažuran, ne idealan.
`,
  faq: [
    {
      q: "Kako se prilagoditi inflaciji u kućnom budžetu?",
      a: "Usporedi svoje kategorije s prošlom godinom, ažuriraj plan prema stvarnim troškovima, odluči gdje uštedjeti i zadrži štednju kao fiksnu stavku, makar u manjem iznosu.",
    },
    {
      q: "Što je osobna inflacija?",
      a: "Rast cijena stvari koje ti kupuješ. Ovisi o tome na što trošiš, pa može biti veća ili manja od službene stope inflacije.",
    },
  ],
  related: ["troskovi-zivota-u-hrvatskoj", "kako-smanjiti-troskove-hrane", "kako-napraviti-mjesecni-budzet"],
};
