// Brevo (EU pružatelj e-pošte): transakcijski mailovi i popis za newsletter. Ključ je samo u Edge Function Secrets.
// BREVO_API_KEY, BREVO_NEWSLETTER_LIST_ID (broj popisa u Brevu), EMAIL_FROM (npr. "UnitCent <pozdrav@unitcent.com>").
const API = "https://api.brevo.com/v3";

function key(): string | null {
  return Deno.env.get("BREVO_API_KEY") ?? null;
}

async function call(path: string, init: RequestInit): Promise<Response | null> {
  const k = key();
  if (!k) return null;
  return await fetch(`${API}${path}`, {
    ...init,
    headers: { "api-key": k, "Content-Type": "application/json", Accept: "application/json", ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(15_000),
  });
}

export function brevoConfigured(): boolean {
  return !!key();
}

export function newsletterListId(): number | null {
  const n = Number(Deno.env.get("BREVO_NEWSLETTER_LIST_ID") ?? "");
  return Number.isInteger(n) && n > 0 ? n : null;
}

function sender(): { name: string; email: string } {
  const raw = Deno.env.get("EMAIL_FROM") ?? "UnitCent <pozdrav@unitcent.com>";
  const m = raw.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return m ? { name: m[1] || "UnitCent", email: m[2]! } : { name: "UnitCent", email: raw.trim() };
}

export interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Adresa za odjavu jednim klikom (RFC 8058); Gmail i Yahoo je traže za skupne pošiljatelje. */
  unsubscribeUrl: string;
  tag: string;
}

/** Šalje jedan mail. Vraća messageId ili null (greška se zapisuje u log funkcije, bez adrese primatelja). */
export async function sendEmail(a: SendArgs): Promise<string | null> {
  const res = await call("/smtp/email", {
    method: "POST",
    body: JSON.stringify({
      sender: sender(),
      to: [{ email: a.to }],
      subject: a.subject,
      htmlContent: a.html,
      textContent: a.text,
      tags: [a.tag],
      headers: {
        "List-Unsubscribe": `<${a.unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });
  if (!res) return null;
  if (!res.ok) {
    console.error("brevo send failed", res.status, (await res.text()).slice(0, 300));
    return null;
  }
  const data = (await res.json().catch(() => ({}))) as { messageId?: string };
  return data.messageId ?? "ok";
}

/** Dodaje ili miče kontakt s popisa za newsletter. Ne briše kontakt (to radi deleteContact). */
export async function setNewsletter(email: string, on: boolean): Promise<boolean> {
  const list = newsletterListId();
  if (!list) return false;
  const res = await call("/contacts", {
    method: "POST",
    body: JSON.stringify(
      on
        ? { email, listIds: [list], updateEnabled: true, emailBlacklisted: false }
        : { email, unlinkListIds: [list], updateEnabled: true },
    ),
  });
  if (!res) return false;
  if (!res.ok && res.status !== 204) {
    console.error("brevo contact failed", res.status, (await res.text()).slice(0, 300));
    return false;
  }
  return true;
}

/** Brisanje računa: kontakt se briše iz Brevoa (GDPR). Nepostojeći kontakt nije greška. */
export async function deleteContact(email: string): Promise<boolean> {
  const res = await call(`/contacts/${encodeURIComponent(email)}?identifierType=email_id`, { method: "DELETE" });
  if (!res) return false;
  return res.ok || res.status === 404;
}

/** Broj pretplatnika na popisu (za admin). */
export async function listStats(): Promise<{ subscribers: number; total: number } | null> {
  const list = newsletterListId();
  if (!list) return null;
  const res = await call(`/contacts/lists/${list}`, { method: "GET" });
  if (!res || !res.ok) return null;
  const d = (await res.json()) as { totalSubscribers?: number; uniqueSubscribers?: number; totalBlacklisted?: number };
  return { subscribers: d.uniqueSubscribers ?? d.totalSubscribers ?? 0, total: (d.uniqueSubscribers ?? 0) + (d.totalBlacklisted ?? 0) };
}
