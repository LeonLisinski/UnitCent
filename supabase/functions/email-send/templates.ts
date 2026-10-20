// Predlošci e-mailova: jedan raspored u dizajn sustavu (svijetli zadano, tamni preko prefers-color-scheme),
// ton „na ti“, broj je junak. Čisti TypeScript (bez Deno API-ja), testira se u packages/core.
// Boje prate packages/tokens (svijetla i tamna tema); mailovi ne mogu učitati CSS varijable, pa su ovdje doslovno.
import { eur } from "../insights/facts.ts";
import { monthName, type MonthSummary, type WeekSummary } from "./digest.ts";

export const SITE = "https://unitcent.com";

const C = {
  light: { bg: "#f5f3ee", surface: "#ffffff", border: "#dedad0", ink: "#0c1714", muted: "#535e59", brand: "#07775a", onBrand: "#ffffff", track: "#ece9e1", warning: "#9a5806", danger: "#b42318" },
  dark: { bg: "#070b0b", surface: "#0f1515", border: "#243030", ink: "#f2f4f1", muted: "#a3b0ab", brand: "#3dd6a3", onBrand: "#04241a", track: "#182120", warning: "#f5a524", danger: "#f97066" },
};

export interface EmailParts {
  subject: string;
  html: string;
  text: string;
}

interface Block {
  /** Mala oznaka iznad broja (mono, velika slova). */
  label?: string;
  /** Glavni broj (najveći element). */
  hero?: string;
  /** Jedna crta ispod broja. */
  heroSub?: string;
  /** Traka napretka 0..1 (preko 1 = preko plana, prikaz upozorenja). */
  progress?: number;
  /** Najviše tri pomoćna podatka. */
  stats?: { label: string; value: string }[];
  paragraphs: string[];
  cta?: { label: string; url: string };
}

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Hrvatska množina: 1 dan, 2 do 4 dana, 5+ dana (11 do 14 su „mnogo“). */
export function plural(n: number, one: string, few: string, many: string): string {
  const d = n % 10;
  const dd = n % 100;
  if (d === 1 && dd !== 11) return one;
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return few;
  return many;
}

/** „13. – 19. 10.“ ili „27. 10. – 2. 11.“ */
export function dateRange(start: string, end: string): string {
  const day = (s: string) => `${Number(s.slice(8, 10))}.`;
  const mon = (s: string) => `${Number(s.slice(5, 7))}.`;
  return start.slice(5, 7) === end.slice(5, 7) ? `${day(start)} – ${day(end)} ${mon(end)}` : `${day(start)} ${mon(start)} – ${day(end)} ${mon(end)}`;
}

