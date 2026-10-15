# UnitCent: plan aplikacije (v1.0)

Namjena dokumenta: da svatko (vlasnik, agent, budući suradnik) u svakom trenutku zna **cilj, odluke, arhitekturu, redoslijed rada i kriterije kvalitete**.
Pravila rada i „zvijezda vodilja“ su u [../CLAUDE.md](../CLAUDE.md). Proizvod i monetizacija su u [PRODUCT.md](PRODUCT.md).
Odluke označene **[ODLUKA]** trebaju vlasnikov potpis prije izvedbe. Sve ostalo je preporuka koju smatramo zadanom.

---

## 1. Cilj i mjerila uspjeha

**Cilj:** najbrža i najjednostavnija hrvatska aplikacija za praćenje troškova koja svaki dan odgovara na pitanje „koliko danas smijem potrošiti“, uz AI skeniranje računa kao glavni razlog za Premium.

| Mjerilo | Cilj za lansiranje |
|---|---|
| Hladni start do upotrebljivog početnog ekrana (srednji Android, 3 godine star) | < 2,0 s (iPhone < 1,2 s) |
| Unos troška (od otvaranja sheeta do spremljenog) | ≤ 3 dodira, zapis u lokalnu bazu < 50 ms |
| Skeniranje računa: okidanje → razvrstane stavke | p50 < 5 s, p95 < 8 s |
| Klizanje listi | 60 fps (bez ispuštenih okvira na popisu od 1.000 stavki) |
| Crash-free sesije | ≥ 99,5 % |
| Veličina aplikacije (preuzimanje) | < 40 MB |
| Aktivacija | ≥ 60 % novih korisnika unese prvi trošak unutar 24 h |
| Točnost skeniranja | ≥ 85 % stavki ispravno razvrstano bez ispravke; ≥ 95 % ukupnog iznosa točno (QR) |
| Konverzija u plaćeno | 2–5 % aktivnih (provjeriti nakon 2–3 mjeseca) |

---

## 2. Opseg

### 2.1 Free (uvijek besplatno)
- Brzi unos troška/prihoda, kategorije (zadane + vlastite), bilješka, datum.
- Pretplate i fiksni troškovi: automatsko knjiženje, kalendar naplata, podsjetnik dan prije.
- Mjesečni plan: primanja, obavezno, štednja → preporučeni dnevni trošak.
- Pregled po kategorijama i usporedba s prošlim mjesecom.
- Rad bez interneta, sinkronizacija u pozadini (uz račun).
- Tamna/svijetla tema, hrvatski jezik, euro.
- **3 AI skeniranja mjesečno** (provodi poslužitelj).

### 2.2 Premium
- AI skeniranje računa bez ograničenja (QR + stavke + učenje iz ispravaka).
- AI uvidi i trendovi („Cigarete +30 %“, „Imaš 3 streaming pretplate“).
- Budžeti po kategoriji s upozorenjem.
- Uvoz iz Excela, izvoz (Excel/PDF), widgeti.
- Kasnije (v1.1+): pametna shopping lista s usporedbom cijena, zajednički budžet za par/kućanstvo.

### 2.3 Izvan opsega za v1
Povezivanje s bankom (PSD2), investicije, više valuta u istom planu, web aplikacija za unos, tablet raspored.

---

## 3. Tehnološki stog (preporuka i razlozi)

| Sloj | Odabir | Zašto |
|---|---|---|
| Aplikacija | **Expo (React Native) + TypeScript**, Expo Router, nova arhitektura (Fabric), Hermes | Jedan kod za iOS i Android, brz razvoj, OTA ispravke (EAS Update), dobar ekosustav |
| Lokalna baza | **expo-sqlite** + tipizirani upiti (Drizzle ORM) | Trenutan unos i čitanje, offline-first, migracije na uređaju |
| Stanje | Zustand (UI/sesija), čitanje podataka iz SQLite pretplatama na promjene | Malo re-rendera, jednostavno |
| Liste | **FlashList** | Glatko klizanje na dugim popisima |
| Animacije/geste | Reanimated 3 + Gesture Handler | Animacije na UI niti, 60 fps |
| Slike | expo-image | Keširanje, brzo dekodiranje |
| Ikone | Phosphor (react-native) | Isti set kao dizajn sustav |
| Backend | **Supabase** (Postgres + RLS, Auth, Storage, Edge Functions) | Već imamo projekt; EU regija; RLS štiti podatke po korisniku |
| AI | Vision model „mali i brz“ preko Edge Function, strukturirani JSON izlaz | Nizak trošak po računu, ključ samo na poslužitelju |
| Plaćanja | **RevenueCat** (`react-native-purchases`) | In-app pretplate na obje platforme, webhookovi, probno razdoblje |
| Prijava | Supabase Auth: **Google**, **Apple**, e-mail OTP kao rezerva | Google traži vlasnik; Apple je obavezan uz Google na iOS-u |
| Obavijesti | Lokalne (podsjetnik naplate, rade offline) + push samo za ključne događaje | Pouzdano i jeftino |
| Praćenje grešaka | Sentry (greške + performanse) | Crash-free mjerenje, tragovi |
| Analitika | PostHog (EU) ili Plausible za web; događaji bez osobnih podataka | Lijevak aktivacije i paywalla |
| Build/isporuka | EAS Build/Submit/Update, GitHub Actions | Ponovljivi buildovi, OTA |
| Testovi | Vitest/Jest (logika), Maestro (E2E), ručni TestFlight/Play interni | Pokriva novac, sync i ključne tokove |

