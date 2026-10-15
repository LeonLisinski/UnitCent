import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const alt = "UnitCent: znaj koliko smiješ potrošiti, svaki dan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  const mark = `data:image/png;base64,${readFileSync(join(process.cwd(), "public/brand/unitcent-mark-transparent.png")).toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f7f6f2", padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <img src={mark} width={112} height={86} />
          <div style={{ display: "flex", fontSize: 44, fontWeight: 800, color: "#15181a" }}>Unit<span style={{ color: "#0e7a5f" }}>Cent</span></div>
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
