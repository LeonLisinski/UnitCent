import { useRouter, type Href } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { daysInMonth, formatEur, parseYearMonth, upcomingInMonth, yearMonthOf } from "@unitcent/core";
import { recurringIcon } from "../../src/BrandIcon";
import { Avatar, Button, CatIcon } from "../../src/components";
import { useDb } from "../../src/data";
import { Amount, Glass, MonthBar, Ring, SwipeRow, type RingState } from "../../src/fx";
import { longDate, relativeDay } from "../../src/format";
import { EmptyState, HERO, Hero, PAD, PageHeader, Section, SectionLink, TabScreen } from "../../src/layout";
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

/** Početna: pozdrav → ostalo za danas (prsten, jedini par brojeva) → mjesec (stanje + traka) → što dolazi → što je zadnje. Avatar je tih (neutralan krug), vodi na Profil. */
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
  // Kad je limit probijen, prsten je pun i crven (a ne prazan): jasnije od praznog traga s točkom.
  const remaining = limit.isOver ? 1 : limit.dailyCents > 0 ? Math.max(0, limit.leftTodayCents) / limit.dailyCents : 0;

  // Mjesec: koliko je od raspoloživog potrošeno i gdje bi trebao biti danas.
  const { y, m } = parseYearMonth(month);
  const dim = daysInMonth(y, m);
  const dayNo = Number(day.slice(8));
  const variableSpent = limit.availableCents - limit.monthLeftCents;
  const expected = (limit.availableCents * dayNo) / dim;
  const pace = expected <= 0 ? "ok" : variableSpent / expected > 1.05 ? "fast" : variableSpent / expected < 0.95 ? "slow" : "ok";
  const paceLabel = pace === "fast" ? "Brže od plana" : pace === "slow" ? "Ispod plana" : "Po planu";
  const monthOver = limit.monthLeftCents < 0;

  // Zadnje uneseno, grupirano po datumu troška (uzastopni isti datumi čine jednu skupinu).
  const sections: [string, typeof recent][] = [];
  for (const t of recent) {
    const last = sections[sections.length - 1];
    if (last && last[0] === t.localDate) last[1].push(t);
    else sections.push([t.localDate, [t]]);
  }

  const empty = recent.length === 0;
  const lastSection = (
        <Animated.View entering={enter(4)}>
          <Section
            title="Zadnje"
            right={
              recent.length > 0 ? <SectionLink label="Svi troškovi" onPress={() => router.push("/transakcije" as Href)} /> : undefined
            }
          >
            {recent.length === 0 ? (
              <EmptyState
                text="Još nema troškova."
                action={<Button icon="plus" label="Dodaj trošak" onPress={() => router.push("/dodaj")} />}
              />
            ) : (
              <View>
                {sections.map(([date, list], si) => (
                  <View key={date}>
                    {sections.length > 1 ? (
                      <T v="caption" muted style={{ marginTop: si === 0 ? 0 : 16, fontWeight: "600" }}>{relativeDay(date, day)}</T>
                    ) : null}
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
  );

  return (
    <TabScreen>
      <Animated.View entering={enter(0)}>
        <PageHeader right={<Avatar quiet size={44} initial={name?.trim()[0] ?? "?"} onPress={() => router.navigate("/profil" as Href)} />}>
          <T v="caption" muted>{longDate(day)}</T>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
            <T v="title-1" style={{ fontSize: 24, lineHeight: 32 }}>Bok</T>
            {name ? <T v="serif-accent" color={colors.brand} style={{ fontSize: 32, lineHeight: 38 }}>{name}</T> : null}
          </View>
        </PageHeader>
      </Animated.View>

      <Animated.View entering={enter(1)}>
        <Hero>
        <Ring size={HERO} remaining={remaining} state={state}>
          <T v="mono-label" muted>{limit.isOver ? "Danas preko" : "Ostalo za danas"}</T>
          <Amount cents={limit.isOver ? limit.overByCents : limit.leftTodayCents} color={limit.isOver ? colors.danger : colors.ink} maxWidth={170} />
          <T v="caption" muted numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>od {formatEur(limit.dailyCents)} danas</T>
        </Ring>
        </Hero>
      </Animated.View>

      {/* Bez troškova: prazno stanje odmah ispod prstena, na istoj visini kao na Pregledu. */}
      {empty ? lastSection : null}

      <Animated.View entering={enter(2)}>
        {/* Mjesec bez brojeva (jedini par brojeva na ekranu je u prstenu): stanje desno od oznake i traka.
            Dodir vodi na Pregled, gdje su iznosi mjeseca. */}
        <Section
          title="Ovaj mjesec"
          right={
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: monthOver ? colors.danger : pace === "fast" ? colors.warning : colors.brand }} />
              <T v="caption" muted>{monthOver ? "Preko plana" : paceLabel}</T>
            </View>
          }
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ovaj mjesec: ${monthOver ? "preko plana" : paceLabel.toLowerCase()}, potrošeno ${formatEur(variableSpent)} od ${formatEur(limit.availableCents)}. Otvori Pregled`}
            hitSlop={{ top: 12, bottom: 12 }}
            onPress={() => router.navigate("/pregled" as Href)}
          >
            <MonthBar spent={variableSpent} available={limit.availableCents} expected={dayNo / dim} />
          </Pressable>
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
                    <CatIcon colorToken={cat?.colorToken ?? "cat-pretplate"} icon={rec ? recurringIcon(rec, cat?.icon) : (cat?.icon ?? "repeat")} size={34} />
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

      {empty ? null : lastSection}
    </TabScreen>
  );
}
