import type { Post } from "../types";

export const post: Post = {
  slug: "stednja-za-djecu",
  title: "Štednja za djecu: kako početi i koliko odvajati",
  description:
    "Kako početi štedjeti za dijete: koliko mjesečno, gdje držati novac, što s poklonima od rodbine i kako dijete postupno uključiti u razgovor o novcu.",
  category: "Štednja",
  published: "2027-02-09",
  summary: [
    "Najvažnija odluka nije iznos, nego početak: mali iznos kroz mnogo godina naraste u ozbiljnu svotu.",
    "Novac za dijete drži odvojeno od kućnog budžeta, na zasebnom računu.",
    "Pokloni od rodbine u novcu mogu ići izravno na taj račun, uz dogovor s obitelji.",
  ],
  body: `
Štednja za dijete je dugoročan cilj: obrazovanje, prvi auto, polog za stan ili jednostavno početni kapital. Prednost je vrijeme. I mali mjesečni iznos kroz 18 godina postane svota koju je teško skupiti u kratkom roku.

## Koliko kroz godine

Primjer bez kamata, samo redovito odvajanje:

::bars Primjer: ušteđeno do 18. godine (bez kamata)
20 € mjesečno | 4320
50 € mjesečno | 10800
100 € mjesečno | 21600

::stat 20 € | mjesečno | primjer
::stat 4.320 € | do 18. godine | 20 € × 12 × 18, bez kamata

Ako novac stoji na štednji s kamatom, iznos je veći. Čak i bez kamata, redovitost radi najveći dio posla.

::calc cilj-stednje | Kad ću skupiti iznos za dijete? | Upiši cilj i mjesečni iznos

## Gdje držati novac

- **Zasebni štedni račun** na ime djeteta ili tvoje, ovisno o ponudi banke i tome tko upravlja novcem.
- **Dugoročna štednja** s fiksnim mjesečnim uplatama, ako je nudi tvoja banka; provjeri uvjete i naknade za prijevremeni prekid.
- **Ulaganja** za vrlo dugi rok mogu donijeti više, ali nose rizik pada vrijednosti. Prije odluke informiraj se kod stručne osobe.

::tip Postavi trajni nalog na dan plaće. Iznos koji ne prolazi kroz kućni budžet, ne troši se usput.

## Pokloni u novcu

Za rođendane, krštenja i blagdane rodbina često daje novac. Dobar dogovor u obitelji: dio za igračku ili doživljaj, ostatak na djetetov račun. Tako i pokloni rastu kroz godine.

## Dijete i novac

Od predškolske dobi dijete može učiti osnove:

- **kasica s tri pretinca**: trošim, štedim, dijelim
- **džeparac** s jasnim pravilima i iznosom primjerenim dobi
- **razgovor o izboru**: „ako kupiš ovo sada, za ono ćeš čekati“

Kad je starije, može vidjeti stanje svog računa i odlučivati o dijelu novca. Iskustvo s malim iznosima je najbolja škola za velike.

::warn Ne štedi za dijete na račun vlastite rezerve za hitne slučajeve. Ako ostaneš bez posla ili se dogodi kvar, i djetetova štednja je ugrožena. Prvo mala rezerva za kućanstvo, zatim štednja za dijete.

## U budžetu

Štednju za dijete upiši kao zaseban iznos štednje u planu. Oduzima se prije dnevnog budžeta, pa se ne potroši slučajno, a vidiš koliko svaki mjesec ide djetetu.
`,
  faq: [
    {
      q: "Koliko štedjeti za dijete mjesečno?",
      a: "Koliko možeš redovito, bez diranja vlastite rezerve. I 20 € mjesečno kroz 18 godina, bez kamata, daje 4.320 €. Važnija je redovitost od visine iznosa.",
    },
    {
      q: "Gdje držati štednju za dijete?",
      a: "Na zasebnom štednom računu ili dugoročnoj štednji s fiksnim uplatama. Za vrlo dugi rok neki biraju ulaganja, koja nose i rizik; prije odluke informiraj se kod stručne osobe.",
    },
  ],
  related: ["obiteljski-budzet", "kako-poceti-stedjeti", "fond-za-hitne-slucajeve"],
};
