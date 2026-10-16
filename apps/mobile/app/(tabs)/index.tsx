import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatEur, upcomingInMonth } from "@unitcent/core";
import { CatIcon } from "../../src/components";
import { useDb } from "../../src/data";
import { longDate } from "../../src/format";
import { useTheme } from "../../src/theme";
import { useToast } from "../../src/toast";
import { TxRow } from "../../src/TxRow";
import { T } from "../../src/ui";
import {
  deleteTransaction,
  getMonthSummary,
  listCategories,
  listRecentTransactions,
  listRecurring,
  restoreTransaction,
  today,
} from "../../src/db/repo";

export default function Pocetna() {
  const { colors, radius, space } = useTheme();
  const toast = useToast();

  const day = today();
  const summary = useDb(() => getMonthSummary(day), [day]);
  const cats = useDb(() => listCategories());
  const recent = useDb(() => listRecentTransactions(6));
  const recurring = useDb(() => listRecurring());
  const upcoming = upcomingInMonth(recurring, day, 2);
  const recById = new Map(recurring.map((r) => [r.id, r]));

  const { limit } = summary;
  const catById = new Map(cats.map((c) => [c.id, c]));
  const over = limit.isOver;
  const usedPct = limit.availableCents > 0 ? Math.min(100, ((limit.availableCents - limit.monthLeftCents) / limit.availableCents) * 100) : 100;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: space["4"], paddingBottom: space["7"], gap: space["5"] }}>
        <View style={{ gap: 2 }}>
          <T v="caption" muted>{longDate(day)}</T>
          <T v="title-1">Bok</T>
        </View>

        {/* Limeta: jedan istaknuti trenutak po ekranu */}
        <View style={{ backgroundColor: colors.accent, borderRadius: radius.lg, padding: space["5"], gap: space["1"] }}>
          <T v="mono-label" color={colors["on-accent"]}>{over ? "Danas si preko limita" : "Danas još smiješ"}</T>
          <T v="amount-hero" color={colors["on-accent"]}>{formatEur(limit.leftTodayCents)}</T>
          <T v="caption" color={colors["on-accent"]}>
            Preporučeni dnevni trošak {formatEur(limit.dailyCents)} · još {limit.daysLeft} dana u mjesecu
          </T>
        </View>

        <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: space["4"], gap: space["3"] }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <T v="mono-label" muted>Ovaj mjesec</T>
            <T v="caption" muted>od {formatEur(limit.availableCents)}</T>
          </View>
          <T v="headline">Ostalo {formatEur(limit.monthLeftCents)}</T>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: colors["surface-2"], overflow: "hidden" }}>
            <View
              style={{
                width: `${usedPct}%`,
                height: "100%",
                borderRadius: 4,
                backgroundColor: limit.monthLeftCents < 0 ? colors.danger : colors.brand,
              }}
            />
          </View>
        </View>

        {upcoming.length > 0 ? (
          <View style={{ gap: space["2"] }}>
            <T v="title-2">Uskoro naplata</T>
            <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: space["4"] }}>
              {upcoming.map(({ item, date }) => {
                const cat = catById.get(recById.get(item.id)?.categoryId ?? "");
                const d = date === day ? "Danas" : `${Number(date.slice(8))}. u mjesecu`;
                return (
                  <View key={item.id} style={{ minHeight: 60, flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <CatIcon colorToken={cat?.colorToken ?? "cat-pretplate"} icon={cat?.icon ?? "repeat"} />
                    <View style={{ flex: 1 }}>
                      <T v="headline" numberOfLines={1}>{item.name}</T>
                      <T v="caption" muted>{d}</T>
                    </View>
                    <T v="amount">{formatEur(-item.amountCents)}</T>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={{ gap: space["2"] }}>
          <T v="title-2">Zadnji troškovi</T>
          {recent.length === 0 ? (
            <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: space["5"] }}>
              <T muted>Još nema troškova. Dodaj prvi s +.</T>
            </View>
          ) : (
            <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: space["4"] }}>
              {recent.map((t) => (
                <TxRow
                  key={t.id}
                  tx={t}
                  category={t.categoryId ? catById.get(t.categoryId) : undefined}
                  onLongPress={() => {
                    deleteTransaction(t.id);
                    toast.show("Obrisano", { label: "Poništi", run: () => restoreTransaction(t.id) });
                  }}
                />
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
