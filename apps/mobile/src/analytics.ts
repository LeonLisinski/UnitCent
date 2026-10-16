import PostHog from "posthog-react-native";
import { kvGet } from "./db/repo";
import { getDb } from "./db/client";

/**
 * Anonimna statistika korištenja (PostHog, EU). Bez identifikacije korisnika, bez iznosa, naziva i bilješki:
 * samo vrste događaja (npr. „trošak dodan, ručno“, „skeniranje uspjelo“, „otvoren Premium“). Korisnik je može
 * isključiti u Profil → Podaci i privatnost. Radi samo kad je postavljen EXPO_PUBLIC_POSTHOG_KEY.
 */
const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
let client: PostHog | null = null;

export const analyticsEnabled = (): boolean => kvGet("analytics.off") !== "1";

export function initAnalytics(): void {
  if (!KEY || client || !analyticsEnabled()) return;
  client = new PostHog(KEY, {
    host: "https://eu.i.posthog.com",
    captureAppLifecycleEvents: true,
    enableSessionReplay: false,
  });
}

export function track(event: string, props?: Record<string, string | number | boolean>): void {
  if (!client || !analyticsEnabled()) return;
  client.capture(event, props);
}

export function setAnalyticsEnabled(on: boolean): void {
  getDb().runSync("insert into kv (key, value) values ('analytics.off', ?) on conflict(key) do update set value = excluded.value", [on ? "0" : "1"]);
  if (on) initAnalytics();
  else void client?.optOut();
}
