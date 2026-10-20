// email-prefs: čitanje i izmjena izbora za e-mailove (sažeci i newsletter). Jedino mjesto koje mijenja email_prefs
// i usklađuje popis za newsletter u Brevu.
// Dva načina:
//  1) iz aplikacije: prijavljeni korisnik (ne gost), tijelo { product?, newsletter? } ili {} za čitanje;
//  2) s web stranice za odjavu (unitcent.com/odjava): tijelo { token, product?, newsletter? }; token je iz maila.
// Newsletter je zaseban izbor koji uključuje samo korisnik (GDPR); bilježi se vrijeme privole.
import { createClient } from "npm:@supabase/supabase-js@2";
import { setNewsletter } from "../_shared/brevo.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** l•••@gmail.com: stranica za odjavu pokazuje čija je adresa, ali ne cijelu. */
function mask(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "";
  return `${user.charAt(0)}•••@${domain}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: { token?: string; product?: boolean; newsletter?: boolean } = {};
  try {
    body = await req.json();
  } catch { /* prazno tijelo = čitanje */ }

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  let uid: string;
  let email: string;
  const viaToken = typeof body.token === "string";
  if (viaToken) {
    if (!UUID.test(body.token!)) return json({ error: "bad_token" }, 400);
    const { data: p } = await admin.from("email_prefs").select("user_id").eq("token", body.token!).maybeSingle();
    if (!p) return json({ error: "not_found" }, 404);
    const { data: u } = await admin.auth.admin.getUserById(p.user_id);
    if (!u?.user?.email) return json({ error: "not_found" }, 404);
    uid = u.user.id;
    email = u.user.email;
  } else {
    const asUser = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: u, error } = await asUser.auth.getUser();
    if (error || !u.user) return json({ error: "unauthorized" }, 401);
    if (u.user.is_anonymous || !u.user.email) return json({ error: "no_email" }, 400);
    uid = u.user.id;
    email = u.user.email;
  }

  await admin.from("email_prefs").upsert({ user_id: uid }, { onConflict: "user_id", ignoreDuplicates: true });
  const { data: cur, error: readErr } = await admin.from("email_prefs").select("product, newsletter").eq("user_id", uid).single();
  if (readErr || !cur) return json({ error: "read_failed" }, 500);

  const patch: Record<string, unknown> = {};
  const now = new Date().toISOString();
  if (typeof body.product === "boolean" && body.product !== cur.product) {
    patch.product = body.product;
    if (!body.product) patch.product_off_at = now;
  }
  if (typeof body.newsletter === "boolean" && body.newsletter !== cur.newsletter) {
    // S web stranice za odjavu newsletter se smije samo isključiti (uključuje se u aplikaciji, uz privolu).
    if (!(viaToken && body.newsletter)) {
      const ok = await setNewsletter(email, body.newsletter);
      if (!ok && body.newsletter) return json({ error: "newsletter_unavailable" }, 503);
      patch.newsletter = body.newsletter;
      if (body.newsletter) patch.newsletter_consent_at = now;
      else patch.newsletter_off_at = now;
    }
  }
  if (Object.keys(patch).length > 0) {
    const { error } = await admin.from("email_prefs").update(patch).eq("user_id", uid);
    if (error) return json({ error: "write_failed" }, 500);
  }

  const out = { product: (patch.product as boolean | undefined) ?? cur.product, newsletter: (patch.newsletter as boolean | undefined) ?? cur.newsletter };
  return json(viaToken ? { ...out, email: mask(email) } : out);
});
