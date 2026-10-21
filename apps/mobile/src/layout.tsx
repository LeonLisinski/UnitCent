import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Modal, Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { Safe, useInsets, useKeyboardHeight } from "./safe";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Glass, Glow, RoundButton, recentlySwiped } from "./fx";
import { Icon } from "./icons";
import { PremiumMark } from "./components";
import { monthShort, monthTitle } from "./format";
import { onTabEnter, onTabReselect } from "./tabReselect";
import { useTheme } from "./theme";
import { T } from "./ui";

/**
 * Zajednički raspored svih ekrana (da sve djeluje kao jedna cjelina):
 * isti rubovi, isti razmak između sekcija, isto zaglavlje, ista sekcija, isti redak popisa.
 */
export const PAD = 20; // vodoravni rub ekrana
export const SECTION_GAP = 28; // razmak između sekcija
export const HERO = 262; // veličina glavnog grafa (prsten / krug)
const SECTION_HEAD = 20; // visina retka s oznakom sekcije

/** Najraniji mjesec koji se može otvoriti (5 godina unatrag): da se mogu unijeti i pregledati stari računi. */
export function minMonth(): string {
  const d = new Date();
  return `${d.getFullYear() - 5}-01`;
}

/** Okvir tab ekrana: pozadina, sjaj, sigurni rub, skrolanje s donjim razmakom za plutajuću traku. */
export function TabScreen({
  children,
  onSwipe,
  floating,
  sticky,
}: {
  children: ReactNode;
  /** Vodoravni swipe po ekranu: −1 = prethodno (prst udesno), 1 = sljedeće (prst ulijevo). Npr. promjena mjeseca. */
  onSwipe?: (dir: -1 | 1) => void;
  /** Lebdeći element iznad sadržaja (npr. gumb savjetnika), izvan skrolanja. */
  floating?: ReactNode;
  /** Traka pri vrhu koja se pojavi tek kad zaglavlje odskrola (npr. izbor mjeseca na Pregledu i Pretplatama). */
  sticky?: ReactNode;
}) {
  const { colors } = useTheme();
  const scroll = useRef<ScrollView>(null);
  const reduce = useReducedMotion();
  const safeTop = useSafeAreaInsets().top; // isti izvor kao SafeAreaView ispod
  const { width: winW, height: winH } = useWindowDimensions();
  const [stuck, setStuck] = useState(false);
  const stickyOpacity = useSharedValue(0);
  useEffect(() => {
    stickyOpacity.value = reduce ? (stuck ? 1 : 0) : withTiming(stuck ? 1 : 0, { duration: 160 });
  }, [stuck, reduce]);
  const stickyStyle = useAnimatedStyle(() => ({ opacity: stickyOpacity.value }));
  // Samo ekran koji je trenutno otvoren reagira na ponovni dodir svog taba.
  const focused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      return () => void (focused.current = false);
    }, []),
  );
  useEffect(() => onTabReselect(() => focused.current && scroll.current?.scrollTo({ y: 0, animated: true })), []);
  // Swipe: tek jasan vodoravni pokret (okomiti pokret ga poništava, pa skrolanje radi normalno);
  // povlačenje retka (brisanje) ima niži prag i preuzima pokret prije ovoga.
  const swipe = useRef(onSwipe);
  swipe.current = onSwipe;
  const pan = Gesture.Pan()
    .enabled(!!onSwipe)
    .runOnJS(true)
    .activeOffsetX([-30, 30])
    .failOffsetY([-14, 14])
    .onEnd((e) => {
      if (Math.abs(e.translationX) < 60 && Math.abs(e.velocityX) < 600) return;
      swipe.current?.(e.translationX < 0 ? 1 : -1);
    });
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Glow />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Omotač: apsolutna traka se mjeri od njega, tj. ispod sigurne zone (status traka, Dynamic Island). */}
        <View style={{ flex: 1 }}>
        <GestureDetector gesture={pan}>
          <ScrollView
            ref={scroll}
            contentContainerStyle={{ paddingHorizontal: PAD, paddingTop: 12, paddingBottom: 140, gap: SECTION_GAP }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={32}
            onScroll={
              sticky
                ? (e) => {
                    // Zaglavlje (12 + HEADER_H) je odskrolalo: traka preuzima njegovu ulogu.
                    const past = e.nativeEvent.contentOffset.y > 12 + HEADER_H;
                    if (past !== stuck) setStuck(past);
                  }
                : undefined
            }
          >
            {children}
          </ScrollView>
        </GestureDetector>
        {sticky ? (
          <Animated.View
            pointerEvents={stuck ? "auto" : "none"}
            aria-hidden={!stuck}
            style={[{ position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: PAD, paddingVertical: 6, overflow: "hidden" }, stickyStyle]}
          >
            {/* Ista pozadina kao ekran (prijelaz + sjaj), poravnata s njom: traka je dio stranice, ne tamna ploča. */}
            <View pointerEvents="none" style={{ position: "absolute", top: -safeTop, left: 0, width: winW, height: winH }}>
              <Glow />
            </View>
            {sticky}
          </Animated.View>
        ) : null}
        </View>
      </SafeAreaView>
      {floating}
    </View>
  );
}

