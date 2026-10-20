import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type * as SS from "expo-secure-store";

// Kao i kod zaključavanja: u buildu bez nativnog modula ostaje obična pohrana (aplikacija radi kao prije).
let SecureStoreMod: typeof SS | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  SecureStoreMod = require("expo-secure-store") as typeof SS;
} catch {
  SecureStoreMod = null;
}
const SecureStore = SecureStoreMod as typeof SS;

/**
 * Pohrana sesije prijave u šifriranoj sistemskoj pohrani (iOS Keychain, Android Keystore) umjesto obične.
 * SecureStore drži najviše ~2 KB po ključu, a sesija je veća, pa se vrijednost dijeli na dijelove. Stara sesija iz AsyncStorage se pri prvom čitanju jednom prenese i obriše, pa se
 * nitko ne mora ponovno prijaviti. Na webu (samo razvoj) ostaje AsyncStorage.
 */
const CHUNK = 1800;
const OPTS: SS.SecureStoreOptions = SecureStoreMod ? { keychainAccessible: SecureStoreMod.AFTER_FIRST_UNLOCK } : {};

// Ključevi SecureStore smiju sadržavati samo slova, brojke i . - _
const safe = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, "_");

// Zaglavlje `ključ.n` = "generacija:broj dijelova". Novi zapis ide u novu generaciju, zaglavlje se mijenja tek kad su
// svi dijelovi upisani, a stara generacija se briše na kraju: prekid usred upisa ostavlja staru, cijelu sesiju.
async function readHead(k: string): Promise<{ gen: number; parts: number } | null> {
  const head = await SecureStore.getItemAsync(`${k}.n`, OPTS);
  if (!head) return null;
  const [g, p] = head.split(":").map(Number) as [number, number];
  return Number.isFinite(g) && Number.isFinite(p) && p > 0 ? { gen: g, parts: p } : null;
}

async function readSecure(key: string): Promise<string | null> {
  const k = safe(key);
  const head = await readHead(k);
  if (!head) return null;
  const parts: string[] = [];
  for (let i = 0; i < head.parts; i++) {
    const part = await SecureStore.getItemAsync(`${k}.${head.gen}.${i}`, OPTS);
    if (part === null) return null; // nepotpun zapis: tretira se kao da sesije nema
    parts.push(part);
  }
  return parts.join("");
}

async function deleteGen(k: string, head: { gen: number; parts: number }): Promise<void> {
  for (let i = 0; i < head.parts; i++) await SecureStore.deleteItemAsync(`${k}.${head.gen}.${i}`, OPTS);
}

async function removeSecure(key: string): Promise<void> {
  const k = safe(key);
  const head = await readHead(k);
  await SecureStore.deleteItemAsync(`${k}.n`, OPTS);
  if (head) await deleteGen(k, head);
}

async function writeSecure(key: string, value: string): Promise<void> {
  const k = safe(key);
  const old = await readHead(k);
  const gen = (old?.gen ?? 0) + 1;
  const parts = Math.max(1, Math.ceil(value.length / CHUNK));
  for (let i = 0; i < parts; i++) await SecureStore.setItemAsync(`${k}.${gen}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK), OPTS);
  await SecureStore.setItemAsync(`${k}.n`, `${gen}:${parts}`, OPTS);
  if (old) await deleteGen(k, old);
}

export const secureStorage =
  Platform.OS === "web" || !SecureStoreMod
    ? AsyncStorage
    : {
        async getItem(key: string): Promise<string | null> {
          const v = await readSecure(key);
          if (v !== null) return v;
          // Jednokratni prijenos stare sesije iz obične pohrane
          const legacy = await AsyncStorage.getItem(key);
          if (legacy !== null) {
            await writeSecure(key, legacy);
            await AsyncStorage.removeItem(key);
          }
          return legacy;
        },
        setItem: (key: string, value: string) => writeSecure(key, value),
        async removeItem(key: string): Promise<void> {
          await removeSecure(key);
          await AsyncStorage.removeItem(key);
        },
      };
