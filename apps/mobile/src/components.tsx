import { useState, type ReactNode } from "react";
import { Pressable, TextInput, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { parseAmount, type Cents } from "@unitcent/core";
import { Icon } from "./icons";
import { textStyle, useTheme } from "./theme";
import { T } from "./ui";

/** "#rrggbb" + prozirnost (0–1) → "#rrggbbaa". */
export function tint(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255);
  return `${hex}${a.toString(16).padStart(2, "0")}`;
}

/** Krug s ikonom kategorije, obojen bojom kategorije (12 % pozadina). */
export function CatIcon({ colorToken, icon, size = 40 }: { colorToken: string; icon: string; size?: number }) {
  const { colors } = useTheme();
  const c = colors[colorToken as keyof typeof colors] ?? colors["ink-muted"];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: tint(c, 0.16),
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={icon} size={Math.round(size * 0.5)} color={c} />
    </View>
  );
}

/**
 * Hijerarhija gumba (CLAUDE.md → Dizajn):
 *  primary   jedna glavna radnja po ekranu: puna brand pilula, širina prema sadržaju (nikad preko cijele širine);
 *  secondary staklena pilula s rubom, manje važna radnja (npr. „Odaberi iz galerije“);
 *  text      tercijarna radnja: tekst u brand boji („+ Nova kategorija“, „Natrag“);
 *  danger    razorna radnja: crveni tekst, na dnu, uvijek uz potvrdu.
 * „soft“ je stari naziv za secondary.
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "soft" | "text" | "danger";
  size?: "md" | "sm";
  icon?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, fx } = useTheme();
  const v = variant === "soft" ? "secondary" : variant;
  const filled = v === "primary";
  const outlined = v === "secondary";
  const fg = filled ? colors["on-brand"] : v === "danger" ? colors.danger : v === "text" ? colors.brand : colors.ink;
  const h = size === "sm" ? 42 : 52;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      hitSlop={{ top: 4, bottom: 4, left: 8, right: 8 }}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        {
          alignSelf: "center",
          minHeight: v === "text" || v === "danger" ? 44 : h,
          minWidth: filled ? 200 : outlined ? 168 : undefined,
          paddingHorizontal: filled ? 32 : outlined ? 24 : 12,
          borderRadius: 999,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          backgroundColor: filled ? (pressed ? colors["brand-pressed"] : colors.brand) : outlined ? fx.glass : "transparent",
          borderWidth: outlined ? 1.5 : 0,
          borderColor: fx.glassBorder,
          opacity: disabled ? 0.4 : pressed && !filled ? 0.6 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={18} color={fg} /> : null}
      <T v="headline" color={fg} style={size === "sm" || v === "text" || v === "danger" ? { fontSize: 15 } : undefined}>{label}</T>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, left }: { label: string; selected?: boolean; onPress: () => void; left?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={{
        minHeight: 44,
        borderRadius: 999,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: selected ? colors["brand-soft"] : colors["surface-2"],
      }}
    >
      {left}
      <T v="headline" color={selected ? colors["brand-ink"] : colors.ink}>{label}</T>
    </Pressable>
  );
}

/** Prekidač u pilulji (Trošak / Prihod, tema). Odabrana opcija je staklena pločica. */
export function Segmented<K extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: K; label: string }[];
  value: K;
  onChange: (k: K) => void;
}) {
  const { colors, fx } = useTheme();
  return (
    <View style={{ flexDirection: "row", backgroundColor: fx.track, borderRadius: 999, padding: 4, gap: 2 }}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => {
              void Haptics.selectionAsync();
              onChange(o.key);
            }}
            style={{
              flex: 1,
              minHeight: 40,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 999,
              backgroundColor: on ? colors.surface : "transparent",
              borderWidth: on ? 1 : 0,
              borderColor: fx.glassBorder,
            }}
          >
            <T v="headline" muted={!on}>{o.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Polje za iznos u eurima. Prima i hrvatski ("12,50") i točku; vraća cente ili null. */
export function AmountField({
  label,
  value,
  onChange,
  placeholder = "0,00",
}: {
  label: string;
  value: string;
  onChange: (text: string, cents: Cents | null) => void;
  placeholder?: string;
}) {
  const { colors, radius, fx } = useTheme();
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <T v="caption" muted>{label}</T>
      <View
        style={{
          minHeight: 56,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor: focus ? colors.brand : fx.glassBorder,
          backgroundColor: fx.glass,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 14,
          gap: 8,
        }}
      >
        <TextInput
          value={value}
          onChangeText={(t) => onChange(t, parseAmount(t))}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          keyboardType="decimal-pad"
          placeholder={placeholder}
          placeholderTextColor={colors["ink-muted"]}
          accessibilityLabel={label}
          style={[textStyle("amount"), { flex: 1, color: colors.ink, fontSize: 20, paddingVertical: 12 }]}
        />
        <T v="headline" muted>€</T>
      </View>
    </View>
  );
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "⌫"] as const;

/** Numerička tipkovnica za brzi unos: samo velike znamenke, bez kutija (najviše 7 znamenki i 2 decimale). */
export function Keypad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const press = (k: (typeof KEYS)[number]) => {
    void Haptics.selectionAsync();
    let v = value;
    if (k === "⌫") v = v.slice(0, -1);
    else if (k === ",") {
      if (!v.includes(",")) v = (v || "0") + ",";
    } else {
      if (v.includes(",") && (v.split(",")[1] ?? "").length >= 2) return;
      if (v === "0") v = "";
      if (v.replace(",", "").length >= 7) return;
      v += k;
    }
    onChange(v);
  };
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
      {KEYS.map((k) => (
        <Pressable
          key={k}
          accessibilityRole="button"
          accessibilityLabel={k === "⌫" ? "Obriši" : k}
          onPress={() => press(k)}
          style={({ pressed }) => ({
            width: "33.333%",
            minHeight: 50,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.45 : 1,
          })}
        >
          <T v="title-1" style={{ fontSize: 28, lineHeight: 32, fontWeight: "600" }}>{k}</T>
        </Pressable>
      ))}
    </View>
  );
}

/** Krug s inicijalom: isti prikaz na Početnoj i u Profilu (brand gradijent, tamno slovo). */
export function Avatar({ initial, size = 44, onPress }: { initial: string; size?: number; onPress?: () => void }) {
  const { colors, fx } = useTheme();
  const body = (
    <LinearGradient
      colors={[colors.brand, fx.accent2]}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center" }}
    >
      <T v="headline" color="#04241a" style={{ fontWeight: "800", fontSize: Math.round(size * 0.4), lineHeight: Math.round(size * 0.5) }}>
        {initial.toUpperCase()}
      </T>
    </LinearGradient>
  );
  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Profil" hitSlop={8} onPress={onPress}>
      {body}
    </Pressable>
  );
}
