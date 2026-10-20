/** Ponovni dodir na već otvoreni tab: ekran tog taba se vraća na vrh (kao u sistemskim aplikacijama). */
const listeners = new Set<(route: string) => void>();

export function emitTabReselect(route: string): void {
  listeners.forEach((l) => l(route));
}

export function onTabReselect(listener: (route: string) => void): () => void {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/** Dodir na tab u traci (prelazak s drugog taba ili ponovni dodir). Ne javlja se kad se zatvori modal iznad taba. */
const enterListeners = new Set<(route: string) => void>();

export function emitTabEnter(route: string): void {
  enterListeners.forEach((l) => l(route));
}

export function onTabEnter(listener: (route: string) => void): () => void {
  enterListeners.add(listener);
  return () => void enterListeners.delete(listener);
}
