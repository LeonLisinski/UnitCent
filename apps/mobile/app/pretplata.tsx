import { useMemo, useState } from "react";
import { Alert, ScrollView, Switch, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { POPULAR_RECURRING, yearMonthOf, type Cents, type LocalDate } from "@unitcent/core";
import { AmountField, Button, CatIcon, Chip, TextField } from "../src/components";
import { DateField } from "../src/DateField";
import { Group } from "../src/settings";
import { ModalScreen, PAD } from "../src/layout";
import { useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";
import { addRecurring, bookDueRecurring, deleteRecurring, getRecurring, listCategories, today, updateRecurring } from "../src/db/repo";
import { rescheduleReminders } from "../src/notifications";

/** Nova ili postojeća pretplata / fiksni trošak: podaci, kategorija i razdoblje (početak i kraj). */
export default function Pretplata() {
  const { colors } = useTheme();
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
  const [start, setStart] = useState<LocalDate>(editing?.startDate ?? `${yearMonthOf(today())}-01`);
  const [hasEnd, setHasEnd] = useState(!!editing?.endDate);
  const [end, setEnd] = useState<LocalDate>(editing?.endDate ?? today());

  const rangeOk = !hasEnd || end >= start;
  const valid = name.trim().length > 0 && (amount.cents ?? 0) > 0 && rangeOk;

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
    const endDate = hasEnd ? end : null;
    if (editing) {
      updateRecurring(editing.id, { name, amountCents: amount.cents, dayOfMonth: d, categoryId, iconKey, startDate: start, endDate });
      void rescheduleReminders();
      router.back();
      toast.show("Izmjene spremljene · vrijede od sljedeće naplate");
      return;
    }
    addRecurring({ name, amountCents: amount.cents, dayOfMonth: d, categoryId, iconKey, startDate: start, endDate });
    const booked = bookDueRecurring();
    void rescheduleReminders();
    router.back();
    toast.show(booked > 0 ? "Dodano i već knjiženo ovaj mjesec" : `Dodano · naplata ${d}. u mjesecu`);
  };

  const confirmDelete = () =>
    Alert.alert(
      `Obrisati „${editing?.name}“?`,
      "Briše se iz svih mjeseci. Već knjiženi troškovi ostaju. Ako si je samo otkazao, umjesto brisanja uključi „Ima kraj“, pa ostaje u povijesti.",
      [
        { text: "Odustani", style: "cancel" },
        {
          text: "Obriši",
          style: "destructive",
          onPress: () => {
            deleteRecurring(editing!.id);
            void rescheduleReminders();
            router.back();
          },
        },
      ],
    );

  return (
    <ModalScreen
      eyebrow={editing ? "Pretplata" : "Nova"}
      title={editing ? editing.name : "Dodaj pretplatu"}
      onClose={() => router.back()}
      footer={
        <>
          <Button label={editing ? "Spremi" : "Dodaj"} disabled={!valid} onPress={save} />
          {editing ? <Button variant="danger" label="Obriši pretplatu" onPress={confirmDelete} /> : null}
        </>
      }
    >
      {editing ? null : (
        <View style={{ gap: 10 }}>
          <T v="mono-label" muted style={{ fontSize: 11, opacity: 0.8 }}>Brzi odabir</T>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -PAD }} contentContainerStyle={{ paddingHorizontal: PAD, gap: 8 }}>
            {POPULAR_RECURRING.map((p) => (
              <Chip key={p.key} label={p.name} selected={name === p.name} onPress={() => fill(p.key)} />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={{ gap: 16 }}>
        <TextField label="Naziv" value={name} onChangeText={setName} placeholder="npr. Teretana" maxLength={30} />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 2 }}>
            <AmountField label="Iznos" value={amount.text} onChange={(text, cents) => setAmount({ text, cents })} />
          </View>
          <View style={{ flex: 1 }}>
            <TextField label="Dan u mjesecu" value={day} onChangeText={(t) => setDay(t.replace(/\D/g, "").slice(0, 2))} placeholder="1" />
          </View>
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <T v="mono-label" muted style={{ fontSize: 11, opacity: 0.8 }}>Kategorija</T>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {cats.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              selected={categoryId === c.id}
              onPress={() => setCategoryId(c.id)}
              left={<CatIcon colorToken={c.colorToken} icon={c.icon} size={26} />}
            />
          ))}
        </View>
      </View>

      <Group title="Razdoblje">
        <View style={{ paddingHorizontal: 16 }}>
          <DateField plain label="Počinje" value={start} onChange={setStart} />
        </View>
        <View style={{ paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <T v="headline" style={{ fontWeight: "700" }}>Ima kraj</T>
            <T v="caption" muted>Otkazana pretplata ostaje u povijesti.</T>
          </View>
          <Switch value={hasEnd} onValueChange={setHasEnd} trackColor={{ false: colors["border-strong"], true: colors.brand }} thumbColor="#ffffff" ios_backgroundColor={colors["border-strong"]} />
        </View>
        {hasEnd ? (
          <View style={{ paddingHorizontal: 16 }}>
            <DateField plain label="Zadnja naplata" value={end} onChange={setEnd} />
            {!rangeOk ? <T v="caption" color={colors.danger} style={{ paddingBottom: 10 }}>Kraj mora biti nakon početka.</T> : null}
          </View>
        ) : null}
      </Group>
    </ModalScreen>
  );
}