**[ODLUKA D-01] Stilizacija:** vlastiti tokeni + `StyleSheet` s `useTheme()` (jednostavno, bez ovisnosti) ili `react-native-unistyles` (brže teme bez re-rendera). Preporuka: **tokeni + Unistyles ako se potvrdi stabilnost**; inače običan `StyleSheet`.
**[ODLUKA D-02] Sync:** vlastiti lagani sinkronizacijski sloj (outbox + povlačenje po kursoru) ili **PowerSync**. Preporuka: **vlastiti** za v1 (podaci su mali i po korisniku), PowerSync razmotriti tek kod zajedničkih budžeta.

---

## 4. Arhitektura

```
Mobilna aplikacija (Expo)
 ├─ UI (ekrani, komponente, teme)
 ├─ Domena (čista logika: novac u centima, dnevni limit, ponavljanja)  ← dijeli se s webom i testovima
 ├─ Lokalna baza (SQLite) ── izvor istine za UI
 ├─ Sync motor (outbox ↔ Supabase, pozadinski)
 └─ Servisi (kamera/QR, obavijesti, RevenueCat, Auth, Sentry)
           │
           ▼
Supabase (EU)
 ├─ Postgres + RLS (po user_id)
 ├─ Auth (Google/Apple/OTP)
 ├─ Storage (privatni bucket za slike računa, kratko zadržavanje)
 ├─ Edge Functions: scan-receipt, revenuecat-webhook, delete-account, export-data
 └─ Cron: ponavljajuće stavke (ako treba), čišćenje slika, cjenici trgovina (faza kasnije)
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

### 4.2 Novac i vrijeme
- Iznosi su **cijeli brojevi u centima** (`int`), nikad `float`. Prikaz formatira `Intl.NumberFormat('hr-HR')`.
- Vremenska zona korisnika: `Europe/Zagreb` zadano. Datumi troškova se spremaju kao **lokalni datum** (`YYYY-MM-DD`) uz `occurred_at` (UTC) za sortiranje.
- Mjesec za plan = kalendarski mjesec; „preostali dani“ uključuju današnji dan.

### 4.3 Model podataka (skica)
Svaki redak: `id` (uuid v7, generira klijent), `user_id`, `created_at`, `updated_at`, `deleted_at` (soft delete za sync), `rev` (cijeli broj).

| Tablica | Ključna polja |
|---|---|
| `profiles` | `locale`, `currency`, `timezone`, `onboarded_at`, `plan_defaults` |
| `categories` | `name`, `icon`, `color_token`, `sort`, `is_system`, `archived` |
| `transactions` | `amount_cents`, `type` (expense/income), `category_id`, `note`, `merchant`, `local_date`, `occurred_at`, `source` (manual/scan/recurring), `receipt_id?`, `recurring_id?` |
| `recurring_items` | `name`, `amount_cents`, `day_of_month`, `category_id`, `active`, `start_date`, `end_date?`, `icon_key` |
| `month_plans` | `month` (`YYYY-MM`), `income_cents`, `savings_cents` |
| `budgets` | `category_id`, `month?`, `limit_cents` (Premium) |
| `receipts` | `merchant`, `total_cents`, `issued_at`, `fiscal_ref?` (JIR), `status`, `image_path?` |
| `receipt_items` | `receipt_id`, `raw_name`, `name`, `amount_cents`, `category_id`, `confidence` |
| `merchant_rules` | `pattern`, `category_id`, `hits` (učenje iz ispravaka, per korisnik) |
| `entitlements` | `premium_until`, `source`, `rc_customer_id` (piše samo webhook) |
| `scan_usage` | `month`, `count` (piše samo poslužitelj) |

**RLS:** svaka tablica `user_id = auth.uid()` za čitanje/pisanje, osim `entitlements` i `scan_usage` (samo čitanje klijentu). Indeksi: `(user_id, local_date desc)`, `(user_id, category_id, local_date)`, `(user_id, updated_at, id)` za sync.

### 4.4 Sinkronizacija (offline-first)
1. **Zapis:** UI piše u SQLite i u `outbox` (operacija, payload, idempotency ključ) u istoj transakciji.
2. **Slanje:** pozadinski u skupinama (≤ 100 operacija), s eksponencijalnim ponavljanjem; poslužitelj je idempotentan (upsert po `id`).
3. **Povlačenje:** po kursoru `(updated_at, id)`, stranice po 500, s `deleted_at` za brisanja.
4. **Sukobi:** zadnja izmjena pobjeđuje po zapisu (`updated_at` poslužitelja). Zbrojevi se uvijek računaju iz transakcija, nikad ne sinkroniziraju kao vrijednost.
5. **Prvi račun:** lokalni podaci se šalju na poslužitelj pri prvoj prijavi (migracija „gost → račun“).
6. **Verzije:** migracije sheme na uređaju, `schema_version` u zaglavlju sinkronizacije; stari klijent dobiva poruku „ažuriraj aplikaciju“ umjesto pogrešnih podataka.

### 4.5 Skeniranje računa (cjevovod)
1. **Kamera:** `expo-camera`, automatski okidač kad je kadar stabilan.
2. **QR na uređaju:** čita se fiskalni QR (iznos, datum, referenca). Ti podaci su **izvor istine** za ukupni iznos i datum. *Format treba potvrditi na stvarnim računima prije izgradnje.*
3. **Slika:** smanji na ≤ 1600 px duže stranice, JPEG kvaliteta ~0,7 (`expo-image-manipulator`), pošalji u privatni bucket (potpisani URL).
4. **Edge Function `scan-receipt`:** provjeri prijavu → provjeri Premium ili kvotu (3/mj) → pozovi vision model sa JSON shemom i popisom korisnikovih kategorija + `merchant_rules` kao primjeri → validiraj da zbroj stavki odgovara QR iznosu (inače označi „provjeri“) → vrati stavke.
5. **Pregled:** ekran „Pregledaj“ grupirano po kategoriji; dodir mijenja kategoriju; „Spremi sve“ piše u lokalnu bazu. Ispravke ažuriraju `merchant_rules`.
6. **Privatnost:** slika se briše odmah nakon obrade (osim ako korisnik odabere čuvanje). Dedupliciranje po `fiscal_ref`.
7. **Trošak i zaštita:** ograničenje brzine po korisniku, dnevni limit poziva, alarm na potrošnju AI-ja, mogućnost prebacivanja modela bez izdavanja nove verzije aplikacije (remote config).

### 4.6 Plaćanja i pristup
- RevenueCat entitlement `premium`; proizvodi: godišnji, mjesečni, doživotni (rana ponuda). Probno razdoblje 7 dana na godišnjem.
- Webhook → `entitlements` u bazi. **Poslužitelj odlučuje** o Premiumu (Edge Function ne vjeruje klijentu).
- „Vrati kupnju“ i upravljanje pretplatom vode u postavke trgovine. Svi paywallovi imaju jasan „Zatvori“.
- Paywall se prikazuje samo na trenucima vrijednosti (skeniranje preko kvote, uvidi, izvoz, uvoz).
- **[ODLUKA D-03] Cijene:** objaviti tek nakon bete (trošak AI-ja + reakcije). Radno: 19,99 €/god, 2,99 €/mj, 39 € doživotno (prvih 200).

### 4.7 Prijava
- Aplikacija radi **bez računa** (lokalno). Račun se nudi kao „Spremi i sinkroniziraj“ (smanjuje trenje pri prvom pokretanju).
- Google i Apple (obavezno oba na iOS-u uz Google prijavu), e-mail OTP kao rezerva.
- Brisanje računa **unutar aplikacije** (zahtjev Apple/Google). Izvoz podataka na zahtjev.

---

## 5. Performanse (proračun i pravila)

**Pravila implementacije**
- Početni ekran se renderira iz SQLite, mreža nije na kritičnom putu.
- Brojke (limit, zbrojevi) računaju se jednim upitom s indeksima; memoiziraj po mjesecu.
- Ekrani se učitavaju lijeno; teške biblioteke (kamera, grafovi) tek kad zatrebaju.
- Nema velikih JSON-ova u renderu; liste su virtualizirane (FlashList), stavke čiste komponente.
- Animacije samo `transform`/`opacity` na UI niti.
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
- Okruženja: `dev`, `staging`, `prod` kao odvojeni Supabase projekti; migracije samo kroz verzionirane datoteke.

---

## 6. Dizajn i UX

- **Izvor:** dizajn sustav UnitCent (boje, tipografija, razmaci, obrasci). Tokeni se generiraju u `packages/tokens` i koriste u aplikaciji i webu.
- **Teme:** svijetla i tamna kao ravnopravne; prate sustav, korisnik može zaključati. Svaki ekran se dizajnira i provjerava u obje.
- **Navigacija:** Početna · Pregled · [+] · Pretplate · Profil. Tipka + uvijek vidljiva, unos je bottom sheet, ne novi ekran.
- **Početna:** preporučeni dnevni trošak (jedan veliki broj), mjesec (potrošeno/plan), sljedeće naplate, zadnji troškovi.
- **Onboarding (≤ 60 s):** 1) primanja, 2) obavezni troškovi (ponuđeni popularni), 3) štednja → odmah prikaži preporučeni dnevni trošak. Bez računa.
- **Mikro-interakcije:** haptika na spremanju/brisanju/limitu, odbrojavanje iznosa, povlačenje ulijevo za brisanje s „Poništi“.
- **Pristupačnost:** Dynamic Type do 130 % bez rezanja, kontrast ≥ 4.5:1, oznake za čitače zaslona, bez značenja samo bojom.
- **Jezik:** hrvatski prvi; sav tekst kroz i18n (`i18next` + `expo-localization`), formati valute/datuma po lokalitetu. Spremno za sl/bs/sr (latinica) i druge valute.
- **Prazna stanja:** jedna rečenica + jedna akcija. Bez ilustracija ljudi, bez emojija kao ikona.

---

## 7. Sigurnost i privatnost (GDPR)

- RLS na svim tablicama, najmanje privilegija; `service_role` ključ samo u Edge Functions.
- Tajne samo u EAS/Supabase/Vercel secrets. Nikad u repo (`.env*` ignoriran).
- Tokeni u `expo-secure-store`. Opcionalno zaključavanje aplikacije biometrijom.
- Promet isključivo TLS; slike računa u privatnom bucketu, kratki potpisani URL-ovi, brisanje nakon obrade.
- Zapisnici bez osobnih podataka (bez iznosa i naziva trgovina u logovima).
- Ugovor o obradi podataka s pružateljem AI-ja; isključeno korištenje podataka za treniranje.
- Politika privatnosti (nacrt postoji na `/privatnost`) i uvjeti korištenja: **pravni pregled prije lansiranja**.
- Pružatelj podataka u EU regiji (Frankfurt); navesti u politici kad se potvrdi.

---

## 8. Kvaliteta i testiranje

- **Jedinični testovi (obavezni):** novac, dnevni limit (rubni slučajevi: zadnji dan mjeseca, prekoračenje, mjesec s 28/29/30/31 dana), ponavljanja, sync (sukobi, duplikati), pretvorba skeniranog računa u transakcije.
- **Integracijski:** Edge Functions (auth, kvota, entitlement, nevaljana slika, vremensko ograničenje).
- **E2E (Maestro):** onboarding, dodaj trošak, pretplata, skeniranje (mock), paywall, brisanje računa.
- **Ručno:** matrica uređaja (min. 2 iPhonea, 3 Androida različite snage), spora mreža, zrakoplovni način, tamna/svijetla tema, najveća veličina fonta.
- **Definicija gotovog:** funkcija radi offline gdje treba, ima prazno stanje i stanje greške, obje teme, pristupačnost provjerena, testovi zeleni, performanse unutar proračuna, tekstovi na hrvatskom.

---

## 9. Plan rada po fazama

| Faza | Sadržaj | Izlazni kriterij |
|---|---|---|
| **0. Temelji** | Monorepo, `packages/core` (+ testovi), `packages/tokens`, Expo ljuska s navigacijom i temama, Supabase okruženja, CI (lint/test/build), Sentry | Prazna app se pokreće na iOS i Androidu, obje teme, CI zelen |
| **1. Lokalni MVP** | Onboarding, plan, unos troška, kategorije, pretplate + kalendar, pregled, početni ekran s limitom, lokalne obavijesti | Vlasnik koristi app 2 tjedna umjesto Excela; sve radi offline |
| **2. Račun i sync** | Google/Apple/OTP, prijava „gost → račun“, sync motor, brisanje računa, izvoz podataka | Dva uređaja pokazuju iste podatke; offline → online bez gubitka |
| **3. AI skeniranje** | Kamera + QR, `scan-receipt`, ekran Pregledaj, učenje iz ispravaka, kvota 3/mj | p50 < 5 s; točnost ≥ cilja na 50 stvarnih računa |
| **4. Plaćanja** | RevenueCat, paywall, probno razdoblje, webhook → `entitlements`, vrati kupnju | Kupnja u sandboxu otključava Premium na poslužitelju |
| **5. Poliranje i beta** | Performanse, pristupačnost, i18n tvrdnje, ikone/splash, TestFlight + Play interno, 20–50 testera | Crash-free ≥ 99,5 %, svi mjerni ciljevi iz §1 |
| **6. Lansiranje** | Store listinzi, privatnost, ASO, objava, praćenje lijevka | Objavljeno na oba storea |
| **7. Nakon lansiranja** | Shopping lista (cjenici trgovina), zajednički budžet, uvoz Excela, widgeti, uvidi | Po prioritetu iz podataka |

Svaka faza završava demonstracijom, ažuriranjem ovog dokumenta (§12) i odlukom „idemo dalje / ispravljamo“.

---

## 10. Rizici i ublažavanje

| Rizik | Ublažavanje |
|---|---|
| Loša točnost AI-ja na izblijedjelim računima | QR kao izvor iznosa, obvezan ekran pregleda, učenje iz ispravaka, jasna poruka „račun nije čitljiv“ |
| Trošak AI-ja raste | Mali model, smanjene slike, kvote i ograničenja, alarmi, remote config za zamjenu modela |
| Odbijanje u storeu (plaćanja, prijava, brisanje računa) | Apple IAP za digitalne usluge, Apple prijava uz Google, brisanje računa u aplikaciji, jasan paywall |
| Spora aplikacija na slabim uređajima | Proračun performansi, profiliranje, lijeno učitavanje, FlashList |
| Gubitak podataka pri sinkronizaciji | Idempotentni zapisi, soft delete, testovi sukoba, lokalna sigurnosna kopija pri migraciji |
| Cjenici trgovina nedostupni/licenca | Provjeriti format i uvjete prije obećanja; shopping lista tek u v1.1 |
| Pravni rizik (privatnost, uvjeti) | Pravni pregled prije lansiranja |

---

## 11. Otvorene odluke za vlasnika

| ID | Odluka | Preporuka |
|---|---|---|
| D-01 | Stilizacija (tokeni + Unistyles ili običan StyleSheet) | Tokeni; Unistyles ako se potvrdi stabilnost |
| D-02 | Sync: vlastiti ili PowerSync | Vlastiti za v1 |
| D-03 | Konačne cijene i doživotna ponuda | Nakon bete |
| D-04 | Besplatnih skeniranja mjesečno (3 ili 5) | 3 |
| D-05 | Nazivi paketa / identifikatori u storeovima (bundle ID, npr. `com.unitcent.app`) | Rezervirati što prije |
| D-06 | Apple Developer i Google Play račun (tko je vlasnik, obrt/privatno) | Obrt ako postoji (porezni tretman, knjigovođa) |
| D-07 | Analitika (PostHog EU vs. samo Vercel/Plausible na webu) | PostHog EU, bez osobnih podataka |
| D-08 | Podrška i e-adresa (`podrska@unitcent.com` još nema sandučić) | Napraviti prije bete |

---

## 12. Dnevnik odluka i stanja (ažurirati)

- 2026-10-15: odlučeno ime **UnitCent**, domena `unitcent.com`, stog Expo + Supabase + RevenueCat + Vercel (web).
- 2026-10-15: web objavljen; waitlist u Supabaseu; dizajn sustav i logo (prsten) potvrđeni.
- 2026-10-15: odlučeno da je **marketinška stranica samo tamna**; aplikacija ima obje teme.
- Sljedeće: **Faza 0**. Prvi konkretni koraci: (1) rezervirati bundle ID i developer račune, (2) napraviti `dev`/`staging` Supabase projekte, (3) inicijalizirati monorepo i `packages/core` s testovima dnevnog limita.
