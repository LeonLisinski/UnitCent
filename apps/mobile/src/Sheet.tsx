import type { ReactNode } from "react";
import { Modal, Pressable, View } from "react-native";
import Animated, { SlideInDown, useReducedMotion } from "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Glass, RoundButton } from "./fx";
import { useInsets } from "./safe";
import { useTheme } from "./theme";
import { T } from "./ui";

/**
 * Mali donji list: naslov, sadržaj i X; dodir izvan zatvara. Za brz pogled bez novog ekrana (npr. dan u kalendaru).
 * Unutra rade i geste (povlačenje retka), jer Modal ima svoj GestureHandlerRootView.
 */
export function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useInsets();
  const reduce = useReducedMotion();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Pressable accessibilityLabel="Zatvori" style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }} onPress={onClose}>
          <Animated.View entering={reduce ? undefined : SlideInDown.duration(260)}>
            <Pressable onPress={() => undefined} style={{ paddingHorizontal: 12, paddingBottom: insets.bottom + 12 }}>
              <Glass radius={28} style={{ padding: 20, gap: 12, backgroundColor: colors.surface }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <T v="title-2">{title}</T>
                  <RoundButton icon="x" label="Zatvori" onPress={onClose} />
                </View>
                {children}
              </Glass>
            </Pressable>
          </Animated.View>
        </Pressable>
      </GestureHandlerRootView>
    </Modal>
  );
}
