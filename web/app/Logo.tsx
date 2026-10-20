/**
 * Znak UnitCent: prsten dnevnog budžeta (izvor: public/brand/svg). Crta se u boji `--brand`, pa sam prati svijetlu i tamnu temu.
 * Isti prsten koristi indikator napretka stranice (ScrollRing u Motion.tsx).
 */
export const RING_ARC = "M74.04 25.96A34 34 0 1 0 74.04 74.04";

export function LogoMark({ size = 32, draw = false }: { size?: number; draw?: boolean }) {
  return (
    <svg
      className={`logo-ring${draw ? " draw" : ""}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="34" stroke="var(--brand)" strokeOpacity="0.22" strokeWidth="16" />
      <path d={RING_ARC} stroke="var(--brand)" strokeWidth="16" pathLength={100} />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="wordmark">
      Unit<span style={{ color: "var(--brand)" }}>Cent</span>
    </span>
  );
}
