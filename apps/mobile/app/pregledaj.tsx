import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatEur } from "@unitcent/core";
import { Button, CatIcon, Chip } from "../src/components";
import { useDb } from "../src/data";
import { Glow, RoundButton } from "../src/fx";
import { useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";
import { clearLastScan, getLastScan, type ScanItem } from "../src/scan";
import { addTransaction, listCategories, today } from "../src/db/repo";

/**
 * Pregled pročitanog računa prije spremanja: stavke po kategorijama, ispravak kategorije dodirom na stavku,
 * upozorenje ako se zbroj ne slaže. Spremanje stvara po jedan trošak za svaku kategoriju.
 * Popusti i povratna naknada bez kategorije ulaze u najveću skupinu (umanjuju je).
 */
export default function Pregledaj() {
  const { colors, fx, space } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const scan = getLastScan();
  const cats = useDb(() => listCategories());
  const catById = useMemo(() => new Map(cats.map((c) => [c.id, c])), [cats]);

  const [items, setItems] = useState<ScanItem[]>(scan?.result.items ?? []);
  const [open, setOpen] = useState<number | null>(null);

  if (!scan) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 }}>
        <T muted>Nema računa za pregled.</T>
        <Button label="Natrag" onPress={() => router.back()} />
      </View>
    );
  }
  const { result } = scan;

  /** Skupine za spremanje: kategorija → iznos. */
  const groups = (() => {
    const m = new Map<string | null, number>();
    const loose: number[] = [];
    for (const i of items) {
      if (i.category_id === null && i.line_type !== "item") loose.push(i.amount_cents);
      else m.set(i.category_id, (m.get(i.category_id) ?? 0) + i.amount_cents);
    }
    const adj = loose.reduce((s, v) => s + v, 0);
    if (adj !== 0) {
      let top: string | null | undefined;
      for (const [k, v] of m) if (top === undefined || v > (m.get(top) ?? 0)) top = k;
      m.set(top ?? null, (m.get(top ?? null) ?? 0) + adj);
    }
    return [...m.entries()].filter(([, v]) => v > 0);
  })();
  const total = groups.reduce((s, [, v]) => s + v, 0);

  const setCat = (index: number, id: string | null) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, category_id: id } : it)));
    setOpen(null);
    void Haptics.selectionAsync();
  };

  const save = () => {
    const date = result.date ?? scan.qr?.date ?? today();
    for (const [categoryId, cents] of groups) {
      addTransaction({ amountCents: cents, categoryId, note: result.merchant ?? undefined, merchant: result.merchant, localDate: date, source: "scan" });
    }
    clearLastScan();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.dismissAll();
    toast.show(`Spremljeno · ${formatEur(total)}`);
  };

  const warn = result.status === "review" ? result.reasons.filter((r) => !r.startsWith("Neke stavke")) : [];
  const unassigned = items.filter((i) => i.category_id === null && i.line_type === "item").length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Glow />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: space["4"] + 4, paddingTop: space["3"], paddingBottom: space["3"], gap: space["3"] }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <T v="title-1" style={{ fontSize: 26, lineHeight: 32 }}>Pregledaj račun</T>
            <RoundButton icon="x" label="Zatvori" onPress={() => { clearLastScan(); router.back(); }} />
          </View>

          <View style={{ gap: 2 }}>
            <T v="caption" muted numberOfLines={1}>
              {[result.merchant, result.date ? result.date.split("-").reverse().join(". ") + "." : null].filter(Boolean).join(" · ")}
            </T>
            <T v="amount-hero" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5} style={{ fontSize: 44, lineHeight: 50, letterSpacing: -1.6 }}>
              {formatEur(result.total_cents ?? total)}
            </T>
          </View>

          {warn.length > 0 ? (
            <View style={{ padding: 12, borderRadius: 16, backgroundColor: "rgba(245,165,36,0.14)" }}>
              <T v="caption" color={colors.warning} style={{ fontWeight: "800" }}>Provjeri račun</T>
              <T v="caption" color={colors.warning}>{warn.join(". ")}.</T>
            </View>
          ) : null}

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {items.map((it, i) => {
              const c = it.category_id ? catById.get(it.category_id) : undefined;
              const isOpen = open === i;
              return (
                <View key={i} style={{ borderTopWidth: i === 0 ? 0 : 1, borderTopColor: fx.line }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${it.name}, ${formatEur(it.amount_cents)}. Dodirni za promjenu kategorije`}
                    onPress={() => setOpen(isOpen ? null : i)}
                    style={{ minHeight: 56, flexDirection: "row", alignItems: "center", gap: 12 }}
                  >
                    {c ? (
                      <CatIcon colorToken={c.colorToken} icon={c.icon} size={34} />
                    ) : (
                      <View style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderStyle: "dashed", borderColor: fx.glassBorder }} />
                    )}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <T v="headline" numberOfLines={1} style={{ fontWeight: "700" }}>{it.name}</T>
                      <T v="caption" muted numberOfLines={1}>
                        {it.line_type === "discount" ? "Popust · " : it.line_type === "deposit" ? "Povratna naknada · " : ""}
                        {c?.name ?? "Odaberi kategoriju"}
                      </T>
                    </View>
                    <T v="amount" color={it.amount_cents < 0 ? colors.brand : colors.ink} style={{ fontWeight: "800" }}>
                      {formatEur(it.amount_cents)}
                    </T>
                  </Pressable>
                  {isOpen ? (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 12 }}>
                      {cats.map((cat) => (
                        <Chip
                          key={cat.id}
                          label={cat.name}
                          selected={it.category_id === cat.id}
                          onPress={() => setCat(i, cat.id)}
                          left={<CatIcon colorToken={cat.colorToken} icon={cat.icon} size={26} />}
                        />
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>

          <View style={{ gap: 6 }}>
            {unassigned > 0 ? (
              <T v="caption" muted style={{ textAlign: "center" }}>
                {unassigned} {unassigned === 1 ? "stavka je" : "stavki je"} bez kategorije, spremit će se kao „Bez kategorije“
              </T>
            ) : null}
            <Button label={`Spremi · ${formatEur(total)}`} disabled={groups.length === 0} onPress={save} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
