import { useMemo, useState } from "react";
import { ScrollView, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  POPULAR_RECURRING,
  computeDailyLimit,
  formatEur,
  yearMonthOf,
  type Cents,
} from "@unitcent/core";
import { AmountField, Button, Chip } from "../src/components";
import { Icon } from "../src/icons";
import { Glass, Glow } from "../src/fx";
import { useTheme } from "../src/theme";
import { T } from "../src/ui";
import {
  addRecurring,
  bookDueRecurring,
  kvSet,
  listCategories,
  today,
  upsertPlan,
} from "../src/db/repo";
import { rescheduleReminders } from "../src/notifications";

interface Pick {
  amountText: string;
  cents: Cents | null;
  day: number;
}

/**
 * Onboarding (≤ 60 s, bez računa): 1) primanja, 2) obavezni troškovi, 3) štednja.
 * Na kraju se odmah prikaže preporučeni dnevni trošak: prvi „aha“ trenutak.
 */
export default function Onboarding() {
  const { colors, fx, radius, space } = useTheme();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [income, setIncome] = useState<{ text: string; cents: Cents | null }>({ text: "", cents: null });
  const [savings, setSavings] = useState<{ text: string; cents: Cents | null }>({ text: "", cents: null });
  const [picks, setPicks] = useState<Record<string, Pick>>({});

  const obligatory = useMemo(
    () => Object.values(picks).reduce((s, p) => s + (p.cents ?? 0), 0),
    [picks],
  );

  const preview = useMemo(
    () =>
      computeDailyLimit({
        incomeCents: income.cents ?? 0,
        obligatoryCents: obligatory,
        savingsCents: savings.cents ?? 0,
        spentBeforeTodayCents: 0,
        spentTodayCents: 0,
        today: today(),
      }),
    [income.cents, obligatory, savings.cents],
  );

  const finish = () => {
    const month = yearMonthOf(today());
    upsertPlan({ month, incomeCents: income.cents ?? 0, savingsCents: savings.cents ?? 0 });
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
    router.replace("/");
  };

  const togglePick = (key: string, suggested: Cents, day: number) =>
    setPicks((cur) => {
      const next = { ...cur };
      if (next[key]) delete next[key];
      else next[key] = { amountText: suggested > 0 ? String(suggested / 100).replace(".", ",") : "", cents: suggested || null, day };
      return next;
    });

  const canNext = step === 0 ? (income.cents ?? 0) > 0 : true;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Glow />
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: space["4"], paddingBottom: space["7"], gap: space["5"] }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: "row", gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? colors.brand : colors["surface-2"] }}
            />
          ))}
        </View>

        {step === 0 ? (
          <View style={{ gap: space["5"] }}>
            <View style={{ gap: space["2"] }}>
              <T v="mono-label" muted>1 / 3</T>
              <T v="title-1">Koliko mjesečno primaš?</T>
              <T muted>Plaća i ostali redoviti prihodi. Bez računa i bez prijave.</T>
            </View>
            <AmountField label="Primanja mjesečno" value={income.text} onChange={(text, cents) => setIncome({ text, cents })} />
          </View>
        ) : null}

        {step === 1 ? (
          <View style={{ gap: space["4"] }}>
            <View style={{ gap: space["2"] }}>
              <T v="mono-label" muted>2 / 3</T>
              <T v="title-1">Što ti se naplaćuje svaki mjesec?</T>
              <T muted>Odaberi i upiši iznos. Knjiže se same, a dan prije dobiješ podsjetnik.</T>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {POPULAR_RECURRING.map((p) => (
                <Chip
                  key={p.key}
                  label={p.name}
                  selected={!!picks[p.key]}
                  onPress={() => togglePick(p.key, p.suggestedCents, p.dayOfMonth)}
                  left={<Icon name={p.icon} size={18} color={picks[p.key] ? colors["brand-ink"] : colors.ink} />}
                />
              ))}
            </View>
            {POPULAR_RECURRING.filter((p) => picks[p.key]).map((p) => {
              const pick = picks[p.key]!;
              return (
                <Glass key={p.key} style={{ padding: space["4"], gap: space["3"] }}>
                  <T v="headline">{p.name}</T>
                  <View style={{ flexDirection: "row", gap: space["3"] }}>
                    <View style={{ flex: 2 }}>
                      <AmountField
                        label="Iznos"
                        value={pick.amountText}
                        onChange={(text, cents) => setPicks((c) => ({ ...c, [p.key]: { ...pick, amountText: text, cents } }))}
                      />
                    </View>
                    <View style={{ flex: 1, gap: 6 }}>
                      <T v="caption" muted>Dan u mjesecu</T>
                      <TextInput
                        value={String(pick.day)}
                        keyboardType="number-pad"
                        maxLength={2}
                        accessibilityLabel={`Dan naplate: ${p.name}`}
                        onChangeText={(t) => {
                          const n = Math.min(31, Math.max(1, parseInt(t.replace(/\D/g, ""), 10) || 1));
                          setPicks((c) => ({ ...c, [p.key]: { ...pick, day: n } }));
                        }}
                        style={{
                          minHeight: 56,
                          borderRadius: radius.sm + 2,
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
                </Glass>
              );
            })}
          </View>
        ) : null}

        {step === 2 ? (
          <View style={{ gap: space["5"] }}>
            <View style={{ gap: space["2"] }}>
              <T v="mono-label" muted>3 / 3</T>
              <T v="title-1">Koliko želiš uštedjeti mjesečno?</T>
              <T muted>Može i 0 €. Mijenjaš kad god želiš.</T>
            </View>
            <AmountField label="Štednja mjesečno" value={savings.text} onChange={(text, cents) => setSavings({ text, cents })} placeholder="0,00" />

            <View style={{ backgroundColor: colors.accent, borderRadius: radius.lg + 8, padding: space["5"], gap: space["1"] }}>
              <T v="mono-label" color={colors["on-accent"]}>Preporučeni dnevni trošak</T>
              <T v="amount-hero" color={colors["on-accent"]}>{formatEur(Math.max(0, preview.dailyCents))}</T>
              <T v="caption" color={colors["on-accent"]}>
                Ostalo za trošiti {formatEur(Math.max(0, preview.availableCents))}, još {preview.daysLeft} dana u mjesecu
              </T>
            </View>
          </View>
        ) : null}

        <View style={{ gap: space["2"] }}>
          <Button
            label={step === 2 ? "Počni" : "Dalje"}
            disabled={!canNext}
            onPress={() => (step === 2 ? finish() : setStep(step + 1))}
          />
          {step > 0 ? <Button variant="text" label="Natrag" onPress={() => setStep(step - 1)} /> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
    </View>
  );
}
