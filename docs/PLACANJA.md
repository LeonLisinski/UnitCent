# UnitCent: naplata Premiuma (Apple, Google, RevenueCat) korak po korak

Kod je spreman: `apps/mobile/src/purchases.ts` (RevenueCat SDK), entitlement **`premium`**, paketi **`$rc_monthly`** i
**`$rc_annual`**, webhook `revenuecat-webhook` (objavljen na dev Supabase). Ovdje je samo ono što se klikće.
Redoslijed je bitan: papirologija traje danima, pa nju prvu. Provjereno prema dokumentaciji RevenueCata, listopad 2026.

**Stanje 21. 10. 2026. (iOS gotov):** Paid Apps, banka (Zaba, EUR), W-8BEN aktivni; Small Business Program poslan (čeka odobrenje);
App Store Connect: aplikacija „UnitCent: Dnevni budžet“, grupa „UnitCent Premium“ (ID 22499797), `unitcent_premium_yearly` (Level 1)
i `unitcent_premium_monthly`, obje s 7 dana besplatno, slikom i snimkom za pregled (`docs/trgovine/`); RevenueCat projekt `30686a2c`:
UnitCent iOS (In-App Purchase key + App Store Connect API key valjani, Server Notifications v2), entitlement `Premium`, offering
`default` ($rc_annual, $rc_monthly), webhook na dev Supabase (test 200), `EXPO_PUBLIC_RC_IOS_KEY` u EAS i `.env.local`,
`REVENUECAT_SECRET_KEY` i `REVENUECAT_PROJECT_ID` u Supabaseu. **Ostaje:** Google Play (faza 1.2, 2.2, 3.3), testna kupnja na TestFlightu
(faza 4), produkcijski Supabase (webhook tada prebaciti na njegovu adresu).

| Što | Vrijednost |
|---|---|
| Bundle ID / package | `com.unitcent.app` |
| Mjesečno | `unitcent_premium_monthly`, 2,99 € |
| Godišnje | `unitcent_premium_yearly`, 19,99 € |
| Probno | 7 dana besplatno, samo novi korisnici |
| Entitlement | `Premium` (aplikacija uspoređuje bez obzira na velika slova) |
| Webhook | `https://<projekt>.supabase.co/functions/v1/revenuecat-webhook` |

---

## Faza 1: papirologija (odmah, traje danima)

### 1.1 Apple
1. **developer.apple.com/account** → provjeri da je članstvo aktivno (99 $ godišnje). Kao fizička osoba ne treba D-U-N-S; kao firma treba.
2. **appstoreconnect.apple.com → Business** (ili *Agreements, Tax, and Banking*):
   - **Paid Apps** → *View and Agree to Terms*.
   - **Bank Accounts** → dodaj IBAN (račun na koji Apple plaća, u eurima).
   - **Tax Forms** → *U.S. Tax Forms*: kao osoba iz Hrvatske ispunjavaš **W-8BEN** (fizička osoba) ili **W-8BEN-E** (firma); Hrvatska ima ugovor o izbjegavanju dvostrukog oporezivanja s SAD-om, pa se ispunjava i taj dio.
   - Status ugovora mora postati **Active** (ponekad 1 do 3 dana).
3. **developer.apple.com/app-store/small-business-program** → **Enroll** (provizija 15 % umjesto 30 %; vrijedi od prvog dana sljedećeg mjeseca nakon odobrenja).

### 1.2 Google
1. **play.google.com/console** → developer račun (jednokratno 25 $).
2. **Postavke → Profil za plaćanja** (Settings → Payments profile) → *Create payments profile*: podaci o tebi ili firmi i IBAN. **Država se poslije ne može promijeniti.**
3. **Provizija:** za automatski obnovljive pretplate Google uzima 15 % od prvog dana. (Za jednokratne kupnje 15 % na prvi 1 M $ vrijedi tek uz prijavu u *Service fee* program; nama nije bitno.)

> Napomena za knjigovođu: Apple i Google su prodavatelj prema kupcu (oni obračunavaju PDV), ti dobivaš isplatu s obračunom. Pitaj kako se to knjiži (prihod iz inozemstva).

---

## Faza 2: proizvodi u trgovinama

