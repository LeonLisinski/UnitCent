import { useMemo, useState } from "react";
import { Pressable, Share, TextInput, View } from "react-native";
import { useStats } from "../src/data";
import { T, useColors } from "../src/theme";
import { Bars, Card, Kpi, KpiGrid, Row, Screen, SectionLabel, Stacked, dateTime, n } from "../src/ui";

/** Lista čekanja s weba: tko se prijavio, kada i odakle (utm_source). Prikazuje zadnjih 200 prijava. */
export default function Waitlist() {
  const c = useColors();
  const { stats: s } = useStats();
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const all = s?.waitlist.recent ?? [];
    const t = q.trim().toLowerCase();
    return t ? all.filter((r) => r.email.toLowerCase().includes(t) || (r.source ?? "").toLowerCase().includes(t)) : all;
  }, [s, q]);
  if (!s) return null;
  const w = s.waitlist;
  const palette = [c.brand, c.accent, c["cat-auto"], c["cat-zabava"], c["cat-zdravlje"], c["cat-stan"]];

  const share = () =>
    void Share.share({
      title: "Lista čekanja",
      message: ["email,izvor,prijava", ...w.recent.map((r) => `${r.email},${r.source ?? ""},${r.at}`)].join("\n"),
    });

  return (
    <Screen title="Lista čekanja">
      <KpiGrid>
        {[
          <Kpi key="t" label="Ukupno" value={n(w.total)} color={c.accent} />,
          <Kpi key="d" label="Danas" value={n(w.new_1d)} color={c.brand} />,
          <Kpi key="7" label="Zadnjih 7 dana" value={n(w.new_7d)} />,
          <Kpi key="30" label="Zadnjih 30 dana" value={n(w.new_30d)} />,
        ]}
      </KpiGrid>

      <SectionLabel>Prijave po danu</SectionLabel>
      <Card>
        <Bars data={w.by_day} color={c.brand} />
      </Card>

      {w.sources.length > 0 ? (
        <>
          <SectionLabel>Odakle dolaze</SectionLabel>
          <Card>
            <Stacked parts={w.sources.map((x, i) => ({ label: x.source, value: x.count, color: palette[i % palette.length]! }))} />
          </Card>
        </>
      ) : null}

      <SectionLabel right={`${n(list.length)} od ${n(w.total)}`}>Tko se prijavio</SectionLabel>
      <Card style={{ gap: 8 }}>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Traži adresu ili izvor"
            placeholderTextColor={c["ink-muted"]}
            autoCapitalize="none"
            autoCorrect={false}
            style={{ flex: 1, minHeight: 44, paddingHorizontal: 14, borderRadius: 12, backgroundColor: c.bg, color: c.ink, fontFamily: "Manrope_500Medium", fontSize: 15 }}
          />
          <Pressable accessibilityRole="button" onPress={share} hitSlop={8} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 4 }}>
            <T v="title" color={c["brand-ink"]}>Izvoz</T>
          </Pressable>
        </View>
        {list.length === 0 ? (
          <T v="body" muted style={{ paddingVertical: 12 }}>{w.total === 0 ? "Još nema prijava." : "Ništa ne odgovara pretrazi."}</T>
        ) : (
          list.map((r, i) => <Row key={`${r.email}-${r.at}`} first={i === 0} title={r.email} sub={`${dateTime(r.at)} · ${r.source || "izravno"}`} />)
        )}
      </Card>
    </Screen>
  );
}
