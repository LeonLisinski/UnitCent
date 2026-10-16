import { useSyncExternalStore } from "react";

/**
 * Najjednostavniji "živi upiti": svaki zapis u bazu poziva notify(), a zaslonski hookovi
 * ponovno čitaju podatke kad se verzija promijeni. Baza je lokalna pa je čitanje trenutno.
 */
let version = 0;
const listeners = new Set<() => void>();

export function notifyDbChanged(): void {
  version += 1;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useDbVersion(): number {
  return useSyncExternalStore(subscribe, () => version, () => version);
}
