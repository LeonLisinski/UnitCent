import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, CatIcon, TextField } from "../src/components";
import { ModalScreen } from "../src/layout";
import { Icon } from "../src/icons";
import { useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";
import { addCategory, deleteCategory, getCategory, updateCategory } from "../src/db/repo";

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
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = id ? getCategory(id) : null;

  const [name, setName] = useState(existing?.name ?? "");
  const [color, setColor] = useState(existing?.colorToken ?? COLORS[0]!);
  const [icon, setIcon] = useState(existing?.icon ?? ICONS[0]!);
  const valid = name.trim().length > 0;

  const save = () => {
    if (!valid) return;
    if (existing) updateCategory(existing.id, { name, icon, colorToken: color });
    else addCategory({ name, icon, colorToken: color });
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
      eyebrow={existing ? "Kategorija" : "Nova"}
      title={existing ? existing.name : "Nova kategorija"}
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

      <TextField label="Naziv" value={name} onChangeText={setName} maxLength={24} autoFocus={!existing} placeholder="npr. Ljubimci" />

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
