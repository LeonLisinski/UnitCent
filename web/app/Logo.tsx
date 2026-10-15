/** Službeni znak UnitCent (public/brand). Bijela pločica drži ga čitljivim i na tamnoj temi. */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <span className="logo-tile" style={{ width: size, height: size }} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/unitcent-mark.png" alt="" width={Math.round(size * 0.78)} height={Math.round(size * 0.78 * 0.763)} />
    </span>
  );
}

export function Wordmark() {
  return (
    <span className="wordmark">
      Unit<span style={{ color: "var(--brand)" }}>Cent</span>
    </span>
  );
}
