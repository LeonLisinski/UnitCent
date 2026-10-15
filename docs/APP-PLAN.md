# UnitCent: plan aplikacije (v1.1)

Namjena dokumenta: da svatko (vlasnik, agent, budući suradnik) u svakom trenutku zna cilj, odluke, arhitekturu, redoslijed rada i kriterije kvalitete. Pravila rada i „zvijezda vodilja“ su u `../CLAUDE.md`. Proizvod i monetizacija su u `PRODUCT.md`. Odluke označene **[ODLUKA]** trebaju vlasnikov potpis prije izvedbe. Sve ostalo je preporuka koju smatramo zadanom.

---

## 1. Cilj i mjerila uspjeha

**Cilj:** najbrža i najjednostavnija hrvatska aplikacija za praćenje troškova koja svaki dan odgovara na pitanje „koliko danas smijem potrošiti“, uz AI skeniranje računa kao glavni razlog za Premium.

| Mjerilo | Cilj za lansiranje |
| --- | --- |
| Hladni start do upotrebljivog početnog ekrana (srednji Android, 3 godine star) | < 2,0 s (iPhone < 1,2 s) |
| Unos troška (od otvaranja sheeta do spremljenog) | ≤ 3 dodira, zapis u lokalnu bazu < 50 ms |
| Skeniranje računa: okidanje → razvrstane stavke | p50 < 5 s, p95 < 8 s |
| Klizanje listi | 60 fps (bez ispuštenih okvira na popisu od 1.000 stavki) |
| Crash-free sesije | ≥ 99,5 % |
| Veličina aplikacije (preuzimanje) | < 40 MB |
| Aktivacija | ≥ 60 % novih korisnika unese prvi trošak unutar 24 h |
| Točnost skeniranja | ≥ 85 % stavki ispravno razvrstano bez ispravke; ≥ 95 % ukupnog iznosa točno (QR) |
| Konverzija u plaćeno | 2–5 % aktivnih (provjeriti nakon 2–3 mjeseca) |

## 2. Opseg

### 2.1 Free (uvijek besplatno)
- Brzi unos troška/prihoda, kategorije (zadane + vlastite), bilješka, datum.
- Pretplate i fiksni troškovi: automatsko knjiženje, kalendar naplata, podsjetnik dan prije.
- Mjesečni plan: primanja, obavezno, štednja → preporučeni dnevni trošak (formula u §4.2).
- Pregled po kategorijama i usporedba s prošlim mjesecom.
- Rad bez interneta, sinkronizacija u pozadini (uz povezani račun).
- Tamna/svijetla tema, hrvatski jezik, euro.
- 3 AI skeniranja mjesečno (kalendarski mjesec po Europe/Zagreb; provodi poslužitelj).

### 2.2 Premium
- AI skeniranje računa bez ograničenja (QR + stavke + učenje iz ispravaka), uz pravilo poštenog korištenja (§4.6).
- AI uvidi i trendovi („Cigarete +30 %“, „Imaš 3 streaming pretplate“).
- Budžeti po kategoriji s upozorenjem.
- Uvoz iz Excela, izvoz (Excel/PDF), widgeti.
- Kasnije (v1.1+): pametna shopping lista s usporedbom cijena, zajednički budžet za par/kućanstvo.

### 2.3 Izvan opsega za v1
Povezivanje s bankom (PSD2), investicije, više valuta u istom planu, web aplikacija za unos, tablet raspored.

## 3. Tehnološki stog (preporuka i razlozi)

