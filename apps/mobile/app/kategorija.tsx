import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, CatIcon, TextField } from "../src/components";
import { ModalScreen } from "../src/layout";
import { Icon } from "../src/icons";
import { useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";
import { addCategory, deleteCategory, getBudget, getCategory, setBudget, updateCategory } from "../src/db/repo";
import { usePremium } from "../src/premium";
import { AmountField } from "../src/components";
import { parseAmount, type Cents } from "@unitcent/core";
import type { Href } from "expo-router";

const COLORS = ["cat-hrana", "cat-auto", "cat-stan", "cat-zabava", "cat-zdravlje", "cat-pretplate", "cat-cigarete", "cat-obitelj", "cat-ostalo"];
const ICONS = [
  "cart", "car", "house", "glass", "heart", "repeat", "smoke", "gift", "cup", "fuel", "music", "bolt",
  "dumbbell", "phone", "wifi", "card", "cloud", "shield", "drop", "camera", "user", "calendar", "play", "dots",
];

/** Nova ili postojeća kategorija: naziv, boja i ikona. Radi lokalno i sinkronizira se kasnije. */
export default function Kategorija() {
  const { colors, fx } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { id, kind: kindParam } = useLocalSearchParams<{ id?: string; kind?: string }>();
  const existing = id ? getCategory(id) : null;

  const kind: "expense" | "income" = existing?.kind ?? (kindParam === "income" ? "income" : "expense");
  const [name, setName] = useState(existing?.name ?? "");
  const [color, setColor] = useState(existing?.colorToken ?? COLORS[0]!);
  const [icon, setIcon] = useState(existing?.icon ?? ICONS[0]!);
  const premium = usePremium();
  const existingBudget = existing ? getBudget(existing.id)?.limitCents ?? null : null;
  const [limitText, setLimitText] = useState(existingBudget ? (existingBudget % 100 === 0 ? String(existingBudget / 100) : (existingBudget / 100).toFixed(2).replace(".", ",")) : "");
  const limitCents: Cents | null = limitText ? parseAmount(limitText) : null;
  const valid = name.trim().length > 0;

  const save = () => {
    if (!valid) return;
    if (existing) {
      updateCategory(existing.id, { name, icon, colorToken: color });
      if (kind === "expense" && premium) setBudget(existing.id, limitCents);
    } else {
      const created = addCategory({ name, icon, colorToken: color, kind });
      if (kind === "expense" && premium && limitCents) setBudget(created.id, limitCents);
    }
    router.back();
    toast.show(existing ? "Kategorija spremljena" : "Kategorija dodana");
  };

  const remove = () =>
    Alert.alert(`Obrisati „${existing?.name}“?`, "Već uneseni troškovi ostaju, ali bez kategorije.", [
      { text: "Odustani", style: "cancel" },
      {
        text: "Obriši",
        style: "destructive",
        onPress: () => {
          deleteCategory(existing!.id);
          router.back();
        },
      },
    ]);

  const colorOf = (token: string) => (colors[token as keyof typeof colors] as string | undefined) ?? colors["ink-muted"];

  return (
    <ModalScreen
      eyebrow={kind === "income" ? "Prihod" : existing ? "Kategorija" : "Nova"}
      title={existing ? existing.name : kind === "income" ? "Nova kategorija prihoda" : "Nova kategorija"}
      onClose={() => router.back()}
      footer={
        <>
          <Button label="Spremi" disabled={!valid} onPress={save} />
          {existing ? <Button variant="danger" label="Obriši kategoriju" onPress={remove} /> : null}
        </>
      }
    >
      <View style={{ alignItems: "center", gap: 10 }}>
        <CatIcon colorToken={color} icon={icon} size={72} />
        <T v="headline" numberOfLines={1}>{name.trim() || "Naziv"}</T>
      </View>

      <TextField label="Naziv" value={name} onChangeText={setName} maxLength={24} autoFocus={!existing} placeholder={kind === "income" ? "npr. Coaching" : "npr. Ljubimci"} />

      {kind === "income" ? null : premium ? (
        <AmountField label="Mjesečni limit (neobavezno)" value={limitText} onChange={(t) => setLimitText(t)} placeholder="npr. 200" />
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/premium" as Href)}
          style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: fx.gold, backgroundColor: fx.goldSoft, opacity: pressed ? 0.7 : 1 })}
        >
          <Icon name="lock" size={20} color={fx.gold} />
          <View style={{ flex: 1 }}>
            <T v="headline" style={{ fontWeight: "700" }}>Mjesečni limit kategorije</T>
            <T v="caption" muted>Upozorenje na 80 % i 100 %. Premium.</T>
          </View>
          <Icon name="chev" size={18} color={fx.gold} />
        </Pressable>
      )}

      <View style={{ gap: 10 }}>
        <T v="mono-label" muted style={{ fontSize: 11, opacity: 0.8 }}>Boja</T>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
          {COLORS.map((c) => (
            <Pressable
              key={c}
              accessibilityRole="button"
              accessibilityLabel={`Boja ${c.replace("cat-", "")}`}
              accessibilityState={{ selected: color === c }}
              onPress={() => setColor(c)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: color === c ? colors.ink : "transparent",
              }}
            >
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colorOf(c) }} />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <T v="mono-label" muted style={{ fontSize: 11, opacity: 0.8 }}>Ikona</T>
        <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 10 }}>
          {ICONS.map((ic) => {
            const on = icon === ic;
            return (
              <Pressable
                key={ic}
                accessibilityRole="button"
                accessibilityLabel={`Ikona ${ic}`}
                accessibilityState={{ selected: on }}
                onPress={() => setIcon(ic)}
                style={{ width: "16.666%", alignItems: "center" }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: on ? fx.glass : "transparent",
                    borderWidth: 1.5,
                    borderColor: on ? colorOf(color) : "transparent",
                  }}
                >
                  <Icon name={ic} size={24} color={on ? colorOf(color) : colors["ink-muted"]} />
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ModalScreen>
  );
}
