"use client";

import { useEffect, useState } from "react";

type Prefs = { product: boolean; newsletter: boolean; email?: string };

/** Stanje se čita odmah; svaka promjena se sprema odmah (bez gumba „Spremi“). Odjava ne traži prijavu. */
export function Unsubscribe({ token }: { token: string }) {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function send(patch: Partial<Prefs>) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/odjava?t=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Nešto je pošlo po zlu. Probaj ponovno.");
        return;
      }
      setPrefs(data as Prefs);
      if (Object.keys(patch).length > 0) setSaved(true);
    } catch {
      setError("Nema veze. Provjeri internet i probaj ponovno.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (token) void send({});
    else setError("Poveznica nije valjana. Otvori je ponovno iz maila.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (error && !prefs) return <p className="wl-error" role="alert">{error}</p>;
  if (!prefs) return <p className="muted">Učitavam…</p>;

  const anyOn = prefs.product || prefs.newsletter;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {prefs.email ? <p className="muted">Za adresu {prefs.email}</p> : null}

      <label className="wl-consent">
        <input type="checkbox" checked={prefs.product} disabled={busy} onChange={(e) => void send({ product: e.target.checked })} />
        <span><strong style={{ color: "var(--ink)" }}>Sažeci i savjeti</strong><br />Tjedni sažetak, mjesečni pregled i savjeti za prvi tjedan.</span>
      </label>

      <label className="wl-consent">
        <input type="checkbox" checked={prefs.newsletter} disabled={busy || !prefs.newsletter} onChange={(e) => void send({ newsletter: e.target.checked })} />
        <span><strong style={{ color: "var(--ink)" }}>Newsletter</strong><br />{prefs.newsletter ? "Jedan savjet i novi članak, svaki tjedan ili dva." : "Isključen. Uključiti ga možeš u aplikaciji (Profil, E-mailovi)."}</span>
      </label>

      {anyOn ? (
        <div>
          <button type="button" className="btn primary" disabled={busy} onClick={() => void send({ product: false, newsletter: false })}>
            Odjavi me od svega
          </button>
        </div>
      ) : null}

      <p role="status" className="muted" aria-live="polite">
        {error ? <span className="wl-error">{error}</span> : saved ? (anyOn ? "Spremljeno." : "Gotovo. Više ti ne šaljemo mailove.") : ""}
      </p>
    </div>
  );
}
