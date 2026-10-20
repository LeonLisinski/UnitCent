// admin-stats: podaci za aplikaciju apps/admin (samo vlasnik). Bez osobnih podataka korisnika: samo zbrojevi.
// Pristup: prijavljeni korisnik čija je potvrđena e-adresa u ADMIN_EMAILS (popis odvojen zarezom, samo na poslužitelju).
// Dodatno (ako su postavljeni ključevi): RevenueCat (prihod, MRR, probna razdoblja) i Brevo (pretplatnici newslettera).
// Trošak AI-ja je procjena: broj skeniranja × AI_COST_PER_SCAN_EUR + pitanja × AI_COST_PER_QUESTION_EUR.
import { createClient } from "npm:@supabase/supabase-js@2";
import { listStats } from "../_shared/brevo.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });

interface RcMetric {
  id: string;
  value: number;
  unit?: string;
}

/** RevenueCat API v2: pregled (MRR, prihod zadnjih 28 dana, aktivne pretplate, probna razdoblja). */
async function revenuecat(): Promise<Record<string, number> | null> {
  const key = Deno.env.get("REVENUECAT_SECRET_KEY");
  const project = Deno.env.get("REVENUECAT_PROJECT_ID");
  if (!key || !project) return null;
  try {
    const res = await fetch(`https://api.revenuecat.com/v2/projects/${project}/metrics/overview?currency=EUR`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { metrics?: RcMetric[] };
    const out: Record<string, number> = {};
    for (const m of data.metrics ?? []) out[m.id] = m.value;
    return out;
  } catch {
    return null;
  }
}

/** Sljedeće slanje po rasporedu iz migracije 20261025000000_email.sql (UTC). */
function nextRuns(now = new Date()) {
  const weekly = new Date(now);
  weekly.setUTCHours(6, 0, 0, 0);
  const add = (1 - weekly.getUTCDay() + 7) % 7; // do ponedjeljka
  weekly.setUTCDate(weekly.getUTCDate() + add);
  if (weekly <= now) weekly.setUTCDate(weekly.getUTCDate() + 7);
  const monthly = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 7, 0, 0));
  if (monthly <= now) monthly.setUTCMonth(monthly.getUTCMonth() + 1);
  return { weekly: weekly.toISOString(), monthly: monthly.toISOString() };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const asUser = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: u, error } = await asUser.auth.getUser();
  if (error || !u.user) return json({ error: "unauthorized" }, 401);

  const allowed = (Deno.env.get("ADMIN_EMAILS") ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const email = (u.user.email ?? "").toLowerCase();
  if (u.user.is_anonymous || !email || !u.user.email_confirmed_at || !allowed.includes(email)) return json({ error: "forbidden" }, 403);

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const [stats, rc, brevo] = await Promise.all([admin.rpc("admin_stats"), revenuecat(), listStats()]);
  if (stats.error) {
    console.error("admin_stats failed", stats.error.message);
    return json({ error: "stats_failed" }, 500);
  }

  const s = stats.data as { ai: { scans: number; advisor: number } };
  const perScan = Number(Deno.env.get("AI_COST_PER_SCAN_EUR") ?? "0.002");
  const perQuestion = Number(Deno.env.get("AI_COST_PER_QUESTION_EUR") ?? "0.0005");
  const aiCostCents = Math.round((s.ai.scans * perScan + s.ai.advisor * perQuestion) * 100);

  return json({
    ...stats.data,
    ai: { ...s.ai, cost_cents: aiCostCents },
    revenue: rc
      ? { mrr: rc.mrr ?? null, revenue_28d: rc.revenue ?? null, active_subscriptions: rc.active_subscriptions ?? null, active_trials: rc.active_trials ?? null }
      : null,
    brevo,
    schedule: nextRuns(),
    links: { sentry: Deno.env.get("SENTRY_ISSUES_URL") ?? "https://unitlift.sentry.io/issues/", brevo: "https://app.brevo.com/", revenuecat: "https://app.revenuecat.com/" },
  });
});
