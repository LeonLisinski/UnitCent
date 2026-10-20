import { View } from "react-native";
import { useRouter, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { formatEur, previousMonth, yearMonthOf, type Cents } from "@unitcent/core";
import { Button } from "../src/components";
import { useDb } from "../src/data";
import { Amount, Ring } from "../src/fx";
import { monthShort, monthTitle } from "../src/format";
import { Icon } from "../src/icons";
import { ListRow, ModalScreen, RowAmount, Section } from "../src/layout";
import { Group, Row } from "../src/settings";
import { useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";
import { effectivePlan, getSavings, kvGet, kvSet, listPlannedSavings, listSavings, monthLeftover, savingsStats, setSavings, today } from "../src/db/repo";

/** Status mjeseca: ušteđeno (zeleno), djelomično (žuto), nije (neutralno), nepotvrđeno (prazno). */
function statusOf(planned: Cents, actual: Cents | null): "done" | "partial" | "missed" | "open" {
  if (actual === null) return "open";
  if (planned > 0 && actual >= planned) return "done";
  if (actual > 0) return "partial";
  return "missed";
}

const monthName = (m: string) => monthTitle(m).replace(/\.$/, "").split(" ")[0]!;

/**
 * Štednja na jednom mjestu: koliko štediš mjesečno (to je i dio plana), koliko imaš ukupno i potvrda mjeseca.
 * Prsten pokazuje samo tekući mjesec (prebačeno od planiranog). Nakon završenog mjeseca pita se jedno pitanje:
 * „Prebaci X € na štednju?“, a ako je od mjeseca ostalo novca, nudi se da se i to doda.
 */
export default function Stednja() {
  const { colors, fx } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const month = yearMonthOf(today());
  const prev = previousMonth(month);
  const stats = useDb(() => savingsStats());
  const plan = useDb(() => effectivePlan(month));
  const current = useDb(() => getSavings(month));
  const prevPlan = useDb(() => effectivePlan(prev));
  const prevEntry = useDb(() => getSavings(prev));
  const prevLeftover = useDb(() => monthLeftover(prev));
  const leftoverAsked = useDb(() => kvGet(`savings.leftover.${prev}`) === "1");
  const entries = useDb(() => listSavings());
  const planned = useDb(() => listPlannedSavings());

  const monthly = plan?.savingsCents ?? 0;
  const plannedNow = current?.plannedCents || monthly;
  const st = statusOf(plannedNow, current?.actualCents ?? null);
  const progress = plannedNow > 0 && current?.actualCents != null ? Math.min(1, current.actualCents / plannedNow) : 0;

  // Prošli mjesec: prvo potvrda prebačenog, zatim ponuda da se ostatak doda (jednom).
  const prevPlanned = prevEntry?.plannedCents || prevPlan?.savingsCents || 0;
  const prevOpen = prevPlan !== null && prevPlanned > 0 && (prevEntry?.actualCents ?? null) === null;
  const offerLeftover = !prevOpen && prevPlan !== null && prevLeftover > 0 && !leftoverAsked;

  // Povijest: prošli mjeseci s unosom ili planiranom štednjom (nepotvrđeni se mogu naknadno potvrditi).
  const past = new Map<string, { planned: Cents; actual: Cents | null }>();
  for (const p of planned) if (p.month < month) past.set(p.month, { planned: p.plannedCents, actual: null });
  for (const e of entries) if (e.month < month && (e.actualCents !== null || e.plannedCents > 0)) past.set(e.month, { planned: e.plannedCents, actual: e.actualCents });
  const history = [...past.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 12);

  const bars = Array.from({ length: 6 }, (_, i) => {
    const [y, m] = month.split("-").map(Number) as [number, number];
    const d = new Date(y, m - 1 - (5 - i), 1);
    const mo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const e = entries.find((x) => x.month === mo);
    const pl = planned.find((x) => x.month === mo);
    return { month: mo, planned: e?.plannedCents ?? pl?.plannedCents ?? 0, actual: e ? e.actualCents : null };
  });

  const confirm = (m: string, actual: Cents, plan: Cents) => {
    setSavings(m, actual, plan);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.show(actual >= plan && plan > 0 ? "Bravo, ušteđeno!" : "Spremljeno");
  };
  const addLeftover = () => {
    setSavings(prev, (prevEntry?.actualCents ?? 0) + prevLeftover, prevPlanned);
    kvSet(`savings.leftover.${prev}`, "1");
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.show(`Dodano ${formatEur(prevLeftover)}`);
  };
  const open = (params: Record<string, string>) => router.push({ pathname: "/stednja-unos", params } as unknown as Href);

  const icon = (s: ReturnType<typeof statusOf>) =>
    s === "done" ? (
      <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: colors["brand-soft"] }}>
        <Icon name="check" size={18} color={colors.brand} stroke={2.6} />
      </View>
    ) : s === "partial" ? (
      <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(245,165,36,0.16)" }}>
        <Icon name="repeat" size={16} color={colors.warning} />
      </View>
    ) : (
      <View style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderStyle: "dashed", borderColor: fx.glassBorder }} />
    );

  /** Jedno pitanje s dvije radnje (prebačeno / drugi iznos). */
  const question = (text: string, primary: string, onPrimary: () => void, secondary: string, onSecondary: () => void, note?: string) => (
    <View style={{ alignItems: "center", gap: 12 }}>
      <T v="headline" style={{ textAlign: "center" }}>{text}</T>
      {note ? <T v="caption" muted style={{ textAlign: "center" }}>{note}</T> : null}
      <View style={{ flexDirection: "row", gap: 10, justifyContent: "center" }}>
        <Button size="sm" label={primary} style={{ minWidth: 0, paddingHorizontal: 22 }} onPress={onPrimary} />
        <Button variant="secondary" size="sm" label={secondary} style={{ minWidth: 0, paddingHorizontal: 20 }} onPress={onSecondary} />
      </View>
    </View>
  );

  return (
    <ModalScreen title="Štednja" onClose={() => router.back()}>
      <View style={{ height: 232, alignItems: "center", justifyContent: "center" }}>
        <Ring size={232} remaining={progress} state="ok">
          <T v="mono-label" muted>{monthName(month)}</T>
          <Amount cents={current?.actualCents ?? 0} base={44} maxWidth={170} />
          <T v="caption" muted>{plannedNow > 0 ? `od ${formatEur(plannedNow)}` : "bez plana štednje"}</T>
        </Ring>
      </View>

      <Group>
        <Row
          icon="wallet"
          title="Ušteđeno ukupno"
          subtitle={stats.streak > 1 ? `Niz: ${stats.streak} ${stats.streak < 5 ? "mjeseca" : "mjeseci"} zaredom` : "Ispravi ako se razlikuje od banke"}
          value={formatEur(stats.totalCents)}
          onPress={() => open({ mode: "balance" })}
        />
        <Row
          icon="repeat"
          title="Mjesečno štedim"
          subtitle="Oduzima se od iznosa za trošenje"
          value={monthly > 0 ? formatEur(monthly) : "Ništa"}
          onPress={() => open({ mode: "monthly" })}
        />
      </Group>

      {prevOpen ? (
        <Section title={monthName(prev)}>
          {question(
            `Jesi li prebacio ${formatEur(prevPlanned)} na štednju?`,
            "Da",
            () => confirm(prev, prevPlanned, prevPlanned),
            "Drugi iznos",
            () => open({ month: prev }),
          )}
        </Section>
      ) : offerLeftover ? (
        <Section title={monthName(prev)}>
          {question(
            `Od ${monthName(prev).toLowerCase()} ti je ostalo ${formatEur(prevLeftover)}. Dodati u štednju?`,
            "Dodaj",
            addLeftover,
            "Ne",
            () => kvSet(`savings.leftover.${prev}`, "1"),
          )}
        </Section>
      ) : null}

      <Section title="Ovaj mjesec">
        {plannedNow <= 0 ? (
          <View style={{ alignItems: "center", gap: 12 }}>
            <T muted style={{ textAlign: "center" }}>Postavi koliko štediš svaki mjesec. Taj iznos se odvaja prije dnevnog izračuna.</T>
            <Button variant="secondary" size="sm" label="Postavi iznos" onPress={() => open({ mode: "monthly" })} />
          </View>
        ) : st === "open" ? (
          question(
            `Prebaci ${formatEur(plannedNow)} na štednju?`,
            "Prebacio sam",
            () => confirm(month, plannedNow, plannedNow),
            "Drugi iznos",
            () => open({ month }),
            "Potvrdi kad prebaciš novac na štedni račun. Na kraju mjeseca stiže podsjetnik.",
          )
        ) : (
          <ListRow
            first
            left={icon(st)}
            title={st === "done" ? "Prebačeno" : st === "partial" ? "Djelomično" : "Ovaj mjesec bez štednje"}
            subtitle={`Plan ${formatEur(plannedNow)}`}
            right={<RowAmount>{formatEur(current?.actualCents ?? 0)}</RowAmount>}
            onPress={() => open({ month })}
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
                  onPress={() => open({ month: m })}
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