/**
 * Okvir modalnog ekrana (forme): naslov i zatvaranje gore, sadržaj koji skrola, a glavna radnja ("Spremi")
 * fiksirana pri dnu, uvijek vidljiva i podignuta iznad tipkovnice.
 */
export function ModalScreen({
  title,
  eyebrow,
  onClose,
  footer,
  children,
  scroll = true,
  floatingClose = false,
}: {
  title?: string;
  eyebrow?: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
  /** false = sadržaj se ne skrola nego se raspoređuje po visini (npr. Premium). */
  scroll?: boolean;
  /** true = bez retka zaglavlja: gumb za zatvaranje lebdi u kutu, a sadržaj počinje pri vrhu (npr. Premium). */
  floatingClose?: boolean;
}) {
  const { colors } = useTheme();
  const kb = useKeyboardHeight();
  const insets = useInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Glow />
      <Safe sheet>
        <View style={{ flex: 1, paddingBottom: Math.max(0, kb - insets.bottom) }}>
          {floatingClose ? (
            <View style={{ position: "absolute", top: 14, right: PAD, zIndex: 10 }}>
              <RoundButton icon="x" label="Zatvori" onPress={onClose} />
            </View>
          ) : (
            <View style={{ paddingHorizontal: PAD, paddingTop: 14 }}>
              <PageHeader right={<RoundButton icon="x" label="Zatvori" onPress={onClose} />}>
                {eyebrow ? <T v="mono-label" muted style={{ fontSize: 11, opacity: 0.8 }}>{eyebrow}</T> : null}
                {title ? <T v="title-1" style={{ fontSize: 26, lineHeight: 32 }}>{title}</T> : null}
              </PageHeader>
            </View>
          )}
          {scroll ? (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: PAD, paddingTop: 12, paddingBottom: 24, gap: 24 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          ) : (
            // Raspoređuje po visini kad stane, a skrola kad ne stane (veći tekst, mali ekran): nikad preklapanje.
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1, paddingHorizontal: PAD, paddingTop: floatingClose ? 14 : 4, paddingBottom: 12, justifyContent: "space-evenly", gap: 16 }}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          )}
          {footer ? <View style={{ paddingHorizontal: PAD, paddingTop: 8, paddingBottom: 12, alignItems: "center", gap: 2 }}>{footer}</View> : null}
        </View>
      </Safe>
    </View>
  );
}

/** Visina zaglavlja tab ekrana: TOČNA (ne najmanja), da glavni graf i prva sekcija budu na istoj visini na svim tabovima. */
export const HEADER_H = 60;

/** Zaglavlje ekrana: kontekst lijevo (pozdrav, mjesec) i najviše jedna radnja desno. Uvijek točno iste visine. */
export function PageHeader({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={{ height: HEADER_H, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, overflow: "visible" }}>
      <View style={{ flex: 1, minWidth: 0 }}>{children}</View>
      {right}
    </View>
  );
}

/** Prostor glavnog grafa: ista visina i isti položaj na svakom ekranu (graf se ne „seli“ između tabova). */
export function Hero({ children }: { children: ReactNode }) {
  return <View style={{ height: HERO, alignItems: "center", justifyContent: "center" }}>{children}</View>;
}

