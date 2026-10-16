import { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { parseAmount } from "@unitcent/core";
import { CatIcon, Keypad } from "../src/components";
import { Glow, RoundButton } from "../src/fx";
import { textStyle, useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";
import { addTransaction, deleteTransaction, listCategoriesByUsage } from "../src/db/repo";

type Kind = "expense" | "income";

/**
 * Brzi unos: veliki iznos, mreža kategorija i tipkovnica. Dodir na kategoriju odmah sprema (≤ 3 dodira).
 * Kategorije su poredane po učestalosti; zapis ide u lokalnu bazu, mreža nije potrebna.
 */
export default function Dodaj() {
  const { colors, fx, space } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [type, setType] = useState<Kind>("expense");
  const cats = useMemo(() => listCategoriesByUsage().slice(0, 8), []);

  const cents = value ? parseAmount(value) : null;

  const save = (categoryId: string | null) => {
    if (!cents || cents <= 0) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    const tx = addTransaction({ amountCents: cents, type, categoryId, note });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
    toast.show("Spremljeno", { label: "Poništi", run: () => deleteTransaction(tx.id) });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Glow />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: space["4"] + 4, gap: space["4"], paddingBottom: space["5"] }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", gap: 4 }}>
              {(
                [
                  ["expense", "Trošak"],
                  ["income", "Prihod"],
                ] as const
              ).map(([k, label]) => {
                const on = type === k;
                return (
                  <Pressable
                    key={k}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    onPress={() => setType(k)}
                    style={{
                      paddingHorizontal: 18,
                      minHeight: 40,
                      borderRadius: 999,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: on ? fx.glass : "transparent",
                      borderWidth: 1,
                      borderColor: on ? fx.glassBorder : "transparent",
                    }}
                  >
                    <T v="headline" muted={!on}>{label}</T>
                  </Pressable>
                );
              })}
            </View>
            <RoundButton icon="x" label="Zatvori" onPress={() => router.back()} />
          </View>

          <View style={{ alignItems: "center", paddingTop: space["3"], gap: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <T v="amount-hero" color={value ? colors.ink : colors["ink-muted"]} style={{ fontSize: 76, lineHeight: 84, letterSpacing: -4 }}>
                {value || "0"}
              </T>
              <T v="title-1" muted style={{ fontSize: 34, marginLeft: 6 }}>€</T>
            </View>
            <T v="caption" muted>
              {cents ? (type === "income" ? "Dodirni kategoriju za prihod" : "Dodirni kategoriju i spremljeno je") : "Upiši iznos"}
            </T>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 18, marginTop: space["2"] }}>
            {cats.map((c) => (
              <Pressable
                key={c.id}
                accessibilityRole="button"
                accessibilityLabel={`Spremi u ${c.name}`}
                onPress={() => save(c.id)}
                style={({ pressed }) => ({ width: "25%", alignItems: "center", gap: 7, opacity: pressed ? 0.6 : 1 })}
              >
                <CatIcon colorToken={c.colorToken} icon={c.icon} size={54} />
                <T v="caption" style={{ fontWeight: "700", fontSize: 11.5 }} numberOfLines={1}>{c.name}</T>
              </Pressable>
            ))}
          </View>

          {showNote ? (
            <TextInput
              autoFocus
              value={note}
              onChangeText={setNote}
              placeholder="Bilješka (npr. Konzum)"
              placeholderTextColor={colors["ink-muted"]}
              accessibilityLabel="Bilješka"
              style={[
                textStyle("body"),
                {
                  minHeight: 48,
                  borderRadius: 999,
                  backgroundColor: fx.glass,
                  borderWidth: 1,
                  borderColor: fx.glassBorder,
                  color: colors.ink,
                  paddingHorizontal: 18,
                },
              ]}
            />
          ) : (
            <Pressable onPress={() => setShowNote(true)} accessibilityRole="button" style={{ alignSelf: "center", minHeight: 44, justifyContent: "center" }}>
              <T v="headline" color={colors.brand}>+ Dodaj bilješku</T>
            </Pressable>
          )}

          <Keypad value={value} onChange={setValue} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
