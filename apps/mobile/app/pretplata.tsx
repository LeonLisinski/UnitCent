import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, Switch, View } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import {
  SERVICE_PLANS,
  catalogIconKey,
  currencyInfo,
  formatEur,
  monthlyPlans,
  searchCatalog,
  suggestRecurring,
  yearMonthOf,
  type CatalogEntry,
  type Cents,
  type LocalDate,
} from "@unitcent/core";
import { AiTag, AmountField, Button, CatIcon, Chip, TextField } from "../src/components";
import { classifyRecurring } from "../src/classify";
import { usePremium } from "../src/premium";
import { recurringIcon } from "../src/BrandIcon";
import { ConvertedHint, CurrencyChips, CurrencyTag } from "../src/CurrencyPicker";
import { useCurrency } from "../src/currency";
import { useDb } from "../src/data";
import { DateField } from "../src/DateField";
import { Icon } from "../src/icons";
import { Group } from "../src/settings";
import { ModalScreen } from "../src/layout";
import { useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";
import { addRecurring, bookDueRecurring, defaultExpenseCategoryId, deleteRecurring, getRecurring, listCategories, today, updateRecurring } from "../src/db/repo";
import { rescheduleReminders } from "../src/notifications";

const centsText = (c: Cents) => (c % 100 === 0 ? String(c / 100) : (c / 100).toFixed(2).replace(".", ","));

/** Nova ili postojeća pretplata / fiksni trošak: podaci, kategorija i razdoblje (početak i kraj). */
export default function Pretplata() {
  const { colors, fx } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const cats = useDb(() => listCategories("expense"));

  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = id ? getRecurring(id) : null;
  const [name, setName] = useState(editing?.name ?? "");
  const [amount, setAmount] = useState<{ text: string; cents: Cents | null }>(
    editing
      ? { text: editing.amountCents % 100 === 0 ? String(editing.amountCents / 100) : (editing.amountCents / 100).toFixed(2).replace(".", ","), cents: editing.amountCents }
      : { text: "", cents: null },
  );
  // Dan: prazno polje s „1“ kao predloškom; ako ništa ne upišeš, naplata je 1. u mjesecu.
  const [day, setDay] = useState(editing ? String(editing.dayOfMonth) : "");
  const [categoryId, setCategoryId] = useState<string | null>(editing ? editing.categoryId : defaultExpenseCategoryId());
  // Dok kategoriju nisi sam odabrao, predlaže se prema nazivu („Kredit“ → Stan i režije).
  const [catPicked, setCatPicked] = useState(!!editing);
  const [catOpen, setCatOpen] = useState(false);
  // Odakle je kategorija: sam odabrao, lokalni katalog ili AI (Premium).
  const [suggested, setSuggested] = useState<"local" | "ai" | null>(null);
  const [nameFocus, setNameFocus] = useState(false);
  const [chosen, setChosen] = useState<string | null>(editing ? editing.name : null); // naziv odabran iz prijedloga
  const premium = usePremium();
  const [iconKey, setIconKey] = useState<string | null>(editing?.iconKey ?? null);
  const [start, setStart] = useState<LocalDate>(editing?.startDate ?? `${yearMonthOf(today())}-01`);
  const [hasEnd, setHasEnd] = useState(!!editing?.endDate);
  const [end, setEnd] = useState<LocalDate>(editing?.endDate ?? today());

  // Valuta iznosa: strana (npr. Netflix u dolarima) se sprema pretvorena u zadanu valutu.
  const { home, toHome } = useCurrency();
  const [cur, setCur] = useState(home);
  const [curOpen, setCurOpen] = useState(false);
  const homeCents = amount.cents === null ? null : cur === home ? amount.cents : toHome(amount.cents, cur);

  const rangeOk = !hasEnd || end >= start;
  const valid = name.trim().length > 0 && (homeCents ?? 0) > 0 && rangeOk;

  const onName = (t: string) => {
    setName(t);
    setChosen(null);
    const hint = suggestRecurring(t);
    setIconKey(hint?.icon ?? null);
    if (catPicked) return;
    const cat = hint ? cats.find((c) => c.key === hint.categoryKey) : undefined;
    setCategoryId(cat?.id ?? defaultExpenseCategoryId());
    setSuggested(cat ? "local" : null);
  };

  /** Odabir iz prijedloga: naziv, logo i kategorija odjednom. */
  const choose = (e: CatalogEntry) => {
    setName(e.name);
    setChosen(e.name);
    setIconKey(catalogIconKey(e));
    // Jedan poznati plan (npr. HRT pristojba): iznos se upiše odmah; više planova se nudi ispod iznosa.
    const only = monthlyPlans(e.key);
    if (only.length === 1 && amount.cents === null) {
      setAmount({ text: centsText(only[0]!.cents), cents: only[0]!.cents });
      setCur("EUR");
    }
    if (!catPicked) {
      setCategoryId(cats.find((c) => c.key === e.categoryKey)?.id ?? defaultExpenseCategoryId());
      setSuggested("local");
    }
  };

  // Premium: naziv koji katalog ne zna, nakon kratke stanke ide AI-ju (samo naziv i nazivi kategorija).
  useEffect(() => {
    if (!premium || catPicked || editing) return;
    const n = name.trim();
    if (n.length < 3 || suggestRecurring(n)) return;
    let alive = true;
    const t = setTimeout(() => {
      void classifyRecurring(n, cats.map((c) => ({ id: c.id, name: c.name }))).then((r) => {
        if (!alive || !r) return;
        if (r.categoryId) {
          setCategoryId(r.categoryId);
          setSuggested("ai");
        }
        if (r.icon) setIconKey(r.icon);
      });
    }, 700);
    return () => {
      alive = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, premium, catPicked]);

  const suggestions = nameFocus && chosen !== name ? searchCatalog(name, 4) : [];
  // Prepoznata usluga: njezini mjesečni planovi kao prijedlozi iznosa (cijene u HR, s PDV-om).
  const service = suggestRecurring(name)?.entry.key ?? null;
  // Mjesečni planovi u bilo kojoj valuti (EUR iz HR cjenika, USD za strane alate); prikaz i u zadanoj valuti.
  const plans = service ? (SERVICE_PLANS[service]?.plans ?? []).filter((pl) => pl.cycle === "monthly") : [];
  const variable = service ? (SERVICE_PLANS[service]?.variable ?? false) : false;

  const pickCategory = (cid: string) => {
    setCategoryId(cid);
    setCatPicked(true);
    setSuggested(null);
    setCatOpen(false);
  };

  // Nova kategorija iz ovog ekrana: kad se vratiš, odmah je odabrana.
  const knownIds = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!knownIds.current) return;
    const created = cats.find((c) => !knownIds.current!.has(c.id));
    if (created) {
      knownIds.current = null;
      pickCategory(created.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cats]);
  const newCategory = () => {
    knownIds.current = new Set(cats.map((c) => c.id));
    router.push({ pathname: "/kategorija", params: { kind: "expense" } } as Href);
  };
  const current = cats.find((c) => c.id === categoryId);

  const save = () => {
    if (!valid || homeCents === null) return;
    const d = Math.min(31, Math.max(1, parseInt(day, 10) || 1));
    const endDate = hasEnd ? end : null;
    // Stare stavke s općom ikonom dobivaju logo marke prepoznate iz naziva.
    const shownIcon = recurringIcon({ name, iconKey });
    const savedIcon = shownIcon.startsWith("brand:") ? shownIcon : iconKey;
    if (editing) {
      updateRecurring(editing.id, { name, amountCents: homeCents, dayOfMonth: d, categoryId, iconKey: savedIcon, startDate: start, endDate });
      void rescheduleReminders();
      router.back();
      toast.show("Izmjene spremljene · vrijede od sljedeće naplate");
      return;
    }
    addRecurring({ name, amountCents: homeCents, dayOfMonth: d, categoryId, iconKey: savedIcon, startDate: start, endDate });
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
      <View style={{ gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 12 }}>
          <View style={{ paddingBottom: 4 }}>
            <CatIcon colorToken={current?.colorToken ?? "cat-ostalo"} icon={recurringIcon({ name, iconKey }, current?.icon)} size={48} />
          </View>
          <View style={{ flex: 1 }}>
            <TextField
              label="Naziv"
              value={name}
              onChangeText={onName}
              onFocus={() => setNameFocus(true)}
              onBlur={() => setTimeout(() => setNameFocus(false), 150)}
              placeholder="npr. Netflix, kredit, teretana"
              maxLength={30}
            />
          </View>
        </View>
        {suggestions.length > 0 ? (
          <View style={{ marginTop: -8 }}>
            {suggestions.map((e, i) => (
              <Pressable
                key={e.key}
                accessibilityRole="button"
                accessibilityLabel={`Odaberi ${e.name}`}
                onPress={() => choose(e)}
                style={({ pressed }) => ({
                  minHeight: 52,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingHorizontal: 4,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: fx.line,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <CatIcon colorToken="cat-ostalo" icon={catalogIconKey(e)} size={32} />
                <T v="headline" style={{ flex: 1 }} numberOfLines={1}>{e.name}</T>
                <T v="caption" muted numberOfLines={1}>{cats.find((c) => c.key === e.categoryKey)?.name ?? ""}</T>
              </Pressable>
            ))}
          </View>
        ) : null}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 2 }}>
            <AmountField
              label="Iznos"
              value={amount.text}
              onChange={(text, cents) => setAmount({ text, cents })}
              currency={<CurrencyTag code={cur} onPress={() => setCurOpen(!curOpen)} />}
              below={<ConvertedHint cents={amount.cents} from={cur} />}
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextField label="Dan u mjesecu" numeric center value={day} onChangeText={(t) => setDay(t.replace(/\D/g, "").slice(0, 2))} placeholder="1" maxLength={2} />
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
        {plans.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: -6 }}>
            {plans.map((pl) => {
              const pc = pl.currency ?? "EUR";
              const inHome = pc === home ? null : toHome(pl.cents, pc);
              const price = formatEur(pl.cents, { symbol: currencyInfo(pc).symbol });
              return (
                <Chip
                  key={pl.name}
                  label={`${pl.name} · ${pl.approx ? "≈ " : ""}${price}${inHome !== null ? ` ≈ ${formatEur(inHome)}` : ""}`}
                  selected={amount.cents === pl.cents && cur === pc}
                  onPress={() => {
                    setAmount({ text: centsText(pl.cents), cents: pl.cents });
                    setCur(pc);
                  }}
                />
              );
            })}
          </View>
        ) : variable && amount.cents === null ? (
          <T v="caption" muted style={{ marginTop: -6 }}>Iznos ovisi o tvom paketu. Upiši ga s računa.</T>
        ) : null}
      </View>

      {/* Kategorija kao padajući izbor: zatvoreno pokazuje odabranu, otvoreno popis (ne raste s brojem kategorija). */}
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <T v="caption" muted>Kategorija</T>
          {suggested === "ai" ? <AiTag /> : suggested === "local" ? <T v="caption" muted>prema nazivu</T> : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Kategorija: ${current?.name ?? "bez kategorije"}`}
          accessibilityState={{ expanded: catOpen }}
          onPress={() => setCatOpen(!catOpen)}
          style={({ pressed }) => ({
            minHeight: 56,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: catOpen ? colors.brand : fx.glassBorder,
            backgroundColor: fx.glass,
            paddingHorizontal: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            opacity: pressed ? 0.75 : 1,
          })}
        >
          {current ? <CatIcon colorToken={current.colorToken} icon={current.icon} size={32} /> : null}
          <T v="headline" style={{ flex: 1, fontWeight: "700" }} numberOfLines={1}>{current?.name ?? "Bez kategorije"}</T>
          <View style={{ transform: [{ rotate: catOpen ? "-90deg" : "90deg" }] }}>
            <Icon name="chev" size={18} color={colors["ink-muted"]} />
          </View>
        </Pressable>
        {catOpen ? (
          <View>
            {cats.map((c, i) => {
              const on = c.id === categoryId;
              return (
                <Pressable
                  key={c.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  onPress={() => pickCategory(c.id)}
                  style={({ pressed }) => ({
                    minHeight: 52,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingHorizontal: 4,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: fx.line,
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <CatIcon colorToken={c.colorToken} icon={c.icon} size={30} />
                  <T v="headline" style={{ flex: 1 }} numberOfLines={1}>{c.name}</T>
                  {on ? <Icon name="check" size={18} color={colors.brand} stroke={2.6} /> : null}
                </Pressable>
              );
            })}
            <View style={{ alignItems: "center", paddingTop: 6 }}>
              <Button variant="text" size="sm" label="+ Nova kategorija" onPress={newCategory} />
            </View>
          </View>
        ) : null}
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
