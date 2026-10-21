// dev-premium: testni prekidač Premiuma (Profil → Testiranje) i na poslužitelju, da se Premium ograničenja
// (npr. 100 skeniranja) mogu isprobati bez kupnje. Projekt „UnitCent“ je i produkcija, pa prekidač smije samo
// vlasnik: prijavljena, potvrđena e-adresa iz ADMIN_EMAILS (ista tajna kao za admin). Svi ostali dobivaju 403.
// Ne dira pravu kupnju: piše i briše samo redak sa source = 'dev'.
import { createClient } from "npm:@supabase/supabase-js@2";
import { allow, tooMany } from "../_shared/rateLimit.ts";

const DEV_PROJECTS = ["ekdcfznglsioobnskqnu"];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  if (!DEV_PROJECTS.some((ref) => url.includes(ref))) return json({ error: "forbidden" }, 403);

  const asUser = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: u, error: authErr } = await asUser.auth.getUser();
  if (authErr || !u.user) return json({ error: "unauthorized" }, 401);
  const uid = u.user.id;
  const allowed = (Deno.env.get("ADMIN_EMAILS") ?? "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
  const email = (u.user.email ?? "").toLowerCase();
  if (u.user.is_anonymous || !email || !u.user.email_confirmed_at || !allowed.includes(email)) return json({ error: "forbidden" }, 403);

  let on = false;
  try {
    on = (await req.json())?.on === true;
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  if (!(await allow(admin, "dev-premium", uid))) return tooMany(cors);
  const { data: ent } = await admin.from("entitlements").select("source, premium_until").eq("user_id", uid).maybeSingle();
  if (ent && ent.source !== "dev") return json({ ok: true, premium_until: ent.premium_until, note: "real_entitlement" });

  if (on) {
    const until = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();
    const { error } = await admin
      .from("entitlements")
      .upsert({ user_id: uid, premium_until: until, source: "dev", product: null, updated_at: new Date().toISOString() });
    if (error) {
      console.error("dev-premium write", error.message);
      return json({ error: "write_failed" }, 500);
    }
    return json({ ok: true, premium_until: until });
  }
  const { error } = await admin.from("entitlements").delete().eq("user_id", uid).eq("source", "dev");
  if (error) return json({ error: "write_failed" }, 500);
  return json({ ok: true, premium_until: null });
});
