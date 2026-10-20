import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useColorScheme, type TextStyle } from "react-native";
import { tokens } from "@unitcent/tokens";
import { kvGet, kvSet } from "./db/repo";

export type ThemePreference = "system" | "light" | "dark";
export type Scheme = "light" | "dark";

// Svijetla i tamna paleta imaju iste ključeve (testira se u packages/tokens); vrijednosti su obični stringovi.
type Palette = Record<keyof typeof tokens.color.dark, string>;

/** Efekti koji nisu u tokenima boja: staklene površine, sjaj, tragovi grafova. */
export interface Fx {
  glass: string;
  glassBorder: string;
  track: string;
  tabBg: string;
  /** Ikona i oznaka u tab traci (aktivno / neaktivno) i podloga aktivnog taba. */
  tabInk: string;
  tabInkMuted: string;
  tabActiveBg: string;
  glowColor: string;
  glowOpacity: number;
  accent2: string;
  /** Početak zelenog prijelaza u grafovima (prsten, traka): življi od brand boje teksta, jer graf nije tekst. */
  graphBrand: string;
  line: string;
  /** Dubina: gradijent pozadine, drugi sjaj, sjaj površine, svijetli rub, sjena. */
  bgTop: string;
  bgBottom: string;
  glow2: string;
  sheenTop: string;
  sheenBottom: string;
  edge: string;
  shadowOpacity: number;
  /** Zlatna: oznaka Premiuma (lokoti, zvijezda, značke). */
  gold: string;
  goldSoft: string;
  /** Zlatni gradijent (svijetli i tamni kraj) za značke i zvijezdu. */
  goldHi: string;
  goldLo: string;
  /** Zlatna ISPUNA (gumb, značka, medaljon): ista metalna zlatna u obje teme, s tamnim tekstom. */
  goldFillHi: string;
  goldFillMid: string;
  goldFillLo: string;
  /** AI: ljubičasta. Tri znaka: zelena = tvoj novac, zlatna = Premium, ljubičasta = AI. */
  ai: string;
  aiSoft: string;
  aiHi: string;
  aiLo: string;
  /** Zlatni početak AI prijelaza dok korisnik nema Premium (vidi src/ai.ts). */
  aiGold: string;
  /** Tekst/ikona na AI gradijentu. */
  onAi: string;
}

const FX: Record<Scheme, Fx> = {
  dark: {
    glass: "rgba(255,255,255,0.03)",
    glassBorder: "rgba(255,255,255,0.09)",
    track: "rgba(255,255,255,0.07)",
    tabBg: "rgba(18,26,25,0.95)",
    tabInk: "#3dd6a3",
    tabInkMuted: "#a3b0ab",
    tabActiveBg: "rgba(61,214,163,0.16)",
    glowColor: "#3dd6a3",
    glowOpacity: 0.26,
    accent2: "#c8f169",
    graphBrand: "#3dd6a3",
    line: "rgba(255,255,255,0.08)",
    bgTop: "#0c1615",
    bgBottom: "#050808",
    glow2: "#2b8fd6",
    sheenTop: "rgba(255,255,255,0.085)",
    sheenBottom: "rgba(255,255,255,0.015)",
    edge: "rgba(255,255,255,0.30)",
    shadowOpacity: 0,
    gold: "#c9a35c",
    goldSoft: "rgba(201,163,92,0.16)",
    goldHi: "#efdca6",
    goldLo: "#9a7332",
    goldFillHi: "#efdca6",
    goldFillMid: "#c9a35c",
    goldFillLo: "#9a7332",
    ai: "#a78bfa",
    aiSoft: "rgba(167,139,250,0.16)",
    aiHi: "#8f6df5",
    aiLo: "#5a33c8",
    aiGold: "#c9a35c",
    onAi: "#ffffff",
  },
  // Svijetla: topli porcelan + duboka smaragdna. Kartice i tab traka su čisto bijele s tankim rubom (bez sjene).
  light: {
    glass: "#ffffff",
    glassBorder: "rgba(12,23,20,0.07)",
    track: "rgba(12,23,20,0.07)",
    tabBg: "#ffffff",
    tabInk: "#07775a",
    tabInkMuted: "#535e59",
    tabActiveBg: "#d5ede2",
    glowColor: "#12a27a",
    glowOpacity: 0.2,
    accent2: "#8cc63f",
    graphBrand: "#0e9f76",
    line: "rgba(12,23,20,0.07)",
    bgTop: "#fbfaf7",
    bgBottom: "#ebe7de",
    glow2: "#d9b77a",
    sheenTop: "#ffffff",
    sheenBottom: "#fcfbf8",
    edge: "#ffffff",
    shadowOpacity: 0,
    gold: "#9a7430",
    goldSoft: "rgba(154,116,48,0.13)",
    goldHi: "#cfae6a",
    goldLo: "#775717",
    goldFillHi: "#ecd392",
    goldFillMid: "#d2ae62",
    goldFillLo: "#b98d3e",
    ai: "#6d46d9",
    aiSoft: "rgba(109,70,217,0.12)",
    aiHi: "#8561f0",
    aiLo: "#5a33c8",
    aiGold: "#c9a35c",
    onAi: "#ffffff",
  },
};

interface ThemeValue {
  scheme: Scheme;
  fx: Fx;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  colors: Palette;
  space: typeof tokens.space;
  radius: typeof tokens.radius;
}

const ThemeContext = createContext<ThemeValue | null>(null);

/**
 * Tema prati sustav; korisnik može zaključati svijetlu ili tamnu (D-01: tokeni + StyleSheet).
 * Spremanje izbora u lokalnu bazu dolazi u Fazi 1.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPref] = useState<ThemePreference>(() => {
    const saved = kvGet("theme");
    return saved === "light" || saved === "dark" ? saved : "system";
  });
  const setPreference = (p: ThemePreference) => {
    setPref(p);
    kvSet("theme", p);
  };

  const value = useMemo<ThemeValue>(() => {
    const scheme: Scheme = preference === "system" ? (system === "light" ? "light" : "dark") : preference;
    return {
      scheme,
      fx: FX[scheme],
      preference,
      setPreference,
      colors: tokens.color[scheme],
      space: tokens.space,
      radius: tokens.radius,
    };
  }, [preference, system]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const v = useContext(ThemeContext);
  if (!v) throw new Error("useTheme mora biti unutar ThemeProvider");
  return v;
}

/* ---------- Tipografija (iz tokena; fontovi se učitavaju u app/_layout.tsx) ---------- */

export type TextVariant = keyof typeof tokens.font.style | "serif-accent" | "mono-label";

const SANS_BY_WEIGHT: Record<number, string> = {
  400: "Manrope_400Regular",
  500: "Manrope_500Medium",
  600: "Manrope_600SemiBold",
  700: "Manrope_700Bold",
  800: "Manrope_800ExtraBold",
};

export function textStyle(variant: TextVariant): TextStyle {
  if (variant === "serif-accent") {
    return { fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 28, lineHeight: 32 };
  }
  if (variant === "mono-label") {
    return {
      fontFamily: "JetBrainsMono_500Medium",
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.96,
      textTransform: "uppercase",
    };
  }
  const s = tokens.font.style[variant];
  return {
    fontFamily: SANS_BY_WEIGHT[s.weight] ?? "Manrope_400Regular",
    fontSize: s.size,
    lineHeight: s.line,
    letterSpacing: s.tracking * s.size,
    ...(s.tabular ? { fontVariant: ["tabular-nums"] as TextStyle["fontVariant"] } : null),
  };
}
