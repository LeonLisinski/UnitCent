import { useMemo } from "react";
import { useDbVersion } from "./db/events";

/** Čita iz lokalne baze i ponovno računa kad se baza promijeni (vidi db/events.ts). */
export function useDb<T>(read: () => T, deps: readonly unknown[] = []): T {
  const v = useDbVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(read, [v, ...deps]);
}
