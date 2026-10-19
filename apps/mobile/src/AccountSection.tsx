import { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { signInWith, type Provider } from "./account";
import { agoText } from "./format";
import { AppleLogo, GoogleLogo, Icon } from "./icons";
import { syncNow, useSyncStatus } from "./sync";
import { useTheme } from "./theme";
import { useToast } from "./toast";
import { T } from "./ui";

/** Apple prijava se nudi samo na iOS-u i kad je Apple provider podešen (EXPO_PUBLIC_APPLE_SIGNIN=1). */
const APPLE_ENABLED = Platform.OS === "ios" && process.env.EXPO_PUBLIC_APPLE_SIGNIN === "1";

function SocialButton({ provider, busy, onPress }: { provider: Provider; busy: boolean; onPress: () => void }) {
  const { colors, fx } = useTheme();
  const name = provider === "google" ? "Google" : "Apple";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Nastavi s ${provider === "google" ? "Googleom" : "Appleom"}`}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 22,
        minHeight: 48,
        borderRadius: 999,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        backgroundColor: fx.glass,
        borderWidth: 1.5,
        borderColor: fx.glassBorder,
        opacity: busy ? 0.45 : pressed ? 0.7 : 1,
      })}
    >
      {provider === "google" ? <GoogleLogo size={19} /> : <AppleLogo size={19} color={colors.ink} />}
      <T v="headline" style={{ fontSize: 15 }}>{name}</T>
    </Pressable>
  );
}

/**
 * Jedina „glavna“ stvar u Profilu kad račun nije zaštićen: poziv na prijavu. Za prijavljene se ne prikazuje.
 */
export function AccountCta() {
  const { colors, fx } = useTheme();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const signIn = async (provider: Provider) => {
    setBusy(true);
    const r = await signInWith(provider);
    setBusy(false);
    if (r === "linked") toast.show("Račun je zaštićen");
    else if (r === "signed-in") toast.show("Prijavljen u postojeći račun");
    else if (r === "error") toast.show("Prijava nije uspjela, pokušaj ponovno");
  };

  return (
    <View style={{ alignItems: "center", gap: 14, paddingVertical: 4 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Icon name="shield" size={22} color={colors.warning} />
        <View style={{ flexShrink: 1 }}>
          <T v="headline" style={{ fontWeight: "700" }}>Zaštiti svoje podatke</T>
          <T v="caption" muted>Prijavi se da prežive novi mobitel.</T>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 10, justifyContent: "center" }}>
        <SocialButton provider="google" busy={busy} onPress={() => void signIn("google")} />
        {APPLE_ENABLED ? <SocialButton provider="apple" busy={busy} onPress={() => void signIn("apple")} /> : null}
      </View>
    </View>
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
