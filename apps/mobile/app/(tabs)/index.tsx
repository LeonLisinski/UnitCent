import { ScrollView, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { daysInMonth, formatEur, parseYearMonth, upcomingInMonth, yearMonthOf } from "@unitcent/core";
import { CatIcon } from "../../src/components";
import { useDb } from "../../src/data";
import { Amount, DayBars, Glass, Glow, Ring, SwipeRow, type RingState } from "../../src/fx";
import { longDate, relativeDay } from "../../src/format";
import { useTheme } from "../../src/theme";
import { useToast } from "../../src/toast";
import { TxRow } from "../../src/TxRow";
import { T } from "../../src/ui";
import {
  deleteTransaction,
  getMonthSummary,
  kvGet,
  listCategories,
  listRecentTransactions,
  listRecurring,
  listTransactionsInMonth,
  restoreTransaction,
  today,
} from "../../src/db/repo";

const enter = (i: number) => FadeInDown.delay(i * 70).duration(420);

export default function Pocetna() {
  const { colors, fx, space } = useTheme();
  const toast = useToast();

  const day = today();
  const month = yearMonthOf(day);
  const summary = useDb(() => getMonthSummary(day), [day]);
  const cats = useDb(() => listCategories());
  const recent = useDb(() => listRecentTransactions(8));
  const recurring = useDb(() => listRecurring());
  const monthTx = useDb(() => listTransactionsInMonth(month), [month]);
  const name = useDb(() => kvGet("name"));

  const { limit } = summary;
  const catById = new Map(cats.map((c) => [c.id, c]));
  const recById = new Map(recurring.map((r) => [r.id, r]));
  const upcoming = upcomingInMonth(recurring, day, 4);

  // Stanje prstena: koliko je današnjeg limita potrošeno.
  const spentToday = limit.dailyCents - limit.leftTodayCents;
  const usedRatio = limit.dailyCents > 0 ? spentToday / limit.dailyCents : spentToday > 0 ? 2 : 0;
  const state: RingState = limit.isOver ? "over" : usedRatio >= 0.8 ? "warn" : "ok";
  const remaining = limit.dailyCents > 0 ? Math.max(0, limit.leftTodayCents) / limit.dailyCents : 0;

  // Ritam mjeseca: potrošnja po danu, bez knjiženih pretplata (kao i dnevni limit).
  const { y, m } = parseYearMonth(month);
  const dim = daysInMonth(y, m);
  const perDay = Array.from({ length: dim }, () => 0);
  for (const t of monthTx) {
    if (t.type === "expense" && t.source !== "recurring") perDay[Number(t.localDate.slice(8)) - 1]! += t.amountCents;
  }
  const dayNo = Number(day.slice(8));

  // Tempo: potrošeno do sada u odnosu na proporcionalni dio raspoloživog.
  const variableSpent = limit.availableCents - limit.monthLeftCents;
  const expected = (limit.availableCents * dayNo) / dim;
  const pace = expected <= 0 ? "ok" : variableSpent / expected > 1.05 ? "fast" : variableSpent / expected < 0.95 ? "slow" : "ok";
  const paceLabel = pace === "fast" ? "Brže od plana" : pace === "slow" ? "Ispod plana" : "Po planu";

  const sections = new Map<string, typeof recent>();
  for (const t of recent) sections.set(t.localDate, [...(sections.get(t.localDate) ?? []), t]);

  const initial = (name?.trim()[0] ?? "U").toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Glow />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: space["4"] + 4, paddingTop: space["3"], paddingBottom: 140, gap: space["5"] }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={enter(0)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <T v="caption" muted>{longDate(day)}</T>
              <T v="title-1" style={{ fontSize: 24, lineHeight: 30 }}>{name ? `Bok, ${name}` : "Bok"}</T>
            </View>
            <LinearGradient
              colors={[colors.brand, fx.accent2]}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={{ width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" }}
            >
              <T v="headline" color="#04241a" style={{ fontWeight: "800" }}>{initial}</T>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={enter(1)} style={{ alignItems: "center", gap: space["3"] }}>
            <Ring remaining={remaining} state={state}>
              <T v="mono-label" muted>{limit.isOver ? "Danas si preko" : "Danas još smiješ"}</T>
              <Amount cents={limit.isOver ? -limit.overByCents : limit.leftTodayCents} color={limit.isOver ? colors.danger : colors.ink} />
              <T v="headline" muted style={{ fontSize: 14 }}>
                od {formatEur(limit.dailyCents)} · još {limit.daysLeft} dana
              </T>
            </Ring>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: -8 }}>
              <Glass radius={999} style={{ paddingHorizontal: 14, minHeight: 38, flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: limit.monthLeftCents < 0 ? colors.danger : colors.brand }} />
                <T v="headline" style={{ fontSize: 13 }}>Mjesec: ostalo {formatEur(limit.monthLeftCents)}</T>
              </Glass>
              <Glass radius={999} style={{ paddingHorizontal: 14, minHeight: 38, justifyContent: "center" }}>
                <T v="headline" style={{ fontSize: 13 }} color={pace === "fast" ? colors.warning : colors.ink}>{paceLabel}</T>
              </Glass>
            </View>
          </Animated.View>

          <Animated.View entering={enter(2)} style={{ gap: space["2"] }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
              <T v="title-2" style={{ fontSize: 17 }}>Ritam mjeseca</T>
              <T v="mono-label" muted>limit {formatEur(limit.dailyCents)}</T>
            </View>
            <DayBars values={perDay} daysInMonth={dim} todayIndex={dayNo - 1} limitCents={limit.dailyCents} />
          </Animated.View>

          {upcoming.length > 0 ? (
            <Animated.View entering={enter(3)} style={{ gap: space["2"] }}>
              <T v="title-2" style={{ fontSize: 17 }}>Uskoro naplata</T>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -(space["4"] + 4) }} contentContainerStyle={{ paddingHorizontal: space["4"] + 4, gap: 10 }}>
                {upcoming.map(({ item, date }) => {
                  const rec = recById.get(item.id);
                  const cat = catById.get(rec?.categoryId ?? "");
                  const diff = Number(date.slice(8)) - dayNo;
                  const when = diff === 0 ? "danas" : diff === 1 ? "sutra" : `za ${diff} dana`;
                  return (
                    <Glass key={item.id} style={{ width: 152, padding: 14, gap: 10 }}>
                      <CatIcon colorToken={cat?.colorToken ?? "cat-pretplate"} icon={rec?.iconKey ?? cat?.icon ?? "repeat"} />
                      <View style={{ gap: 2 }}>
                        <T v="headline" numberOfLines={1}>{item.name}</T>
                        <T v="caption" muted>{when}</T>
                        <T v="amount" style={{ fontSize: 19, marginTop: 4 }}>{formatEur(item.amountCents)}</T>
                      </View>
                    </Glass>
                  );
                })}
              </ScrollView>
            </Animated.View>
          ) : null}

          <Animated.View entering={enter(4)} style={{ gap: space["1"] }}>
            <T v="title-2" style={{ fontSize: 17, marginBottom: 4 }}>Zadnje</T>
            {recent.length === 0 ? (
              <Glass style={{ padding: space["5"] }}>
                <T muted>Još nema troškova. Dodaj prvi s +.</T>
              </Glass>
            ) : (
              [...sections.entries()].map(([date, list]) => (
                <View key={date}>
                  <T v="mono-label" muted style={{ marginTop: 10, marginBottom: 2, fontSize: 11 }}>{relativeDay(date, day)}</T>
                  {list.map((t) => (
                    <SwipeRow
                      key={t.id}
                      onDelete={() => {
                        deleteTransaction(t.id);
                        toast.show("Obrisano", { label: "Poništi", run: () => restoreTransaction(t.id) });
                      }}
                    >
                      <View style={{ backgroundColor: colors.bg }}>
                        <TxRow tx={t} category={t.categoryId ? catById.get(t.categoryId) : undefined} hideDate />
                      </View>
                    </SwipeRow>
                  ))}
                </View>
              ))
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
