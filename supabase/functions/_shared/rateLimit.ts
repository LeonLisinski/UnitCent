// Ograničenje broja poziva po korisniku (tablica rate_limits, funkcija rate_hit u bazi).
// Ako baza ne odgovori, poziv se propušta: ograničenje ne smije srušiti aplikaciju (kvote za AI i dalje vrijede).
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

/** Granice po funkciji: [najviše poziva, prozor u sekundama]. */
export const LIMITS = {
  "scan-receipt": [20, 600],
  advisor: [30, 600],
  insights: [20, 600],
  "classify-recurring": [30, 3600],
  "email-prefs": [30, 600],
  "delete-account": [5, 3600],
  "dev-premium": [20, 3600],
  "admin-stats": [60, 600],
} as const satisfies Record<string, readonly [number, number]>;

export async function allow(admin: SupabaseClient, fn: keyof typeof LIMITS, id: string): Promise<boolean> {
  const [limit, windowSec] = LIMITS[fn];
  const { data, error } = await admin.rpc("rate_hit", { p_bucket: `${fn}:${id}`, p_limit: limit, p_window_seconds: windowSec });
  if (error) {
    console.error("rate_hit failed", error.message);
    return true;
  }
  return data === true;
}

/** Odgovor 429 s istim CORS zaglavljima kao funkcija. */
export function tooMany(headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ error: "rate_limited" }), {
    status: 429,
    headers: { ...headers, "Content-Type": "application/json", "Retry-After": "60" },
  });
}
