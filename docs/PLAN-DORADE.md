# UnitCent: plan dorade do objave (20. 10. 2026.)

Nastao iz vlasnikove analize nakon EAS testa (20 točaka) i pregleda koda. Dopunjuje [ROADMAP.md](ROADMAP.md).
Svaka stavka ima: **što**, **zašto** (UX/psihologija ili pravilo trgovine) i **kako**.

## Smjer u jednoj rečenici
Aplikacija koju ljudi koriste svaki dan jer je brža i ljepša od ne-korištenja, s besplatnim dijelom koji je stvarno dovoljan
i Premiumom koji se nudi tek kad korisnik već osjeti vrijednost.

Put korisnika koji gradimo: **„korisno, probat ću“** (web, trgovina, preporuka) → **„wow, ovo je jednostavno“** (prvih 60 sekundi) →
**„ovo mi treba svaki dan“** (prvi tjedan: prsten, podsjetnik, tjedni sažetak) → **„Premium se isplati“** (kad udari u granicu koju sam osjetio).

## Načela psihologije koja primjenjujemo (i gdje)
| Načelo | Što znači | Gdje kod nas |
|---|---|---|
| Fittsov zakon + zona palca | Česte radnje moraju biti velike i blizu palca (donja trećina ekrana) | Kamera i „Spremi“ dolje; opasne radnje daleko (dno Profila) |
| Hickov zakon / kognitivno opterećenje | Svaki dodatni izbor ili rečenica usporava odluku | Brisanje objašnjavajućih podnaslova (t. 3, 14) |
| Aha-trenutak prije prodaje | Ljudi plaćaju kad su već osjetili vrijednost, ne prije | Premium se nudi na okidačima, ne na ulazu (vidi Odluka 1) |
| Okvir dobitka | „Otključaj cijelu povijest“ prodaje bolje od „Besplatno vidiš 6 mj“ (koje ističe da je free dovoljan) | Svi tekstovi paywalla (t. 9) |
| Zadana opcija i sidrenje | Većina ostaje na unaprijed odabranom; cijena po mjesecu je lakša za procjenu | Godišnje odabrano, „1,67 €/mj“ uz godišnju cijenu, cijena na gumbu (t. 4) |
| Efekt vlasništva (endowment) | Ono što sam izgradio više vrijedim | Korisnik sam slaže plan u onboardingu; zaključani limit pokazuje *njegovu* kategoriju |
| Pravilo vrhunca i kraja | Iskustvo pamtimo po vrhuncu i kraju | Mala proslava kad dan / mjesec završi ispod plana; lijep kraj unosa (prsten se pomakne) |
| Sprječavanje grešaka | Ne kažnjavaj slučajni pokret | Potvrda pri swipeu iz unosa s promjenama (t. 10) |
| Dosljednost (Gestalt) | Ista stvar na istom mjestu = manje razmišljanja | Prazna stanja i gumbi na istoj visini (t. 2) |
| Prepoznavanje prije prisjećanja | Logo se prepozna brže od teksta | Apple i Google znak na gumbima (t. 1) |
| Bez mračnih uzoraka | Skriveno otkazivanje ruši povjerenje, krši pravila EU i trgovina, smanjuje šanse za izdvajanje u trgovini | Otkazivanje vidljivo, ali tiho (t. 15) |

