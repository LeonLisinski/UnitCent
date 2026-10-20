# UnitCent — produktna specifikacija (v0.1)

> Radni naziv projekta/foldera: UnitSpend. Ime proizvoda i domena: **UnitCent** (unitcent).
> Jezik: hrvatski. Valuta: EUR. Platforme: iOS + Android (od prvog dana) + web landing.

## 1. Vizija

Najjednostavniji način da znaš **koliko smiješ potrošiti danas** i **kamo ti odlazi novac** —
bez Excela, bez tipkanja, s AI-jem koji razumije hrvatske račune.

## 2. Što učimo iz postojećeg Excel troškovnika

Excel nije samo popis troškova — ima **logiku planiranja** koju app mora zadržati i učiniti automatskom:

| Excel | U aplikaciji |
|---|---|
| Primanja (plaća, dodatni prihodi, povrati) — plan vs. stvarno | **Primanja** (ponavljajuća + jednokratna) |
| Obavezna davanja (kredit, mobitel, coaching) + pretplate (Spotify, Netflix, gym, AI alati, Vercel…) + rate | **Fiksni troškovi i pretplate** s danom naplate, kalendar, podsjetnici |
| Željena ušteda | **Cilj štednje** po mjesecu |
| *Ostalo za trošiti* = primanja − obavezno − ušteda | **Slobodno za trošiti** (glavni broj aplikacije) |
| *Dnevni budžet* = ostalo / preostali dani | **„Ostalo za danas: 29 €"** (dnevni budžet minus današnja potrošnja) — hero na početnom ekranu |
| *Prosječni dnevni trošak* | Tempo potrošnje (ispred/iza plana) |
| Plan vs. trošak po kategoriji (Hrana, Gorivo, ENC, Izlasci, Auto ostalo…) | **Budžeti po kategoriji** s progress trakama |
| Dnevni unos: dan, naziv, iznos (Trgovina, Snus, Gorivo…) | **Brzi unos** (< 3 s) + AI skeniranje računa |

Ključni uvid: korisnik ne želi samo *bilježiti*, nego **upravljati mjesecom**. „Danas smiješ X €" je
diferencijator — većina konkurencije to nema ili je skriveno.

## 3. Funkcije

