import { Alert, View } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { CURRENCIES, currencyInfo, formatEur } from "@unitcent/core";
import { Icon } from "../src/icons";
import { ModalScreen } from "../src/layout";
import { Group, Row } from "../src/settings";
import { useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";
import { convertFactor, setHomeCurrency, useCurrency } from "../src/currency";

/**
 * Zadana valuta: u njoj se vode plan, troškovi i pretplate. Račun ili pretplata u drugoj valuti se pri unosu
 * pretvaraju po tečaju. Promjena valute pretvara sve postojeće iznose po tečaju, pa traži potvrdu.
 */
export default function Valuta() {
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { home, rates } = useCurrency();

  const pick = (code: string, name: string) => {
    if (code === home) return;
    const factor = convertFactor(home, code, rates.rates);
    if (factor === null) return toast.show("Tečaj za tu valutu još nije poznat");
    const example = `${formatEur(1_000)} → ${formatEur(Math.round(1_000 * factor), { symbol: currencyInfo(code).symbol })}`;
    Alert.alert(`Prebaciti na ${name}?`, `Svi iznosi (plan, troškovi, pretplate, štednja) pretvaraju se po današnjem tečaju: ${example}.`, [
      { text: "Odustani", style: "cancel" },
      {
        text: "Prebaci",
        onPress: () => {
          if (!setHomeCurrency(code)) return toast.show("Tečaj za tu valutu još nije poznat");
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          toast.show(`Valuta: ${name}`);
          router.back();
        },
      },
    ]);
  };

  const rate = (code: string) => {
    if (code === home) return undefined;
    const r = (rates.rates[code] ?? 0) / (rates.rates[home] ?? 1);
    return r > 0 ? `1 ${home} = ${r >= 100 ? r.toFixed(0) : r.toFixed(2).replace(".", ",")} ${code}` : undefined;
  };

  return (
    <ModalScreen eyebrow="Postavke" title="Valuta" onClose={() => router.back()}>
      <Group>
        {CURRENCIES.map((c) => (
          <Row
            key={c.code}
            left={
              <View style={{ width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" }}>
                <T v="headline" style={{ fontWeight: "800" }}>{c.symbol}</T>
              </View>
            }
            title={c.name}
            subtitle={rate(c.code) ?? `Primjer: ${formatEur(123_450, { symbol: c.symbol })}`}
            right={c.code === home ? <Icon name="check" size={20} color={colors.brand} stroke={2.6} /> : <T v="caption" muted>{c.code}</T>}
            onPress={() => pick(c.code, c.name)}
          />
        ))}
      </Group>
    </ModalScreen>
  );
}