function layout(preheader: string, b: Block, unsubscribeUrl: string, reason: string): string {
  const L = C.light;
  const D = C.dark;
  const font = "Manrope, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  const mono = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  const over = (b.progress ?? 0) > 1;
  const pct = Math.round(Math.min(1, Math.max(0, b.progress ?? 0)) * 100);

  const hero = b.hero
    ? `<tr><td style="padding:8px 32px 0;">
        ${b.label ? `<div class="muted" style="font-family:${mono};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${L.muted};">${esc(b.label)}</div>` : ""}
        <div class="ink" style="font-family:${font};font-size:44px;line-height:1.1;font-weight:800;letter-spacing:-0.02em;color:${L.ink};font-variant-numeric:tabular-nums;padding-top:6px;">${esc(b.hero)}</div>
        ${b.heroSub ? `<div class="muted" style="font-family:${font};font-size:15px;color:${L.muted};padding-top:4px;">${esc(b.heroSub)}</div>` : ""}
      </td></tr>`
    : b.label
      ? `<tr><td style="padding:8px 32px 0;"><div class="muted" style="font-family:${mono};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${L.muted};">${esc(b.label)}</div></td></tr>`
      : "";

  const bar =
    b.progress !== undefined
      ? `<tr><td style="padding:16px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;"><tr>
          ${pct > 0 ? `<td class="${over ? "warn-bg" : "brand-bg"}" width="${pct}%" style="height:8px;line-height:8px;font-size:0;border-radius:4px;background:${over ? L.warning : L.brand};">&nbsp;</td>` : ""}
          ${pct < 100 ? `<td class="track-bg" style="height:8px;line-height:8px;font-size:0;border-radius:4px;background:${L.track};">&nbsp;</td>` : ""}
        </tr></table>
      </td></tr>`
      : "";

  const stats =
    b.stats && b.stats.length > 0
      ? `<tr><td style="padding:20px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${b.stats
            .slice(0, 3)
            .map(
              (s) => `<tr>
              <td class="muted line" style="font-family:${font};font-size:14px;color:${L.muted};padding:10px 0;border-top:1px solid ${L.border};">${esc(s.label)}</td>
              <td class="ink line" align="right" style="font-family:${font};font-size:15px;font-weight:700;color:${L.ink};padding:10px 0;border-top:1px solid ${L.border};font-variant-numeric:tabular-nums;">${esc(s.value)}</td>
            </tr>`,
            )
            .join("")}
        </table>
      </td></tr>`
      : "";

  const paras = b.paragraphs
    .map((p) => `<p class="ink" style="margin:0 0 14px;font-family:${font};font-size:16px;line-height:1.55;color:${L.ink};">${p}</p>`)
    .join("");

  const cta = b.cta
    ? `<tr><td align="center" style="padding:8px 32px 8px;">
        <a class="btn" href="${esc(b.cta.url)}" style="display:inline-block;font-family:${font};font-size:16px;font-weight:700;color:${L.onBrand};background:${L.brand};text-decoration:none;padding:14px 28px;border-radius:999px;">${esc(b.cta.label)}</a>
      </td></tr>`
    : "";

  return `<!doctype html>
<html lang="hr" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>UnitCent</title>
<style>
  @media (prefers-color-scheme: dark) {
    .page { background:${D.bg} !important; }
    .card { background:${D.surface} !important; border-color:${D.border} !important; }
    .ink { color:${D.ink} !important; }
    .muted { color:${D.muted} !important; }
    .line { border-color:${D.border} !important; }
    .brand-bg { background:${D.brand} !important; }
    .warn-bg { background:${D.warning} !important; }
    .track-bg { background:${D.track} !important; }
    .btn { background:${D.brand} !important; color:${D.onBrand} !important; }
    a.link { color:${D.brand} !important; }
  }
  @media (max-width: 520px) { .pad { padding-left:20px !important; padding-right:20px !important; } }
</style>
</head>
<body class="page" style="margin:0;padding:0;background:${L.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}</div>
<table role="presentation" class="page" width="100%" cellpadding="0" cellspacing="0" style="background:${L.bg};">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
    <tr><td style="padding:0 8px 16px;">
      <a href="${SITE}" style="text-decoration:none;"><img src="${SITE}/brand/png/ikona-aplikacije-1024.png" width="32" height="32" alt="UnitCent" style="display:inline-block;vertical-align:middle;border-radius:8px;border:0;"><span class="ink" style="font-family:${font};font-size:17px;font-weight:800;color:${L.ink};vertical-align:middle;padding-left:10px;">UnitCent</span></a>
    </td></tr>
    <tr><td class="card" style="background:${L.surface};border:1px solid ${L.border};border-radius:24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="height:16px;line-height:16px;font-size:0;">&nbsp;</td></tr>
        ${hero}${bar}${stats}
        <tr><td class="pad" style="padding:24px 32px 8px;">${paras}</td></tr>
        ${cta}
        <tr><td style="height:24px;line-height:24px;font-size:0;">&nbsp;</td></tr>
      </table>
    </td></tr>
    <tr><td class="muted" style="padding:20px 16px 8px;font-family:${font};font-size:12px;line-height:1.5;color:${L.muted};text-align:center;">
      ${esc(reason)} <a class="link muted" href="${esc(unsubscribeUrl)}" style="color:${L.muted};text-decoration:underline;">Odjavi se jednim klikom</a>.<br>
      UnitCent · Hrvatska · <a class="link muted" href="${SITE}/privatnost" style="color:${L.muted};text-decoration:underline;">Privatnost</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

function plain(b: Block, unsubscribeUrl: string, reason: string): string {
  const lines: string[] = [];
  if (b.label) lines.push(b.label.toUpperCase());
  if (b.hero) lines.push(b.hero + (b.heroSub ? ` ${b.heroSub}` : ""));
  for (const s of b.stats ?? []) lines.push(`${s.label}: ${s.value}`);
  if (lines.length) lines.push("");
  for (const p of b.paragraphs) lines.push(p.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&"), "");
  if (b.cta) lines.push(`${b.cta.label}: ${b.cta.url}`, "");
  lines.push("—", `${reason} Odjava: ${unsubscribeUrl}`);
  return lines.join("\n");
}

const REASON = "Primaš ovaj mail jer imaš račun u UnitCentu.";

function build(subject: string, preheader: string, b: Block, unsubscribeUrl: string): EmailParts {
  return { subject, html: layout(preheader, b, unsubscribeUrl, REASON), text: plain(b, unsubscribeUrl, REASON) };
}

const hi = (name: string | null) => (name ? `Bok ${esc(name)},` : "Bok,");
const link = (url: string, label: string) => `<a class="link" href="${esc(url)}" style="color:${C.light.brand};font-weight:700;">${esc(label)}</a>`;
const utm = (path: string, campaign: string) => `${SITE}${path}${path.includes("?") ? "&" : "?"}utm_source=email&utm_medium=email&utm_campaign=${campaign}`;

/** Premium se spominje tek u svakom 3. do 4. mailu, jednom rečenicom, bez pritiska. */
const premiumLine = (campaign: string) =>
  `Ako želiš cijelu povijest i skeniranje bez brojanja, ${link(utm("/#besplatno-premium", campaign), "Premium")} je 7 dana besplatan.`;

export function welcomeEmail(name: string | null, unsubscribeUrl: string): EmailParts {
  return build(
    "Dobrodošlica u UnitCent",
    "Jedno pitanje svaki dan: koliko danas smijem potrošiti?",
    {
      paragraphs: [
        hi(name),
        "drago nam je što si tu. UnitCent odgovara na jedno pitanje: <strong>koliko danas smijem potrošiti?</strong>",
        "Tri stvari koje vrijede prvi dan:",
        "1. Postavi plan: primanja, obavezne troškove i štednju. Prsten na Početnoj tada pokazuje tvoj dnevni budžet.<br>2. Upiši trošak čim se dogodi. Traje 3 sekunde.<br>3. Dodaj pretplate jednom. Knjiže se same.",
        "Ponedjeljkom ti šaljemo kratak sažetak tjedna. Ništa više.",
      ],
    },
    unsubscribeUrl,
  );
}

export function tipsEmail(name: string | null, unsubscribeUrl: string): EmailParts {
  return build(
    "Tri savjeta za prvi tjedan",
    "Kako da prsten ostane zelen do kraja mjeseca.",
    {
      label: "Prvi tjedan",
      paragraphs: [
        hi(name),
        "evo tri navike koje najviše pomažu u prvom tjednu:",
        "<strong>Upiši odmah, ne navečer.</strong> Trošak upisan na blagajni je točan; navečer se pola zaboravi.",
        "<strong>Skeniraj veće račune.</strong> Kamera razvrsta stavke po kategorijama, pa vidiš gdje stvarno ide novac.",
        "<strong>Gledaj samo prsten.</strong> Ako je dnevni budžet danas potrošen, sutra je opet novi dan. Ne treba ti tablica.",
        `Više o tome: ${link(utm("/blog/koliko-dnevno-smijem-potrositi", "tips"), "Koliko dnevno smijem potrošiti")}.`,
      ],
    },
    unsubscribeUrl,
  );
}

export function weeklyEmail(name: string | null, w: WeekSummary, opts: { premiumCta: boolean }, unsubscribeUrl: string): EmailParts {
  const range = dateRange(w.start, w.end);
  const hasTarget = w.targetCents !== null && w.targetCents > 0;
  const diff = hasTarget ? w.targetCents! - w.spentCents : 0;
  const stats: { label: string; value: string }[] = [];
  if (hasTarget) stats.push({ label: diff >= 0 ? "Ispod plana" : "Preko plana", value: eur(Math.abs(diff)) });
  if (w.top) stats.push({ label: `Najviše: ${w.top.name}`, value: eur(w.top.cents) });
  stats.push({ label: "Dana s unosom", value: `${w.daysWithEntries} od 7` });

  const paragraphs = [hi(name)];
  if (!hasTarget) paragraphs.push("postavi plan u aplikaciji pa ćeš uz ovaj broj vidjeti i plan za tjedan.");
  else if (diff >= 0) paragraphs.push(`prošli tjedan završio je <strong>${esc(eur(diff))} ispod plana</strong>. Taj iznos ostaje u ovom mjesecu.`);
  else paragraphs.push(`prošli tjedan bio je ${esc(eur(-diff))} preko plana. Dnevni budžet za ostatak mjeseca već je preračunat.`);
  if (w.daysWithEntries >= 5) paragraphs.push(`${w.daysWithEntries} ${plural(w.daysWithEntries, "dan", "dana", "dana")} s unosom. Tako brojke ostaju točne.`);
  if (opts.premiumCta) paragraphs.push(premiumLine("weekly"));

  const subject = hasTarget ? `Tvoj tjedan: ${eur(w.spentCents)} od ${eur(w.targetCents!)}` : `Tvoj tjedan: ${eur(w.spentCents)}`;
  return build(
    subject,
    hasTarget ? (diff >= 0 ? `${eur(diff)} ispod plana.` : `${eur(-diff)} preko plana.`) : `Potrošeno ${range}.`,
    {
      label: `Tvoj tjedan · ${range}`,
      hero: eur(w.spentCents),
      heroSub: hasTarget ? `od ${eur(w.targetCents!)} plana` : "potrošeno",
      progress: hasTarget ? w.spentCents / w.targetCents! : undefined,
      stats,
      paragraphs,
    },
    unsubscribeUrl,
  );
}

export function monthlyEmail(name: string | null, m: MonthSummary, opts: { premiumCta: boolean }, unsubscribeUrl: string): EmailParts {
  const mName = monthName(m.month);
  const Name = mName.charAt(0).toUpperCase() + mName.slice(1);
  const hasPlan = m.availableCents !== null && m.availableCents > 0;
  const diff = hasPlan ? m.availableCents! - m.spentCents : 0;
  const stats = m.top.map((c) => ({ label: c.name, value: eur(c.cents) }));

  const paragraphs = [hi(name)];
  if (hasPlan && diff >= 0) paragraphs.push(`${esc(Name)} je završio <strong>${esc(eur(diff))} ispod plana</strong>.`);
  else if (hasPlan) paragraphs.push(`${esc(Name)} je završio ${esc(eur(-diff))} preko plana. Plan za novi mjesec možeš prilagoditi u aplikaciji.`);
  else paragraphs.push(`ovo je tvoj ${esc(mName)}. Postavi plan pa ćeš idući mjesec vidjeti i koliko ti je ostalo.`);
  paragraphs.push("Najveće kategorije su gore. Detalje po danima i usporedbu s prošlim mjesecima imaš na Pregledu.");
  if (opts.premiumCta) paragraphs.push(premiumLine("monthly"));

  return build(
    hasPlan ? `${Name}: ${eur(Math.abs(diff))} ${diff >= 0 ? "ispod" : "preko"} plana` : `${Name}: ${eur(m.spentCents)} potrošeno`,
    `Tvoj ${mName} u brojkama.`,
    {
      label: `${mName} · pregled`,
      hero: eur(m.spentCents),
      heroSub: hasPlan ? `od ${eur(m.availableCents!)} za trošenje` : "potrošeno",
      progress: hasPlan ? m.spentCents / m.availableCents! : undefined,
      stats,
      paragraphs,
    },
    unsubscribeUrl,
  );
}

export function winbackEmail(name: string | null, unsubscribeUrl: string): EmailParts {
  return build(
    "Tvoj plan je još tu",
    "Jedan unos i prsten je opet točan.",
    {
      paragraphs: [
        hi(name),
        "tvoj plan i svi troškovi su na mjestu. Ako je bilo par dana bez unosa, nije problem: upiši današnji trošak i dnevni budžet se sam preračuna za ostatak mjeseca.",
        "Ne moraš nadoknađivati propuštene dane. Dovoljno je krenuti od danas.",
      ],
      cta: { label: "Otvori UnitCent", url: utm("/", "winback") },
    },
    unsubscribeUrl,
  );
}
