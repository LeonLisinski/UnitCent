import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "../site";

export const metadata: Metadata = {
  title: "Uvjeti korištenja",
  description: "Uvjeti korištenja UnitCent aplikacije: besplatno i Premium, pošteno korištenje AI skeniranja, pretplata i otkazivanje, tvoja prava.",
  alternates: { canonical: "/uvjeti" },
};

export default function Uvjeti() {
  return (
    <main className="wrap legal prose">
      <p><Link href="/" className="muted">← UnitCent</Link></p>
      <h1>Uvjeti korištenja</h1>
      <p className="muted">Nacrt, zadnja izmjena 16. 10. 2026. Prije lansiranja potrebna je pravna provjera i upisivanje podataka o pružatelju usluge.</p>

      <h2>Ukratko</h2>
      <ul>
        <li>Osnovno praćenje troškova je besplatno i ostaje besplatno.</li>
        <li>Premium je pretplata preko App Storea ili Google Playa i otkazuje se tamo, kad god želiš.</li>
        <li>AI skeniranje računa je pomoć, a ne jamstvo: uvijek možeš provjeriti i ispraviti rezultat.</li>
        <li>Tvoji podaci su tvoji. Račun i sve podatke možeš izbrisati u aplikaciji.</li>
      </ul>

      <h2>1. Prihvaćanje uvjeta</h2>
      <p>Korištenjem aplikacije UnitCent (dalje: aplikacija) i web stranice unitcent.com prihvaćaš ove uvjete. Ako se ne slažeš s njima, nemoj koristiti aplikaciju. Uvjeti vrijede uz <Link href="/privatnost">Politiku privatnosti</Link>.</p>

      <h2>2. Što aplikacija radi (i što ne radi)</h2>
      <p>UnitCent pomaže pratiti troškove i izračunati koliko danas još smiješ potrošiti. To je alat za osobnu uporabu. Izračuni i prijedlozi nisu financijski, porezni ni pravni savjet i ne zamjenjuju knjigovođu, banku ni savjetnika.</p>

      <h2>3. Račun i podaci</h2>
      <p>Aplikacija radi odmah, bez prijave, a podaci se u početku čuvaju na tvom uređaju i u zaštićenom računu u oblaku. Prijavom Googleom ili Appleom štitiš račun i omogućuješ prijenos podataka na novi uređaj. Odgovoran si za zaštitu svog uređaja i prijave. Račun i sve povezane podatke možeš izbrisati u aplikaciji (Profil), nakon čega se trajno brišu.</p>

      <h2>4. Besplatno i Premium</h2>
      <p>Besplatna jezgra (ručni unos, pretplate i fiksni troškovi, dnevni limit, pregled, rad bez interneta) ne naplaćuje se. Uključena su i ograničena AI skeniranja mjesečno, a njihov broj je naveden u aplikaciji.</p>
      <p>Premium otključava dodatne funkcije, uključujući AI skeniranje računa u većem opsegu. Cijena, razdoblje naplate i opseg prikazani su u aplikaciji prije kupnje. Plaćanje i obnova idu isključivo preko Apple App Storea ili Google Playa. Pretplata se automatski obnavlja dok je ne otkažeš u postavkama računa tog storea, najkasnije dan prije kraja razdoblja. Povrat novca i pravo na odustanak ostvaruju se prema pravilima storea i zakonima o zaštiti potrošača. Cijene i opseg Premiuma možemo promijeniti za buduća razdoblja, uz obavijest unaprijed.</p>

      <h2>5. Pošteno korištenje AI skeniranja</h2>
      <p>AI skeniranje košta nas za svako čitanje računa. Zato Premium uključuje pošteno korištenje, trenutačno do 100 skeniranja mjesečno za osobne račune, bez obzira na vrstu pretplate (uključujući doživotnu, ako je ikad ponudimo). Zabranjeno je automatizirano ili masovno slanje slika, zaobilaženje ograničenja (npr. stvaranjem više računa) i korištenje skeniranja za treće osobe ili poslovanje. Možemo ograničiti ili ugasiti skeniranje računima koji to zloupotrebljavaju.</p>

      <h2>6. Točnost AI-ja</h2>
      <p>AI može pogrešno pročitati stavku, cijenu ili kategoriju, osobito na izblijedjelim ili oštećenim računima. Prije spremanja prikazujemo rezultat na ekranu za provjeru, a ti odlučuješ što se sprema. Ne jamčimo potpunu točnost i ne odgovaramo za odluke donesene na temelju neprovjerenih podataka.</p>

      <h2>7. Prihvatljivo korištenje</h2>
      <p>Ne smiješ: koristiti aplikaciju za nezakonite svrhe, ometati rad usluge ili poslužitelja, pokušavati pristupiti tuđim podacima, rastavljati aplikaciju ili je kopirati radi stvaranja konkurentnog proizvoda. Uslugu možemo privremeno ili trajno ograničiti za korisnike koji krše ove uvjete.</p>

      <h2>8. Tvoj sadržaj</h2>
      <p>Podaci koje uneseš (troškovi, kategorije, pretplate, slike računa) ostaju tvoji. Daješ nam ograničeno pravo da ih obrađujemo isključivo radi pružanja usluge (spremanje, sinkronizacija, čitanje računa), kako je opisano u Politici privatnosti. Ne prodajemo podatke i ne koristimo ih za oglašavanje.</p>

      <h2>9. Dostupnost i promjene</h2>
      <p>Trudimo se da aplikacija radi bez prekida, ali ne jamčimo stalnu dostupnost. Osnovne funkcije rade i bez interneta. Aplikaciju, ove uvjete i opseg usluge možemo mijenjati; o bitnim promjenama obavijestit ćemo te u aplikaciji ili e-poštom, a daljnje korištenje znači prihvaćanje izmjena.</p>

      <h2>10. Ograničenje odgovornosti</h2>
      <p>U granicama dopuštenim zakonom aplikaciju pružamo „kakva jest“ i ne odgovaramo za neizravnu štetu, izgubljenu dobit ni za štetu nastalu neovlaštenim korištenjem tvog uređaja. Savjetujemo povremeni izvoz podataka (Profil → Izvezi podatke). Ništa u ovim uvjetima ne isključuje odgovornost koja se po zakonu ne može isključiti niti ograničava tvoja prava kao potrošača.</p>

      <h2>11. Prestanak</h2>
      <p>Aplikaciju možeš prestati koristiti i izbrisati račun u svakom trenutku. Brisanje računa ne otkazuje pretplatu u storeu, to moraš napraviti sam u postavkama Apple ili Google računa.</p>

      <h2>12. Mjerodavno pravo</h2>
      <p>Primjenjuje se pravo Republike Hrvatske, uz zadržavanje obveznih prava potrošača iz države tvog boravišta. Za sporove su nadležni sudovi prema propisima o zaštiti potrošača. Prije spora molimo da nam se javiš, većinu stvari riješimo odmah.</p>

      <h2>13. Kontakt</h2>
      <p>Pitanja o uvjetima i prijave zloupotrebe: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
    </main>
  );
}
