import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Manrope_500Medium, Manrope_700Bold, Manrope_800ExtraBold } from "@expo-google-fonts/manrope";
import { JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono";
import { StatsProvider, useStats } from "../src/data";
import { MOCK } from "../src/mock";
import { Icon, type IconName } from "../src/icons";
import { signInWithGoogle, supabase, useSession } from "../src/supabase";
import { T, useColors } from "../src/theme";

void SplashScreen.preventAutoHideAsync();

function Center({ children }: { children: ReactNode }) {
  const c = useColors();
  return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16, backgroundColor: c.bg }}>{children}</View>;
}

function PillButton({ label, onPress, secondary }: { label: string; onPress: () => void; secondary?: boolean }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        paddingHorizontal: 24,
        borderRadius: 999,
        justifyContent: "center",
        alignSelf: "center",
        backgroundColor: secondary ? "transparent" : c.brand,
        borderWidth: secondary ? 1 : 0,
        borderColor: c.border,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <T v="title" color={secondary ? c.ink : c["on-brand"]}>{label}</T>
    </Pressable>
  );
}

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: "index", title: "Pregled", icon: "home" },
  { name: "lista", title: "Lista", icon: "list" },
  { name: "korisnici", title: "Korisnici", icon: "users" },
  { name: "prihod", title: "Prihod i AI", icon: "coins" },
  { name: "sadrzaj", title: "Sadržaj", icon: "mail" },
];

function AppTabs() {
  const c = useColors();
  const { result, refresh } = useStats();
  const { session } = useSession();

  if (!result) return <Center><ActivityIndicator color={c.brand} /></Center>;
  if (!result.ok) {
    return (
      <Center>
        <T v="title">{result.reason === "forbidden" ? "Ovaj račun nema pristup" : result.reason === "offline" ? "Nema veze" : "Podaci se nisu učitali"}</T>
        <T muted style={{ textAlign: "center" }}>
          {result.reason === "forbidden" ? `${session?.user.email ?? "Račun"} nije u ADMIN_EMAILS na poslužitelju.` : "Pokušaj ponovno za trenutak."}
        </T>
        <PillButton label="Pokušaj ponovno" onPress={refresh} />
        <PillButton secondary label="Odjava" onPress={() => void supabase?.auth.signOut()} />
      </Center>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: c.bg },
        tabBarActiveTintColor: c.brand,
        tabBarInactiveTintColor: c["ink-muted"],
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border, height: 64, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: "Manrope_700Bold", fontSize: 11 },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title, tabBarIcon: ({ color }) => <Icon name={t.icon} size={22} color={String(color)} /> }} />
      ))}
    </Tabs>
  );
}

function Gate() {
  const c = useColors();
  const { session, ready } = useSession();
  const [busy, setBusy] = useState(false);

  if (MOCK) {
    return (
      <StatsProvider>
        <AppTabs />
      </StatsProvider>
    );
  }
  if (!supabase) {
    return (
      <Center>
        <T v="title">Nedostaje EXPO_PUBLIC_SUPABASE_URL</T>
        <T muted style={{ textAlign: "center" }}>Postavi .env.local u apps/admin (vidi .env.example).</T>
      </Center>
    );
  }
  if (!ready) return <Center><ActivityIndicator color={c.brand} /></Center>;
  if (!session) {
    return (
      <Center>
        <T v="label" color={c["brand-ink"]}>UnitCent admin</T>
        <T v="body" muted style={{ textAlign: "center" }}>Samo za vlasnika. Prijavi se istim Google računom kao u aplikaciji.</T>
        <PillButton
          label={busy ? "Prijavljujem…" : "Prijava s Googleom"}
          onPress={async () => {
            setBusy(true);
            await signInWithGoogle();
            setBusy(false);
          }}
        />
      </Center>
    );
  }
  // key: nova prijava = novo učitavanje podataka
  return (
    <StatsProvider key={session.user.id}>
      <AppTabs />
    </StatsProvider>
  );
}

export default function Root() {
  const c = useColors();
  const [loaded] = useFonts({ Manrope_500Medium, Manrope_700Bold, Manrope_800ExtraBold, JetBrainsMono_500Medium });
  useEffect(() => {
    if (loaded) void SplashScreen.hideAsync();
  }, [loaded]);
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <StatusBar style={c.dark ? "light" : "dark"} />
      <Gate />
    </SafeAreaProvider>
  );
}
