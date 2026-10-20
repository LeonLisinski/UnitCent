import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Manrope_500Medium, Manrope_700Bold, Manrope_800ExtraBold } from "@expo-google-fonts/manrope";
import { JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono";
import { useColors } from "../src/theme";

void SplashScreen.preventAutoHideAsync();

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
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />
    </SafeAreaProvider>
  );
}
