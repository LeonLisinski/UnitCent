import "react-native-url-polyfill/auto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { secureStorage } from "./secureStorage";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** Klijent je null ako okruženje nije podešeno: aplikacija tada radi potpuno lokalno. */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          storage: secureStorage, // šifrirano (Keychain / Keystore), vidi src/secureStorage.ts
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

/**
 * Anonimna sesija od prvog pokretanja (docs/APP-PLAN.md §4.7). Ne blokira UI i tiho se
 * preskače bez mreže: aplikacija je lokalna, sesija služi sinkronizaciji, kvoti i kupnjama.
 */
export async function ensureAnonymousSession(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session) return data.session.user.id;
    const { data: signed, error } = await supabase.auth.signInAnonymously();
    if (error) return null;
    return signed.user?.id ?? null;
  } catch {
    return null; // bez mreže: pokušat će se kod sljedećeg pokretanja
  }
}
