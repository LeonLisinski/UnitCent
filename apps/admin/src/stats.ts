import { supabase } from "./supabase";

/** Odgovor funkcije admin-stats (supabase/functions/admin-stats). Samo zbrojevi, bez osobnih podataka. */
export interface Stats {
  users: {
    total: number;
    with_email: number;
    new_1d: number;
    new_7d: number;
    new_30d: number;
    dau: number;
    wau: number;
    mau: number;
    retention_d7: { cohort: number; active: number };
    retention_d30: { cohort: number; active: number };
    new_by_day: { day: string; count: number }[];
  };
  premium: { active: number; yearly: number; monthly: number; expiring_7d: number };
  ai: { month: string; scans: number; scans_prev: number; scan_users: number; advisor: number; cost_cents: number };
  email: {
    audience: number;
    newsletter: number;
    newsletter_off_30d: number;
    product_off_30d: number;
    last_7d: Partial<Record<"welcome" | "tips" | "weekly" | "monthly" | "winback", number>>;
    failed_7d: number;
  };
  revenue: { mrr: number | null; revenue_28d: number | null; active_subscriptions: number | null; active_trials: number | null } | null;
  brevo: { subscribers: number; total: number } | null;
  schedule: { weekly: string; monthly: string };
  links: { sentry: string; brevo: string; revenuecat: string };
  generated_at: string;
}

export type StatsResult = { ok: true; stats: Stats } | { ok: false; reason: "forbidden" | "offline" | "error" };

export async function fetchStats(): Promise<StatsResult> {
  if (!supabase) return { ok: false, reason: "error" };
  try {
    const { data, error } = await supabase.functions.invoke("admin-stats", { body: {} });
    if (error) {
      const status = (error as { context?: { status?: number } }).context?.status;
      return { ok: false, reason: status === 403 || status === 401 ? "forbidden" : "error" };
    }
    return { ok: true, stats: data as Stats };
  } catch {
    return { ok: false, reason: "offline" };
  }
}
