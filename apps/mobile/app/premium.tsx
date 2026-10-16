import { useEffect, useState } from "react";
import { Linking, Pressable, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { formatEur } from "@unitcent/core";
import { track } from "../src/analytics";
import { Button } from "../src/components";
import { Icon } from "../src/icons";
import { ModalScreen } from "../src/layout";
import { PLANS, YEARLY_SAVING_PCT, setDevPremium, usePremium, type PlanKey } from "../src/premium";
import { purchasePlan, type PurchaseResult } from "../src/purchases";
import { useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";

/**
 * Mjesto za pravu društvenu potvrdu (npr. „Premium korisnici bilježe troškove X puta češće“). Ostaje null dok ne
 * postoji stvarna mjera iz analitike: izmišljene brojke u oglašavanju su obmanjujuće (zakon o zaštiti potrošača).
 */
const SOCIAL_PROOF: string | null = null;

/** Što Premium otključava: zlatna medaljica s ikonom + kratak naziv. */
const PERKS: { icon: string; title: string; hint: string; soon?: boolean }[] = [
  { icon: "calendar", title: "Cijela povijest", hint: "Svi mjeseci, ne samo zadnjih šest" },
  { icon: "camera", title: "Neograničeno skeniranje računa", hint: "Slikaš račun, stavke se razvrstaju same" },
  { icon: "chart", title: "Uvidi i savjeti", hint: "Gdje ti curi novac i što možeš uštedjeti", soon: true },
];

/** Petokraka kao poligon (za medaljon): vanjski i unutarnji polumjer, središte (0,0). */
function starPath(R: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? R : r;
    pts.push(`${(rad * Math.cos(a)).toFixed(2)},${(rad * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}

/** Četverokraki odsjaj (sparkle) oko središta (cx, cy) veličine s. */
function sparkle(cx: number, cy: number, s: number): string {
  const k = s * 0.22;
  return `M${cx} ${cy - s}Q${cx + k} ${cy - k} ${cx + s} ${cy}Q${cx + k} ${cy + k} ${cx} ${cy + s}Q${cx - k} ${cy + k} ${cx - s} ${cy}Q${cx - k} ${cy - k} ${cx} ${cy - s}Z`;
}

/** Glavni znak: metalna zlatna medalja s ispunjenom zvijezdom, koncentričnim prstenovima, sjajem i odsjajima. */
function Medallion({ hi, base, lo, scale = 1 }: { hi: string; base: string; lo: string; scale?: number }) {
  return (
    <Svg width={260 * scale} height={190 * scale} viewBox="0 0 260 190">
      <Defs>
        <RadialGradient id="gl" gradientUnits="userSpaceOnUse" cx={130} cy={95} r={92}>
          <Stop offset="0" stopColor={base} stopOpacity={0.4} />
          <Stop offset="0.6" stopColor={base} stopOpacity={0.08} />
          <Stop offset="1" stopColor={base} stopOpacity={0} />
        </RadialGradient>
        <SvgGradient id="metal" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={hi} />
          <Stop offset="0.38" stopColor={base} />
          <Stop offset="0.62" stopColor={hi} stopOpacity={0.95} />
          <Stop offset="1" stopColor={lo} />
        </SvgGradient>
        <SvgGradient id="star" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#3b2a0a" />
          <Stop offset="1" stopColor="#1f1503" />
        </SvgGradient>
      </Defs>
      <Rect width={260} height={190} fill="url(#gl)" />
      <Circle cx={130} cy={95} r={74} stroke={base} strokeOpacity={0.22} strokeWidth={1} fill="none" />
      <Circle cx={130} cy={95} r={62} stroke={base} strokeOpacity={0.4} strokeWidth={1} fill="none" />
      <Circle cx={130} cy={95} r={50} fill="url(#metal)" />
      <Circle cx={130} cy={95} r={45} stroke={lo} strokeOpacity={0.55} strokeWidth={1.2} fill="none" />
      <Circle cx={130} cy={95} r={50} stroke={hi} strokeOpacity={0.7} strokeWidth={1} fill="none" />
      <Path d={starPath(25, 10.5)} transform="translate(130 96)" fill="url(#star)" stroke="url(#star)" strokeWidth={3} strokeLinejoin="round" />
      <Path d={sparkle(52, 38, 9)} fill={hi} opacity={0.95} />
      <Path d={sparkle(214, 58, 6)} fill={hi} opacity={0.8} />
      <Path d={sparkle(196, 150, 8)} fill={hi} opacity={0.9} />
      <Path d={sparkle(66, 146, 5)} fill={hi} opacity={0.7} />
    </Svg>
  );
}

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
          <LinearGradient colors={[fx.goldHi, fx.gold, fx.goldLo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 }}>
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

/** Premium: zlatna medalja, tri prednosti, odabir plana, jedna glavna radnja, tihe sitne poveznice. */
export default function Premium() {
  const { colors, fx } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const premium = usePremium();
  const [plan, setPlan] = useState<PlanKey>("yearly");
  const [busy, setBusy] = useState(false);
  useEffect(() => track("paywall_viewed"), []);
  const { height } = useWindowDimensions();
  const compact = height < 780; // manji ekrani: manji znak da sve stane bez skrolanja
  const p = PLANS[plan];
  const perMonth = plan === "yearly" ? formatEur(Math.round(PLANS.yearly.cents / 12)) : null;

  const handle = (r: PurchaseResult) => {
    if (r === "ok") {
      toast.show("Hvala! Premium je aktivan");
      router.back();
    } else if (r === "unavailable") toast.show("Kupnja je dostupna u službenoj verziji aplikacije");
    else if (r === "error") toast.show("Kupnja nije uspjela, pokušaj ponovno");
  };
  const buy = async () => {
    setBusy(true);
    track("purchase_started", { plan });
    const result = await purchasePlan(plan);
    track("purchase_result", { plan, result });
    handle(result);
    setBusy(false);
  };

  const quiet = (label: string, onPress: () => void) => (
    <Pressable accessibilityRole="link" hitSlop={8} onPress={onPress} style={{ paddingHorizontal: 8, minHeight: 36, justifyContent: "center" }}>
      <T v="caption" muted>{label}</T>
    </Pressable>
  );

  return (
    <ModalScreen
      scroll={false}
      onClose={() => router.back()}
      footer={
        premium ? (
          <Button label="Gotovo" onPress={() => router.back()} />
        ) : (
          <>
            <Button label={`Nastavi · ${p.priceLabel} ${p.per}`} disabled={busy} onPress={() => void buy()} />
            {__DEV__ ? (
              <Pressable accessibilityRole="button" hitSlop={8} onLongPress={() => setDevPremium(!premium)} style={{ minHeight: 24, justifyContent: "center" }}>
                <T v="caption" muted style={{ fontSize: 10, opacity: 0.5 }}>razvoj: drži dugo za test Premium</T>
              </Pressable>
            ) : null}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {quiet("Uvjeti", () => void Linking.openURL("https://unitcent.com/uvjeti"))}
              <T v="caption" muted>·</T>
              {quiet("Privatnost", () => void Linking.openURL("https://unitcent.com/privatnost"))}
            </View>
          </>
        )
      }
    >
      <View style={{ alignItems: "center" }}>
        <Medallion hi={fx.goldHi} base={fx.gold} lo={fx.goldLo} scale={compact ? 0.78 : 1} />
        <View style={{ alignItems: "center", marginTop: -26, gap: 0 }}>
          <T v="mono-label" muted style={{ fontSize: 11, letterSpacing: 4 }}>UNITCENT</T>
          <T v="serif-accent" color={fx.gold} style={{ fontSize: 44, lineHeight: 52 }}>{premium ? "Premium je aktivan" : "Premium"}</T>
        </View>
        {SOCIAL_PROOF ? (
          <T muted style={{ textAlign: "center", maxWidth: 300, marginTop: 8 }}>{SOCIAL_PROOF}</T>
        ) : null}
      </View>

      <View style={{ gap: 18 }}>
        {PERKS.map((perk) => (
          <View key={perk.title} style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <LinearGradient
              colors={[fx.goldHi, fx.gold, fx.goldLo]}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" }}
            >
              <Icon name={perk.icon} size={21} color="#2a1d00" stroke={2.1} />
            </LinearGradient>
            <View style={{ flex: 1, gap: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <T v="headline" style={{ fontWeight: "700", fontSize: 17, flexShrink: 1 }}>{perk.title}</T>
                {perk.soon ? <T v="caption" color={fx.gold} style={{ fontSize: 10.5, fontWeight: "800" }}>USKORO</T> : null}
              </View>
              <T v="caption" muted style={{ fontSize: 12.5 }}>{perk.hint}</T>
            </View>
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

    </ModalScreen>
  );
}
