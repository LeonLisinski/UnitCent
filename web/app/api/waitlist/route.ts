import { NextResponse } from "next/server";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  let body: { email?: string; consent?: boolean; source?: string; website?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neispravan zahtjev." }, { status: 400 });
  }

  // Honeypot: botovi ispune skriveno polje, ljudi ne.
  if (body.website) return NextResponse.json({ ok: true });

  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Upiši ispravnu e-adresu." }, { status: 400 });
  }
  if (body.consent !== true) {
    return NextResponse.json({ error: "Potrebna je privola da ti se javimo." }, { status: 400 });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Prijave su privremeno nedostupne. Probaj ponovno uskoro." }, { status: 503 });
  }

  const res = await fetch(`${url}/rest/v1/waitlist?on_conflict=email`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=ignore-duplicates,return=minimal",
    },
    body: JSON.stringify({
      email,
      consent_at: new Date().toISOString(),
      source: (body.source ?? "").slice(0, 60) || null,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Nešto je pošlo po zlu. Probaj ponovno." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
