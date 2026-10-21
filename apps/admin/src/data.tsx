import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { MOCK, mockStats } from "./mock";
import { fetchStats, type Stats, type StatsResult } from "./stats";

interface Ctx {
  result: StatsResult | null;
  stats: Stats | null;
  refreshing: boolean;
  refresh: () => void;
}

const StatsCtx = createContext<Ctx>({ result: null, stats: null, refreshing: false, refresh: () => {} });

/** Jedno učitavanje za sve tabove; povlačenje prema dolje na bilo kojem tabu osvježava sve. */
export function StatsProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<StatsResult | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const refresh = useCallback(() => {
    setRefreshing(true);
    const load = MOCK ? Promise.resolve<StatsResult>({ ok: true, stats: mockStats() }) : fetchStats();
    void load.then((r) => {
      setResult(r);
      setRefreshing(false);
    });
  }, []);
  useEffect(refresh, [refresh]);
  return <StatsCtx.Provider value={{ result, stats: result?.ok ? result.stats : null, refreshing, refresh }}>{children}</StatsCtx.Provider>;
}

export const useStats = () => useContext(StatsCtx);
