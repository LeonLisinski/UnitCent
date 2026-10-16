import { useEffect, useState } from "react";
import { Alert, Linking, ScrollView, Switch, TextInput, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import Constants from "expo-constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatEur, yearMonthOf } from "@unitcent/core";
import { useAccount } from "../../src/account";
import { AccountSection } from "../../src/AccountSection";
import { Segmented } from "../../src/components";
import { deleteAccountAndData, exportData } from "../../src/dataTools";
import { useDb } from "../../src/data";
import { Glow } from "../../src/fx";
import { monthTitle } from "../../src/format";
import { Group, Row } from "../../src/settings";
import { textStyle, useTheme, type ThemePreference } from "../../src/theme";
import { useToast } from "../../src/toast";
import { T } from "../../src/ui";
import { getLatestPlanBefore, getPlan, kvGet, kvSet, listCategories, today } from "../../src/db/repo";
import { disableReminders, enableReminders, remindersEnabled } from "../../src/notifications";

const THEMES: { key: ThemePreference; label: string }[] = [
  { key: "system", label: "Sustav" },
  { key: "light", label: "Svijetla" },
  { key: "dark", label: "Tamna" },
];

const SITE = "https://unitcent.com";

/** Profil kao izbornik: zaglavlje s imenom, pa skupine (račun, plan, postavke, podaci, o aplikaciji). */
export default function Profil() {
  const { colors, fx, space, preference, setPreference } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const account = useAccount();
  const month = yearMonthOf(today());
  const plan = useDb(() => getPlan(month) ?? getLatestPlanBefore(month));
  const cats = useDb(() => listCategories());
  const savedName = useDb(() => kvGet("name") ?? "");
  const [name, setName] = useState(savedName);
  const [reminders, setReminders] = useState(remindersEnabled());
  useEffect(() => setName(savedName), [savedName]);

  const toggleReminders = async (on: boolean) => {
    if (on) {
      const ok = await enableReminders();
      setReminders(ok);
      if (!ok) toast.show("Dopusti obavijesti u postavkama telefona");
    } else {
      await disableReminders();
      setReminders(false);
    }
  };

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
            if (ok) router.replace("/onboarding");
            else toast.show("Brisanje nije uspjelo, provjeri vezu i pokušaj ponovno");
          },
        },
      ],
    );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Glow />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          contentContainerStyle={{ padding: space["4"] + 4, paddingTop: space["5"], paddingBottom: 140, gap: space["5"] }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Zaglavlje: avatar, ime (uređuje se izravno) i račun */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <View style={{ width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center", backgroundColor: colors["brand-soft"] }}>
              <T v="title-1" color={colors["brand-ink"]} style={{ fontSize: 28, lineHeight: 34 }}>
                {(name.trim() || account.email || "?").charAt(0).toUpperCase()}
              </T>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <TextInput
                value={name}
                onChangeText={setName}
                onEndEditing={() => kvSet("name", name.trim())}
                placeholder="Tvoje ime"
                placeholderTextColor={colors["ink-muted"]}
                accessibilityLabel="Ime"
                maxLength={24}
                returnKeyType="done"
                style={[textStyle("title-2"), { color: colors.ink, paddingVertical: 4, minHeight: 44 }]}
              />
              <T v="caption" muted numberOfLines={1}>
                {account.email ?? (account.hasSession ? "Gost" : "Samo na ovom uređaju")}
              </T>
            </View>
          </View>

          <AccountSection />

          <Group title="Moj novac">
            <Row
              icon="wallet"
              title={`Plan za ${monthTitle(month).replace(/\.$/, "").toLowerCase()}`}
              subtitle={plan ? `Primanja ${formatEur(plan.incomeCents)} · štednja ${formatEur(plan.savingsCents)}` : "Postavi primanja i štednju"}
              onPress={() => router.push("/plan" as Href)}
            />
            <Row icon="tag" title="Kategorije" value={String(cats.length)} onPress={() => router.push("/kategorije" as Href)} />
          </Group>

          <Group title="Postavke">
            <Row
              icon="bell"
              title="Podsjetnici naplata"
              subtitle="Dan prije, u 9:00. Radi i bez interneta."
              right={<Switch value={reminders} onValueChange={(v) => void toggleReminders(v)} trackColor={{ false: fx.track, true: colors.brand }} thumbColor="#ffffff" />}
            />
            <View>
              <Row icon="sun" title="Izgled" />
              <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
                <Segmented value={preference} onChange={setPreference} options={THEMES} />
              </View>
            </View>
          </Group>

          <Group title="Moji podaci">
            <Row
              icon="download"
              title="Izvezi podatke"
              subtitle="Svi tvoji podaci u JSON datoteci"
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

          <Group title="O aplikaciji">
            <Row icon="shield" title="Privatnost" external onPress={() => void Linking.openURL(`${SITE}/privatnost`)} />
            <Row icon="file" title="Uvjeti korištenja" external onPress={() => void Linking.openURL(`${SITE}/uvjeti`)} />
            <Row icon="info" title="UnitCent" value={`verzija ${Constants.expoConfig?.version ?? ""}`} />
          </Group>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
