import { Linking, View } from "react-native";
import { useStats } from "../src/data";
import { paidCount } from "../src/stats";
import { T, useColors } from "../src/theme";
import { Bars, Card, Kpi, KpiGrid, Ring, Row, Screen, SectionLabel, Stacked, delta, eur, eurCents, n, pct, ratio } from "../src/ui";

/** Prihod (Premium, RevenueCat) i AI (skeniranja, savjetnik, procjena troška) na jednom mjestu: što zarađujemo i što nas košta. */
export default function Revenue() {
  const c = useColors();
  const { stats: s } = useStats();
  if (!s) return null;
  const paid = paidCount(s);
  const p = s.premium;
  const rc = s.revenue;
  const costPerPaid = paid > 0 ? Math.round(s.ai.cost_cents / paid) : null;

  return (
    <Screen title="Prihod i AI">
      <Card tone="brand">
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <Ring value={ratio(paid, s.users.with_email)} center={pct(paid, s.users.with_email)} label="konverzija" color={c.accent} size={104} />
          <View style={{ flex: 1, gap: 2 }}>
            <T v="label" color={c["brand-ink"]}>Plaćeni korisnici</T>
            <T v="hero" color={c.accent} style={{ fontSize: 48, lineHeight: 54 }}>{n(paid)}</T>
            <T v="caption" color={c.ink} style={{ opacity: 0.8 }}>od {n(s.users.with_email)} registriranih{p.dev > 0 ? ` · ${n(p.dev)} test` : ""}</T>
          </View>
        </View>
      </Card>

      <SectionLabel>Prihod</SectionLabel>
      {rc ? (
        <KpiGrid>
          {[
            <Kpi key="m" label="MRR" value={eur(rc.mrr)} sub="po mjesecu" color={c.warning} />,
            <Kpi key="r" label="Prihod, 28 dana" value={eur(rc.revenue_28d)} color={c.brand} />,
            <Kpi key="s" label="Aktivne pretplate" value={n(rc.active_subscriptions)} />,
            <Kpi key="t" label="Probno razdoblje" value={n(rc.active_trials)} />,
          ]}
        </KpiGrid>
      ) : (
        <Card>
          <T v="title">RevenueCat još nije spojen</T>
          <T v="caption" muted>Dodaj REVENUECAT_SECRET_KEY i REVENUECAT_PROJECT_ID u Supabase Secrets pa će ovdje biti MRR, prihod i probna razdoblja.</T>
        </Card>
      )}

      <SectionLabel right={`${n(p.new_30d)} novih u 30 dana`}>Vrsta pretplate</SectionLabel>
      <Card>
        <Stacked
          parts={[
            { label: "Godišnja", value: p.yearly, color: c.brand },
            { label: "Mjesečna", value: p.monthly, color: c["cat-auto"] },
            ...(p.lifetime > 0 ? [{ label: "Doživotna", value: p.lifetime, color: c.accent }] : []),
          ]}
        />
        {p.expiring_7d > 0 ? <Row title="Istječe u 7 dana" value={n(p.expiring_7d)} dot={c.warning} /> : null}
      </Card>

      <SectionLabel right={s.ai.month}>AI</SectionLabel>
      <KpiGrid>
        {[
          <Kpi key="s" label="Skeniranja" value={n(s.ai.scans)} sub={delta(s.ai.scans, s.ai.scans_prev) ?? `${n(s.ai.scan_users)} korisnika`} color={c["cat-zdravlje"]} />,
          <Kpi key="a" label="Pitanja savjetniku" value={n(s.ai.advisor)} sub={`${n(s.ai.advisor_users)} korisnika`} color={c["cat-stan"]} />,
          <Kpi key="c" label="Trošak AI-ja" value={eurCents(s.ai.cost_cents)} sub="procjena za mjesec" color={c.danger} />,
          <Kpi key="p" label="Trošak po plaćenom" value={costPerPaid === null ? "—" : eurCents(costPerPaid)} sub="AI ÷ plaćeni" />,
        ]}
      </KpiGrid>

      <SectionLabel>Skeniranja po danu</SectionLabel>
      <Card>
        <Bars data={s.ai.scans_by_day} color={c["cat-zdravlje"]} />
      </Card>

      <SectionLabel>Pitanja savjetniku po danu</SectionLabel>
      <Card>
        <Bars data={s.ai.advisor_by_day} color={c["cat-stan"]} />
      </Card>

      <Card style={{ paddingVertical: 4, gap: 0 }}>
        <Row first title="RevenueCat" sub="detalji pretplata i povrata" onPress={() => void Linking.openURL(s.links.revenuecat)} />
      </Card>
    </Screen>
  );
}
