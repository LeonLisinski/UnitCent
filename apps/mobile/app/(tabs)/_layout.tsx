import { Pressable, View, type ColorValue } from "react-native";
import { Redirect, Tabs, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Icon } from "../../src/icons";
import { textStyle, useTheme } from "../../src/theme";
import { useDb } from "../../src/data";
import { kvGet } from "../../src/db/repo";

/** Navigacija: Početna · Pregled · [+] · Pretplate · Profil. Tipka + otvara bottom sheet za unos. */
export default function TabsLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  const onboarded = useDb(() => kvGet("onboarded") === "1");

  if (!onboarded) return <Redirect href="/onboarding" />;

  const tabIcon = (name: string) =>
    function TabIcon({ color }: { color: ColorValue }) {
      return <Icon name={name} size={24} color={typeof color === "string" ? color : colors.ink} />;
    };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors["ink-muted"],
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        tabBarLabelStyle: { ...textStyle("caption"), fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Početna", tabBarIcon: tabIcon("home") }} />
      <Tabs.Screen name="pregled" options={{ title: "Pregled", tabBarIcon: tabIcon("chart") }} />
      <Tabs.Screen
        name="plus"
        options={{
          title: "",
          tabBarButton: () => (
            <View style={{ flex: 1, alignItems: "center" }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Dodaj trošak"
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/dodaj");
                }}
                style={({ pressed }) => ({
                  marginTop: -14,
                  width: 58,
                  height: 58,
                  borderRadius: 29,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: pressed ? colors["brand-pressed"] : colors.brand,
                })}
              >
                <Icon name="plus" size={28} color={colors["on-brand"]} stroke={2.4} />
              </Pressable>
            </View>
          ),
        }}
      />
      <Tabs.Screen name="pretplate" options={{ title: "Pretplate", tabBarIcon: tabIcon("calendar") }} />
      <Tabs.Screen name="profil" options={{ title: "Profil", tabBarIcon: tabIcon("user") }} />
    </Tabs>
  );
}
