# UnitCent: objava u App Storeu i Google Playu

Sve što se upisuje u App Store Connect i Google Play Console, na jednom mjestu. Brojke na snimkama su službeni
primjer iz CLAUDE.md (ne mijenjati bez razloga). Duljine su provjerene.

## 1. Osnovno

| Polje | Vrijednost |
|---|---|
| Kategorija | Financije (Finance); druga: Produktivnost |
| Dob | 4+ (iOS) / Svi (Play): bez sadržaja za odrasle, bez kupnje unutar sadržaja osim pretplate |
| Cijena | Besplatno, uz in-app pretplatu Premium (2,99 €/mj ili 19,99 €/god, 7 dana probno) |
| Jezik | hrvatski (primarni) |
| Podrška (URL) | https://unitcent.com |
| Privatnost (URL) | https://unitcent.com/privatnost |
| Uvjeti (EULA) | https://unitcent.com/uvjeti (iOS: u opis dodati poveznicu na uvjete, Apple to traži za pretplate) |
| E-adresa podrške | support@unitcent.com (prije predaje postaviti prosljeđivanje, npr. ImprovMX: `unitcent.com` nema MX) |
| Izvoz šifriranja | Ne (već `ITSAppUsesNonExemptEncryption: false` u app.json) |

## 2. Tekstovi

**App Store**
- **Naziv (23/30):** UnitCent: Dnevni budžet
- **Podnaslov (29/30):** Koliko danas smijem potrošiti
- **Ključne riječi (89/100, bez razmaka, bez riječi iz naziva):**
  `troškovi,budžet,štednja,financije,novac,računi,pretplate,skeniranje,plaća,potrošnja,kućni`
- **Promotivni tekst (159/170, mijenja se bez nove verzije):**
  Novo: AI skeniranje računa razvrsta stavke po kategorijama, a tjedni sažetak stiže ponedjeljkom. Besplatno: unos, pretplate, dnevni budžet i rad bez interneta.

**Google Play**
- **Naslov (23/30):** UnitCent: Dnevni budžet
- **Kratki opis (80/80):** Znaj koliko danas smiješ potrošiti. Unos za 3 sekunde, pretplate se knjiže same.

**Opis (isti u obje trgovine)**

> Koliko danas smijem potrošiti? UnitCent ti to kaže jednim brojem.
>
> Upišeš primanja, obavezne troškove i koliko želiš uštedjeti. UnitCent iz toga svaki dan izračuna tvoj dnevni budžet. Potrošiš li danas manje, sutra imaš više. Potrošiš li više, ostatak mjeseca se sam preračuna.
>
> BRZO
> • Trošak upišeš za 3 sekunde, i bez interneta.
> • Pretplate i fiksni troškovi knjiže se sami na svoj dan.
> • Prsten na Početnoj pokazuje koliko ti je ostalo za danas.
>
> PREGLEDNO
> • Pregled mjeseca po kategorijama i danima.
> • Podsjetnik dan prije naplate pretplate.
> • Tamna i svijetla tema, zaključavanje Face ID-om ili otiskom.
>
> PREMIUM
> • AI skeniranje računa: slikaš račun, stavke se razvrstaju po kategorijama.
> • Cijela povijest i usporedbe kroz mjesece.
> • AI savjetnik i uvidi iz tvojih brojki.
> • Limiti po kategorijama s upozorenjem na 80 % i 100 %.
> Premium možeš isprobati 7 dana besplatno.
>
> PRIVATNO
> • Bez reklama. Tvoje podatke ne prodajemo.
> • Možeš koristiti bez računa; prijava Appleom ili Googleom sprema podatke na svim uređajima.
> • Izvoz podataka i brisanje računa su u aplikaciji.
>
> Pretplata se obnavlja automatski dok je ne otkažeš u postavkama trgovine, najkasnije 24 sata prije kraja razdoblja. Uvjeti: https://unitcent.com/uvjeti · Privatnost: https://unitcent.com/privatnost

## 3. Snimke zaslona (5, jedna poruka po snimci)

Veličine: iPhone 6,9" **1320 × 2868** (obavezno), Android telefon **1080 × 2400**. Tamna tema, isti primjer brojki.

| # | Ekran | Naslov na snimci | Što se vidi |
|---|---|---|---|
| 1 | Početna | Znaj koliko danas smiješ potrošiti | prsten „Ostalo za danas“ **19,96 €**, traka mjeseca |
| 2 | Dodaj trošak | Trošak upisan za 3 sekunde | numerička tipkovnica, kategorija Hrana |
| 3 | Pregledaj račun | Slikaj račun. Stavke se razvrstaju same. | Konzum, 6 stavki, **20,65 €** (Hrana 10,46 · Auto 4,99 · Kućanstvo 5,20) |
| 4 | Pretplate | Pretplate se knjiže same | kalendar s točkama, popis pretplata |
| 5 | Pregled | Vidi gdje ti ide novac | krug po kategorijama, popis kategorija s iznosima |

