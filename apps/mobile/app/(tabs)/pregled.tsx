import { useState } from "react";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  formatEur,
  monthExpenseTotal,
  percentChange,
  previousMonth,
  totalsByCategory,
  yearMonthOf,
  type YearMonth,
} from "@unitcent/core";
import { CatIcon } from "../../src/components";
import { useDb } from "../../src/data";
import { Amount, DayBars, Donut, RoundButton } from "../../src/fx";
import { monthShort, monthTitle } from "../../src/format";
import { HERO, ListRow, PageHeader, RowAmount, Section, TabScreen } from "../../src/layout";
import { useTheme } from "../../src/theme";
import { T } from "../../src/ui";
import { listCategories, listTransactionsInMonth, today } from "../../src/db/repo";

function nextMonth(ym: YearMonth): YearMonth {
  const [y, m] = ym.split("-").map(Number) as [number, number];
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

const enter = (i: number) => FadeInDown.delay(i * 70).duration(420);

/** Pregled: mjesec → krug po kategorijama → ritam po danima → kategorije s udjelom. */
export default function Pregled() {
  const { colors, fx } = useTheme();
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

  // Ritam po danima: potrošnja bez knjiženih pretplata; crta pokazuje prosječnu dnevnu potrošnju.
  const [py, pm] = month.split("-").map(Number) as [number, number];
  const dim = new Date(py, pm, 0).getDate();
  const isCurrent = month === thisMonth;
  const dayNo = isCurrent ? Number(today().slice(8)) : dim;
  const perDay = Array.from({ length: dim }, () => 0);
  for (const t of txs) if (t.type === "expense" && t.source !== "recurring") perDay[Number(t.localDate.slice(8)) - 1]! += t.amountCents;
  const variable = perDay.reduce((s, v) => s + v, 0);
  const avgPerDay = dayNo > 0 ? Math.round(variable / dayNo) : 0;

  return (
    <TabScreen>
      <Animated.View entering={enter(0)}>
        <PageHeader>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <RoundButton icon="back" label="Prethodni mjesec" onPress={() => setMonth(previousMonth(month))} />
            <T v="title-2" style={{ fontSize: 19 }}>{monthTitle(month)}</T>
            <RoundButton icon="chev" label="Sljedeći mjesec" disabled={month >= thisMonth} onPress={() => setMonth(nextMonth(month))} />
          </View>
        </PageHeader>
      </Animated.View>

      <Animated.View entering={enter(1)} style={{ alignItems: "center" }}>
        <Donut size={HERO} slices={slices}>
          <T v="mono-label" muted>Potrošeno</T>
          <Amount cents={total} maxWidth={170} />
          {change !== null && change !== 0 ? (
            <T v="caption" color={up ? colors.warning : colors.brand} style={{ fontWeight: "800" }}>
              {up ? "▲" : "▼"} {Math.abs(change)} % vs {monthShort(previousMonth(month))}
            </T>
          ) : (
            <T v="caption" muted>{change === 0 ? "isto kao prošli mjesec" : "nema usporedbe"}</T>
          )}
        </Donut>
      </Animated.View>

      {variable > 0 ? (
        <Animated.View entering={enter(2)}>
          <Section title="Po danima" right={`prosjek ${formatEur(avgPerDay)} / dan`}>
            <DayBars values={perDay} daysInMonth={dim} todayIndex={dayNo - 1} limitCents={avgPerDay} />
          </Section>
        </Animated.View>
      ) : null}

      <Animated.View entering={enter(3)}>
        <Section title="Kategorije">
          {byCat.length === 0 ? (
            <T muted>Još nema troškova u ovom mjesecu.</T>
          ) : (
            <View>
              {byCat.map((row, i) => {
                const c = row.categoryId ? catById.get(row.categoryId) : undefined;
                const col = colorOf(c?.colorToken ?? "cat-ostalo");
                const pct = total > 0 ? Math.round((row.totalCents / total) * 100) : 0;
                const share = total > 0 ? row.totalCents / total : 0;
                return (
                  <ListRow
                    key={row.categoryId ?? "none"}
                    first={i === 0}
                    left={<CatIcon colorToken={c?.colorToken ?? "cat-ostalo"} icon={c?.icon ?? "dots"} size={40} />}
                    title={c?.name ?? "Bez kategorije"}
                    subtitle={
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <View style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: fx.track, overflow: "hidden" }}>
                          <View style={{ width: `${Math.max(2, share * 100)}%`, height: "100%", borderRadius: 3, backgroundColor: col }} />
                        </View>
                        <T v="caption" muted style={{ width: 38, textAlign: "right" }}>{pct} %</T>
                      </View>
                    }
                    right={<RowAmount>{formatEur(row.totalCents)}</RowAmount>}
                  />
                );
              })}
            </View>
          )}
        </Section>
      </Animated.View>
    </TabScreen>
  );
}
