import { ImageResponse } from "next/og";

export const alt = "UnitCent: znaj koliko smiješ potrošiti, svaki dan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* Znak je isti prsten kao public/brand/svg/znak-tamna.svg (OG slika je uvijek na tamnoj podlozi). */
export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#070b0b", padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="84" height="84" viewBox="0 0 100 100" fill="none" strokeLinecap="round">
            <circle cx="50" cy="50" r="34" stroke="#3dd6a3" strokeOpacity="0.22" strokeWidth="16" />
            <path d="M74.04 25.96A34 34 0 1 0 74.04 74.04" stroke="#3dd6a3" strokeWidth="16" />
          </svg>
          <div style={{ display: "flex", fontSize: 48, fontWeight: 800, color: "#f2f4f1" }}>Unit<span style={{ color: "#3dd6a3" }}>Cent</span></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 76, fontWeight: 800, color: "#f2f4f1", lineHeight: 1.05, maxWidth: 900 }}>Znaj koliko smiješ potrošiti, svaki dan.</div>
          <div style={{ display: "flex", alignSelf: "flex-start", background: "#c8f169", color: "#15181a", fontSize: 34, fontWeight: 800, padding: "14px 28px", borderRadius: 20 }}>Dnevni budžet: 19,96 €</div>
        </div>
      </div>
    ),
    size
  );
}