Kratki video (do 30 s, po želji): otvaranje → prsten → unos → prsten se pomakne → skeniranje.

## 4. Privatnost

**Apple „App Privacy“** (praćenje: **Ne**; ATT upit ne treba)

| Vrsta podataka | Prikuplja se | Vezano uz korisnika | Svrha |
|---|---|---|---|
| Financijski podaci → Ostali financijski podaci (troškovi, plan, pretplate) | Da, ako je uključena sinkronizacija (uvijek kod računa) | Da | Funkcionalnost aplikacije |
| Kontakt → E-adresa (prijava Appleom/Googleom) | Da | Da | Funkcionalnost; marketing razvojnog tima (sažeci i newsletter, uz odjavu) |
| Identifikatori → ID korisnika | Da | Da | Funkcionalnost |
| Kupnje → Povijest kupnji (RevenueCat) | Da | Da | Funkcionalnost |
| Korištenje → Interakcija s proizvodom (PostHog, isključivo) | Da | **Ne** | Analitika |
| Dijagnostika → Rušenja, performanse (Sentry) | Da | **Ne** | Funkcionalnost aplikacije |
| Fotografije (slike računa) | **Ne** (obrađuju se u stvarnom vremenu i ne čuvaju) | | |

**Google Play „Data safety“**
- Podaci se šifriraju u prijenosu: **Da**. Korisnik može zatražiti brisanje: **Da** (u aplikaciji + https://unitcent.com/privatnost).
- Prikuplja: Financijske informacije (ostalo), E-adresa, ID korisnika, Povijest kupnji, Interakcije u aplikaciji (neobavezno), Zapisnici rušenja i dijagnostika. Ne dijeli se s trećima u svrhu oglašavanja.
- Slike računa: „obrađuju se kratkotrajno“ (ephemeral), ne prikupljaju se.

## 5. Bilješke za pregled (App Review / Play)

> UnitCent radi bez prijave: na prvom ekranu odaberite „Nastavi kao gost“. Prijava (Apple/Google) samo sprema podatke na više uređaja.
> Premium se kupuje u aplikaciji (Profil → Nadogradi na Premium); obnova kupnje: Profil → Podaci i privatnost → Vrati kupnju.
> Brisanje računa: Profil → Podaci i privatnost → Obriši račun i sve podatke.
> AI skeniranje: kamera → slikati bilo koji račun; prva 3 skeniranja mjesečno su besplatna.

## 6. Prije predaje (provjera)

- [ ] **Prijava Appleom uključena u produkcijskom buildu** (`EXPO_PUBLIC_APPLE_SIGNIN=1` u EAS env za production): uz Google prijavu Apple je obavezan (pravilo 4.8).
- [ ] `EXPO_PUBLIC_TRIAL=1` tek kad su proizvodi u trgovinama postavljeni s 7-dnevnim probnim razdobljem.
- [ ] Proizvodi: `unitcent_premium_monthly`, `unitcent_premium_yearly` u ASC i Playu, povezani u RevenueCatu (entitlement `premium`), webhook na `revenuecat-webhook`.
- [ ] Produkcijski Supabase projekt (odvojen od dev) i iste migracije/funkcije/tajne.
- [ ] Prosljeđivanje pošte za `support@unitcent.com`.
- [ ] Sentry DSN i PostHog ključ u production env; `app_ready` događaj (vrijeme pokretanja) vidljiv u PostHogu.
- [ ] Testni računi za pregled nisu potrebni (gost), ali u ASC navesti da se može bez prijave.

## 7. Izdvajanje (featuring)

**App Store:** App Store Connect → aplikacija → **Featuring Nominations** → nova nominacija (vrsta „New App“), najmanje 2 do 3 tjedna prije objave.
**Google Play:** Play Console → **Grow → Store presence → Featuring** (obrazac „Tell us about your app“), isto unaprijed.

Tekst nominacije (prilagoditi):

> UnitCent je hrvatska aplikacija za osobne financije koja odgovara na jedno pitanje: koliko danas smijem potrošiti. Umjesto tablica i grafova, korisnik vidi jedan broj u prstenu koji se mijenja sa svakim unosom. Unos traje 3 sekunde i radi bez interneta, pretplate se knjiže same, a AI čita fiskalne račune i razvrstava stavke po kategorijama (podaci se ne čuvaju, slike se brišu odmah). Napravljena je za hrvatsko tržište: jezik, euro, fiskalni QR kod. Bez reklama i bez praćenja; podaci se mogu izvesti i obrisati u aplikaciji. Pristupačnost: Dynamic Type, VoiceOver oznake, kontrast ≥ 4,5 : 1, poštuje „smanji pokret“. Tamna i svijetla tema, prijava Appleom, Face ID zaključavanje.

Što povećava šanse (već imamo / treba): izvorni osjećaj ✔, prijava Appleom ✔, privatnost ✔, hrvatski ✔, pristupačnost ✔, brze radnje na ikoni ✔ (novi build), widget (nema), dobre ocjene (traženje ocjene u trenutku zadovoljstva, nije još napravljeno).
