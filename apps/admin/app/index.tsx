import { Linking, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { useStats } from "../src/data";
import { paidCount } from "../src/stats";
import { T, useColors } from "../src/theme";
import { Bars, Card, Kpi, KpiGrid, Row, Screen, SectionLabel, delta, n, pct } from "../src/ui";

/** Pregled: jedan glavni broj (aktivni ovaj tjedan) i šest kartica, svaka vodi na svoj tab. */
export default function Overview() {
  const c = useColors();
  const router = useRouter();
  const { stats: s } = useStats();
  if (!s) return null;
  const go = (href: string) => () => router.navigate(href as Href);
  const paid = paidCount(s);
  const sent7 = Object.values(s.email.last_7d).reduce((a, v) => a + (v ?? 0), 0);

  return (
    <Screen title="Pregled">
      <Card tone="brand">
        <View style={{ gap: 2 }}>
          <T v="label" color={c["brand-ink"]}>Aktivni ovaj tjedan</T>
          <T v="hero" color={c.accent}>{n(s.users.wau)}</T>
          <T v="caption" color={c.ink} style={{ opacity: 0.8 }}>
            {n(s.users.dau)} danas · {n(s.users.mau)} u 30 dana · {n(s.users.entries_7d)} unosa u 7 dana
          </T>
        </View>
        <Bars data={s.users.active_by_day} color={c.brand} height={64} />
      </Card>

      <SectionLabel>Ukratko</SectionLabel>
      <KpiGrid>
        {[
          <Kpi key="wl" label="Lista čekanja" value={n(s.waitlist.total)} sub={`+${n(s.waitlist.new_7d)} u 7 dana`} color={c.accent} onPress={go("/lista")} />,
          <Kpi key="reg" label="Registrirani" value={n(s.users.with_email)} sub={`${n(s.users.anonymous)} gostiju`} color={c.brand} onPress={go("/korisnici")} />,
          <Kpi key="paid" label="Plaćeni" value={n(paid)} sub={`${pct(paid, s.users.with_email)} registriranih`} color={c.warning} onPress={go("/prihod")} />,
          <Kpi key="new" label="Novi računi" value={n(s.users.new_7d)} sub={`${n(s.users.new_1d)} danas`} color={c["cat-auto"]} onPress={go("/korisnici")} />,
          <Kpi key="ai" label="AI skeniranja" value={n(s.ai.scans)} sub={delta(s.ai.scans, s.ai.scans_prev) ?? "ovaj mjesec"} color={c["cat-zdravlje"]} onPress={go("/prihod")} />,
          <Kpi key="mail" label="Mailovi, 7 dana" value={n(sent7)} sub={`${n(s.email.newsletter)} na newsletteru`} color={c["cat-stan"]} onPress={go("/sadrzaj")} />,
        ]}
      </KpiGrid>

      <SectionLabel>Alati</SectionLabel>
      <Card style={{ paddingVertical: 4, gap: 0 }}>
        <Row first title="Sentry" sub="greške i rušenja aplikacije" onPress={() => void Linking.openURL(s.links.sentry)} />
        <Row title="RevenueCat" sub="pretplate i prihod" onPress={() => void Linking.openURL(s.links.revenuecat)} />
        <Row title="Brevo" sub="mailovi i newsletter" onPress={() => void Linking.openURL(s.links.brevo)} />
      </Card>
    </Screen>
  );
}
