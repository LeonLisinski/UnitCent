import { ImageResponse } from "next/og";

export const alt = "UnitCent: znaj koliko smiješ potrošiti, svaki dan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f7f6f2", padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: "#0e7a5f", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800 }}>u¢</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#15181a" }}>UnitCent</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 76, fontWeight: 800, color: "#15181a", lineHeight: 1.05, maxWidth: 900 }}>Znaj koliko smiješ potrošiti, svaki dan.</div>
          <div style={{ display: "flex", alignSelf: "flex-start", background: "#c8f169", color: "#15181a", fontSize: 34, fontWeight: 800, padding: "14px 28px", borderRadius: 20 }}>Danas smiješ 19,96 €</div>
        </div>
      </div>
    ),
    size
  );
}
