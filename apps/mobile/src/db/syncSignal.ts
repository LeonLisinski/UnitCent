/**
 * Veza između zapisivanja u bazu i sinkronizacije bez kružnog uvoza:
 * repo.ts samo javi da ima novih izmjena, a sync.ts se (ako je pokrenut) pretplati.
 */
let handler: (() => void) | null = null;

export function setSyncHandler(h: (() => void) | null): void {
  handler = h;
}

export function requestSync(): void {
  handler?.();
}