## A. Brzi popravci sučelja (1 do 2 dana)
| # | Što | Kako |
|---|---|---|
| 1, 16 | Ikone Applea i Googlea na ulazu; jasno da je to i prijava i registracija | Gumbi „Nastavi s Appleom“ (znak) i „Nastavi s Googleom“ (znak), jednako istaknuti (Apple pravilo 4.8). Ispod jedna crta: „Već imaš račun? Isti gumb te prijavljuje.“ U Profilu umjesto „Napravi račun“: **„Prijava ili novi račun“**, podnaslov „Sačuvaj podatke na svim uređajima“ (gubitak kao motiv). |
| 2 | Gumb „Dodaj trošak“ i „Još nema troškova“ na istoj visini na Početnoj i Pregledu | Jedna komponenta `EmptyState` s fiksnim položajem, ista na oba ekrana. |
| 3 | Maknuti tekst o kameri | Ostaje samo u Privatnosti i u sistemskom upitu (obavezan string trgovine). |
| 4 | Cijena na gumbu paywalla | Izbor Mjesečno / Godišnje (godišnje zadano, oznaka „−44 %“), ispod godišnje „1,67 €/mj“. Gumb: „Isprobaj 7 dana“ ili „Nastavi · 19,99 €/god“. Bez preširokog retka. |
| 6 | Valuta poravnata s iznosom | Poravnanje po osnovnoj crti (baseline), ne po vrhu; provjera s velikim fontom. |
| 9 | Tekstovi paywalla po okidaču | Povijest: „Otključaj cijelu povijest“. Skeniranje: „Skeniraj bez brojanja“. Limit: „Postavi limit i dobij upozorenje na 80 %“. Pravilo: reci što dobivaš, ne što free već ima. |
| 12 | Tipkovnica odmah otvorena na uređivanju | `autoFocus` na prvo polje svih ekrana za uređivanje (stavka računa, kategorija, pretplata, naziv). Ne na popisima i ne tamo gdje je glavni unos naša numerička tipkovnica. |
| 14 | Čišćenje objašnjavajućih podnaslova | Prolaz kroz sve ekrane: podnaslov ostaje samo ako bez njega korisnik ne zna što redak radi. Valute: samo naslov i popis. |
| 15 | Redoslijed Profila | Tko si → Premium (stanje, „Upravljaj pretplatom“) → Novac → Aplikacija (izgled, podsjetnik, zaključavanje) → Podaci (izvoz) → Odjava → **na samom dnu crveno „Obriši račun i sve podatke“**. |

## B. Pouzdanost i sigurnost unosa (1 do 2 dana)
| # | Što | Kako |
|---|---|---|
| 10 | Swipe dolje ne smije izgubiti unos | Kad forma ima promjene: `usePreventRemove` + potvrda „Odbaciti promjene?“ (Odbaci / Nastavi uređivati). Bez promjena se zatvara normalno. Vrijedi za unos, pregled skeniranog računa, pretplatu, kategoriju, plan. |
| 11 | Promjena kategorije stavke računa | Tihi redak „Kategorija“ s točkom boje u uređivanju stavke, otvara isti izbornik kao kod unosa. |
| 8 | Zaključavanje bez gumba koji ne stigneš kliknuti | Face ID se pokreće sam; dok traje vidi se samo znak (prsten) koji lagano „diše“ (bez animacije uz „smanji pokret“). Gumb „Pokušaj ponovno“ pojavi se tek kad Face ID ne uspije ili se otkaže. **Vlastiti PIN ne treba:** već radi zamjena šifrom uređaja (`disableDeviceFallback: false`), a vlastiti PIN je dodatni sigurnosni rizik i još jedna stvar za zapamtiti. |

## C. Veće UX dorade (3 do 5 dana)
**13. Kamera blizu palca.** Držanje plusa za izbornik ljudi rijetko otkriju (skrivene geste), a izbornik na svaki dodir dodaje klik
za 80 % slučajeva (ručni unos). Prijedlog, u tri sloja:
1. Dodir na plus otvara unos kao sad, ali **gumb kamere je dolje**, uz numeričku tipkovnicu / „Spremi“, u zoni palca.
2. **Držanje plusa = ravno u kameru** (prečac za one koji ga nađu; haptika + mali natpis prvi put: „Savjet: drži + za skeniranje“).
3. **Brze radnje na ikoni aplikacije** (dugi dodir na ikonu: „Skeniraj račun“, „Dodaj trošak“). Kasnije widget.

**17. Pretplate i kalendar.** Tekstualni gumb „+ Dodaj“ i uz kalendar. Dodir na dan otvara mali donji list (bottom sheet) s pretplatama
tog dana (swipe za uređivanje / brisanje, isti uzorak kao popis) i „+ Nova pretplata“ s već upisanim datumom.

**7. Zaključani limit kategorije.** Umjesto zlatnog bloka „Info“: redak u istom stilu kao ostala polja, s malom zlatnom oznakom
„Premium“ i živim pregledom (traka „160 od 200 €“ za *tu* kategoriju) + jedna rečenica „Javimo ti na 80 % i 100 %“.
Korisnik vidi kako bi izgledalo s njegovim podacima, pa je vrijednost jasna. Zlatna boja: suzdržanija, kao oznaka, ne kao pozadina.

