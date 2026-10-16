import { Alert, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { formatEur, occurrenceDate, yearMonthOf } from "@unitcent/core";
import { Calendar } from "../../src/Calendar";
import { CatIcon } from "../../src/components";
import { useDb } from "../../src/data";
import { Amount, Ring, RoundButton } from "../../src/fx";
import { monthTitle } from "../../src/format";
import { HERO, Hero, ListRow, PageHeader, RowAmount, Section, TabScreen } from "../../src/layout";
import { useTheme } from "../../src/theme";
import { T } from "../../src/ui";
import { deleteRecurring, listCategories, listRecurring, today } from "../../src/db/repo";
import { rescheduleReminders } from "../../src/notifications";

const enter = (i: number) => FadeInDown.delay(i * 70).duration(420);

/** Pretplate: mjesec (+ dodaj) → koliko je ovaj mjesec već plaćeno (isti prsten kao na početnoj) → kalendar → stavke. */
export default function Pretplate() {
  const router = useRouter();
  const { colors } = useTheme();
  const day = today();
  const month = yearMonthOf(day);
  const items = useDb(() => listRecurring());
  const cats = useDb(() => listCategories());
  const catById = new Map(cats.map((c) => [c.id, c]));

  const active = items.filter((i) => i.active);
  const total = active.reduce((s, i) => s + i.amountCents, 0);
  const paid = active.reduce((s, i) => {
    const d = occurrenceDate(i, month);
    return d && d <= day ? s + i.amountCents : s;
  }, 0);
  const paidRatio = total > 0 ? paid / total : 0;
  const count = `${items.length} ${items.length === 1 ? "stavka" : items.length < 5 ? "stavke" : "stavki"}`;

  const confirmDelete = (id: string, name: string) =>
    Alert.alert(`Obrisati „${name}“?`, "Već knjiženi troškovi ostaju.", [
      { text: "Odustani", style: "cancel" },
      {
        text: "Obriši",
        style: "destructive",
        onPress: () => {
          deleteRecurring(id);
          void rescheduleReminders();
        },
      },
    ]);

  return (
    <TabScreen>
      <Animated.View entering={enter(0)}>
        <PageHeader right={<RoundButton icon="plus" label="Dodaj pretplatu" onPress={() => router.push("/pretplata")} />}>
          <T v="title-2" style={{ fontSize: 19 }}>{monthTitle(month)}</T>
        </PageHeader>
      </Animated.View>

      <Animated.View entering={enter(1)}>
        <Hero>
        <Ring size={HERO} remaining={paidRatio} state="ok">
          <T v="mono-label" muted>Svaki mjesec</T>
          <Amount cents={total} maxWidth={170} />
          <T v="caption" muted>plaćeno {Math.round(paidRatio * 100)} %</T>
        </Ring>
        </Hero>
      </Animated.View>

      {items.length > 0 ? (
        <Animated.View entering={enter(2)}>
          <Section title="Kalendar">
            <Calendar month={month} items={items} categories={cats} todayDate={day} />
          </Section>
        </Animated.View>
      ) : null}

      <Animated.View entering={enter(3)}>
        <Section title="Stavke" right={count}>
          {items.length === 0 ? (
            <T muted>Upišeš jednom, knjiže se same. Dodaj prvu pretplatu ili fiksni trošak s +.</T>
          ) : (
            <View>
              {[...items]
                .sort((a, b) => a.dayOfMonth - b.dayOfMonth)
                .map((it, i) => {
                  const cat = catById.get(it.categoryId ?? "");
                  const d = it.active ? occurrenceDate(it, month) : null;
                  const diff = d ? Number(d.slice(8)) - Number(day.slice(8)) : null;
                  const sub =
                    diff === null ? "Neaktivno" : diff < 0 ? `plaćeno ${Number(d!.slice(8))}.` : diff === 0 ? "danas" : diff === 1 ? "sutra" : `za ${diff} dana`;
                  return (
                    <ListRow
                      key={it.id}
                      first={i === 0}
                      left={<CatIcon colorToken={cat?.colorToken ?? "cat-pretplate"} icon={it.iconKey ?? cat?.icon ?? "repeat"} size={40} />}
                      title={it.name}
                      subtitle={sub}
                      right={<RowAmount color={diff !== null && diff < 0 ? colors["ink-muted"] : undefined}>{formatEur(it.amountCents)}</RowAmount>}
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
    </TabScreen>
  );
}
