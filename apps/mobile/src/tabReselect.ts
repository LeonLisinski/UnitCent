/** Ponovni dodir na već otvoreni tab: ekran tog taba se vraća na vrh (kao u sistemskim aplikacijama). */
const listeners = new Set<(route: string) => void>();

export function emitTabReselect(route: string): void {
  listeners.forEach((l) => l(route));
}

export function onTabReselect(listener: (route: string) => void): () => void {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}
