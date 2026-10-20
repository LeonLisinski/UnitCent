import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Platform, Pressable, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { FullWindowOverlay } from "react-native-screens";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "./theme";
import { T } from "./ui";

interface ToastState {
  id: number;
  message: string;
  action?: { label: string; run: () => void };
}

const ToastContext = createContext<{ show: (message: string, action?: ToastState["action"]) => void } | null>(null);

/**
 * Kratka poruka s opcijskom radnjom („Poništi“). Nestaje nakon 5 s ili na dodir.
 * Uvijek pri vrhu i u najvišem sloju (na iOS-u FullWindowOverlay), pa je vidljiva i iznad otvorenog prozora
 * (modal) i ne prekriva tab traku ni gumb „Spremi“ pri dnu.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { colors, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const show = useCallback((message: string, action?: ToastState["action"]) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), message, action });
    timer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setToast(null);
  };

  const body = (t: ToastState) => (
    <Animated.View
      key={t.id}
      entering={FadeInUp.duration(220)}
      exiting={FadeOutUp.duration(160)}
      pointerEvents="box-none"
      style={{ position: "absolute", left: 16, right: 16, top: insets.top + 8 }}
    >
      <Pressable
        accessibilityLiveRegion="polite"
        accessibilityHint="Dodirni za zatvaranje"
        onPress={hide}
        style={{
          backgroundColor: colors.ink,
          borderRadius: radius.md,
          minHeight: 52,
          paddingLeft: 16,
          paddingRight: 6,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <T v="headline" color={colors.bg} style={{ flex: 1, paddingVertical: 12 }}>{t.message}</T>
        {t.action ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              t.action?.run();
              hide();
            }}
            style={{ minHeight: 48, paddingHorizontal: 14, justifyContent: "center" }}
          >
            <T v="headline" color={colors.brand}>{t.action.label}</T>
          </Pressable>
        ) : null}
      </Pressable>
    </Animated.View>
  );


  return (
    <ToastContext.Provider value={value}>
      {children}
      <Layer>{toast ? body(toast) : null}</Layer>
    </ToastContext.Provider>
  );
}

/** Najviši sloj: na iOS-u je modal zaseban prozor, pa obična apsolutna površina ostane ispod njega. */
function Layer({ children }: { children: ReactNode }) {
  if (Platform.OS === "ios") return <FullWindowOverlay>{children}</FullWindowOverlay>;
  return (
    <View pointerEvents="box-none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, elevation: 1000 }}>
      {children}
    </View>
  );
}

export function useToast() {
  const v = useContext(ToastContext);
  if (!v) throw new Error("useToast mora biti unutar ToastProvider");
  return v;
}
