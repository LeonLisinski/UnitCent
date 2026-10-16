import type { ReactNode } from "react";
import { Platform, StatusBar, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Sigurni rubovi ekrana. Na Androidu u modalnim ekranima (edge-to-edge) umetci ponekad stignu kao 0,
 * pa se sadržaj nađe ispod statusne trake i ispod trake s tri gumba. Zato imamo donje granice:
 * gore visina statusne trake, dolje 48 dp (traka s tri gumba).
 */
export function useInsets(): { top: number; bottom: number; left: number; right: number } {
  const i = useSafeAreaInsets();
  if (Platform.OS !== "android") return i;
  return { ...i, top: Math.max(i.top, StatusBar.currentHeight ?? 24), bottom: Math.max(i.bottom, 48) };
}

/** Zamjena za SafeAreaView s pouzdanim rubovima. `edges` zadaje koje rubove poštuje (zadano: gore i dolje). */
export function Safe({
  children,
  style,
  edges = ["top", "bottom"],
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: ("top" | "bottom")[];
}) {
  const i = useInsets();
  return (
    <View style={[{ flex: 1, paddingTop: edges.includes("top") ? i.top : 0, paddingBottom: edges.includes("bottom") ? i.bottom : 0 }, style]}>
      {children}
    </View>
  );
}
