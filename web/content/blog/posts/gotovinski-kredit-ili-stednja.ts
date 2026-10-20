import type { Post } from "../types";

export const post: Post = {
  slug: "gotovinski-kredit-ili-stednja",
  title: "Kredit ili štednja: kako odlučiti kad ti treba veći iznos",
  description:
    "Kad je kredit razuman, a kad je bolje pričekati i uštedjeti. Što je EKS, kako izračunati ukupni trošak kredita i koja pitanja postaviti prije potpisa.",
  category: "Budžet",
  published: "2026-12-08",
  summary: [
    "Kredit nije samo mjesečna rata: ukupni trošak je rata puta broj mjeseci, uključujući kamate i naknade.",
    "Za usporedbu kredita koristi efektivnu kamatnu stopu (EKS), jer uključuje i naknade.",
    "Ako trošak može pričekati, štednja je gotovo uvijek jeftinija. Kredit ima smisla za nužno, ne za želje.",
  ],
  body: `
Novi auto, popravak krova, namještaj, putovanje. Kad ti zatreba veći iznos, dva su puta: uzeti ga sada i vraćati, ili ga skupiti pa potrošiti. Oba imaju svoje mjesto, ali razlika u cijeni često je veća nego što se čini.

## Koliko kredit stvarno košta

Mjesečna rata izgleda pristupačno. Ono što se ne vidi odmah je **ukupni iznos** koji ćeš vratiti.

::stat 5.000 € | posuđeno | primjer kredita
::stat 5.940 € | vraćeno | 60 rata po 99 € (primjer)

U ovom primjeru, uz otprilike 7 % godišnje na pet godina, vraćaš oko 940 € više od posuđenog. To je cijena toga što novac imaš odmah. Tvoji uvjeti mogu biti drukčiji, pa uvijek traži ukupni iznos za otplatu.

## Što je EKS i zašto je važan

**Nominalna kamatna stopa** pokazuje samo kamatu. **Efektivna kamatna stopa (EKS)** uključuje i naknade (obrada, osiguranje, vođenje računa) i zato je bolja za usporedbu. Banke i druge institucije moraju je navesti u ponudi.

::tip Uspoređuj kredite po EKS-u i po ukupnom iznosu koji vraćaš, ne po visini rate. Niža rata kroz dulje razdoblje često znači veći ukupni trošak.

## Kada kredit ima smisla

- **Nužan trošak koji ne može čekati**: popravak bez kojeg ne možeš raditi ili živjeti normalno.
- **Ulaganje koje smanjuje troškove ili povećava prihode**: npr. stan umjesto najma, uz razumnu ratu.
- **Kada je rata sigurno u budžetu** i nakon nje ostaje dovoljno za život i štednju.

## Kada je bolje pričekati i uštedjeti

- **Želje, ne potrebe**: putovanje, novi telefon dok stari radi, namještaj koji može pričekati.
- **Kada bi rata pojela štednju** ili fond za hitne slučajeve.
- **Kada već imaš druge rate.** Više manjih kredita brzo postane velik mjesečni teret.

::calc cilj-stednje | Za koliko mjeseci mogu uštedjeti isti iznos? | Usporedi s brojem rata kredita

Ako bi za kredit plaćao 99 € mjesečno pet godina, istih 99 € mjesečno na štednji daje 5.000 € za otprilike 51 mjesec, bez kamata koje plaćaš banci.

## Pitanja prije potpisa

1. Koliki je **ukupni iznos** koji ću vratiti?
2. Koliki je **EKS** i koje su sve naknade?
3. Je li kamata **fiksna ili promjenjiva**, i što ako poraste?
4. Što ako želim vratiti ranije: postoji li naknada?
5. Mogu li platiti ratu i ako ostanem bez dijela prihoda nekoliko mjeseci?

::warn Ne potpisuj pod pritiskom roka ili „ponude koja vrijedi samo danas“. Imaš pravo na informacije prije ugovora i, kod potrošačkih kredita, na odustanak u zakonskom roku. Provjeri uvjete kod svog vjerovnika.

## Rata u budžetu

Ako uzmeš kredit, ratu upiši kao fiksni trošak. Tako je odmah izuzeta iz iznosa za trošenje i dnevni budžet pokazuje koliko ti stvarno ostaje.
`,
  faq: [
    {
      q: "Što je EKS?",
      a: "Efektivna kamatna stopa (EKS) uključuje kamatu i naknade kredita, pa pokazuje stvarnu godišnju cijenu. Za usporedbu kredita bolja je od nominalne kamatne stope.",
    },
    {
      q: "Je li bolje uzeti kredit ili štedjeti?",
      a: "Ako trošak može pričekati, štednja je gotovo uvijek jeftinija jer ne plaćaš kamate. Kredit ima smisla za nužne troškove koji ne mogu čekati, uz ratu koja sigurno stane u budžet.",
    },
  ],
  related: ["kako-izaci-iz-minusa", "kako-vratiti-dugove", "fond-za-hitne-slucajeve"],
};