**Proslava i navika (moj prijedlog):** kraj dana ispod plana → nježan pomak prstena i jedna riječ; kraj mjeseca → kartica „Listopad: 48 € ispod plana“.
Niz dana s unosom („7 dana zaredom“, nikad „izgubio si niz“). Zahtjev za ocjenu u trgovini **samo** u takvom trenutku zadovoljstva.

## D. AI savjetnik (nakon odluke 2)
Uvidi već postoje (`supabase/functions/insights`, poslužitelj računa brojke, model samo preformulira). Prijedlog za „savjetnika“:
- **Pitanja na dodir, ne slobodan chat** (v1): „Gdje mi najviše ide?“, „Mogu li si priuštiti X?“, „Kako stići cilj štednje?“, „Koje pretplate da preispitam?“.
  Odgovor se gradi iz točnih brojki s poslužitelja, isto kao uvidi.
- Zašto ne slobodan chat odmah: trošak po korisniku, rizik izmišljenih iznosa, i pravna granica „financijskog savjetovanja“. Slobodno pitanje može doći kasnije s istim zaštitama.
- Savjetnik je Premium. Free: 3 AI pitanja mjesečno (zlatna zvjezdica na krugu, napomena u razgovoru, broj preostalih). Premium: 20 dnevno, najviše 300 mjesečno (trošak modela ispod ~0,15 € po korisniku mjesečno). Kvota atomarno na poslužitelju (`consume_advisor`). „Mogu li si ovo priuštiti?“ računa aplikacija i besplatno je za sve.
- Ulaz: lebdeći krug (AI) iznad trake na Početnoj i Pregledu; odgovor u malom razgovoru.

## E. Web: blog, kalkulatori, SEO (3 do 4 dana)
**19. Zakazani blogovi: da, moguće je bez pusha.**
- Svaki članak ima `published` datum. Popis, članak, sitemap i RSS prikazuju samo članke s datumom ≤ danas.
- Stranice se osvježavaju same jednom dnevno (Next.js `revalidate`), pa se članak pojavi na svoj datum. „Zadnje ažurirano“ računa se samo iz objavljenih.
- Napisat ću ~20 članaka unaprijed, jedan tjedno (stalni ritam je bolji za SEO od naleta). Teme biram po stvarnim pretragama na hrvatskom.
- Vizualno: kartice s ključnim brojem, istaknuti blokovi (savjet, upozorenje), jednostavni grafovi (SVG, bez biblioteka), ikona po kategoriji,
  ugrađeni kalkulator gdje ima smisla, CTA kartica na kraju. Sve u dizajn sustavu, tamna tema.

**18. Kalkulatori.** Važna ispravka: kalkulator u modalu Google ne vidi. Svaki je **zasebna stranica** (`/kalkulatori/...`),
a u izborniku je ikona koja vodi na popis. Prijedlog za start (svaki jedno polje, jedan broj kao rezultat):
1. Koliko dnevno smijem potrošiti (već postoji kao „Isprobaj“, izdvojiti).
2. Koliko me godišnje koštaju pretplate.
3. Fond za hitne slučajeve (koliko i do kad).
4. Cilj štednje: kad ću skupiti X.
5. „Sitni trošak“: kava 2 € dnevno = koliko godišnje.
U aplikaciju ih ne bih stavljao zasebno (jednostavnost); cilj štednje s projekcijom već je u planu Premiuma.

**SEO i AI pretraživanje:** strukturirani podaci (Article, FAQ, SoftwareApplication, HowTo za kalkulatore), `llms.txt` (postoji, nadopuniti),
stranica „O nama“ (tko stoji iza, zašto: E-E-A-T), interne poveznice blog ↔ kalkulator ↔ aplikacija, brzina (Core Web Vitals).

## F. E-mailovi i newsletter (2 do 3 dana + sadržaj)
- **Pružatelj:** Brevo (EU, GDPR, newsletter i transakcijski mailovi, besplatno do 300/dan). Odluka 20. 10.
- **Pristanak:** newsletter je zaseban, neoznačen izbor (GDPR). Svaki mail ima odjavu jednim klikom (Gmail/Yahoo pravila).
- **Tokovi:** dobrodošlica → 3. dan savjet za prvi tjedan → **tjedni osobni sažetak** („Tvoj tjedan: 142 € od 180 €“, najvrjedniji mail) → mjesečni pregled →
  povratak nakon 10 dana neaktivnosti (jednom). Newsletter: jedan savjet + jedna zanimljivost + novi članak, tjedno ili dvotjedno. Premium spominjati tek u svakom 3. do 4. mailu.
