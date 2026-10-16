import { useRef, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatEur } from "@unitcent/core";
import { Button } from "../src/components";
import { Glow, RoundButton } from "../src/fx";
import { Icon } from "../src/icons";
import { useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";
import { ScanFailure, parseFiscalQr, prepareImage, scanReceipt, setLastScan, type FiscalQr } from "../src/scan";

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
  const [qr, setQr] = useState<FiscalQr | null>(null);
  const [busy, setBusy] = useState(false);

  const process = async (uri: string) => {
    setBusy(true);
    try {
      const b64 = await prepareImage(uri);
      const result = await scanReceipt(b64, qr?.totalCents);
      if (result.status === "unreadable") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        toast.show("Račun nije čitljiv. Probaj bliže i uz više svjetla.");
        return;
      }
      setLastScan(result, qr);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/pregledaj" as Href);
    } catch (e) {
      const kind = e instanceof ScanFailure ? e.kind : "failed";
      if (kind === "quota") {
        Alert.alert(
          "Besplatna skeniranja su iskorištena",
          "Ovaj mjesec više nema besplatnih skeniranja. Premium s više skeniranja stiže uskoro. Trošak i dalje možeš unijeti ručno.",
          [{ text: "U redu" }],
        );
      } else if (kind === "no-session") toast.show("Skeniranje traži internetsku vezu");
      else if (kind === "network") toast.show("Nema veze. Probaj ponovno ili unesi ručno.");
      else toast.show("Čitanje nije uspjelo, probaj ponovno");
    } finally {
      setBusy(false);
    }
  };

  const shoot = async () => {
    if (busy || !camera.current) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const pic = await camera.current.takePictureAsync({ quality: 0.9, skipProcessing: false });
    if (pic?.uri) await process(pic.uri);
  };

  const pick = async () => {
    if (busy) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.9 });
    if (!res.canceled && res.assets[0]) await process(res.assets[0].uri);
  };

  if (!permission) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Glow />
        <SafeAreaView style={{ flex: 1 }}>
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
        </SafeAreaView>
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

      <SafeAreaView style={{ flex: 1, justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 }}>
          <RoundButton icon="x" label="Zatvori" onPress={() => router.back()} />
          {qr?.totalCents ? (
            <View style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: "rgba(7,11,11,0.7)" }}>
              <T v="caption" color={colors.brand} style={{ fontWeight: "800" }}>QR pročitan · {formatEur(qr.totalCents)}</T>
            </View>
          ) : null}
        </View>

        <View style={{ alignItems: "center", gap: 18, paddingBottom: 28 }}>
          <View style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: "rgba(7,11,11,0.7)" }}>
            <T v="caption" color="#ffffff">Uperi cijeli račun, uz QR kod ako ga ima</T>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 36 }}>
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
      </SafeAreaView>

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
