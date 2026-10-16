import { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { parseAmount } from "@unitcent/core";
import { CatIcon, Keypad, Segmented } from "../src/components";
import { Icon } from "../src/icons";
import { textStyle, useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";
import { addTransaction, deleteTransaction, listCategoriesByUsage } from "../src/db/repo";

/**
 * Brzi unos: iznos na tipkovnici, dodir na kategoriju odmah sprema (≤ 3 dodira).
 * Kategorije su poredane po učestalosti; zapis ide u lokalnu bazu, mreža nije potrebna.
 */
export default function Dodaj() {
  const { colors, radius, space } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const cats = useMemo(() => listCategoriesByUsage(), []);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: space["4"], gap: space["4"], paddingBottom: space["6"] }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: space["3"] }}>
          <View style={{ flex: 1 }}>
            <Segmented
              value={type}
              onChange={setType}
              options={[
                { key: "expense", label: "Trošak" },
                { key: "income", label: "Prihod" },
              ]}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Zatvori"
            onPress={() => router.back()}
            style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}
          >
            <Icon name="x" size={24} color={colors.ink} />
          </Pressable>
        </View>

        <View style={{ alignItems: "center", paddingVertical: space["3"] }}>
          <T v="amount-hero" style={{ fontSize: 56, lineHeight: 60 }} color={value ? colors.ink : colors["ink-muted"]}>
            {value || "0"} €
          </T>
          <T v="caption" muted>
            {cents ? (type === "income" ? "Dodirni kategoriju za prihod" : "Dodirni kategoriju i spremljeno je") : "Upiši iznos"}
          </T>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {cats.map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={`Spremi u ${c.name}`}
              onPress={() => save(c.id)}
              style={({ pressed }) => ({
                minHeight: 48,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingLeft: 6,
                paddingRight: 14,
                borderRadius: 999,
                backgroundColor: pressed ? colors["brand-soft"] : colors["surface-2"],
              })}
            >
              <CatIcon colorToken={c.colorToken} icon={c.icon} size={36} />
              <T v="headline">{c.name}</T>
            </Pressable>
          ))}
        </ScrollView>

        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Bilješka (npr. Konzum)"
          placeholderTextColor={colors["ink-muted"]}
          accessibilityLabel="Bilješka"
          style={[
            textStyle("body"),
            {
              minHeight: 48,
              borderRadius: radius.md,
              backgroundColor: colors["surface-2"],
              color: colors.ink,
              paddingHorizontal: 16,
            },
          ]}
        />

        <Keypad value={value} onChange={setValue} />
      </ScrollView>
    </SafeAreaView>
  );
}
