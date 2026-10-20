import { kvGet, kvSet } from "./db/repo";
import { supabase } from "./supabase";

/** Izbor za e-mailove. Izvor istine je poslužitelj (funkcija email-prefs, usklađuje i Brevo); lokalno se pamti zadnje stanje za brz prikaz. */
export interface EmailPrefs {
  /** Dobrodošlica, savjet za prvi tjedan, tjedni sažetak, mjesečni pregled. Zadano uključeno, odjava jednim klikom. */
  product: boolean;
  /** Newsletter: zaseban, neoznačen izbor (GDPR). */
  newsletter: boolean;
}

const KEY = "email_prefs";
const DEFAULT: EmailPrefs = { product: true, newsletter: false };

export function cachedEmailPrefs(): EmailPrefs {
  try {
    const raw = kvGet(KEY);
    return raw ? { ...DEFAULT, ...(JSON.parse(raw) as Partial<EmailPrefs>) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

/** Čita (bez `patch`) ili mijenja izbor. Vraća novo stanje ili null kad nema veze / poslužitelj odbije. */
export async function syncEmailPrefs(patch: Partial<EmailPrefs> = {}): Promise<EmailPrefs | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.functions.invoke("email-prefs", { body: patch });
    if (error || !data || typeof data.product !== "boolean") return null;
    const next: EmailPrefs = { product: data.product, newsletter: !!data.newsletter };
    kvSet(KEY, JSON.stringify(next));
    return next;
  } catch {
    return null;
  }
}
