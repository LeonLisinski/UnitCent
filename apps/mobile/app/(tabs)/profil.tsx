import { useEffect, useState } from "react";
import { Pressable, Switch, TextInput, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { formatEur, yearMonthOf } from "@unitcent/core";
import { useAccount } from "../../src/account";
import { Avatar } from "../../src/components";
import { AccountCta, SyncLine } from "../../src/AccountSection";
import { useDb } from "../../src/data";
import { TabScreen } from "../../src/layout";
import { monthTitle } from "../../src/format";
import { Icon } from "../../src/icons";
import { Group, Row } from "../../src/settings";
import { textStyle, useTheme, type ThemePreference } from "../../src/theme";
import { useToast } from "../../src/toast";
import { T } from "../../src/ui";
import { getLatestPlanBefore, getPlan, kvGet, kvSet, listCategories, today } from "../../src/db/repo";
import { disableReminders, enableReminders, remindersEnabled } from "../../src/notifications";

const THEMES: { key: ThemePreference; icon: string; label: string }[] = [
  { key: "light", icon: "sun", label: "Svijetla tema" },
  { key: "dark", icon: "moon", label: "Tamna tema" },
  { key: "system", icon: "phone", label: "Tema prema sustavu" },
];

/** Tri ikone u pilulji umjesto trećeg retka s tekstom: svijetla, tamna, prema sustavu. */
function ThemeSwitch({ value, onChange }: { value: ThemePreference; onChange: (p: ThemePreference) => void }) {
  const { colors, fx } = useTheme();
  return (
    <View style={{ flexDirection: "row", backgroundColor: fx.track, borderRadius: 999, padding: 3 }}>
      {THEMES.map((t) => {
        const on = t.key === value;
        return (
          <Pressable
            key={t.key}
            accessibilityRole="button"
            accessibilityLabel={t.label}
            accessibilityState={{ selected: on }}
            onPress={() => {
              void Haptics.selectionAsync();
              onChange(t.key);
            }}
            style={{ width: 42, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: on ? colors.brand : "transparent" }}
          >
            <Icon name={t.icon} size={18} color={on ? colors["on-brand"] : colors["ink-muted"]} />
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Profil po važnosti: tko si → (ako treba) zaštiti podatke → novac → postavke → rijetko korišteno (jedan redak).
 * Sinkronizacija je jedna tiha crta ispod imena.
 */
export default function Profil() {
  const { colors, space, preference, setPreference } = useTheme();
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

  return (
    <TabScreen>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <Avatar size={68} initial={(name.trim() || account.email || "?").charAt(0)} />
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
                style={[textStyle("title-2"), { color: colors.ink, paddingVertical: 2, minHeight: 40 }]}
              />
              <T v="caption" muted numberOfLines={1}>
                {account.email ?? (account.hasSession ? "Gost" : "Samo na ovom uređaju")}
              </T>
              <SyncLine />
            </View>
          </View>

          {account.hasSession && account.anonymous ? <AccountCta /> : null}

          <Group>
            <Row
              icon="wallet"
              title={`Plan za ${monthTitle(month).replace(/\.$/, "").toLowerCase()}`}
              subtitle={plan ? `${formatEur(plan.incomeCents)} primanja · ${formatEur(plan.savingsCents)} štednja` : "Postavi primanja i štednju"}
              onPress={() => router.push("/plan" as Href)}
            />
            <Row icon="tag" title="Kategorije" value={String(cats.length)} onPress={() => router.push("/kategorije" as Href)} />
          </Group>

          <Group>
            <Row
              icon="bell"
              title="Podsjetnici naplata"
              right={<Switch value={reminders} onValueChange={(v) => void toggleReminders(v)} trackColor={{ false: colors["border-strong"], true: colors.brand }} thumbColor="#ffffff" ios_backgroundColor={colors["border-strong"]} />}
            />
            <Row icon="sun" title="Izgled" right={<ThemeSwitch value={preference} onChange={setPreference} />} />
          </Group>

          <Group>
            <Row icon="shield" title="Podaci i privatnost" onPress={() => router.push("/podaci" as Href)} />
          </Group>

          <T v="caption" muted style={{ textAlign: "center" }}>UnitCent · verzija {Constants.expoConfig?.version ?? ""}</T>
    </TabScreen>
  );
}
