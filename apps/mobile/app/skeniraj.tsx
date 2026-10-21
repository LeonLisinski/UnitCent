import { premiumHref } from "../src/premium";
import { useEffect, useRef, useState } from "react";
import Animated, { Easing, FadeIn, FadeOut, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import * as Crypto from "expo-crypto";
import { Alert, Image, Linking, Pressable, StyleSheet, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Safe } from "../src/safe";
import { formatEur } from "@unitcent/core";
import { AiButton, Button } from "../src/components";
import { LinearGradient } from "expo-linear-gradient";
import { Glow, RoundButton, ScanSweep } from "../src/fx";
import { useAiGradient } from "../src/ai";
import { Icon } from "../src/icons";
import { useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";
import { track } from "../src/analytics";
import { quotaTone, refreshScanUsage, setScanUsed, useScanQuota } from "../src/scanQuota";
import { MAX_PARTS, ScanFailure, parseFiscalQr, prepareImage, scanReceipt, setLastScan, type FiscalQr, type ScanResult } from "../src/scan";

/**
 * Skeniranje računa: kamera + QR kod fiskalnog računa (izvor istine za ukupni iznos) + odabir iz galerije.
 * Slika se smanji na uređaju, pošalje funkciji `scan-receipt` i nigdje se ne sprema.
 */
const SCAN_TIMEOUT_MS = 45_000;

/** Čitanje koje visi (loša mreža) završava porukom umjesto beskonačnog čekanja. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new ScanFailure("network")), ms);
    p.then(
      (v) => (clearTimeout(t), resolve(v)),
      (e) => (clearTimeout(t), reject(e)),
    );
  });
}

export default function Skeniraj() {
  const { colors, fx } = useTheme();
  const ai = useAiGradient();
  const router = useRouter();
  const toast = useToast();
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const quota = useScanQuota();
  useEffect(() => void refreshScanUsage(), []);
  const [qr, setQr] = useState<FiscalQr | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ count: number; totalCents: number | null } | null>(null); // kratka potvrda prije pregleda
  const [frozen, setFrozen] = useState<string | null>(null); // snimljena slika ostaje na ekranu dok se čita
  const [capturing, setCapturing] = useState(false); // dok kamera snima, okidač ne prima novi dodir
  const run = useRef(0); // izlaz tijekom čitanja: rezultat starog pokušaja se zanemaruje
  // Dugi računi: snimi se više dijelova (do 4), pa se čitaju zajedno i broje kao jedno skeniranje.
  const [parts, setParts] = useState<string[]>([]);
  const [review, setReview] = useState(false);

  // Čitanje počinje odmah nakon snimke (u pozadini), pa „Pročitaj“ obično samo pokaže gotov rezultat.
  // Sva čitanja jednog računa dijele scanId: poslužitelj kvotu broji jednom (i kad se doda dio).
  const scanId = useRef(Crypto.randomUUID());
  const prepared = useRef(new Map<string, Promise<string>>()); // uri → smanjena slika (base64), priprema se jednom
  const pending = useRef<{ key: string; promise: Promise<ScanResult> } | null>(null);

  const locked = !quota.premium && quota.remaining === 0;
  // Premium se otvara IZNAD kamere (push): ako ga korisnik zatvori, ostaje u kameri.
  const goPremium = () => router.push(premiumHref("scan"));

  const prepare = (uri: string) => {
    let p = prepared.current.get(uri);
    if (!p) {
      p = prepareImage(uri);
      prepared.current.set(uri, p);
    }
    return p;
  };

  /** Pokreće (ili ponovno koristi) čitanje točno ovih dijelova. */
  const read = (uris: string[]): Promise<ScanResult> => {
    const key = `${uris.join("|")}#${qr?.totalCents ?? ""}`;
    if (pending.current?.key === key) return pending.current.promise;
    const promise = (async () => {
      const images = await Promise.all(uris.map(prepare));
      return withTimeout(scanReceipt(images, qr?.totalCents, scanId.current), SCAN_TIMEOUT_MS);
    })();
    promise.catch(() => {}); // greška se prikazuje tek kad korisnik traži rezultat
    pending.current = { key, promise };
    return promise;
  };

  /** Novi račun: nova sesija i bez starih rezultata. */
  const resetScan = () => {
    scanId.current = Crypto.randomUUID();
    pending.current = null;
    prepared.current.clear();
  };

  const close = () => {
    run.current += 1;
    router.back();
  };

  const process = async (uris: string[]) => {
    const id = ++run.current;
    setFrozen(uris[uris.length - 1] ?? null);
    setBusy(true);
    let finished = false;
    try {
      const result = await read(uris);
      if (id !== run.current) return;
      setScanUsed(result.usage.used);
      track("scan_result", { status: result.status, items: result.items.length, ms: Math.round(((result as unknown as { ms?: number }).ms ?? 0)), qr: !!qr?.totalCents }); // poslužitelj ne naplaćuje nečitljive račune: broj je uvijek točan
      if (result.status === "unreadable") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        toast.show("Račun nije čitljiv. Probaj bliže i uz više svjetla.");
        resetScan();
        setParts([]);
        setReview(false);
        return;
      }
      setLastScan(result, qr);
      resetScan();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Kratka potvrda („4 stavke · 13,40 €“), pa pregled.
      finished = true;
      setDone({ count: result.items.filter((i) => i.line_type === "item").length, totalCents: result.total_cents });
      setTimeout(() => {
        if (id === run.current) router.replace("/pregledaj" as Href);
      }, 750);
    } catch (e) {
      if (id !== run.current) return;
      pending.current = null; // ponovni pokušaj šalje novi zahtjev (neuspjeh je poslužitelj vratio u kvotu)
      const kind = e instanceof ScanFailure ? e.kind : "failed";
      track("scan_failed", { kind });
      if (kind === "quota") {
        void refreshScanUsage();
        // Besplatno: Premium s istaknutim skeniranjem. Premium: nema se što kupiti, samo poruka o mjesečnoj granici.
        if (quota.premium) toast.show(`Iskorišteno je svih ${quota.limit} skeniranja ovaj mjesec`);
        else goPremium();
      } else if (kind === "rate") toast.show("Previše skeniranja zaredom. Probaj za nekoliko minuta.");
      else if (kind === "no-session") toast.show("Skeniranje traži internetsku vezu");
      else if (kind === "network") toast.show("Nema veze. Probaj ponovno ili unesi ručno.");
      else toast.show("Čitanje nije uspjelo, probaj ponovno");
    } finally {
      if (id === run.current && !finished) {
        setBusy(false);
        setFrozen(null);
      }
    }
  };

  const shoot = async () => {
    if (busy || capturing || !camera.current) return;
    if (locked) return goPremium();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCapturing(true);
    try {
      const pic = await camera.current.takePictureAsync({ quality: 0.9, skipProcessing: false });
      if (pic?.uri) {
        const next = [...parts, pic.uri].slice(0, MAX_PARTS);
        setParts(next);
        setReview(true); // pregled snimke: „Pročitaj“ ili „Dodaj dio“
        void read(next); // čitanje kreće odmah, dok korisnik gleda snimku
      }
    } catch {
      toast.show("Snimanje nije uspjelo, probaj ponovno");
    } finally {
      setCapturing(false);
    }
  };

  const pick = async () => {
    if (busy) return;
    if (locked) return goPremium();
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PARTS,
    });
    if (!res.canceled && res.assets.length > 0) await process(res.assets.map((a) => a.uri));
  };

  if (!permission) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Glow />
        <Safe style={{ flex: 1 }}>
          <View style={{ alignItems: "flex-end", padding: 20 }}>
            <RoundButton icon="x" label="Zatvori" onPress={close} />
          </View>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 14 }}>
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: fx.glass,
                borderWidth: 1,
                borderColor: fx.glassBorder,
                marginBottom: 10,
              }}
            >
              <Icon name="camera" size={40} color={fx.ai} stroke={1.6} />
            </View>
            <T v="title-1" style={{ fontSize: 28, lineHeight: 34, textAlign: "center" }}>Skeniraj račun</T>
            <T muted style={{ textAlign: "center", maxWidth: 320 }}>
              Slikaj račun, stavke se razvrstaju same.
            </T>
          </View>
          <View style={{ alignItems: "center", gap: 6, paddingBottom: 28, paddingHorizontal: 24 }}>
            {permission.canAskAgain ? (
              <Button label="Dopusti kameru" onPress={() => void requestPermission()} />
            ) : (
              <Button label="Otvori postavke" onPress={() => void Linking.openSettings()} />
            )}
            <Button variant="secondary" size="sm" icon="image" label="Odaberi iz galerije" onPress={() => void pick()} />
          </View>
        </Safe>
      </View>
    );
  }

  const photo = frozen ?? (review ? parts[parts.length - 1] : undefined);
  const hint = busy
    ? null
    : review
      ? parts.length > 1
        ? "Dijelovi se čitaju kao jedan račun"
        : "Dug račun? Dodaj sljedeći dio"
      : parts.length > 0
        ? `Snimi ${parts.length + 1}. dio računa`
        : "Uperi cijeli račun, uz QR kod ako ga ima";
  const quotaLabel = quota.premium
    ? `Premium · preostalo ${quota.remaining} od ${quota.limit}`
    : locked
      ? "Besplatna skeniranja su potrošena"
      : `Još ${quota.remaining} ${quota.remaining === 1 ? "besplatno skeniranje" : "besplatna skeniranja"}`;

  const tone = quotaTone(quota.remaining, quota.limit);

  const removePart = (i: number) => {
    const next = parts.filter((_, k) => k !== i);
    setParts(next);
    if (next.length === 0) setReview(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView
        ref={camera}
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={(e) => {
          const parsed = parseFiscalQr(e.data);
          if (parsed && parsed.totalCents !== qr?.totalCents) {
            if (__DEV__) console.log("[qr]", e.data, parsed);
            setQr(parsed);
            void Haptics.selectionAsync();
          }
        }}
      />
      {/* Snimka (pregled i čitanje) je ispod kontrola, pa je „Zatvori“ uvijek dostupan */}
      {photo ? <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
      {busy ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(7,11,11,0.45)" }]} /> : null}

      <Safe style={{ flex: 1 }}>
        {/* Gore: zatvori · QR · preostala skeniranja */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12, gap: 10 }}>
          <RoundButton icon="x" label="Zatvori" onPress={close} />
          {qr?.totalCents ? (
            <View style={CHIP}>
              <Icon name="check" size={14} color={colors.brand} stroke={2.6} />
              <T v="caption" color="#ffffff" style={{ fontWeight: "800" }}>QR · {formatEur(qr.totalCents)}</T>
            </View>
          ) : null}
          {/* Preostala skeniranja: Premium zlatno; besplatno bojom stanja (3/3 zeleno → 0/3 crveno), dodir otvara Premium */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={quotaLabel}
            disabled={quota.premium}
            onPress={goPremium}
            style={[CHIP, { borderWidth: 1, borderColor: quota.premium ? "rgba(214,169,74,0.55)" : `${tone}99` }]}
          >
            <Icon name={quota.premium ? "star" : locked ? "lock" : "camera"} size={14} color={quota.premium ? "#e2b955" : tone} stroke={2.2} />
            <T v="caption" color={quota.premium ? "#f1d791" : tone} style={{ fontWeight: "800" }}>
              {quota.remaining}/{quota.limit}
            </T>
          </Pressable>
        </View>

        {/* Sredina: okvir računa popunjava prostor između, pa se nikad ne preklapa s kontrolama */}
        <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 20, paddingBottom: 12, gap: 14 }}>
          <View style={{ flex: 1 }}>
            <ScanSweep mode={done ? "still" : busy ? "read" : review ? "still" : "live"} />
          </View>
          <View style={{ minHeight: 34, alignItems: "center", justifyContent: "center" }}>
            {hint ? (
              <View style={CHIP}>
                <T v="caption" color="#ffffff">{hint}</T>
              </View>
            ) : null}
          </View>
        </View>

        {/* Dolje: uvijek iste visine, mijenja se samo sadržaj (kamera / pregled / čitanje) */}
        <View style={{ height: 150, alignItems: "center", justifyContent: "center", paddingBottom: 16 }}>
          {busy ? (
            <ReadingStatus done={done} />
          ) : review ? (
            <View style={{ alignItems: "center", gap: 14 }}>
              <Parts uris={parts} onRemove={removePart} />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                {parts.length < MAX_PARTS ? (
                  <Button variant="secondary" size="sm" icon="plus" label="Dodaj dio" onPress={() => setReview(false)} />
                ) : null}
                <AiButton label={parts.length > 1 ? `Pročitaj (${parts.length})` : "Pročitaj"} onPress={() => void process(parts)} />
              </View>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 36 }}>
              <RoundButton icon="image" label="Odaberi iz galerije" onPress={() => void pick()} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={parts.length > 0 ? `Snimi ${parts.length + 1}. dio` : "Snimi račun"}
                disabled={capturing}
                onPress={() => void shoot()}
                style={({ pressed }) => ({
                  width: 76,
                  height: 76,
                  borderRadius: 38,
                  borderWidth: 4,
                  borderColor: fx.aiSoft,
                  alignItems: "center",
                  justifyContent: "center",
                  transform: [{ scale: pressed || capturing ? 0.92 : 1 }],
                })}
              >
                <LinearGradient colors={ai.colors} locations={ai.locations} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center" }}>
                  <Icon name="sparkle" size={24} color={fx.onAi} stroke={2} />
                </LinearGradient>
              </Pressable>
              {/* Desno: već snimljeni dijelovi (povratak na pregled) ili prazno mjesto iste širine */}
              {parts.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Snimljeno dijelova: ${parts.length}. Natrag na pregled`}
                  onPress={() => setReview(true)}
                  style={{ width: 44, height: 56, borderRadius: 8, overflow: "hidden", borderWidth: 1.5, borderColor: "#ffffff" }}
                >
                  <Image source={{ uri: parts[parts.length - 1] }} style={{ width: "100%", height: "100%" }} />
                  <View style={{ position: "absolute", right: 2, bottom: 2, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: fx.aiHi, alignItems: "center", justifyContent: "center" }}>
                    <T v="caption" color="#ffffff" style={{ fontSize: 11, lineHeight: 14, fontWeight: "800" }}>{parts.length}</T>
                  </View>
                </Pressable>
              ) : (
                <View style={{ width: 44 }} />
              )}
            </View>
          )}
        </View>
      </Safe>
    </View>
  );
}

/** Tamna pilula za oznake preko kamere (QR, preostala skeniranja, uputa). */
const CHIP = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  gap: 6,
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 999,
  backgroundColor: "rgba(7,11,11,0.7)",
};

/** Snimljeni dijelovi dugog računa; dodir uklanja dio. */
function Parts({ uris, onRemove }: { uris: string[]; onRemove: (i: number) => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {uris.map((u, i) => (
        <Pressable
          key={u + i}
          accessibilityRole="button"
          accessibilityLabel={`Ukloni ${i + 1}. dio`}
          onPress={() => onRemove(i)}
          hitSlop={4}
          style={{ width: 40, height: 54, borderRadius: 8, overflow: "hidden", borderWidth: 1.5, borderColor: colors.brand }}
        >
          <Image source={{ uri: u }} style={{ width: "100%", height: "100%" }} />
          <View style={{ position: "absolute", right: 2, top: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: "rgba(7,11,11,0.75)", alignItems: "center", justifyContent: "center" }}>
            <Icon name="x" size={10} color="#ffffff" stroke={2.6} />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

/** Koraci koje korisnik vidi dok AI čita (redom, svakih ~2,5 s; zadnji ostaje dok ne stigne rezultat). */
const STEPS = ["Čitam stavke", "Razvrstavam po kategorijama", "Provjeravam zbroj", "Još trenutak"];

/**
 * Stanje čitanja: traka napretka koja se polako puni do ~90 % (pravi kraj ne znamo unaprijed) i koraci koji se
 * izmjenjuju. Kad stigne rezultat, traka se napuni do kraja i pokaže se kratka potvrda (broj stavki i iznos).
 */
function ReadingStatus({ done }: { done: { count: number; totalCents: number | null } | null }) {
  const { colors, fx } = useTheme();
  const ai = useAiGradient();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 2500);
    progress.value = reduce ? 0.6 : withTiming(0.9, { duration: 9000, easing: Easing.out(Easing.cubic) });
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (done) progress.value = withTiming(1, { duration: reduce ? 0 : 280 });
  }, [done]);

  const bar = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const items = done ? `${done.count} ${done.count === 1 ? "stavka" : done.count % 10 >= 2 && done.count % 10 <= 4 && (done.count < 12 || done.count > 14) ? "stavke" : "stavki"}` : "";

  return (
    <View style={{ alignItems: "center", gap: 14, width: 240 }} accessibilityLiveRegion="polite">
      <Animated.View key={done ? "done" : step} entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {done ? <Icon name="check" size={20} color={colors.brand} stroke={2.8} /> : null}
        <T v="headline" color="#ffffff">
          {done ? `${items}${done.totalCents !== null ? ` · ${formatEur(done.totalCents)}` : ""}` : `${STEPS[step]}…`}
        </T>
      </Animated.View>
      <View style={{ width: "100%", height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.14)", overflow: "hidden" }}>
        <Animated.View style={[{ height: "100%", borderRadius: 3, overflow: "hidden" }, bar]}>
          <LinearGradient colors={ai.colors} locations={ai.locations} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </View>
      <T v="caption" color="#c9d2cf">{done ? "Otvaram pregled" : "Obično traje nekoliko sekundi"}</T>
    </View>
  );
}
