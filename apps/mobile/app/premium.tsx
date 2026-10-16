import { Linking, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "../src/components";
import { Icon } from "../src/icons";
import { ModalScreen } from "../src/layout";
import { PRICE, FREE_HISTORY_MONTHS, setDevPremium, usePremium } from "../src/premium";
import { useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";

const BENEFITS: { icon: string; title: string; sub: string }[] = [
  { icon: "calendar", title: "Cijela povijest", sub: `Pregled svih mjeseci, ne samo zadnjih ${FREE_HISTORY_MONTHS}.` },
  { icon: "camera", title: "Skeniranje računa bez ograničenja", sub: "Stavke se same razvrstaju po kategorijama (pošteno korištenje do 100 mjesečno)." },
  { icon: "chart", title: "Uvidi i prijedlozi", sub: "Gdje curi novac i što možeš uštedjeti. Uskoro." },
  { icon: "download", title: "Uvoz podataka", sub: "Prebaci stare podatke iz Excela ili CSV-a. Uskoro." },
];

/** Premium: što otključava i cijena. Kupnja se povezuje s RevenueCatom kad budu buildovi i računi trgovina. */
export default function Premium() {
  const { colors, fx } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const premium = usePremium();

  return (
    <ModalScreen
      eyebrow="UnitCent"
      title="Premium"
      onClose={() => router.back()}
      footer={
        premium ? (
          <Button label="Gotovo" onPress={() => router.back()} />
        ) : (
          <>
            <Button label={`Nastavi · ${PRICE.amount} ${PRICE.period}`} onPress={() => toast.show("Kupnja stiže uskoro")} />
            <Button variant="text" size="sm" label="Vrati kupnju" onPress={() => toast.show("Kupnja stiže uskoro")} />
          </>
        )
      }
    >
      <View style={{ alignItems: "center", gap: 14, paddingTop: 4 }}>
        <LinearGradient
          colors={[colors.brand, fx.accent2]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={{ width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center" }}
        >
          <Icon name="star" size={38} color="#04241a" stroke={2.1} />
        </LinearGradient>
        <T v="title-1" style={{ fontSize: 24, lineHeight: 30, textAlign: "center" }}>
          {premium ? "Premium je aktivan" : `Samo ${PRICE.amount} ${PRICE.period}`}
        </T>
        <T muted style={{ textAlign: "center", maxWidth: 300 }}>
          {premium ? "Hvala što podržavaš UnitCent." : "Sve što već koristiš ostaje besplatno. Premium dodaje ovo:"}
        </T>
      </View>

      <View style={{ gap: 18 }}>
        {BENEFITS.map((b) => (
          <View key={b.title} style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
            <View style={{ width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: fx.track }}>
              <Icon name={b.icon} size={20} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <T v="headline" style={{ fontWeight: "700" }}>{b.title}</T>
              <T v="caption" muted>{b.sub}</T>
            </View>
          </View>
        ))}
      </View>

      {premium ? null : (
        <View style={{ alignItems: "center", gap: 2 }}>
          <T v="caption" muted style={{ textAlign: "center" }}>
            Plaćanje preko Apple App Storea ili Google Playa. Otkaži kad god u postavkama računa trgovine.
          </T>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button variant="text" size="sm" label="Uvjeti" onPress={() => void Linking.openURL("https://unitcent.com/uvjeti")} />
            <Button variant="text" size="sm" label="Privatnost" onPress={() => void Linking.openURL("https://unitcent.com/privatnost")} />
          </View>
        </View>
      )}

      {__DEV__ ? (
        <Button variant="text" size="sm" label={premium ? "(razvoj) Isključi Premium" : "(razvoj) Uključi Premium za test"} onPress={() => setDevPremium(!premium)} />
      ) : null}
    </ModalScreen>
  );
}
