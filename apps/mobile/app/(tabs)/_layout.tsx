import { Redirect, Tabs } from "expo-router";
import { FloatingTabBar, type TabBarProps } from "../../src/TabBar";
import { useDb } from "../../src/data";
import { kvGet } from "../../src/db/repo";

/** Navigacija: Početna · Pregled · [+] · Pretplate · Profil (plutajuća traka, vidi src/TabBar.tsx). */
export default function TabsLayout() {
  const onboarded = useDb(() => kvGet("onboarded") === "1");
  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...(props as unknown as TabBarProps)} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Početna" }} />
      <Tabs.Screen name="pregled" options={{ title: "Pregled" }} />
      <Tabs.Screen name="plus" options={{ title: "" }} />
      <Tabs.Screen name="pretplate" options={{ title: "Pretplate" }} />
      <Tabs.Screen name="profil" options={{ title: "Profil" }} />
    </Tabs>
  );
}
