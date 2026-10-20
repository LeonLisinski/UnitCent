import { NextResponse } from "next/server";

// Odjava od e-mailova. Token je u svakom mailu (zaglavlje List-Unsubscribe i poveznica u podnožju).
// POST s tijelom „List-Unsubscribe=One-Click“ (Gmail, Apple Mail, RFC 8058) isključuje sažetke odmah.
// POST s JSON-om dolazi sa stranice /odjava: {} čita stanje, { product?, newsletter? } ga mijenja.
// Sve izmjene radi Edge Function email-prefs (usklađuje i Brevo); ovdje se samo prosljeđuje.
export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function forward(token: string, patch: { product?: boolean; newsletter?: boolean }) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Odjava je privremeno nedostupna." }, { status: 503 });
  const res = await fetch(`${url}/functions/v1/email-prefs`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ token, ...patch }),
    cache: "no-store",
  });
  if (res.status === 404 || res.status === 400) return NextResponse.json({ error: "Poveznica nije valjana ili je račun obrisan." }, { status: 404 });
  if (!res.ok) return NextResponse.json({ error: "Nešto je pošlo po zlu. Probaj ponovno." }, { status: 502 });
  return NextResponse.json(await res.json(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("t") ?? "";
  if (!UUID.test(token)) return NextResponse.json({ error: "Poveznica nije valjana." }, { status: 400 });

  const type = req.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) {
    // Odjava jednim klikom iz programa za e-poštu: tijelo je obrazac, ne JSON.
    return forward(token, { product: false });
  }
  let body: { product?: unknown; newsletter?: unknown } = {};
  try {
    body = await req.json();
  } catch { /* prazno tijelo = čitanje */ }
  const patch: { product?: boolean; newsletter?: boolean } = {};
  if (typeof body.product === "boolean") patch.product = body.product;
  if (body.newsletter === false) patch.newsletter = false; // uključuje se samo u aplikaciji, uz privolu
  return forward(token, patch);
}

// Neki programi otvore adresu iz zaglavlja u pregledniku: vodi na stranicu, ne odjavljuj bez klika.
export async function GET(req: Request) {
  const u = new URL(req.url);
  return NextResponse.redirect(new URL(`/odjava?t=${encodeURIComponent(u.searchParams.get("t") ?? "")}`, u.origin), 303);
}
