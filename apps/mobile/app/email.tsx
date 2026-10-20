import { useEffect, useState } from "react";
import { ScrollView, Switch, View } from "react-native";
import { useRouter } from "expo-router";
import { Glow, RoundButton } from "../src/fx";
import { Safe } from "../src/safe";
import { Group, Row } from "../src/settings";
import { useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";
import { useAccount } from "../src/account";
import { cachedEmailPrefs, syncEmailPrefs, type EmailPrefs } from "../src/emailPrefs";

/**
 * E-mailovi: dva izbora. Sažeci su zadano uključeni (odjava jednim klikom u svakom mailu);
 * newsletter je zaseban i uključuje ga samo korisnik (GDPR). Podsjetnik za unos je obavijest, ne mail.
 */
export default function Email() {
  const { colors, space } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const account = useAccount();
  const [prefs, setPrefs] = useState<EmailPrefs>(cachedEmailPrefs());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void syncEmailPrefs().then((p) => p && setPrefs(p));
  }, []);

  const change = async (patch: Partial<EmailPrefs>) => {
    const before = prefs;
    setPrefs({ ...prefs, ...patch }); // odmah u sučelju; vraća se ako poslužitelj odbije
    setBusy(true);
    const next = await syncEmailPrefs(patch);
    setBusy(false);
    if (next) setPrefs(next);
    else {
      setPrefs(before);
      toast.show("Nije spremljeno, provjeri vezu i pokušaj ponovno");
    }
  };

  const toggle = (value: boolean, onChange: (v: boolean) => void) => (
    <Switch
      value={value}
      disabled={busy}
      onValueChange={onChange}
      trackColor={{ false: colors["border-strong"], true: colors.brand }}
      thumbColor="#ffffff"
      ios_backgroundColor={colors["border-strong"]}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Glow />
      <Safe sheet>
        <ScrollView contentContainerStyle={{ padding: space["4"] + 4, gap: space["5"] }} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <T v="title-1" style={{ fontSize: 28, lineHeight: 34 }}>E-mailovi</T>
            <RoundButton icon="x" label="Zatvori" onPress={() => router.back()} />
          </View>
          {account.email ? <T v="caption" muted style={{ marginTop: -space["3"] }}>{account.email}</T> : null}

          <Group footer="Ponedjeljkom kratak sažetak tjedna, prvog u mjesecu pregled mjeseca.">
            <Row icon="chart" title="Sažeci" right={toggle(prefs.product, (v) => void change({ product: v }))} />
          </Group>

          <Group footer="Jedan savjet i novi članak, svaki tjedan ili dva. Bez reklama, odjava jednim klikom.">
            <Row icon="mail" title="Newsletter" right={toggle(prefs.newsletter, (v) => void change({ newsletter: v }))} />
          </Group>
        </ScrollView>
      </Safe>
    </View>
  );
}
