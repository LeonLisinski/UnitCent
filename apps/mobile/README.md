# UnitCent mobile (Expo)

Faza 0: ljuska aplikacije (navigacija, teme, fontovi, povezana domenska logika). Plan: [../../docs/APP-PLAN.md](../../docs/APP-PLAN.md).

```bash
# iz korijena repozitorija
npx pnpm@9.15.0 install      # instalira workspace i gradi tokene (prepare)
npx pnpm@9.15.0 mobile       # expo start
```

- Domenska logika: `packages/core` (`@unitcent/core`). Tokeni: `packages/tokens` (`@unitcent/tokens`, generira `dist/`).
- Provjere: `npx pnpm@9.15.0 test`, `npx pnpm@9.15.0 typecheck`, u `apps/mobile`: `npx expo-doctor`.
- Početni ekran koristi **uzorak podataka** (isti plan kao web) dok ne stigne lokalna baza (Faza 1).
- Bundle ID `com.unitcent.app` je radni (D-05). Ikona je privremena dok se ne izrade adaptive resursi za Android.
