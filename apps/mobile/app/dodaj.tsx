import { useEffect, useState } from "react";
import { Keyboard, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { Safe, useInsets } from "../src/safe";
import { currencyInfo, formatEur, parseAmount } from "@unitcent/core";
import { CurrencyChips, CurrencyTag } from "../src/CurrencyPicker";
import { useCurrency } from "../src/currency";
import { Button, CatIcon, Keypad, PremiumMark, QuotaBadge } from "../src/components";
import { refreshScanUsage, useScanQuota } from "../src/scanQuota";
import { DateChip } from "../src/DateField";
import { track } from "../src/analytics";
import { useDb } from "../src/data";
import { Icon } from "../src/icons";
import { Glow, RoundButton } from "../src/fx";
import { fitFontSize } from "../src/format";
import { textStyle, useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";
import { useConfirmDiscard } from "../src/discard";
import { addTransaction, categorySpent, defaultExpenseCategoryId, deleteTransaction, getBudget, getTransaction, kvGet, kvSet, listCategoriesByUsage, today, updateTransaction } from "../src/db/repo";

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
  const [noteText, setNote] = useState(editing?.note ?? "");
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
  const quota = useScanQuota();
  useEffect(() => void refreshScanUsage(), []);
  const [date, setDate] = useState(editing?.localDate ?? today());
  // Novi trošak kreće s „Ostalo“ (zadnje u mreži), pa se uvijek sprema s kategorijom; dodir na drugu je mijenja.
  const [selected, setSelected] = useState<string | null>(editing ? editing.categoryId : defaultExpenseCategoryId());
  const cats = useDb(() => listCategoriesByUsage(type), [type]);

  // Valuta unosa: zadana, ili strana (npr. račun u dinarima) koja se pri spremanju pretvara po tečaju.
  const { home, toHome } = useCurrency();
  const [cur, setCur] = useState(home);
  const [curOpen, setCurOpen] = useState(false);
  const typed = value ? parseAmount(value) : null;
  const foreign = cur !== home;
  const cents = typed !== null && foreign ? toHome(typed, cur) : typed;

  // Nespremljen unos: swipe dolje ili X pita prije odbacivanja (bez promjena se zatvara odmah).
  const dirty = editing
    ? value !== centsToInput(editing.amountCents) ||
      noteText !== (editing.note ?? "") ||
      type !== editing.type ||
      selected !== editing.categoryId ||
      date !== editing.localDate
    : value !== "" || noteText.trim() !== "";
  const allowLeave = useConfirmDiscard(dirty);

  // I bez preostalih skeniranja kamera se otvara; Premium se nudi tek na okidaču.
  // Jednom, nakon prvog skeniranja preko unosa, savjet za prečac: držanje + vodi ravno u kameru.
  const openCamera = () => {
    const uses = Number(kvGet("tip.scanFromAdd") ?? "0") + 1;
    kvSet("tip.scanFromAdd", String(uses));
    router.replace("/skeniraj" as Href);
    if (uses === 2) setTimeout(() => toast.show("Brži put do kamere: zadrži prst na + u donjoj traci"), 600);
  };

  const save = () => {
    let note = noteText;
    const categoryId = selected ?? (type === "expense" ? defaultExpenseCategoryId() : null);
    if (!cents || cents <= 0) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    // Strani iznos ostaje zapisan u bilješci („1.200,00 din.“), a sprema se pretvoren u zadanu valutu.
    const original = foreign && typed !== null ? formatEur(typed, { symbol: currencyInfo(cur).symbol }) : null;
    if (original) note = note.trim() ? `${note.trim()} · ${original}` : original;
    if (editing) {
      updateTransaction(editing.id, { amountCents: cents, type, categoryId, note, localDate: date });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      allowLeave();
      router.back();
      toast.show("Izmjene spremljene");
      return;
    }
    const tx = addTransaction({ amountCents: cents, type, categoryId, note, localDate: date });
    track("tx_added", { type, source: "manual", hasNote: noteText.trim().length > 0 });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    allowLeave();
    router.back();
    // Budžet kategorije (Premium): obavijest kad trošak prijeđe 80 % ili 100 % mjesečnog limita.
    let msg = "Spremljeno";
    const bud = type === "expense" && categoryId ? getBudget(categoryId) : null;
    if (bud) {
      const mo = date.slice(0, 7);
      const after = categorySpent(categoryId!, mo);
      const before = after - cents;
      const catName = cats.find((c) => c.id === categoryId)?.name ?? "Kategorija";
      if (before < bud.limitCents && after >= bud.limitCents) msg = `${catName}: limit probijen`;
      else if (before < bud.limitCents * 0.8 && after >= bud.limitCents * 0.8) msg = `${catName}: 80 % limita`;
    }
    toast.show(msg, { label: "Poništi", run: () => deleteTransaction(tx.id) });
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
                    onPress={() => {
                      if (k !== type) setSelected(k === "expense" ? defaultExpenseCategoryId() : null);
                      setType(k);
                    }}
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
              {editing ? null : (
                // Kamera je uvijek samo ulaz: kad besplatnih skeniranja nema, Premium se nudi tek u skeniranju (bez lokota ovdje).
                <View>
                  <RoundButton
                    tone="ai"
                    icon="camera"
                    label={`Skeniraj račun. ${quota.premium ? "" : `Preostalo ${Math.max(0, quota.remaining)} od ${quota.limit}`}`}
                    onPress={openCamera}
                  />
                  {quota.premium || quota.remaining <= 0 ? null : <QuotaBadge remaining={quota.remaining} limit={quota.limit} />}
                  {quota.premium ? null : <PremiumMark size={18} corner />}
                </View>
              )}
              <RoundButton icon="x" label="Zatvori" onPress={() => router.back()} />
            </View>
          </View>

          <View style={{ alignItems: "center", gap: 2 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
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
              <View style={{ marginLeft: 8 }}>
                <CurrencyTag code={cur} size={22} onPress={() => setCurOpen(!curOpen)} />
              </View>
            </View>
            {curOpen ? (
              <CurrencyChips
                value={cur}
                onChange={(c) => {
                  setCur(c);
                  setCurOpen(false);
                }}
              />
            ) : null}
            <T v="caption" muted>
              {foreign && typed
                ? cents === null
                  ? "Nema tečaja za ovu valutu"
                  : `≈ ${formatEur(cents)} · sprema se u ${home}`
                : !cents
                ? "Upiši iznos"
                : type === "expense" && (selected === null || selected === defaultExpenseCategoryId())
                  ? "Odaberi kategoriju ili spremi pod Ostalo"
                  : (cats.find((c) => c.id === selected)?.name ?? "Odaberi kategoriju i spremi")}
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
              onPress={() => router.push({ pathname: "/kategorija", params: { kind: type } } as Href)}
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
              value={noteText}
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
              {editing?.receiptId ? (
                <Pressable
                  onPress={() => router.push({ pathname: "/racun", params: { id: editing.receiptId! } } as Href)}
                  accessibilityRole="button"
                  hitSlop={8}
                  style={{ minHeight: 44, justifyContent: "center" }}
                >
                  <T v="headline" color={colors.brand}>Stavke računa</T>
                </Pressable>
              ) : (
                <Pressable onPress={() => setShowNote(true)} accessibilityRole="button" hitSlop={8} style={{ minHeight: 44, justifyContent: "center" }}>
                  <T v="headline" color={colors.brand}>+ Bilješka</T>
                </Pressable>
              )}
            </View>
          )}
          {noteFocus ? null : <Keypad value={value} onChange={setValue} />}
          <Button label={editing ? "Spremi izmjene" : "Spremi"} disabled={!cents || cents <= 0} onPress={save} />
        </View>
      </Safe>
    </View>
  );
}
