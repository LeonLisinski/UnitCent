# UnitCent: plan do lansiranja (ažurirano 19. 10. 2026.)

Prioritizirani popis svega što je ostalo. Redoslijed ide od onoga što otključava ostalo (odluke i mjerenje) prema onome što dolazi nakon prve beta.

## 0. Odluke koje treba donijeti prije koda

### Free i Premium (predlažem ovo kao službeno)
| | Free | Premium (2,99 €/mj, 19,99 €/god) |
|---|---|---|
| Unos, kategorije, dnevni limit, pretplate, offline, sinkronizacija, izvoz podataka | ✔ | ✔ |
| Povijest i pregled | zadnjih 6 mjeseci | cijela |
| Skeniranje računa | 3 mjesečno | do 100 mjesečno (pošteno korištenje) |
| Praćenje štednje (osnovno: plan, mjesečna potvrda, ukupno ušteđeno) | ✔ | ✔ |
| Štednja: više ciljeva, projekcije | – | ✔ (kasnije) |
| Budžeti po kategoriji s upozorenjem | – | ✔ |
| AI uvidi i savjeti | pregled jednog uvida (mamac) | ✔ svi |
| Widget „Danas još smiješ" | ✔ | ✔ (retencija je važnija od prodaje) |
| Obiteljski račun (D-12) | – | zasebni paket, kasnije |

Načelo: ono što korisnika drži u aplikaciji (unos, limit, štednja, widget) ostaje besplatno; naplaćuje se ono što košta (AI) ili donosi dodatnu vrijednost (povijest, budžeti, uvidi).

### Šifriranje podataka („GDPR")
Nije potrebno kriptirati sadržaj u bazi da bi se bilo u skladu s GDPR-om. Već imamo: TLS u prijenosu, šifriranje na disku kod Supabasea (EU), pristup po korisniku (RLS), brisanje računa i izvoz. **End-to-end šifriranje bi pokvarilo** AI uvide, skeniranje i oporavak podataka. Predlažem umjesto toga: ugovori o obradi podataka (DPA) s obrađivačima, evidencija obrada, politika zadržavanja, postupak za povredu podataka, i **zaključavanje aplikacije biometrijom** (korisniku vidljiva sigurnost). Pravni pregled prije lansiranja.

## 1. Prije prve zatvorene bete (najvažnije)
1. **Račun za mjerenje skeniranja:** 20 do 50 pravih računa (različite trgovine, dugi, s popustima, izblijedjeli); usporedba Gemini / Claude (D-11); potvrda formata QR koda; odluka o modelu.
2. **Spremanje stavki računa** (lokalno i sync), ispravak naziva i iznosa stavke, učenje iz ispravaka.
3. **EAS build** (iOS i Android), TestFlight i Google Play interno testiranje; test Apple i Google prijave na buildu; test na malom ekranu (iPhone SE) i Androidu s trakom od 3 gumba.
4. **Pravno:** podaci o pružatelju (obrt?) u Uvjetima i Privatnosti, e-adresa podrške (D-08), pravni pregled.
5. **Pristupačnost:** veličina fonta (Dynamic Type), kontrast, čitač zaslona.
6. **Zaštita besplatnih skeniranja:** ograničenje prijava, App Attest / Play Integrity.
7. **Sigurnosne kopije baze** (Supabase PITR traži plaćeni plan) i staging projekt.

## 2. Zarada (kad su računi trgovina spremni)
1. RevenueCat + proizvodi (`unitcent_premium_monthly`, `unitcent_premium_yearly`) u App Store Connectu i Google Playu; test u sandboxu.
2. Povezati paywall i vratiti kupnju (kod je gotov, treba ključeve); provjera webhooka s pravim događajima.
3. Cijene i opis trgovina; „Small Business Program" kod Applea.

## 3. Funkcionalnost Premiuma
1. **Budžeti po kategoriji** (limit po mjesecu, upozorenje na 80 % i 100 %).
2. **AI uvidi i savjeti** (dizajn dolje).
3. **Obavijesti:** večernji podsjetnik za unos, upozorenje kad se približiš dnevnom limitu (opt-in).

### AI uvidi: kako bih ih napravio
- Poslužitelj (Edge Function) računa **točne brojke** iz podataka (potrošnja po kategoriji, usporedba s prošlim mjesecima, najveće promjene, pretplate koje rastu, odstupanja). AI model **samo formulira** 3 do 5 kratkih uvida na hrvatskom iz tih gotovih brojki, da ne izmišlja iznose.
- Šalju se samo zbrojevi po kategorijama (bez bilješki i naziva trgovina) i keširaju se po mjesecu, pa je trošak zanemariv.
- Free korisnik vidi jedan uvid, ostali su zaključani zlatnim lokotom (CTA na Premium).

## 4. Praćenje štednje (novi ekran, nije glavni)
Pristup iz Profila („Štednja"). Sadržaj:
- Mjesečni cilj štednje (iz plana) i **mjesečna potvrda** „Jesi li uštedio?" (da / djelomično s iznosom / ne), uz podsjetnik na kraju mjeseca.
- Ukupno ušteđeno, broj mjeseci korištenja i niz mjeseci (streak), jednostavan stupčasti graf po mjesecima.
- Premium kasnije: više ciljeva (npr. „Godišnji odmor 1.200 €") s projekcijom datuma.
- Podaci: nova tablica `savings_entries` (mjesec, planirano, ostvareno), sinkronizira se kao ostalo.

## 5. UX i dizajn (stalno)
- Prošlo kroz analizu: Android rubovi, ikone (ujednačen set), animacija prstena nakon spremanja troška, prazna stanja, poruke grešaka s ponovnim pokušajem.
- Mjerenje (PostHog) tek od bete.
- Spremanje svih stavki pri skeniranju i sitni popravci prema tvojim screenshotovima.

## 6. Nakon lansiranja
Widget, obiteljski račun (D-12), usporedba cijena košarice, uvoz podataka (nije u planu za v1).

## Što bih ti ja predložio kao sljedeća tri koraka
1. **Račune za skeniranje** (tvoji ili slikaj 20 komada): bez toga ne znamo je li AI dovoljno dobar, a to je glavni razlog za Premium.
2. **Praćenje štednje + budžeti po kategoriji** (gradivo za Premium i za retenciju; ne traži vanjske račune).
3. **EAS build + TestFlight**, da stvarno isprobaš kupnju i prijave na pravom uređaju.
