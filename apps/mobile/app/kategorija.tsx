import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, CatIcon, TextField } from "../src/components";
import { ModalScreen } from "../src/layout";
import { Icon } from "../src/icons";
import { useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";
import { addCategory, categorySpent, deleteCategory, getBudget, getCategory, setBudget, today, updateCategory } from "../src/db/repo";
import { usePremium, premiumHref } from "../src/premium";
import { AmountField } from "../src/components";
import { useConfirmDiscard } from "../src/discard";
import { formatEur, parseAmount, yearMonthOf, type Cents } from "@unitcent/core";
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
  const initialLimit = existingBudget ? (existingBudget % 100 === 0 ? String(existingBudget / 100) : (existingBudget / 100).toFixed(2).replace(".", ",")) : "";
  const dirty = existing
    ? name !== existing.name || color !== existing.colorToken || icon !== existing.icon || limitText !== initialLimit
    : name.trim() !== "" || limitText !== "";
  const allowLeave = useConfirmDiscard(dirty);

  const save = () => {
    if (!valid) return;
    if (existing) {
      updateCategory(existing.id, { name, icon, colorToken: color });
      if (kind === "expense" && premium) setBudget(existing.id, limitCents);
    } else {
      const created = addCategory({ name, icon, colorToken: color, kind });
      if (kind === "expense" && premium && limitCents) setBudget(created.id, limitCents);
    }
    allowLeave();
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
          allowLeave();
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

      <TextField label="Naziv" value={name} onChangeText={setName} maxLength={24} autoFocus placeholder={kind === "income" ? "npr. Coaching" : "npr. Ljubimci"} />

      {kind === "income" ? null : premium ? (
        <AmountField label="Mjesečni limit (neobavezno)" value={limitText} onChange={(t) => setLimitText(t)} placeholder="npr. 200" />
      ) : (
        <LockedLimit
          color={colorOf(color)}
          spent={existing ? categorySpent(existing.id, yearMonthOf(today())) : null}
          onPress={() => router.push(premiumHref("budgets"))}
        />
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

/**
 * Limit kategorije za free korisnika: izgleda kao obično polje (ne kao reklama), s malom oznakom Premium i živim
 * pregledom na podacima te kategorije (ovaj mjesec), da se odmah vidi što limit radi. Dodir otvara Premium.
 */
function LockedLimit({ color, spent, onPress }: { color: string; spent: Cents | null; onPress: () => void }) {
  const { colors, radius, fx } = useTheme();
  // Pregled: stvarna potrošnja ove kategorije uz zaokružen primjer limita; bez podataka primjer 160 od 200 €.
  const used = spent && spent > 0 ? spent : 16000;
  const limit = spent && spent > 0 ? Math.max(5000, Math.ceil((spent * 1.25) / 5000) * 5000) : 20000;
  const ratio = Math.min(1, used / limit);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Mjesečni limit kategorije, Premium. Javimo ti na 80 i 100 posto."
      onPress={onPress}
      style={({ pressed }) => ({ gap: 6, opacity: pressed ? 0.7 : 1 })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <T v="caption" muted>Mjesečni limit</T>
        <View style={{ paddingHorizontal: 7, paddingVertical: 1, borderRadius: 999, backgroundColor: fx.goldSoft, flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Icon name="lock" size={10} color={fx.gold} stroke={2.4} />
          <T v="mono-label" color={fx.gold} style={{ fontSize: 9.5, lineHeight: 14 }}>PREMIUM</T>
        </View>
      </View>
      <View style={{ minHeight: 56, borderRadius: radius.md, borderWidth: 1.5, borderColor: fx.glassBorder, backgroundColor: fx.glass, paddingHorizontal: 14, paddingVertical: 12, gap: 8, justifyContent: "center" }}>
        <T v="headline" style={{ fontWeight: "700" }}>
          {formatEur(used)} <T v="caption" muted>od {formatEur(limit)}</T>
        </T>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: fx.track, overflow: "hidden" }}>
          <View style={{ width: `${Math.round(ratio * 100)}%`, height: 6, borderRadius: 3, backgroundColor: ratio >= 0.8 ? colors.warning : color }} />
        </View>
      </View>
      <T v="caption" muted>Javimo ti kad potrošiš 80 % i 100 %.</T>
    </Pressable>
  );
}
