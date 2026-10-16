import { useMemo, useState } from "react";
import { ScrollView, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Safe } from "../src/safe";
import { POPULAR_RECURRING, type Cents } from "@unitcent/core";
import { AmountField, Button, CatIcon, Chip } from "../src/components";
import { Glow, RoundButton } from "../src/fx";
import { textStyle, useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";
import { addRecurring, bookDueRecurring, getRecurring, listCategories, updateRecurring } from "../src/db/repo";
import { rescheduleReminders } from "../src/notifications";

/** Nova pretplata ili fiksni trošak. Odabir popularne stavke popunjava naziv, dan i kategoriju. */
export default function NovaPretplata() {
  const { colors, fx, space } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const cats = useMemo(() => listCategories(), []);

  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = id ? getRecurring(id) : null;
  const [name, setName] = useState(editing?.name ?? "");
  const [amount, setAmount] = useState<{ text: string; cents: Cents | null }>(
    editing
      ? { text: editing.amountCents % 100 === 0 ? String(editing.amountCents / 100) : (editing.amountCents / 100).toFixed(2).replace(".", ","), cents: editing.amountCents }
      : { text: "", cents: null },
  );
  const [day, setDay] = useState(editing ? String(editing.dayOfMonth) : "1");
  const [categoryId, setCategoryId] = useState<string | null>(editing?.categoryId ?? null);
  const [iconKey, setIconKey] = useState<string | null>(editing?.iconKey ?? null);

  const valid = name.trim().length > 0 && (amount.cents ?? 0) > 0;

  const fill = (key: string) => {
    const p = POPULAR_RECURRING.find((x) => x.key === key);
    if (!p) return;
    setName(p.name);
    setDay(String(p.dayOfMonth));
    setIconKey(p.icon);
    setCategoryId(cats.find((c) => c.key === p.categoryKey)?.id ?? null);
    if (p.suggestedCents > 0) setAmount({ text: String(p.suggestedCents / 100).replace(".", ","), cents: p.suggestedCents });
  };

  const save = () => {
    if (!valid || amount.cents === null) return;
    const d = Math.min(31, Math.max(1, parseInt(day, 10) || 1));
    if (editing) {
      updateRecurring(editing.id, { name, amountCents: amount.cents, dayOfMonth: d, categoryId, iconKey });
      void rescheduleReminders();
      router.back();
      toast.show("Izmjene spremljene · vrijede od sljedeće naplate");
      return;
    }
    addRecurring({ name, amountCents: amount.cents, dayOfMonth: d, categoryId, iconKey });
    const booked = bookDueRecurring();
    void rescheduleReminders();
    router.back();
    toast.show(booked > 0 ? "Dodano i već knjiženo ovaj mjesec" : `Dodano · naplata ${d}. u mjesecu`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Glow />
    <Safe style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: space["4"], gap: space["4"], paddingBottom: space["7"] }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <T v="title-2">{editing ? "Uredi pretplatu" : "Dodaj pretplatu"}</T>
          <RoundButton icon="x" label="Zatvori" onPress={() => router.back()} />
        </View>

        {editing ? null : (
        <View style={{ gap: space["2"] }}>
          <T v="mono-label" muted>Popularno</T>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {POPULAR_RECURRING.map((p) => (
              <Chip key={p.key} label={p.name} selected={name === p.name} onPress={() => fill(p.key)} />
            ))}
          </View>
        </View>
        )}

        <View style={{ gap: 6 }}>
          <T v="caption" muted>Naziv</T>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="npr. Teretana"
            placeholderTextColor={colors["ink-muted"]}
            accessibilityLabel="Naziv"
            style={[
              textStyle("body"),
              {
                minHeight: 56,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: fx.glassBorder,
                backgroundColor: fx.glass,
                color: colors.ink,
                paddingHorizontal: 16,
              },
            ]}
          />
        </View>

        <View style={{ flexDirection: "row", gap: space["3"] }}>
          <View style={{ flex: 2 }}>
            <AmountField label="Iznos" value={amount.text} onChange={(text, cents) => setAmount({ text, cents })} />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <T v="caption" muted>Dan u mjesecu</T>
            <TextInput
              value={day}
              onChangeText={(t) => setDay(t.replace(/\D/g, "").slice(0, 2))}
              keyboardType="number-pad"
              accessibilityLabel="Dan u mjesecu"
              style={{
                minHeight: 56,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: fx.glassBorder,
                backgroundColor: fx.glass,
                color: colors.ink,
                fontSize: 20,
                textAlign: "center",
              }}
            />
          </View>
        </View>

        <View style={{ gap: space["2"] }}>
          <T v="caption" muted>Kategorija</T>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {cats.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                selected={categoryId === c.id}
                onPress={() => setCategoryId(c.id)}
                left={<CatIcon colorToken={c.colorToken} icon={c.icon} size={28} />}
              />
            ))}
          </View>
        </View>

        <Button label={editing ? "Spremi" : "Dodaj"} disabled={!valid} onPress={save} />
      </ScrollView>
    </Safe>
    </View>
  );
}
