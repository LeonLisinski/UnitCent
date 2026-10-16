import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { daysInMonth, formatEur, parseYearMonth, upcomingInMonth, yearMonthOf } from "@unitcent/core";
import { CatIcon } from "../../src/components";
import { useDb } from "../../src/data";
import { Amount, Glass, MonthBar, Ring, SwipeRow, type RingState } from "../../src/fx";
import { longDate, relativeDay } from "../../src/format";
import { HERO, PAD, PageHeader, Section, TabScreen } from "../../src/layout";
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
  restoreTransaction,
  today,
} from "../../src/db/repo";

const enter = (i: number) => FadeInDown.delay(i * 70).duration(420);

/** Početna: pozdrav → današnji limit (prsten) → mjesec (traka) → što dolazi → što je zadnje. */
export default function Pocetna() {
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();

  const day = today();
  const month = yearMonthOf(day);
  const summary = useDb(() => getMonthSummary(day), [day]);
  const cats = useDb(() => listCategories());
  const recent = useDb(() => listRecentTransactions(6));
  const recurring = useDb(() => listRecurring());
  const name = useDb(() => kvGet("name"));

  const { limit } = summary;
  const catById = new Map(cats.map((c) => [c.id, c]));
  const recById = new Map(recurring.map((r) => [r.id, r]));
  const upcoming = upcomingInMonth(recurring, day, 3);

  // Stanje prstena: koliko je današnjeg limita potrošeno.
  const spentToday = limit.dailyCents - limit.leftTodayCents;
  const usedRatio = limit.dailyCents > 0 ? spentToday / limit.dailyCents : spentToday > 0 ? 2 : 0;
  const state: RingState = limit.isOver ? "over" : usedRatio >= 0.8 ? "warn" : "ok";
  const remaining = limit.dailyCents > 0 ? Math.max(0, limit.leftTodayCents) / limit.dailyCents : 0;

  // Mjesec: koliko je od raspoloživog potrošeno i gdje bi trebao biti danas.
  const { y, m } = parseYearMonth(month);
  const dim = daysInMonth(y, m);
  const dayNo = Number(day.slice(8));
  const variableSpent = limit.availableCents - limit.monthLeftCents;
  const expected = (limit.availableCents * dayNo) / dim;
  const pace = expected <= 0 ? "ok" : variableSpent / expected > 1.05 ? "fast" : variableSpent / expected < 0.95 ? "slow" : "ok";
  const paceLabel = pace === "fast" ? "Brže od plana" : pace === "slow" ? "Ispod plana" : "Po planu";
  const monthOver = limit.monthLeftCents < 0;

  const sections = new Map<string, typeof recent>();
  for (const t of recent) sections.set(t.localDate, [...(sections.get(t.localDate) ?? []), t]);

  return (
    <TabScreen>
      <Animated.View entering={enter(0)}>
        <PageHeader>
          <T v="caption" muted>{longDate(day)}</T>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
            <T v="title-1" style={{ fontSize: 24, lineHeight: 32 }}>Bok</T>
            {name ? <T v="serif-accent" color={colors.brand} style={{ fontSize: 32, lineHeight: 38 }}>{name}</T> : null}
          </View>
        </PageHeader>
      </Animated.View>

      <Animated.View entering={enter(1)} style={{ alignItems: "center" }}>
        <Ring size={HERO} remaining={remaining} state={state}>
          <T v="mono-label" muted>{limit.isOver ? "Danas si preko" : "Danas još smiješ"}</T>
          <Amount cents={limit.isOver ? -limit.overByCents : limit.leftTodayCents} color={limit.isOver ? colors.danger : colors.ink} maxWidth={170} />
          <T v="caption" muted>od {formatEur(limit.dailyCents)}</T>
        </Ring>
      </Animated.View>

      <Animated.View entering={enter(2)}>
        <Section title="Ovaj mjesec">
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
            <View style={{ gap: 2 }}>
              <T v="caption" muted>Potrošeno</T>
              <T v="amount" color={colors["ink-muted"]} style={{ fontSize: 22, lineHeight: 28, fontWeight: "800" }}>{formatEur(variableSpent)}</T>
            </View>
            <View style={{ gap: 2, alignItems: "flex-end" }}>
              <T v="caption" muted>{monthOver ? "Preko plana" : "Ostalo"}</T>
              <T v="amount" color={monthOver ? colors.danger : colors.ink} style={{ fontSize: 22, lineHeight: 28, fontWeight: "800" }}>
                {formatEur(monthOver ? -limit.monthLeftCents : limit.monthLeftCents)}
              </T>
            </View>
          </View>
          <MonthBar spent={variableSpent} available={limit.availableCents} expected={dayNo / dim} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: pace === "fast" ? colors.warning : colors.brand }} />
            <T v="caption" muted>{paceLabel} · još {limit.daysLeft} {limit.daysLeft === 1 ? "dan" : "dana"}</T>
          </View>
        </Section>
      </Animated.View>

      {upcoming.length > 0 ? (
        <Animated.View entering={enter(3)}>
          <Section title="Uskoro">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -PAD }} contentContainerStyle={{ paddingHorizontal: PAD, gap: 10 }}>
              {upcoming.map(({ item, date }) => {
                const rec = recById.get(item.id);
                const cat = catById.get(rec?.categoryId ?? "");
                const diff = Number(date.slice(8)) - dayNo;
                const when = diff === 0 ? "danas" : diff === 1 ? "sutra" : `za ${diff} dana`;
                return (
                  <Glass key={item.id} style={{ width: 136, padding: 12, gap: 8 }}>
                    <CatIcon colorToken={cat?.colorToken ?? "cat-pretplate"} icon={rec?.iconKey ?? cat?.icon ?? "repeat"} size={34} />
                    <View style={{ gap: 2 }}>
                      <T v="headline" numberOfLines={1}>{item.name}</T>
                      <T v="caption" muted>{when}</T>
                      <T v="amount" style={{ fontSize: 17, marginTop: 2 }}>{formatEur(item.amountCents)}</T>
                    </View>
                  </Glass>
                );
              })}
            </ScrollView>
          </Section>
        </Animated.View>
      ) : null}

      <Animated.View entering={enter(4)}>
        <Section title="Zadnje">
          {recent.length === 0 ? (
            <T muted>Još nema troškova. Dodaj prvi s +.</T>
          ) : (
            <View>
              {[...sections.entries()].map(([date, list], si) => (
                <View key={date}>
                  <T v="caption" muted style={{ marginTop: si === 0 ? 0 : 16, fontWeight: "600" }}>{relativeDay(date, day)}</T>
                  {list.map((t, i) => (
                    <SwipeRow
                      key={t.id}
                      onDelete={() => {
                        deleteTransaction(t.id);
                        toast.show("Obrisano", { label: "Poništi", run: () => restoreTransaction(t.id) });
                      }}
                    >
                      <View>
                        <TxRow
                          tx={t}
                          first={i === 0}
                          category={t.categoryId ? catById.get(t.categoryId) : undefined}
                          hideDate
                          onPress={() => router.push({ pathname: "/dodaj", params: { id: t.id } })}
                        />
                      </View>
                    </SwipeRow>
                  ))}
                </View>
              ))}
            </View>
          )}
        </Section>
      </Animated.View>
    </TabScreen>
  );
}