| Sloj | Odabir | Zašto |
| --- | --- | --- |
| Aplikacija | Expo (React Native) + TypeScript, Expo Router, nova arhitektura (Fabric), Hermes | Jedan kod za iOS i Android, brz razvoj, OTA ispravke (EAS Update), dobar ekosustav |
| Lokalna baza | expo-sqlite + tipizirani upiti (Drizzle ORM) | Trenutan unos i čitanje, offline-first, migracije na uređaju |
| Stanje | Zustand (UI/sesija), čitanje podataka iz SQLite pretplatama na promjene | Malo re-rendera, jednostavno |
| Liste | FlashList | Glatko klizanje na dugim popisima |
| Animacije/geste | Reanimated 3 + Gesture Handler | Animacije na UI niti, 60 fps |
| Slike | expo-image | Keširanje, brzo dekodiranje |
| Ikone | Phosphor (react-native) | Isti set kao dizajn sustav |
| Backend | Supabase (Postgres + RLS, Auth, Storage, Edge Functions) | Već imamo projekt; EU regija; RLS štiti podatke po korisniku |
| AI | Vision model „mali i brz“ preko Edge Function, strukturirani JSON izlaz | Nizak trošak po računu, ključ samo na poslužitelju |
| Plaćanja | RevenueCat (react-native-purchases) | In-app pretplate na obje platforme, webhookovi, probno razdoblje |
| Prijava | Supabase Auth: anonimna sesija pri prvom pokretanju; Google, Apple i e-mail OTP povezuju se na isti račun | Gost od prvog dana ima `uid` (RLS, kvota skeniranja, kupnje); Google traži vlasnik; Apple je obavezan uz Google na iOS-u |
| Zaštita od zloupotrebe | App Attest (iOS) i Play Integrity (Android) na `scan-receipt` | Besplatna skeniranja se ne mogu „farmati“ novim anonimnim računima |
| Obavijesti | Lokalne (podsjetnik naplate, rade offline) + push samo za ključne događaje | Pouzdano i jeftino |
| Praćenje grešaka | Sentry (greške + performanse) | Crash-free mjerenje, tragovi |
| Analitika | PostHog (EU) ili Plausible za web; događaji bez osobnih podataka | Lijevak aktivacije i paywalla |
| Build/isporuka | EAS Build/Submit/Update, GitHub Actions | Ponovljivi buildovi, OTA |
| Testovi | Vitest/Jest (logika), Maestro (E2E), ručni TestFlight/Play interni | Pokriva novac, sync i ključne tokove |

**[ODLUKA D-01] Stilizacija:** vlastiti tokeni + StyleSheet s `useTheme()` (jednostavno, bez ovisnosti) ili react-native-unistyles (brže teme bez re-rendera). Preporuka: tokeni + Unistyles ako se potvrdi stabilnost; inače običan StyleSheet.

**[ODLUKA D-02] Sync:** vlastiti lagani sinkronizacijski sloj (outbox + povlačenje po kursoru) ili PowerSync. Preporuka: vlastiti za v1 (podaci su mali i po korisniku), PowerSync razmotriti tek kod zajedničkih budžeta.

## 4. Arhitektura

```
Mobilna aplikacija (Expo)
 ├─ UI (ekrani, komponente, teme)
 ├─ Domena (čista logika: novac u centima, dnevni limit, ponavljanja)  ← dijeli se s webom i testovima
 ├─ Lokalna baza (SQLite) ── izvor istine za UI
 ├─ Sync motor (outbox ↔ Supabase, pozadinski)
 └─ Servisi (kamera/QR, obavijesti, RevenueCat, Auth, Sentry, App Attest/Play Integrity)
           │
           ▼
Supabase (EU)
 ├─ Postgres + RLS (po user_id)
 ├─ Auth (anonimno → Google/Apple/OTP, isti uid)
 ├─ Storage (privatni bucket za slike računa, kratko zadržavanje, RLS po putanji)
 ├─ Edge Functions: scan-receipt, revenuecat-webhook, delete-account, export-data
 └─ Cron: ponavljajuće stavke (ako treba), čišćenje slika i siročadi u Storageu, cjenici trgovina (faza kasnije)
```

### 4.1 Struktura repozitorija (monorepo, pnpm)

