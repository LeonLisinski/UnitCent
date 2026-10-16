import { Alert, ScrollView, View } from "react-native";
import { Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatEur, occurrenceDate, yearMonthOf } from "@unitcent/core";
import { Calendar } from "../../src/Calendar";
import { Button, CatIcon } from "../../src/components";
import { useDb } from "../../src/data";
import { useTheme } from "../../src/theme";
import { T } from "../../src/ui";
import { deleteRecurring, listCategories, listRecurring, today } from "../../src/db/repo";
import { rescheduleReminders } from "../../src/notifications";

export default function Pretplate() {
  const { colors, radius, space } = useTheme();
  const router = useRouter();
  const day = today();
  const month = yearMonthOf(day);
  const items = useDb(() => listRecurring());
  const cats = useDb(() => listCategories());
  const catById = new Map(cats.map((c) => [c.id, c]));
  const total = items.filter((i) => i.active).reduce((s, i) => s + i.amountCents, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: space["4"], paddingBottom: space["7"], gap: space["5"] }}>
        <T v="title-1">Pretplate</T>

        <View style={{ gap: 4 }}>
          <T v="mono-label" muted>Svaki mjesec</T>
          <T v="amount-hero">{formatEur(total)}</T>
          <T v="caption" muted>{items.length} stavki</T>
        </View>

        {items.length > 0 ? <Calendar month={month} items={items} categories={cats} todayDate={day} /> : null}

        {items.length === 0 ? (
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: space["5"] }}>
            <T muted>Upišeš jednom, knjiže se same. Dodaj prvu pretplatu ili fiksni trošak.</T>
          </View>
        ) : (
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: space["4"] }}>
            {items.map((it, i) => {
              const cat = catById.get(it.categoryId ?? "");
              const next = occurrenceDate(it, month);
              const when = !next ? "ne vrijedi ovaj mjesec" : next < day ? "plaćeno" : next === day ? "danas" : `${Number(next.slice(8))}. u mjesecu`;
              return (
                <Pressable
                  key={it.id}
                  accessibilityRole="button"
                  accessibilityHint="Dugo pritisni za brisanje"
                  delayLongPress={450}
                  onLongPress={() =>
                    Alert.alert(`Obrisati „${it.name}“?`, "Već knjiženi troškovi ostaju.", [
                      { text: "Odustani", style: "cancel" },
                      {
                        text: "Obriši",
                        style: "destructive",
                        onPress: () => {
                          deleteRecurring(it.id);
                          void rescheduleReminders();
                        },
                      },
                    ])
                  }
                  style={{
                    minHeight: 64,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: colors.border,
                  }}
                >
                  <CatIcon colorToken={cat?.colorToken ?? "cat-pretplate"} icon={it.iconKey ?? cat?.icon ?? "repeat"} />
                  <View style={{ flex: 1 }}>
                    <T v="headline" numberOfLines={1}>{it.name}</T>
                    <T v="caption" muted>Mjesečno · {it.dayOfMonth}. · {when}</T>
                  </View>
                  <T v="amount">{formatEur(-it.amountCents)}</T>
                </Pressable>
              );
            })}
          </View>
        )}

        <Button variant="soft" label="Dodaj pretplatu" onPress={() => router.push("/pretplata")} />
      </ScrollView>
    </SafeAreaView>
  );
}
