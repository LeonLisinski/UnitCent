/** Službeni znak UnitCent (public/brand). Stranica je uvijek tamna, pa znak stoji direktno na pozadini. */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <span className="logo-tile" style={{ width: Math.round(size * 1.3), height: size }} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/unitcent-mark-transparent.png" alt="" width={Math.round(size * 1.3)} height={Math.round(size * 1.3 * 0.763)} />
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