/**
 * Sekcija: mala oznaka (uz opcionalan podatak ili radnju desno) i sadržaj. Redak oznake je uvijek iste visine,
 * pa radnja desno (npr. „+ Dodaj“) ne pomiče oznaku: naslovi sekcija su na istoj visini na svim tabovima.
 */
export function Section({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <View style={{ height: SECTION_HEAD, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <T v="mono-label" muted style={{ fontSize: 11, opacity: 0.8 }}>{title}</T>
        {typeof right === "string" ? <T v="caption" muted>{right}</T> : right}
      </View>
      {children}
    </View>
  );
}

/**
 * Redak popisa (trošak, kategorija, pretplata): ikona 40, naslov, podnaslov, desno iznos ili radnja.
 * Tanka crta iznad (osim prvog retka), bez pozadine.
 */
export function ListRow({
  left,
  title,
  subtitle,
  right,
  first,
  onPress,
  onLongPress,
  hint,
}: {
  left?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  right?: ReactNode;
  first?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  hint?: string;
}) {
  const { fx } = useTheme();
  const body = (
    <View
      style={{
        minHeight: 64,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 10,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: fx.line,
      }}
    >
      {left}
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <T v="headline" numberOfLines={1} style={{ fontWeight: "700" }}>{title}</T>
        {typeof subtitle === "string" ? <T v="caption" muted numberOfLines={1}>{subtitle}</T> : subtitle}
      </View>
      {right}
    </View>
  );
  if (!onPress && !onLongPress) return body;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={hint}
      delayLongPress={450}
      onPress={() => {
        if (!recentlySwiped()) onPress?.();
      }}
      onLongPress={() => {
        if (!recentlySwiped()) onLongPress?.();
      }}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      {body}
    </Pressable>
  );
}

/** Iznos u retku (desno). */
export function RowAmount({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <T v="amount" color={color} style={{ fontWeight: "800" }}>
      {children}
    </T>
  );
}

/** Dodir na tab u traci vraća ekran na tekući mjesec (npr. nakon listanja starih mjeseci na Pregledu). */
export function useResetMonthOnTab(route: string, current: string, setMonth: (m: string) => void): void {
  useEffect(() => onTabEnter((r) => r === route && setMonth(current)), [route, current, setMonth]);
}

/**
 * Korak na susjedni mjesec s istim pravilima kao strelice u MonthSwitcheru (granice, zaključani stariji mjeseci).
 * Za swipe po ekranu.
 */
export function stepMonth(
  dir: -1 | 1,
  o: { month: string; onChange: (m: string) => void; min: string; max: string; lockedBefore?: string; onLocked?: () => void },
): void {
  if (dir === -1) {
    if (o.month <= o.min) return;
    if (o.lockedBefore && o.month <= o.lockedBefore) return o.onLocked?.();
  } else if (o.month >= o.max) return;
  void Haptics.selectionAsync();
  o.onChange(shiftMonth(o.month, dir));
}

function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number) as [number, number];
  const idx = y * 12 + (m - 1) + delta;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
}

/**
 * Odabir mjeseca: strelice za susjedne mjesece i, dodirom na naslov (ikona kalendara), izbornik s godinom i mjesecima
 * da se do daljnjeg ili prošlog mjeseca stigne jednim dodirom. `min` i `max` su granice ("YYYY-MM").
 */
