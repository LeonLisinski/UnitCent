import { Alert, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatEur, occurrenceDate, upcomingInMonth, yearMonthOf } from "@unitcent/core";
import { Calendar } from "../../src/Calendar";
import { Button, CatIcon } from "../../src/components";
import { useDb } from "../../src/data";
import { Glow } from "../../src/fx";
import { useTheme } from "../../src/theme";
import { T } from "../../src/ui";
import { deleteRecurring, listCategories, listRecurring, today } from "../../src/db/repo";
import { rescheduleReminders } from "../../src/notifications";

const enter = (i: number) => FadeInDown.delay(i * 70).duration(420);

export default function Pretplate() {
  const { colors, fx, space } = useTheme();
  const router = useRouter();
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
  const paidPct = total > 0 ? Math.round((paid / total) * 100) : 0;
  const next = upcomingInMonth(active, day, 3);

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

  const row = (it: (typeof items)[number], sub: string, i: number) => {
    const cat = catById.get(it.categoryId ?? "");
    return (
      <Pressable
        key={it.id}
        accessibilityRole="button"
        accessibilityHint="Dugo pritisni za brisanje"
        delayLongPress={450}
        onLongPress={() => confirmDelete(it.id, it.name)}
        style={{ minHeight: 64, flexDirection: "row", alignItems: "center", gap: 14, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: fx.line }}
      >
        <CatIcon colorToken={cat?.colorToken ?? "cat-pretplate"} icon={it.iconKey ?? cat?.icon ?? "repeat"} />
        <View style={{ flex: 1 }}>
          <T v="headline" numberOfLines={1} style={{ fontWeight: "700" }}>{it.name}</T>
          <T v="caption" muted>{sub}</T>
        </View>
        <T v="amount" style={{ fontWeight: "800" }}>{formatEur(-it.amountCents)}</T>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Glow />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          contentContainerStyle={{ padding: space["4"] + 4, paddingBottom: 140, gap: space["5"] }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={enter(0)} style={{ gap: space["4"] }}>
            <T v="title-1" style={{ fontSize: 30, lineHeight: 36 }}>Pretplate</T>
            <View style={{ gap: 4 }}>
              <T v="mono-label" muted>Svaki mjesec</T>
              <T v="amount-hero" style={{ fontSize: 46, lineHeight: 50, letterSpacing: -2 }}>{formatEur(total)}</T>
            </View>
            <View style={{ gap: 6 }}>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: fx.track, overflow: "hidden" }}>
                <LinearGradient
                  colors={[colors.brand, fx.accent2]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ width: `${paidPct}%`, height: "100%", borderRadius: 3 }}
                />
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <T v="mono-label" muted>plaćeno {paidPct} %</T>
                <T v="mono-label" muted>{items.length} stavki</T>
              </View>
            </View>
          </Animated.View>

          {items.length > 0 ? (
            <Animated.View entering={enter(1)}>
              <Calendar month={month} items={items} categories={cats} todayDate={day} />
            </Animated.View>
          ) : null}

          {next.length > 0 ? (
            <Animated.View entering={enter(2)} style={{ gap: 4 }}>
              <T v="mono-label" muted>Sljedeće</T>
              <View>
                {next.map(({ item, date }, i) => {
                  const rec = items.find((r) => r.id === item.id)!;
                  const d = Number(date.slice(8)) - Number(day.slice(8));
                  return row(rec, d === 0 ? "danas" : d === 1 ? "sutra" : `${Number(date.slice(8))}. u mjesecu`, i);
                })}
              </View>
            </Animated.View>
          ) : null}

          <Animated.View entering={enter(3)} style={{ gap: 4 }}>
            <T v="mono-label" muted>Sve stavke</T>
            {items.length === 0 ? (
              <T muted>Upišeš jednom, knjiže se same. Dodaj prvu pretplatu ili fiksni trošak.</T>
            ) : (
              <View>{items.map((it, i) => row(it, `Mjesečno · ${it.dayOfMonth}.`, i))}</View>
            )}
          </Animated.View>

          <Button variant="soft" label="Dodaj pretplatu" onPress={() => router.push("/pretplata")} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
