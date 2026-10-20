import { useEffect, useState } from "react";
import { Pressable, Switch, TextInput, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { currencyInfo, formatEur, yearMonthOf } from "@unitcent/core";
import { homeCurrency } from "../../src/currency";
import { useAccount } from "../../src/account";
import { DEV_TOOLS, isDevPremium, setDevPremium, usePremium } from "../../src/premium";
import { Avatar, GoldButton } from "../../src/components";
import { AccountCta } from "../../src/AccountSection";
import { useDb } from "../../src/data";
import { TabScreen } from "../../src/layout";
import { monthTitle } from "../../src/format";
import { Icon } from "../../src/icons";
import { Group, Row } from "../../src/settings";
import { textStyle, useTheme, type ThemePreference } from "../../src/theme";
import { useToast } from "../../src/toast";
import { T } from "../../src/ui";
import { getLatestPlanBefore, getMonthSummary, getPlan, kvGet, kvSet, listCategories, savingsStats, today } from "../../src/db/repo";
import { disableReminders, enableReminders, remindersEnabled } from "../../src/notifications";
import { openManageSubscription } from "../../src/purchases";
import { LOCK_AVAILABLE, isLockEnabled, setLockEnabled, unlockMethodLabel } from "../../src/appLock";

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
 * Profil po važnosti: tko si (ime, e-pošta) → poziv na prijavu dok račun nije zaštićen → Premium → Novac
 * (plan, štednja, kategorije, valuta) → Aplikacija (podsjetnici, izgled) → Račun (podaci i privatnost).
 * Sinkronizacija je jedna tiha crta ispod imena.
 */
export default function Profil() {
  const { colors, space, preference, setPreference } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const account = useAccount();
  const premium = usePremium();
  const devPremium = useDb(() => isDevPremium());
  const month = yearMonthOf(today());
  const plan = useDb(() => getPlan(month) ?? getLatestPlanBefore(month));
  const cats = useDb(() => listCategories());
  const summary = useDb(() => getMonthSummary());
  const savings = useDb(() => savingsStats());
  const savedName = useDb(() => kvGet("name") ?? "");
  const [name, setName] = useState(savedName);
  const [reminders, setReminders] = useState(remindersEnabled());
  useEffect(() => setName(savedName), [savedName]);

  const [lock, setLock] = useState(isLockEnabled());
  const [unlockLabel, setUnlockLabel] = useState("Face ID ili otisak prsta");
  useEffect(() => void unlockMethodLabel().then(setUnlockLabel), []);
  const toggleLock = async (on: boolean) => {
    const r = await setLockEnabled(on);
    if (r === "ok") setLock(on);
    else if (r === "not-enrolled") toast.show("Na mobitelu nije postavljen Face ID, otisak ni šifra");
  };

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

  const guest = account.anonymous || !account.hasSession;

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
          {/* Sinkronizacija radi u pozadini i ne prikazuje se; ispod imena je samo e-pošta prijavljenog računa. */}
          {account.email ? <T v="caption" muted numberOfLines={1}>{account.email}</T> : null}
        </View>
      </View>

      {/* Dvije istaknute radnje istog oblika: račun (gost) i Premium */}
      {guest || !premium ? (
        <View style={{ gap: 12, alignItems: "center" }}>
          {guest ? <AccountCta /> : null}
          {premium ? null : <GoldButton label="Nadogradi na Premium" onPress={() => router.push("/premium" as Href)} />}
        </View>
      ) : null}

      {premium ? (
        <Group>
          <Row icon="star" gold title="Premium je aktivan" subtitle="Cijela povijest i neograničeno skeniranje" onPress={() => router.push("/premium" as Href)} />
          {/* Promjena plana i otkazivanje idu preko trgovine; uvijek dostupno, ali tiho. */}
          <Row icon="card" title="Upravljaj pretplatom" external onPress={() => void openManageSubscription()} />
        </Group>
      ) : null}

      <Group title="Novac">
        <Row
          icon="wallet"
          title={`Plan za ${monthTitle(month).replace(/\.$/, "").toLowerCase()}`}
          subtitle={plan ? `${formatEur(plan.incomeCents)} primanja · ${formatEur(summary.limit.availableCents)} za trošenje` : "Postavi primanja"}
          onPress={() => router.push("/plan" as Href)}
        />
        <Row
          icon="card"
          title="Štednja"
          subtitle={`Ušteđeno ${formatEur(savings.totalCents)}${plan && plan.savingsCents > 0 ? ` · ${formatEur(plan.savingsCents)} mjesečno` : ""}`}
          onPress={() => router.push("/stednja" as Href)}
        />
        <Row icon="tag" title="Kategorije" value={String(cats.length)} onPress={() => router.push("/kategorije" as Href)} />
        <Row icon="coins" title="Valuta" value={currencyInfo(homeCurrency()).code} onPress={() => router.push("/valuta" as Href)} />
      </Group>

      <Group title="Aplikacija">
        <Row
          icon="bell"
          title="Podsjetnici naplata"
          subtitle="Dan prije naplate pretplate"
          right={<Switch value={reminders} onValueChange={(v) => void toggleReminders(v)} trackColor={{ false: colors["border-strong"], true: colors.brand }} thumbColor="#ffffff" ios_backgroundColor={colors["border-strong"]} />}
        />
        {LOCK_AVAILABLE ? (
        <Row
          icon="lock"
          title="Zaključaj aplikaciju"
          subtitle={unlockLabel}
          right={<Switch value={lock} onValueChange={(v) => void toggleLock(v)} trackColor={{ false: colors["border-strong"], true: colors.brand }} thumbColor="#ffffff" ios_backgroundColor={colors["border-strong"]} />}
        />
        ) : null}
        {!guest && account.email ? <Row icon="mail" title="E-mailovi" onPress={() => router.push("/email" as Href)} /> : null}
        <Row icon="sun" title="Izgled" right={<ThemeSwitch value={preference} onChange={setPreference} />} />
      </Group>

      <Group title="Račun">
        <Row icon="shield" title="Podaci i privatnost" subtitle="Izvoz, odjava, brisanje računa" onPress={() => router.push("/podaci" as Href)} />
      </Group>

      {DEV_TOOLS ? (
        <Group title="Testiranje" footer="Vidljivo samo u testnim buildovima. Na dev poslužitelju uključuje i Premium ograničenja (npr. 100 skeniranja).">
          <Row
            icon="star"
            gold
            title="Premium (test)"
            right={<Switch value={devPremium} onValueChange={(v) => void setDevPremium(v).then((ok) => !ok && toast.show("Testni Premium vrijedi samo u aplikaciji (poslužitelj nije potvrdio)"))} trackColor={{ false: colors["border-strong"], true: colors.brand }} thumbColor="#ffffff" ios_backgroundColor={colors["border-strong"]} />}
          />
        </Group>
      ) : null}

      <T v="caption" muted style={{ textAlign: "center" }}>UnitCent · verzija {Constants.expoConfig?.version ?? ""}</T>
    </TabScreen>
  );
}
