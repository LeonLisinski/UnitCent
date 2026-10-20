import { Text, useColorScheme, type TextProps, type TextStyle } from "react-native";
import { tokens } from "@unitcent/tokens";

// Isti tokeni kao aplikacija i web (packages/tokens). Admin prati temu sustava.
type Palette = Record<keyof typeof tokens.color.dark, string>;

export function useColors(): Palette & { line: string; dark: boolean } {
  const dark = useColorScheme() !== "light";
  const c = (dark ? tokens.color.dark : tokens.color.light) as Palette;
  return { ...c, line: dark ? "rgba(255,255,255,0.08)" : "rgba(12,23,20,0.08)", dark };
}

type Variant = "hero" | "number" | "title" | "body" | "caption" | "label";

const STYLE: Record<Variant, TextStyle> = {
  // 4 razine: glavni broj → ključni brojevi → naslovi/retci → oznake
  hero: { fontFamily: "Manrope_800ExtraBold", fontSize: 56, lineHeight: 60, letterSpacing: -1.5, fontVariant: ["tabular-nums"] },
  number: { fontFamily: "Manrope_800ExtraBold", fontSize: 22, lineHeight: 28, fontVariant: ["tabular-nums"] },
  title: { fontFamily: "Manrope_700Bold", fontSize: 16, lineHeight: 22 },
  body: { fontFamily: "Manrope_500Medium", fontSize: 15, lineHeight: 21 },
  caption: { fontFamily: "Manrope_500Medium", fontSize: 13, lineHeight: 18 },
  label: { fontFamily: "JetBrainsMono_500Medium", fontSize: 11, lineHeight: 14, letterSpacing: 0.9, textTransform: "uppercase" },
};

export function T({ v = "body", muted, color, style, ...rest }: TextProps & { v?: Variant; muted?: boolean; color?: string }) {
  const c = useColors();
  return <Text {...rest} style={[STYLE[v], { color: color ?? (muted ? c["ink-muted"] : c.ink) }, style]} />;
}
