import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { formatEur, parseAmount, yearMonthOf, type Cents } from "@unitcent/core";
import { AmountField, Button, Chip } from "../src/components";
import { monthTitle } from "../src/format";
import { ModalScreen } from "../src/layout";
import { T } from "../src/ui";
import { useToast } from "../src/toast";
import { getPlan, getSavings, setSavings, today } from "../src/db/repo";
import { View } from "react-native";

/** Potvrda ili ispravak štednje za jedan mjesec: koliko je stvarno ušteđeno. */
export default function StednjaUnos() {
  const router = useRouter();
  const toast = useToast();
  const { month: param } = useLocalSearchParams<{ month?: string }>();
  const month = param ?? yearMonthOf(today());
  const existing = getSavings(month);
  const planned = existing?.plannedCents ?? getPlan(month)?.savingsCents ?? 0;
  const initial = existing?.actualCents ?? null;
  const [text, setText] = useState(initial !== null ? (initial % 100 === 0 ? String(initial / 100) : (initial / 100).toFixed(2).replace(".", ",")) : "");
  const cents: Cents | null = text ? parseAmount(text) : null;

  return (
    <ModalScreen
      eyebrow="Štednja za"
      title={monthTitle(month).replace(/\.$/, "")}
      onClose={() => router.back()}
      footer={
        <Button
          label="Spremi"
          disabled={cents === null}
          onPress={() => {
            setSavings(month, cents ?? 0, planned);
            router.back();
            toast.show("Spremljeno");
          }}
        />
      }
    >
      <AmountField label="Koliko je ušteđeno" value={text} onChange={(t) => setText(t)} placeholder="0,00" />
      {planned > 0 ? (
        <View style={{ gap: 10 }}>
          <T v="caption" muted>Planirano {formatEur(planned)}</T>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Chip label={`Sve (${formatEur(planned).replace(",00", "")})`} selected={cents === planned} onPress={() => setText(planned % 100 === 0 ? String(planned / 100) : (planned / 100).toFixed(2).replace(".", ","))} />
            <Chip label="Ništa" selected={cents === 0} onPress={() => setText("0")} />
          </View>
        </View>
      ) : null}
    </ModalScreen>
  );
}
