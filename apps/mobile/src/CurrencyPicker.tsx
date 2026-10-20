import { Pressable, ScrollView, View } from "react-native";
import * as Haptics from "expo-haptics";
import { CURRENCIES, currencyInfo, formatEur, type Cents } from "@unitcent/core";
import { Chip } from "./components";
import { useCurrency } from "./currency";
import { useTheme } from "./theme";
import { T } from "./ui";

/** Najčešće valute prve (zadana uvijek prva), zatim ostale. */
const COMMON = ["EUR", "USD", "GBP", "CHF", "RSD", "BAM", "HUF"];
export function currencyOrder(home: string): string[] {
  const all = CURRENCIES.map((c) => c.code);
  return [home, ...COMMON.filter((c) => c !== home), ...all.filter((c) => c !== home && !COMMON.includes(c))];
}

/** Dodirljiva oznaka valute uz iznos (npr. „€“). Strana valuta je naglašena da se vidi da se pretvara. */
export function CurrencyTag({ code, onPress, size = 17 }: { code: string; onPress: () => void; size?: number }) {
  const { colors, fx } = useTheme();
  const { home } = useCurrency();
  const foreign = code !== home;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Valuta: ${currencyInfo(code).name}. Dodirni za promjenu.`}
      hitSlop={10}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => ({
        minHeight: 32,
        paddingHorizontal: 10,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: foreign ? colors.brand : fx.glassBorder,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <T v="headline" muted={!foreign} color={foreign ? colors.brand : undefined} style={{ fontSize: size, lineHeight: Math.round(size * 1.3), fontWeight: "800" }}>
        {currencyInfo(code).symbol}
      </T>
    </Pressable>
  );
}

/** Vodoravni izbor valute (otvara se dodirom na oznaku). */
export function CurrencyChips({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const { home } = useCurrency();
  const order = currencyOrder(home);
  // Valuta s računa koje nema u popisu (npr. THB s putovanja) je odmah iza zadane, da se vidi što je prepoznato.
  const codes = order.includes(value) ? order : [order[0]!, value, ...order.slice(1)];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 8 }}>
      {codes.map((code) => (
        <Chip key={code} label={`${currencyInfo(code).symbol} ${code}`} selected={code === value} onPress={() => onChange(code)} />
      ))}
    </ScrollView>
  );
}

/** „≈ 17,24 €“ ispod stranog iznosa (iznos koji se sprema, u zadanoj valuti). */
export function ConvertedHint({ cents, from }: { cents: Cents | null; from: string }) {
  const { home, toHome } = useCurrency();
  if (from === home || !cents) return null;
  const v = toHome(cents, from);
  return (
    <View>
      <T v="caption" muted>{v === null ? "Nema tečaja za ovu valutu" : `≈ ${formatEur(v)} · po tečaju`}</T>
    </View>
  );
}
