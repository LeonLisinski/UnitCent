import * as ImageManipulator from "expo-image-manipulator";
import type { Cents, LocalDate } from "@unitcent/core";
import { supabase } from "./supabase";

/** Odgovor funkcije `scan-receipt` (supabase/functions/scan-receipt). */
export interface ScanItem {
  raw_name: string;
  name: string;
  amount_cents: number;
  category_id: string | null;
  line_type: "item" | "discount" | "deposit";
  confidence: number;
}

export interface ScanResult {
  status: "ok" | "review" | "unreadable";
  merchant: string | null;
  date: LocalDate | null;
  total_cents: Cents | null;
  sum_cents: Cents;
  items: ScanItem[];
  reasons: string[];
  usage: { used: number; limit: number; premium: boolean };
}

export type ScanError = "quota" | "no-session" | "network" | "failed";

export class ScanFailure extends Error {
  constructor(public kind: ScanError, public limit?: number) {
    super(kind);
  }
}

/* ---------- QR fiskalnog računa ---------- */

export interface FiscalQr {
  totalCents: Cents | null;
  date: LocalDate | null;
}

/**
 * Čita fiskalni QR (adresa Porezne uprave s parametrima `izn` i `datv`). Format treba potvrditi na stvarnim
 * računima (docs/APP-PLAN.md §5): zato je razbor tolerantan, a krivi iznos poslužitelj samo označi kao „provjeri“.
 * `izn` bez razdjelnika čitamo kao cente, a s točkom ili zarezom kao eure.
 */
export function parseFiscalQr(data: string): FiscalQr | null {
  if (!/porezna-uprava|[?&]izn=/i.test(data)) return null;
  const q = data.split("?")[1] ?? "";
  const get = (k: string) => new RegExp(`(?:^|&)${k}=([^&]*)`, "i").exec(q)?.[1];
  const izn = get("izn");
  const datv = get("datv");
  let totalCents: Cents | null = null;
  if (izn) {
    const v = decodeURIComponent(izn).trim();
    if (/[.,]/.test(v)) {
      const n = Number(v.replace(",", "."));
      totalCents = Number.isFinite(n) ? Math.round(n * 100) : null;
    } else if (/^\d+$/.test(v)) {
      totalCents = Number(v);
    }
  }
  const date = datv && /^\d{8}/.test(datv) ? `${datv.slice(0, 4)}-${datv.slice(4, 6)}-${datv.slice(6, 8)}` : null;
  if (totalCents === null && date === null) return null;
  return { totalCents: totalCents !== null && totalCents > 0 ? totalCents : null, date };
}

/* ---------- slika i poziv ---------- */

/** Smanjuje sliku na ~1600 px i JPEG 0,7: brži prijenos i jeftinije čitanje, a tekst ostaje čitljiv. */
export async function prepareImage(uri: string): Promise<string> {
  const ctx = ImageManipulator.ImageManipulator.manipulate(uri);
  ctx.resize({ width: 1600 });
  const ref = await ctx.renderAsync();
  const out = await ref.saveAsync({ format: ImageManipulator.SaveFormat.JPEG, compress: 0.7, base64: true });
  if (!out.base64) throw new ScanFailure("failed");
  return out.base64;
}

/** `images`: jedan ili više dijelova istog računa (do 4), od vrha prema dnu; broji se kao JEDNO skeniranje. */
export async function scanReceipt(images: string[], qrTotalCents?: Cents | null): Promise<ScanResult> {
  if (!supabase) throw new ScanFailure("no-session");
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) throw new ScanFailure("no-session");

  const { data, error } = await supabase.functions.invoke("scan-receipt", {
    body: { images: images.map((data) => ({ data, mime: "image/jpeg" })), ...(qrTotalCents ? { qr_total_cents: qrTotalCents } : {}) },
  });
  if (error) {
    const res = (error as { context?: Response }).context;
    if (res && typeof res.json === "function") {
      const body = (await res.json().catch(() => null)) as { error?: string; limit?: number } | null;
      if (body?.error === "quota_exceeded") throw new ScanFailure("quota", body.limit);
      throw new ScanFailure("failed");
    }
    throw new ScanFailure("network");
  }
  return data as ScanResult;
}

/* ---------- predaja rezultata ekranu „Pregledaj“ ---------- */

let last: { result: ScanResult; qr: FiscalQr | null } | null = null;
export const setLastScan = (result: ScanResult, qr: FiscalQr | null): void => {
  last = { result, qr };
};
export const getLastScan = () => last;
export const clearLastScan = (): void => {
  last = null;
};

export const MAX_PARTS = 4;
