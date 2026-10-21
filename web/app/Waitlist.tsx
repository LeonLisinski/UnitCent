"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";

/** `secondary`: lista čekanja ispod gumba trgovina (rubni gumb, jer je glavna radnja aplikacija). */
export function Waitlist({ id, where, secondary = false }: { id: string; where: "hero" | "footer"; secondary?: boolean }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setState("sending");
    const source = new URLSearchParams(window.location.search).get("utm_source") ?? "";
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent, source, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Nešto je pošlo po zlu. Probaj ponovno.");
        setState("idle");
        return;
      }
      track("waitlist_signup", { where, source: source || "direct" });
      setState("done");
    } catch {
      setError("Nema veze. Provjeri internet i probaj ponovno.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="wl-done" role="status">
        <b>Prijavljen si.</b> Javit ćemo ti se jednom, kad aplikacija izađe.
      </div>
    );
  }

  return (
    <form className="wl" onSubmit={onSubmit} noValidate>
      <div className="wl-row">
        <label htmlFor={`${id}-email`} className="sr-only">E-adresa</label>
        <input
          id={`${id}-email`}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="tvoja@adresa.hr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button className={`btn ${secondary ? "ghost" : "primary"}`} type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Šaljem" : "Javi mi kad izađe"}
        </button>
      </div>
      <div className="hp" aria-hidden="true">
        <label>Web<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
      </div>
      <label className="wl-consent">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>Slažem se da me UnitCent obavijesti kad app izađe. Bez spama. <a href="/privatnost">Privatnost</a></span>
      </label>
      {error && <p className="wl-error" role="alert">{error}</p>}
      </form>
  );
}
