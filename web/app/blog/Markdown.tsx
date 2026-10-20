import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "../icons";

/*
 * Mali Markdown za članke (bez ovisnosti). Podržano: ## / ###, odlomci, - i 1. popisi, > blok, tablice, **b**, [a](href).
 * Vizualni blokovi (blok počinje s „::“, jedan blok = odlomak odvojen praznim retkom):
 *   ::stat 19,96 € | Dnevni budžet | 546,67 € ÷ 17 dana     (jedan ili više redaka → kartice s ključnim brojem)
 *   ::tip Tekst savjeta                                       (istaknuti savjet s ikonom)
 *   ::warn Tekst upozorenja                                   (upozorenje s ikonom)
 *   ::bars Naslov grafa                                       (prvi redak; ispod retci „Oznaka | 320“, iznosi u €)
 *   ::calc slug | Naslov | Jedna rečenica                     (kartica s poveznicom na /kalkulatori/slug)
 */

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function inline(raw: string, key: string): ReactNode[] {
  // Razmak ispred % i € ne smije prelomiti redak.
  const text = raw.replace(/ (?=[%€])/g, " ");
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${i++}`;
    if (m[1]) out.push(<strong key={k}>{m[1]}</strong>);
    else {
      const href = m[3];
      out.push(
        href.startsWith("/") ? (
          <Link key={k} href={href}>{m[2]}</Link>
        ) : (
          <a key={k} href={href} target="_blank" rel="noopener noreferrer">{m[2]}</a>
        )
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const cells = (row: string) => row.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

/** „1.234,56“ ili „320“ → broj (za visinu stupca). */
const num = (s: string) => Number(s.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".")) || 0;
const eur = (n: number) => `${n.toLocaleString("hr-HR", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })} €`;

function Directive({ lines, k }: { lines: string[]; k: string }): ReactNode {
  const [head, ...rest] = lines;
  const kind = head.slice(2).split(/\s/, 1)[0];
  const arg = head.slice(2 + kind.length).trim();
  if (kind === "stat") {
    const items = lines.map((l) => cells(l.replace(/^::stat\s*/, "")));
    return (
      <div className={`md-stats n${Math.min(items.length, 3)}`}>
        {items.map(([value, label, note], i) => (
          <div key={i} className="md-stat">
            <div className="md-stat-value">{value}</div>
            {label ? <div className="md-stat-label">{label}</div> : null}
            {note ? <div className="md-stat-note">{inline(note, `${k}-${i}`)}</div> : null}
          </div>
        ))}
      </div>
    );
  }
  if (kind === "tip" || kind === "warn") {
    const text = [arg, ...rest].join(" ");
    return (
      <aside className={`md-callout md-${kind}`} role="note">
        <span className="md-callout-icon"><Icon name={kind === "tip" ? "bulb" : "alert"} size={20} stroke={1.8} /></span>
        <p>
          <strong>{kind === "tip" ? "Savjet: " : "Pazi: "}</strong>
          {inline(text, k)}
        </p>
      </aside>
    );
  }
  if (kind === "bars") {
    const rows = rest.map((l) => cells(l)).filter((c) => c.length >= 2);
    const max = Math.max(1, ...rows.map((r) => num(r[1])));
    return (
      <figure className="md-bars">
        {arg ? <figcaption>{arg}</figcaption> : null}
        <ul>
          {rows.map(([label, value], i) => (
            <li key={i}>
              <span className="md-bar-label">{label}</span>
              <span className="md-bar-track" aria-hidden="true">
                <span className="md-bar-fill" style={{ width: `${Math.max(2, (num(value) / max) * 100)}%` }} />
              </span>
              <span className="md-bar-value">{eur(num(value))}</span>
            </li>
          ))}
        </ul>
      </figure>
    );
  }
  if (kind === "calc") {
    const [slug, title, line] = cells(arg);
    return (
      <Link className="md-calc" href={`/kalkulatori/${slug}`}>
        <span className="md-calc-icon"><Icon name="calc" size={22} stroke={1.8} /></span>
        <span className="md-calc-text">
          <span className="md-calc-label">Kalkulator</span>
          <span className="md-calc-title">{title}</span>
          {line ? <span className="md-calc-line">{line}</span> : null}
        </span>
        <span className="md-calc-arrow"><Icon name="arrow" size={18} /></span>
      </Link>
    );
  }
  return <p>{inline(lines.join(" "), k)}</p>;
}

export function Markdown({ source }: { source: string }) {
  const blocks = source.trim().split(/\n\s*\n/);
  return (
    <>
      {blocks.map((raw, b) => {
        const block = raw.trim();
        const key = `b${b}`;
        if (block.startsWith("### ")) {
          const t = block.slice(4);
          return <h3 key={key} id={slugify(t)}>{inline(t, key)}</h3>;
        }
        if (block.startsWith("## ")) {
          const t = block.slice(3);
          return <h2 key={key} id={slugify(t)}>{inline(t, key)}</h2>;
        }
        const lines = block.split("\n").map((l) => l.trim());
        if (lines[0].startsWith("::")) return <Directive key={key} lines={lines} k={key} />;
        if (lines.every((l) => l.startsWith("- "))) {
          return <ul key={key}>{lines.map((l, i) => <li key={i}>{inline(l.slice(2), `${key}-${i}`)}</li>)}</ul>;
        }
        if (lines.every((l) => /^\d+\.\s/.test(l))) {
          return <ol key={key}>{lines.map((l, i) => <li key={i}>{inline(l.replace(/^\d+\.\s/, ""), `${key}-${i}`)}</li>)}</ol>;
        }
        if (lines.every((l) => l.startsWith(">"))) {
          return <blockquote key={key}><p>{inline(lines.map((l) => l.replace(/^>\s?/, "")).join(" "), key)}</p></blockquote>;
        }
        if (lines.length > 2 && lines.every((l) => l.startsWith("|"))) {
          const [head, , ...rows] = lines;
          return (
            <div key={key} className="post-table" role="region" aria-label="Tablica" tabIndex={0}>
              <table>
                <thead><tr>{cells(head).map((c, i) => <th key={i} scope="col">{inline(c, `${key}-h${i}`)}</th>)}</tr></thead>
                <tbody>
                  {rows.map((r, ri) => (
                    <tr key={ri}>{cells(r).map((c, i) => <td key={i}>{inline(c, `${key}-${ri}-${i}`)}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return <p key={key}>{inline(lines.join(" "), key)}</p>;
      })}
    </>
  );
}

