import { supabase } from "./supabase";

/**
 * AI prijedlog kategorije i ikone za naziv koji lokalni katalog ne prepoznaje (Premium, Edge Function
 * `classify-recurring`). Šalje se samo naziv i nazivi kategorija. Bez veze, sesije ili Premiuma vraća null (tiho).
 */
const cache = new Map<string, { categoryId: string | null; icon: string | null } | null>();

export async function classifyRecurring(
  name: string,
  categories: { id: string; name: string }[],
): Promise<{ categoryId: string | null; icon: string | null } | null> {
  const key = name.trim().toLowerCase();
  if (!supabase || key.length < 3) return null;
  if (cache.has(key)) return cache.get(key)!;
  try {
    const { data, error } = await supabase.functions.invoke("classify-recurring", { body: { name: name.trim(), categories } });
    const out = error || !data ? null : { categoryId: (data.categoryId as string | null) ?? null, icon: (data.icon as string | null) ?? null };
    cache.set(key, out);
    return out;
  } catch {
    return null;
  }
}