- **Push za ono što je hitno, mail za ono što se čita:** podsjetnik za unos je push, ne mail.
- Napomena: gosti nemaju e-adresu, a Apple prijava može dati skrivenu adresu (radi, samo je ne vidimo).
- Predlošci: jedan predložak u dizajn sustavu (tamni i svijetli način), isti ton „na ti“.

## G. Admin pregled (1 do 2 dana)
Odluka: **zasebna Expo aplikacija `apps/admin`** (EAS build samo za vlasnika). Dijeli dizajn sustav (`packages/tokens`),
podaci dolaze samo iz Edge Functiona koja provjerava da si to ti (popis dopuštenih na poslužitelju).
Sadržaj: korisnici (ukupno, novi, aktivni dnevno/tjedno, zadržavanje), Premium (broj, prihod iz RevenueCata), skeniranja (broj, trošak AI-ja),
newsletter (pretplatnici, odjave), zakazani mailovi i zakazani članci, greške (Sentry poveznica). Bez osobnih podataka korisnika osim e-adrese kad treba.

## H. Sigurnost, brzina, objava
- **Sigurnosni prolaz prije bete:** RLS i savjeti Supabasea (advisors), ograničenje poziva na svim Edge Functionima, App Attest / Play Integrity za skeniranje,
  bez osobnih podataka u Sentryju, provjera ovisnosti, brisanje računa briše i na poslužitelju i u RevenueCatu.
- **Napravljeno 21. 10.:** ograničenje poziva na svim Edge Functionima koje zove korisnik (`rate_limits` + `rate_hit`, `_shared/rateLimit.ts`; npr. skeniranje 20 / 10 min, AI kategorija 30 / h, brisanje računa 5 / h), poruka u aplikaciji kod skeniranja; Sentry bez iznosa, e-adresa, dugih brojeva, tragova dodira i parametara u adresama; brisanje računa briše kupca i u RevenueCatu (uz `REVENUECAT_SECRET_KEY` i `REVENUECAT_PROJECT_ID`) i Premium korisnika upozorava da pretplatu otkaže u trgovini; web: zakrpa za `sharp`.
- **Ovisnosti (21. 10.):** web na Next 16.4.2 i React 19.2.9 (0 ranjivosti; `tsconfig` `jsx: react-jsx`); u workspaceu `pnpm.overrides` `xcode>uuid ^11.1.1`. Bez zakrpe ostaju `node-forge` i `braces` (Expo alati za build, ne ulaze u aplikaciju) i `decode-uri-component` u `expo-router` (0.5 je samo ESM i srušio bi navigaciju; rizik: sporo dekodiranje namjerno pokvarene poveznice u vlastitoj aplikaciji). Supabase Auth: zaštita od procurjelih lozinki uključena.
- **Ostaje iz sigurnosti:** App Attest / Play Integrity (treba EAS build); po želji isključiti prijavu e-poštom u Supabase Auth (aplikacija je ne koristi).
- **Brzina (21. 10.):** lokalna migracija 7: indeksi za knjiženje pretplata pri pokretanju i „Zadnje“ na Početnoj (provjereno planom upita); događaj `app_ready` (ms od učitavanja koda do prvog prikaza) u PostHogu. Popisi su već virtualizirani (`FlatList`, najviše 300). Trgovine: sve u [TRGOVINE.md](TRGOVINE.md) (tekstovi, snimke, privatnost, bilješke za pregled, nominacija).
- **Brzina (plan):** mjeriti hladno pokretanje (cilj < 1,5 s), virtualizirani popisi, bez mreže na putu unosa (već tako).
- **Izdvajanje u trgovinama:** Apple ima obrazac za nominaciju u App Store Connectu, Google „Featuring“ u Play Consoleu. Što pomaže:
  izvorni osjećaj, pristupačnost (Dynamic Type, VoiceOver), widget, brze radnje / Prečaci, Prijava s Appleom, privatnost (bez praćenja), hrvatski jezik, dobre ocjene.
