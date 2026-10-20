import { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  formatEur,
  monthExpenseTotal,
  totalsByCategory,
  yearMonthOf,
  type YearMonth,
} from "@unitcent/core";
import { AiTag, Button, CatIcon } from "../../src/components";
import { useDb } from "../../src/data";
import { Amount, DayBars, Ring, RoundButton, type RingState } from "../../src/fx";
import { monthTitle, inMonth } from "../../src/format";
import { HERO, Hero, ListRow, MonthSwitcher, minMonth, PageHeader, RowAmount, Section, SectionLink, EmptyState, TabScreen } from "../../src/layout";
import { useTheme } from "../../src/theme";
import { freeMinMonth, usePremium, premiumHref } from "../../src/premium";
import { T } from "../../src/ui";
import { Icon } from "../../src/icons";
import { useInsights } from "../../src/insights";
import { getMonthSummary, listBudgets, listCategories, listTransactionsInMonth, today } from "../../src/db/repo";

function nextMonth(ym: YearMonth): YearMonth {
  const [y, m] = ym.split("-").map(Number) as [number, number];
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

const enter = (i: number) => FadeInDown.delay(i * 70).duration(420);

/** Pregled: mjesec → prsten potrošnje (isti kao na Početnoj) → ritam po danima → kategorije s udjelom. */
export default function Pregled() {
  const { colors, fx } = useTheme();
  const router = useRouter();
  const premium = usePremium();
  const thisMonth = yearMonthOf(today());
  const [month, setMonth] = useState<YearMonth>(thisMonth);
  const earliest = minMonth();

  const cats = useDb(() => listCategories());
  // Pregled je potrošnja: knjižene pretplate se ne broje (imaju svoju karticu i već su u „obavezno“), isto kao na Početnoj.
  const txs = useDb(() => listTransactionsInMonth(month).filter((t) => t.source !== "recurring"), [month]);

  const total = monthExpenseTotal(txs, month);
  const byCat = totalsByCategory(txs, month);
  const budgets = useDb(() => listBudgets());
  const budgetOf = new Map(budgets.map((b) => [b.categoryId, b.limitCents]));
  const catById = new Map(cats.map((c) => [c.id, c]));
  const colorOf = (token: string) => (colors[token as keyof typeof colors] as string | undefined) ?? colors["ink-muted"];

  // Isti prsten kao na Početnoj i Pretplatama: puni se kako trošiš, prema iznosu za trošenje u tom mjesecu (iz plana).
  // Žuto od 80 %, crveno preko plana. Raspodjela po kategorijama je u popisu ispod.
  const available = useDb(() => getMonthSummary(month === thisMonth ? today() : `${month}-28`).limit.availableCents, [month]);
  const spentRatio = available > 0 ? total / available : total > 0 ? 1 : 0;
  const ringState: RingState = spentRatio > 1 ? "over" : spentRatio >= 0.8 ? "warn" : "ok";

  // Ritam po danima: potrošnja bez knjiženih pretplata; crta pokazuje prosječnu dnevnu potrošnju.
  const [py, pm] = month.split("-").map(Number) as [number, number];
  const dim = new Date(py, pm, 0).getDate();
  const isCurrent = month === thisMonth;
  const dayNo = isCurrent ? Number(today().slice(8)) : dim;
  const perDay = Array.from({ length: dim }, () => 0);
  for (const t of txs) if (t.type === "expense") perDay[Number(t.localDate.slice(8)) - 1]! += t.amountCents;
  const variable = perDay.reduce((s, v) => s + v, 0);
  const avgPerDay = dayNo > 0 ? Math.round(variable / dayNo) : 0;
  const maxDay = perDay.reduce((best, v, i) => (v > best.cents ? { cents: v, day: i + 1 } : best), { cents: 0, day: 0 });
  const insights = useInsights(month, variable > 0);

  return (
    <TabScreen>
      <Animated.View entering={enter(0)}>
        <PageHeader>
          <MonthSwitcher month={month} onChange={setMonth} min={earliest} max={thisMonth} lockedBefore={premium ? undefined : freeMinMonth()} onLocked={() => router.push(premiumHref("history"))} />
        </PageHeader>
      </Animated.View>

      <Animated.View entering={enter(1)}>
        <Hero>
        <Ring size={HERO} remaining={Math.min(1, spentRatio)} state={ringState}>
          <T v="mono-label" muted>Potrošeno</T>
          <Amount cents={total} maxWidth={170} />
          {/* Isti jezik kao „Dnevni budžet“ na Početnoj: ispod iznosa je ono prema čemu se prsten puni. */}
          <T v="caption" muted numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            {available > 0 ? `od ${formatEur(available)}` : inMonth(month)}
          </T>
        </Ring>
        </Hero>
      </Animated.View>

      {variable > 0 ? (
        <Animated.View entering={enter(2)}>
          <Section title="Po danima" right={`najviše ${formatEur(maxDay.cents)} · ${maxDay.day}.`}>
            <DayBars values={perDay} daysInMonth={dim} todayIndex={dayNo - 1} limitCents={avgPerDay} />
          </Section>
        </Animated.View>
      ) : null}

      {insights.status === "ok" ? (
        <Animated.View entering={enter(3)}>
          <Section title="Uvidi" right={<AiTag />}>
            <View>
              {insights.items.map((it, i) => {
                const tint = it.locked ? fx.gold : fx.ai;
                return (
                  <ListRow
                    key={it.id}
                    first={i === 0}
                    left={
                      <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: it.locked ? fx.goldSoft : fx.aiSoft }}>
                        <Icon name={it.locked ? "lock" : it.icon} size={20} color={tint} />
                      </View>
                    }
                    title={it.locked ? "Uvid za Premium" : it.title ?? ""}
                    subtitle={it.locked ? undefined : <T v="caption" muted>{it.body}</T>}
                    onPress={it.locked ? () => router.push(premiumHref("insights")) : undefined}
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
            byCat.length > 0 ? <SectionLink label="Svi troškovi" onPress={() => router.push({ pathname: "/transakcije", params: { month } } as Href)} /> : undefined
          }
        >
          {byCat.length === 0 ? (
            <EmptyState
              text="Još nema troškova."
              action={<Button icon="plus" label="Dodaj trošak" onPress={() => router.push("/dodaj")} />}
            />
          ) : (
            <View>
              {byCat.map((row, i) => {
                const c = row.categoryId ? catById.get(row.categoryId) : undefined;
                const share = total > 0 ? row.totalCents / total : 0;
                // Isti ravni redak kao na Početnoj (bez trake): podnaslov je udio u potrošnji; s limitom (Premium) desno „od X“ u boji stanja.
                const limit = row.categoryId ? budgetOf.get(row.categoryId) : undefined;
                const used = limit ? row.totalCents / limit : 0;
                return (
                  <ListRow
                    key={row.categoryId ?? "none"}
                    first={i === 0}
                    left={<CatIcon colorToken={c?.colorToken ?? "cat-ostalo"} icon={c?.icon ?? "dots"} size={40} />}
                    title={c?.name ?? "Bez kategorije"}
                    subtitle={limit ? undefined : `${Math.round(share * 100)} % potrošnje`}
                    onPress={() =>
                      router.push({ pathname: "/transakcije", params: { month, categoryId: row.categoryId ?? "none" } } as Href)
                    }
                    right={
                      // Iznos; „od X“ samo kad kategorija ima limit (postotak već pokazuje traka).
                      <View style={{ alignItems: "flex-end", gap: 2 }}>
                        <RowAmount>{formatEur(row.totalCents)}</RowAmount>
                        {limit ? (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            {used >= 0.8 ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: used >= 1 ? colors.danger : colors.warning }} /> : null}
                            <T v="caption" muted>od {formatEur(limit)}</T>
                          </View>
                        ) : null}
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
