import type { Post } from "../types";

export const post: Post = {
  slug: "crni-petak",
  title: "Crni petak bez kajanja: kako kupiti samo ono što stvarno trebaš",
  description:
    "Crni petak može biti prilika ili zamka. Kako se pripremiti popisom i iznosom, prepoznati lažne popuste i kupiti ono što trebaš bez prekoračenja budžeta.",
  category: "Troškovi",
  published: "2026-11-17",
  summary: [
    "Popust vrijedi samo ako bi stvar kupio i bez njega. Zato popis i iznos idu prije gledanja ponuda.",
    "Provjeri stvarnu cijenu kroz zadnjih mjesec dana: dio „sniženja“ su obične cijene.",
    "Iznos za Crni petak odvoji unaprijed, da ostatak mjeseca ne trpi.",
  ],
  body: `
Crni petak ove godine pada 27. studenoga, a ponude počinju već tjedan ili dva ranije. Za nekoga je to prilika da jeftinije kupi ono što planira mjesecima. Za druge je to dan kad u košaricu završe stvari koje im ne trebaju, samo zato što su „sniženje“.

## Pravilo broj jedan: popis prije ponuda

Napravi popis **prije** nego što počneš gledati ponude. Na popis stavi samo stvari koje bi kupio i bez popusta, u idućih nekoliko mjeseci. Uz svaku stvar upiši najvišu cijenu koju si spreman platiti.

Ako stvari nema na popisu, ne kupuješ je. Popust na nešto što ne trebaš nije ušteda, nego trošak.

::stat 0 € | ušteda | na stvari koju ne bi ni kupio
::stat 30 % | ušteda | na stvari koju bi ionako kupio

## Pravilo broj dva: iznos unaprijed

Odluči koliko ukupno smiješ potrošiti i odvoji taj iznos. Ako ga uzmeš iz redovnog mjesečnog budžeta, ostatak studenoga i prosinca bit će tijesan, baš kad dolaze blagdani.

::calc dnevni-budzet | Koliko mi ostaje za ostatak mjeseca? | Upiši primanja, troškove i ono što planiraš potrošiti

## Kako prepoznati lažni popust

- **Precrtana cijena koja nikad nije vrijedila.** Usporedi cijenu u zadnjih 30 dana. Trgovci u EU moraju uz sniženje istaknuti najnižu cijenu iz zadnjih 30 dana prije sniženja.
- **Odbrojavanje i „još samo 2 komada“.** Pritisak na brzu odluku rijetko radi u tvoju korist.
- **Paketi** u kojima je stvar koju želiš uz stvari koje ne trebaš.
- **Besplatna dostava iznad iznosa** koja te tjera da dodaš još nešto.

::tip Stvar koju želiš, a nije na popisu, stavi u košaricu i zatvori stranicu. Vrati se za 24 sata. Ako je i dalje želiš i stane u iznos, kupi je.

## Kupnja na rate i odgođeno plaćanje

Mnoge trgovine nude plaćanje na rate bez kamata ili „kupi sad, plati poslije“. To ne smanjuje cijenu, samo seli trošak u buduće mjesece. Ako koristiš rate, upiši ih kao fiksni trošak u te mjesece, da znaš koliko ti ostaje za trošenje.

::warn Rate se lako zbrajaju. Tri male rate iz tri trgovine mogu u siječnju biti veći trošak od jedne velike kupnje.

## Nakon Crnog petka

Provjeri što si kupio i usporedi s popisom. Ako se nešto ne slaže, iskoristi pravo na povrat. Kod kupnje putem interneta u EU u pravilu imaš 14 dana za odustajanje od ugovora, ali provjeri uvjete trgovca. Ono što nisi potrošio od planiranog iznosa prebaci u štednju ili blagdanski budžet.
`,
  faq: [
    {
      q: "Kada je Crni petak 2026.?",
      a: "Crni petak 2026. je 27. studenoga. Mnoge trgovine ponude počinju i tjedan ili dva ranije.",
    },
    {
      q: "Kako znati je li popust stvaran?",
      a: "Usporedi cijenu s onom iz zadnjih 30 dana. Trgovci u EU uz sniženje moraju istaknuti najnižu cijenu iz zadnjih 30 dana prije sniženja.",
    },
  ],
  sources: [
    { label: "Europska komisija: Direktiva o isticanju cijena (najniža cijena u 30 dana prije sniženja)", url: "https://commission.europa.eu/live-work-travel-eu/consumer-rights-and-complaints/enforcement-consumer-protection/price-indication-directive_en" },
  ],
  related: ["impulzivna-kupnja", "bozicni-budzet", "koliko-dnevno-smijem-potrositi"],
};
