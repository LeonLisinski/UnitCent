import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Pressable, ScrollView, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { checkAfford, formatEur, parseAmount } from "@unitcent/core";
import { askAdvisor, FREE_AI_PER_MONTH, freeUsed, markFreeExhausted, markFreeUse, type AdvisorQuestion, type AdvisorRow } from "./advisor";
import { useAccount } from "./account";
import { useAiGradient } from "./ai";
import { getMonthSummary, kvGet, kvSetQuiet, today } from "./db/repo";
import { RoundButton } from "./fx";
import { PremiumMark } from "./components";
import { Icon } from "./icons";
import { premiumHref, usePremium } from "./premium";
import { Sheet } from "./Sheet";
import { textStyle, useTheme } from "./theme";
import { T } from "./ui";

type Key = AdvisorQuestion | "afford";

/** Pitanja kako bi ih čovjek stvarno postavio (kratko, razgovorno). */
const QUESTIONS: { key: Key; label: string }[] = [
  { key: "afford", label: "Mogu li si nešto priuštiti?" },
  { key: "month_end", label: "Kako stojim ovaj mjesec?" },
  { key: "where", label: "Na što mi ide najviše novca?" },
  { key: "save", label: "Gdje mogu uštedjeti?" },
  { key: "subs", label: "Koliko me koštaju pretplate?" },
];

/** Koliko ponuđenih pitanja ispod zadnje poruke (više od toga djeluje kao izbornik, ne kao razgovor). */
const SUGGESTIONS = 3;
/** „1 pitanje“, „2 pitanja“ (hrvatska množina; najviše 3). */
const leftText = (n: number) => (n === 1 ? "1 besplatno pitanje" : `${n} besplatna pitanja`);
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Msg =
  | { id: number; from: "me"; text: string }
  | { id: number; from: "ai"; text: string; rows?: AdvisorRow[]; tone?: "ok" | "warn" | "over" }
  | { id: number; from: "typing" };
type NewMsg = Msg extends infer M ? (M extends Msg ? Omit<M, "id"> : never) : never;

/**
 * Savjetnik kao mali razgovor: pitanja na dodir (bez slobodnog upisa u v1), tvoje pitanje je mjehurić desno,
 * odgovor lijevo, a ispod zadnje poruke su dva ili tri ponuđena pitanja. „Mogu li si nešto priuštiti?“ pita iznos
 * i računa ga aplikacija (core: odmah, bez interneta, besplatno); ostala pitanja idu poslužitelju (brojke iz
 * podataka, AI samo formulira; kvota na poslužitelju). Ulaz je lebdeći krug iznad tab trake (desno).
 */
export function AdvisorFab() {
  const { fx } = useTheme();
  const ai = useAiGradient();
  const insets = useSafeAreaInsets();
  const account = useAccount();
  const premium = usePremium();
  const [open, setOpen] = useState(false);
  const shown = account.hasSession ? QUESTIONS : QUESTIONS.filter((q) => q.key === "afford");
  // Iznad plutajuće trake: njezin donji rub (max(inset, 12) + 4) + visina 68 + razmak.
  const bottom = Math.max(insets.bottom, 12) + 4 + 68 + 14;
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Savjetnik. Pitaj nešto o svom novcu"
        onPress={() => {
          void Haptics.selectionAsync();
          setOpen(true);
        }}
        style={({ pressed }) => ({
          position: "absolute",
          right: 20,
          bottom,
          width: 56,
          height: 56,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        })}
      >
        <View
          style={{
            flex: 1,
            borderRadius: 28,
            overflow: "hidden",
            shadowColor: fx.ai,
            shadowOpacity: 0.45,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          }}
        >
          <LinearGradient colors={ai.colors} locations={ai.locations} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Icon name="sparkle" size={24} color={fx.onAi} stroke={2} />
          </LinearGradient>
        </View>
        {/* Free: ista zlatna oznaka kao na ostalim Premium funkcijama (free ima FREE_AI_PER_MONTH pitanja mjesečno). */}
        {premium ? null : <PremiumMark corner />}
      </Pressable>
      <Sheet visible={open} title="Savjetnik" titleRight={<BetaTag />} height={0.78} onClose={() => setOpen(false)}>
        {open ? <Chat questions={shown} onClose={() => setOpen(false)} /> : null}
      </Sheet>
    </>
  );
}

