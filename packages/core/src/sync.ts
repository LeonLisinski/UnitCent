/**
 * Pravila sinkronizacije (docs/APP-PLAN.md §4.4). Čista logika, bez mreže i baze:
 * koristi se u aplikaciji, a ista pravila provode poslužiteljska funkcija `sync_push`.
 */

export interface SyncStamp {
  /** Vrijeme izmjene na uređaju (ISO 8601, UTC). Služi za rješavanje sukoba. */
  clientUpdatedAt: string;
  /** Brojač izmjena zapisa (prekida neriješen rezultat). */
  rev: number;
}

/**
 * Pobjeđuje zadnja izmjena po vremenu uređaja, pa veći `rev`. Jednako = lokalno ostaje (nema pisanja).
 * Poslužiteljski `updated_at` namjerno ne sudjeluje: služi samo kao kursor povlačenja.
 */
export function remoteWins(local: SyncStamp | null, remote: SyncStamp): boolean {
  if (!local) return true;
  const l = Date.parse(local.clientUpdatedAt);
  const r = Date.parse(remote.clientUpdatedAt);
  if (r !== l) return r > l;
  return remote.rev > local.rev;
}

/** Zaštita od pogrešnog sata: vrijeme izmjene ne smije biti dalje u budućnosti od `maxFutureMs`. */
export function clampClientTime(clientIso: string, nowMs: number, maxFutureMs = 5 * 60 * 1000): string {
  const t = Date.parse(clientIso);
  if (Number.isNaN(t)) return new Date(nowMs).toISOString();
  return new Date(Math.min(t, nowMs + maxFutureMs)).toISOString();
}

export interface Cursor {
  updatedAt: string; // poslužiteljski updated_at (ISO)
  id: string;
}

/**
 * Povlačenje kreće od kursora umanjenog za preklop (zadano 5 s): transakcije koje se potvrde
 * istodobno mogu postati vidljive obrnutim redom, a bez preklopa bi se redak trajno preskočio.
 * Duplikati iz preklopa su bezopasni jer je primjena idempotentna.
 */
export function overlapCursor(c: Cursor | null, seconds = 5): Cursor | null {
  if (!c) return null;
  // Postgres vraća mikrosekunde ("…:00.123456+00:00"); za preklop od sekundi dovoljne su milisekunde.
  const t = Date.parse(c.updatedAt.replace(/(\.\d{3})\d+/, "$1"));
  if (Number.isNaN(t)) return null;
  return { updatedAt: new Date(t - seconds * 1000).toISOString(), id: "00000000-0000-0000-0000-000000000000" };
}

/** PostgREST `or` filter za keyset stranicu nakon kursora: (updated_at, id) > (cursor). */
export function keysetFilter(c: Cursor): string {
  return `updated_at.gt.${c.updatedAt},and(updated_at.eq.${c.updatedAt},id.gt.${c.id})`;
}

export interface OutboxRow {
  seq: number;
  table: string;
  op: "upsert" | "delete";
}

/**
 * Grupira uzastopne zapise iste tablice i operacije u skupine (≤ max). Redoslijed izvršavanja
 * ostaje onaj iz outboxa, pa roditelji (npr. kategorije) uvijek stignu prije djece (transakcije).
 */
export function batchOutbox<T extends OutboxRow>(rows: readonly T[], max = 100): T[][] {
  const out: T[][] = [];
  for (const r of rows) {
    const last = out[out.length - 1];
    const first = last?.[0];
    if (last && first && first.table === r.table && first.op === r.op && last.length < max) last.push(r);
    else out.push([r]);
  }
  return out;
}

/** Eksponencijalno čekanje između pokušaja (s), s gornjom granicom 15 min. */
export function backoffSeconds(attempts: number): number {
  return Math.min(15 * 60, 2 ** Math.min(attempts, 10));
}
