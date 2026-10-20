import { useState } from "react";
import { Alert, Platform, Pressable, View } from "react-native";
import { signInWith, type Provider } from "./account";
import { AppleLogo, GoogleLogo } from "./icons";
import { useTheme } from "./theme";
import { useToast } from "./toast";
import { T } from "./ui";

/** Apple prijava se nudi samo na iOS-u i kad je Apple provider podešen (EXPO_PUBLIC_APPLE_SIGNIN=1). */
export const APPLE_ENABLED = Platform.OS === "ios" && process.env.EXPO_PUBLIC_APPLE_SIGNIN === "1";

/** Prijava u Profilu, odmah ispod imena (samo gost). S Appleom nudi izbor pružatelja. */
export function AccountCta() {
  const { scheme } = useTheme();
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

  const label = APPLE_ENABLED ? "Napravi račun" : "Napravi račun s Googleom";

  const choose = () => {
    if (!APPLE_ENABLED) return void signIn("google");
    Alert.alert("Napravi račun", undefined, [
      { text: "Nastavi s Appleom", onPress: () => void signIn("apple") },
      { text: "Nastavi s Googleom", onPress: () => void signIn("google") },
      { text: "Odustani", style: "cancel" },
    ]);
  };

  // Isti oblik i veličina kao zlatni „Nadogradi na Premium“ (pilula 54, širina prema sadržaju), u stilu sistemskih
  // gumba za prijavu: bijela pilula na tamnoj temi, gotovo crna na svijetloj. Kontrast je jak u obje teme.
  const light = scheme === "light";
  const bg = light ? "#0c1714" : "#ffffff";
  const fg = light ? "#ffffff" : "#0c1714";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={busy}
      onPress={choose}
      style={({ pressed }) => ({ alignSelf: "center", transform: [{ scale: pressed ? 0.97 : 1 }], opacity: busy ? 0.6 : 1 })}
    >
      <View
        style={{
          minHeight: 54,
          minWidth: 240,
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
        {APPLE_ENABLED ? <AppleLogo size={19} color={fg} /> : <GoogleLogo size={19} />}
        <T v="headline" color={fg} style={{ fontWeight: "800" }}>{busy ? "Prijavljujem…" : label}</T>
      </View>
    </Pressable>
  );
}
