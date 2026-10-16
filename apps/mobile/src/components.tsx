import { useState, type ReactNode } from "react";
import { Pressable, TextInput, View, type StyleProp, type ViewStyle } from "react-native";
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

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "soft" | "text";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, radius } = useTheme();
  const bg = variant === "primary" ? colors.brand : variant === "soft" ? colors["surface-2"] : "transparent";
  const fg = variant === "primary" ? colors["on-brand"] : variant === "soft" ? colors.ink : colors["ink-muted"];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        {
          minHeight: 52,
          borderRadius: radius.md,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: pressed && variant === "primary" ? colors["brand-pressed"] : bg,
          opacity: disabled ? 0.45 : 1,
          paddingHorizontal: 20,
        },
        style,
      ]}
    >
      <T v="headline" color={fg}>{label}</T>
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

/** Segmentirani prekidač (npr. Trošak / Prihod, tema). */
export function Segmented<K extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: K; label: string }[];
  value: K;
  onChange: (k: K) => void;
}) {
  const { colors, radius } = useTheme();
  return (
    <View style={{ flexDirection: "row", backgroundColor: colors["surface-2"], borderRadius: radius.md, padding: 4 }}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.key)}
            style={{
              flex: 1,
              minHeight: 40,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radius.sm + 2,
              backgroundColor: on ? colors.surface : "transparent",
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
  const { colors, radius } = useTheme();
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <T v="caption" muted>{label}</T>
      <View
        style={{
          minHeight: 56,
          borderRadius: radius.sm + 2,
          borderWidth: 1.5,
          borderColor: focus ? colors.brand : colors["border-strong"],
          backgroundColor: colors.surface,
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

/** Numerička tipkovnica za brzi unos (iznos kao tekst: najviše 7 znamenki i 2 decimale). */
export function Keypad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { colors, radius } = useTheme();
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
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
      {KEYS.map((k) => (
        <Pressable
          key={k}
          accessibilityRole="button"
          accessibilityLabel={k === "⌫" ? "Obriši" : k}
          onPress={() => press(k)}
          style={({ pressed }) => ({
            width: "32%",
            flexGrow: 1,
            minHeight: 54,
            borderRadius: radius.md - 2,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: pressed ? colors["surface-2"] : colors.surface,
          })}
        >
          <T v="title-1" style={{ fontSize: 24, lineHeight: 28 }}>{k}</T>
        </Pressable>
      ))}
    </View>
  );
}
