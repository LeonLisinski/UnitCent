import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatEur, yearMonthOf, type Cents } from "@unitcent/core";
import { AmountField, Button, Segmented } from "../../src/components";
import { useDb } from "../../src/data";
import { useTheme, type ThemePreference } from "../../src/theme";
import { useToast } from "../../src/toast";
import { T } from "../../src/ui";
import { getLatestPlanBefore, getPlan, today, upsertPlan } from "../../src/db/repo";
import { disableReminders, enableReminders, remindersEnabled } from "../../src/notifications";

const THEMES: { key: ThemePreference; label: string }[] = [
  { key: "system", label: "Sustav" },
  { key: "light", label: "Svijetla" },
  { key: "dark", label: "Tamna" },
];

function toText(c: Cents | undefined): string {
  return c ? (c % 100 === 0 ? String(c / 100) : (c / 100).toFixed(2).replace(".", ",")) : "";
}

export default function Profil() {
  const { colors, radius, space, preference, setPreference } = useTheme();
  const toast = useToast();
  const month = yearMonthOf(today());
  const plan = useDb(() => getPlan(month) ?? getLatestPlanBefore(month));
  const [income, setIncome] = useState<{ text: string; cents: Cents | null }>({ text: "", cents: null });
  const [savings, setSavings] = useState<{ text: string; cents: Cents | null }>({ text: "", cents: null });
  const [reminders, setReminders] = useState(remindersEnabled());

  useEffect(() => {
    if (plan) {
      setIncome({ text: toText(plan.incomeCents), cents: plan.incomeCents });
      setSavings({ text: toText(plan.savingsCents), cents: plan.savingsCents });
    }
  }, [plan?.incomeCents, plan?.savingsCents]);

  const dirty = plan ? income.cents !== plan.incomeCents || (savings.cents ?? 0) !== plan.savingsCents : false;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: space["4"], paddingBottom: space["7"], gap: space["5"] }}
        keyboardShouldPersistTaps="handled"
      >
        <T v="title-1">Profil</T>

        <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: space["4"], gap: space["4"] }}>
          <T v="title-2">Plan za ovaj mjesec</T>
          <AmountField label="Primanja" value={income.text} onChange={(text, cents) => setIncome({ text, cents })} />
          <AmountField label="Štednja" value={savings.text} onChange={(text, cents) => setSavings({ text, cents })} />
          <T v="caption" muted>Trenutno: primanja {formatEur(plan?.incomeCents ?? 0)}, štednja {formatEur(plan?.savingsCents ?? 0)}.</T>
          <Button
            label="Spremi plan"
            disabled={!dirty || (income.cents ?? 0) <= 0}
            onPress={() => {
              upsertPlan({ month, incomeCents: income.cents ?? 0, savingsCents: savings.cents ?? 0 });
              toast.show("Plan spremljen");
            }}
          />
        </View>

        <View style={{ gap: space["2"] }}>
          <T v="mono-label" muted>Podsjetnici naplata</T>
          <Segmented
            value={reminders ? "on" : "off"}
            onChange={async (k) => {
              if (k === "on") {
                const ok = await enableReminders();
                setReminders(ok);
                if (!ok) toast.show("Dopusti obavijesti u postavkama telefona");
              } else {
                await disableReminders();
                setReminders(false);
              }
            }}
            options={[
              { key: "on", label: "Uključeno" },
              { key: "off", label: "Isključeno" },
            ]}
          />
          <T v="caption" muted>Dan prije svake naplate u 9:00. Radi i bez interneta.</T>
        </View>

        <View style={{ gap: space["2"] }}>
          <T v="mono-label" muted>Tema</T>
          <Segmented value={preference} onChange={setPreference} options={THEMES} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
