import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
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
import { CatIcon, tint } from "../../src/components";
import { useDb } from "../../src/data";
import { monthTitle } from "../../src/format";
import { Icon } from "../../src/icons";
import { useTheme } from "../../src/theme";
import { T } from "../../src/ui";
import { listCategories, listTransactionsInMonth, today } from "../../src/db/repo";

function nextMonth(ym: YearMonth): YearMonth {
  const [y, m] = ym.split("-").map(Number) as [number, number];
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

export default function Pregled() {
  const { colors, radius, space } = useTheme();
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
  const maxCat = byCat[0]?.totalCents ?? 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: space["4"], paddingBottom: space["7"], gap: space["5"] }}>
        <T v="title-1">Pregled</T>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Prethodni mjesec"
            onPress={() => setMonth(previousMonth(month))}
            style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}
          >
            <Icon name="back" size={22} color={colors.ink} />
          </Pressable>
          <T v="headline">{monthTitle(month)}</T>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sljedeći mjesec"
            disabled={month >= thisMonth}
            onPress={() => setMonth(nextMonth(month))}
            style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center", opacity: month >= thisMonth ? 0.3 : 1 }}
          >
            <Icon name="chev" size={22} color={colors.ink} />
          </Pressable>
        </View>

        <View style={{ gap: 4 }}>
          <T v="mono-label" muted>Potrošeno</T>
          <T v="amount-hero">{formatEur(total)}</T>
          <T v="caption" muted>
            {change === null
              ? "Nema podataka za usporedbu s prošlim mjesecom"
              : change === 0
                ? "Isto kao prošli mjesec"
                : `${Math.abs(change)} % ${change > 0 ? "više" : "manje"} nego prošli mjesec (${formatEur(prevTotal)})`}
          </T>
        </View>

        {byCat.length === 0 ? (
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: space["5"] }}>
            <T muted>Još nema troškova u ovom mjesecu.</T>
          </View>
        ) : (
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: space["4"], gap: space["4"] }}>
            {byCat.map((row) => {
              const c = row.categoryId ? catById.get(row.categoryId) : undefined;
              const colorToken = c?.colorToken ?? "cat-ostalo";
              const col = colors[colorToken as keyof typeof colors] ?? colors["ink-muted"];
              const pct = total > 0 ? Math.round((row.totalCents / total) * 100) : 0;
              return (
                <View key={row.categoryId ?? "none"} style={{ gap: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <CatIcon colorToken={colorToken} icon={c?.icon ?? "dots"} size={36} />
                    <View style={{ flex: 1 }}>
                      <T v="headline">{c?.name ?? "Bez kategorije"}</T>
                      <T v="caption" muted>{pct} %</T>
                    </View>
                    <T v="amount">{formatEur(row.totalCents)}</T>
                  </View>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: tint(col, 0.16) }}>
                    <View style={{ width: `${Math.max(3, (row.totalCents / maxCat) * 100)}%`, height: "100%", borderRadius: 3, backgroundColor: col }} />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
