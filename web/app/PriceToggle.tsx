"use client";

import { useState } from "react";
import { PRICES } from "./site";

/** Cijena Premiuma u zaglavlju tablice: prebacivač Mjesečno / Godišnje (godišnje uz prekriženu mjesečnu cijenu). */
export function PriceToggle() {
  const [yearly, setYearly] = useState(true);
  const opt = (on: boolean, label: string, pick: () => void) => (
    <button
      type="button"
      aria-pressed={on}
      onClick={pick}
      style={{
        flex: 1, minHeight: 32, border: 0, borderRadius: 999, cursor: "pointer", font: "inherit", fontSize: 12, fontWeight: 700,
        background: on ? "var(--brand)" : "transparent", color: on ? "#04241a" : "inherit", padding: "0 10px",
      }}
    >
      {label}
    </button>
  );
  return (
    <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginTop: 8, textTransform: "none", letterSpacing: 0 }}>
      <span role="group" aria-label="Razdoblje plaćanja" style={{ display: "flex", width: "100%", maxWidth: 190, padding: 3, borderRadius: 999, background: "rgba(255,255,255,0.07)" }}>
        {opt(!yearly, "Mjesečno", () => setYearly(false))}
        {opt(yearly, "Godišnje", () => setYearly(true))}
      </span>
      <span className="num" aria-live="polite" style={{ fontSize: 15, fontWeight: 700, color: "var(--ink, #f2f4f1)" }}>
        {yearly ? (
          <>
            {PRICES.yearly} / god. <small style={{ display: "block", fontSize: 12, fontWeight: 500, opacity: 0.75 }}><s>{PRICES.monthly}</s> {PRICES.yearlyPerMonth} / mj.</small>
          </>
        ) : (
          <>{PRICES.monthly} / mj.</>
        )}
      </span>
    </span>
  );
}
