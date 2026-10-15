# UnitCent: pravila rada (čitaj prvo)

Ovaj dokument vrijedi za svaku sesiju i svakog agenta. Cilj mu je da uvijek znamo **što gradimo, za koga i kako razmišljamo**.
Detalji su u [docs/APP-PLAN.md](docs/APP-PLAN.md) (plan aplikacije) i [docs/PRODUCT.md](docs/PRODUCT.md) (proizvod i monetizacija).

## Što je UnitCent
Hrvatska mobilna aplikacija (iOS + Android) za praćenje troškova. Glavno pitanje koje rješava:
**„Koliko danas smijem potrošiti?“** (preporučeni dnevni trošak).
Unos troška za 3 sekunde, pretplate se knjiže same, AI skenira račune i razvrstava stavke po kategorijama.
Free jezgra + Premium (AI skeniranje, uvidi, uvoz/izvoz) preko in-app pretplate.

## Zvijezda vodilja (odluke se mjere ovim redom)
1. **Brzina.** Brzo se otvara, unos je trenutan (lokalni zapis, bez čekanja mreže), skeniranje i sinkronizacija su brzi.
2. **Jednostavnost.** Jedan ekran, jedno pitanje. Manje je više. Svaka nova funkcija mora opravdati svoj ekran.
3. **Pouzdanost.** Novac je osjetljiv: točni iznosi (cijeli centi), nikad izgubljen unos, radi bez interneta.
4. **Ljepota i dosljednost.** Jedan dizajn sustav za app i web. Tamna i svijetla tema. Isti jezik, boje, razmaci.
5. **Skala.** Optimizirano za desetke tisuća korisnika bez prepravljanja arhitekture.

## Nepromjenjiva pravila proizvoda
- **Besplatno ostaje besplatno:** ručni unos, pretplate, dnevni limit, pregled, rad bez interneta. To ne naplaćujemo nikad.
- **Premium** = ono što nas košta (AI skeniranje) ili donosi očitu dodatnu vrijednost. Ograničenja se provode **na poslužitelju**, ne samo u aplikaciji.
- Bez reklama. Podaci se ne prodaju. Brisanje računa i podataka mora biti u aplikaciji.
- AI ključevi nikad u aplikaciji. AI pozivi samo preko Edge Functiona.
- Plaćanja isključivo preko Apple/Google in-app sustava (RevenueCat).
- Ton teksta: na „ti“, kratko, činjenice bez osude („Hrana: 32 € preko plana“, ne „Previše trošiš“).

## Jedan plan, isti brojevi svugdje
Primjer koji se koristi u webu, prototipu i dokumentaciji (ne mijenjati bez razloga):
primanja **1.468,00 €** − obavezno **771,33 €** (11 stavki) − štednja **150,00 €** = **546,67 €** za trošenje;
potrošeno do jutros **207,40 €** → ostaje **339,27 €**; ÷ **17** dana (uključujući danas) = **19,96 €** preporučeni dnevni trošak.
Primjer računa: Konzum, 6 stavki, ukupno **20,65 €** (Hrana 10,46 · Auto 4,99 · Kućanstvo 5,20).
Formula (jedina definicija je u docs/APP-PLAN.md §4.2, implementacija samo u `packages/core`):
- **raspoloživo** = primanja − obavezno − štednja; **potrošeno** se računa **bez** knjiženih pretplata (već su u „obavezno“);
- **preporučeni dnevni trošak** = (raspoloživo − potrošeno *prije današnjeg dana*) ÷ preostali dani uključujući danas (jednom za taj dan);
- **danas još smiješ** = preporučeni dnevni trošak − potrošeno *danas* (može biti negativno, prikaz „X € preko“).
Nazivi na webu: veliki broj u heroju je „Preporučeni dnevni trošak“, a u „Isprobaj“ i u aplikaciji na početnom ekranu „Danas još smiješ“.

## Dizajn
- Izvor istine: dizajn sustav UnitCent (https://claude.ai/artifact/7wzgDHWLkSWQmfEs2ZhYyg) i tokeni u kodu.
- Font: Manrope (tekst i brojevi, `tabular-nums`); Instrument Serif kurziv samo kao akcent; JetBrains Mono za sitne oznake.
- Jedna brand boja (zelena), limeta samo za jedan istaknuti trenutak po ekranu. Bez gradijentnih pozadina i sjena na karticama.
- Broj je junak ekrana. Najveći element je iznos.
- Dodirni ciljevi ≥ 48 px, kontrast ≥ 4.5:1, poštuj Dynamic Type i „smanji pokret“.
- **Logo se ne crta ponovo.** Koristi datoteke iz `web/public/brand/` (znak je prsten; ikona aplikacije je tamna).
- Web je trenutno samo tamna tema. Aplikacija ima obje teme (prati sustav, korisnik može prebaciti).

## Kako radimo (za agente)
- **Pitaj prije objave:** commit/push/deploy samo uz izričit zahtjev vlasnika. Vercel je spojen na `main`, svaki push objavljuje stranicu.
- **Ne diraj tuđe promjene.** Prije izmjene pogledaj `git status` i `git diff`. U istom radnom stablu može raditi više alata.
- **Ne gasi sve `node.exe` procese** (gasi vlasnikov dev server). Za provjere builda koristi odvojenu mapu: `NEXT_DIST_DIR=.next-check npx next build`, pa obriši mapu i vrati `web/tsconfig.json` (`git checkout -- web/tsconfig.json`).
- **Prototip s osobnim brojkama** (`prototype/`) je u `.gitignore` jer je repo javan. Ne objavljivati.
- Tajne (`SUPABASE_SERVICE_ROLE_KEY` i sl.) samo u `.env.local` / Vercel / EAS secrets. Nikad u repo.
- UI tekstovi su na hrvatskom. Identifikatori u kodu na engleskom. Komentari kratki, na hrvatskom ili engleskom, ali dosljedno u datoteci.
- Svaka promjena brojki ili naziva u webu mora ostati dosljedna u: `web/app/page.tsx`, `web/app/Motion.tsx`, `web/app/TryIt.tsx`, `web/app/opengraph-image.tsx`, `docs/`.
- Vlasnik odlučuje o arhitekturi i izmjenama; agent preuzima inicijativu, ali predlaže prije većih promjena.
- Nakon svake veće promjene: build mora proći, nema horizontalnog scrolla na 390 px, `prefers-reduced-motion` je poštovan.

## Stanje (ažurirati)
- Web `unitcent.com`: objavljen (Next.js 15, Vercel). Waitlist piše u Supabase tablicu `waitlist`.
- Supabase projekt: postoji (waitlist). Za aplikaciju treba zasebno okruženje (dev/staging/prod), vidi plan.
- Aplikacija: Faza 0 u tijeku. Gotovo lokalno: workspace, `packages/core` (testovi), `packages/tokens` (testovi kontrasta), `apps/mobile` (Expo ljuska), migracija, CI. Čeka vlasnika: Supabase dev/staging, developer računi, Sentry/EAS. Odluke D-01…D-10: docs/APP-PLAN.md §11.
- Komande: `npx pnpm@9.15.0 install`, `… test`, `… typecheck`, `… mobile`. Web: u `web/` npm.
