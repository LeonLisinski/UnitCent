/**
 * Planovi i cijene pretplata u Hrvatskoj (s PDV-om), po ključu iz CATALOG. Izvor: katalog „UnitCent — katalog pretplata (Hrvatska)“,
 * verzija 2026-10-19. Cijene su orijentacijske: korisnik ih uvijek može promijeniti.
 * `approx` = niska pouzdanost (procjena, provjeriti). `variable` = iznos ovisi o korisniku, pa se pita iznos.
 * GENERIRANO skriptom iz JSON-a; ne uređuj ručno.
 */
import type { Cents } from "./money";

export type PlanCycle = "monthly" | "semiannual" | "yearly";

export interface ServicePlan {
  name: string;
  cents: Cents;
  cycle: PlanCycle;
  /** Valuta cijene ako nije EUR (takvi planovi se ne nude kao iznos). */
  currency?: "USD";
  approx?: true;
}

export const SERVICE_PLANS: Record<string, { variable: boolean; plans: readonly ServicePlan[] }> = {
  "netflix": { variable: false, plans: [{ name: "Osnovni", cents: 599, cycle: "monthly" }, { name: "Standardni", cents: 999, cycle: "monthly" }, { name: "Premium", cents: 1299, cycle: "monthly" }] },
  "max": { variable: false, plans: [{ name: "Standard", cents: 999, cycle: "monthly" }, { name: "Standard (godišnje)", cents: 9990, cycle: "yearly" }, { name: "Premium", cents: 1199, cycle: "monthly" }, { name: "Premium (godišnje)", cents: 11900, cycle: "yearly" }] },
  "disneyplus": { variable: false, plans: [{ name: "Standard", cents: 999, cycle: "monthly" }, { name: "Standard (godišnje)", cents: 9990, cycle: "yearly" }, { name: "Premium", cents: 1399, cycle: "monthly" }, { name: "Premium (godišnje)", cents: 13990, cycle: "yearly" }] },
  "primevideo": { variable: false, plans: [{ name: "Samo Prime Video", cents: 699, cycle: "monthly" }] },
  "youtube": { variable: false, plans: [{ name: "Pojedinačni", cents: 955, cycle: "monthly" }, { name: "Obiteljski", cents: 1460, cycle: "monthly" }] },
  "skyshowtime": { variable: false, plans: [{ name: "Standard s oglasima", cents: 599, cycle: "monthly" }, { name: "Standard s oglasima (godišnje)", cents: 4799, cycle: "yearly", approx: true }, { name: "Standard", cents: 899, cycle: "monthly" }, { name: "Standard (godišnje)", cents: 6999, cycle: "yearly", approx: true }, { name: "Premium", cents: 1099, cycle: "monthly" }, { name: "Premium (godišnje)", cents: 8499, cycle: "yearly", approx: true }] },
  "voyo": { variable: false, plans: [{ name: "Mjesečna", cents: 599, cycle: "monthly" }, { name: "Godišnja", cents: 5391, cycle: "yearly" }] },
  "pickbox": { variable: false, plans: [{ name: "Start", cents: 385, cycle: "monthly" }, { name: "Plus (6 mj)", cents: 2750, cycle: "semiannual" }, { name: "Family (12 mj)", cents: 4000, cycle: "yearly" }] },
  "appletv": { variable: false, plans: [{ name: "Mjesečna", cents: 999, cycle: "monthly" }, { name: "Godišnja", cents: 7900, cycle: "yearly" }] },
  "crunchyroll": { variable: false, plans: [{ name: "Fan", cents: 499, cycle: "monthly", approx: true }, { name: "Mega Fan", cents: 649, cycle: "monthly", approx: true }, { name: "Ultimate Fan", cents: 999, cycle: "monthly", approx: true }] },
  "mubi": { variable: false, plans: [{ name: "Mjesečna", cents: 1299, cycle: "monthly", approx: true }, { name: "Godišnja", cents: 10788, cycle: "yearly", approx: true }] },
  "maxtv": { variable: true, plans: [{ name: "Osnovni paket uz internet", cents: 1306, cycle: "monthly" }, { name: "Osnovni paket samostalni IPTV", cents: 2915, cycle: "monthly" }, { name: "MAXtv To Go Osnovni", cents: 395, cycle: "monthly" }] },
  "eon": { variable: true, plans: [] },
  "a1tv": { variable: true, plans: [] },
  "iskontv": { variable: true, plans: [] },
  "arenasport": { variable: true, plans: [] },
  "sportklub": { variable: true, plans: [] },
  "maxsport": { variable: true, plans: [] },
  "spotify": { variable: false, plans: [{ name: "Pojedinačni", cents: 699, cycle: "monthly" }, { name: "Student", cents: 399, cycle: "monthly" }, { name: "Duo", cents: 999, cycle: "monthly" }, { name: "Obitelj", cents: 1249, cycle: "monthly" }] },
  "applemusic": { variable: false, plans: [{ name: "Pojedinačni", cents: 699, cycle: "monthly" }, { name: "Obiteljski", cents: 1199, cycle: "monthly" }] },
  "tidal": { variable: false, plans: [{ name: "Individual", cents: 1099, cycle: "monthly", approx: true }] },
  "amazonmusic": { variable: false, plans: [{ name: "Individual", cents: 1099, cycle: "monthly", approx: true }, { name: "Individual (Prime član)", cents: 999, cycle: "monthly", approx: true }] },
  "audible": { variable: false, plans: [{ name: "Standard", cents: 995, cycle: "monthly", approx: true }] },
  "soundcloud": { variable: false, plans: [{ name: "Go+", cents: 1099, cycle: "monthly", approx: true }] },
  "ht": { variable: true, plans: [] },
  "a1": { variable: true, plans: [] },
  "telemach": { variable: true, plans: [] },
  "bonbon": { variable: true, plans: [] },
  "tomato": { variable: true, plans: [] },
  "internet": { variable: true, plans: [] },
  "struja": { variable: true, plans: [] },
  "plin": { variable: true, plans: [] },
  "voda": { variable: true, plans: [] },
  "otpad": { variable: true, plans: [] },
  "komunalna": { variable: true, plans: [] },
  "hrt": { variable: false, plans: [{ name: "Mjesečna pristojba", cents: 1062, cycle: "monthly" }] },
  "pricuva": { variable: true, plans: [] },
  "dopunsko": { variable: false, plans: [{ name: "Mjesečno", cents: 1500, cycle: "monthly" }, { name: "Godišnje", cents: 18000, cycle: "yearly" }] },
  "dodatno": { variable: true, plans: [] },
  "ao": { variable: true, plans: [] },
  "kasko": { variable: true, plans: [] },
  "kucanstvo": { variable: true, plans: [] },
  "zivotno": { variable: true, plans: [] },
  "mirovinski": { variable: true, plans: [] },
  "racun": { variable: true, plans: [] },
  "revolut": { variable: false, plans: [{ name: "Plus", cents: 399, cycle: "monthly", approx: true }, { name: "Premium", cents: 899, cycle: "monthly", approx: true }, { name: "Metal", cents: 1599, cycle: "monthly", approx: true }, { name: "Ultra", cents: 5500, cycle: "monthly", approx: true }] },
  "parking": { variable: true, plans: [] },
  "wolt": { variable: false, plans: [{ name: "Mjesečno", cents: 299, cycle: "monthly" }, { name: "Godišnje", cents: 2499, cycle: "yearly", approx: true }] },
  "glovo": { variable: false, plans: [{ name: "Mjesečno", cents: 399, cycle: "monthly" }, { name: "Godišnje", cents: 4999, cycle: "yearly", approx: true }] },
  "amazonprime": { variable: false, plans: [{ name: "Mjesečno", cents: 899, cycle: "monthly" }] },
  "icloud": { variable: false, plans: [{ name: "50 GB", cents: 99, cycle: "monthly" }, { name: "200 GB", cents: 299, cycle: "monthly" }, { name: "2 TB", cents: 999, cycle: "monthly" }, { name: "6 TB", cents: 2999, cycle: "monthly" }, { name: "12 TB", cents: 5999, cycle: "monthly" }] },
  "google": { variable: false, plans: [{ name: "Basic 100 GB", cents: 212, cycle: "monthly" }, { name: "200 GB", cents: 319, cycle: "monthly" }, { name: "Google AI Plus", cents: 499, cycle: "monthly" }] },
  "microsoft365": { variable: false, plans: [{ name: "Personal", cents: 1000, cycle: "monthly" }, { name: "Personal (godišnje)", cents: 9900, cycle: "yearly" }, { name: "Family", cents: 1300, cycle: "monthly" }, { name: "Family (godišnje)", cents: 12900, cycle: "yearly" }, { name: "Premium", cents: 2300, cycle: "monthly" }, { name: "Premium (godišnje)", cents: 22900, cycle: "yearly" }] },
  "dropbox": { variable: false, plans: [{ name: "Plus", cents: 1199, cycle: "monthly", approx: true }, { name: "Plus (godišnje)", cents: 11988, cycle: "yearly", approx: true }] },
  "notion": { variable: false, plans: [{ name: "Plus", cents: 1200, cycle: "monthly", currency: "USD", approx: true }, { name: "Plus (godišnje)", cents: 12000, cycle: "yearly", currency: "USD", approx: true }] },
  "grammarly": { variable: false, plans: [{ name: "Pro", cents: 3000, cycle: "monthly", currency: "USD", approx: true }, { name: "Pro (godišnje)", cents: 14400, cycle: "yearly", currency: "USD", approx: true }] },
  "1password": { variable: false, plans: [{ name: "Individual", cents: 299, cycle: "monthly", currency: "USD", approx: true }, { name: "Families", cents: 499, cycle: "monthly", currency: "USD", approx: true }] },
  "openai": { variable: false, plans: [{ name: "Go", cents: 800, cycle: "monthly" }, { name: "Plus", cents: 2375, cycle: "monthly" }] },
  "claude": { variable: false, plans: [{ name: "Pro", cents: 2250, cycle: "monthly" }, { name: "Pro (godišnje)", cents: 22500, cycle: "yearly" }, { name: "Max 5x", cents: 11250, cycle: "monthly" }, { name: "Max 20x", cents: 22500, cycle: "monthly" }] },
  "googlegemini": { variable: false, plans: [{ name: "AI Pro", cents: 2299, cycle: "monthly" }, { name: "AI Ultra (od)", cents: 10605, cycle: "monthly" }] },
  "perplexity": { variable: false, plans: [{ name: "Pro", cents: 2000, cycle: "monthly", currency: "USD", approx: true }, { name: "Pro (godišnje)", cents: 20000, cycle: "yearly", currency: "USD", approx: true }] },
  "midjourney": { variable: false, plans: [{ name: "Basic", cents: 1000, cycle: "monthly", currency: "USD", approx: true }, { name: "Standard", cents: 3000, cycle: "monthly", currency: "USD", approx: true }, { name: "Pro", cents: 6000, cycle: "monthly", currency: "USD", approx: true }, { name: "Mega", cents: 12000, cycle: "monthly", currency: "USD", approx: true }] },
  "github": { variable: false, plans: [{ name: "Pro", cents: 1000, cycle: "monthly", currency: "USD", approx: true }, { name: "Pro (godišnje)", cents: 10000, cycle: "yearly", currency: "USD", approx: true }, { name: "Pro+", cents: 3900, cycle: "monthly", currency: "USD", approx: true }] },
  "cursor": { variable: false, plans: [{ name: "Pro", cents: 2000, cycle: "monthly", currency: "USD", approx: true }, { name: "Pro+", cents: 6000, cycle: "monthly", currency: "USD", approx: true }, { name: "Ultra", cents: 20000, cycle: "monthly", currency: "USD", approx: true }] },
  "playstation": { variable: false, plans: [{ name: "Essential", cents: 899, cycle: "monthly", approx: true }, { name: "Essential (godišnje)", cents: 7199, cycle: "yearly" }, { name: "Extra", cents: 1399, cycle: "monthly", approx: true }, { name: "Extra (godišnje)", cents: 12599, cycle: "yearly" }, { name: "Premium", cents: 1699, cycle: "monthly", approx: true }, { name: "Premium (godišnje)", cents: 15199, cycle: "yearly" }] },
  "xbox": { variable: false, plans: [{ name: "Essential", cents: 899, cycle: "monthly" }, { name: "Premium", cents: 1299, cycle: "monthly" }, { name: "PC Game Pass", cents: 1299, cycle: "monthly" }, { name: "Ultimate", cents: 2099, cycle: "monthly" }] },
  "nintendoswitch": { variable: false, plans: [{ name: "Individual (12 mj)", cents: 1999, cycle: "yearly", approx: true }, { name: "Family (12 mj)", cents: 3499, cycle: "yearly", approx: true }, { name: "+ Expansion Pack (12 mj)", cents: 3999, cycle: "yearly", approx: true }, { name: "+ Expansion Pack Family (12 mj)", cents: 6999, cycle: "yearly", approx: true }] },
  "ea": { variable: false, plans: [{ name: "Mjesečno", cents: 599, cycle: "monthly", approx: true }, { name: "Godišnje", cents: 3999, cycle: "yearly", approx: true }] },
  "ubisoft": { variable: false, plans: [{ name: "Classics", cents: 799, cycle: "monthly", approx: true }, { name: "Premium", cents: 1799, cycle: "monthly", approx: true }] },
  "nvidia": { variable: false, plans: [{ name: "Performance", cents: 1099, cycle: "monthly", approx: true }, { name: "Ultimate", cents: 2199, cycle: "monthly", approx: true }] },
  "discord": { variable: false, plans: [{ name: "Nitro Basic", cents: 299, cycle: "monthly", approx: true }, { name: "Nitro", cents: 999, cycle: "monthly", approx: true }] },
  "roblox": { variable: false, plans: [{ name: "Premium 450", cents: 499, cycle: "monthly", approx: true }, { name: "Premium 1000", cents: 999, cycle: "monthly", approx: true }, { name: "Premium 2200", cents: 1999, cycle: "monthly", approx: true }] },
  "applearcade": { variable: false, plans: [{ name: "Mjesečno", cents: 699, cycle: "monthly", approx: true }] },
  "teretana": { variable: true, plans: [] },
  "myfitnesspal": { variable: false, plans: [{ name: "Mjesečno", cents: 1999, cycle: "monthly", approx: true }, { name: "Godišnje", cents: 7999, cycle: "yearly", approx: true }] },
  "strava": { variable: false, plans: [{ name: "Mjesečno", cents: 1199, cycle: "monthly", approx: true }, { name: "Godišnje", cents: 5999, cycle: "yearly", approx: true }] },
  "garmin": { variable: false, plans: [{ name: "Mjesečno", cents: 899, cycle: "monthly", approx: true }, { name: "Godišnje", cents: 8999, cycle: "yearly", approx: true }] },
  "fitbit": { variable: false, plans: [{ name: "Mjesečno", cents: 899, cycle: "monthly", approx: true }, { name: "Godišnje", cents: 7999, cycle: "yearly", approx: true }] },
  "whoop": { variable: false, plans: [{ name: "One (godišnje)", cents: 19900, cycle: "yearly", currency: "USD", approx: true }, { name: "Peak (godišnje)", cents: 23900, cycle: "yearly", currency: "USD", approx: true }, { name: "Life (godišnje)", cents: 35900, cycle: "yearly", currency: "USD", approx: true }] },
  "headspace": { variable: false, plans: [{ name: "Headspace mjesečno", cents: 1299, cycle: "monthly", approx: true }, { name: "Headspace godišnje", cents: 6999, cycle: "yearly", approx: true }] },
  "calm": { variable: false, plans: [{ name: "Calm godišnje", cents: 6999, cycle: "yearly", approx: true }] },
  "kindle": { variable: false, plans: [{ name: "Mjesečno", cents: 999, cycle: "monthly", approx: true }] },
  "novine": { variable: true, plans: [] },
  "nordvpn": { variable: true, plans: [] },
  "bitdefender": { variable: true, plans: [] },
  "tinder": { variable: true, plans: [] },
};

/** Mjesečni planovi u eurima koje aplikacija može ponuditi kao iznos (pretplate se za sada knjiže mjesečno). */
export function monthlyPlans(key: string): ServicePlan[] {
  return (SERVICE_PLANS[key]?.plans ?? []).filter((p) => p.cycle === "monthly" && !p.currency);
}
