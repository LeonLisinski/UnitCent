import { useState } from "react";
import { Sheet } from "../../src/Sheet";
import { View } from "react-native";
import { useRouter, type Href } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { formatEur, occurrenceDate, previousMonth, yearMonthOf, type LocalDate, type YearMonth } from "@unitcent/core";
import { Calendar } from "../../src/Calendar";
import { recurringIcon } from "../../src/BrandIcon";
import { Button, CatIcon } from "../../src/components";
import { useDb } from "../../src/data";
import { Amount, Ring, RoundButton, SwipeRow } from "../../src/fx";
import { longDate, monthTitle, nextMonthOf } from "../../src/format";
import { HERO, Hero, ListRow, MonthSwitcher, minMonth, PageHeader, RowAmount, Section, SectionLink, EmptyState, TabScreen, stepMonth, useResetMonthOnTab } from "../../src/layout";
import { useTheme } from "../../src/theme";
import { freeMinMonth, usePremium, premiumHref } from "../../src/premium";
import { T } from "../../src/ui";
import { deleteRecurring, listCategories, listRecurring, restoreRecurring, today } from "../../src/db/repo";
import { useToast } from "../../src/toast";
import { rescheduleReminders } from "../../src/notifications";

const enter = (i: number) => FadeInDown.delay(i * 70).duration(420);

/**
 * Pretplate po mjesecima: ono što vrijedi u odabranom mjesecu (po početku i kraju stavke), pa se prošli mjeseci pamte
 * (pretplatu koju si otkazao i dalje vidiš u mjesecima dok je trajala). Prsten pokazuje koliko je mjeseca plaćeno.
 */
