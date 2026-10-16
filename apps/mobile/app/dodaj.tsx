import { useEffect, useState } from "react";
import { Keyboard, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { Safe, useInsets } from "../src/safe";
import { parseAmount } from "@unitcent/core";
import { Button, CatIcon, Keypad } from "../src/components";
import { DateChip } from "../src/DateField";
import { useDb } from "../src/data";
import { Icon } from "../src/icons";
import { Glow, RoundButton } from "../src/fx";
import { fitFontSize } from "../src/format";
import { textStyle, useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";
import { addTransaction, deleteTransaction, getTransaction, listCategoriesByUsage, today, updateTransaction } from "../src/db/repo";

type Kind = "expense" | "income";

/** Cente u tekst za tipkovnicu: 1250 → "12,5", 1200 → "12". */
function centsToInput(c: number): string {
  const whole = Math.floor(c / 100);
  const frac = c % 100;
  return frac === 0 ? String(whole) : `${whole},${String(frac).padStart(2, "0").replace(/0$/, "")}`;
}

/**
 * Brzi unos: veliki iznos, mreža kategorija i tipkovnica. Kategorija se samo označi, a sprema gumb „Spremi“.
 * Kategorije su poredane po učestalosti; zapis ide u lokalnu bazu, mreža nije potrebna.
 */
export default function Dodaj() {
  const { colors, fx, space } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = id ? getTransaction(id) : null;
  const [value, setValue] = useState(editing ? centsToInput(editing.amountCents) : "");
  const [note, setNote] = useState(editing?.note ?? "");
  const [showNote, setShowNote] = useState(!!editing?.note);
  const [noteFocus, setNoteFocus] = useState(false); // tipkovnica telefona otvorena: sakrij našu numeričku, da „Spremi“ ostane vidljiv
  const [type, setType] = useState<Kind>(editing?.type ?? "expense");
  const insets = useInsets();
  // Visina tipkovnice telefona mjeri se izravno (KeyboardAvoidingView u modalu pogrešno računa pomak).
  const [kb, setKb] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillChangeFrame" : "keyboardDidShow", (e) => setKb(e.endCoordinates.height));
    const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setKb(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const [date, setDate] = useState(editing?.localDate ?? today());
  const [selected, setSelected] = useState<string | null>(editing?.categoryId ?? null);
  const cats = useDb(() => listCategoriesByUsage());

  const cents = value ? parseAmount(value) : null;

  const save = () => {
    const categoryId = selected;
    if (!cents || cents <= 0) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (editing) {
      updateTransaction(editing.id, { amountCents: cents, type, categoryId, note, localDate: date });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
      toast.show("Izmjene spremljene");
      return;
    }
    const tx = addTransaction({ amountCents: cents, type, categoryId, note, localDate: date });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
    toast.show("Spremljeno", { label: "Poništi", run: () => deleteTransaction(tx.id) });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Glow />
      <Safe sheet style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: space["4"] + 4, paddingTop: space["3"], paddingBottom: space["3"] + Math.max(0, kb - insets.bottom), gap: space["3"] }}>
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
            <View style={{ flexDirection: "row", gap: 10 }}>
              {editing ? null : <RoundButton icon="camera" label="Skeniraj račun" onPress={() => router.replace("/skeniraj" as Href)} />}
              <RoundButton icon="x" label="Zatvori" onPress={() => router.back()} />
            </View>
          </View>

          <View style={{ alignItems: "center", gap: 2 }}>
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <T
                v="amount-hero"
                color={value ? colors.ink : colors["ink-muted"]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
                style={{ fontSize: fitFontSize(`${value || "0"} €`, 300, 64), lineHeight: 70, letterSpacing: -2.5 }}
              >
                {value || "0"}
              </T>
              <T v="title-1" muted style={{ fontSize: 34, marginLeft: 6 }}>€</T>
            </View>
            <T v="caption" muted>
              {cents ? "Odaberi kategoriju i spremi" : "Upiši iznos"}
            </T>
          </View>

          {/* Kategorije (i bilješka) skroliraju samo kad ih je previše; iznos, tipkovnica i „Spremi“ su uvijek vidljivi. */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: space["2"] }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 10 }}>
            {cats.map((c) => {
              const on = selected === c.id;
              return (
                <Pressable
                  key={c.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={c.name}
                  onPress={() => setSelected(on ? null : c.id)}
                  style={({ pressed }) => ({ width: "25%", alignItems: "center", gap: 7, opacity: pressed ? 0.6 : 1 })}
                >
                  <View style={{ padding: 3, borderRadius: 999, borderWidth: 2, borderColor: on ? colors.brand : "transparent" }}>
                    <CatIcon colorToken={c.colorToken} icon={c.icon} size={44} />
                  </View>
                  <T v="caption" color={on ? colors.brand : colors.ink} style={{ fontWeight: "700", fontSize: 11.5 }} numberOfLines={1}>{c.name}</T>
                </Pressable>
              );
            })}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Nova kategorija"
              onPress={() => router.push("/kategorija")}
              style={({ pressed }) => ({ width: "25%", alignItems: "center", gap: 7, opacity: pressed ? 0.6 : 1 })}
            >
              <View style={{ padding: 3 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderStyle: "dashed", borderColor: fx.glassBorder, alignItems: "center", justifyContent: "center" }}>
                  <Icon name="plus" size={22} color={colors["ink-muted"]} />
                </View>
              </View>
              <T v="caption" muted style={{ fontWeight: "700", fontSize: 11.5 }}>Nova</T>
            </Pressable>
          </View>

          </ScrollView>

                    {showNote ? (
            <TextInput
              autoFocus
              onFocus={() => setNoteFocus(true)}
              onBlur={() => setNoteFocus(false)}
              returnKeyType="done"
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
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 }}>
              <DateChip value={date} onChange={setDate} />
              <Pressable onPress={() => setShowNote(true)} accessibilityRole="button" hitSlop={8} style={{ minHeight: 44, justifyContent: "center" }}>
                <T v="headline" color={colors.brand}>+ Bilješka</T>
              </Pressable>
            </View>
          )}
          {noteFocus ? null : <Keypad value={value} onChange={setValue} />}
          <Button label={editing ? "Spremi izmjene" : "Spremi"} disabled={!cents || cents <= 0} onPress={save} />
        </View>
      </Safe>
    </View>
  );
}
