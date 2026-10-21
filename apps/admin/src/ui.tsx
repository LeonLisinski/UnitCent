import type { ReactNode } from "react";
import { Pressable, RefreshControl, ScrollView, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { useStats } from "./data";
import type { DayCount } from "./stats";
import { T, useColors } from "./theme";

/* ---------- oblikovanje brojeva ---------- */
const nf = new Intl.NumberFormat("hr-HR");
export const n = (v: number | null | undefined) => (v === null || v === undefined ? "—" : nf.format(v));
export const eurCents = (c: number) => `${new Intl.NumberFormat("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(c / 100)} €`;
export const eur = (v: number | null | undefined) => (v === null || v === undefined ? "—" : eurCents(Math.round(v * 100)));
export const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)} %` : "—");
export const ratio = (a: number, b: number) => (b > 0 ? a / b : 0);
export const dateShort = (ymd: string) => `${Number(ymd.slice(8, 10))}. ${Number(ymd.slice(5, 7))}.`;
export const dateTime = (iso: string) =>
  new Intl.DateTimeFormat("hr-HR", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Zagreb" }).format(new Date(iso));
export const weekdayTime = (iso: string) =>
  new Intl.DateTimeFormat("hr-HR", { weekday: "long", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Zagreb" }).format(new Date(iso));

/* ---------- raspored ---------- */

/** Tab ekran: naslov taba (kontekst), vrijeme osvježavanja, povlačenje za osvježavanje. Isti rubovi (20) i razmak (24). */
export function Screen({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { refreshing, refresh, stats } = useStats();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32, paddingHorizontal: 20, gap: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.brand} />}
    >
      <View style={{ gap: 2 }}>
        <T v="title" style={{ fontSize: 26, lineHeight: 32, fontFamily: "Manrope_800ExtraBold" }}>{title}</T>
        <T v="caption" muted>{subtitle ?? (stats ? `Osvježeno ${dateTime(stats.generated_at)} · povuci za novo` : "")}</T>
      </View>
      {children}
    </ScrollView>
  );
}

export function Card({ children, style, onPress, tone }: { children: ReactNode; style?: ViewStyle; onPress?: () => void; tone?: "brand" }) {
  const c = useColors();
  const base: ViewStyle = {
    backgroundColor: tone === "brand" ? c["brand-soft"] : c.surface,
    borderRadius: 20,
    borderWidth: tone === "brand" ? 0 : 1,
    borderColor: c.border,
    padding: 18,
    gap: 14,
  };
  if (!onPress) return <View style={[base, style]}>{children}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [base, style, { opacity: pressed ? 0.8 : 1 }]}>
      {children}
    </Pressable>
  );
}

export function SectionLabel({ children, right }: { children: string; right?: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: -12 }}>
      <T v="label" muted>{children}</T>
      {right ? <T v="caption" muted>{right}</T> : null}
    </View>
  );
}

/** KPI pločica: točka boje + oznaka, broj, jedna crta (promjena ili objašnjenje). */
export function Kpi({ label, value, sub, color, onPress }: { label: string; value: string; sub?: string; color?: string; onPress?: () => void }) {
  const c = useColors();
  return (
    <Card onPress={onPress} style={{ flex: 1, minWidth: 0, gap: 6, padding: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {color ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} /> : null}
        <T v="caption" muted numberOfLines={1} style={{ flex: 1 }}>{label}</T>
        {onPress ? <T v="caption" muted>›</T> : null}
      </View>
      <T v="number" numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 26, lineHeight: 32 }}>{value}</T>
      {sub ? <T v="caption" color={c["ink-muted"]} numberOfLines={1}>{sub}</T> : null}
    </Card>
  );
}

/** Mreža KPI pločica po dvije u redu. */
export function KpiGrid({ children }: { children: ReactNode[] }) {
  const items = children.filter(Boolean);
  const rows: ReactNode[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return (
    <View style={{ gap: 12 }}>
      {rows.map((r, i) => (
        <View key={i} style={{ flexDirection: "row", gap: 12 }}>
          {r}
          {r.length === 1 ? <View style={{ flex: 1 }} /> : null}
        </View>
      ))}
    </View>
  );
}

/** Stupčasti graf po danima: stupci s fiksnim razmakom, današnji istaknut, najveća vrijednost označena. */
export function Bars({ data, color, height = 96, highlightLast = true }: { data: DayCount[]; color?: string; height?: number; highlightLast?: boolean }) {
  const c = useColors();
  const max = Math.max(...data.map((d) => d.count), 0);
  const total = data.reduce((s, d) => s + d.count, 0);
  const fill = color ?? c.brand;
  return (
    <View style={{ gap: 8 }} accessibilityLabel={`Ukupno ${total}, najviše ${max} u danu`}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <T v="caption" muted>najviše {n(max)} u danu</T>
        <T v="caption" muted>ukupno {n(total)}</T>
      </View>
      <View style={{ height, flexDirection: "row", alignItems: "flex-end", gap: data.length > 20 ? 2 : 4 }}>
        {data.map((d, i) => {
          const last = highlightLast && i === data.length - 1;
          return (
            <View
              key={d.day}
              style={{
                flex: 1,
                height: max > 0 ? Math.max(3, (d.count / max) * height) : 3,
                borderRadius: 3,
                backgroundColor: d.count === 0 ? c["surface-2"] : last ? c.accent : fill,
              }}
            />
          );
        })}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <T v="caption" muted>{data[0] ? dateShort(data[0].day) : ""}</T>
        <T v="caption" muted>danas</T>
      </View>
    </View>
  );
}

/** Prsten (isti jezik kao aplikacija): udio s oznakom u sredini. */
export function Ring({ value, size = 96, stroke = 10, color, label, center }: { value: number; size?: number; stroke?: number; color?: string; label?: string; center: string }) {
  const c = useColors();
  const r = (size - stroke) / 2;
  const len = 2 * Math.PI * r;
  const v = Math.min(1, Math.max(0, value));
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c["surface-2"]} strokeWidth={stroke} fill="none" />
        {v > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color ?? c.brand}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${len * v} ${len}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
      <T v="title" style={{ fontFamily: "Manrope_800ExtraBold" }}>{center}</T>
      {label ? <T v="caption" muted style={{ fontSize: 11 }}>{label}</T> : null}
    </View>
  );
}

/** Segmentirana traka s legendom (ravni krajevi, fiksni razmak). */
export function Stacked({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const c = useColors();
  const shown = parts.filter((p) => p.value > 0);
  const total = parts.reduce((s, p) => s + p.value, 0);
  return (
    <View style={{ gap: 12 }}>
      <View style={{ height: 12, borderRadius: 6, overflow: "hidden", flexDirection: "row", gap: 3, backgroundColor: total === 0 ? c["surface-2"] : "transparent" }}>
        {shown.map((p) => <View key={p.label} style={{ flex: p.value, backgroundColor: p.color }} />)}
      </View>
      <View style={{ gap: 8 }}>
        {parts.map((p) => (
          <View key={p.label} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: p.color }} />
            <T v="body" style={{ flex: 1 }} numberOfLines={1}>{p.label}</T>
            <T v="caption" muted>{pct(p.value, total)}</T>
            <T v="title" style={{ minWidth: 44, textAlign: "right", fontVariant: ["tabular-nums"] }}>{n(p.value)}</T>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Lijevak: svaki korak je traka razmjerna prvom koraku, s postotkom od prethodnog. */
export function Funnel({ steps }: { steps: { label: string; value: number; color: string }[] }) {
  const c = useColors();
  const top = Math.max(1, steps[0]?.value ?? 1);
  return (
    <View style={{ gap: 12 }}>
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1]!.value : 0;
        return (
          <View key={s.label} style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
              <T v="body" style={{ flex: 1 }}>{s.label}</T>
              {i > 0 ? <T v="caption" muted>{pct(s.value, prev)} od prethodnog</T> : null}
              <T v="title" style={{ minWidth: 40, textAlign: "right", fontVariant: ["tabular-nums"] }}>{n(s.value)}</T>
            </View>
            <View style={{ height: 10, borderRadius: 5, backgroundColor: c["surface-2"], overflow: "hidden" }}>
              <View style={{ width: `${Math.max(s.value > 0 ? 2 : 0, (s.value / top) * 100)}%`, height: "100%", borderRadius: 5, backgroundColor: s.color }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Ravni redak s tankom crtom. */
export function Row({ title, value, sub, dot, onPress, first }: { title: string; value?: string; sub?: string; dot?: string; onPress?: () => void; first?: boolean }) {
  const c = useColors();
  const body = (
    <View style={{ minHeight: 52, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: first ? 0 : 1, borderTopColor: c.line }}>
      {dot ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot }} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <T v="title" numberOfLines={1}>{title}</T>
        {sub ? <T v="caption" muted numberOfLines={1}>{sub}</T> : null}
      </View>
      {value ? <T v="title" style={{ fontVariant: ["tabular-nums"] }}>{value}</T> : null}
      {onPress ? <T v="title" muted>›</T> : null}
    </View>
  );
  return onPress ? (
    <Pressable accessibilityRole="link" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      {body}
    </Pressable>
  ) : (
    body
  );
}

/** Promjena u odnosu na prethodno razdoblje: „+12 %“ / „−5 %“ ili ništa. */
export function delta(cur: number, prev: number): string | undefined {
  if (prev <= 0) return cur > 0 ? "novo ovaj mjesec" : undefined;
  const d = Math.round(((cur - prev) / prev) * 100);
  return `${d >= 0 ? "+" : "−"}${Math.abs(d)} % od prošlog mjeseca`;
}
