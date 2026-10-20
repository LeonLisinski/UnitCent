import { Platform } from "react-native";
import type * as LA from "expo-local-authentication";
import { kvGet, kvSet } from "./db/repo";

// Nativni modul postoji tek u buildu nakon što je paket dodan; u starijem buildu (ili Expo Go) zaključavanje nije
// dostupno, a aplikacija i dalje radi.
let LocalAuthentication: typeof LA | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  LocalAuthentication = require("expo-local-authentication") as typeof LA;
} catch {
  LocalAuthentication = null;
}

/** Je li zaključavanje uopće dostupno u ovom buildu. */
export const LOCK_AVAILABLE = LocalAuthentication !== null;

/**
 * Zaključavanje aplikacije (Profil → Aplikacija): ono što je na mobitelu postavljeno (Face ID, Touch ID, otisak prsta,
 * lice), a kao rezerva šifra uređaja. Sustav sam bira način; aplikacija samo traži potvrdu.
 * Uključeno se pamti lokalno (postavka uređaja, ne računa). Aplikacija se zaključa pri pokretanju i kad se vrati
 * nakon više od LOCK_AFTER_MS u pozadini (vidi src/LockScreen.tsx).
 */
export const LOCK_AFTER_MS = 30_000;

export function isLockEnabled(): boolean {
  return LOCK_AVAILABLE && kvGet("lock.enabled") === "1";
}

/**
 * Kratki naziv načina otključavanja za podnaslov postavke, prema onome što je na mobitelu postavljeno:
 * iOS „Face ID“ ili „Touch ID“; Android „Otisak prsta“, „Otključavanje licem“ ili oboje. Bez biometrije: šifra uređaja.
 */
export async function unlockMethodLabel(): Promise<string> {
  if (!LocalAuthentication) return "Šifra uređaja";
  try {
    const level = await LocalAuthentication.getEnrolledLevelAsync();
    if (level !== LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG && level !== LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK) return "Šifra uređaja";
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const face = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
    const finger = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
    if (Platform.OS === "ios") return face ? "Face ID" : finger ? "Touch ID" : "Šifra uređaja";
    if (face && finger) return "Otisak prsta ili lice";
    if (finger) return "Otisak prsta";
    if (face) return "Otključavanje licem";
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) return "Šarenica";
  } catch {
    // bez podrške: ostaje šifra uređaja
  }
  return "Šifra uređaja";
}

export async function authenticate(): Promise<boolean> {
  if (!LocalAuthentication) return true;
  try {
    const r = await LocalAuthentication.authenticateAsync({
      promptMessage: "Otključaj UnitCent",
      cancelLabel: "Odustani",
      disableDeviceFallback: false, // bez biometrije (ili nakon više pokušaja) vrijedi šifra uređaja
    });
    return r.success;
  } catch {
    return false;
  }
}

/** Uključuje/isključuje zaključavanje. Uključivanje traži da je zaštita na uređaju postavljena i jednu potvrdu. */
export async function setLockEnabled(on: boolean): Promise<"ok" | "not-enrolled" | "cancelled"> {
  if (on) {
    if (!LocalAuthentication) return "not-enrolled";
    const level = await LocalAuthentication.getEnrolledLevelAsync().catch(() => LocalAuthentication.SecurityLevel.NONE);
    if (level === LocalAuthentication.SecurityLevel.NONE) return "not-enrolled";
    if (!(await authenticate())) return "cancelled";
  }
  kvSet("lock.enabled", on ? "1" : "0");
  return "ok";
}
