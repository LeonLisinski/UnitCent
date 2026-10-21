import * as Sentry from "@sentry/react-native";

/**
 * Praćenje grešaka (Sentry, EU regija). Šalju se samo tehnički podaci o grešci: bez korisnika, bez zahtjeva i bez
 * dnevnika konzole (u njima bi mogli biti iznosi). Radi samo kad je postavljen EXPO_PUBLIC_SENTRY_DSN.
 */
export function initMonitoring(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: __DEV__ ? "development" : "production",
    sendDefaultPii: false,
    tracesSampleRate: 0,
    attachScreenshot: false,
    beforeSend(event) {
      delete event.user;
      delete event.request;
      delete event.extra;
      // Poruke grešaka mogu sadržavati iznose ili e-adrese (npr. iz odgovora poslužitelja).
      for (const ex of event.exception?.values ?? []) if (ex.value) ex.value = scrub(ex.value);
      if (event.message) event.message = scrub(event.message);
      return event;
    },
    beforeBreadcrumb: (b) => {
      // Konzola i dodiri (oznaka dodirnutog elementa može biti iznos ili naziv troška) se ne šalju.
      if (b.category === "console" || b.category === "touch" || b.category?.startsWith("ui.")) return null;
      // HTTP i navigacija: samo putanja, bez parametara (u njima mogu biti ID-evi, datumi i iznosi).
      if (b.data) {
        for (const k of ["url", "to", "from"]) {
          const v = b.data[k];
          if (typeof v === "string") b.data[k] = v.split("?")[0];
        }
        delete b.data.params;
      }
      if (b.message) b.message = scrub(b.message.split("?")[0] ?? "");
      return b;
    },
  });
}

/** Miče iznose (1.234,56 €), e-adrese i duge brojeve iz teksta prije slanja u Sentry. */
export function scrub(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]")
    .replace(/[−-]?\d[\d.]*,\d{2}\s?€?/g, "[iznos]")
    .replace(/\d{5,}/g, "[broj]");
}

export const wrapRoot = Sentry.wrap;

/** Ručno javljanje uhvaćene greške (npr. neuspjeh sinkronizacije koji nije rušenje). */
export function reportError(e: unknown, where: string): void {
  if (!process.env.EXPO_PUBLIC_SENTRY_DSN) return;
  Sentry.captureException(e, { tags: { where } });
}
