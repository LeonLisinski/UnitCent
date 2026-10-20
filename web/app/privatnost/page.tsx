import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "../site";

export const metadata: Metadata = {
  title: "Privatnost",
  description: "Kako UnitCent postupa s tvojim podacima: što prikupljamo, zašto, koliko dugo i kako ih možeš izbrisati.",
  alternates: { canonical: "/privatnost" },
};

export default function Privatnost() {
  return (
    <main className="wrap legal prose">
      <p><Link href="/" className="muted">← UnitCent</Link></p>
      <h1>Privatnost</h1>
      <p className="muted">Nacrt, prije lansiranja potrebna je pravna provjera.</p>

      <h2>Ukratko</h2>
      <ul>
        <li>Tvoji financijski podaci služe samo za rad aplikacije.</li>
        <li>Ne prodajemo podatke i nemamo reklame.</li>
        <li>Račun i sve podatke možeš izbrisati kad god želiš.</li>
      </ul>

      <h2>Lista čekanja i analitika stranice</h2>
      <p>Ako se prijaviš na listu čekanja, spremamo tvoju e-adresu, vrijeme privole i oznaku izvora prijave (npr. koja je mreža vodila na stranicu). Koristimo je samo da ti jednom javimo kad aplikacija izađe, a možeš zatražiti brisanje na adresu niže. Stranica koristi Vercel Analytics za brojanje posjeta i prijava. Ne postavlja kolačiće za praćenje i ne prati te preko različitih stranica.</p>

      <h2>Što prikupljamo u aplikaciji</h2>
      <p>Podatke koje sam upišeš: iznose, kategorije, pretplate, primanja i plan. Slike računa koje skeniraš. Podatke za prijavu (e-adresa ili Apple/Google račun). Osnovne tehničke podatke potrebne za rad i ispravljanje grešaka.</p>

      <h2>Kako se koriste slike računa</h2>
      <p>Slika računa šalje se na našu uslugu radi čitanja stavki i razvrstavanja po kategorijama. Obradu radi AI model putem našeg poslužitelja. Sliku brišemo nakon obrade, osim ako sam odabereš da je želiš čuvati uz trošak.</p>

      <h2>E-mailovi</h2>
      <p>Ako se prijaviš e-adresom (Apple ili Google), šaljemo ti dobrodošlicu, savjet za prvi tjedan, tjedni sažetak i mjesečni pregled. Svaki mail ima odjavu jednim klikom, a izbor mijenjaš i u aplikaciji (Profil, E-mailovi). Newsletter je zaseban izbor: dobivaš ga samo ako ga sam uključiš. Podsjetnici za unos su obavijesti na mobitelu, ne mailovi. Gosti (bez prijave) ne primaju mailove.</p>

      <h2>Kome se podaci šalju (obrađivači)</h2>
      <ul>
        <li><strong>Supabase</strong> (baza podataka i prijava, EU, Frankfurt): tvoji troškovi, kategorije, pretplate i plan, vezani uz tvoj račun.</li>
        <li><strong>Google (Gemini API)</strong>: samo slika računa koji skeniraš, radi čitanja stavki. Slika se ne sprema kod nas i briše se nakon obrade; uvjeti plaćene usluge Googlea ne dopuštaju korištenje tih podataka za poboljšanje njihovih proizvoda.</li>
        <li><strong>Apple i Google (trgovine)</strong> te <strong>RevenueCat</strong>: naplata i status Premium pretplate. Ne vidimo podatke o tvojoj kartici.</li>
        <li><strong>Brevo</strong> (e-pošta, EU): e-adresa i ime iz računa za sažetke (tjedni i mjesečni) i, samo ako ga sam uključiš, newsletter. U mailove ulaze zbrojevi (npr. potrošeno u tjednu), ne pojedinačni troškovi ni bilješke.</li>
        <li><strong>Sentry</strong> (EU): tehnički izvještaji o greškama i rušenjima, bez korisnika i bez iznosa.</li>
        <li><strong>PostHog</strong> (EU): anonimna statistika korištenja (npr. „otvoren Premium“, „skeniranje uspjelo“), bez iznosa i osobnih podataka. Možeš je isključiti u aplikaciji (Profil, Podaci i privatnost).</li>
        <li><strong>Vercel</strong>: hosting ove web stranice.</li>
      </ul>
      <p>Ne prodajemo podatke i ne dijelimo ih s oglašivačima.</p>

      <h2>Tvoja prava</h2>
      <p>Imaš pravo na pristup, ispravak, prijenos i brisanje svojih podataka te na prigovor nadzornom tijelu (AZOP). Brisanje računa dostupno je u aplikaciji. Za sve ostalo piši na <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
    </main>
  );
}
