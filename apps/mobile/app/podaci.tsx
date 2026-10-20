import { useState } from "react";
import { Alert, Linking, ScrollView, Switch, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { Glow, RoundButton } from "../src/fx";
import { Safe } from "../src/safe";
import { Group, Row } from "../src/settings";
import { useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";
import { deleteAccountAndData, exportData } from "../src/dataTools";
import { analyticsEnabled, setAnalyticsEnabled } from "../src/analytics";
import { reportError } from "../src/monitoring";
import { restorePurchases } from "../src/purchases";
import { signOutAndClear, useAccount } from "../src/account";

const SITE = "https://unitcent.com";

/** Rijetko korišteno na jednom mjestu: izvoz, brisanje računa, privatnost i uvjeti. */
export default function Podaci() {
  const { colors, space } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const account = useAccount();
  const [stats, setStats] = useState(analyticsEnabled());

  const doSignOut = async (force: boolean) => {
    const r = await signOutAndClear(force);
    if (r === "ok") {
      router.dismissAll();
      router.replace("/onboarding" as Href);
    } else if (r === "pending") {
      Alert.alert(
        "Neke izmjene još nisu poslane",
        "Spoji se na internet i pokušaj ponovno. Ako se odjaviš sada, te izmjene se gube.",
        [
          { text: "Odustani", style: "cancel" },
          { text: "Odjavi se svejedno", style: "destructive", onPress: () => void doSignOut(true) },
        ],
      );
    } else toast.show("Odjava nije uspjela, pokušaj ponovno");
  };

  const confirmSignOut = () =>
    Alert.alert(
      "Odjaviti se?",
      "Podaci ostaju spremljeni u tvom računu i vraćaju se kad se ponovno prijaviš. S ovog mobitela se brišu.",
      [
        { text: "Odustani", style: "cancel" },
        { text: "Odjavi se", style: "destructive", onPress: () => void doSignOut(false) },
      ],
    );

  const confirmDelete = () =>
    Alert.alert(
      "Obrisati račun i sve podatke?",
      "Brišu se troškovi, pretplate, kategorije i plan, na mobitelu i u oblaku. Ovo se ne može poništiti.",
      [
        { text: "Odustani", style: "cancel" },
        {
          text: "Obriši sve",
          style: "destructive",
          onPress: async () => {
            const ok = await deleteAccountAndData();
            if (ok) {
              router.dismissAll();
              router.replace("/onboarding" as Href);
            } else toast.show("Brisanje nije uspjelo, provjeri vezu i pokušaj ponovno");
          },
        },
      ],
    );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Glow />
      <Safe sheet>
        <ScrollView contentContainerStyle={{ padding: space["4"] + 4, gap: space["5"] }} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <T v="title-1" style={{ fontSize: 28, lineHeight: 34 }}>Podaci i privatnost</T>
            <RoundButton icon="x" label="Zatvori" onPress={() => router.back()} />
          </View>

          <Group title="Moji podaci">
            <Row
              icon="download"
              title="Izvezi podatke"
              onPress={async () => {
                try {
                  if (!(await exportData())) toast.show("Dijeljenje nije dostupno na ovom uređaju");
                } catch {
                  toast.show("Izvoz nije uspio");
                }
              }}
            />
          </Group>

          <Group title="Premium">
            <Row
              icon="repeat"
              gold
              title="Vrati kupnju"
              onPress={async () => {
                const r = await restorePurchases();
                toast.show(r === "ok" ? "Kupnja je vraćena" : r === "unavailable" ? "Dostupno u službenoj verziji aplikacije" : "Nema kupnje za vratiti");
              }}
            />
          </Group>

          <Group title="Privatnost">
            <Row
              icon="chart"
              title="Anonimna statistika"
              subtitle="Pomaže nam poboljšati aplikaciju. Bez iznosa i osobnih podataka."
              right={
                <Switch
                  value={stats}
                  onValueChange={(v) => {
                    setStats(v);
                    setAnalyticsEnabled(v);
                  }}
                  trackColor={{ false: colors["border-strong"], true: colors.brand }}
                  thumbColor="#ffffff"
                  ios_backgroundColor={colors["border-strong"]}
                />
              }
            />
          </Group>

          <Group title="Pravno">
            <Row icon="shield" title="Privatnost" external onPress={() => void Linking.openURL(`${SITE}/privatnost`)} />
            <Row icon="file" title="Uvjeti korištenja" external onPress={() => void Linking.openURL(`${SITE}/uvjeti`)} />
          </Group>

          {__DEV__ ? (
            <Group title="Razvoj">
              <Row
                icon="info"
                title="Pošalji testnu grešku u Sentry"
                subtitle="Vidi se u Issues nakon nekoliko sekundi"
                onPress={() => {
                  reportError(new Error("Testna greška iz razvoja (UnitCent)"), "dev-test");
                  toast.show("Testna greška poslana");
                }}
              />
            </Group>
          ) : null}

          {account.hasSession && !account.anonymous ? (
            <Group title="Račun">
              <Row icon="user" title="Odjavi se" subtitle={account.email ?? undefined} onPress={confirmSignOut} />
            </Group>
          ) : null}

          {/* Razorna radnja uvijek na samom dnu, odvojena od ostalog (i uz potvrdu). */}
          <Group>
            <Row icon="trash" danger title="Obriši račun i sve podatke" onPress={confirmDelete} />
          </Group>
        </ScrollView>
      </Safe>
    </View>
  );
}