### 2.1 App Store Connect
1. **Identifiers** (developer.apple.com → Certificates, IDs & Profiles → Identifiers): `com.unitcent.app` mora imati uključen **In-App Purchase** (EAS ga obično sam napravi pri prvom buildu).
2. **App Store Connect → Apps → +** → New App → `com.unitcent.app`, naziv „UnitCent: Dnevni budžet“ (tekstovi u [TRGOVINE.md](TRGOVINE.md)).
3. U aplikaciji: **Monetization → Subscriptions → +** → grupa **„UnitCent Premium“**.
4. U grupi dodaj dvije pretplate:
   - Reference name `Premium mjesečno`, Product ID **`unitcent_premium_monthly`**, trajanje 1 mjesec, cijena 2,99 € (Hrvatska kao osnovna, ostale zemlje automatski).
   - Reference name `Premium godišnje`, Product ID **`unitcent_premium_yearly`**, trajanje 1 godina, cijena 19,99 €.
   - Za svaku: **Localization** (hrvatski): naziv „UnitCent Premium“, opis „Skeniranje, cijela povijest, savjetnik“; **Review screenshot** (snimka ekrana Premium u aplikaciji).
5. **Razine (levels)**: godišnja = Level 1, mjesečna = Level 2 (isti sadržaj, prijelaz bez gubitka).
6. Za svaku pretplatu: **Subscription Prices → Introductory Offers → +** → *Free*, trajanje **1 week**, sve zemlje. (Probno vrijedi jednom po grupi: tko je već imao probno, ne dobiva ga opet.)
7. **Users and Access → Sandbox → Testers → +**: napravi testni Apple ID (nova e-adresa, npr. `leon+sandbox1@gmail.com`).

### 2.2 Google Play Console
1. **Create app** → naziv, jezik hrvatski, „App“, „Free“ (besplatna s kupnjama).
2. **Prvo učitaj build** (AAB iz EAS-a) na **Testing → Internal testing**: Google ne dopušta proizvode prije nego postoji build s naplatom (`react-native-purchases` ga dodaje sam).
3. **Monetize → Products → Subscriptions → Create subscription**:
   - Product ID **`unitcent_premium_monthly`**, naziv „UnitCent Premium (mjesečno)“ → **Add base plan**: ID `mjesecno`, *Auto-renewing*, 1 mjesec, 2,99 € → **Activate**.
   - Product ID **`unitcent_premium_yearly`**, naziv „UnitCent Premium (godišnje)“ → base plan ID `godisnje`, 1 godina, 19,99 € → **Activate**.
   - Na svakom base planu: **Add offer** → ID `probno-7`, eligibility **New customer acquisition**, faza **Free trial, 7 dana** → **Activate**. (Naziv pretplate i opis ne smiju spominjati probno ni cijenu.)
4. **Setup → License testing**: dodaj svoj Gmail (testne kupnje bez naplate).

---

## Faza 3: RevenueCat

### 3.1 Projekt
1. **app.revenuecat.com** → New project **UnitCent**.
2. **Apps → + → App Store**: Bundle ID `com.unitcent.app`.
3. **Apps → + → Play Store**: package `com.unitcent.app`.

### 3.2 Apple ključevi u RevenueCatu
1. **In-App Purchase key** (obavezno za StoreKit 2 i probna razdoblja): App Store Connect → **Users and Access → Integrations → In-App Purchase** → *Generate In-App Purchase Key* → preuzmi `.p8` (samo jednom!) i zapiši **Issuer ID** s vrha stranice. RevenueCat → App Store app → **In-app purchase key configuration** → upload `.p8` + Issuer ID → Save („Valid credentials“).
2. **App Store Connect API key** (uvoz proizvoda i cijena): ASC → **Users and Access → Integrations → App Store Connect API** → nova, uloga **App Manager** → `.p8` + Issuer ID. RevenueCat → **App Store Connect API** kartica → upload, Issuer ID i **Vendor number** (ASC → Payments and Financial Reports, gore lijevo) → Save.
3. **App Store Server Notifications**: RevenueCat → App Store app → kopiraj *Apple Server Notification URL*. ASC → aplikacija → **App Information → App Store Server Notifications** → isti URL za **Production** i **Sandbox**, verzija **2**.

### 3.3 Google ključevi u RevenueCatu
1. **console.cloud.google.com** → novi projekt `unitcent-play` → uključi **Google Play Android Developer API**, **Google Play Developer Reporting API** i **Pub/Sub**.
2. **IAM → Service Accounts → Create**: `revenuecat`; uloge **Pub/Sub Editor** i **Monitoring Viewer** → **Keys → Add key → JSON** (preuzmi).
3. Play Console → **Users and permissions → Invite**: `client_email` iz JSON-a; app **UnitCent**; dozvole: *View app information*, *View financial data*, *Manage orders and subscriptions*, *Manage store presence* → Invite.
4. RevenueCat → Play Store app → **Service Account Credentials JSON** → upload → Save. Može potrajati do **36 sati** da postane valjano (provjera: *Credentials Validation Details → Check credentials*).
5. **Obavijesti u stvarnom vremenu:** RevenueCat → Play Store app → *Google developer notifications* → **Connect to Google** (napravi Pub/Sub topic) → kopiraj topic ID → Play Console → **Monetize → Monetization setup → Real-time developer notifications** → zalijepi, *Subscriptions, voided purchases and all one-time products* → Save → **Send test notification** (u RevenueCatu se pojavi „Last received“).

