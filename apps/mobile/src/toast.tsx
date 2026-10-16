import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "./theme";
import { T } from "./ui";

interface ToastState {
  id: number;
  message: string;
  action?: { label: string; run: () => void };
}

const ToastContext = createContext<{ show: (message: string, action?: ToastState["action"]) => void } | null>(null);

/** Kratka poruka s opcijskom radnjom („Poništi“). Nestaje nakon 5 s. */
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

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View
          pointerEvents="box-none"
          style={{ position: "absolute", left: 16, right: 16, bottom: insets.bottom + 84 }}
        >
          <View
            accessibilityLiveRegion="polite"
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
            <T v="headline" color={colors.bg} style={{ flex: 1 }}>{toast.message}</T>
            {toast.action ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  toast.action?.run();
                  setToast(null);
                }}
                style={{ minHeight: 44, paddingHorizontal: 14, justifyContent: "center" }}
              >
                <T v="headline" color={colors.brand}>{toast.action.label}</T>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const v = useContext(ToastContext);
  if (!v) throw new Error("useToast mora biti unutar ToastProvider");
  return v;
}
