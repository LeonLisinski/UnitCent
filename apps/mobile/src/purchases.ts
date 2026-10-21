import { Linking, Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { getDb } from "./db/client";
import { notifyDbChanged } from "./db/events";
import { refreshEntitlement, type PlanKey } from "./premium";
import { supabase } from "./supabase";

/**
 * Kupnja preko RevenueCata (Apple/Google). Radi kad su postavljeni ključevi (EXPO_PUBLIC_RC_IOS_KEY / _ANDROID_KEY) i
 * kad aplikacija radi kao pravi build; inače vraća "unavailable" i aplikacija ostaje na besplatnoj razini.
 * `app_user_id` je Supabase korisnik, pa webhook (supabase/functions/revenuecat-webhook) zna kome upisati pristup.
 * Entitlement u RevenueCatu je „Premium“ (uspoređuje se bez obzira na velika i mala slova), a paketi su standardni ($rc_monthly, $rc_annual).
 */
const KEY = Platform.OS === "ios" ? process.env.EXPO_PUBLIC_RC_IOS_KEY : process.env.EXPO_PUBLIC_RC_ANDROID_KEY;
const ENTITLEMENT = "premium";

/** Aktivni Premium entitlement; identifier u RevenueCatu je „Premium“, pa usporedba ne ovisi o velikim slovima. */
function activePremium<T>(active: Record<string, T>): T | undefined {
  const key = Object.keys(active).find((k) => k.toLowerCase() === ENTITLEMENT);
  return key ? active[key] : undefined;
}

export type PurchaseResult = "ok" | "cancelled" | "unavailable" | "error";

type PurchasesModule = typeof import("react-native-purchases").default;
let configuredFor: string | null = null;
let sdk: PurchasesModule | null = null;

/** SDK se učitava tek pri prvoj kupnji i u try/catch: u Expo Go (bez native modula) aplikacija ne smije pasti. */
function loadSdk(): PurchasesModule | null {
  if (sdk) return sdk;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    sdk = (require("react-native-purchases") as { default: PurchasesModule }).default;
    return sdk;
  } catch {
    return null;
  }
}

/** Expo Go nema App Store / Google Play modul: kupnja tamo ne radi, pa se RevenueCat uopće ne pokreće. */
const IN_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

async function ensureConfigured(): Promise<boolean> {
  if (!KEY || !supabase || IN_EXPO_GO) return false;
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return false;
  const Purchases = loadSdk();
  if (!Purchases) return false;
  if (configuredFor === uid) return true;
  if (configuredFor === null) Purchases.configure({ apiKey: KEY, appUserID: uid });
  else await Purchases.logIn(uid);
  configuredFor = uid;
  return true;
}

export const purchasesConfigured = (): boolean => !!KEY;

type EntitlementInfo = { expirationDate: string | null; productIdentifier?: string; periodType?: string };
type CustomerInfoLike = { entitlements: { active: Record<string, EntitlementInfo> } };
const setKv = (key: string, value: string) =>
  getDb().runSync("insert into kv (key, value) values (?, ?) on conflict(key) do update set value = excluded.value", [key, value]);

/** Koji plan je aktivan i je li probno razdoblje (za redak „Pretplata“ u Profilu). */
function applyPlanInfo(info: CustomerInfoLike): void {
  const e = activePremium(info.entitlements.active);
  setKv("premium.product", e?.productIdentifier ?? "");
  setKv("premium.trial", e?.periodType === "TRIAL" ? "1" : "");
}

/** Zapisuje status pretplate lokalno odmah nakon kupnje (poslužiteljski redak stiže webhookom nekoliko sekundi kasnije). */
function applyLocal(info: CustomerInfoLike): void {
  setKv("premium.until", activePremium(info.entitlements.active)?.expirationDate ?? "");
  applyPlanInfo(info);
  notifyDbChanged();
}

/** Osvježava podatke o planu (godišnje/mjesečno, proba) iz trgovine; pristup i dalje određuje poslužitelj. */
export async function refreshPlanInfo(): Promise<void> {
  try {
    if (!(await ensureConfigured())) return;
    applyPlanInfo((await loadSdk()!.getCustomerInfo()) as never);
    notifyDbChanged();
  } catch {
    // ostaje zadnja poznata vrijednost
  }
}

export async function purchasePlan(plan: PlanKey): Promise<PurchaseResult> {
  try {
    if (!(await ensureConfigured())) return "unavailable";
    const Purchases = loadSdk()!;
    const offerings = await Purchases.getOfferings();
    const pkgs = offerings.current?.availablePackages ?? [];
    const pkg = pkgs.find((p) => p.packageType === (plan === "yearly" ? "ANNUAL" : "MONTHLY"));
    if (!pkg) return "unavailable";
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    applyLocal(customerInfo as never);
    void refreshEntitlement();
    return "ok";
  } catch (e) {
    if ((e as { userCancelled?: boolean }).userCancelled) return "cancelled";
    return "error";
  }
}

export async function restorePurchases(): Promise<PurchaseResult> {
  try {
    if (!(await ensureConfigured())) return "unavailable";
    const info = await loadSdk()!.restorePurchases();
    applyLocal(info as never);
    void refreshEntitlement();
    return activePremium(info.entitlements.active) ? "ok" : "error";
  } catch {
    return "error";
  }
}

/**
 * Upravljanje pretplatom (promjena plana, otkazivanje) radi trgovina, ne aplikacija: otvara stranicu pretplata
 * u App Storeu ili Google Playu. Uvijek dostupno (pravila trgovina i EU), ali tiho, u skupini Premium.
 */
export async function openManageSubscription(): Promise<void> {
  const url = Platform.OS === "ios" ? "https://apps.apple.com/account/subscriptions" : "https://play.google.com/store/account/subscriptions";
  await Linking.openURL(url);
}
