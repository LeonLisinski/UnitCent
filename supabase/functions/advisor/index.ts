// advisor: AI savjetnik (pitanja na dodir). Brojke računa poslužitelj (answers.ts), model ih samo preformulira.
// Savjetnik je Premium. Kvota (consume_advisor, atomarno u bazi): besplatno 3 pitanja mjesečno, Premium 20 dnevno (najviše 300 mjesečno).
// Ponovljeno isto pitanje s istim brojkama ne troši kvotu; ni odgovor bez podataka.
// Modelu ne idu imena pretplata (zamijenjena oznakama), bilješke ni trgovine.
import { createClient } from "npm:@supabase/supabase-js@2";
import { numbersAreSubset } from "../insights/facts.ts";
import { answer, fillPlaceholders, QUESTION_TEXT, QUESTIONS, type QuestionKey } from "./answers.ts";

/** Besplatna pitanja mjesečno (isto kao u consume_advisor i FREE_AI_PER_MONTH u aplikaciji). */
const FREE_LIMIT = 3;

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

/** Model preformulira jedan odgovor; ako promijeni brojke ili izgubi oznake, ostaje predložak. */
async function rephrase(question: string, body: string, numbers: string[], placeholders: Record<string, string>): Promise<string | null> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return null;
  const model = Deno.env.get("INSIGHTS_MODEL") ?? Deno.env.get("SCAN_MODEL") ?? "gemini-3.1-flash-lite";
  const prompt = `Ti si kratak, smiren savjetnik za osobne financije u aplikaciji UnitCent. Korisnik pita: „${question}“
Odgovori mu prirodno, kao u razgovoru, na hrvatskom, na „ti“, najviše 3 rečenice, prvo izravan odgovor na pitanje.
Činjenično, bez osude i bez moraliziranja. Možeš dodati jedan konkretan, praktičan prijedlog bez brojki.
STROGO: koristi ISKLJUČIVO brojke koje već stoje u polaznom odgovoru, u istom zapisu; ne dodaj, ne zaokružuj i ne računaj nove.
Oznake u vitičastim zagradama (npr. {A}) ostavi točno kako jesu. Vrati samo tekst odgovora.

Polazni odgovor (njegove činjenice ne mijenjaj):
${body}`;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4 } }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string = (data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "").trim();
    if (!text || text.length > 420 || !numbersAreSubset(text, numbers)) return null;
    return Object.keys(placeholders).every((p) => text.includes(p)) ? text : null;
  } catch (e) {
    console.error("advisor rephrase failed", e instanceof Error ? e.message : String(e));
    return null;
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

  let key: QuestionKey;
  try {
    const body = await req.json();
    if (!QUESTIONS.includes(body?.question)) return json({ error: "bad_question" }, 400);
    key = body.question;
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  const today = zagrebToday();
  const month = today.slice(0, 7);
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: ent } = await admin.from("entitlements").select("premium_until").eq("user_id", uid).maybeSingle();
  const premium = !!ent?.premium_until && Date.parse(ent.premium_until) > Date.now();

  const { data: prior, error: priorErr } = await admin
    .from("advisor_answers")
    .select("facts_hash, text")
    .eq("user_id", uid)
    .eq("month", month)
    .eq("question", key)
    .maybeSingle();
  if (priorErr) return json({ error: "read_failed" }, 500);

  const since = new Date(`${month}-01T12:00:00`);
  since.setMonth(since.getMonth() - 4);
  const [txs, cats, rec, plan] = await Promise.all([
    admin.from("transactions").select("amount_cents, type, category_id, local_date, source").eq("user_id", uid).is("deleted_at", null).gte("local_date", since.toISOString().slice(0, 10)).limit(5000),
    admin.from("categories").select("id, name").eq("user_id", uid).is("deleted_at", null),
    admin.from("recurring_items").select("name, amount_cents, day_of_month, start_date, end_date, active").eq("user_id", uid).is("deleted_at", null),
    admin.from("month_plans").select("income_cents, savings_cents").eq("user_id", uid).eq("month", month).is("deleted_at", null).maybeSingle(),
  ]);
  if (txs.error || cats.error || rec.error || plan.error) return json({ error: "read_failed" }, 500);

  const a = answer(
    key,
    { today, month, transactions: txs.data ?? [], categories: cats.data ?? [], recurring: rec.data ?? [], plan: plan.data ?? null },
    rec.data ?? [],
  );
  // Bez podataka: samo objašnjenje, bez modela i bez trošenja kvote.
  if (a.empty) return json({ status: "ok", premium, charged: false, text: a.body, rows: [] });

  const hash = await sha(JSON.stringify([a.body, a.rows]));
  let text: string;
  let charged = false;
  let usedNow: number | null = null;
  if (prior && prior.facts_hash === hash) {
    text = prior.text;
  } else {
    const { data: q, error: qErr } = await admin.rpc("consume_advisor", { p_user: uid, p_day: today, p_premium: premium });
    if (qErr) return json({ error: "quota_failed" }, 500);
    if (q === -1) return json({ status: "locked", premium, scope: "month" });
    if (q === -2) return json({ status: "locked", premium, scope: "day" });
    charged = true;
    usedNow = typeof q === "number" ? q : null;
    const model = await rephrase(QUESTION_TEXT[key], a.body, a.numbers, a.placeholders);
    text = (model && fillPlaceholders(model, a.placeholders)) ?? fillPlaceholders(a.body, a.placeholders) ?? a.body;
    const { error } = await admin
      .from("advisor_answers")
      .upsert({ user_id: uid, month, question: key, facts_hash: hash, text, rows: a.rows, created_at: new Date().toISOString() });
    if (error) return json({ error: "write_failed" }, 500);
  }
  // Free vidi koliko mu je pitanja ostalo (samo kad je pitanje naplaćeno; inače broj nije poznat bez dodatnog čitanja).
  const remaining = !premium && usedNow !== null ? Math.max(0, FREE_LIMIT - usedNow) : null;
  return json({ status: "ok", premium, charged, remaining, text, rows: a.rows });
});
