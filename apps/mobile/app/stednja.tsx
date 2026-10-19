import { View } from "react-native";
import { useRouter, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { formatEur, yearMonthOf, type Cents } from "@unitcent/core";
import { Button } from "../src/components";
import { useDb } from "../src/data";
import { Amount, Ring } from "../src/fx";
import { monthShort, monthTitle } from "../src/format";
import { Icon } from "../src/icons";
import { ListRow, ModalScreen, RowAmount, Section } from "../src/layout";
import { useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";
import { getPlan, getSavings, listPlannedSavings, listSavings, savingsStats, setSavings, today } from "../src/db/repo";

/** Status mjeseca: ušteđeno (zeleno), djelomično (žuto), nije (neutralno), nepotvrđeno (prazno). */
function statusOf(planned: Cents, actual: Cents | null): "done" | "partial" | "missed" | "open" {
  if (actual === null) return "open";
  if (planned > 0 && actual >= planned) return "done";
  if (actual > 0) return "partial";
  return "missed";
}

/**
 * Štednja: ukupno ušteđeno, tekući mjesec s brzom potvrdom i povijest po mjesecima. Plan štednje se postavlja u Planu,
 * a ovdje se samo potvrđuje koliko je stvarno ušteđeno. Mjesečni podsjetnik na kraju mjeseca ide uz podsjetnike naplata.
 */
export default function Stednja() {
  const { colors, fx } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const month = yearMonthOf(today());
  const stats = useDb(() => savingsStats());
  const plan = useDb(() => getPlan(month));
  const current = useDb(() => getSavings(month));
  const entries = useDb(() => listSavings());
  const planned = useDb(() => listPlannedSavings());

  const plannedNow = current?.plannedCents ?? plan?.savingsCents ?? 0;
  const st = statusOf(plannedNow, current?.actualCents ?? null);
  const progress = plannedNow > 0 && current?.actualCents != null ? Math.min(1, current.actualCents / plannedNow) : 0;

  // Povijest: prošli mjeseci s unosom ili planiranom štednjom (nepotvrđeni se mogu naknadno potvrditi).
  const past = new Map<string, { planned: Cents; actual: Cents | null }>();
  for (const p of planned) if (p.month < month) past.set(p.month, { planned: p.plannedCents, actual: null });
  for (const e of entries) if (e.month < month) past.set(e.month, { planned: e.plannedCents, actual: e.actualCents });
  const history = [...past.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 12);

  // Zadnjih 6 mjeseci (najstariji lijevo): ostvareno prema planu; nepotvrđeni mjeseci ostaju prazni.
  const bars = Array.from({ length: 6 }, (_, i) => {
    const [y, m] = month.split("-").map(Number) as [number, number];
    const d = new Date(y, m - 1 - (5 - i), 1);
    const mo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const e = entries.find((x) => x.month === mo);
    const pl = planned.find((x) => x.month === mo);
    return { month: mo, planned: e?.plannedCents ?? pl?.plannedCents ?? 0, actual: e ? e.actualCents : null };
  });

  const quick = (actual: Cents) => {
    setSavings(month, actual, plannedNow);
    void Haptics.notificationAsync(actual > 0 ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
    toast.show(actual >= plannedNow && plannedNow > 0 ? "Bravo, ušteđeno!" : "Spremljeno");
  };
  const edit = (m: string) => router.push({ pathname: "/stednja-unos", params: { month: m } } as unknown as Href);

  const icon = (s: ReturnType<typeof statusOf>) =>
    s === "done" ? (
      <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(61,214,163,0.16)" }}>
        <Icon name="check" size={18} color={colors.brand} stroke={2.6} />
      </View>
    ) : s === "partial" ? (
      <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(245,165,36,0.16)" }}>
        <Icon name="repeat" size={16} color={colors.warning} />
      </View>
    ) : (
      <View style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderStyle: "dashed", borderColor: fx.glassBorder }} />
    );

  return (
    <ModalScreen title="Štednja" onClose={() => router.back()}>
      <View style={{ height: 232, alignItems: "center", justifyContent: "center" }}>
        <Ring size={232} remaining={progress} state="ok">
          <T v="mono-label" muted>Ukupno ušteđeno</T>
          <Amount cents={stats.totalCents} base={44} maxWidth={170} />
          <T v="caption" muted>
            {stats.monthsUsing} {stats.monthsUsing === 1 ? "mjesec" : stats.monthsUsing < 5 ? "mjeseca" : "mjeseci"}
            {stats.streak > 1 ? ` · niz ${stats.streak}` : ""}
          </T>
        </Ring>
      </View>

      <Section title="Ovaj mjesec" right={monthTitle(month).replace(/\.$/, "")}>
        {plannedNow <= 0 ? (
          <View style={{ alignItems: "center", gap: 12 }}>
            <T muted style={{ textAlign: "center" }}>Nemaš planiranu štednju za ovaj mjesec. Postavi je u planu, pa se ovdje potvrđuje.</T>
            <Button variant="secondary" size="sm" label="Postavi plan" onPress={() => router.push("/plan" as Href)} />
          </View>
        ) : st === "open" ? (
          <View style={{ alignItems: "center", gap: 14 }}>
            <View style={{ alignItems: "center", gap: 2 }}>
              <T v="caption" muted>Planirano</T>
              <T v="amount" style={{ fontSize: 22, lineHeight: 28, fontWeight: "800" }}>{formatEur(plannedNow)}</T>
            </View>
            <T style={{ textAlign: "center" }}>Jesi li ovaj mjesec ušteđio?</T>
            <View style={{ flexDirection: "row", gap: 10, justifyContent: "center", alignItems: "center" }}>
              <Button size="sm" label="Da, sve" style={{ minWidth: 0, paddingHorizontal: 20 }} onPress={() => quick(plannedNow)} />
              <Button variant="secondary" size="sm" label="Djelomično" style={{ minWidth: 0, paddingHorizontal: 18 }} onPress={() => edit(month)} />
              <Button variant="secondary" size="sm" label="Nisam" style={{ minWidth: 0, paddingHorizontal: 18 }} onPress={() => quick(0)} />
            </View>
          </View>
        ) : (
          <ListRow
            first
            left={icon(st)}
            title={st === "done" ? "Ušteđeno" : st === "partial" ? "Djelomično ušteđeno" : "Ovaj mjesec bez štednje"}
            subtitle={`Plan ${formatEur(plannedNow)}`}
            right={<RowAmount>{formatEur(current?.actualCents ?? 0)}</RowAmount>}
            onPress={() => edit(month)}
            hint="Dodirni za promjenu"
          />
        )}
      </Section>

      {history.length > 0 ? (
        <Section title="Zadnjih 6 mjeseci">
          <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-end" }}>
            {bars.map((b) => {
              const top = Math.max(b.planned, b.actual ?? 0, 1);
              const h = b.actual === null ? 0 : Math.max(4, Math.round((b.actual / top) * 72));
              const col = b.actual === null ? fx.track : b.actual >= b.planned && b.planned > 0 ? colors.brand : colors.warning;
              return (
                <View key={b.month} style={{ flex: 1, alignItems: "center", gap: 8 }}>
                  <View style={{ width: "100%", height: 72, borderRadius: 8, backgroundColor: fx.track, justifyContent: "flex-end", overflow: "hidden" }}>
                    <View style={{ height: h, backgroundColor: col }} />
                  </View>
                  <T v="caption" muted style={{ fontSize: 11 }}>{monthShort(b.month)}</T>
                </View>
              );
            })}
          </View>
        </Section>
      ) : null}

      {history.length > 0 ? (
        <Section title="Povijest">
          <View>
            {history.map(([m, v], i) => {
              const s = statusOf(v.planned, v.actual);
              return (
                <ListRow
                  key={m}
                  first={i === 0}
                  left={icon(s)}
                  title={monthTitle(m).replace(/\.$/, "")}
                  subtitle={s === "open" ? `Plan ${formatEur(v.planned)} · nepotvrđeno` : `Plan ${formatEur(v.planned)}`}
                  right={s === "open" ? <T v="caption" color={colors.brand} style={{ fontWeight: "800" }}>Potvrdi</T> : <RowAmount>{formatEur(v.actual ?? 0)}</RowAmount>}
                  onPress={() => edit(m)}
                  hint="Dodirni za potvrdu ili promjenu"
                />
              );
            })}
          </View>
        </Section>
      ) : null}
    </ModalScreen>
  );
}
