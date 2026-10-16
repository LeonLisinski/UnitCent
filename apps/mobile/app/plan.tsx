import { useState } from "react";
import { useRouter } from "expo-router";
import { formatEur, yearMonthOf, type Cents } from "@unitcent/core";
import { AmountField, Button } from "../src/components";
import { monthTitle } from "../src/format";
import { ModalScreen } from "../src/layout";
import { useToast } from "../src/toast";
import { T } from "../src/ui";
import { getLatestPlanBefore, getPlan, today, upsertPlan } from "../src/db/repo";

function toText(c: Cents | undefined): string {
  return c ? (c % 100 === 0 ? String(c / 100) : (c / 100).toFixed(2).replace(".", ",")) : "";
}

/** Mjesečni plan: primanja i štednja. Novi mjesec nasljeđuje prošli plan. */
export default function Plan() {
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
    <ModalScreen
      eyebrow="Plan za"
      title={monthTitle(month).replace(/\.$/, "")}
      onClose={() => router.back()}
      footer={
        <Button
          label="Spremi plan"
          disabled={!valid}
          onPress={() => {
            upsertPlan({ month, incomeCents: income.cents ?? 0, savingsCents: savings.cents ?? 0 });
            router.back();
            toast.show("Plan spremljen");
          }}
        />
      }
    >
      <AmountField label="Primanja" value={income.text} onChange={(text, cents) => setIncome({ text, cents })} />
      <AmountField label="Štednja" value={savings.text} onChange={(text, cents) => setSavings({ text, cents })} placeholder="0,00" />
      <T v="caption" muted>
        Nakon štednje ostaje {formatEur(Math.max(0, available))}. Od toga se oduzimaju pretplate i fiksni troškovi, a ostatak je tvoj
        preporučeni dnevni trošak.
      </T>
    </ModalScreen>
  );
}
