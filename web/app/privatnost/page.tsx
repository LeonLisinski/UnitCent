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

      <h2>Što prikupljamo</h2>
      <p>Podatke koje sam upišeš: iznose, kategorije, pretplate, primanja i plan. Slike računa koje skeniraš. Podatke za prijavu (e-adresa ili Apple/Google račun). Osnovne tehničke podatke potrebne za rad i ispravljanje grešaka.</p>

      <h2>Kako se koriste slike računa</h2>
      <p>Slika računa šalje se na našu uslugu radi čitanja stavki i razvrstavanja po kategorijama. Obradu radi AI model putem našeg poslužitelja. Sliku brišemo nakon obrade, osim ako sam odabereš da je želiš čuvati uz trošak.</p>

      <h2>Kome se podaci šalju</h2>
      <p>Pružateljima usluga koji nam trebaju za rad: hosting i baza podataka, obrada AI modelom, naplata pretplata putem App Storea i Google Playa. Ne dijelimo ih s oglašivačima.</p>

      <h2>Tvoja prava</h2>
      <p>Imaš pravo na pristup, ispravak, prijenos i brisanje svojih podataka te na prigovor nadzornom tijelu (AZOP). Brisanje računa dostupno je u aplikaciji. Za sve ostalo piši na <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
    </main>
  );
}