/** Savjetnik je nov i još se uči: oznaka uz naslov (iskreno očekivanje, manje razočaranja). */
function BetaTag() {
  const { fx } = useTheme();
  return (
    <View style={{ paddingHorizontal: 7, height: 20, borderRadius: 10, justifyContent: "center", borderWidth: 1, borderColor: fx.ai }}>
      <T v="mono-label" color={fx.ai} style={{ fontSize: 9.5, lineHeight: 13 }}>BETA</T>
    </View>
  );
}

type SavedChat = { msgs: Msg[]; asked: Key[]; last: Key | null; awaitingAmount: boolean };

/** Današnji razgovor (lokalno na uređaju; u njemu nema iznosa koje već ne vidiš u aplikaciji). */
function loadChat(): SavedChat | null {
  try {
    const raw = kvGet("advisor.chat");
    if (!raw) return null;
    const c = JSON.parse(raw) as SavedChat & { date?: string };
    return c.date === today() && Array.isArray(c.msgs) && c.msgs.length > 0 ? c : null;
  } catch {
    return null;
  }
}
function saveChat(c: SavedChat): void {
  kvSetQuiet("advisor.chat", JSON.stringify({ ...c, date: today(), msgs: c.msgs.slice(-60) }));
}

function Chat({ questions, onClose }: { questions: typeof QUESTIONS; onClose: () => void }) {
  const { colors, fx } = useTheme();
  const router = useRouter();
  const premium = usePremium();
  const scroll = useRef<ScrollView>(null);
  const saved = useRef(loadChat()).current;
  const nextId = useRef(saved ? Math.max(0, ...saved.msgs.map((m) => m.id)) + 1 : 1);
  const [msgs, setMsgs] = useState<Msg[]>(() => {
    if (saved) return saved.msgs;
    const name = kvGet("name")?.trim();
    const hello: Msg = { id: 0, from: "ai", text: name ? `Bok ${name}! Što te zanima?` : "Bok! Što te zanima?" };
    if (premium) return [hello];
    // Free: jasno odmah na početku, bez iznenađenja kasnije.
    const left = FREE_AI_PER_MONTH - freeUsed();
    const note =
      left <= 0
        ? `Savjetnik je dio Premiuma. Ovaj mjesec si iskoristio sva ${FREE_AI_PER_MONTH} besplatna pitanja.`
        : left === FREE_AI_PER_MONTH
          ? `Savjetnik je dio Premiuma, a besplatno imaš ${FREE_AI_PER_MONTH} pitanja mjesečno.`
          : `Savjetnik je dio Premiuma. Ovaj mjesec ti je ostalo još ${leftText(left)}.`;
    return [hello, { id: -1, from: "ai", text: note }];
  });
  const [asked, setAsked] = useState<Key[]>(saved?.asked ?? []);
  const [last, setLast] = useState<Key | null>(saved?.last ?? null);
  const [busy, setBusy] = useState(false);
  const [awaitingAmount, setAwaitingAmount] = useState(saved?.awaitingAmount ?? false);
  const [amount, setAmount] = useState("");

  // Razgovor se pamti cijeli dan (izađeš i vratiš se: sve je tu); novi dan počinje čisto.
  useEffect(() => {
    saveChat({ msgs: msgs.filter((m) => m.from !== "typing"), asked, last, awaitingAmount });
  }, [msgs, asked, last, awaitingAmount]);

  // Novi mjehurić; „piše…“ nestaje čim stigne bilo koja poruka.
  const push = (m: NewMsg) => {
    const id = nextId.current++;
    setMsgs((cur) => [...cur.filter((x) => x.from !== "typing"), { ...m, id } as Msg]);
  };

  /** Savjetnik „piše“ kratko i kad je odgovor već poznat: razgovor ima ritam, ne skače. */
  const typing = async (ms: number) => {
    setBusy(true);
    push({ from: "typing" });
    await pause(ms);
    setBusy(false);
  };

  /** Free bez preostalih pitanja: svako novo pitanje otvara Premium (razgovor se zatvara, pa se otvara ponuda). */
  const openPremium = () => {
    onClose();
    setTimeout(() => router.push(premiumHref("advisor")), 350);
  };

  /** Free: ispod odgovora tiha poruka koliko je pitanja ostalo. */
  const noteRemaining = () => {
    if (premium) return;
    const left = FREE_AI_PER_MONTH - freeUsed();
    push({
      from: "ai",
      text: left <= 0 ? "To je bilo tvoje zadnje besplatno pitanje ovaj mjesec. S Premiumom me možeš pitati svaki dan." : `Ostalo ti je još ${leftText(left)} ovaj mjesec.`,
    });
  };

  const ask = async (k: Key) => {
    if (busy) return;
    if (!premium && freeUsed() >= FREE_AI_PER_MONTH) return openPremium();
    const label = questions.find((q) => q.key === k)?.label ?? "";
    push({ from: "me", text: label });
    setAsked((a) => (a.includes(k) ? a : [...a, k]));
    setLast(k);
    if (k === "afford") {
      if (!premium) markFreeUse(); // jedno pitanje; iznos koji upišeš je samo odgovor
      await typing(500);
      push({ from: "ai", text: "Koliko bi te to koštalo?" });
      setAwaitingAmount(true);
      return;
    }
    setBusy(true);
    push({ from: "typing" });
    const r = await askAdvisor(k);
    setBusy(false);
    if (r.status === "locked" && premium) {
      push({ from: "ai", text: r.scope === "day" ? "Za danas smo dosta toga prošli. Pitaj me opet sutra." : "Ovaj mjesec smo prošli sva pitanja. Vidimo se početkom sljedećeg." });
      return;
    }
    if (r.status === "locked") {
      // Poslužitelj zna bolje (npr. pitanja s drugog uređaja): uskladi brojač i ponudi Premium.
      markFreeExhausted();
      push({ from: "ai", text: `Ovaj mjesec si iskoristio sva ${FREE_AI_PER_MONTH} besplatna pitanja. S Premiumom me možeš pitati svaki dan.` });
      setTimeout(openPremium, 1400);
      return;
    }
    // Svaka poruka na koju savjetnik odgovori troši jedno besplatno pitanje (i „nemam dovoljno podataka“);
    // ne broje se samo greške s naše strane (bez veze, poslužitelj).
    if (r.status === "no_data") {
      push({ from: "ai", text: r.text });
      if (!premium) markFreeUse();
      noteRemaining();
      return;
    }
    if (r.status === "offline") {
      push({ from: "ai", text: "Izgleda da nisi na vezi. Za ovo pitanje mi treba internet." });
      return;
    }
    if (r.status === "error") {
      push({ from: "ai", text: "Nešto je zapelo s moje strane. Pokušaj malo kasnije." });
      return;
    }
    push({ from: "ai", text: r.text, rows: r.rows });
    if (!premium) markFreeUse(r.remaining);
    noteRemaining();
  };

  const sendAmount = async () => {
    const cents = parseAmount(amount);
    if (!cents || cents <= 0 || busy) return;
    void Haptics.selectionAsync();
    setAwaitingAmount(false);
    setAmount("");
    push({ from: "me", text: formatEur(cents) });
    await typing(600);
    const limit = getMonthSummary(today()).limit;
    const a = checkAfford(limit, cents);
    // Sutrašnji budžet spominjemo samo kad kupnja probija današnji (tada stvarno pada); inače je samo šum.
    const text = a.fitsToday
      ? a.leftTodayCents === 0
        ? "Možeš, ali time ti je današnji budžet potrošen do kraja."
        : `Možeš. Nakon toga ti za danas ostaje još ${formatEur(a.leftTodayCents)}.`
      : a.fitsMonth
        ? `Danas bi bio ${formatEur(-a.leftTodayCents)} preko. Mjesec to može podnijeti` +
          (a.tomorrowDailyCents !== null ? `, ali od sutra imaš ${formatEur(a.tomorrowDailyCents)} dnevno umjesto ${formatEur(limit.dailyCents)}.` : ".")
        : `To ovaj mjesec ne stane. Bio bi ${formatEur(-a.monthLeftCents)} preko plana.`;
    push({ from: "ai", text, tone: a.fitsToday ? "ok" : a.fitsMonth ? "warn" : "over" });
    noteRemaining();
  };

  // Ponuđena pitanja: ona koja još nisu postavljena (i „priuštiti“, koje se može ponavljati), bez upravo postavljenog.
  const suggestions = questions.filter((q) => q.key !== last && (!asked.includes(q.key) || q.key === "afford")).slice(0, SUGGESTIONS);

  return (
    <View style={{ flex: 1, gap: 10 }}>
      <ScrollView
        ref={scroll}
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
      >
        {msgs.map((m) => (m.from === "typing" ? <Typing key={m.id} /> : <Bubble key={m.id} msg={m} />))}
        {/* Ponuđena pitanja odmah ispod zadnje poruke, desno (kao da ih ti šalješ). */}
        {!busy && !awaitingAmount && suggestions.length > 0 ? (
          <View style={{ alignItems: "flex-end", gap: 6, paddingTop: 6 }}>
            {suggestions.map((q) => (
              <Pressable
                key={q.key}
                accessibilityRole="button"
                onPress={() => void ask(q.key)}
                style={({ pressed }) => ({
                  minHeight: 40,
                  paddingHorizontal: 14,
                  borderRadius: 20,
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: colors.brand,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <T v="caption" color={colors.brand} style={{ fontSize: 14, fontWeight: "700" }}>{q.label}</T>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>

      {awaitingAmount ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flex: 1, minHeight: 52, borderRadius: 26, borderWidth: 1.5, borderColor: colors.brand, backgroundColor: fx.glass, flexDirection: "row", alignItems: "center", paddingHorizontal: 18, gap: 6 }}>
            <TextInput
              autoFocus
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="npr. 80"
              placeholderTextColor={colors["ink-muted"]}
              accessibilityLabel="Iznos"
              // bez returnKeyType: iOS bi iznad numeričke tipkovnice dodao svoj gumb i prazan pojas (šalje se našom strelicom)
              style={[textStyle("amount"), { flex: 1, color: colors.ink, fontSize: 20, paddingVertical: 10 }]}
            />
            <T v="headline" muted>€</T>
          </View>
          <RoundButton icon="arrow" label="Pošalji" size={52} tone="ai" disabled={!parseAmount(amount)} onPress={() => void sendAmount()} />
        </View>
      ) : null}
    </View>
  );
}

function Bubble({ msg }: { msg: Exclude<Msg, { from: "typing" }> }) {
  const { colors, fx } = useTheme();
  const me = msg.from === "me";
  const tone = msg.from === "ai" ? msg.tone : undefined;
  return (
    <View
      style={{
        alignSelf: me ? "flex-end" : "flex-start",
        maxWidth: "86%",
        borderRadius: 20,
        borderBottomRightRadius: me ? 6 : 20,
        borderBottomLeftRadius: me ? 20 : 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 10,
        backgroundColor: me ? colors["brand-soft"] : fx.glass,
        borderWidth: me ? 0 : 1,
        borderColor: fx.glassBorder,
      }}
    >
      <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
        {tone ? <View style={{ width: 8, height: 8, borderRadius: 4, marginTop: 7, backgroundColor: tone === "ok" ? colors.brand : tone === "warn" ? colors.warning : colors.danger }} /> : null}
        <T style={{ flexShrink: 1 }}>{msg.text}</T>
      </View>
      {msg.from === "ai" && msg.rows && msg.rows.length > 0 ? (
        <View style={{ gap: 8 }}>
          {msg.rows.map((r) => (
            <View key={r.label} style={{ gap: 4 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                <T v="caption" numberOfLines={1} style={{ flex: 1 }}>{r.label}</T>
                <T v="caption" style={{ fontWeight: "800" }}>{formatEur(r.cents)}</T>
              </View>
              <View style={{ height: 5, borderRadius: 3, backgroundColor: fx.track, overflow: "hidden" }}>
                <View style={{ width: `${Math.max(2, Math.round(r.share * 100))}%`, height: 5, borderRadius: 3, backgroundColor: colors.brand }} />
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Tri točkice dok savjetnik „piše“ (uz „smanji pokret“ mirne). */
function Typing() {
  const { fx } = useTheme();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) return;
      loop = Animated.loop(Animated.timing(v, { toValue: 3, duration: 1200, useNativeDriver: true }));
      loop.start();
    });
    return () => loop?.stop();
  }, [v]);
  return (
    <View
      accessibilityLabel="Savjetnik piše"
      style={{ alignSelf: "flex-start", flexDirection: "row", gap: 5, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 20, borderBottomLeftRadius: 6, backgroundColor: fx.glass, borderWidth: 1, borderColor: fx.glassBorder }}
    >
      {[0, 1, 2].map((i) => (
        <Animated.View
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: fx.ai,
            opacity: v.interpolate({ inputRange: [0, i, i + 0.5, i + 1, 3], outputRange: [0.35, 0.35, 1, 0.35, 0.35], extrapolate: "clamp" }),
          }}
        />
      ))}
    </View>
  );
}
