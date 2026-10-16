import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pressable, View, useWindowDimensions, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { formatEur, type Cents } from "@unitcent/core";
import { fitFontSize } from "./format";
import { Icon } from "./icons";
import { useTheme } from "./theme";
import { T } from "./ui";

/* ---------- ambijentalni sjaj: jedan izvor svjetla ---------- */

export function Glow() {
  const { fx } = useTheme();
  const { width } = useWindowDimensions();
  const size = 560;
  return (
    <View pointerEvents="none" style={{ position: "absolute", top: -190, left: (width - size) / 2, width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={fx.glowColor} stopOpacity={fx.glowOpacity} />
            <Stop offset="0.72" stopColor={fx.glowColor} stopOpacity={0} />
            <Stop offset="1" stopColor={fx.glowColor} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={size} height={size} fill="url(#glow)" />
      </Svg>
    </View>
  );
}

/** Staklena površina umjesto pune kutije: prozirna ispuna i tanak obrub. */
export function Glass({ children, style, radius = 24 }: { children?: ReactNode; style?: StyleProp<ViewStyle>; radius?: number }) {
  const { fx } = useTheme();
  return (
    <View style={[{ backgroundColor: fx.glass, borderColor: fx.glassBorder, borderWidth: 1, borderRadius: radius }, style]}>
      {children}
    </View>
  );
}

/* ---------- prsten dnevnog limita ---------- */

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const p = (a: number): [number, number] => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 1 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);
const ARC = arcPath(150, 150, 124, 135, 405); // 270° luk, otvoren dolje (kao logotip)
const ARC_LEN = 2 * Math.PI * 124 * 0.75; // duljina luka u jedinicama viewBoxa

export type RingState = "ok" | "warn" | "over";

/** Prsten: luk se „troši“ dok trošiš (remaining 1 → 0). Boja prati stanje. */
export function Ring({ size = 262, remaining, state, children }: { size?: number; remaining: number; state: RingState; children?: ReactNode }) {
  const { colors, fx } = useTheme();
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(Math.max(0, Math.min(1, remaining)), { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [remaining, progress]);
  const props = useAnimatedProps(() => ({ strokeDasharray: `${Math.max(0.01, progress.value * ARC_LEN)} ${ARC_LEN}` }));

  const from = state === "over" ? colors.danger : state === "warn" ? colors.warning : colors.brand;
  const to = state === "over" ? colors.danger : state === "warn" ? colors.warning : fx.accent2;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} viewBox="0 0 300 300" style={{ position: "absolute" }}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Path d={ARC} stroke={fx.track} strokeWidth={20} strokeLinecap="round" fill="none" />
        <AnimatedPath d={ARC} stroke="url(#ringGrad)" strokeWidth={20} strokeLinecap="round" fill="none" animatedProps={props} />
      </Svg>
      <View style={{ alignItems: "center", gap: 4, paddingTop: 6 }}>{children}</View>
    </View>
  );
}

/* ---------- iznos s odbrojavanjem ---------- */

/** Prikaz iznosa koji se glatko odbroji kad se vrijednost promijeni. */
export function Amount({
  cents,
  style,
  color,
  base = 56,
  maxWidth = 190,
}: {
  cents: Cents;
  style?: object;
  color?: string;
  base?: number;
  maxWidth?: number;
}) {
  const [shown, setShown] = useState(cents);
  const from = useRef(cents);
  useEffect(() => {
    const start = from.current;
    const delta = cents - start;
    if (delta === 0) return;
    const t0 = Date.now();
    let raf = 0;
    const tick = () => {
      const p = Math.min(1, (Date.now() - t0) / 600);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(start + delta * eased);
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = cents;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cents]);
  const text = formatEur(shown);
  // Veličina se računa prema najduljem obliku (konačni iznos), pa broj ne "skače" tijekom odbrojavanja.
  const size = fitFontSize(formatEur(cents), maxWidth, base);
  return (
    <T
      v="amount-hero"
      color={color}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.5}
      style={[{ fontSize: size, lineHeight: Math.round(size * 1.08), letterSpacing: -size * 0.045 }, style]}
    >
      {text}
    </T>
  );
}

/* ---------- ritam mjeseca: potrošnja po danima ---------- */

