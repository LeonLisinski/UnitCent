// insights: AI uvidi i savjeti (Premium). Brojke računa poslužitelj (facts.ts), model ih samo preformulira.
// Šalju se samo zbrojevi (bez bilješki i trgovina). Rezultat se kešira po korisniku i mjesecu.
// Free korisnik dobiva jedan uvid u cijelosti; ostali stižu bez teksta (zaključani), pa ograničenje drži poslužitelj.
import { createClient } from "npm:@supabase/supabase-js@2";
import { allow, tooMany } from "../_shared/rateLimit.ts";
import { computeFacts, numbersAreSubset, type Fact } from "./facts.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

function zagrebToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zagreb" }).format(new Date());
}

async function sha(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

/** Model samo preformulira tekst; ako doda brojku koje nema u činjenici, zadržava se predložak. */
async function rephrase(facts: Fact[]): Promise<Record<string, string>> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey || facts.length === 0) return {};
  const model = Deno.env.get("INSIGHTS_MODEL") ?? Deno.env.get("SCAN_MODEL") ?? "gemini-3.1-flash-lite";
  const prompt = `Preformuliraj svaki od ovih savjeta o osobnim financijama na hrvatskom, kratko (najviše 2 rečenice), na „ti“, činjenično, bez osude i bez moraliziranja.
STROGO: koristi ISKLJUČIVO brojke koje već stoje u tekstu, u istom zapisu; ne dodaj, ne zaokružuj i ne računaj nove brojke.
Vrati JSON objekt: ključ je "id", vrijednost je novi tekst.

${facts.map((f) => `${f.id}: ${f.body}`).join("\n")}`;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return {};
    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    const parsed = JSON.parse(text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const f of facts) {
      const v = parsed[f.id];
      if (typeof v === "string" && v.length > 0 && v.length <= 280 && numbersAreSubset(v, f.numbers)) out[f.id] = v;
    }
    return out;
  } catch (e) {
    console.error("rephrase failed", e instanceof Error ? e.message : String(e));
    return {};
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const asUser = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: u, error: authErr } = await asUser.auth.getUser();
  if (authErr || !u.user) return json({ error: "unauthorized" }, 401);
  const uid = u.user.id;

  const today = zagrebToday();
  let month = today.slice(0, 7);
  try {
    const body = await req.json();
    if (typeof body?.month === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(body.month) && body.month <= month) month = body.month;
  } catch { /* prazno tijelo = tekući mjesec */ }

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  if (!(await allow(admin, "insights", uid))) return tooMany(cors);
  const { data: ent } = await admin.from("entitlements").select("premium_until").eq("user_id", uid).maybeSingle();
  const premium = !!ent?.premium_until && Date.parse(ent.premium_until) > Date.now();

  const since = new Date(`${month}-01T12:00:00`);
  since.setMonth(since.getMonth() - 4);
  const sinceStr = since.toISOString().slice(0, 10);

  const [txs, cats, rec, plan] = await Promise.all([
    admin.from("transactions").select("amount_cents, type, category_id, local_date, source").eq("user_id", uid).is("deleted_at", null).gte("local_date", sinceStr).limit(5000),
    admin.from("categories").select("id, name").eq("user_id", uid).is("deleted_at", null),
    admin.from("recurring_items").select("amount_cents, day_of_month, start_date, end_date, active").eq("user_id", uid).is("deleted_at", null),
    admin.from("month_plans").select("income_cents, savings_cents").eq("user_id", uid).eq("month", month).is("deleted_at", null).maybeSingle(),
  ]);
  if (txs.error || cats.error || rec.error || plan.error) return json({ error: "read_failed" }, 500);

  const facts = computeFacts({
    today,
    month,
    transactions: txs.data ?? [],
    categories: cats.data ?? [],
    recurring: rec.data ?? [],
    plan: plan.data ?? null,
  }).slice(0, 5);

  // Prag za smislene uvide: najmanje 10 troškova u zadnjih 100 dana.
  if ((txs.data ?? []).filter((t) => t.type === "expense").length < 10 || facts.length === 0) {
    return json({ status: "not_enough_data", premium, month, items: [] });
  }

  const hash = await sha(JSON.stringify(facts.map((f) => [f.id, f.body])));
  let texts: Record<string, string> = {};
  const { data: cached } = await admin.from("insights_cache").select("facts_hash, items").eq("user_id", uid).eq("month", month).maybeSingle();
  if (cached && cached.facts_hash === hash) {
    texts = cached.items as Record<string, string>;
  } else {
    texts = await rephrase(facts);
    await admin.from("insights_cache").upsert({ user_id: uid, month, facts_hash: hash, items: texts, created_at: new Date().toISOString() });
  }

  const items = facts.map((f, i) => {
    const open = premium || i === 0;
    return open
      ? { id: f.id, locked: false, tone: f.tone, icon: f.icon, title: f.title, body: texts[f.id] ?? f.body }
      : { id: f.id, locked: true, tone: f.tone, icon: f.icon, title: null, body: null };
  });
  return json({ status: "ok", premium, month, items });
});
