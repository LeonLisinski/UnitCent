import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { formatEur, parseAmount, yearMonthOf, type Cents } from "@unitcent/core";
import { AmountField, Button, Chip } from "../src/components";
import { monthTitle } from "../src/format";
import { ModalScreen } from "../src/layout";
import { T } from "../src/ui";
import { useToast } from "../src/toast";
import { effectivePlan, getSavings, savingsStats, setMonthlySavings, setSavings, setSavingsBalance, today } from "../src/db/repo";

const toText = (c: Cents) => (c % 100 === 0 ? String(c / 100) : (c / 100).toFixed(2).replace(".", ","));

/**
 * Jedan iznos štednje, tri namjene (`mode`):
 * - mjesec (zadano): koliko je stvarno prebačeno na štednju u tom mjesecu;
 * - "monthly": koliko štediš svaki mjesec (ide u plan i oduzima se od iznosa za trošenje);
 * - "balance": ukupno stanje štednje (ispravak, npr. prema banci).
 */
export default function StednjaUnos() {
  const router = useRouter();
  const toast = useToast();
  const { month: param, mode } = useLocalSearchParams<{ month?: string; mode?: "monthly" | "balance" }>();
  const thisMonth = yearMonthOf(today());
  const month = param ?? thisMonth;

  const existing = getSavings(month);
  const planned = existing?.plannedCents || effectivePlan(month)?.savingsCents || 0;
  const initial: Cents | null =
    mode === "monthly" ? (effectivePlan(thisMonth)?.savingsCents ?? null) : mode === "balance" ? savingsStats().totalCents : (existing?.actualCents ?? null);
  const [text, setText] = useState(initial ? toText(initial) : "");
  const cents: Cents | null = text ? parseAmount(text) : null;

  const save = () => {
    if (mode === "monthly") {
      setMonthlySavings(thisMonth, cents ?? 0);
      toast.show("Mjesečna štednja spremljena");
    } else if (mode === "balance") {
      setSavingsBalance(thisMonth, cents ?? 0);
      toast.show("Stanje spremljeno");
    } else {
      setSavings(month, cents ?? 0, planned);
      toast.show("Spremljeno");
    }
    router.back();
  };

  const eyebrow = mode === "monthly" ? "Štednja" : mode === "balance" ? "Štednja" : "Prebačeno za";
  const title = mode === "monthly" ? "Mjesečno štedim" : mode === "balance" ? "Ušteđeno ukupno" : monthTitle(month).replace(/\.$/, "");
  const label = mode === "monthly" ? "Iznos svaki mjesec" : mode === "balance" ? "Koliko sada imaš ušteđeno" : "Koliko si prebacio na štednju";
  const help =
    mode === "monthly"
      ? "Ovaj iznos se odvaja od primanja prije dnevnog izračuna. Može i 0 €."
      : mode === "balance"
        ? "Upiši stanje sa štednog računa. Svaka potvrđena štednja dalje se dodaje na njega."
        : null;

  return (
    <ModalScreen eyebrow={eyebrow} title={title} onClose={() => router.back()} footer={<Button label="Spremi" disabled={mode ? false : cents === null} onPress={save} />}>
      <AmountField label={label} value={text} onChange={(t) => setText(t)} placeholder="0,00" />
      {help ? <T v="caption" muted>{help}</T> : null}
      {!mode && planned > 0 ? (
        <View style={{ gap: 10 }}>
          <T v="caption" muted>Planirano {formatEur(planned)}</T>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Chip label={`Sve (${formatEur(planned).replace(",00", "")})`} selected={cents === planned} onPress={() => setText(toText(planned))} />
            <Chip label="Ništa" selected={cents === 0} onPress={() => setText("0")} />
          </View>
        </View>
      ) : null}
    </ModalScreen>
  );
}
