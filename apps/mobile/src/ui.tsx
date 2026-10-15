import type { ReactNode } from "react";
import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { textStyle, useTheme, type TextVariant } from "./theme";

/** Tekst s varijantom iz dizajn sustava. Boja zadano `ink`. */
export function T({
  v = "body",
  muted,
  color,
  style,
  children,
  ...rest
}: {
  v?: TextVariant;
  muted?: boolean;
  color?: string;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
  numberOfLines?: number;
}) {
  const { colors } = useTheme();
  return (
    <Text {...rest} style={[textStyle(v), { color: color ?? (muted ? colors["ink-muted"] : colors.ink) }, style]}>
      {children}
    </Text>
  );
}

/** Ekran: pozadina iz teme, sigurna područja, jedan stupac s rubom 16. */
export function Screen({ title, children }: { title?: string; children?: ReactNode }) {
  const { colors, space } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={{ flex: 1, paddingHorizontal: space["4"], paddingTop: space["4"], gap: space["5"] }}>
        {title ? <T v="title-1">{title}</T> : null}
        {children}
      </View>
    </SafeAreaView>
  );
}

/** Prazno stanje: jedna rečenica, bez ilustracija. */
export function Empty({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors, radius, space } = useTheme();
  return (
    <View style={[{ backgroundColor: colors.surface, borderRadius: radius.md, padding: space["5"] }, style]}>
      <T muted>{children}</T>
    </View>
  );
}
