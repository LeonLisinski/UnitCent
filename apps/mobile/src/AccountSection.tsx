import { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { signInWith, type Provider } from "./account";
import { agoText } from "./format";
import { AppleLogo, GoogleLogo, Icon } from "./icons";
import { Group, Row } from "./settings";
import { syncNow, useSyncStatus } from "./sync";
import { useTheme } from "./theme";
import { useToast } from "./toast";
import { T } from "./ui";

/** Apple prijava se nudi samo na iOS-u i kad je Apple provider podešen (EXPO_PUBLIC_APPLE_SIGNIN=1). */
const APPLE_ENABLED = Platform.OS === "ios" && process.env.EXPO_PUBLIC_APPLE_SIGNIN === "1";

/** Logotip prijave u istom kvadratu kao ikone redaka postavki. */
function ProviderIcon({ provider }: { provider: Provider }) {
  const { colors, fx } = useTheme();
  return (
    <View style={{ width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: fx.track }}>
      {provider === "google" ? <GoogleLogo size={20} /> : <AppleLogo size={20} color={colors.ink} />}
    </View>
  );
}

/**
 * Jedina „glavna“ stvar u Profilu kad račun nije zaštićen: poziv na prijavu. Isti raspored kao ostale skupine
 * (ikona, naslov, podnaslov, strelica), za prijavljene se ne prikazuje.
 */
export function AccountCta() {
  const { colors } = useTheme();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const signIn = async (provider: Provider) => {
    if (busy) return;
    setBusy(true);
    const r = await signInWith(provider);
    setBusy(false);
    if (r === "linked") toast.show("Račun je zaštićen");
    else if (r === "signed-in") toast.show("Prijavljen u postojeći račun");
    else if (r === "error") toast.show("Prijava nije uspjela, pokušaj ponovno");
  };

  return (
    <Group>
      <Row icon="shield" title="Zaštiti svoje podatke" subtitle="Prijavi se da prežive novi mobitel." />
      <Row left={<ProviderIcon provider="google" />} title="Nastavi s Googleom" onPress={() => void signIn("google")} />
      {APPLE_ENABLED ? <Row left={<ProviderIcon provider="apple" />} title="Nastavi s Appleom" onPress={() => void signIn("apple")} /> : null}
    </Group>
  );
}

/** Jedna tiha crta stanja: točka + „Spremljeno“. Dodir pokreće sinkronizaciju. */
export function SyncLine() {
  const { colors } = useTheme();
  const sync = useSyncStatus();
  const dot = sync.state === "idle" ? colors.brand : sync.state === "local" ? colors["ink-muted"] : colors.warning;
  const text =
    sync.state === "idle"
      ? sync.lastAt
        ? `Spremljeno u oblaku · ${agoText(sync.lastAt)}`
        : "Spremljeno u oblaku"
      : sync.state === "syncing"
        ? "Sinkroniziram…"
        : sync.state === "waiting"
          ? `Čeka slanje (${sync.pending})`
          : "Samo na ovom uređaju";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${text}. Dodirni za sinkronizaciju`}
      disabled={sync.state === "syncing" || sync.state === "local"}
      hitSlop={8}
      onPress={() => void syncNow()}
      style={{ flexDirection: "row", alignItems: "center", gap: 7, minHeight: 24 }}
    >
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot }} />
      <T v="caption" muted numberOfLines={1} style={{ flexShrink: 1 }}>{text}</T>
    </Pressable>
  );
}
