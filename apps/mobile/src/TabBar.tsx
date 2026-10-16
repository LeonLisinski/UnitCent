import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "./icons";
import { useTheme } from "./theme";
import { T } from "./ui";

/** Najmanje što trebamo od React Navigationove trake (ne ovisimo o njegovim tipovima). */
export interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<string, { options: { title?: string } }>;
  navigation: { navigate: (name: string) => void };
}

const ICONS: Record<string, string> = { index: "home", pregled: "chart", pretplate: "calendar", profil: "user" };

/**
 * Plutajuća tab traka: tabovi u pilulji, sredina je tipka + s blagim sjajem.
 * Sadržaj ekrana ima donji razmak ~120 da ništa ne ostane ispod trake.
 */
export function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const { colors, fx } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", left: 16, right: 16, bottom: Math.max(insets.bottom, 12) + 4 }}
    >
      <View
        style={{
          height: 68,
          borderRadius: 34,
          backgroundColor: fx.tabBg,
          borderWidth: 1,
          borderColor: fx.glassBorder,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-around",
          paddingHorizontal: 8,
          shadowColor: "#000",
          shadowOpacity: 0.18,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
        }}
      >
        {state.routes.map((route, i) => {
          if (route.name === "plus") {
            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityLabel="Dodaj trošak"
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/dodaj");
                }}
                style={{ marginTop: -26 }}
              >
                <View
                  style={{
                    width: 62,
                    height: 62,
                    borderRadius: 31,
                    borderWidth: 6,
                    borderColor: colors.bg,
                    overflow: "hidden",
                    shadowColor: colors.brand,
                    shadowOpacity: 0.55,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 10,
                  }}
                >
                  <LinearGradient
                    colors={[colors.brand, fx.accent2]}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
                  >
                    <Icon name="plus" size={28} color="#04241a" stroke={2.6} />
                  </LinearGradient>
                </View>
              </Pressable>
            );
          }
          const focused = state.index === i;
          const label = descriptors[route.key]?.options.title ?? route.name;
          const color = focused ? colors.brand : colors["ink-muted"];
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={() => {
                void Haptics.selectionAsync();
                navigation.navigate(route.name);
              }}
              style={{ width: 66, alignItems: "center", gap: 2, minHeight: 52, justifyContent: "center" }}
            >
              <View
                style={{
                  width: 52,
                  height: 30,
                  borderRadius: 15,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: focused ? "rgba(61,214,163,0.16)" : "transparent",
                }}
              >
                <Icon name={ICONS[route.name] ?? "dots"} size={23} color={color} stroke={focused ? 2 : 1.7} />
              </View>
              <T v="caption" color={color} style={{ fontSize: 10.5, lineHeight: 13, fontWeight: "700" }}>{label}</T>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
