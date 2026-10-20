import { useState } from "react";
import { Alert, Platform, Pressable, View } from "react-native";
import * as Haptics from "expo-haptics";
import { signInWith, type Provider } from "./account";
import { AppleLogo, GoogleLogo } from "./icons";
import { useTheme } from "./theme";
import { useToast } from "./toast";
import { T } from "./ui";

/** Apple prijava se nudi samo na iOS-u i kad je Apple provider podešen (EXPO_PUBLIC_APPLE_SIGNIN=1). */
export const APPLE_ENABLED = Platform.OS === "ios" && process.env.EXPO_PUBLIC_APPLE_SIGNIN === "1";

/**
 * Gumb za prijavu u stilu sistemskih gumba (znak + „Nastavi s …“): bijela pilula na tamnoj temi, gotovo crna na svijetloj.
 * Apple i Google su jednako istaknuti (Apple pravilo 4.8). Isti gumb prijavljuje postojeći račun ili otvara novi.
 */
export function ProviderButton({ provider, label, busy, onPress }: { provider: Provider | "both"; label?: string; busy?: boolean; onPress: () => void }) {
  const { scheme } = useTheme();
  const light = scheme === "light";
  const bg = light ? "#0c1714" : "#ffffff";
  const fg = light ? "#ffffff" : "#0c1714";
  const text = label ?? (provider === "apple" ? "Nastavi s Appleom" : "Nastavi s Googleom");
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityState={{ disabled: !!busy }}
      disabled={busy}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => ({ alignSelf: "center", transform: [{ scale: pressed ? 0.97 : 1 }], opacity: busy ? 0.6 : 1 })}
    >
      <View
        style={{
          minHeight: 54,
          minWidth: 260,
          borderRadius: 999,
          paddingHorizontal: 28,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: light ? "rgba(255,255,255,0.08)" : "rgba(12,23,20,0.08)",
        }}
      >
        {provider !== "google" ? <AppleLogo size={19} color={fg} /> : null}
        {provider !== "apple" ? <GoogleLogo size={19} /> : null}
        <T v="headline" color={fg} style={{ fontWeight: "800" }}>{busy ? "Prijavljujem…" : text}</T>
      </View>
    </Pressable>
  );
}

/** Prijava u Profilu, odmah ispod imena (samo gost). Isti gumb služi i za prijavu i za novi račun. */
export function AccountCta() {
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

  if (!APPLE_ENABLED) return <ProviderButton provider="google" label="Prijava s Googleom" busy={busy} onPress={() => void signIn("google")} />;

  const choose = () =>
    Alert.alert("Prijava ili novi račun", "Ako već imaš račun, prijavit ćeš se u njega.", [
      { text: "Nastavi s Appleom", onPress: () => void signIn("apple") },
      { text: "Nastavi s Googleom", onPress: () => void signIn("google") },
      { text: "Odustani", style: "cancel" },
    ]);
  return <ProviderButton provider="both" label="Prijava ili novi račun" busy={busy} onPress={choose} />;
}
