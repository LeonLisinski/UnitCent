/**
 * ID-evi. Klijent generira UUID-ove (offline-first), a poslužitelj ih samo upsert-a.
 *  - uuidV7: vremenski poredan, za nove retke (dobar za indekse i sort).
 *  - uuidV5: deterministički iz imena, za knjiženja pretplata (isti dan + ista stavka = isti ID na svakom uređaju).
 * Bez ovisnosti o platformi: izvor slučajnosti se predaje izvana.
 */

const HEX = "0123456789abcdef";

function toHex(bytes: ArrayLike<number>): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i]!;
    s += HEX[(b >> 4) & 15]! + HEX[b & 15]!;
  }
  return s;
}

function format(b: Uint8Array): string {
  const h = toHex(b);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

/** UUID v7 (RFC 9562): 48 bita Unix milisekundi + slučajni dio. */
export function uuidV7(nowMs: number, randomBytes: (n: number) => Uint8Array): string {
  const r = randomBytes(10);
  if (r.length < 10) throw new RangeError("uuidV7: potrebno 10 slučajnih bajtova");
  const b = new Uint8Array(16);
  let t = Math.floor(nowMs);
  for (let i = 5; i >= 0; i--) {
    b[i] = t % 256;
    t = Math.floor(t / 256);
  }
  b.set(r.subarray(0, 10), 6);
  b[6] = (b[6]! & 0x0f) | 0x70; // verzija 7
  b[8] = (b[8]! & 0x3f) | 0x80; // varijanta
  return format(b);
}

/* ---------- SHA-1 (čista implementacija, samo za UUID v5) ---------- */

function sha1(data: Uint8Array): Uint8Array {
  const rotl = (x: number, n: number) => ((x << n) | (x >>> (32 - n))) >>> 0;
  const ml = data.length;
  const padded = new Uint8Array(((ml + 9 + 63) >> 6) << 6);
  padded.set(data);
  padded[ml] = 0x80;
  const bitLenHi = Math.floor((ml * 8) / 0x100000000);
  const bitLenLo = (ml * 8) >>> 0;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 8, bitLenHi);
  dv.setUint32(padded.length - 4, bitLenLo);

  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;
  const w = new Uint32Array(80);
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 80; i++) w[i] = rotl(w[i - 3]! ^ w[i - 8]! ^ w[i - 14]! ^ w[i - 16]!, 1);
    let a = h0, b = h1, c = h2, d = h3, e = h4;
    for (let i = 0; i < 80; i++) {
      let f: number, k: number;
      if (i < 20) { f = (b & c) | (~b & d); k = 0x5a827999; }
      else if (i < 40) { f = b ^ c ^ d; k = 0x6ed9eba1; }
      else if (i < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc; }
      else { f = b ^ c ^ d; k = 0xca62c1d6; }
      const tmp = (rotl(a, 5) + f + e + k + w[i]!) >>> 0;
      e = d; d = c; c = rotl(b, 30); b = a; a = tmp;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0;
  }
  const out = new Uint8Array(20);
  const odv = new DataView(out.buffer);
  [h0, h1, h2, h3, h4].forEach((h, i) => odv.setUint32(i * 4, h));
  return out;
}

function utf8(s: string): Uint8Array {
  const out: number[] = [];
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return new Uint8Array(out);
}

function parseUuid(u: string): Uint8Array {
  const h = u.replace(/-/g, "");
  if (!/^[0-9a-fA-F]{32}$/.test(h)) throw new RangeError(`Neispravan UUID: ${u}`);
  const b = new Uint8Array(16);
  for (let i = 0; i < 16; i++) b[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return b;
}

/** UUID v5 (RFC 9562): SHA-1 od (namespace + ime). */
export function uuidV5(name: string, namespace: string): string {
  const ns = parseUuid(namespace);
  const n = utf8(name);
  const buf = new Uint8Array(ns.length + n.length);
  buf.set(ns);
  buf.set(n, ns.length);
  const h = sha1(buf).slice(0, 16);
  h[6] = (h[6]! & 0x0f) | 0x50; // verzija 5
  h[8] = (h[8]! & 0x3f) | 0x80; // varijanta
  return format(h);
}

/** Imenski prostor za knjiženja UnitCent pretplata (nasumično odabran, nepromjenjiv). */
export const BOOKING_NAMESPACE = "6f1d4c7a-52b3-4e8e-9a0d-3c1f8b7a2e41";

/** Isti ID na svakom uređaju za istu stavku i isti dan: sprječava duplo knjiženje pri sinkronizaciji. */
export function bookingId(recurringId: string, localDate: string): string {
  return uuidV5(`booking:${recurringId}:${localDate}`, BOOKING_NAMESPACE);
}
