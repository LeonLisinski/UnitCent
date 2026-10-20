import Link from "next/link";
import type { ReactNode } from "react";

/* Mali Markdown za članke (bez ovisnosti). Podržano: ## / ###, odlomci, - i 1. popisi, > blok, tablice, **b**, [a](href). */

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

