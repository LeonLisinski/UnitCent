import { Linking } from "react-native";
import { blogSchedule } from "../src/blog";
import { useStats } from "../src/data";
import { T, useColors } from "../src/theme";
import { Bars, Card, Kpi, KpiGrid, Row, Screen, SectionLabel, Stacked, dateShort, n, weekdayTime } from "../src/ui";

const KIND_LABEL = { welcome: "Dobrodošlica", tips: "Savjet 3. dan", weekly: "Tjedni sažetak", monthly: "Mjesečni pregled", winback: "Povratak" } as const;

const zagrebToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zagreb" }).format(new Date());
const daysUntil = (ymd: string, today: string) => Math.round((Date.parse(`${ymd}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000);

/** Sadržaj: e-mailovi (Brevo) i zakazani članci na blogu. */
export default function Content() {
  const c = useColors();
  const { stats: s } = useStats();
  if (!s) return null;
  const e = s.email;
  const sent7 = Object.values(e.last_7d).reduce((a, v) => a + (v ?? 0), 0);
  const today = zagrebToday();
  const blog = blogSchedule(today, 8);
  const kindColors = [c.brand, c.accent, c["cat-auto"], c["cat-zabava"], c["cat-zdravlje"]];

  return (
    <Screen title="Mailovi i blog">
      <KpiGrid>
        {[
          <Kpi key="n" label="Newsletter" value={n(e.newsletter)} sub={s.brevo ? `${n(s.brevo.subscribers)} u Brevu` : "pretplatnika"} color={c.accent} />,
          <Kpi key="a" label="Primaju sažetke" value={n(e.audience)} sub="bez odjave" color={c.brand} />,
          <Kpi key="s" label="Poslano, 7 dana" value={n(sent7)} sub={`${n(e.total_sent)} ukupno`} color={c["cat-auto"]} />,
          <Kpi key="o" label="Odjave, 30 dana" value={n(e.newsletter_off_30d + e.product_off_30d)} sub={`${n(e.newsletter_off_30d)} newsl. · ${n(e.product_off_30d)} sažeci`} color={c.danger} />,
        ]}
      </KpiGrid>

      <SectionLabel>Sljedeće slanje</SectionLabel>
      <Card style={{ paddingVertical: 4, gap: 0 }}>
        <Row first title="Tjedni sažetak" sub={weekdayTime(s.schedule.weekly)} value={`${n(e.audience)} prim.`} dot={c.brand} />
        <Row title="Mjesečni pregled" sub={weekdayTime(s.schedule.monthly)} value={`${n(e.audience)} prim.`} dot={c.accent} />
        {e.failed_7d > 0 ? <Row title="Neuspjela slanja, 7 dana" value={n(e.failed_7d)} dot={c.danger} /> : null}
      </Card>

      <SectionLabel>Poslano po vrsti, 7 dana</SectionLabel>
      <Card>
        {sent7 === 0 ? (
          <T v="body" muted>Još nije poslan nijedan mail. Slanje kreće kad su Brevo ključ i tajne postavljeni.</T>
        ) : (
          <Stacked parts={(Object.keys(KIND_LABEL) as (keyof typeof KIND_LABEL)[]).map((k, i) => ({ label: KIND_LABEL[k], value: e.last_7d[k] ?? 0, color: kindColors[i]! }))} />
        )}
      </Card>

      <SectionLabel>Poslano po danu</SectionLabel>
      <Card>
        <Bars data={e.sent_by_day} color={c["cat-auto"]} />
      </Card>

      <SectionLabel right={`${n(blog.scheduledCount)} zakazano`}>Blog</SectionLabel>
      <Card style={{ paddingVertical: 4, gap: 0 }}>
        {blog.last ? <Row first title={blog.last.title} sub={`Zadnji objavljen · ${dateShort(blog.last.published)}`} dot={c.brand} /> : null}
        {blog.next.map((p, i) => {
          const d = daysUntil(p.published, today);
          return (
            <Row
              key={p.slug}
              first={!blog.last && i === 0}
              title={p.title}
              sub={`${dateShort(p.published)} ${p.published.slice(0, 4)}. · ${d === 1 ? "sutra" : `za ${d} dana`}`}
              dot={i === 0 ? c.accent : c["surface-2"]}
            />
          );
        })}
        {blog.next.length === 0 ? <Row title="Nema zakazanih članaka" /> : null}
      </Card>

      <Card style={{ paddingVertical: 4, gap: 0 }}>
        <Row first title="Brevo" sub="kampanje, newsletter, statistika otvaranja" onPress={() => void Linking.openURL(s.links.brevo)} />
      </Card>
    </Screen>
  );
}