```
apps/mobile      Expo aplikacija
apps/web         marketing stranica (trenutno u /web, preseljenje kad krene app)
packages/core    domenska logika: novac, dnevni limit, ponavljanja, formatiranje (TS, bez ovisnosti)
packages/tokens  dizajn tokeni (boje svijetla/tamna, razmaci, tipografija) → generira CSS i RN objekt
supabase/        migracije, RLS pravila, Edge Functions, seed
docs/            plan, proizvod, odluke (ADR)
```

**Pravilo:** bilo koja formula koja daje iznos živi samo u `packages/core` i ima jedinične testove. Web, app i Edge Functions koriste isti kod.

### 4.2 Novac, vrijeme i dnevni limit
- Iznosi su cijeli brojevi u centima (int), nikad float. Prikaz formatira `Intl.NumberFormat('hr-HR')`.
- Vremenska zona korisnika: Europe/Zagreb zadano. Datumi troškova se spremaju kao lokalni datum (`YYYY-MM-DD`) uz `occurred_at` (UTC) za sortiranje.
- Mjesec za plan = kalendarski mjesec; „preostali dani“ uključuju današnji dan.

**Formula dnevnog limita** (jedina definicija; implementacija samo u `packages/core`):

1. **Raspoloživo za mjesec** = primanja − obavezno − štednja.
2. **Obavezno** = zbroj aktivnih `recurring_items` koji padaju u taj mjesec.
3. **Potrošeno** = troškovi u mjesecu **bez** onih sa `source = recurring`. Ti su već oduzeti kroz „obavezno“; brojati ih i ovdje znači oduzeti istu pretplatu dvaput.
4. **Dnevni iznos za danas** = (raspoloživo − potrošeno *prije današnjeg dana*) ÷ preostali dani uključujući danas. Računa se jednom za taj dan.
5. **Danas još smiješ** = dnevni iznos − potrošeno *danas*. Može biti negativan; tada se prikazuje kao „X € preko“, nikad kao 0.

Zašto točke 4 i 5 moraju biti odvojene: ako se današnja potrošnja oduzme od raspoloživog pa ponovno podijeli s danima, trošak od 10 € smanji današnji broj za samo 10 € ÷ 17 dana ≈ 0,59 €. Korisnik bi i nakon trošenja vidio skoro isti iznos.

- **Ponavljanja:** `day_of_month` 29–31 u kraćem mjesecu knjiži se na zadnji dan mjeseca.
- **[ODLUKA D-09] Neplanirani prihodi** (`type = income` izvan plana): dodaju se raspoloživom za taj mjesec ili ne. Preporuka: dodaju se.

### 4.3 Model podataka (skica)

Svaki redak: `id` (uuid v7, generira klijent), `user_id`, `created_at`, `updated_at` (postavlja poslužitelj okidačem, služi samo kao kursor), `client_updated_at` (vrijeme izmjene na uređaju, služi za sukobe), `deleted_at` (soft delete za sync), `rev` (cijeli broj).

| Tablica | Ključna polja |
| --- | --- |
| profiles | locale, currency, timezone, onboarded_at, plan_defaults |
| categories | name, icon, color_token, sort, is_system, archived |
| transactions | amount_cents, type (expense/income), category_id, note, merchant, local_date, occurred_at, source (manual/scan/recurring), receipt_id?, recurring_id? |
| recurring_items | name, amount_cents, day_of_month, category_id, active, start_date, end_date?, icon_key |
| month_plans | month (YYYY-MM), income_cents, savings_cents |
| budgets | category_id, month?, limit_cents (Premium) |
| receipts | merchant, total_cents, issued_at, fiscal_ref? (JIR), status, image_path? |
| receipt_items | receipt_id, raw_name, name, amount_cents, category_id, confidence, line_type (item/discount/deposit) |
| merchant_rules | pattern, category_id, hits (učenje iz ispravaka, po korisniku) |
| entitlements | premium_until, source, product (yearly/monthly/lifetime), rc_customer_id (piše samo webhook) |
| scan_usage | month, count (piše samo poslužitelj) |

