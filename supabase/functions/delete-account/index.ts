// Brisanje računa i svih podataka korisnika (zahtjev Apple/Google storea i GDPR-a).
// Poziva ga prijavljeni korisnik (i anonimni): briše slike računa iz Storagea i korisnika iz Authenticationa;
// sve tablice se brišu kaskadno (on delete cascade na auth.users).
import { createClient } from "npm:@supabase/supabase-js@2";

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

  // Slike računa: {uid}/... (do 1000 po krugu).
  for (;;) {
    const { data: files } = await admin.storage.from("receipts").list(uid, { limit: 1000 });
    if (!files || files.length === 0) break;
    const { error: rmErr } = await admin.storage.from("receipts").remove(files.map((f) => `${uid}/${f.name}`));
    if (rmErr) return json({ error: "storage_failed" }, 500);
    if (files.length < 1000) break;
  }

  const { error: delErr } = await admin.auth.admin.deleteUser(uid);
  if (delErr) return json({ error: "delete_failed" }, 500);
  return json({ ok: true });
});