export function MonthSwitcher({
  month,
  onChange,
  min,
  max,
  lockedBefore,
  onLocked,
}: {
  month: string;
  onChange: (m: string) => void;
  min: string;
  max: string;
  /** Mjeseci prije ovoga su zaključani (Premium): označeni lokotom, a dodir poziva `onLocked`. */
  lockedBefore?: string;
  onLocked?: () => void;
}) {
  const { colors, fx } = useTheme();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(Number(month.slice(0, 4)));
  const minY = Number(min.slice(0, 4));
  const maxY = Number(max.slice(0, 4));
  const nowMonth = new Date();
  const current = `${nowMonth.getFullYear()}-${String(nowMonth.getMonth() + 1).padStart(2, "0")}`;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      {/* Stariji mjeseci (Premium): ista strelica, zlatna, sa zlatnom oznakom u kutu. */}
      <View>
        <RoundButton
          tone={lockedBefore && month <= lockedBefore ? "gold" : undefined}
          icon="back"
          label={lockedBefore && month <= lockedBefore ? "Stariji mjeseci su u Premiumu" : "Prethodni mjesec"}
          disabled={month <= min}
          onPress={() => (lockedBefore && month <= lockedBefore ? onLocked?.() : onChange(shiftMonth(month, -1)))}
        />
        {lockedBefore && month <= lockedBefore && month > min ? <PremiumMark size={18} corner /> : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${monthTitle(month)}. Odaberi mjesec i godinu`}
        onPress={() => {
          setYear(Number(month.slice(0, 4)));
          setOpen(true);
        }}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          minHeight: 44,
          paddingHorizontal: 16,
          borderRadius: 999,
          backgroundColor: pressed ? fx.track : "transparent",
        })}
      >
        <T v="title-2" style={{ fontSize: 19 }}>{monthTitle(month)}</T>
        <Icon name="calendar" size={18} color={colors.brand} />
      </Pressable>
      <RoundButton icon="chev" label="Sljedeći mjesec" disabled={month >= max} onPress={() => onChange(shiftMonth(month, 1))} />

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: PAD }} onPress={() => setOpen(false)}>
          <Pressable onPress={() => undefined}>
            <Glass radius={28} style={{ padding: 18, gap: 14, backgroundColor: colors.surface }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <RoundButton icon="back" label="Prethodna godina" disabled={year <= minY} onPress={() => setYear(year - 1)} />
                <T v="title-1" style={{ fontSize: 24, lineHeight: 30 }}>{year}.</T>
                <RoundButton icon="chev" label="Sljedeća godina" disabled={year >= maxY} onPress={() => setYear(year + 1)} />
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 8 }}>
                {Array.from({ length: 12 }, (_, i) => {
                  const ym = `${year}-${String(i + 1).padStart(2, "0")}`;
                  const disabled = ym < min || ym > max;
                  const locked = !!lockedBefore && ym < lockedBefore;
                  const selected = ym === month;
                  return (
                    <View key={ym} style={{ width: "25%", alignItems: "center" }}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected, disabled }}
                        accessibilityLabel={monthTitle(ym)}
                        disabled={disabled}
                        onPress={() => {
                          setOpen(false);
                          if (locked) onLocked?.();
                          else onChange(ym);
                        }}
                        style={{
                          width: 66,
                          height: 46,
                          borderRadius: 23,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: selected ? colors.brand : "transparent",
                          borderWidth: ym === current && !selected ? 1.5 : 0,
                          borderColor: colors.brand,
                          opacity: disabled ? 0.25 : locked ? 0.6 : 1,
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <T v="headline" color={selected ? colors["on-brand"] : colors.ink} style={{ fontSize: 15, textTransform: "capitalize" }}>
                            {monthShort(ym)}
                          </T>
                          {locked ? <PremiumMark size={14} /> : null}
                        </View>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
              <Pressable accessibilityRole="button" hitSlop={8} onPress={() => { setOpen(false); onChange(current < min ? min : current > max ? max : current); }} style={{ alignSelf: "center", minHeight: 40, justifyContent: "center" }}>
                <T v="headline" color={colors.brand} style={{ fontSize: 15 }}>Ovaj mjesec</T>
              </Pressable>
            </Glass>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/**
 * Radnja u retku sekcije (desno od oznake): tekst u brand boji, npr. „Svi troškovi“ ili „+ Dodaj“. Vizualno nizak
 * (ne pomiče oznaku), a dodirni cilj je ≥ 48 px zahvaljujući hitSlop.
 */
export function SectionLink({ label, onPress, accessibilityLabel }: { label: string; onPress: () => void; accessibilityLabel?: string }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} hitSlop={{ top: 14, bottom: 14, left: 12, right: 12 }} onPress={onPress}>
      {({ pressed }) => <T v="caption" color={colors.brand} style={{ fontWeight: "700", opacity: pressed ? 0.6 : 1 }}>{label}</T>}
    </Pressable>
  );
}

/** Prazan popis: jedna kratka rečenica i radnja koja ga popunjava (npr. „Dodaj trošak“). */
export function EmptyState({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <View style={{ alignItems: "center", gap: 14, paddingVertical: 8 }}>
      <T muted style={{ textAlign: "center" }}>{text}</T>
      {action}
    </View>
  );
}
