import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { TRIAL_ENABLED } from "../src/premium";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  POPULAR_RECURRING,
  computeDailyLimit,
  formatEur,
  parseAmount,
  yearMonthOf,
  type Cents,
} from "@unitcent/core";
import { signInWith } from "../src/account";
import { Button, Chip, Keypad } from "../src/components";
import { Amount, Glow, Ring, RoundButton } from "../src/fx";
import { fitFontSize } from "../src/format";
import { Icon } from "../src/icons";
import { Safe, useInsets, useKeyboardHeight } from "../src/safe";
import { useTheme } from "../src/theme";
import { T } from "../src/ui";
import { syncNow } from "../src/sync";
import { addRecurring, bookDueRecurring, getLatestPlanBefore, getPlan, kvSet, listCategories, today, upsertPlan } from "../src/db/repo";
import { rescheduleReminders } from "../src/notifications";

interface Pick {
  amountText: string;
  cents: Cents | null;
  day: number;
}

const SAVING_PRESETS: Cents[] = [0, 5000, 10000, 20000];

/**
 * Početak (≈ 60 s, bez računa): dobrodošlica s obećanjem → primanja → obavezni troškovi → štednja.
 * Jedno pitanje po ekranu, velike brojke, glavna radnja uvijek vidljiva. Na kraju se odmah vidi preporučeni dnevni trošak.
 */
export default function Onboarding() {
  const { colors, fx } = useTheme();
  const router = useRouter();
  const insets = useInsets();
  const kb = useKeyboardHeight();
  const [step, setStep] = useState(0); // 0 dobrodošlica, 1 primanja, 2 obavezno, 3 štednja
  const [incomeText, setIncomeText] = useState("");
  const [savingsText, setSavingsText] = useState("");
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const [signing, setSigning] = useState(false);

  const income = incomeText ? parseAmount(incomeText) : null;
  const savings = savingsText ? parseAmount(savingsText) : null;
  const obligatory = useMemo(() => Object.values(picks).reduce((s, p) => s + (p.cents ?? 0), 0), [picks]);

  const preview = useMemo(
    () =>
      computeDailyLimit({
        incomeCents: income ?? 0,
        obligatoryCents: obligatory,
        savingsCents: savings ?? 0,
        spentBeforeTodayCents: 0,
        spentTodayCents: 0,
        today: today(),
      }),
    [income, obligatory, savings],
  );

  // Dobrodošlica: prsten se „napuni“ pri otvaranju (primjer iz proizvoda: 19,96 €).
  const [demo, setDemo] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setDemo(0.74), 350);
    return () => clearTimeout(t);
  }, []);

  const finish = () => {
    const month = yearMonthOf(today());
    upsertPlan({ month, incomeCents: income ?? 0, savingsCents: savings ?? 0 });
    const cats = listCategories();
    for (const p of POPULAR_RECURRING) {
      const pick = picks[p.key];
      if (!pick || !pick.cents) continue;
      const cat = cats.find((c) => c.key === p.categoryKey);
      addRecurring({ name: p.name, amountCents: pick.cents, dayOfMonth: pick.day, categoryId: cat?.id ?? null, iconKey: p.icon });
    }
    bookDueRecurring();
    kvSet("onboarded", "1");
    void rescheduleReminders();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (TRIAL_ENABLED) {
      router.replace("/");
      setTimeout(() => router.push({ pathname: "/premium", params: { first: "1" } } as Href), 350);
    } else router.replace("/");
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

  /** Povratnik: prijava u postojeći račun; ako već ima plan, preskače postavljanje i vodi na početnu. */
  const existingAccount = async () => {
    setSigning(true);
    const r = await signInWith("google");
    if (r === "signed-in" || r === "linked") {
      await syncNow();
      const month = yearMonthOf(today());
      if (getPlan(month) ?? getLatestPlanBefore(month)) {
        kvSet("onboarded", "1");
        setSigning(false);
        router.replace("/");
        return;
      }
    }
    setSigning(false);
  };

  const canNext = step === 1 ? (income ?? 0) > 0 : true;
  const next = () => (step === 3 ? finish() : setStep(step + 1));
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
        <T v="title-1" muted style={{ fontSize: 32, marginLeft: 6 }}>€</T>
      </View>
    </View>
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
              {step > 0 ? <RoundButton icon="back" label="Natrag" onPress={() => setStep(step - 1)} /> : null}
            </View>
            {step > 0 ? (
              <View style={{ flexDirection: "row", gap: 8 }}>
                {[1, 2, 3].map((i) => (
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

          <Animated.View key={step} entering={FadeInRight.duration(280)} exiting={FadeOutLeft.duration(160)} style={{ flex: 1 }}>
            {step === 0 ? (
              <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: "center", gap: 28 }}>
                <View style={{ alignItems: "center" }}>
                  <Ring size={250} remaining={demo} state="ok">
                    <T v="mono-label" muted>Danas još smiješ</T>
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
                              <T v="caption" muted>€</T>
                            </View>
                            <TextInput
                              value={String(pick.day)}
                              keyboardType="number-pad"
                              maxLength={2}
                              accessibilityLabel={`Dan naplate: ${p.name}`}
                              onChangeText={(t) => {
                                const n = Math.min(31, Math.max(1, parseInt(t.replace(/\D/g, ""), 10) || 1));
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
                {heading("Koliko želiš uštedjeti?", "Može i 0 €. Mijenjaš kad god želiš.")}
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {SAVING_PRESETS.map((c) => (
                    <Chip
                      key={c}
                      label={c === 0 ? "Ništa" : formatEur(c).replace(",00", "")}
                      selected={(savings ?? 0) === c && savingsText !== ""}
                      onPress={() => setSavingsText(c === 0 ? "0" : String(c / 100))}
                    />
                  ))}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, minHeight: 44, borderRadius: 999, backgroundColor: fx.glass, borderWidth: 1, borderColor: fx.glassBorder }}>
                    <TextInput
                      value={SAVING_PRESETS.includes((savings ?? -1) as Cents) && savingsText !== "" ? "" : savingsText}
                      onChangeText={setSavingsText}
                      placeholder="Drugo"
                      placeholderTextColor={colors["ink-muted"]}
                      keyboardType="decimal-pad"
                      accessibilityLabel="Iznos štednje"
                      style={{ minWidth: 70, color: colors.ink, fontSize: 16, fontWeight: "700", paddingVertical: 8 }}
                    />
                    <T v="caption" muted>€</T>
                  </View>
                </View>

                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                  <Ring size={236} remaining={Math.min(1, preview.dailyCents > 0 ? 0.82 : 0)} state="ok">
                    <T v="mono-label" muted>Dnevni trošak</T>
                    <Amount cents={Math.max(0, preview.dailyCents)} maxWidth={150} />
                    <T v="caption" muted>još {preview.daysLeft} dana</T>
                  </Ring>
                </View>
              </View>
            ) : null}
          </Animated.View>

          {/* Glavna radnja uvijek vidljiva */}
          <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, alignItems: "center", gap: 2 }}>
            <Button
              label={step === 0 ? "Kreni" : step === 3 ? "Počni" : "Dalje"}
              disabled={!canNext}
              onPress={next}
            />
            {step === 0 ? (
              <Button variant="text" size="sm" label={signing ? "Prijavljujem…" : "Već imam račun"} disabled={signing} onPress={() => void existingAccount()} />
            ) : null}
          </View>
        </View>
      </Safe>
    </View>
  );
}
