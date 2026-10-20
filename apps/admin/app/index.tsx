import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { blogSchedule } from "../src/blog";
import { fetchStats, type Stats, type StatsResult } from "../src/stats";
import { signInWithGoogle, supabase, useSession } from "../src/supabase";
import { T, useColors } from "../src/theme";

/*
 * Jedan ekran, odozgo po važnosti: koliko ljudi koristi aplikaciju (glavni broj) → korisnici → Premium i prihod →
 * AI trošak → e-mailovi → blog → greške. Povuci prema dolje za osvježavanje. Podaci samo iz funkcije admin-stats.
 */

const nf = new Intl.NumberFormat("hr-HR");
const n = (v: number | null | undefined) => (v === null || v === undefined ? "—" : nf.format(v));
const eurCents = (c: number) => `${new Intl.NumberFormat("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(c / 100)} €`;
const eur = (v: number | null | undefined) => (v === null || v === undefined ? "—" : eurCents(Math.round(v * 100)));
const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)} %` : "—");
const zagrebToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zagreb" }).format(new Date());
const dayLabel = (iso: string) =>
  new Intl.DateTimeFormat("hr-HR", { weekday: "short", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Zagreb" }).format(new Date(iso));
const dateLabel = (ymd: string) => `${Number(ymd.slice(8, 10))}. ${Number(ymd.slice(5, 7))}.`;

function Section({ label, value, children }: { label: string; value?: string; children: ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        <T v="label" muted>{label}</T>
        {value ? <T v="caption" muted>{value}</T> : null}
      </View>
      <View>{children}</View>
    </View>
  );
}

/** Ravni redak s tankom crtom (isti uzorak kao popisi u aplikaciji). */
function Row({ title, value, sub, tone, onPress }: { title: string; value?: string; sub?: string; tone?: "warn" | "danger"; onPress?: () => void }) {
  const c = useColors();
  const dot = tone === "danger" ? c.danger : tone === "warn" ? c.warning : null;
  const body = (
    <View style={{ minHeight: 52, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderTopColor: c.line }}>
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

/** Tri ključna broja ispod glavnog (razina 2: mala oznaka iznad, broj ispod). */
function KeyNumbers({ items }: { items: { label: string; value: string }[] }) {
  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      {items.map((it) => (
        <View key={it.label} style={{ flex: 1, gap: 2 }}>
          <T v="caption" muted>{it.label}</T>
          <T v="number">{it.value}</T>
        </View>
      ))}
    </View>
  );
}

/** Novi korisnici po danu (14 dana): stupci s fiksnim razmakom, bez preklapanja. */
function Bars({ data }: { data: { day: string; count: number }[] }) {
  const c = useColors();
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <View accessibilityLabel={`Novi korisnici zadnjih 14 dana: ${data.map((d) => d.count).join(", ")}`} style={{ gap: 6 }}>
      <View style={{ height: 64, flexDirection: "row", alignItems: "flex-end", gap: 4 }}>
        {data.map((d, i) => (
          <View
            key={d.day}
            style={{
              flex: 1,
              height: Math.max(3, (d.count / max) * 64),
              borderRadius: 3,
              backgroundColor: i === data.length - 1 ? c.accent : d.count > 0 ? c.brand : c["surface-2"],
            }}
          />
        ))}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <T v="caption" muted>{data[0] ? dateLabel(data[0].day) : ""}</T>
        <T v="caption" muted>danas</T>
      </View>
    </View>
  );
}

function Center({ children }: { children: ReactNode }) {
  return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 }}>{children}</View>;
}

function PillButton({ label, onPress, secondary }: { label: string; onPress: () => void; secondary?: boolean }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        paddingHorizontal: 24,
        borderRadius: 999,
        justifyContent: "center",
        alignSelf: "center",
        backgroundColor: secondary ? "transparent" : c.brand,
        borderWidth: secondary ? 1 : 0,
        borderColor: c.border,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <T v="title" color={secondary ? c.ink : c["on-brand"]}>{label}</T>
    </Pressable>
  );
}

function Dashboard({ stats, refreshing, onRefresh }: { stats: Stats; refreshing: boolean; onRefresh: () => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const u = stats.users;
  const blog = blogSchedule(zagrebToday());
  const sent7 = Object.values(stats.email.last_7d).reduce((s, v) => s + (v ?? 0), 0);
  const scanTrend = stats.ai.scans_prev > 0 ? Math.round(((stats.ai.scans - stats.ai.scans_prev) / stats.ai.scans_prev) * 100) : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40, paddingHorizontal: 20, gap: 28 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.brand} />}
    >
      {/* kontekst + jedna radnja */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View>
          <T v="title">UnitCent admin</T>
          <T v="caption" muted>Osvježeno {dayLabel(stats.generated_at)}</T>
        </View>
        <Pressable accessibilityRole="button" onPress={() => void supabase?.auth.signOut()} hitSlop={12} style={{ minHeight: 48, justifyContent: "center" }}>
          <T v="caption" muted>Odjava</T>
        </Pressable>
      </View>

      {/* glavni broj */}
      <View style={{ gap: 16 }}>
        <View>
          <T v="label" color={c["brand-ink"]}>Aktivni ovaj tjedan</T>
          <T v="hero" color={c.accent}>{n(u.wau)}</T>
          <T v="caption" muted>upisali barem jedan trošak u zadnjih 7 dana</T>
        </View>
        <KeyNumbers items={[{ label: "Danas", value: n(u.dau) }, { label: "30 dana", value: n(u.mau) }, { label: "Ukupno", value: n(u.total) }]} />
      </View>

      <Section label="Novi korisnici" value={`${n(u.new_7d)} u 7 dana`}>
        <Bars data={u.new_by_day} />
        <View style={{ height: 8 }} />
        <Row title="Danas" value={n(u.new_1d)} />
        <Row title="Zadnjih 30 dana" value={n(u.new_30d)} />
        <Row title="S e-adresom" sub="prijavljeni Appleom ili Googleom" value={`${n(u.with_email)} · ${pct(u.with_email, u.total)}`} />
      </Section>

      <Section label="Zadržavanje" value="aktivni zadnjih 7 dana">
        <Row title="Nakon tjedan dana" sub={`od ${n(u.retention_d7.cohort)} novih prije 7 do 14 dana`} value={pct(u.retention_d7.active, u.retention_d7.cohort)} />
        <Row title="Nakon mjesec dana" sub={`od ${n(u.retention_d30.cohort)} novih prije 30 do 60 dana`} value={pct(u.retention_d30.active, u.retention_d30.cohort)} />
      </Section>

      <Section label="Premium" value={stats.revenue ? undefined : "RevenueCat nije spojen"}>
        <Row title="Aktivni" value={n(stats.premium.active)} sub={`${n(stats.premium.yearly)} godišnje · ${n(stats.premium.monthly)} mjesečno`} />
        {stats.revenue ? <Row title="MRR" value={eur(stats.revenue.mrr)} /> : null}
        {stats.revenue ? <Row title="Prihod, 28 dana" value={eur(stats.revenue.revenue_28d)} /> : null}
        {stats.revenue?.active_trials ? <Row title="Probno razdoblje" value={n(stats.revenue.active_trials)} /> : null}
        {stats.premium.expiring_7d > 0 ? <Row title="Istječe u 7 dana" value={n(stats.premium.expiring_7d)} tone="warn" /> : null}
        <Row title="RevenueCat" onPress={() => void Linking.openURL(stats.links.revenuecat)} />
      </Section>

      <Section label="AI" value={stats.ai.month}>
        <Row title="Skeniranja" sub={`${n(stats.ai.scan_users)} korisnika${scanTrend !== null ? ` · ${scanTrend >= 0 ? "+" : "−"}${Math.abs(scanTrend)} % od prošlog mjeseca` : ""}`} value={n(stats.ai.scans)} />
        <Row title="Pitanja savjetniku" value={n(stats.ai.advisor)} />
        <Row title="Procjena troška" sub="po cijeni iz AI_COST_* tajni" value={eurCents(stats.ai.cost_cents)} />
      </Section>

      <Section label="E-mailovi" value={`${n(sent7)} poslano u 7 dana`}>
        <Row title="Newsletter" sub={stats.brevo ? `${n(stats.brevo.subscribers)} na popisu u Brevu` : "pretplatnici u aplikaciji"} value={n(stats.email.newsletter)} />
        <Row title="Odjave, 30 dana" sub={`${n(stats.email.newsletter_off_30d)} newsletter · ${n(stats.email.product_off_30d)} sažeci`} value={n(stats.email.newsletter_off_30d + stats.email.product_off_30d)} />
        <Row title="Tjedni sažetak" sub={dayLabel(stats.schedule.weekly)} value={`${n(stats.email.audience)} prim.`} />
        <Row title="Mjesečni pregled" sub={dayLabel(stats.schedule.monthly)} value={`${n(stats.email.audience)} prim.`} />
        {stats.email.failed_7d > 0 ? <Row title="Neuspjela slanja, 7 dana" value={n(stats.email.failed_7d)} tone="danger" /> : null}
        <Row title="Brevo" onPress={() => void Linking.openURL(stats.links.brevo)} />
      </Section>

      <Section label="Blog" value={`${n(blog.scheduledCount)} zakazano`}>
        {blog.last ? <Row title={blog.last.title} sub={`objavljeno ${dateLabel(blog.last.published)}`} /> : null}
        {blog.next.map((p) => (
          <Row key={p.slug} title={p.title} sub={`${dateLabel(p.published)} ${p.published.slice(0, 4)}.`} />
        ))}
      </Section>

      <Section label="Greške">
        <Row title="Sentry" sub="greške i rušenja aplikacije" onPress={() => void Linking.openURL(stats.links.sentry)} />
      </Section>
    </ScrollView>
  );
}

export default function Home() {
  const c = useColors();
  const { session, ready } = useSession();
  const [result, setResult] = useState<StatsResult | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    setResult(await fetchStats());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (session) void load();
    else setResult(null);
  }, [session, load]);

  if (!supabase) {
    return (
      <Center>
        <T v="title">Nedostaje EXPO_PUBLIC_SUPABASE_URL</T>
        <T muted style={{ textAlign: "center" }}>Postavi .env.local u apps/admin (vidi .env.example).</T>
      </Center>
    );
  }
  if (!ready) return <Center><ActivityIndicator color={c.brand} /></Center>;

  if (!session) {
    return (
      <Center>
        <T v="label" color={c["brand-ink"]}>UnitCent admin</T>
        <T v="body" muted style={{ textAlign: "center" }}>Samo za vlasnika. Prijavi se istim Google računom kao u aplikaciji.</T>
        <PillButton
          label={signingIn ? "Prijavljujem…" : "Prijava s Googleom"}
          onPress={async () => {
            setSigningIn(true);
            await signInWithGoogle();
            setSigningIn(false);
          }}
        />
      </Center>
    );
  }

  if (!result) return <Center><ActivityIndicator color={c.brand} /></Center>;
  if (!result.ok) {
    return (
      <Center>
        <T v="title">{result.reason === "forbidden" ? "Ovaj račun nema pristup" : result.reason === "offline" ? "Nema veze" : "Podaci se nisu učitali"}</T>
        <T muted style={{ textAlign: "center" }}>
          {result.reason === "forbidden" ? `${session.user.email ?? "Račun"} nije u ADMIN_EMAILS na poslužitelju.` : "Pokušaj ponovno za trenutak."}
        </T>
        <PillButton label="Pokušaj ponovno" onPress={() => void load()} />
        <PillButton secondary label="Odjava" onPress={() => void supabase?.auth.signOut()} />
      </Center>
    );
  }
  return <Dashboard stats={result.stats} refreshing={refreshing} onRefresh={() => void load()} />;
}
