import { Pressable, View } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { textStyle, useTheme } from "../../src/theme";

/** Navigacija: Početna · Pregled · [+] · Pretplate · Profil. Tipka + otvara bottom sheet za unos (Faza 1). */
export default function TabsLayout() {
  const { colors } = useTheme();
  const router = useRouter();

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
      <Tabs.Screen name="index" options={{ title: "Početna" }} />
      <Tabs.Screen name="pregled" options={{ title: "Pregled" }} />
      <Tabs.Screen
        name="dodaj"
        options={{
          title: "",
          tabBarButton: () => (
            <View style={{ flex: 1, alignItems: "center" }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Dodaj trošak"
                onPress={() => router.push("/dodaj")}
                style={({ pressed }) => ({
                  marginTop: -14,
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: pressed ? colors["brand-pressed"] : colors.brand,
                })}
              >
                <View style={{ width: 22, height: 3, borderRadius: 2, backgroundColor: colors["on-brand"] }} />
                <View style={{ position: "absolute", width: 3, height: 22, borderRadius: 2, backgroundColor: colors["on-brand"] }} />
              </Pressable>
            </View>
          ),
        }}
      />
      <Tabs.Screen name="pretplate" options={{ title: "Pretplate" }} />
      <Tabs.Screen name="profil" options={{ title: "Profil" }} />
    </Tabs>
  );
}
