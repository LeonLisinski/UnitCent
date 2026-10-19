import { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter, type Href } from "expo-router";
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
import { AiTag, CatIcon } from "../../src/components";
import { useDb } from "../../src/data";
import { Amount, DayBars, Donut, RoundButton } from "../../src/fx";
import { monthShort, monthTitle } from "../../src/format";
import { HERO, Hero, ListRow, MonthSwitcher, minMonth, PageHeader, RowAmount, Section, TabScreen } from "../../src/layout";
import { useTheme } from "../../src/theme";
import { freeMinMonth, usePremium } from "../../src/premium";
import { T } from "../../src/ui";
import { Icon } from "../../src/icons";
import { useInsights } from "../../src/insights";
import { listBudgets, listCategories, listTransactionsInMonth, today } from "../../src/db/repo";

function nextMonth(ym: YearMonth): YearMonth {
  const [y, m] = ym.split("-").map(Number) as [number, number];
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

const enter = (i: number) => FadeInDown.delay(i * 70).duration(420);

/** Pregled: mjesec → krug po kategorijama → ritam po danima → kategorije s udjelom. */
export default function Pregled() {
  const { colors, fx } = useTheme();
  const router = useRouter();
  const premium = usePremium();
  const thisMonth = yearMonthOf(today());
  const [month, setMonth] = useState<YearMonth>(thisMonth);
  const earliest = minMonth();

  const cats = useDb(() => listCategories());
  const txs = useDb(() => listTransactionsInMonth(month), [month]);
  const prevTxs = useDb(() => listTransactionsInMonth(previousMonth(month)), [month]);

  const total = monthExpenseTotal(txs, month);
  const prevTotal = monthExpenseTotal(prevTxs, previousMonth(month));
  const change = percentChange(total, prevTotal);
  const byCat = totalsByCategory(txs, month);
  const budgets = useDb(() => listBudgets());
  const budgetOf = new Map(budgets.map((b) => [b.categoryId, b.limitCents]));
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
  const insights = useInsights(month, variable > 0);

  return (
    <TabScreen>
      <Animated.View entering={enter(0)}>
        <PageHeader>
          <MonthSwitcher month={month} onChange={setMonth} min={earliest} max={thisMonth} lockedBefore={premium ? undefined : freeMinMonth()} onLocked={() => router.push("/premium" as Href)} />
        </PageHeader>
      </Animated.View>

      <Animated.View entering={enter(1)}>
        <Hero>
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
        </Hero>
      </Animated.View>

      {variable > 0 ? (
        <Animated.View entering={enter(2)}>
          <Section title="Po danima" right={`prosjek ${formatEur(avgPerDay)} / dan`}>
            <DayBars values={perDay} daysInMonth={dim} todayIndex={dayNo - 1} limitCents={avgPerDay} />
          </Section>
        </Animated.View>
      ) : null}

      {insights.status === "ok" ? (
        <Animated.View entering={enter(3)}>
          <Section title="Uvidi" right={<AiTag />}>
            <View>
              {insights.items.map((it, i) => {
                const tint = it.locked ? fx.gold : it.tone === "warn" ? colors.warning : it.tone === "good" ? colors.brand : colors["ink-muted"];
                return (
                  <ListRow
                    key={it.id}
                    first={i === 0}
                    left={
                      <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: it.locked ? fx.goldSoft : fx.track }}>
                        <Icon name={it.locked ? "lock" : it.icon} size={20} color={tint} />
                      </View>
                    }
                    title={it.locked ? "Uvid za Premium" : it.title ?? ""}
                    subtitle={it.locked ? undefined : <T v="caption" muted>{it.body}</T>}
                    onPress={it.locked ? () => router.push("/premium" as Href) : undefined}
                  />
                );
              })}
            </View>
          </Section>
        </Animated.View>
      ) : null}

      <Animated.View entering={enter(4)}>
        <Section
          title="Kategorije"
          right={
            byCat.length > 0 ? (
              <Pressable accessibilityRole="button" hitSlop={10} onPress={() => router.push({ pathname: "/transakcije", params: { month } } as Href)}>
                <T v="caption" color={colors.brand} style={{ fontWeight: "700" }}>Svi troškovi</T>
              </Pressable>
            ) : undefined
          }
        >
          {byCat.length === 0 ? (
            <T muted>Još nema troškova u ovom mjesecu.</T>
          ) : (
            <View>
              {byCat.map((row, i) => {
                const c = row.categoryId ? catById.get(row.categoryId) : undefined;
                const col = colorOf(c?.colorToken ?? "cat-ostalo");
                const pct = total > 0 ? Math.round((row.totalCents / total) * 100) : 0;
                const share = total > 0 ? row.totalCents / total : 0;
                // Budžet kategorije (Premium): traka pokazuje udio limita, a boja stanje (žuto od 80 %, crveno preko 100 %).
                const limit = row.categoryId ? budgetOf.get(row.categoryId) : undefined;
                const used = limit ? row.totalCents / limit : 0;
                const barColor = limit ? (used >= 1 ? colors.danger : used >= 0.8 ? colors.warning : col) : col;
                return (
                  <ListRow
                    key={row.categoryId ?? "none"}
                    first={i === 0}
                    left={<CatIcon colorToken={c?.colorToken ?? "cat-ostalo"} icon={c?.icon ?? "dots"} size={40} />}
                    title={c?.name ?? "Bez kategorije"}
                    subtitle={
                      <View style={{ height: 5, borderRadius: 3, backgroundColor: fx.track, overflow: "hidden", marginTop: 4 }}>
                        <View style={{ width: `${Math.min(100, Math.max(2, (limit ? used : share) * 100))}%`, height: "100%", borderRadius: 3, backgroundColor: barColor }} />
                      </View>
                    }
                    onPress={() =>
                      router.push({ pathname: "/transakcije", params: { month, categoryId: row.categoryId ?? "none" } } as Href)
                    }
                    right={
                      <View style={{ alignItems: "flex-end", gap: 2 }}>
                        <RowAmount>{formatEur(row.totalCents)}</RowAmount>
                        <T v="caption" color={limit && used >= 1 ? colors.danger : undefined} muted={!(limit && used >= 1)}>
                          {limit ? `od ${formatEur(limit)}` : `${pct} %`}
                        </T>
                      </View>
                    }
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
