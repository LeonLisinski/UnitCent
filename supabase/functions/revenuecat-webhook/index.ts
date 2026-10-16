// revenuecat-webhook: RevenueCat javlja događaje pretplate (kupnja, obnova, otkazivanje, istek); ovdje se upisuje
// pristup u `entitlements` (piše samo poslužitelj). Klijent čita svoj redak i pamti ga lokalno.
// Zaštita: zaglavlje Authorization mora odgovarati tajni RC_WEBHOOK_SECRET (postavlja se u RevenueCat i u Supabase Secrets).
import { createClient } from "npm:@supabase/supabase-js@2";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface RcEvent {
  type?: string;
  app_user_id?: string;
  aliases?: string[];
  original_app_user_id?: string;
  product_id?: string;
  store?: string;
  expiration_at_ms?: number | null;
  event_timestamp_ms?: number;
  entitlement_ids?: string[] | null;
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const secret = Deno.env.get("RC_WEBHOOK_SECRET");
  const auth = req.headers.get("Authorization") ?? "";
  if (!secret || (auth !== secret && auth !== `Bearer ${secret}`)) return json({ error: "unauthorized" }, 401);

  let ev: RcEvent;
  try {
    ev = ((await req.json()) as { event?: RcEvent }).event ?? {};
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  // Korisnik je app_user_id (Supabase uid); ako je RevenueCat spojio račune, uzimamo prvi UUID među aliasima.
  const candidates = [ev.app_user_id, ev.original_app_user_id, ...(ev.aliases ?? [])].filter((x): x is string => !!x && UUID.test(x));
  const uid = candidates[0];
  if (!uid) return json({ ok: true, ignored: "no_uuid" }); // npr. testni događaj

  // Samo događaji koji nose novi rok: kupnja, obnova, promjena, otkazivanje (rok vrijedi do kraja), istek.
  const relevant = ["INITIAL_PURCHASE", "RENEWAL", "PRODUCT_CHANGE", "UNCANCELLATION", "CANCELLATION", "EXPIRATION", "NON_RENEWING_PURCHASE", "SUBSCRIPTION_EXTENDED"];
  if (!ev.type || !relevant.includes(ev.type)) return json({ ok: true, ignored: ev.type ?? "unknown" });

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Idempotencija i redoslijed: stariji događaj od zadnjeg obrađenog ne smije prepisati noviji.
  const at = ev.event_timestamp_ms ?? Date.now();
  const { data: cur } = await admin.from("entitlements").select("last_event_at").eq("user_id", uid).maybeSingle();
  if (cur?.last_event_at && Date.parse(cur.last_event_at) > at) return json({ ok: true, ignored: "stale" });

  const expired = ev.type === "EXPIRATION";
  const until = expired ? new Date(Math.min(at, Date.now())).toISOString() : ev.expiration_at_ms ? new Date(ev.expiration_at_ms).toISOString() : null;
  const pid = (ev.product_id ?? "").toLowerCase();
  const product = pid.includes("year") || pid.includes("annual") ? "yearly" : pid.includes("month") ? "monthly" : null;

  const { error } = await admin.from("entitlements").upsert(
    {
      user_id: uid,
      premium_until: until,
      source: ev.store ?? null,
      product,
      rc_customer_id: ev.original_app_user_id ?? ev.app_user_id ?? null,
      last_event_at: new Date(at).toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) {
    console.error("entitlement upsert failed", error.message);
    return json({ error: "db_failed" }, 500); // RevenueCat će ponoviti slanje
  }
  return json({ ok: true });
});
