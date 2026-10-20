import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { CatIcon } from "../src/components";
import { useDb } from "../src/data";
import { Glow, RoundButton } from "../src/fx";
import { Icon } from "../src/icons";
import { ListRow } from "../src/layout";
import { Safe } from "../src/safe";
import { useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";
import { deleteCategory, listCategories, restoreCategory } from "../src/db/repo";

/**
 * Popis kategorija: dodir uređuje, ikona smeća briše jednu (uz potvrdu), a „Odaberi“ omogućuje
 * označiti više kategorija i obrisati ih odjednom. Nakon brisanja nudi se „Poništi“.
 */
export default function Kategorije() {
  const { colors, fx, space } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const cats = useDb(() => listCategories());
  const groups = [
    { kind: "expense" as const, label: "Troškovi", items: cats.filter((c) => c.kind === "expense") },
    { kind: "income" as const, label: "Prihodi", items: cats.filter((c) => c.kind === "income") },
  ];
  const [tab, setTab] = useState<"expense" | "income">("expense");
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    void Haptics.selectionAsync();
    setPicked((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };
  const stopSelecting = () => {
    setSelecting(false);
    setPicked(new Set());
  };

  const remove = (ids: string[]) => {
    const names = cats.filter((c) => ids.includes(c.id)).map((c) => c.name);
    if (ids.length === 0) return;
    Alert.alert(
      ids.length === 1 ? `Obrisati „${names[0]}“?` : `Obrisati ${ids.length} kategorije?`,
      "Već uneseni troškovi ostaju, ali bez kategorije.",
      [
        { text: "Odustani", style: "cancel" },
        {
          text: "Obriši",
          style: "destructive",
          onPress: () => {
            ids.forEach((id) => deleteCategory(id));
            stopSelecting();
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.show(ids.length === 1 ? `Obrisano: ${names[0]}` : `Obrisano: ${ids.length} kategorije`, {
              label: "Poništi",
              run: () => ids.forEach((id) => restoreCategory(id)),
            });
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Glow />
      <Safe sheet>
        <View style={{ flex: 1, paddingHorizontal: space["4"] + 4, paddingTop: space["3"], gap: space["3"] }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <T v="title-1" style={{ fontSize: 28, lineHeight: 34 }}>
              {selecting ? (picked.size === 0 ? "Odaberi" : `${picked.size} odabrano`) : "Kategorije"}
            </T>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {selecting ? (
                <>
                  <RoundButton icon="trash" label="Obriši odabrane" disabled={picked.size === 0} onPress={() => remove([...picked])} />
                  <RoundButton icon="x" label="Odustani od odabira" onPress={stopSelecting} />
                </>
              ) : (
                <>
                  <RoundButton icon="check" label="Odaberi više" onPress={() => setSelecting(true)} />
                  <RoundButton icon="x" label="Zatvori" onPress={() => router.back()} />
                </>
              )}
            </View>
          </View>
          <View style={{ flexDirection: "row", alignSelf: "center", padding: 4, borderRadius: 999, backgroundColor: fx.track, gap: 4 }}>
            {groups.map((g) => {
              const on = tab === g.kind;
              return (
                <Pressable
                  key={g.kind}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  onPress={() => {
                    if (on) return;
                    void Haptics.selectionAsync();
                    setPicked(new Set());
                    setTab(g.kind);
                  }}
                  style={{ minHeight: 44, minWidth: 120, paddingHorizontal: 18, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: on ? fx.glass : "transparent", borderWidth: 1, borderColor: on ? fx.glassBorder : "transparent" }}
                >
                  <T v="body" color={on ? colors.ink : colors["ink-muted"]} style={{ fontWeight: "800" }}>
                    {g.label} <T v="caption" muted>{g.items.length}</T>
                  </T>
                </Pressable>
              );
            })}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: space["5"] }}>
            {groups.filter((g) => g.kind === tab).map((g) => (
              <View key={g.kind} style={{ marginBottom: space["4"] }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 40 }}>
                  <T v="caption" muted>{selecting ? "Dodirni kategorije koje želiš obrisati." : ""}</T>
                  {selecting ? null : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={g.kind === "income" ? "Nova kategorija prihoda" : "Nova kategorija troška"}
                      hitSlop={8}
                      onPress={() => router.push({ pathname: "/kategorija", params: { kind: g.kind } })}
                      style={{ minHeight: 40, justifyContent: "center" }}
                    >
                      <T v="caption" color={colors.brand} style={{ fontWeight: "700" }}>+ Nova</T>
                    </Pressable>
                  )}
                </View>
              {g.items.map((c, i) => {
              const on = picked.has(c.id);
              return (
                <ListRow
                  key={c.id}
                  first={i === 0}
                  left={
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                      {selecting ? (
                        <View
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 13,
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 2,
                            borderColor: on ? colors.brand : fx.glassBorder,
                            backgroundColor: on ? colors.brand : "transparent",
                          }}
                        >
                          {on ? <Icon name="check" size={15} color={colors["on-brand"]} stroke={2.4} /> : null}
                        </View>
                      ) : null}
                      <CatIcon colorToken={c.colorToken} icon={c.icon} size={40} />
                    </View>
                  }
                  title={c.name}
                  right={
                    selecting ? undefined : (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Obriši kategoriju ${c.name}`}
                        hitSlop={6}
                        onPress={() => remove([c.id])}
                        style={({ pressed }) => ({ width: 44, height: 44, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.5 : 1 })}
                      >
                        <Icon name="trash" size={20} color={colors["ink-muted"]} />
                      </Pressable>
                    )
                  }
                  onPress={() => (selecting ? toggle(c.id) : router.push({ pathname: "/kategorija", params: { id: c.id } }))}
                  onLongPress={() => {
                    if (!selecting) {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setSelecting(true);
                      toggle(c.id);
                    }
                  }}
                />
              );
            })}
              </View>
            ))}
          </ScrollView>
        </View>
      </Safe>
    </View>
  );
}
