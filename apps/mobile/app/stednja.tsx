import { View } from "react-native";
import { useRouter, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { formatEur, yearMonthOf, type Cents } from "@unitcent/core";
import { Button } from "../src/components";
import { useDb } from "../src/data";
import { Amount } from "../src/fx";
import { monthTitle } from "../src/format";
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

  // Povijest: prošli mjeseci s unosom ili planiranom štednjom (nepotvrđeni se mogu naknadno potvrditi).
  const past = new Map<string, { planned: Cents; actual: Cents | null }>();
  for (const p of planned) if (p.month < month) past.set(p.month, { planned: p.plannedCents, actual: null });
  for (const e of entries) if (e.month < month) past.set(e.month, { planned: e.plannedCents, actual: e.actualCents });
  const history = [...past.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 12);

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
      <View style={{ alignItems: "center", gap: 4, paddingTop: 4 }}>
        <T v="mono-label" muted>Ukupno ušteđeno</T>
        <Amount cents={stats.totalCents} base={54} maxWidth={300} />
        <T v="caption" muted>
          {stats.monthsUsing} {stats.monthsUsing === 1 ? "mjesec" : stats.monthsUsing < 5 ? "mjeseca" : "mjeseci"} u aplikaciji
          {stats.streak > 1 ? ` · niz ${stats.streak}` : ""}
        </T>
      </View>

      <Section title="Ovaj mjesec" right={monthTitle(month).replace(/\.$/, "")}>
        {plannedNow <= 0 ? (
          <View style={{ gap: 10 }}>
            <T muted>Nemaš planiranu štednju za ovaj mjesec. Postavi je u planu, pa se ovdje potvrđuje.</T>
            <Button variant="secondary" size="sm" label="Postavi plan" onPress={() => router.push("/plan" as Href)} />
          </View>
        ) : st === "open" ? (
          <View style={{ gap: 14 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
              <T v="caption" muted>Planirano</T>
              <T v="amount" style={{ fontSize: 22, lineHeight: 28, fontWeight: "800" }}>{formatEur(plannedNow)}</T>
            </View>
            <T>Jesi li ovaj mjesec ušteđio?</T>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <Button size="sm" label="Da, sve" onPress={() => quick(plannedNow)} />
              <Button variant="secondary" size="sm" label="Djelomično" onPress={() => edit(month)} />
              <Button variant="text" size="sm" label="Nisam" onPress={() => quick(0)} />
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
