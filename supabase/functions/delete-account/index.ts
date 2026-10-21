// Brisanje računa i svih podataka korisnika (zahtjev Apple/Google storea i GDPR-a).
// Poziva ga prijavljeni korisnik (i anonimni): briše slike računa iz Storagea i korisnika iz Authenticationa;
// sve tablice se brišu kaskadno (on delete cascade na auth.users). Kontakt se briše i iz Brevoa (e-mailovi, newsletter) i RevenueCata.
import { createClient } from "npm:@supabase/supabase-js@2";
import { allow, tooMany } from "../_shared/rateLimit.ts";
import { brevoConfigured, deleteContact } from "../_shared/brevo.ts";

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
  const asUser = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data, error } = await asUser.auth.getUser();
  if (error || !data.user) return json({ error: "unauthorized" }, 401);
  const uid = data.user.id;

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  if (!(await allow(admin, "delete-account", uid))) return tooMany(cors);

  // Slike računa: {uid}/... (do 1000 po krugu).
  for (;;) {
    const { data: files } = await admin.storage.from("receipts").list(uid, { limit: 1000 });
    if (!files || files.length === 0) break;
    const { error: rmErr } = await admin.storage.from("receipts").remove(files.map((f) => `${uid}/${f.name}`));
    if (rmErr) return json({ error: "storage_failed" }, 500);
    if (files.length < 1000) break;
  }

  // Brevo: bez kontakta nema ni mailova ni newslettera. Neuspjeh ne blokira brisanje (zapisuje se u log).
  if (data.user.email && !data.user.is_anonymous && brevoConfigured()) {
    const ok = await deleteContact(data.user.email);
    if (!ok) console.error("brevo contact delete failed", uid);
  }

  // RevenueCat: briše kupca (povijest kupnji ostaje u trgovini). Pretplatu otkazuje korisnik u trgovini; aplikacija to kaže prije brisanja.
  const rcKey = Deno.env.get("REVENUECAT_SECRET_KEY");
  const rcProject = Deno.env.get("REVENUECAT_PROJECT_ID");
  if (rcKey && rcProject) {
    try {
      const res = await fetch(`https://api.revenuecat.com/v2/projects/${rcProject}/customers/${encodeURIComponent(uid)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${rcKey}` },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok && res.status !== 404) console.error("revenuecat delete failed", res.status, uid);
    } catch (e) {
      console.error("revenuecat delete failed", e instanceof Error ? e.message : String(e), uid);
    }
  }

  const { error: delErr } = await admin.auth.admin.deleteUser(uid);
  if (delErr) return json({ error: "delete_failed" }, 500);
  return json({ ok: true });
});
