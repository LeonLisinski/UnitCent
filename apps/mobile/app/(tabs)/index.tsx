import { View } from "react-native";
import { formatEur, summarizeMonth, type RecurringItem, type TxLike } from "@unitcent/core";
import { Screen, T } from "../../src/ui";
import { useTheme } from "../../src/theme";

/*
 * UZORAK do Faze 1 (lokalna baza): isti plan kao na webu i u dokumentaciji, pa se vidi da je
 * domenska logika (@unitcent/core) povezana. 1.468 − 771,33 − 150 − 207,40 = 339,27; ÷ 17 = 19,96 €.
 */
const SAMPLE_RECURRING: RecurringItem[] = [
  { id: "obavezno", name: "Obavezno (11 stavki)", amountCents: 77_133, dayOfMonth: 1, active: true, startDate: "2026-01-01" },
];
const SAMPLE_TX: TxLike[] = [
  { amountCents: 20_740, type: "expense", source: "manual", localDate: "2026-10-14" },
];

export default function Pocetna() {
  const { colors, radius, space } = useTheme();
  const r = summarizeMonth({
    plan: { incomeCents: 146_800, savingsCents: 15_000 },
    recurring: SAMPLE_RECURRING,
    transactions: SAMPLE_TX,
    today: "2026-10-15",
  });

  return (
    <Screen>
      <View style={{ gap: 2 }}>
        <T v="caption" muted>Četvrtak, 15. listopada</T>
        <T v="title-1">Bok, Luka</T>
      </View>

      {/* Limeta: jedan istaknuti trenutak po ekranu */}
      <View style={{ backgroundColor: colors.accent, borderRadius: radius.lg, padding: space["5"], gap: space["1"] }}>
        <T v="mono-label" color={colors["on-accent"]}>Preporučeni dnevni trošak</T>
        <T v="amount-hero" color={colors["on-accent"]}>{formatEur(r.dailyCents)}</T>
        <T v="caption" color={colors["on-accent"]}>Još {r.daysLeft} dana u mjesecu</T>
      </View>

      <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: space["4"], gap: space["2"] }}>
        <T v="mono-label" muted>Ovaj mjesec</T>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
          <T v="headline">Ostalo {formatEur(r.monthLeftCents)}</T>
          <T v="caption" muted>od {formatEur(r.availableCents)}</T>
        </View>
      </View>
    </Screen>
  );
}