**RLS:** svaka tablica `user_id = auth.uid()` za čitanje/pisanje, osim `entitlements` i `scan_usage` (samo čitanje klijentu). **Storage:** bucket za račune privatan, politika po putanji `{user_id}/…` (korisnik piše i čita samo svoju mapu).

**Indeksi:** `(user_id, local_date desc)`, `(user_id, category_id, local_date)`, `(user_id, updated_at, id)` za sync.

### 4.4 Sinkronizacija (offline-first)
1. **Zapis:** UI piše u SQLite i u `outbox` (operacija, payload, idempotency ključ) u istoj transakciji.
2. **Slanje:** pozadinski u skupinama (≤ 100 operacija), s eksponencijalnim ponavljanjem; poslužitelj je idempotentan (upsert po `id`).
3. **Povlačenje:** po kursoru `(updated_at, id)`, stranice po 500, s `deleted_at` za brisanja. Svako povlačenje kreće od kursora umanjenog za 5 s preklopa. Transakcije koje se istodobno potvrđuju mogu se pojaviti obrnutim redom, a bez preklopa bi se takav redak trajno preskočio. Duplikati iz preklopa su bezopasni jer je upsert idempotentan.
4. **Sukobi:** pobjeđuje zadnja izmjena po zapisu prema `client_updated_at`, zatim veći `rev`, zatim `id`. Serverski `updated_at` se ne koristi za sukobe. Inače bi offline izmjena napravljena ranije, a poslana kasnije, pregazila noviju izmjenu s drugog uređaja. Zbrojevi se uvijek računaju iz transakcija, nikad ne sinkroniziraju kao vrijednost.
5. **Povezivanje računa:** gost ima anonimni `uid` od prvog pokretanja; podaci su lokalni dok ne poveže račun. „Spremi i sinkroniziraj“ povezuje Google/Apple/OTP identitet na isti `uid` i pokreće slanje outboxa. Ništa se ne seli, pa nema posebne migracije.
6. **[ODLUKA D-10] Prijava u postojeći račun s lokalnim podacima** (npr. novi uređaj): spojiti ili zamijeniti. Preporuka: spojiti (uuid v7 se ne sudaraju), uz lokalnu sigurnosnu kopiju prije spajanja i prepisivanje `user_id` lokalnih redaka na postojeći račun prije slanja.
7. **Verzije:** migracije sheme na uređaju, `schema_version` u zaglavlju sinkronizacije; stari klijent dobiva poruku „ažuriraj aplikaciju“ umjesto pogrešnih podataka.

### 4.5 Skeniranje računa (cjevovod)
1. **Kamera:** expo-camera, automatski okidač kad je kadar stabilan.
2. **QR na uređaju:** čita se fiskalni QR (iznos, datum, referenca). Ti podaci su izvor istine za ukupni iznos i datum. **Format treba potvrditi na stvarnim računima (barem 10 različitih trgovina) prije izgradnje.**
3. **Slika:** širina ≤ 1200 px, visina do 4000 px, JPEG kvaliteta ~0,7 (expo-image-manipulator). Dulji računi režu se na dijelove s preklopom. Ograničenje po duljoj strani (npr. 1600 px) dugi račun svodi na nečitljivu traku. Šalje se u privatni bucket (potpisani URL).
4. **Edge Function `scan-receipt`:** provjeri sesiju (i anonimnu) → provjeri App Attest/Play Integrity token → provjeri Premium ili kvotu (3/mj) → pozovi vision model sa JSON shemom i popisom korisnikovih kategorija + `merchant_rules` kao primjeri → validiraj zbroj → vrati stavke.
5. **Validacija zbroja:** model vraća i retke popusta, loyalty umanjenja i povratne naknade (`line_type`). Zbroj svih redaka uspoređuje se s QR iznosom uz toleranciju od ±0,02 € (zaokruživanje); veće odstupanje označava račun „provjeri“.
6. **Pregled:** ekran „Pregledaj“ grupirano po kategoriji; dodir mijenja kategoriju; „Spremi sve“ piše u lokalnu bazu. Ispravke ažuriraju `merchant_rules`.
7. **Privatnost:** slika se briše odmah nakon obrade (osim ako korisnik odabere čuvanje); cron briše slike starije od 24 h koje obrada nije stigla obrisati. Dedupliciranje po `fiscal_ref`.
8. **Trošak i zaštita:** ograničenje brzine po korisniku i po uređaju, dnevni limit poziva, alarm na potrošnju AI-ja, mogućnost prebacivanja modela bez izdavanja nove verzije aplikacije (remote config).

