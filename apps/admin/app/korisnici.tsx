import { View } from "react-native";
import { useStats } from "../src/data";
import { paidCount } from "../src/stats";
import { T, useColors } from "../src/theme";
import { Bars, Card, Funnel, Kpi, KpiGrid, Ring, Screen, SectionLabel, Stacked, n, pct, ratio } from "../src/ui";

/** Korisnici aplikacije: od računa do plaćenih (lijevak), aktivnost po danu, novi računi i zadržavanje. */
export default function Users() {
  const c = useColors();
  const { stats: s } = useStats();
  if (!s) return null;
  const u = s.users;
  const paid = paidCount(s);

  return (
    <Screen title="Korisnici">
      <KpiGrid>
        {[
          <Kpi key="t" label="Svi računi" value={n(u.total)} sub={`+${n(u.new_7d)} u 7 dana`} color={c["cat-auto"]} />,
          <Kpi key="r" label="Registrirani" value={n(u.with_email)} sub="Apple ili Google" color={c.brand} />,
          <Kpi key="a" label="Aktivni, 30 dana" value={n(u.mau)} sub={`${n(u.wau)} ovaj tjedan`} color={c.accent} />,
          <Kpi key="p" label="Plaćeni" value={n(paid)} sub={pct(paid, u.with_email) + " registriranih"} color={c.warning} />,
        ]}
      </KpiGrid>

      <SectionLabel>Od računa do plaćenog</SectionLabel>
      <Card>
        <Funnel
          steps={[
            { label: "Svi računi", value: u.total, color: c["cat-auto"] },
            { label: "Registrirani", value: u.with_email, color: c.brand },
            { label: "Plaćeni", value: paid, color: c.warning },
          ]}
        />
      </Card>

      <SectionLabel>Vrsta računa</SectionLabel>
      <Card>
        <Stacked
          parts={[
            { label: "Registrirani (e-adresa)", value: u.with_email, color: c.brand },
            { label: "Gosti (bez prijave)", value: u.anonymous, color: c["cat-ostalo"] },
          ]}
        />
      </Card>

      <SectionLabel right={`${n(u.dau)} danas`}>Aktivni po danu</SectionLabel>
      <Card>
        <Bars data={u.active_by_day} color={c["cat-stan"]} />
      </Card>

      <SectionLabel right={`${n(u.new_30d)} u 30 dana`}>Novi računi po danu</SectionLabel>
      <Card>
        <Bars data={u.new_by_day} color={c["cat-auto"]} />
      </Card>

      <SectionLabel>Zadržavanje</SectionLabel>
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          <View style={{ alignItems: "center", gap: 8, flex: 1 }}>
            <Ring value={ratio(u.retention_d7.active, u.retention_d7.cohort)} center={pct(u.retention_d7.active, u.retention_d7.cohort)} color={c.brand} />
            <T v="title">Nakon 1 tjedna</T>
            <T v="caption" muted style={{ textAlign: "center" }}>{n(u.retention_d7.active)} od {n(u.retention_d7.cohort)} novih prije 7 do 14 dana</T>
          </View>
          <View style={{ alignItems: "center", gap: 8, flex: 1 }}>
            <Ring value={ratio(u.retention_d30.active, u.retention_d30.cohort)} center={pct(u.retention_d30.active, u.retention_d30.cohort)} color={c.accent} />
            <T v="title">Nakon 1 mjeseca</T>
            <T v="caption" muted style={{ textAlign: "center" }}>{n(u.retention_d30.active)} od {n(u.retention_d30.cohort)} novih prije 30 do 60 dana</T>
          </View>
        </View>
        <T v="caption" muted>Aktivan = upisao barem jedan trošak u zadnjih 7 dana.</T>
      </Card>
    </Screen>
  );
}