export function DayBars({
  values,
  daysInMonth,
  todayIndex,
  limitCents,
  height = 64,
}: {
  values: readonly Cents[];
  daysInMonth: number;
  todayIndex: number;
  limitCents: Cents;
  height?: number;
}) {
  const { colors, fx } = useTheme();
  const [w, setW] = useState(0);
  const max = Math.max(limitCents * 1.9, ...values, 1);
  const gap = 3;
  const bw = w > 0 ? (w - gap * (daysInMonth - 1)) / daysInMonth : 0;
  const y = (v: number) => height - Math.max(3, (v / max) * height);

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height }} accessibilityLabel="Potrošnja po danima u mjesecu">
      {w > 0 ? (
        <Svg width={w} height={height}>
          <Defs>
            <LinearGradient id="todayBar" x1="0" y1="1" x2="0" y2="0">
              <Stop offset="0" stopColor={colors.brand} />
              <Stop offset="1" stopColor={fx.accent2} />
            </LinearGradient>
          </Defs>
          {Array.from({ length: daysInMonth }, (_, i) => {
            const v = values[i] ?? 0;
            const x = i * (bw + gap);
            if (i > todayIndex) return <Rect key={i} x={x} y={height - 8 - ((i * 7) % 9)} width={bw} height={8 + ((i * 7) % 9)} rx={2} fill={fx.track} />;
            const isToday = i === todayIndex;
            if (v <= 0) {
              // Dan bez potrošnje: diskretna točkica na dnu (danas u boji brenda)
              return <Rect key={i} x={x} y={height - 4} width={bw} height={4} rx={2} fill={isToday ? colors.brand : fx.track} />;
            }
            const fill = isToday ? "url(#todayBar)" : v > limitCents ? colors.warning : colors.brand;
            return <Rect key={i} x={x} y={y(v)} width={bw} height={height - y(v)} rx={2.5} fill={fill} opacity={isToday ? 1 : 0.9} />;
          })}
          <Path d={`M0 ${y(limitCents)}H${w}`} stroke={colors["ink-muted"]} strokeWidth={1.5} strokeDasharray="5 5" opacity={0.55} />
        </Svg>
      ) : null}
    </View>
  );
}

/* ---------- donut pregleda ---------- */

export function Donut({
  size = 250,
  slices,
  children,
}: {
  size?: number;
  slices: readonly { value: number; color: string }[];
  children?: ReactNode;
}) {
  const { fx } = useTheme();
  const R = 100;
  const C = 2 * Math.PI * R;
  const total = slices.reduce((s, x) => s + x.value, 0);
  let off = 0;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} viewBox="0 0 250 250">
        <G rotation={-90} origin="125, 125">
          <Circle cx={125} cy={125} r={R} stroke={fx.track} strokeWidth={22} fill="none" />
          {total > 0 && slices.length === 1 ? (
            <Circle cx={125} cy={125} r={R} stroke={slices[0]!.color} strokeWidth={22} fill="none" />
          ) : null}
          {total > 0 && slices.length > 1
            ? slices.map((s, i) => {
                const len = (s.value / total) * C;
                const el = (
                  <Circle
                    key={i}
                    cx={125}
                    cy={125}
                    r={R}
                    stroke={s.color}
                    strokeWidth={22}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={`${Math.max(0.5, len - 13)} ${C}`}
                    strokeDashoffset={-off - 6}
                  />
                );
                off += len;
                return el;
              })
            : null}
        </G>
      </Svg>
      <View style={{ position: "absolute", alignItems: "center", gap: 4 }}>{children}</View>
    </View>
  );
}

/* ---------- povlačenje retka za brisanje ---------- */

export function SwipeRow({ children, onDelete }: { children: ReactNode; onDelete: () => void }) {
  const { colors } = useTheme();
  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={72}
      overshootRight={false}
      onSwipeableOpen={(direction) => {
        if (direction === "right" || direction === "left") onDelete();
      }}
      renderRightActions={() => (
        <View style={{ width: 88, alignItems: "center", justifyContent: "center", backgroundColor: colors.danger, borderRadius: 18, marginVertical: 6 }}>
          <Icon name="trash" size={22} color="#ffffff" />
        </View>
      )}
    >
      {children}
    </ReanimatedSwipeable>
  );
}

/* ---------- gumb-ikona (zatvori, mjesec +/−) ---------- */

export function RoundButton({ icon, onPress, label, disabled }: { icon: string; onPress: () => void; label: string; disabled?: boolean }) {
  const { colors, fx } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: fx.glass,
        borderWidth: 1,
        borderColor: fx.glassBorder,
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <Icon name={icon} size={20} color={colors.ink} />
    </Pressable>
  );
}