export default function Pretplate() {
  const router = useRouter();
  const premium = usePremium();
  const { colors } = useTheme();
  const toast = useToast();
  const day = today();
  const thisMonth = yearMonthOf(day);
  const [month, setMonth] = useState<YearMonth>(thisMonth);
  useResetMonthOnTab("pretplate", thisMonth, setMonth as (m: string) => void);
  const [sheetDay, setSheetDay] = useState<LocalDate | null>(null); // dan iz kalendara (mali list)
  const items = useDb(() => listRecurring());
  const cats = useDb(() => listCategories());
  const catById = new Map(cats.map((c) => [c.id, c]));

  const isPast = month < thisMonth;
  const isFuture = month > thisMonth;

  // Što vrijedi u odabranom mjesecu (a ne samo „aktivno danas“).
  const inMonth = items.filter((i) => occurrenceDate(i, month) !== null);
  const total = inMonth.reduce((s, i) => s + i.amountCents, 0);
  const paid = isFuture
    ? 0
    : isPast
      ? total
      : inMonth.reduce((s, i) => {
          const d = occurrenceDate(i, month);
          return d && d <= day ? s + i.amountCents : s;
        }, 0);
  const paidRatio = total > 0 ? paid / total : 0;
  const count = `${inMonth.length} ${inMonth.length === 1 ? "stavka" : inMonth.length < 5 ? "stavke" : "stavki"}`;

  // Granice kretanja: od mjeseca najranijeg početka do godinu dana unaprijed.
  const earliest = minMonth();
  let latest = thisMonth;
  for (let i = 0; i < 12; i++) latest = nextMonthOf(latest);

  // Brisanje povlačenjem ulijevo, kao na Početnoj; već knjiženi troškovi ostaju.
  const remove = (id: string) => {
    deleteRecurring(id);
    void rescheduleReminders();
    toast.show("Obrisano", {
      label: "Poništi",
      run: () => {
        restoreRecurring(id);
        void rescheduleReminders();
      },
    });
  };

  const nav = { month, onChange: setMonth, min: earliest, max: latest, lockedBefore: premium ? undefined : freeMinMonth(), onLocked: () => router.push(premiumHref("history")) };

  return (
    <TabScreen onSwipe={(dir) => stepMonth(dir, nav)}>
      <Animated.View entering={enter(0)}>
        <PageHeader>
          <MonthSwitcher {...nav} />
        </PageHeader>
      </Animated.View>

      <Animated.View entering={enter(1)}>
        <Hero>
          <Ring size={HERO} remaining={paidRatio} state="ok">
            <T v="mono-label" muted>Svaki mjesec</T>
            <Amount cents={total} maxWidth={170} />
            <T v="caption" muted>{isFuture ? "predviđeno" : isPast ? "plaćeno" : `plaćeno ${Math.round(paidRatio * 100)} %`}</T>
          </Ring>
        </Hero>
      </Animated.View>

      {/* Kalendar je uvijek vidljiv (i prazan), pa je prva sekcija na istoj visini kao na ostalim tabovima. */}
      <Animated.View entering={enter(2)}>
        <Section title="Kalendar" right={<SectionLink label="+ Dodaj" accessibilityLabel="Dodaj pretplatu" onPress={() => router.push("/pretplata")} />}>
          <Calendar month={month} items={inMonth} categories={cats} todayDate={day} onDayPress={setSheetDay} />
        </Section>
      </Animated.View>

      <Animated.View entering={enter(3)}>
        <Section
          title="Stavke"
          right={
            inMonth.length > 0 ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <T v="caption" muted>{count}</T>
                <SectionLink label="+ Dodaj" accessibilityLabel="Dodaj pretplatu" onPress={() => router.push("/pretplata")} />
              </View>
            ) : undefined
          }
        >
          {inMonth.length === 0 ? (
            <EmptyState
              text={items.length === 0 ? "Upišeš jednom, knjiže se same." : "U ovom mjesecu nema pretplata."}
              action={<Button icon="plus" label="Dodaj pretplatu" onPress={() => router.push("/pretplata")} />}
            />
          ) : (
            <View>
              {[...inMonth]
                .sort((a, b) => a.dayOfMonth - b.dayOfMonth)
                .map((it, i) => {
                  const cat = catById.get(it.categoryId ?? "");
                  const d = occurrenceDate(it, month)!;
                  const dn = Number(d.slice(8));
                  const diff = !isPast && !isFuture ? dn - Number(day.slice(8)) : null;
                  const sub = isPast
                    ? `plaćeno ${dn}.`
                    : isFuture
                      ? `${dn}. u mjesecu`
                      : diff! < 0
                        ? `plaćeno ${dn}.`
                        : diff === 0
                          ? "danas"
                          : diff === 1
                            ? "sutra"
                            : `za ${diff} dana`;
                  const settled = isPast || (diff !== null && diff < 0);
                  const ends = it.endDate ? `${sub} · do ${it.endDate.split("-").reverse().join(". ")}.` : sub;
                  return (
                    <SwipeRow key={it.id} onDelete={() => remove(it.id)}>
                      <ListRow
                        first={i === 0}
                        left={<CatIcon colorToken={cat?.colorToken ?? "cat-pretplate"} icon={recurringIcon(it, cat?.icon)} size={40} />}
                        title={it.name}
                        subtitle={ends}
                        right={<RowAmount color={settled ? colors["ink-muted"] : undefined}>{formatEur(it.amountCents)}</RowAmount>}
                        hint="Dodirni za uređivanje, povuci ulijevo za brisanje"
                        onPress={() => router.push({ pathname: "/pretplata", params: { id: it.id } })}
                      />
                    </SwipeRow>
                  );
                })}
            </View>
          )}
        </Section>
      </Animated.View>

      {/* Dan u kalendaru: pretplate tog dana (povuci za uređivanje ili brisanje) i nova pretplata s tim danom. */}
      <Sheet visible={sheetDay !== null} title={sheetDay ? longDate(sheetDay) : ""} onClose={() => setSheetDay(null)}>
        {(() => {
          if (!sheetDay) return null;
          const onDay = inMonth.filter((it) => occurrenceDate(it, month) === sheetDay);
          const open = (id: string) => {
            setSheetDay(null);
            router.push({ pathname: "/pretplata", params: { id } });
          };
          return (
            <>
              {onDay.length === 0 ? (
                <T muted>Nema naplata.</T>
              ) : (
                <View>
                  {onDay.map((it, i) => {
                    const cat = catById.get(it.categoryId ?? "");
                    return (
                      <SwipeRow key={it.id} onDelete={() => { setSheetDay(null); remove(it.id); }} onEdit={() => open(it.id)}>
                        <ListRow
                          first={i === 0}
                          left={<CatIcon colorToken={cat?.colorToken ?? "cat-pretplate"} icon={recurringIcon(it, cat?.icon)} size={40} />}
                          title={it.name}
                          subtitle={cat?.name}
                          right={<RowAmount>{formatEur(it.amountCents)}</RowAmount>}
                          hint="Dodirni za uređivanje, povuci ulijevo za brisanje"
                          onPress={() => open(it.id)}
                        />
                      </SwipeRow>
                    );
                  })}
                </View>
              )}
              <Button
                variant="text"
                label="+ Nova pretplata"
                onPress={() => {
                  const d = sheetDay.slice(8).replace(/^0/, "");
                  setSheetDay(null);
                  router.push({ pathname: "/pretplata", params: { day: d } });
                }}
              />
            </>
          );
        })()}
      </Sheet>
    </TabScreen>
  );
}
