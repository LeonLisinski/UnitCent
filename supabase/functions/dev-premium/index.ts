// dev-premium: testni prekidač Premiuma (Profil → Testiranje) i na poslužitelju, da se Premium ograničenja
// (npr. 100 skeniranja) mogu isprobati prije nego je RevenueCat spojen. Radi SAMO na dev projektu (popis ispod):
// na stagingu i produkciji vraća 403, čak i ako je funkcija slučajno objavljena.
// Ne dira pravu kupnju: piše i briše samo redak sa source = 'dev'.
import { createClient } from "npm:@supabase/supabase-js@2";

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

  let on = false;
  try {
    on = (await req.json())?.on === true;
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
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
