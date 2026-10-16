import { useEffect, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatEur, yearMonthOf, type Cents } from "@unitcent/core";
import { AmountField, Button, CatIcon, Segmented } from "../../src/components";
import { useDb } from "../../src/data";
import { Glass, Glow } from "../../src/fx";
import { textStyle, useTheme, type ThemePreference } from "../../src/theme";
import { useToast } from "../../src/toast";
import { T } from "../../src/ui";
import { getLatestPlanBefore, listCategories, getPlan, kvGet, kvSet, today, upsertPlan } from "../../src/db/repo";
import { signInWithGoogle, useAccount } from "../../src/account";
import { agoText } from "../../src/format";
import { syncNow, useSyncStatus } from "../../src/sync";
import { disableReminders, enableReminders, remindersEnabled } from "../../src/notifications";

const THEMES: { key: ThemePreference; label: string }[] = [
  { key: "system", label: "Sustav" },
  { key: "light", label: "Svijetla" },
  { key: "dark", label: "Tamna" },
];

function toText(c: Cents | undefined): string {
  return c ? (c % 100 === 0 ? String(c / 100) : (c / 100).toFixed(2).replace(".", ",")) : "";
}

export default function Profil() {
  const { colors, fx, space, preference, setPreference } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const cats = useDb(() => listCategories());
  const month = yearMonthOf(today());
  const plan = useDb(() => getPlan(month) ?? getLatestPlanBefore(month));
  const savedName = useDb(() => kvGet("name") ?? "");
  const [name, setName] = useState(savedName);
  const [income, setIncome] = useState<{ text: string; cents: Cents | null }>({ text: "", cents: null });
  const [savings, setSavings] = useState<{ text: string; cents: Cents | null }>({ text: "", cents: null });
  const sync = useSyncStatus();
  const account = useAccount();
  const [signingIn, setSigningIn] = useState(false);
  const [reminders, setReminders] = useState(remindersEnabled());

  useEffect(() => {
    if (plan) {
      setIncome({ text: toText(plan.incomeCents), cents: plan.incomeCents });
      setSavings({ text: toText(plan.savingsCents), cents: plan.savingsCents });
    }
  }, [plan?.incomeCents, plan?.savingsCents]);

  const dirty = plan ? income.cents !== plan.incomeCents || (savings.cents ?? 0) !== plan.savingsCents : false;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Glow />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          contentContainerStyle={{ padding: space["4"] + 4, paddingBottom: 140, gap: space["5"] }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <T v="title-1" style={{ fontSize: 30, lineHeight: 36 }}>Profil</T>

          <View style={{ gap: 6 }}>
            <T v="caption" muted>Ime (za pozdrav)</T>
            <TextInput
              value={name}
              onChangeText={setName}
              onEndEditing={() => kvSet("name", name.trim())}
              placeholder="npr. Luka"
              placeholderTextColor={colors["ink-muted"]}
              accessibilityLabel="Ime"
              style={[
                textStyle("body"),
                {
                  minHeight: 56,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: fx.glassBorder,
                  backgroundColor: fx.glass,
                  color: colors.ink,
                  paddingHorizontal: 16,
                },
              ]}
            />
          </View>

          <Glass style={{ padding: space["4"], gap: space["4"] }}>
            <T v="title-2">Plan za ovaj mjesec</T>
            <AmountField label="Primanja" value={income.text} onChange={(text, cents) => setIncome({ text, cents })} />
            <AmountField label="Štednja" value={savings.text} onChange={(text, cents) => setSavings({ text, cents })} />
            <T v="caption" muted>
              Trenutno: primanja {formatEur(plan?.incomeCents ?? 0)}, štednja {formatEur(plan?.savingsCents ?? 0)}.
            </T>
            <Button
              label="Spremi plan"
              disabled={!dirty || (income.cents ?? 0) <= 0}
              onPress={() => {
                upsertPlan({ month, incomeCents: income.cents ?? 0, savingsCents: savings.cents ?? 0 });
                toast.show("Plan spremljen");
              }}
            />
          </Glass>

          {account.hasSession ? (
            <View style={{ gap: space["2"] }}>
              <T v="mono-label" muted>Račun</T>
              {account.anonymous ? (
                <>
                  <T v="headline" style={{ fontWeight: "700" }}>Račun još nije zaštićen</T>
                  <T v="caption" muted>
                    Prijavi se da podaci prežive novi mobitel ili reinstalaciju. Prijava ne mijenja ništa u tvojim podacima.
                  </T>
                  <Button
                    label={signingIn ? "Prijavljujem…" : "Nastavi s Googleom"}
                    disabled={signingIn}
                    onPress={async () => {
                      setSigningIn(true);
                      const r = await signInWithGoogle();
                      setSigningIn(false);
                      if (r === "linked") toast.show("Račun je zaštićen");
                      else if (r === "signed-in") toast.show("Prijavljen u postojeći račun");
                      else if (r === "error") toast.show("Prijava nije uspjela, pokušaj ponovno");
                    }}
                  />
                </>
              ) : (
                <>
                  <T v="headline" style={{ fontWeight: "700" }}>{account.email ?? "Prijavljen"}</T>
                  <T v="caption" muted>Podaci su vezani uz tvoj Google račun.</T>
                </>
              )}
            </View>
          ) : null}

          <View style={{ gap: space["2"] }}>
            <T v="mono-label" muted>Podaci</T>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 48 }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: sync.state === "idle" ? colors.brand : sync.state === "local" ? colors["ink-muted"] : colors.warning,
                }}
              />
              <View style={{ flex: 1 }}>
                <T v="headline" style={{ fontWeight: "700" }}>
                  {sync.state === "idle"
                    ? "Sve je spremljeno u oblaku"
                    : sync.state === "syncing"
                      ? "Sinkroniziram…"
                      : sync.state === "waiting"
                        ? `Čeka slanje: ${sync.pending} ${sync.pending === 1 ? "izmjena" : sync.pending < 5 ? "izmjene" : "izmjena"}`
                        : "Samo na ovom uređaju"}
                </T>
                <T v="caption" muted>
                  {sync.state === "local"
                    ? "Nema veze s računom. Podaci su sigurni na mobitelu."
                    : sync.lastAt
                      ? `Zadnja sinkronizacija ${agoText(sync.lastAt)}`
                      : "Još nije sinkronizirano"}
                </T>
              </View>
            </View>
            <Button variant="soft" label="Sinkroniziraj sada" disabled={sync.state === "syncing"} onPress={() => void syncNow()} />
          </View>

          <View style={{ gap: 4 }}>
            <T v="mono-label" muted>Kategorije</T>
            {cats.map((c, i) => (
              <Pressable
                key={c.id}
                accessibilityRole="button"
                accessibilityLabel={`Uredi kategoriju ${c.name}`}
                onPress={() => router.push({ pathname: "/kategorija", params: { id: c.id } })}
                style={{ minHeight: 56, flexDirection: "row", alignItems: "center", gap: 14, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: fx.line }}
              >
                <CatIcon colorToken={c.colorToken} icon={c.icon} size={36} />
                <T v="headline" style={{ flex: 1, fontWeight: "700" }} numberOfLines={1}>{c.name}</T>
                <T v="caption" muted>Uredi</T>
              </Pressable>
            ))}
            <Button variant="soft" label="Nova kategorija" onPress={() => router.push("/kategorija")} style={{ marginTop: space["2"] }} />
          </View>

          <View style={{ gap: space["2"] }}>
            <T v="mono-label" muted>Podsjetnici naplata</T>
            <Segmented
              value={reminders ? "on" : "off"}
              onChange={async (k) => {
                if (k === "on") {
                  const ok = await enableReminders();
                  setReminders(ok);
                  if (!ok) toast.show("Dopusti obavijesti u postavkama telefona");
                } else {
                  await disableReminders();
                  setReminders(false);
                }
              }}
              options={[
                { key: "on", label: "Uključeno" },
                { key: "off", label: "Isključeno" },
              ]}
            />
            <T v="caption" muted>Dan prije svake naplate u 9:00. Radi i bez interneta.</T>
          </View>

          <View style={{ gap: space["2"] }}>
            <T v="mono-label" muted>Tema</T>
            <Segmented value={preference} onChange={setPreference} options={THEMES} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
