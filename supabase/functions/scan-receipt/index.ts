// scan-receipt: AI čitanje računa (docs/APP-PLAN.md §5, odluka D-11).
// Tok: sesija → kvota (3/mj besplatno, 100/mj Premium) → model → validacija zbroja → odgovor.
// Slika se NE sprema nigdje: dolazi u zahtjevu, ide modelu i nestaje. Ključevi samo u Secrets.
import { createClient } from "npm:@supabase/supabase-js@2";
import { scanWithGemini } from "./gemini.ts";
import { validate, type RawScan } from "./validate.ts";

const FREE_LIMIT = 3;
const PREMIUM_LIMIT = 100;
const MAX_BASE64 = 4_000_000; // ~3 MB po slici; klijent komprimira na ~1600 px
const MAX_PARTS = 4; // dugi računi: do 4 dijela, a broji se kao JEDNO skeniranje
const MAX_TOTAL = 12_000_000;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

/** Kalendarski mjesec po Europe/Zagreb ("YYYY-MM"). */
function zagrebMonth(): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zagreb", year: "numeric", month: "2-digit" }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  return `${y}-${m}`;
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

  let body: { image_base64?: string; mime?: string; images?: { data?: string; mime?: string }[]; qr_total_cents?: number; model?: string; scan_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  // Jedna slika (staro: image_base64) ili više dijelova (images[]).
  const rawImages = Array.isArray(body.images) && body.images.length > 0 ? body.images : [{ data: body.image_base64, mime: body.mime }];
  const images = rawImages.map((i) => ({ data: i.data, mime: i.mime ?? "image/jpeg" }));
  const okImages =
    images.length >= 1 &&
    images.length <= MAX_PARTS &&
    images.every((i) => typeof i.data === "string" && i.data.length > 0 && i.data.length <= MAX_BASE64 && /^image\/(jpeg|png|webp|heic|heif)$/.test(i.mime)) &&
    images.reduce((s, i) => s + (i.data?.length ?? 0), 0) <= MAX_TOTAL;
  if (!okImages) return json({ error: "bad_image" }, 400);

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Kvota: Premium ako je entitlement aktivan.
  const { data: ent } = await admin.from("entitlements").select("premium_until").eq("user_id", uid).maybeSingle();
  const premium = !!ent?.premium_until && Date.parse(ent.premium_until) > Date.now();
  const limit = premium ? PREMIUM_LIMIT : FREE_LIMIT;
  const month = zagrebMonth();
  // scan_id: ponovljeno čitanje istog računa (dodan dio) ne troši novo skeniranje. Bez njega: svaki poziv se broji.
  const scanId = typeof body.scan_id === "string" && /^[0-9a-f-]{36}$/i.test(body.scan_id) ? body.scan_id : null;
  const consume = scanId
    ? admin.rpc("consume_scan_session", { p_user: uid, p_month: month, p_limit: limit, p_scan: scanId })
    : admin.rpc("consume_scan", { p_user: uid, p_month: month, p_limit: limit });
  const refund = () =>
    scanId ? admin.rpc("refund_scan_session", { p_user: uid, p_month: month, p_scan: scanId }) : admin.rpc("refund_scan", { p_user: uid, p_month: month });
  const { data: used, error: qErr } = await consume;
  if (qErr) return json({ error: "quota_failed" }, 500);
  if (used === null) return json({ error: "quota_exceeded", limit, premium }, 402);

  // Korisnikove kategorije (id + naziv) da model bira među njima.
  const { data: cats } = await admin
    .from("categories")
    .select("id, name")
    .eq("user_id", uid)
    .is("deleted_at", null)
    .eq("archived", false)
    .eq("kind", "expense")
    .order("sort");

  const started = Date.now();
  const model =
    Deno.env.get("ALLOW_MODEL_OVERRIDE") === "1" && body.model ? body.model : (Deno.env.get("SCAN_MODEL") ?? "gemini-3.1-flash-lite");
  let raw: RawScan;
  try {
    raw = await scanWithGemini({
      apiKey: Deno.env.get("GEMINI_API_KEY") ?? "",
      model,
      images: images as { data: string; mime: string }[],
      categories: cats ?? [],
    });
  } catch (e) {
    await refund(); // neuspjeh se ne naplaćuje u kvoti
    const msg = e instanceof Error ? e.message : String(e);
    console.error("scan failed", msg);
    // Kratka klasifikacija (npr. "gemini 404") pomaže klijentu i dijagnostici; tijelo odgovora davatelja se ne vraća.
    return json({ error: "ai_failed", code: msg.match(/^gemini \d+ [A-Z_]*/)?.[0] ?? "internal", ...(Deno.env.get("SCAN_DEBUG") === "1" ? { detail: msg.slice(0, 400) } : {}) }, 502);
  }

  const result = validate(raw, new Set((cats ?? []).map((c) => c.id)), body.qr_total_cents);
  if (result.status === "unreadable") await refund();
  // Valuta računa (npr. dinari na putu): aplikacija pretvara u zadanu valutu korisnika.
  const currency = typeof raw.currency === "string" && /^[A-Z]{3}$/.test(raw.currency) ? raw.currency : null;
  return json({ ...result, currency, usage: { used: result.status === "unreadable" ? used - 1 : used, limit, premium }, model, ms: Date.now() - started });
});
