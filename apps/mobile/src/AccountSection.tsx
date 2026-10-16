import { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { signInWith, useAccount, type Provider } from "./account";
import { agoText } from "./format";
import { AppleLogo, GoogleLogo, Icon } from "./icons";
import { Group, Row } from "./settings";
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
        alignSelf: "center",
        minWidth: 264,
        paddingHorizontal: 24,
        minHeight: 52,
        borderRadius: 999,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        backgroundColor: fx.track,
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
 * Račun i podaci: tko si (gost / Google / Apple), jesu li podaci spremljeni u oblaku i ručna sinkronizacija.
 * Dok sve radi, sinkronizacija je nevidljiva drugdje u aplikaciji.
 */
export function AccountSection() {
  const { colors, fx } = useTheme();
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
      ? "Podaci su sigurni na mobitelu"
      : sync.lastAt
        ? `Zadnja sinkronizacija ${agoText(sync.lastAt)}`
        : "Još nije sinkronizirano";

  return (
    <Group title="Račun i podaci">
      {account.hasSession && account.anonymous ? (
        <View style={{ padding: 16, gap: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: fx.track }}>
              <Icon name="shield" size={19} color={colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <T v="headline" style={{ fontWeight: "700" }}>Zaštiti svoje podatke</T>
              <T v="caption" muted>Prijavi se da prežive novi mobitel ili reinstalaciju. Tvoji podaci se ne mijenjaju.</T>
            </View>
          </View>
          <SocialButton provider="google" busy={busy} onPress={() => void signIn("google")} />
          {APPLE_ENABLED ? <SocialButton provider="apple" busy={busy} onPress={() => void signIn("apple")} /> : null}
        </View>
      ) : account.hasSession ? (
        <Row
          left={account.provider === "apple" ? <AppleLogo size={26} color={colors.ink} /> : <GoogleLogo size={26} />}
          title={account.email ?? "Prijavljen"}
          subtitle={`Povezano s ${account.provider === "apple" ? "Appleom" : "Googleom"}`}
        />
      ) : null}

      <Row
        left={
          <View style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}>
            <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: dot }} />
          </View>
        }
        title={title}
        subtitle={sub}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sinkroniziraj sada"
            disabled={sync.state === "syncing"}
            hitSlop={10}
            onPress={() => void syncNow()}
            style={({ pressed }) => ({ opacity: sync.state === "syncing" ? 0.35 : pressed ? 0.5 : 1, padding: 6 })}
          >
            <Icon name="repeat" size={21} color={colors.brand} />
          </Pressable>
        }
      />
    </Group>
  );
}
