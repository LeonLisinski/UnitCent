import { useEffect, useRef, type ReactNode } from "react";
import { AccessibilityInfo, Animated, Easing, Modal, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Glass, RoundButton } from "./fx";
import { useInsets, useKeyboardHeight } from "./safe";
import { useTheme } from "./theme";
import { T } from "./ui";

/**
 * Mali donji list: naslov, sadržaj i X; dodir izvan zatvara. Za brz pogled bez novog ekrana (npr. dan u kalendaru).
 * Unutra rade i geste (povlačenje retka), jer Modal ima svoj GestureHandlerRootView.
 * Ulaz je animiran RN Animatedom: Reanimatedove „entering“ animacije unutar Modala na iOS-u se ne pokrenu
 * (list ostane ispod ekrana).
 * `height`: udio visine ekrana za list stalne visine (npr. razgovor); bez njega list je visok koliko sadržaj.
 */
export function Sheet({
  visible,
  title,
  onClose,
  children,
  height,
  titleRight,
}: {
  visible: boolean;
  title: string;
  /** Uz naslov (npr. oznaka Beta). */
  titleRight?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  height?: number;
}) {
  const { colors } = useTheme();
  const insets = useInsets();
  const kb = useKeyboardHeight(); // list se podiže iznad tipkovnice (polje i odgovor ostaju vidljivi)
  const { height: screenH } = useWindowDimensions();
  const y = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;
    y.setValue(1);
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) y.setValue(0);
      else Animated.timing(y, { toValue: 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    });
  }, [visible, y]);

  const bottom = (kb > 0 ? kb : insets.bottom) + 12;
  const fixed = height ? Math.min(screenH * height, screenH - insets.top - bottom - 24) : undefined;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1, justifyContent: "flex-end" }}>
        {/* Pozadina je zaseban sloj iza lista: dodir izvan zatvara, a sadržaj lista (npr. skrolanje razgovora) ne prolazi kroz Pressable. */}
        <Pressable accessibilityLabel="Zatvori" style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.6)" }]} onPress={onClose} />
        <Animated.View style={{ paddingHorizontal: 12, paddingBottom: bottom, transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [0, 400] }) }] }}>
          <Glass radius={28} style={{ padding: 20, gap: 12, backgroundColor: colors.surface, height: fixed }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
                <T v="title-2" numberOfLines={1} style={{ flexShrink: 1 }}>{title}</T>
                {titleRight}
              </View>
              <RoundButton icon="x" label="Zatvori" onPress={onClose} />
            </View>
            {height ? <View style={{ flex: 1 }}>{children}</View> : children}
          </Glass>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}
