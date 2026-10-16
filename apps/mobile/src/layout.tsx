import type { ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Glow } from "./fx";
import { useTheme } from "./theme";
import { T } from "./ui";

/**
 * Zajednički raspored svih ekrana (da sve djeluje kao jedna cjelina):
 * isti rubovi, isti razmak između sekcija, isto zaglavlje, ista sekcija, isti redak popisa.
 */
export const PAD = 20; // vodoravni rub ekrana
export const SECTION_GAP = 28; // razmak između sekcija
export const HERO = 262; // veličina glavnog grafa (prsten / krug)

/** Okvir tab ekrana: pozadina, sjaj, sigurni rub, skrolanje s donjim razmakom za plutajuću traku. */
export function TabScreen({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Glow />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: PAD, paddingTop: 12, paddingBottom: 140, gap: SECTION_GAP }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/** Zaglavlje ekrana: kontekst lijevo (pozdrav, mjesec) i najviše jedna radnja desno. Uvijek iste visine. */
export function PageHeader({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={{ minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <View style={{ flex: 1, minWidth: 0 }}>{children}</View>
      {right}
    </View>
  );
}

/** Sekcija: mala oznaka (uz opcionalan podatak ili radnju desno) i sadržaj. */
export function Section({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <T v="mono-label" muted style={{ fontSize: 11, opacity: 0.8 }}>{title}</T>
        {typeof right === "string" ? <T v="caption" muted>{right}</T> : right}
      </View>
      {children}
    </View>
  );
}

/**
 * Redak popisa (trošak, kategorija, pretplata): ikona 40, naslov, podnaslov, desno iznos ili radnja.
 * Tanka crta iznad (osim prvog retka), bez pozadine.
 */
export function ListRow({
  left,
  title,
  subtitle,
  right,
  first,
  onPress,
  onLongPress,
  hint,
}: {
  left?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  right?: ReactNode;
  first?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  hint?: string;
}) {
  const { fx } = useTheme();
  const body = (
    <View
      style={{
        minHeight: 64,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 10,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: fx.line,
      }}
    >
      {left}
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <T v="headline" numberOfLines={1} style={{ fontWeight: "700" }}>{title}</T>
        {typeof subtitle === "string" ? <T v="caption" muted numberOfLines={1}>{subtitle}</T> : subtitle}
      </View>
      {right}
    </View>
  );
  if (!onPress && !onLongPress) return body;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={hint}
      delayLongPress={450}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      {body}
    </Pressable>
  );
}

/** Iznos u retku (desno). */
export function RowAmount({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <T v="amount" color={color} style={{ fontWeight: "800" }}>
      {children}
    </T>
  );
}
