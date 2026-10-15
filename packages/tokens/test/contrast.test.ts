import { describe, expect, it } from "vitest";
import tokens from "../src/tokens.json";

// WCAG kontrast: tekst ≥ 4.5:1, veliki tekst/ikone/obrubi kontrola ≥ 3:1
function lum(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0]! + 0.7152 * ch[1]! + 0.0722 * ch[2]!;
}
function ratio(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
}

const TEXT_PAIRS: [string, string][] = [
  ["ink", "bg"],
  ["ink", "surface"],
  ["ink-muted", "bg"],
  ["ink-muted", "surface"],
  ["on-brand", "brand"],
  ["on-accent", "accent"],
  ["brand-ink", "brand-soft"],
  ["brand", "bg"], // zeleni tekst/linkovi na pozadini
  ["warning", "bg"],
  ["danger", "bg"],
];
const NON_TEXT_PAIRS: [string, string][] = [
  ["border-strong", "bg"],
  ["border-strong", "surface"],
];

for (const theme of ["dark", "light"] as const) {
  const c = tokens.color[theme] as Record<string, string>;
  describe(`kontrast: ${theme}`, () => {
    for (const [fg, bg] of TEXT_PAIRS) {
      it(`${fg} na ${bg} ≥ 4.5`, () => {
        expect(ratio(c[fg]!, c[bg]!)).toBeGreaterThanOrEqual(4.5);
      });
    }
    for (const [fg, bg] of NON_TEXT_PAIRS) {
      it(`${fg} na ${bg} ≥ 3`, () => {
        expect(ratio(c[fg]!, c[bg]!)).toBeGreaterThanOrEqual(3);
      });
    }
    it("sve kategorijske boje ≥ 3 na pozadini (ikone)", () => {
      for (const [k, v] of Object.entries(c)) {
        if (k.startsWith("cat-")) expect(ratio(v, c["bg"]!), k).toBeGreaterThanOrEqual(3);
      }
    });
  });
}

describe("paritet tema", () => {
  it("svijetla i tamna imaju iste ključeve", () => {
    expect(Object.keys(tokens.color.light).sort()).toEqual(Object.keys(tokens.color.dark).sort());
  });
});
