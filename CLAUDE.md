# UnitCent: pravila rada (čitaj prvo)

Ovaj dokument vrijedi za svaku sesiju i svakog agenta. Cilj mu je da uvijek znamo **što gradimo, za koga i kako razmišljamo**.
Detalji su u [docs/APP-PLAN.md](docs/APP-PLAN.md) (plan aplikacije) i [docs/PRODUCT.md](docs/PRODUCT.md) (proizvod i monetizacija).

## Što je UnitCent
Hrvatska mobilna aplikacija (iOS + Android) za praćenje troškova. Glavno pitanje koje rješava:
**„Koliko danas smijem potrošiti?“** (preporučeni dnevni trošak).
Unos troška za 3 sekunde, pretplate se knjiže same, AI skenira račune i razvrstava stavke po kategorijama.
Free jezgra + Premium (cijela povijest, AI skeniranje bez ograničenja, uvidi) preko in-app pretplate. Izvoz podataka (JSON) je besplatan; uvoz nije u planu za v1.

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
- Ton teksta: na „ti“, kratko, činjenice („Hrana: 32 € preko plana“, ne „Previše trošiš“). **Nikad ne pisati „bez osude“, „bez krivnje“, „bez srama“ i slične ograde** (ni na webu, ni u aplikaciji, ni u mailovima): tek uvode ideju da bi netko osuđivao.

## Jedan plan, isti brojevi svugdje
Primjer koji se koristi u webu, prototipu i dokumentaciji (ne mijenjati bez razloga):
primanja **1.468,00 €** − obavezno **771,33 €** (11 stavki) − štednja **150,00 €** = **546,67 €** za trošenje;
potrošeno do jutros **207,40 €** → ostaje **339,27 €**; ÷ **17** dana (uključujući danas) = **19,96 €** dnevni budžet.
Primjer računa: Konzum, 6 stavki, ukupno **20,65 €** (Hrana 10,46 · Auto 4,99 · Kućanstvo 5,20).
Formula (jedina definicija je u docs/APP-PLAN.md §4.2, implementacija samo u `packages/core`):
- **raspoloživo** = primanja − obavezno − štednja; **potrošeno** se računa **bez** knjiženih pretplata (već su u „obavezno“);
- **dnevni budžet** = (raspoloživo − potrošeno *prije današnjeg dana*) ÷ preostali dani uključujući danas (jednom za taj dan);
- **ostalo za danas** = dnevni budžet − potrošeno *danas* (može biti negativno, prikaz „Danas preko“ + iznos).
- Mjesec je kalendarski (D-13). Početak usred mjeseca: potrošeno prije praćenja procjenjuje se iz stanja na računu i ulazi u „potrošeno prije današnjeg dana“.
Nazivi (jednako u aplikaciji, webu i dokumentaciji): iznos za cijeli dan je „Dnevni budžet“ (heroj na webu, onboarding, plan), a ono što je od njega ostalo je „Ostalo za danas“ (prsten na Početnoj, ispod „od X € danas“; „Isprobaj“ na webu); prekoračenje je „Danas preko“. Za taj iznos ne koristiti „limit“ ni „preporučeni dnevni trošak“ u sučelju („limit“ ostaje samo za mjesečni limit kategorije).

