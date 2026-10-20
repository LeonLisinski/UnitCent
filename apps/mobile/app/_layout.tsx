import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { openDatabaseAsync } from "expo-sqlite";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import { InstrumentSerif_400Regular_Italic } from "@expo-google-fonts/instrument-serif";
import { JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono";
import { ThemeProvider, useTheme } from "../src/theme";
import { ToastProvider } from "../src/toast";
import { LockScreen } from "../src/LockScreen";
import { getDb } from "../src/db/client";
import { bookDueRecurring, ensureCategories } from "../src/db/repo";
import { applyProfileName } from "../src/account";
import { initAnalytics } from "../src/analytics";
import { initMonitoring, wrapRoot } from "../src/monitoring";
import { startSync } from "../src/sync";
import { supabase } from "../src/supabase";
import { rescheduleReminders } from "../src/notifications";
import { initCurrency, refreshRates } from "../src/currency";

initMonitoring(); // greške se prate od prvog trenutka

// Splash drži ekran dok se fontovi ne učitaju (nema skakanja teksta na prvom ekranu).
void SplashScreen.preventAutoHideAsync();

/** Baza se otvara sinkrono prije prvog renderiranja ekrana: početni ekran se crta iz lokalnih podataka. */
function initLocalData(): true {
  getDb();
  initAnalytics();
  ensureCategories();
  bookDueRecurring();
  initCurrency();
  return true;
}

function Shell() {
  const { scheme, colors } = useTheme();
  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="dodaj" options={{ presentation: "modal" }} />
        <Stack.Screen name="pretplata" options={{ presentation: "modal" }} />
        <Stack.Screen name="kategorija" options={{ presentation: "modal" }} />
        <Stack.Screen name="skeniraj" options={{ presentation: "fullScreenModal", animation: "fade" }} />
        <Stack.Screen name="pregledaj" options={{ presentation: "modal" }} />
        <Stack.Screen name="plan" options={{ presentation: "modal" }} />
        <Stack.Screen name="kategorije" options={{ presentation: "modal" }} />
        <Stack.Screen name="podaci" options={{ presentation: "modal" }} />
        <Stack.Screen name="transakcije" options={{ presentation: "modal" }} />
        <Stack.Screen name="premium" options={{ presentation: "modal" }} />
        <Stack.Screen name="racun" options={{ presentation: "modal" }} />
        <Stack.Screen name="stednja" options={{ presentation: "modal" }} />
        <Stack.Screen name="stednja-unos" options={{ presentation: "modal" }} />
        <Stack.Screen name="valuta" options={{ presentation: "modal" }} />
      </Stack>
      <LockScreen />
    </>
  );
}

function RootLayout() {
  // Web (samo razvoj): sinkroni SQLite traži da je worker već podignut, pa ga prvo "zagrijemo" asinkronim otvaranjem.
  const [ready, setReady] = useState(() => (Platform.OS === "web" ? false : initLocalData()));
  useEffect(() => {
    if (Platform.OS !== "web") return;
    void (async () => {
      const warm = await openDatabaseAsync("unitcent.db");
      await warm.execAsync("select 1");
      setReady(initLocalData());
    })();
  }, []);
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    InstrumentSerif_400Regular_Italic,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // Pozadinski poslovi: ne blokiraju prikaz.
  useEffect(() => {
    if (!ready) return;
    const stopSync = startSync(); // sesija + sinkronizacija; bez Supabase okruženja radi lokalno
    void applyProfileName();
    const auth = supabase?.auth.onAuthStateChange(() => void applyProfileName());
    void rescheduleReminders();
    void refreshRates();
    return () => {
      stopSync();
      auth?.data.subscription.unsubscribe();
    };
  }, [ready]);

  if (!fontsLoaded || !ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <Shell />
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default wrapRoot(RootLayout);