### 4.6 Plaćanja i pristup
- RevenueCat entitlement `premium`; proizvodi: godišnji, mjesečni, doživotni (rana ponuda). Probno razdoblje 7 dana na godišnjem.
- RevenueCat `app_user_id` = Supabase `uid` (i anonimni). Kupnja prije povezivanja računa ostaje na istom korisniku nakon povezivanja.
- Webhook → `entitlements` u bazi. Webhook je idempotentan po ID-u događaja, a događaje koji stignu krivim redom slaže po vremenu događaja. **Poslužitelj odlučuje o Premiumu** (Edge Function ne vjeruje klijentu).
- **Pošteno korištenje:** sva Premium skeniranja imaju gornju granicu (radno 100 mjesečno), napisanu u uvjetima prije prve prodaje. Posebno je važna za doživotni plan: prihod je jednokratan, a trošak AI-ja traje.
- „Vrati kupnju“ i upravljanje pretplatom vode u postavke trgovine. Svi paywallovi imaju jasan „Zatvori“.
- Paywall se prikazuje samo na trenucima vrijednosti (skeniranje preko kvote, uvidi, izvoz, uvoz).
- **[ODLUKA D-03] Cijene:** objaviti tek nakon bete (trošak AI-ja + reakcije). Radno: 19,99 €/god, 2,99 €/mj, 39 € doživotno (prvih 200), sve uz granicu poštenog korištenja.

### 4.7 Prijava
- Pri prvom pokretanju stvara se anonimna Supabase sesija. Aplikacija radi bez računa, podaci su lokalni. Anonimni korisnik može skenirati (u kvoti) i kupiti Premium.
- Račun se nudi kao „Spremi i sinkroniziraj“ (smanjuje trenje pri prvom pokretanju) i povezuje identitet na postojeći anonimni `uid`.
- Google i Apple (obavezno oba na iOS-u uz Google prijavu), e-mail OTP kao rezerva.
- Stvaranje anonimnih sesija ograničeno brzinom po uređaju (zaštita kvote, vidi §4.5).
- Brisanje računa unutar aplikacije (zahtjev Apple/Google). Izvoz podataka na zahtjev.

## 5. Performanse (proračun i pravila)

**Pravila implementacije**
- Početni ekran se renderira iz SQLite, mreža nije na kritičnom putu.
- Brojke (limit, zbrojevi) računaju se jednim upitom s indeksima; memoiziraj po mjesecu.
- Ekrani se učitavaju lijeno; teške biblioteke (kamera, grafovi) tek kad zatrebaju.
- Nema velikih JSON-ova u renderu; liste su virtualizirane (FlashList), stavke čiste komponente.
- Animacije samo transform/opacity na UI niti.
- Slike i ikone vektorski/SVG; fontovi učitani prije prvog ekrana (splash drži).
- Sve mrežne operacije su pozadinske i ne blokiraju UI; optimistični prikaz.
- Rad s velikim brojem zapisa: stranične upite i agregacije raditi u SQL-u, ne u JS-u.

