import { useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Button } from "../src/components";
import { Glass } from "../src/fx";
import { Icon } from "../src/icons";
import { ModalScreen } from "../src/layout";
import { PLANS, YEARLY_SAVING_PCT, setDevPremium, usePremium, type PlanKey } from "../src/premium";
import { purchasePlan, restorePurchases, type PurchaseResult } from "../src/purchases";
import { useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";

/** Što Premium otključava: kratko, s ikonama (zlatna i zelena naizmjence). */
const PERKS: { icon: string; title: string; soon?: boolean }[] = [
  { icon: "calendar", title: "Cijela povijest" },
  { icon: "camera", title: "Skeniranje bez ograničenja" },
  { icon: "chart", title: "Uvidi i savjeti", soon: true },
  { icon: "download", title: "Uvoz podataka", soon: true },
];

function PlanCard({ plan, selected, onPress }: { plan: PlanKey; selected: boolean; onPress: () => void }) {
  const { colors, fx } = useTheme();
  const p = PLANS[plan];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${p.per}, ${p.priceLabel}`}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 96,
        borderRadius: 22,
        padding: 14,
        gap: 4,
        justifyContent: "center",
        backgroundColor: selected ? fx.goldSoft : fx.glass,
        borderWidth: 2,
        borderColor: selected ? fx.gold : fx.glassBorder,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {plan === "yearly" ? (
        <View style={{ alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: fx.gold }}>
          <T v="caption" color="#2a1d00" style={{ fontWeight: "800", fontSize: 11 }}>−{YEARLY_SAVING_PCT} %</T>
        </View>
      ) : (
        <T v="caption" muted>Fleksibilno</T>
      )}
      <T v="amount" style={{ fontSize: 24, lineHeight: 30, fontWeight: "800" }}>{p.priceLabel}</T>
      <T v="caption" muted>{p.per}</T>
      {selected ? (
        <View style={{ position: "absolute", top: 12, right: 12 }}>
          <Icon name="check" size={18} color={fx.gold} stroke={2.6} />
        </View>
      ) : null}
    </Pressable>
  );
}

/** Premium: kratko i privlačno. Odabir mjesečno/godišnje, jedna glavna radnja, tihe sitne poveznice. */
export default function Premium() {
  const { colors, fx } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const premium = usePremium();
  const [plan, setPlan] = useState<PlanKey>("yearly");
  const [busy, setBusy] = useState(false);

  const handle = (r: PurchaseResult, restoring = false) => {
    if (r === "ok") {
      toast.show(restoring ? "Kupnja je vraćena" : "Hvala! Premium je aktivan");
      router.back();
    } else if (r === "unavailable") toast.show("Kupnja je dostupna u službenoj verziji aplikacije");
    else if (r === "error") toast.show(restoring ? "Nema kupnje za vratiti" : "Kupnja nije uspjela, pokušaj ponovno");
  };

  const buy = async () => {
    setBusy(true);
    handle(await purchasePlan(plan));
    setBusy(false);
  };
  const restore = async () => {
    setBusy(true);
    handle(await restorePurchases(), true);
    setBusy(false);
  };

  return (
    <ModalScreen
      title={premium ? "Premium je aktivan" : "Premium"}
      onClose={() => router.back()}
      footer={
        premium ? (
          <Button label="Gotovo" onPress={() => router.back()} />
        ) : (
          <>
            <Button label={`Nastavi · ${PLANS[plan].priceLabel} ${PLANS[plan].per}`} disabled={busy} onPress={() => void buy()} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
              <Pressable accessibilityRole="button" hitSlop={8} onPress={() => void restore()} style={{ paddingHorizontal: 8, minHeight: 36, justifyContent: "center" }}>
                <T v="caption" muted>Vrati kupnju</T>
              </Pressable>
              <T v="caption" muted>·</T>
              <Pressable accessibilityRole="link" hitSlop={8} onPress={() => void Linking.openURL("https://unitcent.com/uvjeti")} style={{ paddingHorizontal: 8, minHeight: 36, justifyContent: "center" }}>
                <T v="caption" muted>Uvjeti</T>
              </Pressable>
              <T v="caption" muted>·</T>
              <Pressable accessibilityRole="link" hitSlop={8} onPress={() => void Linking.openURL("https://unitcent.com/privatnost")} style={{ paddingHorizontal: 8, minHeight: 36, justifyContent: "center" }}>
                <T v="caption" muted>Privatnost</T>
              </Pressable>
            </View>
          </>
        )
      }
    >
      <View style={{ alignItems: "center", paddingTop: 2 }}>
        <View style={{ width: 120, height: 120, alignItems: "center", justifyContent: "center" }}>
          <View style={{ position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: fx.goldSoft }} />
          <View style={{ position: "absolute", width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: fx.gold, opacity: 0.35 }} />
          <LinearGradient
            colors={[fx.gold, colors.brand]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center" }}
          >
            <Icon name="star" size={36} color="#10200f" stroke={2.1} />
          </LinearGradient>
        </View>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {PERKS.map((p, i) => (
          <Glass key={p.title} radius={20} style={{ width: "48%", flexGrow: 1, padding: 14, gap: 10, minHeight: 96 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 13,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: i % 2 === 0 ? fx.goldSoft : "rgba(61,214,163,0.14)",
              }}
            >
              <Icon name={p.icon} size={20} color={i % 2 === 0 ? fx.gold : colors.brand} />
            </View>
            <T v="headline" style={{ fontWeight: "700", fontSize: 15, lineHeight: 20 }}>{p.title}</T>
            {p.soon ? (
              <View style={{ position: "absolute", top: 12, right: 12 }}>
                <T v="caption" color={fx.gold} style={{ fontSize: 10.5, fontWeight: "800" }}>USKORO</T>
              </View>
            ) : null}
          </Glass>
        ))}
      </View>

      {premium ? null : (
        <View style={{ flexDirection: "row", gap: 12 }}>
          <PlanCard plan="monthly" selected={plan === "monthly"} onPress={() => setPlan("monthly")} />
          <PlanCard plan="yearly" selected={plan === "yearly"} onPress={() => setPlan("yearly")} />
        </View>
      )}

      {__DEV__ ? (
        <Button variant="text" size="sm" label={premium ? "(razvoj) Isključi Premium" : "(razvoj) Uključi Premium za test"} onPress={() => setDevPremium(!premium)} />
      ) : null}
    </ModalScreen>
  );
}
