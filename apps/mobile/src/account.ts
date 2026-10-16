import { useEffect, useState } from "react";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { resetSyncState, syncNow } from "./sync";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

export interface Account {
  /** Davatelj prijave ("google" | "apple"), ako je prijavljen. */
  provider: string | null;
  /** Ima sesiju (anonimnu ili prijavljenu). */
  hasSession: boolean;
  /** Anonimni račun: podaci su u oblaku, ali se bez prijave ne mogu vratiti na drugom uređaju. */
  anonymous: boolean;
  email: string | null;
}

const NONE: Account = { hasSession: false, anonymous: false, email: null, provider: null };

function toAccount(
  user: { is_anonymous?: boolean; email?: string; app_metadata?: { provider?: string }; identities?: { provider: string }[] } | null | undefined,
): Account {
  if (!user) return NONE;
  const provider = user.identities?.find((i) => i.provider !== "anonymous")?.provider ?? null;
  return { hasSession: true, anonymous: !!user.is_anonymous, email: user.email ?? null, provider };
}

export function useAccount(): Account {
  const [account, setAccount] = useState<Account>(NONE);
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    void supabase.auth.getSession().then(({ data }) => alive && setAccount(toAccount(data.session?.user)));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setAccount(toAccount(session?.user)));
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return account;
}

export type Provider = "google" | "apple";

export type SignInResult = "linked" | "signed-in" | "cancelled" | "error";

/** Čita tokene ili kod iz adrese na koju nas je vratila prijava (fragment ili upit). */
function readAuthParams(url: string): URLSearchParams {
  const params = new URLSearchParams(url.split("#")[1] ?? "");
  const query = new URLSearchParams((url.split("#")[0] ?? "").split("?")[1] ?? "");
  query.forEach((v, k) => {
    if (!params.has(k)) params.set(k, v);
  });
  return params;
}

async function browse(authUrl: string, redirectTo: string): Promise<{ ok: true } | { ok: false; cancelled: boolean; alreadyLinked: boolean }> {
  const res = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo);
  if (res.type !== "success") return { ok: false, cancelled: true, alreadyLinked: false };
  const p = readAuthParams(res.url);
  const err = `${p.get("error_code") ?? ""} ${p.get("error_description") ?? ""}`.toLowerCase();
  if (p.get("error") || p.get("error_code")) {
    return { ok: false, cancelled: false, alreadyLinked: err.includes("already") || err.includes("identity_already_exists") };
  }
  const access = p.get("access_token");
  const refresh = p.get("refresh_token");
  if (access && refresh) {
    const { error } = await supabase!.auth.setSession({ access_token: access, refresh_token: refresh });
    return error ? { ok: false, cancelled: false, alreadyLinked: false } : { ok: true };
  }
  const code = p.get("code");
  if (code) {
    const { error } = await supabase!.auth.exchangeCodeForSession(code);
    return error ? { ok: false, cancelled: false, alreadyLinked: false } : { ok: true };
  }
  return { ok: false, cancelled: false, alreadyLinked: false };
}

/**
 * Prijava Googleom ili Appleom. Anonimni račun se povezuje (isti korisnik, podaci ostaju). Ako je taj račun davatelja
 * već povezan s drugim korisnikom (npr. novi mobitel), prijavljujemo se u taj račun, a lokalni podaci
 * se dodaju njemu pri sljedećoj sinkronizaciji.
 */
export async function signInWith(provider: Provider): Promise<SignInResult> {
  if (!supabase) return "error";
  const redirectTo = Linking.createURL("auth-callback");
  if (__DEV__) console.log("[auth] redirectTo =", redirectTo); // mora odgovarati Redirect URLs u Supabaseu
  try {
    const { data: s } = await supabase.auth.getSession();
    const before = s.session?.user.id ?? null;

    if (s.session?.user.is_anonymous) {
      const { data, error } = await supabase.auth.linkIdentity({
        provider,
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (!error && data?.url) {
        const r = await browse(data.url, redirectTo);
        if (r.ok) {
          void syncNow();
          return "linked";
        }
        if (r.cancelled) return "cancelled";
        if (!r.alreadyLinked) return "error";
      } else if (error && !/already|exists/i.test(error.message)) {
        return "error";
      }
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data?.url) return "error";
    const r = await browse(data.url, redirectTo);
    if (!r.ok) return r.cancelled ? "cancelled" : "error";
    const { data: after } = await supabase.auth.getSession();
    if (after.session?.user.id !== before) resetSyncState();
    void syncNow();
    return "signed-in";
  } catch {
    return "error";
  }
}