**Mjerenje**
- Sentry performanse + vlastite oznake (`cold_start`, `home_ready`, `scan_capture→result`, `sync_pull`).
- „Proračun“ u CI-ju: veličina bundlea ne smije porasti > 5 % bez odobrenja.
- Profiliranje na stvarnom srednjem Androidu prije svakog izdanja.

**Skala (tisuće korisnika)**
- Procjena: 50.000 korisnika × ~600 transakcija/god ≈ 30 M redaka/god. Postgres to podnosi uz indekse po `user_id`; arhiviranje starijih od N godina nije potrebno u v1.
- Povlačenje u stranicama, ograničenje veličine skupine, idempotentno slanje.
- Edge Functions bez stanja; ograničenje istodobnosti i red čekanja za AI ako dođe do vršnih opterećenja.
- Okruženja: dev, staging, prod kao odvojeni Supabase projekti; migracije samo kroz verzionirane datoteke.

## 6. Dizajn i UX
- **Izvor:** dizajn sustav UnitCent (boje, tipografija, razmaci, obrasci). Tokeni se generiraju u `packages/tokens` i koriste u aplikaciji i webu.
- **Teme:** u aplikaciji svijetla i tamna kao ravnopravne; prate sustav, korisnik može zaključati. Svaki ekran se dizajnira i provjerava u obje. Marketinška stranica je samo tamna (vidi §12).
- **Navigacija:** Početna · Pregled · [+] · Pretplate · Profil. Tipka + uvijek vidljiva, unos je bottom sheet, ne novi ekran.
- **Početna:** „Danas još smiješ“ (jedan veliki broj, §4.2), mjesec (potrošeno/plan), sljedeće naplate, zadnji troškovi.
- **Onboarding (≤ 60 s):** 1) primanja, 2) obavezni troškovi (ponuđeni popularni), 3) štednja → odmah prikaži preporučeni dnevni trošak. Bez računa.
- **Mikro-interakcije:** haptika na spremanju/brisanju/limitu, odbrojavanje iznosa, povlačenje ulijevo za brisanje s „Poništi“.
- **Pristupačnost:** Dynamic Type do 130 % bez rezanja, kontrast ≥ 4.5:1, oznake za čitače zaslona, bez značenja samo bojom.
- **Jezik:** hrvatski prvi; sav tekst kroz i18n (i18next + expo-localization), formati valute/datuma po lokalitetu. Spremno za sl/bs/sr (latinica) i druge valute.
- **Prazna stanja:** jedna rečenica + jedna akcija. Bez ilustracija ljudi, bez emojija kao ikona.

## 7. Sigurnost i privatnost (GDPR)
- RLS na svim tablicama i na Storageu, najmanje privilegija; `service_role` ključ samo u Edge Functions.
- Tajne samo u EAS/Supabase/Vercel secrets. Nikad u repo (`.env*` ignoriran).
- Tokeni u expo-secure-store. Opcionalno zaključavanje aplikacije biometrijom.
- Promet isključivo TLS; slike računa u privatnom bucketu, kratki potpisani URL-ovi, brisanje nakon obrade.
- Zapisnici bez osobnih podataka (bez iznosa i naziva trgovina u logovima).
- Ugovor o obradi podataka s pružateljem AI-ja; isključeno korištenje podataka za treniranje.
- Politika privatnosti (nacrt postoji na /privatnost) i uvjeti korištenja (uključujući pošteno korištenje skeniranja): pravni pregled prije lansiranja.
- Pružatelj podataka u EU regiji (Frankfurt); navesti u politici kad se potvrdi.

## 8. Kvaliteta i testiranje
- **Jedinični testovi (obavezni):**
  - novac;
  - dnevni limit: zadnji dan mjeseca, prekoračenje i negativan „danas još smiješ“, mjesec s 28/29/30/31 dana, današnja potrošnja smanjuje današnji broj točno za svoj iznos, knjižena pretplata ne smanjuje limit dvaput;
  - ponavljanja: `day_of_month` 31 u veljači;
  - sync: sukobi po `client_updated_at` (offline izmjena stigne kasnije), duplikati, preklop kursora;
  - pretvorba skeniranog računa u transakcije, uključujući popuste i povratnu naknadu.
