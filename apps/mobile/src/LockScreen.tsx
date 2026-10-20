import { useEffect, useRef, useState } from "react";
import { AppState, Platform, StyleSheet, View } from "react-native";
import { FullWindowOverlay } from "react-native-screens";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming, cancelAnimation } from "react-native-reanimated";
import { authenticate, isLockEnabled, LOCK_AFTER_MS } from "./appLock";
import { Button } from "./components";
import { Glow } from "./fx";
import { Icon } from "./icons";
import { useTheme } from "./theme";
import { T } from "./ui";

/**
 * Zaslon zaključavanja preko svega (i preko otvorenih prozora). Kad je zaključavanje uključeno:
 *  - pri pokretanju i nakon povratka iz pozadine (dulje od LOCK_AFTER_MS) traži Face ID / otisak / šifru uređaja;
 *  - dok je aplikacija u pozadini, sadržaj je prekriven (u pregledu otvorenih aplikacija ne vide se iznosi).
 * Dok sistemski upit traje, lokot lagano „diše“ (bez gumba koji se ne stigne dodirnuti); „Pokušaj ponovno“
 * se pojavi tek kad otključavanje ne uspije ili se otkaže. Zamjena za Face ID je šifra uređaja (vidi appLock).
 */
export function LockScreen() {
  const { colors, fx } = useTheme();
  const [locked, setLocked] = useState(() => isLockEnabled());
  const [covered, setCovered] = useState(false);
  const busy = useRef(false); // sistemski upit za Face ID sam mijenja AppState: tada se promjene zanemaruju
  const leftAt = useRef<number | null>(null);
  const [failed, setFailed] = useState(false);

  const unlock = async () => {
    if (busy.current) return;
    busy.current = true;
    setFailed(false);
    const ok = await authenticate();
    busy.current = false;
    if (ok) setLocked(false);
    else setFailed(true);
  };

  // Disanje lokota dok se čeka Face ID / otisak („smanji pokret“: mirno).
  const reduce = useReducedMotion();
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (locked && !failed && !reduce) {
      pulse.value = withRepeat(withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(1, { duration: 150 });
    }
  }, [locked, failed, reduce, pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  useEffect(() => {
    if (locked) void unlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (busy.current || !isLockEnabled()) return;
      if (state === "active") {
        setCovered(false);
        if (leftAt.current !== null && Date.now() - leftAt.current >= LOCK_AFTER_MS) setLocked(true);
        leftAt.current = null;
      } else {
        setCovered(true);
        if (leftAt.current === null) leftAt.current = Date.now();
      }
    });
    return () => sub.remove();
  }, []);

  if (!locked && !covered) return null;

  const screen = (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]}>
      <Glow />
      {locked ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 18, paddingHorizontal: 32 }}>
          <Animated.View style={[{ width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", backgroundColor: fx.glass, borderWidth: 1, borderColor: fx.glassBorder }, pulseStyle]}>
            <Icon name="lock" size={36} color={colors.brand} stroke={1.8} />
          </Animated.View>
          <T v="title-2">UnitCent je zaključan</T>
          {/* Fiksna visina: kad se gumb pojavi, ništa se ne pomiče. */}
          <View style={{ minHeight: 56, justifyContent: "center" }}>
            {failed ? <Button label="Pokušaj ponovno" onPress={() => void unlock()} /> : null}
          </View>
        </View>
      ) : null}
    </View>
  );
  return Platform.OS === "ios" ? <FullWindowOverlay>{screen}</FullWindowOverlay> : <View style={[StyleSheet.absoluteFill, { zIndex: 2000, elevation: 2000 }]}>{screen}</View>;
}
