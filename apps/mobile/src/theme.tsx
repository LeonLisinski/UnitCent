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
  glowColor: string;
  glowOpacity: number;
  accent2: string;
  line: string;
  /** Dubina: gradijent pozadine, drugi sjaj, sjaj površine, svijetli rub, sjena. */
  bgTop: string;
  bgBottom: string;
  glow2: string;
  sheenTop: string;
  sheenBottom: string;
  edge: string;
  shadowOpacity: number;
}

const FX: Record<Scheme, Fx> = {
  dark: {
    glass: "rgba(255,255,255,0.03)",
    glassBorder: "rgba(255,255,255,0.09)",
    track: "rgba(255,255,255,0.07)",
    tabBg: "rgba(18,26,25,0.95)",
    glowColor: "#3dd6a3",
    glowOpacity: 0.26,
    accent2: "#c8f169",
    line: "rgba(255,255,255,0.08)",
    bgTop: "#0c1615",
    bgBottom: "#050808",
    glow2: "#2b8fd6",
    sheenTop: "rgba(255,255,255,0.085)",
    sheenBottom: "rgba(255,255,255,0.015)",
    edge: "rgba(255,255,255,0.30)",
    shadowOpacity: 0,
  },
  light: {
    glass: "rgba(255,255,255,0.86)",
    glassBorder: "rgba(15,21,21,0.06)",
    track: "rgba(15,21,21,0.07)",
    tabBg: "rgba(255,255,255,0.96)",
    glowColor: "#0e7a5f",
    glowOpacity: 0.16,
    accent2: "#7cb518",
    line: "rgba(15,21,21,0.08)",
    bgTop: "#f8fbf9",
    bgBottom: "#eaf1ed",
    glow2: "#3aa0d8",
    sheenTop: "rgba(255,255,255,0.98)",
    sheenBottom: "rgba(255,255,255,0.78)",
    edge: "rgba(255,255,255,1)",
    shadowOpacity: 0.08,
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
