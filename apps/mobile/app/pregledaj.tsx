import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Safe, useInsets, useKeyboardHeight } from "../src/safe";
import { currencyInfo, formatEur, type Cents } from "@unitcent/core";
import { ConvertedHint, CurrencyChips, CurrencyTag } from "../src/CurrencyPicker";
import { useCurrency } from "../src/currency";
import { AmountField, Button, CatIcon, Chip, TextField } from "../src/components";
import { DateField } from "../src/DateField";
import { useDb } from "../src/data";
import { Glass, Glow, RoundButton, SwipeRow, recentlySwiped } from "../src/fx";
import { useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";
import { clearLastScan, getLastScan, type ScanItem } from "../src/scan";
import { useConfirmDiscard } from "../src/discard";
import type { Category } from "../src/db/repo";
import { addTransaction, listCategories, saveReceipt, today } from "../src/db/repo";

/**
 * Pregled pročitanog računa prije spremanja: stavke po kategorijama, ispravak kategorije dodirom na stavku,
 * upozorenje ako se zbroj ne slaže. Spremanje stvara po jedan trošak za svaku kategoriju.
 * Popusti i povratna naknada bez kategorije ulaze u najveću skupinu (umanjuju je).
 */
export default function Pregledaj() {
  const { colors, fx, space } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const scan = getLastScan();
  const cats = useDb(() => listCategories("expense"));
  const catById = useMemo(() => new Map(cats.map((c) => [c.id, c])), [cats]);

  // Svaka stavka dobiva stalni ključ, pa brisanje ili uređivanje ne „premješta“ retke (ni pokaznu gestu).
  const [items, setItems] = useState<(ScanItem & { key: string })[]>(() => (scan?.result.items ?? []).map((it, k) => ({ ...it, key: `i${k}` })));
  const hintKey = useMemo(() => items[0]?.key, []); // pokazna gesta samo na prvoj stavci, jednom po otvaranju
  const [open, setOpen] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null); // stavka koja se uređuje (povlačenje udesno)
  // QR je izvor istine za datum, zatim AI; bez njih danas. Korisnik uvijek može promijeniti.
  const [date, setDate] = useState<string>(scan?.qr?.date ?? scan?.result.date ?? today());
  // Valuta računa (npr. dinari na putu): prepoznata pri čitanju ili zadana; pri spremanju se pretvara u zadanu.
  const { home, toHome } = useCurrency();
  const [cur, setCur] = useState<string>(scan?.result.currency ?? home);
  const [curOpen, setCurOpen] = useState(false);
  const sym = currencyInfo(cur).symbol;
  const money = (c: Cents) => formatEur(c, { symbol: sym });
  // Bez tečaja (rijetka valuta, a još nije bilo interneta) ne spremamo krivi iznos: korisnik bira valutu ili čeka tečaj.
  const noRate = cur !== home && toHome(100, cur) === null;
  const conv = (c: Cents) => (cur === home ? c : (toHome(c, cur) ?? c));
  // Pročitani račun je nespremljen unos: slučajan swipe dolje ne smije ga izgubiti.
  const allowLeave = useConfirmDiscard(!!scan, { title: "Odbaciti račun?", message: "Stavke s računa neće se spremiti.", onDiscard: clearLastScan });

  if (!scan) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 }}>
        <T muted>Nema računa za pregled.</T>
        <Button label="Natrag" onPress={() => router.back()} />
      </View>
    );
  }
  const { result } = scan;

  /** Skupine za spremanje: kategorija → iznos. */
  const groups = (() => {
    const m = new Map<string | null, number>();
    const loose: number[] = [];
    for (const i of items) {
      if (i.category_id === null && i.line_type !== "item") loose.push(i.amount_cents);
      else m.set(i.category_id, (m.get(i.category_id) ?? 0) + i.amount_cents);
    }
    const adj = loose.reduce((s, v) => s + v, 0);
    if (adj !== 0) {
      let top: string | null | undefined;
      for (const [k, v] of m) if (top === undefined || v > (m.get(top) ?? 0)) top = k;
      m.set(top ?? null, (m.get(top ?? null) ?? 0) + adj);
    }
    return [...m.entries()].filter(([, v]) => v > 0);
  })();
  const total = groups.reduce((s, [, v]) => s + v, 0);

  // Brisanje stavke (povlačenje ulijevo) s „Poništi“: stavka se vraća na isto mjesto.
  const removeItem = (index: number) => {
    const removed = items[index];
    if (!removed) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
    setOpen(null);
    toast.show("Stavka uklonjena", {
      label: "Poništi",
      run: () => setItems((prev) => [...prev.slice(0, index), removed, ...prev.slice(index)]),
    });
  };

  const setCat = (index: number, id: string | null) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, category_id: id } : it)));
    setOpen(null);
    void Haptics.selectionAsync();
  };

  const save = () => {
    // Sve se sprema u zadanoj valuti; izvorni iznos stranog računa ostaje u bilješci.
    const original = cur === home ? null : money(result.total_cents ?? total);
    const note = [result.merchant, original].filter(Boolean).join(" · ") || undefined;
    const receiptId = saveReceipt({
      merchant: result.merchant,
      totalCents: conv(result.total_cents ?? total),
      date,
      items: items.map((i) => ({ ...i, amount_cents: conv(i.amount_cents) })),
    });
    for (const [categoryId, cents] of groups) {
      addTransaction({ amountCents: conv(cents), categoryId, note, merchant: result.merchant, localDate: date, source: "scan", receiptId });
    }
    clearLastScan();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    allowLeave();
    router.dismissAll();
    toast.show(`Spremljeno · ${formatEur(conv(total))}`);
  };

  // Upozorenje s brojkama: korisnik odmah vidi što se ne slaže (a „Spremi“ sprema zbroj stavki).
  // Zbroj se provjerava uživo: kad korisnik ispravi ili ukloni stavku, upozorenje nestaje čim se zbroj složi.
  const itemsSum = items.reduce((s, i) => s + i.amount_cents, 0);
  const mismatch = result.total_cents !== null && Math.abs(itemsSum - result.total_cents) > 2;
  const warn = (result.status === "review" ? result.reasons.filter((r) => !r.startsWith("Neke stavke") && !r.startsWith("Zbroj stavki")) : []);
  if (mismatch) warn.unshift(`Zbroj stavki je ${money(itemsSum)}, a na računu piše ${money(result.total_cents!)}`);
  if (noRate) warn.push(`Nema tečaja za ${cur}. Spoji se na internet ili odaberi valutu`);
  const unassigned = items.filter((i) => i.category_id === null && i.line_type === "item").length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Glow />
      <Safe sheet style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: space["4"] + 4, paddingTop: space["3"], paddingBottom: space["3"], gap: space["3"] }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <T v="title-1" style={{ fontSize: 26, lineHeight: 32 }}>Pregledaj račun</T>
            <RoundButton icon="x" label="Zatvori" onPress={() => router.back()} />
          </View>

          <View style={{ gap: 2 }}>
            <T v="caption" muted numberOfLines={1}>{result.merchant ?? "Račun"}</T>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <T v="amount-hero" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5} style={{ flexShrink: 1, fontSize: 44, lineHeight: 50, letterSpacing: -1.6 }}>
                {money(result.total_cents ?? total)}
              </T>
              <CurrencyTag code={cur} onPress={() => setCurOpen(!curOpen)} />
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
            <ConvertedHint cents={result.total_cents ?? total} from={cur} />
          </View>

          <DateField label="Datum računa" value={date} onChange={setDate} />

          {warn.length > 0 ? (
            <View style={{ padding: 12, borderRadius: 16, backgroundColor: "rgba(245,165,36,0.14)" }}>
              <T v="caption" color={colors.warning} style={{ fontWeight: "800" }}>Provjeri račun</T>
              <T v="caption" color={colors.warning}>{warn.join(". ")}.</T>
            </View>
          ) : null}

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {items.map((it, i) => {
              const c = it.category_id ? catById.get(it.category_id) : undefined;
              const isOpen = open === i;
              return (
                <View key={it.key} style={{ borderTopWidth: i === 0 ? 0 : 1, borderTopColor: fx.line }}>
                  <SwipeRow onDelete={() => removeItem(i)} onEdit={() => setEditing(i)} hint={it.key === hintKey}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${it.name}, ${money(it.amount_cents)}. Dodirni za promjenu kategorije`}
                    accessibilityHint="Povuci ulijevo za brisanje, udesno za uređivanje"
                    onPress={() => !recentlySwiped() && setOpen(isOpen ? null : i)}
                    style={{ minHeight: 56, flexDirection: "row", alignItems: "center", gap: 12 }}
                  >
                    {c ? (
                      <CatIcon colorToken={c.colorToken} icon={c.icon} size={34} />
                    ) : (
                      <View style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderStyle: "dashed", borderColor: fx.glassBorder }} />
                    )}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <T v="headline" numberOfLines={1} style={{ fontWeight: "700" }}>{it.name}</T>
                      <T v="caption" muted numberOfLines={1}>
                        {it.line_type === "discount" ? "Popust · " : it.line_type === "deposit" ? "Povratna naknada · " : ""}
                        {c?.name ?? "Odaberi kategoriju"}
                      </T>
                    </View>
                    <T v="amount" color={it.amount_cents < 0 ? colors.brand : colors.ink} style={{ fontWeight: "800" }}>
                      {money(it.amount_cents)}
                    </T>
                  </Pressable>
                  </SwipeRow>
                  {isOpen ? (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 12 }}>
                      {cats.map((cat) => (
                        <Chip
                          key={cat.id}
                          label={cat.name}
                          selected={it.category_id === cat.id}
                          onPress={() => setCat(i, cat.id)}
                          left={<CatIcon colorToken={cat.colorToken} icon={cat.icon} size={26} />}
                        />
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
          <ItemEditor
            item={editing !== null ? (items[editing] ?? null) : null}
            symbol={sym}
            cats={cats}
            onClose={() => setEditing(null)}
            onSave={(patch) => {
              setItems((prev) => prev.map((it, k) => (k === editing ? { ...it, ...patch } : it)));
              setEditing(null);
              void Haptics.selectionAsync();
            }}
          />

          <View style={{ gap: 6 }}>
            {unassigned > 0 ? (
              <T v="caption" muted style={{ textAlign: "center" }}>
                {unassigned} {unassigned === 1 ? "stavka je" : "stavki je"} bez kategorije, spremit će se kao „Bez kategorije“
              </T>
            ) : null}
            <Button label={noRate ? "Spremi" : `Spremi · ${formatEur(conv(total))}`} disabled={groups.length === 0 || noRate} onPress={save} />
          </View>
        </View>
      </Safe>
    </View>
  );
}

/** Iznos za polje unosa: „12,99“ (bez predznaka; popust ostaje popust). */
const toInput = (cents: Cents) => (Math.abs(cents) / 100).toFixed(2).replace(".", ",");

/**
 * Uređivanje stavke računa (povlačenje udesno): naziv i iznos. Kartica je pri dnu i podiže se iznad tipkovnice,
 * pa su polja i „Spremi“ uvijek vidljivi.
 */
function ItemEditor({
  item,
  symbol,
  cats,
  onSave,
  onClose,
}: {
  item: ScanItem | null;
  symbol: string;
  cats: Category[];
  onSave: (patch: { name: string; amount_cents: Cents; category_id: string | null }) => void;
  onClose: () => void;
}) {
  const { colors, fx } = useTheme();
  const insets = useInsets();
  const kb = useKeyboardHeight();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [cents, setCents] = useState<Cents | null>(null);
  const [catId, setCatId] = useState<string | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  useEffect(() => {
    if (!item) return;
    setCatId(item.category_id);
    setCatOpen(false);
    setName(item.name);
    setAmount(toInput(item.amount_cents));
    setCents(Math.abs(item.amount_cents));
  }, [item]);

  const negative = item ? item.amount_cents < 0 : false;
  const valid = name.trim().length > 0 && cents !== null && cents > 0;

  return (
    <Modal visible={!!item} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }} onPress={onClose}>
        <Pressable onPress={() => undefined} style={{ paddingHorizontal: 12, paddingBottom: (kb > 0 ? kb : insets.bottom) + 12 }}>
          <Glass radius={28} style={{ padding: 20, gap: 14, backgroundColor: colors.surface }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <T v="title-2">{negative ? "Uredi popust" : "Uredi stavku"}</T>
              <RoundButton icon="x" label="Zatvori" onPress={onClose} />
            </View>
            <TextField label="Naziv" value={name} onChangeText={setName} maxLength={60} autoFocus />
            <AmountField
              label={negative ? "Iznos popusta" : "Iznos"}
              value={amount}
              onChange={(t, c) => {
                setAmount(t);
                setCents(c);
              }}
              currency={<T v="headline" muted>{symbol}</T>}
            />
            {/* Kategorija: tihi redak, dodir otvara izbor (isti uzorak kao u pregledu računa). */}
            {(() => {
              const cat = cats.find((c) => c.id === catId);
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Kategorija: ${cat?.name ?? "bez kategorije"}`}
                  onPress={() => setCatOpen(!catOpen)}
                  style={{ minHeight: 48, flexDirection: "row", alignItems: "center", gap: 12 }}
                >
                  {cat ? (
                    <CatIcon colorToken={cat.colorToken} icon={cat.icon} size={30} />
                  ) : (
                    <View style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderStyle: "dashed", borderColor: fx.glassBorder }} />
                  )}
                  <T v="headline" style={{ flex: 1 }} numberOfLines={1}>{cat?.name ?? "Odaberi kategoriju"}</T>
                  <T v="caption" muted>{catOpen ? "Zatvori" : "Promijeni"}</T>
                </Pressable>
              );
            })()}
            {catOpen ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 8 }}>
                {cats.map((cat) => (
                  <Chip
                    key={cat.id}
                    label={cat.name}
                    selected={catId === cat.id}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setCatId(cat.id);
                      setCatOpen(false);
                    }}
                    left={<CatIcon colorToken={cat.colorToken} icon={cat.icon} size={26} />}
                  />
                ))}
              </ScrollView>
            ) : null}
            <View style={{ alignItems: "center", paddingTop: 4 }}>
              <Button
                label="Spremi"
                disabled={!valid}
                onPress={() => valid && onSave({ name: name.trim(), amount_cents: negative ? -cents! : cents!, category_id: catId })}
              />
            </View>
          </Glass>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
