import { useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { formatEur } from "@unitcent/core";
import { Button } from "../src/components";
import { Icon } from "../src/icons";
import { ModalScreen } from "../src/layout";
import { FREE_HISTORY_MONTHS, PLANS, YEARLY_SAVING_PCT, setDevPremium, usePremium, type PlanKey } from "../src/premium";
import { purchasePlan, restorePurchases, type PurchaseResult } from "../src/purchases";
import { useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";

/**
 * Mjesto za pravu društvenu potvrdu (npr. „Premium korisnici bilježe troškove X puta češće“). Ostaje null dok ne
 * postoji stvarna mjera iz analitike: izmišljene brojke u oglašavanju su obmanjujuće (zakon o zaštiti potrošača).
 */
const SOCIAL_PROOF: string | null = null;

/** Što Premium otključava: ikona + kratak naziv, bez kutija. Zlatna i zelena naizmjence. */
const PERKS: { icon: string; title: string; soon?: boolean }[] = [
  { icon: "calendar", title: "Cijela povijest" },
  { icon: "camera", title: "Skeniranje računa" },
  { icon: "chart", title: "Uvidi i savjeti", soon: true },
];

/** Prebacivač plana: pilula s dvije opcije; godišnja nosi zlatnu oznaku uštede. */
function PlanToggle({ value, onChange }: { value: PlanKey; onChange: (p: PlanKey) => void }) {
  const { colors, fx } = useTheme();
  const opt = (key: PlanKey, label: string) => {
    const on = value === key;
    return (
      <Pressable
        key={key}
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
        onPress={() => {
          void Haptics.selectionAsync();
          onChange(key);
        }}
        style={{
          flex: 1,
          minHeight: 46,
          borderRadius: 23,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          backgroundColor: on ? colors.surface : "transparent",
          borderWidth: on ? 1 : 0,
          borderColor: on ? fx.gold : "transparent",
        }}
      >
        <T v="headline" muted={!on} style={{ fontSize: 15 }}>{label}</T>
        {key === "yearly" ? (
          <LinearGradient colors={[fx.goldHi, fx.goldLo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 }}>
            <T v="caption" color="#2a1d00" style={{ fontSize: 11, fontWeight: "800", lineHeight: 15 }}>−{YEARLY_SAVING_PCT} %</T>
          </LinearGradient>
        ) : null}
      </Pressable>
    );
  };
  return (
    <View style={{ flexDirection: "row", backgroundColor: fx.track, borderRadius: 26, padding: 3 }}>
      {opt("monthly", "Mjesečno")}
      {opt("yearly", "Godišnje")}
    </View>
  );
}

/** Premium: kratko i privlačno. Zlatna + zelena, bez kartica; odabir plana, jedna glavna radnja, tihe sitne poveznice. */
export default function Premium() {
  const { colors, fx } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const premium = usePremium();
  const [plan, setPlan] = useState<PlanKey>("yearly");
  const [busy, setBusy] = useState(false);
  const p = PLANS[plan];
  const perMonth = plan === "yearly" ? formatEur(Math.round(PLANS.yearly.cents / 12)) : null;

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

  const quiet = (label: string, onPress: () => void) => (
    <Pressable accessibilityRole="button" hitSlop={8} onPress={onPress} style={{ paddingHorizontal: 8, minHeight: 36, justifyContent: "center" }}>
      <T v="caption" muted>{label}</T>
    </Pressable>
  );

  return (
    <ModalScreen
      title={premium ? "Premium je aktivan" : "Premium"}
      onClose={() => router.back()}
      footer={
        premium ? (
          <Button label="Gotovo" onPress={() => router.back()} />
        ) : (
          <>
            <Button label={`Nastavi · ${p.priceLabel} ${p.per}`} disabled={busy} onPress={() => void buy()} />
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {quiet("Vrati kupnju", () => void restore())}
              <T v="caption" muted>·</T>
              {quiet("Uvjeti", () => void Linking.openURL("https://unitcent.com/uvjeti"))}
              <T v="caption" muted>·</T>
              {quiet("Privatnost", () => void Linking.openURL("https://unitcent.com/privatnost"))}
            </View>
          </>
        )
      }
    >
      <View style={{ alignItems: "center" }}>
        <View style={{ width: 132, height: 132, alignItems: "center", justifyContent: "center" }}>
          <View style={{ position: "absolute", width: 132, height: 132, borderRadius: 66, backgroundColor: fx.goldSoft }} />
          <View style={{ position: "absolute", width: 108, height: 108, borderRadius: 54, borderWidth: 1, borderColor: fx.gold, opacity: 0.4 }} />
          <LinearGradient colors={[fx.goldHi, fx.goldLo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" }}>
            <Icon name="star" size={38} color="#2a1d00" stroke={2.1} />
          </LinearGradient>
        </View>
      </View>

      <View style={{ alignItems: "center", gap: 6 }}>
        <T v="title-1" style={{ fontSize: 22, lineHeight: 28, textAlign: "center" }}>
          {premium ? "Dobrodošao u Premium" : "Pridruži se Premium korisnicima"}
        </T>
        <T muted style={{ textAlign: "center", maxWidth: 300 }}>
          {SOCIAL_PROOF ?? "Za one koji žele znati kamo odlazi svaki euro, bez ograničenja i bez ručnog prepisivanja računa."}
        </T>
      </View>

      <View style={{ gap: 20 }}>
        {PERKS.map((perk) => (
          <View key={perk.title} style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <View style={{ width: 44, alignItems: "center" }}>
              <Icon name={perk.icon} size={26} color={fx.gold} stroke={1.9} />
            </View>
            <T v="headline" style={{ fontWeight: "700", fontSize: 17 }}>{perk.title}</T>
            {perk.soon ? <T v="caption" color={fx.gold} style={{ fontSize: 10.5, fontWeight: "800" }}>USKORO</T> : null}
          </View>
        ))}
      </View>

      {premium ? null : (
        <View style={{ gap: 18 }}>
          <PlanToggle value={plan} onChange={setPlan} />
          <View style={{ alignItems: "center", gap: 2 }}>
            <T v="amount-hero" style={{ fontSize: 44, lineHeight: 50, letterSpacing: -1.5 }}>{p.priceLabel}</T>
            <T v="caption" muted>{p.per}{perMonth ? ` · ${perMonth} mjesečno` : ""}</T>
          </View>
        </View>
      )}

      {__DEV__ ? (
        <Button variant="text" size="sm" label={premium ? "(razvoj) Isključi Premium" : "(razvoj) Uključi Premium za test"} onPress={() => setDevPremium(!premium)} />
      ) : null}
    </ModalScreen>
  );
}
