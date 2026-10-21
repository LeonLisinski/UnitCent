// classify-recurring: AI prijedlog kategorije i ikone za naziv pretplate koji lokalni katalog ne prepoznaje (Premium).
// Šalje se samo naziv (najviše 40 znakova) i nazivi korisnikovih kategorija; ništa se ne sprema.
import { createClient } from "npm:@supabase/supabase-js@2";
import { allow, tooMany } from "../_shared/rateLimit.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Mora odgovarati ikonama u aplikaciji (apps/mobile/src/icons.tsx).
const ICONS = ["house", "card", "drop", "bolt", "phone", "wifi", "play", "music", "cloud", "shield", "dumbbell", "heart", "car", "fuel", "gift", "cart", "cup", "glass", "repeat", "file", "user"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const asUser = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: u, error: authErr } = await asUser.auth.getUser();
  if (authErr || !u.user) return json({ error: "unauthorized" }, 401);

  // Premium provjerava poslužitelj (CLAUDE.md: ograničenja se ne provode samo u aplikaciji).
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  if (!(await allow(admin, "classify-recurring", u.user.id))) return tooMany(cors);
  const { data: ent } = await admin.from("entitlements").select("premium_until").eq("user_id", u.user.id).maybeSingle();
  if (!ent?.premium_until || Date.parse(ent.premium_until) <= Date.now()) return json({ error: "premium_required" }, 402);

  let name = "";
  let categories: { id: string; name: string }[] = [];
  try {
    const body = await req.json();
    name = String(body?.name ?? "").trim().slice(0, 40);
    categories = (Array.isArray(body?.categories) ? body.categories : [])
      .slice(0, 40)
      .filter((c: unknown): c is { id: string; name: string } => typeof (c as { id?: unknown })?.id === "string" && typeof (c as { name?: unknown })?.name === "string")
      .map((c: { id: string; name: string }) => ({ id: c.id.slice(0, 40), name: c.name.slice(0, 30) }));
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  if (name.length < 2 || categories.length === 0) return json({ error: "bad_request" }, 400);

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return json({ error: "unavailable" }, 503);
  const model = Deno.env.get("CLASSIFY_MODEL") ?? Deno.env.get("SCAN_MODEL") ?? "gemini-3.1-flash-lite";
  const prompt = `Korisnik u Hrvatskoj upisuje mjesečnu pretplatu ili fiksni trošak: "${name.replace(/"/g, "'")}".
Odaberi najprikladniju kategoriju (po "id") i jednu ikonu s popisa. Ako nijedna kategorija ne odgovara, uzmi onu koja se zove "Ostalo".
Kategorije: ${JSON.stringify(categories)}
Ikone: ${JSON.stringify(ICONS)}
Vrati samo JSON: {"categoryId": "...", "icon": "..."}`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return json({ error: "unavailable" }, 503);
    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    const parsed = JSON.parse(text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")) as { categoryId?: unknown; icon?: unknown };
    // Samo vrijednosti s ponuđenih popisa; sve ostalo se odbacuje.
    const categoryId = categories.some((c) => c.id === parsed.categoryId) ? (parsed.categoryId as string) : null;
    const icon = typeof parsed.icon === "string" && ICONS.includes(parsed.icon) ? parsed.icon : null;
    return json({ categoryId, icon });
  } catch (e) {
    console.error("classify failed", e instanceof Error ? e.message : String(e));
    return json({ error: "unavailable" }, 503);
  }
});
