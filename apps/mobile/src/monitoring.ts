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
      return event;
    },
    beforeBreadcrumb: (b) => (b.category === "console" ? null : b),
  });
}

export const wrapRoot = Sentry.wrap;

/** Ručno javljanje uhvaćene greške (npr. neuspjeh sinkronizacije koji nije rušenje). */
export function reportError(e: unknown, where: string): void {
  if (!process.env.EXPO_PUBLIC_SENTRY_DSN) return;
  Sentry.captureException(e, { tags: { where } });
}