- **Integracijski:** Edge Functions (auth i anonimna sesija, attestation, kvota, entitlement, nevaljana slika, vremensko ograničenje); webhook (ponovljeni i zamijenjeni redoslijed događaja).
- **E2E (Maestro):** onboarding, dodaj trošak, pretplata, skeniranje (mock), paywall, kupnja prije i nakon povezivanja računa, brisanje računa.
- **Ručno:** matrica uređaja (min. 2 iPhonea, 3 Androida različite snage), spora mreža, zrakoplovni način, tamna/svijetla tema, najveća veličina fonta, dugi računi (> 40 cm).
- **Definicija gotovog:** funkcija radi offline gdje treba, ima prazno stanje i stanje greške, obje teme, pristupačnost provjerena, testovi zeleni, performanse unutar proračuna, tekstovi na hrvatskom.

## 9. Plan rada po fazama

| Faza | Sadržaj | Izlazni kriterij |
| --- | --- | --- |
| 0. Temelji | Monorepo, packages/core (+ testovi), packages/tokens, Expo ljuska s navigacijom i temama, Supabase okruženja, CI (lint/test/build), Sentry | Prazna app se pokreće na iOS i Androidu, obje teme, CI zelen |
| 1. Lokalni MVP | Anonimna sesija, onboarding, plan, unos troška, kategorije, pretplate + kalendar, pregled, početni ekran s limitom, lokalne obavijesti | Vlasnik koristi app 2 tjedna umjesto Excela; sve radi offline |
| 2. Račun i sync | Google/Apple/OTP povezivanje na anonimni uid, sync motor, spajanje na postojeći račun (D-10), brisanje računa, izvoz podataka | Dva uređaja pokazuju iste podatke; offline → online bez gubitka; offline izmjena ne pregazi noviju |
| 3. AI skeniranje | Kamera + QR, scan-receipt, App Attest/Play Integrity, ekran Pregledaj, učenje iz ispravaka, kvota 3/mj | p50 < 5 s; točnost ≥ cilja na 50 stvarnih računa (uključujući duge i s popustima) |
| 4. Plaćanja | RevenueCat (app_user_id = uid), paywall, probno razdoblje, webhook → entitlements, vrati kupnju | Kupnja u sandboxu otključava Premium na poslužitelju, i prije i nakon povezivanja računa |
| 5. Poliranje i beta | Performanse, pristupačnost, i18n tvrdnje, ikone/splash, TestFlight + Play interno, 20–50 testera | Crash-free ≥ 99,5 %, svi mjerni ciljevi iz §1 |
| 6. Lansiranje | Store listinzi, privatnost, ASO, objava, praćenje lijevka | Objavljeno na oba storea |
| 7. Nakon lansiranja | Shopping lista (cjenici trgovina), zajednički budžet, uvoz Excela, widgeti, uvidi | Po prioritetu iz podataka |

Svaka faza završava demonstracijom, ažuriranjem ovog dokumenta (§12) i odlukom „idemo dalje / ispravljamo“.

## 10. Rizici i ublažavanje

