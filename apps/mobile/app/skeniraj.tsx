import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, Pressable, StyleSheet, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Safe } from "../src/safe";
import { formatEur } from "@unitcent/core";
import { Button } from "../src/components";
import { Glow, RoundButton } from "../src/fx";
import { Icon } from "../src/icons";
import { useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";
import { track } from "../src/analytics";
import { refreshScanUsage, scansWord, setScanUsed, useScanQuota } from "../src/scanQuota";
import { MAX_PARTS, ScanFailure, parseFiscalQr, prepareImage, scanReceipt, setLastScan, type FiscalQr } from "../src/scan";

/**
 * Skeniranje računa: kamera + QR kod fiskalnog računa (izvor istine za ukupni iznos) + odabir iz galerije.
 * Slika se smanji na uređaju, pošalje funkciji `scan-receipt` i nigdje se ne sprema.
 */
export default function Skeniraj() {
  const { colors, fx } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const quota = useScanQuota();
  useEffect(() => void refreshScanUsage(), []);
  const [qr, setQr] = useState<FiscalQr | null>(null);
  const [busy, setBusy] = useState(false);
  const [frozen, setFrozen] = useState<string | null>(null); // snimljena slika ostaje na ekranu dok se čita
  const [flash, setFlash] = useState(false);
  // Dugi računi: snimi se više dijelova (do 4), pa se čitaju zajedno i broje kao jedno skeniranje.
  const [parts, setParts] = useState<string[]>([]);
  const [review, setReview] = useState(false);

  const locked = !quota.premium && quota.remaining === 0;
  const goPremium = () => router.replace("/premium" as Href);

  const process = async (uris: string[]) => {
    setFrozen(uris[uris.length - 1] ?? null);
    setBusy(true);
    try {
      const images = await Promise.all(uris.map((u) => prepareImage(u)));
      const result = await scanReceipt(images, qr?.totalCents);
      setScanUsed(result.usage.used);
      track("scan_result", { status: result.status, items: result.items.length, ms: Math.round(((result as unknown as { ms?: number }).ms ?? 0)), qr: !!qr?.totalCents }); // poslužitelj ne naplaćuje nečitljive račune: broj je uvijek točan
      if (result.status === "unreadable") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        toast.show("Račun nije čitljiv. Probaj bliže i uz više svjetla.");
        setParts([]);
        setReview(false);
        return;
      }
      setLastScan(result, qr);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/pregledaj" as Href);
    } catch (e) {
      const kind = e instanceof ScanFailure ? e.kind : "failed";
      track("scan_failed", { kind });
      if (kind === "quota") {
        Alert.alert(
          "Besplatna skeniranja su iskorištena",
          "Ovaj mjesec više nema besplatnih skeniranja. Premium skenira račune bez ograničenja. Trošak i dalje možeš unijeti ručno.",
          [
            { text: "Ne sada", style: "cancel" },
            { text: "Pogledaj Premium", onPress: () => router.replace("/premium" as Href) },
          ],
        );
      } else if (kind === "no-session") toast.show("Skeniranje traži internetsku vezu");
      else if (kind === "network") toast.show("Nema veze. Probaj ponovno ili unesi ručno.");
      else toast.show("Čitanje nije uspjelo, probaj ponovno");
    } finally {
      setBusy(false);
      setFrozen(null);
    }
  };

  const shoot = async () => {
    if (busy || !camera.current) return;
    if (locked) return goPremium();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFlash(true);
    setTimeout(() => setFlash(false), 140);
    const pic = await camera.current.takePictureAsync({ quality: 0.9, skipProcessing: false });
    if (pic?.uri) {
      setParts((p) => [...p, pic.uri].slice(0, MAX_PARTS));
      setReview(true); // pregled snimke: „Pročitaj“ ili „Dodaj dio“
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
            <RoundButton icon="x" label="Zatvori" onPress={() => router.back()} />
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
              <Icon name="camera" size={40} color={colors.brand} stroke={1.6} />
            </View>
            <T v="title-1" style={{ fontSize: 28, lineHeight: 34, textAlign: "center" }}>Skeniraj račun</T>
            <T muted style={{ textAlign: "center", maxWidth: 320 }}>
              Kameru koristimo samo dok skeniraš. Slika se pročita i odmah odbaci, ne sprema se.
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

      <Safe style={{ flex: 1, justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 }}>
          <RoundButton icon="x" label="Zatvori" onPress={() => router.back()} />
          {qr?.totalCents ? (
            <View style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: "rgba(7,11,11,0.7)" }}>
              <T v="caption" color={colors.brand} style={{ fontWeight: "800" }}>QR pročitan · {formatEur(qr.totalCents)}</T>
            </View>
          ) : null}
        </View>

        <View style={{ alignItems: "center", gap: 18, paddingBottom: 28 }}>
          <Pressable
            accessibilityRole="button"
            disabled={quota.premium || !locked}
            onPress={goPremium}
            style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: "rgba(7,11,11,0.78)", borderWidth: 1, borderColor: "rgba(214,169,74,0.55)" }}
          >
            <Icon name={locked ? "lock" : "star"} size={14} color="#e2b955" stroke={2.2} />
            <T v="caption" color="#f1d791" style={{ fontWeight: "800" }}>
              {quota.premium
                ? `Premium · preostalo ${quota.remaining} od ${quota.limit}`
                : locked
                  ? "Besplatna skeniranja su potrošena · Premium"
                  : `Još ${quota.remaining} ${quota.remaining === 1 ? "besplatno skeniranje" : "besplatna skeniranja"}`}
            </T>
          </Pressable>
          <View style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: "rgba(7,11,11,0.7)" }}>
            <T v="caption" color="#ffffff">Uperi cijeli račun, uz QR kod ako ga ima</T>
          </View>
          {review ? (
            <View style={{ alignItems: "center", gap: 14 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {parts.map((u, i) => (
                  <Pressable
                    key={u + i}
                    accessibilityRole="button"
                    accessibilityLabel={`Ukloni dio ${i + 1}`}
                    onPress={() => {
                      const next = parts.filter((_, k) => k !== i);
                      setParts(next);
                      if (next.length === 0) setReview(false);
                    }}
                    style={{ width: 46, height: 62, borderRadius: 8, overflow: "hidden", borderWidth: 1.5, borderColor: colors.brand }}
                  >
                    <Image source={{ uri: u }} style={{ width: "100%", height: "100%" }} />
                    <View style={{ position: "absolute", right: 2, top: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: "rgba(7,11,11,0.75)", alignItems: "center", justifyContent: "center" }}>
                      <Icon name="x" size={10} color="#ffffff" stroke={2.6} />
                    </View>
                  </Pressable>
                ))}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                {parts.length < MAX_PARTS ? (
                  <Button variant="secondary" size="sm" icon="plus" label="Dodaj dio" onPress={() => setReview(false)} />
                ) : null}
                <Button label={parts.length > 1 ? `Pročitaj (${parts.length})` : "Pročitaj"} onPress={() => void process(parts)} />
              </View>
              <T v="caption" color="#9aa7a2">{parts.length > 1 ? "Dijelovi se čitaju kao jedan račun" : "Dug račun? Dodaj sljedeći dio"}</T>
            </View>
          ) : null}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 36, opacity: review ? 0 : 1 }} pointerEvents={review ? "none" : "auto"}>
            <RoundButton icon="image" label="Odaberi iz galerije" onPress={() => void pick()} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Snimi račun"
              onPress={() => void shoot()}
              style={({ pressed }) => ({
                width: 76,
                height: 76,
                borderRadius: 38,
                borderWidth: 4,
                borderColor: "#ffffff",
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: colors.brand }} />
            </Pressable>
            <View style={{ width: 44 }} />
          </View>
        </View>
      </Safe>

      {frozen || (review && parts.length > 0) ? <Image source={{ uri: frozen ?? parts[parts.length - 1]! }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
      {flash ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: "#ffffff", opacity: 0.55 }]} /> : null}

      {busy ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(7,11,11,0.82)", alignItems: "center", justifyContent: "center", gap: 14 }]}>
          <ActivityIndicator size="large" color={colors.brand} />
          <T v="headline" color="#ffffff">Čitam račun…</T>
          <T v="caption" color="#9aa7a2">Obično traje nekoliko sekundi</T>
        </View>
      ) : null}
    </View>
  );
}
