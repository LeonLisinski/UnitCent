import { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { signInWith, useAccount, type Provider } from "./account";
import { Button } from "./components";
import { agoText } from "./format";
import { AppleLogo, GoogleLogo } from "./icons";
import { syncNow, useSyncStatus } from "./sync";
import { useTheme } from "./theme";
import { useToast } from "./toast";
import { T } from "./ui";

/** Apple prijava se nudi samo na iOS-u i kad je Apple provider podešen (EXPO_PUBLIC_APPLE_SIGNIN=1). */
const APPLE_ENABLED = Platform.OS === "ios" && process.env.EXPO_PUBLIC_APPLE_SIGNIN === "1";

function SocialButton({ provider, busy, onPress }: { provider: Provider; busy: boolean; onPress: () => void }) {
  const { colors, fx } = useTheme();
  const label = provider === "google" ? "Nastavi s Googleom" : "Nastavi s Appleom";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 52,
        borderRadius: 999,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        backgroundColor: fx.glass,
        borderWidth: 1.5,
        borderColor: fx.glassBorder,
        opacity: busy ? 0.45 : pressed ? 0.7 : 1,
      })}
    >
      {provider === "google" ? <GoogleLogo size={20} /> : <AppleLogo size={20} color={colors.ink} />}
      <T v="headline">{label}</T>
    </Pressable>
  );
}

/**
 * Račun i podaci na jednom mjestu: tko si (anonimno / Google / Apple), jesu li podaci spremljeni u oblaku
 * i ručna sinkronizacija. Dok sve radi, sinkronizacija je nevidljiva drugdje u aplikaciji.
 */
export function AccountSection() {
  const { colors, space } = useTheme();
  const toast = useToast();
  const account = useAccount();
  const sync = useSyncStatus();
  const [busy, setBusy] = useState(false);

  const signIn = async (provider: Provider) => {
    setBusy(true);
    const r = await signInWith(provider);
    setBusy(false);
    if (r === "linked") toast.show("Račun je zaštićen");
    else if (r === "signed-in") toast.show("Prijavljen u postojeći račun");
    else if (r === "error") toast.show("Prijava nije uspjela, pokušaj ponovno");
  };

  const dot = sync.state === "idle" ? colors.brand : sync.state === "local" ? colors["ink-muted"] : colors.warning;
  const title =
    sync.state === "idle"
      ? "Sve je spremljeno u oblaku"
      : sync.state === "syncing"
        ? "Sinkroniziram…"
        : sync.state === "waiting"
          ? `Čeka slanje: ${sync.pending} ${sync.pending === 1 ? "izmjena" : sync.pending < 5 ? "izmjene" : "izmjena"}`
          : "Samo na ovom uređaju";
  const sub =
    sync.state === "local"
      ? "Nema veze s računom. Podaci su sigurni na mobitelu."
      : sync.lastAt
        ? `Zadnja sinkronizacija ${agoText(sync.lastAt)}`
        : "Još nije sinkronizirano";

  return (
    <View style={{ gap: space["3"] }}>
      <T v="mono-label" muted>Račun i podaci</T>

      {account.hasSession && account.anonymous ? (
        <View style={{ gap: space["2"] }}>
          <T v="headline" style={{ fontWeight: "700" }}>Račun još nije zaštićen</T>
          <T v="caption" muted>
            Prijavi se da podaci prežive novi mobitel ili reinstalaciju. Tvoji podaci se ne mijenjaju.
          </T>
          <SocialButton provider="google" busy={busy} onPress={() => void signIn("google")} />
          {APPLE_ENABLED ? <SocialButton provider="apple" busy={busy} onPress={() => void signIn("apple")} /> : null}
        </View>
      ) : account.hasSession ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 48 }}>
          {account.provider === "apple" ? <AppleLogo size={22} color={colors.ink} /> : <GoogleLogo size={22} />}
          <View style={{ flex: 1 }}>
            <T v="headline" style={{ fontWeight: "700" }} numberOfLines={1}>{account.email ?? "Prijavljen"}</T>
            <T v="caption" muted>Podaci su vezani uz tvoj {account.provider === "apple" ? "Apple" : "Google"} račun.</T>
          </View>
        </View>
      ) : null}

      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 48 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: dot }} />
        <View style={{ flex: 1 }}>
          <T v="headline" style={{ fontWeight: "700" }}>{title}</T>
          <T v="caption" muted>{sub}</T>
        </View>
      </View>
      <Button variant="soft" label="Sinkroniziraj sada" disabled={sync.state === "syncing"} onPress={() => void syncNow()} />
    </View>
  );
}