### Besplatno (Free) — sve zbog čega se korisnik vraća svaki dan
- Brzi unos troška/prihoda: tipka +, numerička tipkovnica odmah, **tap na kategoriju odmah sprema**
- Pretplate i fiksni troškovi (Spotify, Netflix, gym, najam, kredit, mobitel, režije): kalendar naplata, automatsko knjiženje, podsjetnik dan prije („Sutra ti skida Netflix 13,99 €")
- Mjesečni plan: primanja − obavezno − štednja → slobodno za trošiti → dnevni budžet
- Pregled mjeseca po kategorijama i usporedba s prošlim mjesecom
- Zadane kategorije s ikonama i bojama, mogu se mijenjati
- Rad bez interneta (unos trenutan, sync u pozadini)
- **3 AI skeniranja računa mjesečno** nakon probnog razdoblja

### Premium
- **AI skeniranje računa bez ograničenja** (glavni razlog kupnje; jedini dio koji nas stvarno košta)
- Napredna analiza i AI uvidi („Cigarete +30 % ovaj mjesec", „Imaš 3 streaming pretplate")
- Budžeti po kategoriji s upozorenjem, widgeti, sync na više uređaja
- *Kasnije (v1.1+):* pametna shopping lista, zajednički budžet za par/kućanstvo. Svaka nova premium funkcija = povod za marketing i ponovnu ponudu.

## 3a. Monetizacija

**Model:** freemium s pretplatom, bez reklama, bez prodaje podataka.

**Pravilo:** nikad ne naplaćujemo ono zbog čega se ljudi vraćaju svaki dan (ručni unos, pretplate, dnevni budžet, osnovni pregled). Naplaćujemo ono što nas košta (AI) ili donosi očitu dodatnu vrijednost.

| Paket | Cijena | Napomena |
|---|---|---|
| Godišnje | 19,99 € (~1,67 €/mj) | zadana, istaknuta opcija |
| Mjesečno | 2,99 € | sidro |
| Par / obitelj | ~29,99 €/god | kad dođe zajednički budžet |
| Doživotno (rani korisnici) | ~39 € jednokratno | samo prvih 200 korisnika |

**Konverzija:**
- 7 dana besplatnog Premiuma pri onboardingu, vezano uz godišnji paket.
- Nakon triala 3 besplatna skeniranja mjesečno; paywall kad ih potroši, u trenutku kad mu skeniranje treba.
- Paywall samo na trenucima vrijednosti (skeniranje, AI uvidi, izvoz, partner, shopping lista), nikad nasumično.

**Ekonomija po korisniku:** Apple/Google 15 % (Small Business Program), PDV obračunavaju trgovine. AI ~0,2–0,5 c po računu. Neto: ~2,54 €/mj ili ~17 €/god, marža nakon AI-ja > 90 %. Porezni tretman (obrt) provjeriti s knjigovođom.

**Očekivanja:** plaća 2–5 % aktivnih korisnika. 20.000 preuzimanja ≈ 600 pretplatnika ≈ ~1.000 €/mj. Hrvatska je malo tržište; pravi potencijal je regija (SI, BiH, RS, ME), pa je app od prvog dana spreman za prijevod (i18n) i više valuta.

**Start:** besplatna jezgra + Premium = AI skeniranje (+ uvidi, izvoz), 7 dana triala, lifetime za prvih 200. Nakon 2–3 mjeseca gledamo stvarnu konverziju u RevenueCatu i tek onda mijenjamo cijene.

**Web stranica:** ne navodi točne cijene premiuma dok ne izmjerimo trošak AI-ja i reakcije beta korisnika. Ne obećavati shopping listu dok izvor cijena nije provjeren.

### Izvor podataka za cijene (shopping lista)
Od 2025. trgovački lanci u RH moraju svakodnevno javno objavljivati cjenike u strojno čitljivom obliku
(Konzum, Lidl, Kaufland, Spar, Plodine, Tommy, Studenac, Eurospin…). Postoje i otvoreni agregatori
tih podataka (npr. projekt *cijene.dev*). Plan: vlastiti dnevni import cjenika u Supabase → normalizacija
proizvoda → AI mapira „mlijeko" na konkretne artikle. **Treba verificirati licence/uvjete prije produkcije.**

## 4. Kategorije (zadane, korisnik može mijenjati)
Hrana · Auto (gorivo, ENC, servis) · Stan i režije · Zabava · Zdravlje · Pretplate · Cigarete · Obitelj i pokloni · Ostalo.
Grafovi prikazuju najviše 6 segmenata, ostatak ide u „Ostalo".

## 5. Arhitektura
- **App:** React Native + Expo (TypeScript), Expo Router, Reanimated, local-first (SQLite) + sync
- **Backend:** Supabase (Postgres + RLS, Auth: Apple/Google/email, Storage za slike računa, Edge Functions)
- **AI:** pozivi isključivo preko Edge Functions (ključ nikad u aplikaciji); vision model za račune, provjera premium statusa i kvote na serveru
- **Plaćanja:** RevenueCat (App Store + Google Play pretplate)
- **Web:** Next.js na Vercelu, domena unitcent, SEO + strukturirani podaci (JSON-LD), `llms.txt` za AI pretraživače
- **Fiskalni QR** na hrvatskim računima → pouzdan iznos/datum; AI samo za stavke

## 6. Dizajn
Izvor istine je dizajn sustav **UnitCent**: https://claude.ai/artifact/7wzgDHWLkSWQmfEs2ZhYyg
(boje za svijetlu i tamnu temu, Manrope, razmaci, UX obrasci za app i web).
Ukratko: topla neutralna paleta, jedna brand boja (duboka zelena) i limeta za jedan istaknuti trenutak po ekranu,
bez gradijenata i sjena na karticama, broj je junak ekrana, Phosphor ikone, aplikacija prati temu sustava.
Navigacija: Početna, Pregled, [+], Pretplate, Profil.

## 7. Faze
1. Klikabilni prototip (dizajn) ✅ v0.2 prema dizajn sustavu
2. Landing web (Next.js, Vercel)
3. App MVP: unos, kategorije, pretplate + kalendar, mjesečni plan, pregled (lokalno)
4. Supabase: auth, sync, AI skeniranje
5. RevenueCat + premium, shopping lista
6. Beta (TestFlight / Play interni test) → objava
