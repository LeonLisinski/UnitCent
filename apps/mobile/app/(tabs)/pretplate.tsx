import { useState } from "react";
import { Alert, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { formatEur, occurrenceDate, previousMonth, yearMonthOf, type YearMonth } from "@unitcent/core";
import { Calendar } from "../../src/Calendar";
import { CatIcon } from "../../src/components";
import { useDb } from "../../src/data";
import { Amount, Ring, RoundButton } from "../../src/fx";
import { monthTitle, nextMonthOf } from "../../src/format";
import { HERO, Hero, ListRow, PageHeader, RowAmount, Section, TabScreen } from "../../src/layout";
import { useTheme } from "../../src/theme";
import { T } from "../../src/ui";
import { deleteRecurring, listCategories, listRecurring, today } from "../../src/db/repo";
import { rescheduleReminders } from "../../src/notifications";

const enter = (i: number) => FadeInDown.delay(i * 70).duration(420);

/**
 * Pretplate po mjesecima: ono što vrijedi u odabranom mjesecu (po početku i kraju stavke), pa se prošli mjeseci pamte
 * (pretplatu koju si otkazao i dalje vidiš u mjesecima dok je trajala). Prsten pokazuje koliko je mjeseca plaćeno.
 */
export default function Pretplate() {
  const router = useRouter();
  const { colors } = useTheme();
  const day = today();
  const thisMonth = yearMonthOf(day);
  const [month, setMonth] = useState<YearMonth>(thisMonth);
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
  const earliest = items.reduce<YearMonth>((min, i) => (i.startDate.slice(0, 7) < min ? i.startDate.slice(0, 7) : min), thisMonth);
  let latest = thisMonth;
  for (let i = 0; i < 12; i++) latest = nextMonthOf(latest);

  const confirmDelete = (id: string, name: string) =>
    Alert.alert(
      `Obrisati „${name}“?`,
      "Briše se iz svih mjeseci. Već knjiženi troškovi ostaju. Ako si je samo otkazao, bolje otvori stavku i postavi kraj, pa ostaje u povijesti.",
      [
        { text: "Odustani", style: "cancel" },
        {
          text: "Obriši",
          style: "destructive",
          onPress: () => {
            deleteRecurring(id);
            void rescheduleReminders();
          },
        },
      ],
    );

  return (
    <TabScreen>
      <Animated.View entering={enter(0)}>
        <PageHeader>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <RoundButton icon="back" label="Prethodni mjesec" disabled={month <= earliest} onPress={() => setMonth(previousMonth(month))} />
            <T v="title-2" style={{ fontSize: 19 }}>{monthTitle(month)}</T>
            <RoundButton icon="chev" label="Sljedeći mjesec" disabled={month >= latest} onPress={() => setMonth(nextMonthOf(month))} />
          </View>
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

      <Animated.View entering={enter(2)}>
        <Section
          title="Stavke"
          right={
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <T v="caption" muted>{count}</T>
              <RoundButton icon="plus" label="Dodaj pretplatu" onPress={() => router.push("/pretplata")} />
            </View>
          }
        >
          {inMonth.length === 0 ? (
            <T muted>
              {items.length === 0
                ? "Upišeš jednom, knjiže se same. Dodaj prvu pretplatu ili fiksni trošak s +."
                : "U ovom mjesecu nema pretplata."}
            </T>
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
                    <ListRow
                      key={it.id}
                      first={i === 0}
                      left={<CatIcon colorToken={cat?.colorToken ?? "cat-pretplate"} icon={it.iconKey ?? cat?.icon ?? "repeat"} size={40} />}
                      title={it.name}
                      subtitle={ends}
                      right={<RowAmount color={settled ? colors["ink-muted"] : undefined}>{formatEur(it.amountCents)}</RowAmount>}
                      hint="Dodirni za uređivanje, dugo pritisni za brisanje"
                      onPress={() => router.push({ pathname: "/pretplata", params: { id: it.id } })}
                      onLongPress={() => confirmDelete(it.id, it.name)}
                    />
                  );
                })}
            </View>
          )}
        </Section>
      </Animated.View>

      {inMonth.length > 0 ? (
        <Animated.View entering={enter(3)}>
          <Section title="Kalendar">
            <Calendar month={month} items={inMonth} categories={cats} todayDate={day} />
          </Section>
        </Animated.View>
      ) : null}
    </TabScreen>
  );
}
