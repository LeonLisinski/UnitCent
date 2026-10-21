import type { DayCount, Stats } from "./stats";

/** Probni podaci samo za razvoj (EXPO_PUBLIC_ADMIN_MOCK=1): izgled tabova bez prijave i bez poslužitelja. */
export const MOCK = __DEV__ && process.env.EXPO_PUBLIC_ADMIN_MOCK === "1";

function days(count: number, f: (i: number) => number): DayCount[] {
  const out: DayCount[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    out.push({ day: d, count: f(count - 1 - i) });
  }
  return out;
}

export function mockStats(): Stats {
  const now = new Date();
  return {
    waitlist: {
      total: 214,
      new_1d: 6,
      new_7d: 31,
      new_30d: 118,
      by_day: days(30, (i) => Math.round(2 + Math.abs(Math.sin(i / 3)) * 7)),
      sources: [
        { source: "izravno", count: 96 },
        { source: "instagram", count: 58 },
        { source: "reddit", count: 31 },
        { source: "blog", count: 29 },
      ],
      recent: Array.from({ length: 12 }, (_, i) => ({
        email: `osoba${i + 1}@primjer.hr`,
        source: i % 3 === 0 ? "instagram" : null,
        at: new Date(now.getTime() - i * 5_400_000).toISOString(),
      })),
    },
    users: {
      total: 642,
      with_email: 288,
      anonymous: 354,
      new_1d: 9,
      new_7d: 57,
      new_30d: 203,
      dau: 74,
      wau: 211,
      mau: 389,
      entries_7d: 2140,
      retention_d7: { cohort: 61, active: 34 },
      retention_d30: { cohort: 48, active: 19 },
      new_by_day: days(30, (i) => Math.round(4 + Math.abs(Math.cos(i / 4)) * 8)),
      active_by_day: days(14, (i) => 60 + Math.round(Math.sin(i / 2) * 15)),
    },
    premium: { active: 41, yearly: 27, monthly: 13, lifetime: 0, dev: 1, expiring_7d: 2, new_30d: 12 },
    ai: {
      month: now.toISOString().slice(0, 7),
      scans: 1380,
      scans_prev: 1105,
      scan_users: 212,
      advisor: 460,
      advisor_users: 96,
      cost_cents: 299,
      scans_by_day: days(14, (i) => 70 + Math.round(Math.cos(i) * 20)),
      advisor_by_day: days(14, (i) => 25 + Math.round(Math.sin(i) * 10)),
    },
    email: {
      audience: 271,
      newsletter: 84,
      newsletter_off_30d: 3,
      product_off_30d: 5,
      last_7d: { welcome: 42, tips: 37, weekly: 198, winback: 11 },
      total_sent: 1890,
      failed_7d: 1,
      sent_by_day: days(14, (i) => (i % 7 === 6 ? 198 : 10 + (i % 5))),
    },
    revenue: { mrr: 98.4, revenue_28d: 211.3, active_subscriptions: 40, active_trials: 7 },
    brevo: { subscribers: 84, total: 87 },
    schedule: { weekly: new Date(now.getTime() + 5 * 86_400_000).toISOString(), monthly: new Date(now.getTime() + 11 * 86_400_000).toISOString() },
    links: { sentry: "https://sentry.io", brevo: "https://app.brevo.com/", revenuecat: "https://app.revenuecat.com/" },
    generated_at: now.toISOString(),
  };
}
