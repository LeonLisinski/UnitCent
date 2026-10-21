import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  POPULAR_RECURRING,
  computeDailyLimit,
  formatEur,
  parseAmount,
  catalogEntry,
  displayCurrencySymbol,
  spentBeforeFromBalance,
  yearMonthOf,
  type Cents,
  type RecurringItem,
} from "@unitcent/core";
import { signInWith, type Provider } from "../src/account";
import { APPLE_ENABLED, ProviderButton } from "../src/AccountSection";
import { Button, Chip, Keypad, TextField } from "../src/components";
import { Amount, Glow, Ring, RoundButton } from "../src/fx";
import { fitFontSize } from "../src/format";
import { Icon } from "../src/icons";
import { Safe, useInsets, useKeyboardHeight } from "../src/safe";
import { useTheme } from "../src/theme";
import { T } from "../src/ui";
import { useToast } from "../src/toast";
import { syncNow } from "../src/sync";
import { addRecurring, bookDueRecurring, getLatestPlanBefore, getPlan, kvGet, kvSet, listCategories, setSavingsBalance, today, upsertPlan } from "../src/db/repo";
import { rescheduleReminders } from "../src/notifications";
import { TRIAL_ENABLED, isPremiumNow } from "../src/premium";

interface Pick {
  amountText: string;
  cents: Cents | null;
  /** Prazno = 1. u mjesecu. */
  day: number | null;
}

const SAVING_PRESETS: Cents[] = [0, 5000, 10000, 20000];

/**
 * Početak (≈ 60 s, bez računa): dobrodošlica s obećanjem → primanja → obavezni troškovi → štednja → (usred mjeseca)
 * stanje na računu. Jedno pitanje po ekranu, velike brojke, glavna radnja uvijek vidljiva. Na kraju se odmah vidi
 * dnevni budžet. Usred mjeseca se stari troškovi ne unose: potrošeno se procjenjuje iz stanja (D-13).
 */
