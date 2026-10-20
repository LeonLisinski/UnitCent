import "react-native-url-polyfill/auto";
import { useEffect, useState } from "react";
import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { secureStorage } from "./secureStorage";

WebBrowser.maybeCompleteAuthSession();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** Isti projekt kao aplikacija; samo javni ključ. Podatke daje isključivo funkcija admin-stats. */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: { storage: secureStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
      })
    : null;

export function useSession(): { session: Session | null; ready: boolean } {
  const [state, setState] = useState<{ session: Session | null; ready: boolean }>({ session: null, ready: !supabase });
  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setState({ session: data.session, ready: true }));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setState({ session, ready: true }));
    return () => data.subscription.unsubscribe();
  }, []);
  return state;
}

/** Prijava Googleom (isti račun kao u aplikaciji). Adresa unitcent-admin://auth-callback mora biti u Supabase Redirect URLs. */
export async function signInWithGoogle(): Promise<"ok" | "cancelled" | "error"> {
  if (!supabase) return "error";
  const redirectTo = Linking.createURL("auth-callback");
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo, skipBrowserRedirect: true } });
  if (error || !data?.url) return "error";
  const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (res.type !== "success") return "cancelled";
  const [path, hash = ""] = res.url.split("#");
  const params = new URLSearchParams(hash);
  new URLSearchParams((path ?? "").split("?")[1] ?? "").forEach((v, k) => !params.has(k) && params.set(k, v));
  const access = params.get("access_token");
  const refresh = params.get("refresh_token");
  if (access && refresh) {
    const { error: e } = await supabase.auth.setSession({ access_token: access, refresh_token: refresh });
    return e ? "error" : "ok";
  }
  const code = params.get("code");
  if (code) {
    const { error: e } = await supabase.auth.exchangeCodeForSession(code);
    return e ? "error" : "ok";
  }
  return "error";
}
