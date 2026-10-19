import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export interface InsightItem {
  id: string;
  locked: boolean;
  tone: "info" | "good" | "warn";
  icon: string;
  title: string | null;
  body: string | null;
}
export type InsightsState = { status: "loading" } | { status: "off" } | { status: "empty" } | { status: "ok"; items: InsightItem[] };

const cache = new Map<string, { at: number; state: InsightsState }>();

/** AI uvidi za mjesec (Edge Function `insights`); traže prijavu i sinkronizirane podatke. Keš u memoriji 10 min. */
export function useInsights(month: string, enabled: boolean): InsightsState {
  const [state, setState] = useState<InsightsState>(() => cache.get(month)?.state ?? { status: "loading" });
  useEffect(() => {
    let alive = true;
    if (!enabled || !supabase) {
      setState({ status: "off" });
      return;
    }
    const hit = cache.get(month);
    if (hit && Date.now() - hit.at < 600_000) {
      setState(hit.state);
      return;
    }
    setState({ status: "loading" });
    (async () => {
      try {
        const { data: s } = await supabase!.auth.getSession();
        if (!s.session) throw new Error("no-session");
        const { data, error } = await supabase!.functions.invoke("insights", { body: { month } });
        if (error) throw error;
        const next: InsightsState = data?.status === "ok" && data.items?.length ? { status: "ok", items: data.items } : { status: "empty" };
        cache.set(month, { at: Date.now(), state: next });
        if (alive) setState(next);
      } catch {
        if (alive) setState({ status: "off" });
      }
    })();
    return () => {
      alive = false;
    };
  }, [month, enabled]);
  return state;
}
