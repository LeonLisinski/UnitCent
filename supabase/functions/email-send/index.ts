// email-send: životni ciklus e-mailova (faza F). Poziva ga samo pg_cron (zaglavlje x-cron-secret = EMAIL_CRON_SECRET).
// Tijelo: { job: "welcome" | "tips" | "weekly" | "monthly" | "winback", limit?: number }.
// Svaki korisnik dobiva redak u email_log PRIJE slanja (idempotencija: isti mail nikad dvaput, ni kad se krugovi preklope).
// Tjedni i mjesečni sažetak se preskaču (status 'skipped') kad nema unosa, da ne šaljemo prazne brojke.
// Deploy bez provjere JWT-a (poziva ga baza, ne korisnik): supabase functions deploy email-send --no-verify-jwt
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { brevoConfigured, sendEmail } from "../_shared/brevo.ts";
import { daysIn, type Tx } from "../insights/facts.ts";
import { lastWeek, monthSummary, prevMonth, weekSummary, type DigestInput } from "./digest.ts";
import { monthlyEmail, SITE, tipsEmail, weeklyEmail, welcomeEmail, winbackEmail, type EmailParts } from "./templates.ts";

type Job = "welcome" | "tips" | "weekly" | "monthly" | "winback";
const JOBS: Job[] = ["welcome", "tips", "weekly", "monthly", "winback"];

interface Candidate {
  user_id: string;
  email: string;
  name: string | null;
  premium: boolean;
  weekly_sent: number;
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function zagrebToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zagreb" }).format(new Date());
}

/** Podaci za sažetak od prvog dana mjeseca u kojem razdoblje počinje (dodatni prihodi tog mjeseca ulaze u plan). */
async function loadDigest(db: SupabaseClient, uid: string, from: string, to: string): Promise<DigestInput | null> {
  const [txs, cats, rec, plans] = await Promise.all([
    db.from("transactions").select("amount_cents, type, category_id, local_date, source").eq("user_id", uid).is("deleted_at", null)
      .gte("local_date", `${from.slice(0, 7)}-01`).lte("local_date", to).limit(5000),
    db.from("categories").select("id, name").eq("user_id", uid).is("deleted_at", null),
    db.from("recurring_items").select("amount_cents, day_of_month, start_date, end_date, active").eq("user_id", uid).is("deleted_at", null),
    db.from("month_plans").select("month, income_cents, savings_cents, spent_before_cents").eq("user_id", uid).is("deleted_at", null).lte("month", to.slice(0, 7)),
  ]);
  if (txs.error || cats.error || rec.error || plans.error) return null;
  return { transactions: (txs.data ?? []) as Tx[], categories: cats.data ?? [], recurring: rec.data ?? [], plans: plans.data ?? [] };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const secret = Deno.env.get("EMAIL_CRON_SECRET");
  if (!secret || req.headers.get("x-cron-secret") !== secret) return json({ error: "unauthorized" }, 401);

  let job: Job;
  let limit = 100;
  try {
    const body = (await req.json()) as { job?: string; limit?: number };
    if (!JOBS.includes(body.job as Job)) return json({ error: "bad_job" }, 400);
    job = body.job as Job;
    if (typeof body.limit === "number" && body.limit > 0) limit = Math.min(200, Math.floor(body.limit));
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  if (!brevoConfigured()) return json({ ok: true, skipped: "brevo_not_configured" });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const today = zagrebToday();
  const week = lastWeek(today);
  const month = prevMonth(today.slice(0, 7));
  const period = job === "weekly" ? week.period : job === "monthly" ? month : "";

  // Dnevna granica (Brevo besplatno: 300/dan). Računa se po UTC danu, sa svim vrstama zajedno.
  const cap = Number(Deno.env.get("EMAIL_DAILY_CAP") ?? "280");
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const { count: sentToday } = await db.from("email_log").select("user_id", { count: "exact", head: true })
    .in("status", ["sent", "pending"]).gte("created_at", dayStart.toISOString());
  const room = Math.max(0, cap - (sentToday ?? 0));
  if (room === 0) return json({ ok: true, job, sent: 0, skipped: "daily_cap" });

  const { data: cands, error } = await db.rpc("email_candidates", { p_kind: job, p_period: period, p_limit: Math.min(limit, room) });
  if (error) {
    console.error("candidates failed", error.message);
    return json({ error: "candidates_failed" }, 500);
  }
  const list = (cands ?? []) as Candidate[];
  if (list.length === 0) return json({ ok: true, job, period, sent: 0 });

  // Token za odjavu: redak u email_prefs nastaje pri prvom mailu (zadano: sažeci uključeni, newsletter isključen).
  const ids = list.map((c) => c.user_id);
  await db.from("email_prefs").upsert(ids.map((user_id) => ({ user_id })), { onConflict: "user_id", ignoreDuplicates: true });
  const { data: prefs } = await db.from("email_prefs").select("user_id, token").in("user_id", ids);
  const tokens = new Map((prefs ?? []).map((p) => [p.user_id as string, p.token as string]));

  const result = { sent: 0, skipped: 0, failed: 0 };

  const one = async (c: Candidate) => {
    const token = tokens.get(c.user_id);
    if (!token) return;
    // Rezervacija prije slanja: ako redak već postoji (paralelni krug), ne šaljemo.
    const { data: claimed } = await db.from("email_log")
      .upsert({ user_id: c.user_id, kind: job, period, status: "pending" }, { onConflict: "user_id,kind,period", ignoreDuplicates: true })
      .select("user_id");
    if (!claimed || claimed.length === 0) return;

    const name = c.name && c.name.trim() ? c.name.trim() : null;
    const page = `${SITE}/odjava?t=${token}`;
    let mail: EmailParts | null = null;
    let premiumCta = false;

    if (job === "welcome") mail = welcomeEmail(name, page);
    else if (job === "tips") mail = tipsEmail(name, page);
    else if (job === "winback") mail = winbackEmail(name, page);
    else {
      const from = job === "weekly" ? week.start : `${month}-01`;
      const to = job === "weekly" ? week.end : `${month}-${String(daysIn(month)).padStart(2, "0")}`;
      const data = await loadDigest(db, c.user_id, from, to);
      if (data) {
        if (job === "weekly") {
          const w = weekSummary(data, week.start, week.end);
          // Premium jednom uz prvi tjedni sažetak (oko 7. dana), zatim u svakom 4.
          premiumCta = !c.premium && c.weekly_sent % 4 === 0;
          if (w.entries > 0) mail = weeklyEmail(name, w, { premiumCta }, page);
        } else {
          const m = monthSummary(data, month);
          if (m.daysWithEntries > 0) mail = monthlyEmail(name, m, { premiumCta: false }, page);
        }
      }
    }

    if (!mail) {
      await db.from("email_log").update({ status: "skipped" }).match({ user_id: c.user_id, kind: job, period });
      result.skipped += 1;
      return;
    }
    const id = await sendEmail({ to: c.email, subject: mail.subject, html: mail.html, text: mail.text, unsubscribeUrl: `${SITE}/api/odjava?t=${token}`, tag: job });
    await db.from("email_log")
      .update({ status: id ? "sent" : "failed", message_id: id, premium_cta: !!id && premiumCta })
      .match({ user_id: c.user_id, kind: job, period });
    if (id) result.sent += 1;
    else result.failed += 1;
  };

  // Po 5 paralelno: dovoljno brzo za 100 korisnika unutar vremena funkcije, bez udaranja u granice Brevoa.
  for (let i = 0; i < list.length; i += 5) await Promise.all(list.slice(i, i + 5).map(one));

  return json({ ok: true, job, period, ...result });
});