- **ASO:** naziv „UnitCent: Dnevni budžet“, podnaslov s ključnom riječi, 5 snimki zaslona s jednom porukom po snimci, kratki video.

## Redoslijed rada
1. **A + B** (brzi popravci i pouzdanost). ✔ 20. 10. (commit 2981ba8)
2. **C** (kamera, kalendar, limit, proslava). ✔ 20. 10. (f6998c7)
3. **D** AI savjetnik. ✔ 20. 10. (5944743); funkcija `advisor` i migracija objavljene na dev Supabase.
4. **E** web: zakazani blogovi (20 članaka, tjedno 27. 10. 2026. do 9. 3. 2027.), vizualni blokovi u člancima, 5 kalkulatora (`/kalkulatori`). ✔ 20. 10.
5. **F + G** mailovi (Brevo) i admin aplikacija (`apps/admin`). ✔ u kodu i na dev Supabase 20. 10.; Brevo (ključ, domena, popis, webhook) i prvi pravi mail 21. 10. Vidi „F + G: što treba vlasnik“.
6. **H** sigurnosni prolaz, trgovine, beta, objava.

## Stanje 20. 10. 2026. (za sljedeću sesiju)
- **Aplikacija:** sve iz A do D je u kodu, na uređaju isprobano samo djelomično (EAS build s vlasnikovim testom). Za `expo-quick-actions` treba novi EAS build.
- **Savjetnik:** lebdeći krug na Početnoj i Pregledu; free 3 pitanja mjesečno (broji aplikacija i poslužitelj, `consume_advisor`), Premium 20 dnevno; povijest razgovora za danas lokalno. „Mogu li si nešto priuštiti?“ računa `checkAfford` u core i broji se kao pitanje.
- **Ostalo za kasnije:** traženje ocjene u trgovini u trenutku zadovoljstva (`expo-store-review`), niz dana s unosom, poruka 7. dan uz tjedni sažetak (dio F), App Attest / Play Integrity (gosti mogu reinstalacijom dobiti nova besplatna pitanja i skeniranja).
- **Web lokalno:** `.claude/launch.json` (port 3123, zaseban build dir); `BLOG_TODAY=YYYY-MM-DD` u razvoju prikazuje zakazane članke.

## F + G: kako radi (20. 10. 2026.)
- **Baza:** `email_prefs` (sažeci zadano uključeni, newsletter zaseban i neoznačen, token za odjavu), `email_log` (jedan redak po korisniku, vrsti i razdoblju: isti mail nikad dvaput), `email_candidates()`, raspored u pg_cron (migracija `20261025000000_email.sql`). Admin: `admin_stats()` (`20261026000000_admin_stats.sql`), samo zbrojevi.
- **Funkcije:** `email-send` (poziva pg_cron s tajnom; dobrodošlica, 3. dan, tjedni sažetak ponedjeljkom, mjesečni 1. u mjesecu, povratak nakon 10 dana; najviše 280 dnevno), `email-prefs` (aplikacija i web stranica za odjavu; usklađuje Brevo popis), `brevo-webhook` (odjave i prijave spama iz Brevoa), `admin-stats` (samo ADMIN_EMAILS). `delete-account` briše i Brevo kontakt. Zajedničko: `supabase/functions/_shared/brevo.ts`.
- **Predlošci:** `email-send/templates.ts` (svijetli i tamni način, broj je junak, odjava jednim klikom + zaglavlja List-Unsubscribe), brojke u `email-send/digest.ts`; testovi u `packages/core/test/email.test.ts`. Premium se spominje uz prvi tjedni sažetak i zatim u svakom 4. (samo free).
- **Web:** `/odjava?t=…` (stanje i odjava bez prijave) i `/api/odjava` (POST jednim klikom iz programa za poštu). Privatnost: dodan Brevo i odjeljak E-mailovi.
- **Aplikacija:** Profil → Aplikacija → „E-mailovi“ (samo prijavljeni s e-adresom): Sažeci, Newsletter.
- **Admin (`apps/admin`), v2 21. 10.:** pet tabova: Pregled (aktivni ovaj tjedan + 6 kartica), Lista čekanja (tko, kada, odakle; pretraga i izvoz), Korisnici (lijevak, gosti/registrirani, aktivni i novi po danu, zadržavanje), Prihod i AI (plaćeni, konverzija, RevenueCat, skeniranja, trošak AI-ja), Sadržaj (mailovi, sljedeće slanje, blog). Izgled bez prijave: `EXPO_PUBLIC_ADMIN_MOCK=1` (samo razvoj, probne brojke). Prije: aktivni ovaj tjedan (glavni broj), novi korisnici (14 dana), zadržavanje, Premium i prihod (RevenueCat), AI skeniranja i procjena troška, e-mailovi (newsletter, odjave, sljedeće slanje), zakazani članci (čita `web/content/blog` iz repoa), poveznica na Sentry.

