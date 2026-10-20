import { occurrenceDate, yearMonthOf } from "@unitcent/core";
import { effectivePlan, kvGet, kvSet, listRecurring, listTransactionsInMonth, today } from "./db/repo";
import { supabase } from "./supabase";
import { syncNow } from "./sync";

export type AdvisorQuestion = "where" | "save" | "subs" | "month_end";
export interface AdvisorRow {
  label: string;
  cents: number;
  share: number;
}
export type AdvisorResult =
  | { status: "ok"; text: string; rows: AdvisorRow[]; charged: boolean; /** Free: preostala pitanja u mjesecu. */ remaining: number | null }
  | { status: "locked"; scope: "month" | "day" }
  /** Bez podataka za to pitanje (provjera u aplikaciji): poruka je već sročena, poslužitelj se ne zove. */
  | { status: "no_data"; text: string }
  | { status: "offline" } // nema veze
  | { status: "error" }; // poslužitelj nije odgovorio kako treba

const cache = new Map<AdvisorQuestion, { at: number; result: AdvisorResult }>();

/** Besplatna pitanja mjesečno (isto kao FREE_LIMIT na poslužitelju i u consume_advisor). */
export const FREE_AI_PER_MONTH = 3;
const usedKey = () => `advisor.used.${yearMonthOf(today())}`;

/**
 * Koliko je pitanja free korisnik postavio ovaj mjesec (svaki odgovoreni, i „priuštiti“). Brojanje u aplikaciji je
 * za trenutni odgovor sučelja; AI pitanja dodatno ograničava poslužitelj (ne može se zaobići).
 */
export function freeUsed(): number {
  return Number(kvGet(usedKey()) ?? "0") || 0;
}
export function markFreeUse(serverRemaining?: number | null): number {
  const local = freeUsed() + 1;
  const fromServer = serverRemaining == null ? 0 : FREE_AI_PER_MONTH - serverRemaining;
  const used = Math.min(FREE_AI_PER_MONTH, Math.max(local, fromServer));
  kvSet(usedKey(), String(used));
  return used;
}
export function markFreeExhausted(): void {
  kvSet(usedKey(), String(FREE_AI_PER_MONTH));
}

/**
 * Ima li smisla pitati poslužitelj: ista pravila praga kao na poslužitelju (answers.ts), ali odmah i bez mreže.
 * Vraća poruku kad podataka nema dovoljno, inače null.
 */
export function missingData(question: AdvisorQuestion): string | null {
  const day = today();
  const month = yearMonthOf(day);
  const expenses = listTransactionsInMonth(month).filter((t) => t.type === "expense" && t.source !== "recurring" && t.localDate <= day);
  if (question === "subs") {
    return listRecurring().some((r) => occurrenceDate(r, month) !== null) ? null : "Nemaš upisanih pretplata ni fiksnih troškova za ovaj mjesec.";
  }
  if (expenses.length === 0) return "Još nemam dovoljno podataka za to. Unesi nekoliko troškova pa me pitaj opet.";
  if (question === "save" && expenses.length < 5) return "Još imam premalo unosa da bih vidio gdje se može uštedjeti. Pitaj me kad ih bude barem pet.";
  if (question === "month_end") {
    const plan = effectivePlan(month);
    if (!plan || plan.incomeCents <= 0) return "Za to mi treba plan za ovaj mjesec. Upiši primanja u Profilu pa me pitaj opet.";
    if (Number(day.slice(8)) < 3) return "Mjesec je tek počeo. Pitaj me za koji dan, kad bude više unosa.";
  }
  return null;
}

/**
 * Pitanje savjetniku (Edge Function `advisor`). Prije pitanja se pošalju lokalni unosi, da odgovor uključi i
 * ono što je upravo upisano. Odgovor se pamti 10 minuta (isto pitanje ponovno ne troši ni kvotu na poslužitelju).
 */
export async function askAdvisor(question: AdvisorQuestion): Promise<AdvisorResult> {
  const missing = missingData(question);
  if (missing) return { status: "no_data", text: missing };
  const hit = cache.get(question);
  if (hit && Date.now() - hit.at < 600_000) return hit.result;
  if (!supabase) return { status: "error" };
  try {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) return { status: "error" };
    await Promise.race([syncNow(), new Promise((r) => setTimeout(r, 4000))]);
    const { data, error } = await supabase.functions.invoke("advisor", { body: { question } });
    // FunctionsFetchError = zahtjev nije stigao do poslužitelja (veza); ostalo je greška na poslužitelju.
    if (error) return { status: (error as { name?: string }).name === "FunctionsFetchError" ? "offline" : "error" };
    if (data?.status === "locked") return { status: "locked", scope: data.scope === "day" ? "day" : "month" };
    if (data?.status !== "ok" || typeof data.text !== "string") return { status: "error" };
    const result: AdvisorResult = { status: "ok", text: data.text, rows: Array.isArray(data.rows) ? data.rows : [], charged: !!data.charged, remaining: typeof data.remaining === "number" ? data.remaining : null };
    cache.set(question, { at: Date.now(), result: { ...result, charged: false } }); // iz keša: nije ponovno naplaćeno
    return result;
  } catch {
    return { status: "offline" };
  }
}