export default function Onboarding() {
  const { colors, fx } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const insets = useInsets();
  const kb = useKeyboardHeight();
  const [step, setStep] = useState(0); // 0 dobrodošlica, 1 primanja, 2 obavezno, 3 štednja, 4 stanje na računu
  // Gost (bez prijave) na koraku 0 upisuje ime za pozdrav; prijavljeni ga dobiva iz računa. Mijenja se u Profilu.
  const [guestName, setGuestName] = useState(false);
  const [nameText, setNameText] = useState(() => kvGet("name") ?? "");
  const [incomeText, setIncomeText] = useState("");
  const [savingsText, setSavingsText] = useState("");
  const [savedText, setSavedText] = useState(""); // već ušteđeno (neobavezno)
  const [balanceText, setBalanceText] = useState(""); // stanje na računu (samo usred mjeseca)
  // Usred mjeseca (od 4. dana) pita se još stanje na računu; početkom mjeseca nema što procijeniti.
  const midMonth = Number(today().slice(8)) > 3;
  const lastStep = midMonth ? 4 : 3;
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const [signing, setSigning] = useState(false);
  // Na malim ekranima (iPhone SE) prsten je manji, da gumbi za prijavu ostanu vidljivi bez skrolanja.
  const heroRing = Math.min(250, Math.round(useWindowDimensions().height * 0.3));

  const income = incomeText ? parseAmount(incomeText) : null;
  const savings = savingsText ? parseAmount(savingsText) : null;
  const obligatory = useMemo(() => Object.values(picks).reduce((s, p) => s + (p.cents ?? 0), 0), [picks]);
  const balance = balanceText ? parseAmount(balanceText) : null;
  const saved = savedText ? parseAmount(savedText) : null;

  // Potrošeno ovaj mjesec prije početka praćenja: iz stanja na računu (pretplate koje su već prošle su izašle s računa).
  const spentBefore = useMemo(() => {
    if (!midMonth || balance === null) return 0;
    const d = today();
    const items: RecurringItem[] = Object.entries(picks)
      .filter(([, p]) => p.cents)
      .map(([key, p]) => ({ id: key, name: key, amountCents: p.cents!, dayOfMonth: p.day ?? 1, active: true, startDate: `${d.slice(0, 7)}-01` }));
    return spentBeforeFromBalance({ incomeCents: income ?? 0, recurring: items, balanceCents: balance, today: d });
  }, [midMonth, balance, picks, income]);

  const preview = useMemo(
    () =>
      computeDailyLimit({
        incomeCents: income ?? 0,
        obligatoryCents: obligatory,
        savingsCents: savings ?? 0,
        spentBeforeTodayCents: spentBefore,
        spentTodayCents: 0,
        today: today(),
      }),
    [income, obligatory, savings, spentBefore],
  );

  // Dobrodošlica: prsten se „napuni“ pri otvaranju (primjer iz proizvoda: 19,96 €).
  const [demo, setDemo] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setDemo(0.74), 350);
    return () => clearTimeout(t);
  }, []);

  const finish = () => {
    const month = yearMonthOf(today());
    upsertPlan({ month, incomeCents: income ?? 0, savingsCents: savings ?? 0, spentBeforeCents: spentBefore });
    if (saved && saved > 0) setSavingsBalance(month, saved);
    const cats = listCategories();
    for (const p of POPULAR_RECURRING) {
      const pick = picks[p.key];
      if (!pick || !pick.cents) continue;
      const cat = cats.find((c) => c.key === p.categoryKey);
      addRecurring({ name: p.name, amountCents: pick.cents, dayOfMonth: pick.day ?? 1, categoryId: cat?.id ?? null, iconKey: catalogEntry(p.key)?.brand ? `brand:${p.key}` : p.icon });
    }
    bookDueRecurring();
    kvSet("onboarded", "1");
    void rescheduleReminders();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/");
    // Odluka 21. 10.: nakon postavljenog plana (korisnik je upravo vidio svoj dnevni budžet) jednom se nudi
    // 7 dana Premiuma besplatno, preko Početne, pa zatvaranje vodi na Početnu. Samo kad trgovine imaju probno razdoblje.
    if (TRIAL_ENABLED && !isPremiumNow() && kvGet("trial_offered") !== "1") {
      kvSet("trial_offered", "1");
      router.push({ pathname: "/premium", params: { first: "1" } });
    }
  };

  const togglePick = (key: string, suggested: Cents, day: number) => {
    void Haptics.selectionAsync();
    setPicks((cur) => {
      const next = { ...cur };
      if (next[key]) delete next[key];
      else next[key] = { amountText: suggested > 0 ? String(suggested / 100).replace(".", ",") : "", cents: suggested || null, day };
      return next;
    });
  };

  /**
   * Prijava na prvom ekranu. Povratnik s planom ide ravno na početnu; novi korisnik nastavlja s postavljanjem plana
   * (već prijavljen, pa su podaci od prvog unosa zaštićeni). „Nastavi kao gost“ preskače prijavu (može kasnije u Profilu).
   */
  const signInStart = async (provider: Provider) => {
    if (signing) return;
    setSigning(true);
    const r = await signInWith(provider);
    if (r === "signed-in" || r === "linked") {
      await syncNow();
      const month = yearMonthOf(today());
      setSigning(false);
      if (getPlan(month) ?? getLatestPlanBefore(month)) {
        kvSet("onboarded", "1");
        router.replace("/");
        return;
      }
      setStep(1);
      return;
    }
    setSigning(false);
    if (r === "error") toast.show("Prijava nije uspjela, pokušaj ponovno");
  };

  const canNext = step === 1 ? (income ?? 0) > 0 : true;
  const next = () => (step === lastStep ? finish() : setStep(step + 1));
  const bottomPad = Math.max(0, kb - insets.bottom);

  /** Veliki iznos kao u brzom unosu: broj je junak ekrana. */
  const bigAmount = (text: string) => (
    <View style={{ alignItems: "center", paddingVertical: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "baseline" }}>
        <T
          v="amount-hero"
          color={text ? colors.ink : colors["ink-muted"]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
          style={{ fontSize: fitFontSize(`${text || "0"} €`, 300, 72), lineHeight: 80, letterSpacing: -3 }}
        >
          {text || "0"}
        </T>
        <T v="title-1" muted style={{ fontSize: 32, marginLeft: 6 }}>{displayCurrencySymbol()}</T>
      </View>
    </View>
  );

  /** Mali upis iznosa u pilulji (uz čipove). */
  const pill = (value: string, onChange: (t: string) => void, placeholder: string, label: string) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, minHeight: 44, borderRadius: 999, backgroundColor: fx.glass, borderWidth: 1, borderColor: fx.glassBorder }}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors["ink-muted"]}
        keyboardType="decimal-pad"
        accessibilityLabel={label}
        style={{ minWidth: 70, color: colors.ink, fontSize: 16, fontWeight: "700", paddingVertical: 8 }}
      />
      <T v="caption" muted>{displayCurrencySymbol()}</T>
    </View>
  );

  /** Rezultat: dnevni budžet. */
  const result = (size: number) => (
    <Ring size={size} remaining={Math.min(1, preview.dailyCents > 0 ? 0.82 : 0)} state="ok">
      <T v="mono-label" muted>Dnevni budžet</T>
      <Amount cents={Math.max(0, preview.dailyCents)} maxWidth={150} />
      <T v="caption" muted>još {preview.daysLeft} dana</T>
    </Ring>
  );

  const heading = (title: string, sub?: string) => (
    <View style={{ gap: 6 }}>
      <T v="title-1" style={{ fontSize: 28, lineHeight: 34 }}>{title}</T>
      {sub ? <T muted>{sub}</T> : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Glow />
      <Safe>
        <View style={{ flex: 1, paddingBottom: bottomPad }}>
          {/* Zaglavlje: natrag + napredak (dobrodošlica ih nema) */}
          <View style={{ height: 56, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ width: 44 }}>
              {step > 0 || guestName ? <RoundButton icon="back" label="Natrag" onPress={() => (step > 0 ? setStep(step - 1) : setGuestName(false))} /> : null}
            </View>
            {step > 0 ? (
              <View style={{ flexDirection: "row", gap: 8 }}>
                {Array.from({ length: lastStep }, (_, k) => k + 1).map((i) => (
                  <View
                    key={i}
                    style={{
                      width: i === step ? 28 : 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: i <= step ? colors.brand : fx.track,
                    }}
                  />
                ))}
              </View>
            ) : null}
            <View style={{ width: 44 }} />
          </View>

          <Animated.View key={guestName && step === 0 ? "name" : step} entering={FadeInRight.duration(280)} exiting={FadeOutLeft.duration(160)} style={{ flex: 1 }}>
            {step === 0 && guestName ? (
              <View style={{ flex: 1, paddingHorizontal: 20, gap: 16 }}>
                {heading("Kako se zoveš?", "Za pozdrav na početnom ekranu.")}
                <TextField label="Ime" value={nameText} onChangeText={setNameText} maxLength={24} autoFocus placeholder="npr. Ana" />
              </View>
            ) : null}

            {step === 0 && !guestName ? (
              <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: "center", gap: 28 }}>
                <View style={{ alignItems: "center" }}>
                  <Ring size={heroRing} remaining={demo} state="ok">
                    <T v="mono-label" muted>Dnevni budžet</T>
                    <T v="amount-hero" style={{ fontSize: 50, lineHeight: 56, letterSpacing: -2 }}>19,96 €</T>
                  </Ring>
                </View>
                <View style={{ alignItems: "center", gap: 10 }}>
                  <T v="title-1" style={{ fontSize: 30, lineHeight: 38, textAlign: "center" }}>
                    Koliko danas smiješ potrošiti?
                  </T>
                  <T muted style={{ textAlign: "center", maxWidth: 300 }}>
                    UnitCent ti svaki dan kaže točan iznos. Postavljanje traje minutu.
                  </T>
                </View>
              </View>
            ) : null}

            {step === 1 ? (
              <View style={{ flex: 1, paddingHorizontal: 20, gap: 8 }}>
                {heading("Unesi mjesečna primanja", "Plaća i ostali redoviti prihodi.")}
                <View style={{ flex: 1, justifyContent: "center" }}>{bigAmount(incomeText)}</View>
                <Keypad value={incomeText} onChange={setIncomeText} />
              </View>
            ) : null}

            {step === 2 ? (
              <View style={{ flex: 1 }}>
                <View style={{ paddingHorizontal: 20 }}>{heading("Što plaćaš svaki mjesec?", "Dodirni što imaš. Knjiži se samo, a dan prije stiže podsjetnik.")}</View>
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16, gap: 18 }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 16 }}>
                    {POPULAR_RECURRING.map((p) => {
                      const on = !!picks[p.key];
                      return (
                        <Pressable
                          key={p.key}
                          accessibilityRole="button"
                          accessibilityState={{ selected: on }}
                          accessibilityLabel={p.name}
                          onPress={() => togglePick(p.key, p.suggestedCents, p.dayOfMonth)}
                          style={({ pressed }) => ({ width: "25%", alignItems: "center", gap: 7, opacity: pressed ? 0.7 : 1 })}
                        >
                          <View
                            style={{
                              width: 58,
                              height: 58,
                              borderRadius: 29,
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: on ? colors["brand-soft"] : fx.glass,
                              borderWidth: 2,
                              borderColor: on ? colors.brand : fx.glassBorder,
                            }}
                          >
                            <Icon name={p.icon} size={24} color={on ? colors["brand-ink"] : colors["ink-muted"]} />
                            {on ? (
                              <View style={{ position: "absolute", right: -2, top: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" }}>
                                <Icon name="check" size={12} color={colors["on-brand"]} stroke={3} />
                              </View>
                            ) : null}
                          </View>
                          <T v="caption" color={on ? colors.brand : colors.ink} numberOfLines={1} style={{ fontWeight: "700", fontSize: 12 }}>{p.name}</T>
                        </Pressable>
                      );
                    })}
                  </View>

                  {POPULAR_RECURRING.filter((p) => picks[p.key]).length > 0 ? (
                    <View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <T v="mono-label" muted style={{ flex: 1, fontSize: 11, opacity: 0.8 }}>Naplata</T>
                        <T v="mono-label" muted style={{ width: 112, fontSize: 11, opacity: 0.8 }}>Iznos</T>
                        <T v="mono-label" muted style={{ width: 52, fontSize: 11, opacity: 0.8, textAlign: "center" }}>Dan</T>
                      </View>
                      {POPULAR_RECURRING.filter((p) => picks[p.key]).map((p, i) => {
                        const pick = picks[p.key]!;
                        return (
                          <View key={p.key} style={{ minHeight: 60, flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: fx.line }}>
                            <T v="headline" style={{ flex: 1, fontWeight: "700" }} numberOfLines={1}>{p.name}</T>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: fx.glass, borderWidth: 1, borderColor: fx.glassBorder, borderRadius: 14, paddingHorizontal: 12, height: 46, width: 112 }}>
                              <TextInput
                                value={pick.amountText}
                                placeholder="0,00"
                                placeholderTextColor={colors["ink-muted"]}
                                keyboardType="decimal-pad"
                                accessibilityLabel={`Iznos: ${p.name}`}
                                onChangeText={(t) => setPicks((c) => ({ ...c, [p.key]: { ...pick, amountText: t, cents: parseAmount(t) } }))}
                                style={{ flex: 1, color: colors.ink, fontSize: 17, fontWeight: "700", paddingVertical: 0 }}
                              />
                              <T v="caption" muted>{displayCurrencySymbol()}</T>
                            </View>
                            <TextInput
                              value={pick.day === null ? "" : String(pick.day)}
                              placeholder="1"
                              placeholderTextColor={colors["ink-muted"]}
                              selectTextOnFocus
                              keyboardType="number-pad"
                              maxLength={2}
                              accessibilityLabel={`Dan naplate: ${p.name}`}
                              onChangeText={(t) => {
                                const d = parseInt(t.replace(/\D/g, ""), 10);
                                const n = Number.isNaN(d) ? null : Math.min(31, Math.max(1, d));
                                setPicks((c) => ({ ...c, [p.key]: { ...pick, day: n } }));
                              }}
                              style={{ width: 52, height: 46, borderRadius: 14, borderWidth: 1, borderColor: fx.glassBorder, backgroundColor: fx.glass, color: colors.ink, fontSize: 17, fontWeight: "700", textAlign: "center", paddingVertical: 0 }}
                            />
                          </View>
                        );
                      })}
                      <T v="caption" muted style={{ marginTop: 8 }}>Ukupno obavezno: {formatEur(obligatory)}</T>
                    </View>
                  ) : null}
                </ScrollView>
              </View>
            ) : null}

            {step === 3 ? (
              <View style={{ flex: 1, paddingHorizontal: 20, gap: 16 }}>
                {heading("Koliko želiš štedjeti mjesečno?", "Odvaja se prije dnevnog iznosa. Može i 0 €.")}
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {SAVING_PRESETS.map((c) => (
                    <Chip
                      key={c}
                      label={c === 0 ? "Ništa" : formatEur(c).replace(",00", "")}
                      selected={(savings ?? 0) === c && savingsText !== ""}
                      onPress={() => setSavingsText(c === 0 ? "0" : String(c / 100))}
                    />
                  ))}
                  {pill(SAVING_PRESETS.includes((savings ?? -1) as Cents) && savingsText !== "" ? "" : savingsText, setSavingsText, "Drugo", "Iznos štednje")}
                </View>

                <View style={{ gap: 8, marginTop: 8 }}>
                  <T v="headline">Koliko već imaš ušteđeno?</T>
                  <T v="caption" muted>Neobavezno. Od toga kreće „Ušteđeno ukupno“.</T>
                  <View style={{ flexDirection: "row" }}>{pill(savedText, setSavedText, "0,00", "Već ušteđeno")}</View>
                </View>

                {lastStep === 3 ? (
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>{result(236)}</View>
                ) : null}
              </View>
            ) : null}

            {step === 4 ? (
              <View style={{ flex: 1, paddingHorizontal: 20, gap: 8 }}>
                {heading("Koliko ti je sad na računu?", "Pogledaj u aplikaciji banke. Ono što si već potrošio ovaj mjesec ne moraš unositi.")}
                <View style={{ flex: 1, justifyContent: "center", gap: 6 }}>
                  {bigAmount(balanceText)}
                  <T v="caption" muted style={{ textAlign: "center" }}>
                    {balance === null
                      ? "Tekući račun, bez štednje."
                      : `Ovaj mjesec već potrošeno ≈ ${formatEur(spentBefore)} · dnevni budžet ${formatEur(Math.max(0, preview.dailyCents))}`}
                  </T>
                </View>
                <Keypad value={balanceText} onChange={setBalanceText} />
              </View>
            ) : null}
          </Animated.View>

          {/* Glavna radnja uvijek vidljiva */}
          <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, alignItems: "center", gap: 2 }}>
            {step === 0 && guestName ? (
              <>
                <Button
                  label="Dalje"
                  onPress={() => {
                    kvSet("name", nameText.trim());
                    setStep(1);
                  }}
                />
                {nameText.trim() === "" ? <Button variant="text" size="sm" label="Preskoči" onPress={() => setStep(1)} /> : null}
              </>
            ) : step === 0 ? (
              // Prvi ekran: prijava (podaci odmah zaštićeni) ili gost. Jedna glavna radnja; Apple na iOS-u uz nju.
              <>
                {APPLE_ENABLED ? <ProviderButton provider="apple" busy={signing} onPress={() => void signInStart("apple")} /> : null}
                <View style={{ height: APPLE_ENABLED ? 10 : 0 }} />
                <ProviderButton provider="google" busy={signing} onPress={() => void signInStart("google")} />
                <T v="caption" muted style={{ textAlign: "center", marginTop: 10 }}>Već imaš račun? Isti gumb te prijavljuje.</T>
                <Button variant="text" size="sm" label="Nastavi kao gost" disabled={signing} onPress={() => setGuestName(true)} />
              </>
            ) : (
              <Button label={step === lastStep ? "Počni" : "Dalje"} disabled={!canNext} onPress={next} />
            )}
            {step === 4 && balanceText === "" ? (
              <Button variant="text" size="sm" label="Preskoči" onPress={finish} />
            ) : null}
          </View>
        </View>
      </Safe>
    </View>
  );
}
