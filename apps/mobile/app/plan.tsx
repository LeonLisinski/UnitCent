import { useState } from "react";
import { View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { formatEur, obligatoryForMonth, occurrenceDate, yearMonthOf, type Cents } from "@unitcent/core";
import { AmountField, Button } from "../src/components";
import { useConfirmDiscard } from "../src/discard";
import { useDb } from "../src/data";
import { monthTitle } from "../src/format";
import { ModalScreen } from "../src/layout";
import { Group, Row } from "../src/settings";
import { useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";
import { effectivePlan, listRecurring, today, upsertPlan } from "../src/db/repo";

function toText(c: Cents | undefined): string {
  return c ? (c % 100 === 0 ? String(c / 100) : (c / 100).toFixed(2).replace(".", ",")) : "";
}

const items = (n: number) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? "stavka" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "stavke" : "stavki"}`;

/**
 * Mjesečni plan: primanja + račun koji pokazuje odakle dolazi iznos za trošenje.
 * Štednja se uređuje na jednom mjestu (ekran Štednja); ovdje se samo vidi i vodi tamo. Novi mjesec nasljeđuje prošli plan.
 */
export default function Plan() {
  const router = useRouter();
  const toast = useToast();
  const { colors, fx } = useTheme();
  const month = yearMonthOf(today());
  const plan = useDb(() => effectivePlan(month));
  const recurring = useDb(() => listRecurring());
  const [income, setIncome] = useState<{ text: string; cents: Cents | null }>({ text: toText(plan?.incomeCents), cents: plan?.incomeCents ?? null });

  const savings = plan?.savingsCents ?? 0;
  const obligatory = obligatoryForMonth(recurring, month);
  const count = recurring.filter((r) => occurrenceDate(r, month) !== null).length;
  const available = (income.cents ?? 0) - obligatory - savings;
  const valid = (income.cents ?? 0) > 0;
  const allowLeave = useConfirmDiscard(income.text !== toText(plan?.incomeCents));

  const line = (label: string, value: string, strong?: boolean, color?: string) => (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingVertical: 6 }}>
      <T v={strong ? "headline" : "body"} muted={!strong} style={strong ? { fontWeight: "800" } : undefined}>{label}</T>
      <T v="amount" color={color} style={{ fontSize: strong ? 22 : 16, fontWeight: "800" }}>{value}</T>
    </View>
  );

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
            upsertPlan({ month, incomeCents: income.cents ?? 0, savingsCents: savings });
            allowLeave();
            router.back();
            toast.show("Plan spremljen");
          }}
        />
      }
    >
      <AmountField label="Primanja" value={income.text} onChange={(text, cents) => setIncome({ text, cents })} autoFocus />

      <View>
        {line("Primanja", formatEur(income.cents ?? 0))}
        {line(`Pretplate i fiksno · ${items(count)}`, `− ${formatEur(obligatory)}`)}
        {line("Štednja", `− ${formatEur(savings)}`)}
        <View style={{ height: 1, backgroundColor: fx.line, marginVertical: 6 }} />
        {line("Za trošenje", formatEur(available), true, available < 0 ? colors.danger : undefined)}
        <T v="caption" muted style={{ marginTop: 4 }}>Podijeljeno s preostalim danima, to je tvoj dnevni budžet.</T>
      </View>

      <Group>
        <Row icon="repeat" title="Pretplate i fiksni troškovi" value={formatEur(obligatory)} onPress={() => router.navigate("/pretplate" as Href)} />
        <Row icon="wallet" title="Mjesečna štednja" value={savings > 0 ? formatEur(savings) : "Ništa"} onPress={() => router.push({ pathname: "/stednja-unos", params: { mode: "monthly" } } as unknown as Href)} />
      </Group>
    </ModalScreen>
  );
}
