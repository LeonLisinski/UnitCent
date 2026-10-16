import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { formatEur, yearMonthOf, type Cents } from "@unitcent/core";
import { AmountField, Button } from "../src/components";
import { Glow, RoundButton } from "../src/fx";
import { monthTitle } from "../src/format";
import { Safe } from "../src/safe";
import { useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";
import { getLatestPlanBefore, getPlan, today, upsertPlan } from "../src/db/repo";

function toText(c: Cents | undefined): string {
  return c ? (c % 100 === 0 ? String(c / 100) : (c / 100).toFixed(2).replace(".", ",")) : "";
}

/** Mjesečni plan: primanja i štednja. Novi mjesec nasljeđuje prošli plan. */
export default function Plan() {
  const { colors, space } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const month = yearMonthOf(today());
  const plan = getPlan(month) ?? getLatestPlanBefore(month);
  const [income, setIncome] = useState<{ text: string; cents: Cents | null }>({
    text: toText(plan?.incomeCents),
    cents: plan?.incomeCents ?? null,
  });
  const [savings, setSavings] = useState<{ text: string; cents: Cents | null }>({
    text: toText(plan?.savingsCents),
    cents: plan?.savingsCents ?? null,
  });
  const valid = (income.cents ?? 0) > 0;
  const available = (income.cents ?? 0) - (savings.cents ?? 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Glow />
      <Safe>
        <ScrollView contentContainerStyle={{ padding: space["4"] + 4, gap: space["5"] }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <T v="mono-label" muted>Plan za</T>
              <T v="title-1" style={{ fontSize: 28, lineHeight: 34 }}>{monthTitle(month).replace(/\.$/, "")}</T>
            </View>
            <RoundButton icon="x" label="Zatvori" onPress={() => router.back()} />
          </View>

          <View style={{ gap: space["4"] }}>
            <AmountField label="Primanja" value={income.text} onChange={(text, cents) => setIncome({ text, cents })} />
            <AmountField label="Štednja" value={savings.text} onChange={(text, cents) => setSavings({ text, cents })} placeholder="0,00" />
          </View>

          <T v="caption" muted>
            Nakon štednje ostaje {formatEur(Math.max(0, available))}. Od toga se oduzimaju pretplate i fiksni troškovi, a ostatak
            je tvoj preporučeni dnevni trošak.
          </T>

          <Button
            label="Spremi plan"
            disabled={!valid}
            onPress={() => {
              upsertPlan({ month, incomeCents: income.cents ?? 0, savingsCents: savings.cents ?? 0 });
              router.back();
              toast.show("Plan spremljen");
            }}
          />
        </ScrollView>
      </Safe>
    </View>
  );
}
