// brevo-webhook: Brevo javlja odjave s newslettera (poveznica u kampanji), prijave neželjene pošte i trajna odbijanja.
// Usklađuje email_prefs da aplikacija i admin pokazuju isto stanje kao Brevo.
// Zaštita: tajna u adresi webhooka (?key=BREVO_WEBHOOK_SECRET). Deploy: --no-verify-jwt.
import { createClient } from "npm:@supabase/supabase-js@2";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

interface BrevoEvent {
  event?: string;
  email?: string;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const secret = Deno.env.get("BREVO_WEBHOOK_SECRET");
  if (!secret || new URL(req.url).searchParams.get("key") !== secret) return json({ error: "unauthorized" }, 401);

  let events: BrevoEvent[];
  try {
    const body = await req.json();
    events = Array.isArray(body) ? body : [body];
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const now = new Date().toISOString();
  let updated = 0;
  for (const ev of events.slice(0, 100)) {
    const kind = (ev.event ?? "").toLowerCase();
    const email = (ev.email ?? "").trim().toLowerCase();
    if (!email) continue;
    // unsubscribe = samo newsletter; spam ili trajno odbijanje = ništa više ne šaljemo na tu adresu.
    const all = kind === "spam" || kind === "hard_bounce" || kind === "hardbounce" || kind === "blocked";
    if (kind !== "unsubscribe" && kind !== "unsubscribed" && !all) continue;
    const { data: uid } = await db.rpc("user_id_by_email", { p_email: email });
    if (!uid) continue;
    const patch: Record<string, unknown> = { newsletter: false, newsletter_off_at: now };
    if (all) Object.assign(patch, { product: false, product_off_at: now });
    await db.from("email_prefs").upsert({ user_id: uid, ...patch }, { onConflict: "user_id" });
    updated += 1;
  }
  return json({ ok: true, updated });
});
