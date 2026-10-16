import { Alert, Linking, ScrollView, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { Glow, RoundButton } from "../src/fx";
import { Safe } from "../src/safe";
import { Group, Row } from "../src/settings";
import { useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";
import { deleteAccountAndData, exportData } from "../src/dataTools";

const SITE = "https://unitcent.com";

/** Rijetko korišteno na jednom mjestu: izvoz, brisanje računa, privatnost i uvjeti. */
export default function Podaci() {
  const { colors, space } = useTheme();
  const router = useRouter();
  const toast = useToast();

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
      <Safe>
        <ScrollView contentContainerStyle={{ padding: space["4"] + 4, gap: space["5"] }} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <T v="title-1" style={{ fontSize: 28, lineHeight: 34 }}>Podaci i privatnost</T>
            <RoundButton icon="x" label="Zatvori" onPress={() => router.back()} />
          </View>

          <Group title="Moji podaci">
            <Row
              icon="download"
              title="Izvezi podatke"
              subtitle="Sve tvoje podatke u JSON datoteci"
              onPress={async () => {
                try {
                  if (!(await exportData())) toast.show("Dijeljenje nije dostupno na ovom uređaju");
                } catch {
                  toast.show("Izvoz nije uspio");
                }
              }}
            />
            <Row icon="trash" danger title="Obriši račun i sve podatke" onPress={confirmDelete} />
          </Group>

          <Group title="Pravno">
            <Row icon="shield" title="Privatnost" external onPress={() => void Linking.openURL(`${SITE}/privatnost`)} />
            <Row icon="file" title="Uvjeti korištenja" external onPress={() => void Linking.openURL(`${SITE}/uvjeti`)} />
          </Group>
        </ScrollView>
      </Safe>
    </View>
  );
}