| Rizik | Ublažavanje |
| --- | --- |
| Loša točnost AI-ja na izblijedjelim računima | QR kao izvor iznosa, obvezan ekran pregleda, učenje iz ispravaka, jasna poruka „račun nije čitljiv“ |
| Trošak AI-ja raste | Mali model, smanjene slike, kvote i ograničenja, granica poštenog korištenja (i za doživotni plan), alarmi, remote config za zamjenu modela |
| Zloupotreba besplatnih skeniranja (nove anonimne sesije, reinstalacija) | App Attest/Play Integrity, ograničenje po uređaju, ograničenje brzine stvaranja anonimnih sesija |
| Odbijanje u storeu (plaćanja, prijava, brisanje računa) | Apple IAP za digitalne usluge, Apple prijava uz Google, brisanje računa u aplikaciji, jasan paywall |
| Spora aplikacija na slabim uređajima | Proračun performansi, profiliranje, lijeno učitavanje, FlashList |
| Gubitak podataka pri sinkronizaciji | Idempotentni zapisi, soft delete, sukobi po vremenu uređaja, preklop kursora, testovi sukoba, lokalna sigurnosna kopija prije spajanja računa |
| Pogrešan dnevni limit (dvostruko brojanje, današnja potrošnja) | Jedna formula u packages/core (§4.2), testovi rubnih slučajeva |
| Cjenici trgovina nedostupni/licenca | Provjeriti format i uvjete prije obećanja; shopping lista tek u v1.1 |
| Pravni rizik (privatnost, uvjeti) | Pravni pregled prije lansiranja |

## 11. Otvorene odluke za vlasnika

| ID | Odluka | Preporuka |
| --- | --- | --- |
| D-01 | Stilizacija (tokeni + Unistyles ili običan StyleSheet) | Tokeni; Unistyles ako se potvrdi stabilnost |
| D-02 | Sync: vlastiti ili PowerSync | Vlastiti za v1 |
| D-03 | Konačne cijene i doživotna ponuda | Nakon bete; sve uz granicu poštenog korištenja |
| D-04 | Besplatnih skeniranja mjesečno (3 ili 5) | 3 |
| D-05 | Nazivi paketa / identifikatori u storeovima (bundle ID, npr. com.unitcent.app) | Rezervirati što prije |
| D-06 | Apple Developer i Google Play račun (tko je vlasnik, obrt/privatno) | Obrt ako postoji (porezni tretman, knjigovođa). Napomena: u storeu se kao prodavatelj prikazuje pravni naziv računa. Apple organizacijski račun traži pravnu osobu i D-U-N-S broj; obrt (jedan vlasnik) se vjerojatno upisuje kao fizička osoba. Provjeriti prije registracije. |
| D-07 | Analitika (PostHog EU vs. samo Vercel/Plausible na webu) | PostHog EU, bez osobnih podataka |
| D-08 | Podrška i e-adresa (podrska@unitcent.com još nema sandučić) | Napraviti prije bete |
| D-09 | Neplanirani prihodi ulaze u dnevni limit? | Da, dodaju se raspoloživom za mjesec |
| D-10 | Prijava u postojeći račun s lokalnim podacima: spojiti ili zamijeniti | Spojiti, uz lokalnu kopiju prije spajanja |

## 12. Dnevnik odluka i stanja (ažurirati)
- **2026-10-15:** odlučeno ime UnitCent, domena unitcent.com, stog Expo + Supabase + RevenueCat + Vercel (web).
- **2026-10-15:** web objavljen; waitlist u Supabaseu; dizajn sustav i logo (prsten) potvrđeni.
- **2026-10-15:** odlučeno da je marketinška stranica samo tamna; aplikacija ima obje teme.
- **2026-10-15:** tehnički pregled plana (v1.1). Kao zadane preporuke uvedeni su:
  - anonimna sesija od prvog pokretanja i RevenueCat ID = uid;
  - jedna formula dnevnog limita bez dvostrukog brojanja pretplata;
  - sukobi po vremenu uređaja i preklop kursora;
  - slike računa ograničene po širini;
  - validacija zbroja s popustima i povratnom naknadom;
  - App Attest/Play Integrity;
  - granica poštenog korištenja.

  Otvorene su nove odluke D-09 i D-10.

**Sljedeće:** Faza 0. Prvi konkretni koraci:
1. rezervirati bundle ID i developer račune (provjeriti D-06);
2. napraviti dev/staging Supabase projekte i uključiti anonimnu prijavu;
3. inicijalizirati monorepo i packages/core s testovima dnevnog limita prema §4.2.