### 3.4 Proizvodi, entitlement, offering
1. **Product catalog → Products**: *Import* (iz Applea i Googlea): sva četiri proizvoda (2 × iOS, 2 × Android).
2. **Entitlements → +** → identifier **`premium`** → *Attach* sva četiri proizvoda.
3. **Offerings → +** → identifier `default` (Current) → paketi:
   - **Monthly (`$rc_monthly`)**: iOS `unitcent_premium_monthly`, Android `unitcent_premium_monthly:mjesecno`.
   - **Annual (`$rc_annual`)**: iOS `unitcent_premium_yearly`, Android `unitcent_premium_yearly:godisnje`.

### 3.5 Webhook prema Supabaseu
1. RevenueCat → **Integrations → Webhooks → + New**: URL `https://ekdcfznglsioobnskqnu.supabase.co/functions/v1/revenuecat-webhook` (za produkciju adresa produkcijskog projekta), **Authorization header** = nasumičan niz.
2. Supabase → Edge Functions → Secrets: **`RC_WEBHOOK_SECRET`** = isti niz.
3. Webhook → **Send test event** → u Supabase logovima funkcija vrati `ok` (test nema UUID korisnika, to je u redu).

### 3.6 Ključevi u aplikaciji i na poslužitelju
1. RevenueCat → **Project settings → API keys**: javni ključevi `appl_…` i `goog_…`.
2. EAS → projekt → **Environment variables** (preview i production): `EXPO_PUBLIC_RC_IOS_KEY`, `EXPO_PUBLIC_RC_ANDROID_KEY`.
3. RevenueCat → **API keys → + New secret key (v2)**, dozvole *Customer information: read/write* i *Project configuration/Charts: read* → Supabase Secrets: **`REVENUECAT_SECRET_KEY`** i **`REVENUECAT_PROJECT_ID`** (ID projekta iz adrese dashboarda). Admin tada pokazuje MRR i prihod, a brisanje računa briše kupca.

---

## Faza 4: test na beti
1. EAS build `preview` (iOS TestFlight, Android internal), s ključevima iz 3.6.
2. **iOS:** Postavke → App Store → *Sandbox Account* → prijava testnim Apple ID-em. U aplikaciji Profil → Nadogradi → kupi godišnje. Sandbox skraćuje vrijeme (tjedan ≈ 3 minute, godina ≈ 1 sat). Za ponovni test probnog razdoblja: *Sandbox Account → Clear Purchase History*.
3. **Android:** kupnja s Gmailom iz License testing (bez naplate).
4. Provjeri redom: Premium se uključi odmah; u Supabaseu `entitlements.premium_until` je postavljen (webhook); **Podaci i privatnost → Vrati kupnju** radi nakon reinstalacije; otkazivanje u trgovini → nakon isteka Premium se gasi.
5. Kad sve radi: **`EXPO_PUBLIC_TRIAL=1`** u EAS env → ponuda „7 dana besplatno“ na kraju onboardinga i na ekranu Premiuma.

## Faza 5: objava
- iOS: na stranici verzije → **In-App Purchases and Subscriptions** → označi obje pretplate (moraju biti *Ready to Submit*), zatim *Submit for Review*. Prve pretplate idu na pregled zajedno s aplikacijom.
- Android: pretplate su aktivne čim je aplikacija objavljena (production track).

## Izvori
- RevenueCat: [App Store Connect setup](https://www.revenuecat.com/docs/platform-resources/apple-platform-resources/app-store-connect-setup-guide), [In-App Purchase Key](https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/in-app-purchase-key-configuration), [App Store Connect API key](https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/app-store-connect-api-key-configuration), [Google Play service credentials](https://www.revenuecat.com/docs/service-credentials/creating-play-service-credentials), [Google RTDN](https://www.revenuecat.com/docs/platform-resources/server-notifications/google-server-notifications), [iOS offers](https://www.revenuecat.com/docs/subscription-guidance/subscription-offers/ios-subscription-offers), [Google Play offers](https://www.revenuecat.com/docs/subscription-guidance/subscription-offers/google-play-offers)
- Google: [Understanding subscriptions](https://support.google.com/googleplay/android-developer/answer/12154973), [Play Billing setup](https://chromeos.dev/en/publish/play-console-setup-for-billing)
- Apple: [Small Business Program](https://developer.apple.com/app-store/small-business-program/)