## Dizajn
- Izvor istine: dizajn sustav UnitCent (https://claude.ai/artifact/7wzgDHWLkSWQmfEs2ZhYyg) i tokeni u kodu.
- Font: Manrope (tekst i brojevi, `tabular-nums`); Instrument Serif kurziv samo kao akcent; JetBrains Mono za sitne oznake.
- Jedna brand boja (zelena), limeta samo za jedan istaknuti trenutak po ekranu. Bez gradijentnih pozadina i sjena na karticama.
- Broj je junak ekrana. Najveći element je iznos.
- **Glavni sadržaj i primarni gumb (npr. iznos, „Spremi“) moraju uvijek biti vidljivi** na malim i velikim ekranima, bez skrolanja do potvrde. Skrolati smije samo promjenjiv popis (npr. kategorije), i to tek kad ne stane. **Tipkovnica telefona nikad ne smije prekriti** sadržaj ni gumb: koristi `KeyboardAvoidingView`, a po potrebi sakrij sekundarne elemente (npr. našu numeričku tipkovnicu) dok je tipkovnica otvorena. Provjeri na malom ekranu (iPhone SE) i s otvorenom tipkovnicom.
- **Hijerarhija gumba** (komponenta `Button`, `apps/mobile/src/components.tsx`): *primary* = jedna glavna radnja po ekranu (puna brand pilula); *secondary* = staklena pilula s rubom; *text* = tercijarna radnja (tekst u brand boji, npr. „+ Nova kategorija“); *danger* = razorna radnja (crveni tekst, na dnu, uvijek uz potvrdu). **Nikad gumb preko cijele širine**: širina prema sadržaju, centrirano. Glavna radnja koja potvrđuje formu je fiksirana pri dnu i uvijek vidljiva. Ekrani dopuštenja (kamera, obavijesti): ikona, jedna rečenica zašto, glavni gumb „Dopusti“, ispod alternativa i „Ne sada“.
- **Struktura ekrana:** tab ekrani nemaju naslov stranice (ime je već u traci); počinju kontekstom (pozdrav, mjesec, ukupni iznos, profil). Postavke i popisi su skupine (`Group` + `Row`, `apps/mobile/src/settings.tsx`) s ikonom, naslovom, podnaslovom i strelicom, a uređivanje ide na zaseban ekran (npr. Plan, Kategorije), ne u dugi popis na jednom ekranu. Grafovi: isječci s ravnim krajevima i fiksnim razmakom, nikad preklapanje.
- **Informacije na prvi pogled:** svaki ekran ima jedan glavni podatak (najveći element) i najviše tri pomoćna. Svaki element odgovara na jedno pitanje korisnika, a isti podatak se nikad ne prikazuje dvaput. Stanje se prikazuje grafom ili bojom, a tekst je samo oznaka (jedna riječ ili broj). Analitika (po danima, po kategorijama, usporedbe) živi na Pregledu, a ne na Početnoj. Početna: „koliko smijem danas“ (prsten) → „jesam li na tragu ovaj mjesec“ (traka s oznakom plana) → „što dolazi“ → „što sam zadnje potrošio“.
- **Dosljednost (jedan uzorak po vrsti sadržaja):** podatkovni popisi (troškovi, kategorije, pretplate) su ravni retci s tankom crtom, bez kutija i bez punih pozadina (inače se na gradijentnoj pozadini vide kao pravokutnici); staklene površine (`Glass`, `Group`) samo za skupine postavki i istaknute blokove. Oznake sekcija su `mono-label`. Iznosi u popisima troškova imaju minus, a ukupni iznosi i popisi „koliko košta“ (pretplate, pregled) nemaju predznak. Avatar je uvijek komponenta `Avatar`. Redak nikad ne ponavlja isti tekst u naslovu i podnaslovu. Množina brojeva ide prema hrvatskim pravilima (1 stavka, 2 do 4 stavke, 5+ stavki).
- **Povezanost (jedan sustav, ne „slično“):** svaki tab ekran je `TabScreen` (isti rubovi 20, razmak sekcija 28, donji razmak za traku) i ima isti redoslijed: `PageHeader` (kontekst + najviše jedna radnja) → glavni graf iste veličine i istog jezika (prsten ili krug: ista debljina, zaobljeni krajevi, isti trag, u sredini oznaka / iznos / jedna crta teksta) → `Section` komponente (oznaka + opcionalan podatak) → popisi od `ListRow`. Novi ekran se gradi od ovih komponenti (`apps/mobile/src/layout.tsx`), ne od ručnog razmaka. Na Početnoj je avatar samo tih (`Avatar quiet`: neutralan krug, ne zelen), da se ne natječe s prstenom.
- **Tipografska hijerarhija (4 razine, svaka vidljivo različita):** 1) glavni iznos (prsten/krug, ~56, najjači); 2) ključni brojevi ekrana (npr. Potrošeno / Ostalo, ~22, bold, uz malu oznaku iznad); 3) naslovi i iznosi u retku (16, bold); 4) pomoćni tekst i oznake sekcija (11 do 13, prigušeno). Boja znači stanje (crveno/žuto za problem), ne naglasak; tekst koji nije dodirljiv nikad nije zelen ni podebljan kao poveznica. Stanje se pokazuje točkom, a ne obojenim tekstom.
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
- Web `unitcent.com`: objavljen (Next.js 16, Vercel). Waitlist piše u Supabase tablicu `waitlist`.
- Supabase projekt: postoji (waitlist). Za aplikaciju treba zasebno okruženje (dev/staging/prod), vidi plan.
- Aplikacija: Faza 0 gotova osim računa; Faza 1 (lokalni MVP) napisana, čeka prvo pokretanje na uređaju. (Faza 0 detalji:) Gotovo lokalno: workspace, `packages/core` (testovi), `packages/tokens` (testovi kontrasta), `apps/mobile` (Expo ljuska), migracija, CI. Čeka vlasnika: Supabase dev/staging, developer računi, Sentry/EAS. Odluke D-01…D-10: docs/APP-PLAN.md §11.
- Faza 2: sinkronizacija (core pravila + `sync_push` na dev bazi + klijent `apps/mobile/src/sync.ts`) napisana i provjerena na dev bazi; čeka test na uređaju. Server koristi složene ključeve `(user_id, id)`.
- Faza F + G (mailovi preko Brevoa, admin aplikacija `apps/admin`): napisano i objavljeno na dev Supabase 20. 10.; Brevo postavljen i šalje (21. 10.); ostaju webhook i prosljeđivanje pošte (docs/PLAN-DORADE.md, „F + G: što treba vlasnik“).
- Komande: `npx pnpm@9.15.0 install`, `… test`, `… typecheck`, `… mobile`. Web: u `web/` npm.