## F + G: što treba vlasnik
**Brevo postavljen 21. 10.:** domena `unitcent.com` potvrđena (DKIM, DMARC, branding `mail.`), pošiljatelj `UnitCent <support@unitcent.com>`, popis Newsletter = ID 3, API ključ ograničen na Transactional email + Contacts, tajne u Supabaseu i Vaultu, prva dobrodošlica poslana. Ostaje: Brevo webhook (odjave, spam) i besplatno prosljeđivanje pošte (npr. ImprovMX) jer `unitcent.com` nema MX.
1. **Brevo:** račun, autentificirati domenu `unitcent.com` (DKIM, DMARC u DNS-u), pošiljatelj npr. `pozdrav@unitcent.com`, popis „Newsletter“ (zapiši ID). Webhook (Transactional i Marketing: unsubscribe, spam, hard bounce) na `https://<ref>.supabase.co/functions/v1/brevo-webhook?key=<BREVO_WEBHOOK_SECRET>`.
2. **Supabase Secrets:** `BREVO_API_KEY`, `BREVO_NEWSLETTER_LIST_ID`, `EMAIL_FROM`, `EMAIL_CRON_SECRET`, `BREVO_WEBHOOK_SECRET`, `ADMIN_EMAILS`; po želji `REVENUECAT_SECRET_KEY` + `REVENUECAT_PROJECT_ID`, `SENTRY_ISSUES_URL`, `AI_COST_PER_SCAN_EUR`, `EMAIL_DAILY_CAP`.
3. **Vault (za pg_cron):** `project_url` i `email_cron_secret` (ista vrijednost kao `EMAIL_CRON_SECRET`), vidi komentar u migraciji.
4. **Objava:** ✔ 20. 10. na dev Supabase (ekdcfznglsioobnskqnu): migracije `email`, `admin_stats`, `pg_net_extensions_schema`; funkcije `email-send` i `brevo-webhook` (bez JWT), `email-prefs`, `admin-stats`, `delete-account`. Raspored (pg_cron) je postavljen, ali ne šalje ništa dok u Vaultu nema `project_url` i `email_cron_secret`, a u Secrets `BREVO_API_KEY`. Vercel: ništa novo.
5. **Admin aplikacija:** `.env.local` je postavljen (isti URL i anon ključ kao aplikacija). Za Expo Go: u Supabase Auth → Redirect URLs dodati `exp://**` i postaviti Secret `ADMIN_EMAILS`; zatim `npx pnpm@9.15.0 --filter @unitcent/admin start`. Za trajnu aplikaciju: `eas init`, `eas build --profile admin` i Redirect URL `unitcent-admin://auth-callback`.

## Odluke (vlasnik, 20. 10. 2026.)
1. **Premium se nudi na okidačima**: potrošena 3 skeniranja, stariji mjesec, limit kategorije, AI pitanje, i jednom 7. dan uz tjedni sažetak.
   **Dopuna 21. 10.:** jednom i na kraju onboardinga, odmah nakon što korisnik vidi svoj dnevni budžet: „Prvih 7 dana besplatno“
   (preko Početne, „Nastavi s besplatnom verzijom“ vraća na Početnu). Prikazuje se samo uz `EXPO_PUBLIC_TRIAL=1`, tj. kad trgovine imaju probno razdoblje.
2. **AI savjetnik = pitanja na dodir** (odgovori iz brojki s poslužitelja), slobodan chat možda kasnije.
3. **Admin = zasebna Expo aplikacija** (`apps/admin` u istom repou, samo EAS build za vlasnika, ne ide u trgovine).
   Podaci samo preko Edge Functiona `admin-stats` koja provjerava da je prijavljeni korisnik vlasnik; service ključ nikad u aplikaciji.
4. **E-mail = Brevo** (newsletter i transakcijski mailovi).
