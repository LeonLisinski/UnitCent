import { useState } from "react";
import { ScrollView, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  formatEur,
  monthExpenseTotal,
  percentChange,
  previousMonth,
  totalsByCategory,
  yearMonthOf,
  type YearMonth,
} from "@unitcent/core";
import { useDb } from "../../src/data";
import { Donut, Glow, RoundButton } from "../../src/fx";
import { fitFontSize, monthShort, monthTitle } from "../../src/format";
import { useTheme } from "../../src/theme";
import { T } from "../../src/ui";
import { listCategories, listTransactionsInMonth, today } from "../../src/db/repo";

function nextMonth(ym: YearMonth): YearMonth {
  const [y, m] = ym.split("-").map(Number) as [number, number];
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

const enter = (i: number) => FadeInDown.delay(i * 70).duration(420);

export default function Pregled() {
  const { colors, fx, space } = useTheme();
  const thisMonth = yearMonthOf(today());
  const [month, setMonth] = useState<YearMonth>(thisMonth);

  const cats = useDb(() => listCategories());
  const txs = useDb(() => listTransactionsInMonth(month), [month]);
  const prevTxs = useDb(() => listTransactionsInMonth(previousMonth(month)), [month]);

  const total = monthExpenseTotal(txs, month);
  const prevTotal = monthExpenseTotal(prevTxs, previousMonth(month));
  const change = percentChange(total, prevTotal);
  const byCat = totalsByCategory(txs, month);
  const catById = new Map(cats.map((c) => [c.id, c]));
  const colorOf = (token: string) => (colors[token as keyof typeof colors] as string | undefined) ?? colors["ink-muted"];

  const slices = byCat.map((r) => ({
    value: r.totalCents,
    color: colorOf((r.categoryId ? catById.get(r.categoryId)?.colorToken : undefined) ?? "cat-ostalo"),
  }));
  const up = change !== null && change > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Glow />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          contentContainerStyle={{ padding: space["4"] + 4, paddingBottom: 140, gap: space["5"] }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={enter(0)} style={{ gap: space["3"] }}>
            <T v="title-1" style={{ fontSize: 30, lineHeight: 36 }}>Pregled</T>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <RoundButton icon="back" label="Prethodni mjesec" onPress={() => setMonth(previousMonth(month))} />
              <T v="headline" style={{ fontSize: 17 }}>{monthTitle(month)}</T>
              <RoundButton icon="chev" label="Sljedeći mjesec" disabled={month >= thisMonth} onPress={() => setMonth(nextMonth(month))} />
            </View>
          </Animated.View>

          <Animated.View entering={enter(1)} style={{ alignItems: "center" }}>
            <Donut slices={slices}>
              <T v="mono-label" muted>Potrošeno</T>
              <T v="amount-hero" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5} style={{ fontSize: fitFontSize(formatEur(total), 150, 36), lineHeight: 42, letterSpacing: -1.4 }}>{formatEur(total)}</T>
              {change !== null && change !== 0 ? (
                <View
                  style={{
                    flexDirection: "row",
                    gap: 6,
                    paddingHorizontal: 11,
                    paddingVertical: 5,
                    borderRadius: 999,
                    backgroundColor: up ? "rgba(245,165,36,0.16)" : "rgba(61,214,163,0.16)",
                  }}
                >
                  <T v="caption" color={up ? colors.warning : colors.brand} style={{ fontWeight: "800" }}>
                    {up ? "▲" : "▼"} {Math.abs(change)} % vs {monthShort(previousMonth(month))}
                  </T>
                </View>
              ) : (
                <T v="caption" muted>{change === 0 ? "isto kao prošli mjesec" : "nema usporedbe"}</T>
              )}
            </Donut>
          </Animated.View>

          <Animated.View entering={enter(2)}>
            {byCat.length === 0 ? (
              <T muted style={{ textAlign: "center" }}>Još nema troškova u ovom mjesecu.</T>
            ) : (
              byCat.map((row, i) => {
                const c = row.categoryId ? catById.get(row.categoryId) : undefined;
                const col = colorOf(c?.colorToken ?? "cat-ostalo");
                const pct = total > 0 ? Math.round((row.totalCents / total) * 100) : 0;
                return (
                  <View
                    key={row.categoryId ?? "none"}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      minHeight: 60,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: fx.line,
                    }}
                  >
                    <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: col }} />
                    <View style={{ flex: 1 }}>
                      <T v="headline" style={{ fontWeight: "700" }}>{c?.name ?? "Bez kategorije"}</T>
                      <T v="caption" muted>{pct} %</T>
                    </View>
                    <T v="amount" style={{ fontWeight: "800" }}>{formatEur(row.totalCents)}</T>
                  </View>
                );
              })
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
