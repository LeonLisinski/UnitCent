/**
 * Katalog čestih pretplata i fiksnih troškova (lokalno, bez mreže): prijedlozi dok tipkaš naziv, kategorija i ikona.
 * Marke imaju `brand` (boja za krug; znak je u aplikaciji, `apps/mobile/src/brandGlyphs.ts`); ikona marke se sprema
 * kao `brand:<key>`. Riječi se uspoređuju bez dijakritika i velikih slova.
 */
export interface CatalogEntry {
  key: string;
  name: string;
  /** Riječi i nazivi po kojima se prepoznaje (bez dijakritika, mala slova). */
  words: readonly string[];
  categoryKey: string;
  /** Opća ikona (za stavke bez marke i kao rezerva). */
  icon: string;
  /** Boja marke (krug iza znaka ili kratice). */
  brand?: string;
  /** Kratica u krugu kad marka nema znak (npr. „A1“, „HRT“); inače prvo slovo naziva. */
  mono?: string;
}

const E = (key: string, name: string, words: string[], categoryKey: string, icon: string, brand?: string, mono?: string): CatalogEntry => ({
  key,
  name,
  words,
  categoryKey,
  icon,
  ...(brand ? { brand } : {}),
  ...(mono ? { mono } : {}),
});

export const CATALOG: readonly CatalogEntry[] = [
  // Video streaming
  E("netflix", "Netflix", ["netflix"], "ostalo", "play", "#E50914"),
  E("max", "HBO Max", ["max", "hbo", "hbo max", "hbomax"], "ostalo", "play", "#002BE7"),
  E("disneyplus", "Disney+", ["disney", "disney plus", "disneyplus"], "ostalo", "play", "#113CCF", "D+"),
  E("primevideo", "Amazon Prime Video", ["prime video", "amazon prime video", "primevideo"], "ostalo", "play", "#1F2E3E"),
  E("youtube", "YouTube Premium", ["youtube", "youtube premium", "yt premium", "yt"], "ostalo", "play", "#FF0000"),
  E("skyshowtime", "SkyShowtime", ["skyshowtime", "sky showtime"], "ostalo", "play", "#1A1A2E", "S"),
  E("voyo", "Voyo", ["voyo"], "ostalo", "play", "#E4002B", "V"),
  E("pickbox", "Pickbox NOW", ["pickbox", "pickbox now"], "ostalo", "play", "#E6007E", "P"),
  E("appletv", "Apple TV+", ["apple tv", "appletv", "apple tv plus"], "ostalo", "play", "#000000"),
  E("crunchyroll", "Crunchyroll", ["crunchyroll"], "ostalo", "play", "#F47521"),
  E("mubi", "MUBI", ["mubi"], "ostalo", "play", "#000000"),
  E("dazn", "DAZN", ["dazn"], "ostalo", "play", "#0C161C"),
  E("paramountplus", "Paramount+", ["paramount", "paramount plus"], "ostalo", "play", "#0064FF"),
  // TV i sport (operateri)
  E("maxtv", "MAXtv", ["maxtv", "max tv", "magenta tv"], "stan", "play", "#E20074", "TV"),
  E("eon", "EON", ["eon", "eon tv"], "stan", "play", "#5B2C83", "EON"),
  E("a1tv", "A1 TV", ["a1 tv", "a1tv", "a1 xplore"], "stan", "play", "#DA291C", "A1"),
  E("iskontv", "Iskon TV", ["iskon tv", "iskontv"], "stan", "play", "#E30613", "i"),
  E("arenasport", "Arena Sport", ["arena sport", "arenasport", "arena"], "ostalo", "play", "#E2001A", "AS"),
  E("sportklub", "Sport Klub", ["sport klub", "sportklub", "sk paket"], "ostalo", "play", "#D50032", "SK"),
  E("maxsport", "MAX Sport", ["max sport", "maxsport"], "ostalo", "play", "#E20074", "MS"),
  // Glazba i audio
  E("spotify", "Spotify", ["spotify"], "ostalo", "music", "#1ED760"),
  E("youtubemusic", "YouTube Music Premium", ["youtube music", "yt music"], "ostalo", "music", "#FF0000"),
  E("applemusic", "Apple Music", ["apple music"], "ostalo", "music", "#FA243C"),
  E("deezer", "Deezer", ["deezer"], "ostalo", "music", "#A238FF", "D"),
  E("tidal", "Tidal", ["tidal"], "ostalo", "music", "#000000"),
  E("amazonmusic", "Amazon Music Unlimited", ["amazon music", "music unlimited"], "ostalo", "music", "#46C3D0"),
  E("audible", "Audible", ["audible"], "ostalo", "music", "#F8991C"),
  E("soundcloud", "SoundCloud Go+", ["soundcloud", "sound cloud"], "ostalo", "music", "#FF5500"),
  // Telekom i režije
  E("ht", "Hrvatski Telekom", ["ht", "telekom", "hrvatski telekom", "magenta", "t com", "tcom"], "stan", "phone", "#E20074", "T"),
  E("a1", "A1", ["a1"], "stan", "phone", "#DA291C", "A1"),
  E("telemach", "Telemach", ["telemach"], "stan", "phone", "#0075C9", "T"),
  E("bonbon", "bonbon", ["bonbon"], "stan", "phone", "#F5A800", "b"),
  E("tomato", "Tomato", ["tomato"], "stan", "phone", "#E4032E", "t"),
  E("iskon", "Iskon", ["iskon"], "stan", "wifi", "#E30613", "i"),
  E("mobitel", "Mobitel", ["mobitel", "mobilna", "tarifa", "mobilna tarifa"], "stan", "phone"),
  E("internet", "Kućni internet", ["internet", "kucni internet", "optika", "tv"], "stan", "wifi"),
  E("struja", "Struja (HEP)", ["struja", "hep", "elektra"], "stan", "bolt", "#E3000F", "HEP"),
  E("plin", "Plin", ["plin", "gradska plinara", "ppd"], "stan", "fuel"),
  E("voda", "Voda", ["voda", "vodovod", "vodoopskrba"], "stan", "drop"),
  E("otpad", "Odvoz otpada", ["otpad", "smece", "odvoz", "cistoca"], "stan", "trash"),
  E("komunalna", "Komunalna naknada", ["komunalna", "komunalna naknada"], "stan", "house"),
  E("hrt", "HRT pristojba", ["hrt", "pristojba", "rtv"], "stan", "play", "#0055A4", "HRT"),
  E("pricuva", "Pričuva zgrade", ["pricuva", "zgrada"], "stan", "house"),
  E("rezije", "Režije", ["rezije", "grijanje", "toplinarstvo"], "stan", "drop"),
  E("najam", "Najam", ["najam", "stanarina", "podstanar"], "stan", "house"),
  E("kredit", "Kredit", ["kredit", "rata", "stambeni", "zajam", "kartica"], "stan", "card"),
  E("leasing", "Leasing", ["leasing"], "auto", "car"),
  // Osiguranje i financije
  E("dopunsko", "Dopunsko zdravstveno (HZZO)", ["dopunsko", "hzzo"], "zdravlje", "heart", "#00579C", "HZZO"),
  E("dodatno", "Dodatno zdravstveno", ["dodatno", "dodatno zdravstveno", "zdravstveno"], "zdravlje", "heart"),
  E("ao", "Autoosiguranje (AO)", ["ao", "autoosiguranje", "auto osiguranje", "osiguranje"], "auto", "shield"),
  E("kasko", "Kasko", ["kasko"], "auto", "shield"),
  E("kucanstvo", "Osiguranje kućanstva", ["kucanstvo", "osiguranje kucanstva", "nekretnina", "osiguranje stana"], "stan", "shield"),
  E("zivotno", "Životno osiguranje", ["zivotno", "zivotno osiguranje"], "ostalo", "shield"),
  E("mirovinski", "Mirovinski fond (3. stup)", ["mirovinski", "treci stup", "3 stup", "dobrovoljni"], "ostalo", "wallet"),
  E("racun", "Paket računa", ["paket racuna", "vodenje racuna", "naknada banke", "banka"], "ostalo", "card"),
  E("revolut", "Revolut Premium", ["revolut", "revolut premium", "revolut metal"], "ostalo", "card", "#191C1F"),
  E("n26", "N26", ["n26"], "ostalo", "card", "#48AC98"),
  // Prijevoz
  E("zet", "ZET karta", ["zet", "zet karta", "pokaz", "mjesecna karta", "godisnja karta"], "ostalo", "card", "#0046AD", "ZET"),
  E("parking", "Parking pretplata", ["parking", "zagrebparking", "garaza"], "auto", "car", "#00A0DF", "P"),
  E("hak", "HAK članstvo", ["hak", "hak clanstvo"], "auto", "car", "#FFD100", "HAK"),
  E("nextbike", "Nextbike", ["nextbike", "next bike", "bicikl"], "ostalo", "repeat", "#0D4D9C", "nb"),
  E("registracija", "Registracija", ["registracija", "tehnicki"], "auto", "car"),
  E("enc", "ENC cestarina", ["enc", "cestarina", "vinjeta"], "auto", "car"),
  E("uber", "Uber One", ["uber"], "ostalo", "car", "#000000"),
  E("bolt", "Bolt", ["bolt"], "ostalo", "car", "#34D186", "B"),
  // Dostava i kupovina
  E("wolt", "Wolt+", ["wolt", "wolt plus"], "hrana", "cart", "#00C2E8", "W"),
  E("glovo", "Glovo Prime", ["glovo", "glovo prime"], "hrana", "cart", "#F2CC38"),
  E("amazonprime", "Amazon Prime", ["amazon prime", "amazon", "amazon de"], "ostalo", "cart", "#00A8E1"),
  // Cloud i softver
  E("icloud", "iCloud+", ["icloud", "icloud plus"], "ostalo", "cloud", "#3693F3"),
  E("google", "Google One", ["google one", "google"], "ostalo", "cloud", "#4285F4"),
  E("apple", "Apple One", ["apple one", "apple"], "ostalo", "cloud", "#000000"),
  E("microsoft365", "Microsoft 365", ["microsoft", "microsoft 365", "office", "365", "onedrive"], "ostalo", "cloud", "#0078D4", "M"),
  E("dropbox", "Dropbox", ["dropbox"], "ostalo", "cloud", "#0061FF"),
  E("adobe", "Adobe Creative Cloud", ["adobe", "creative cloud", "photoshop", "lightroom", "acrobat"], "ostalo", "cloud", "#FF0000"),
  E("canva", "Canva Pro", ["canva"], "ostalo", "cloud", "#00C4CC"),
  E("capcut", "CapCut Pro", ["capcut", "cap cut"], "ostalo", "cloud", "#000000", "CC"),
  E("notion", "Notion", ["notion"], "ostalo", "cloud", "#000000"),
  E("grammarly", "Grammarly", ["grammarly"], "ostalo", "cloud", "#027E6F"),
  E("zoom", "Zoom", ["zoom"], "ostalo", "cloud", "#0B5CFF"),
  E("googleworkspace", "Google Workspace", ["workspace", "google workspace", "gsuite", "g suite"], "ostalo", "cloud", "#4285F4"),
  E("1password", "1Password", ["1password", "1 password"], "ostalo", "shield", "#3B66BC"),
  E("bitwarden", "Bitwarden", ["bitwarden"], "ostalo", "shield", "#175DDC"),
  E("mega", "MEGA", ["mega"], "ostalo", "cloud", "#D9272E"),
  E("slack", "Slack", ["slack"], "ostalo", "cloud", "#4A154B"),
  E("figma", "Figma", ["figma"], "ostalo", "cloud", "#F24E1E"),
  // AI alati
  E("openai", "ChatGPT Plus", ["chatgpt", "chat gpt", "openai", "gpt"], "ostalo", "cloud", "#10A37F"),
  E("claude", "Claude Pro", ["claude", "anthropic"], "ostalo", "cloud", "#D97757"),
  E("googlegemini", "Google AI Pro", ["gemini", "google ai", "google ai pro"], "ostalo", "cloud", "#8E75B2"),
  E("perplexity", "Perplexity Pro", ["perplexity"], "ostalo", "cloud", "#1FB8CD"),
  E("midjourney", "Midjourney", ["midjourney", "mid journey"], "ostalo", "cloud", "#000000", "MJ"),
  E("github", "GitHub Copilot", ["github", "copilot"], "ostalo", "cloud", "#181717"),
  E("cursor", "Cursor", ["cursor"], "ostalo", "cloud", "#000000", "C"),
  // Gaming
  E("playstation", "PlayStation Plus", ["playstation", "ps plus", "psn", "ps"], "ostalo", "play", "#0070D1"),
  E("xbox", "Xbox Game Pass", ["xbox", "game pass", "gamepass"], "ostalo", "play", "#107C10", "X"),
  E("nintendoswitch", "Nintendo Switch Online", ["nintendo", "switch online"], "ostalo", "play", "#E60012"),
  E("ea", "EA Play", ["ea play", "ea"], "ostalo", "play", "#000000"),
  E("ubisoft", "Ubisoft+", ["ubisoft", "ubisoft plus"], "ostalo", "play", "#000000"),
  E("nvidia", "GeForce NOW", ["geforce", "geforce now", "nvidia"], "ostalo", "play", "#76B900"),
  E("discord", "Discord Nitro", ["discord", "nitro"], "ostalo", "play", "#5865F2"),
  E("twitch", "Twitch", ["twitch"], "ostalo", "play", "#9146FF"),
  E("roblox", "Roblox Premium", ["roblox"], "ostalo", "play", "#000000"),
  E("applearcade", "Apple Arcade", ["apple arcade", "arcade"], "ostalo", "play", "#000000"),
  E("steam", "Steam", ["steam"], "ostalo", "play", "#171A21"),
  // Fitness i zdravlje
  E("teretana", "Teretana", ["teretana", "gym", "fitness", "trening", "bazen", "joga", "yoga", "clanarina"], "zdravlje", "dumbbell"),
  E("multisport", "Multisport", ["multisport"], "zdravlje", "dumbbell", "#0055A5", "MS"),
  E("myfitnesspal", "MyFitnessPal Premium", ["myfitnesspal", "my fitness pal", "mfp"], "zdravlje", "heart", "#0072CE", "MFP"),
  E("strava", "Strava", ["strava"], "zdravlje", "dumbbell", "#FC4C02"),
  E("garmin", "Garmin Connect+", ["garmin"], "zdravlje", "dumbbell", "#000000"),
  E("fitbit", "Fitbit Premium", ["fitbit"], "zdravlje", "heart", "#00B0B9"),
  E("whoop", "Whoop", ["whoop"], "zdravlje", "heart", "#000000", "W"),
  E("headspace", "Headspace", ["headspace"], "zdravlje", "heart", "#F47D31"),
  E("calm", "Calm", ["calm"], "zdravlje", "heart", "#3A6FD8", "C"),
  // Edukacija i čitanje
  E("duolingo", "Duolingo Super", ["duolingo"], "ostalo", "cloud", "#58CC02"),
  E("linkedin", "LinkedIn Premium", ["linkedin"], "ostalo", "cloud", "#0A66C2"),
  E("kindle", "Kindle Unlimited", ["kindle", "kindle unlimited"], "ostalo", "file", "#232F3E"),
  E("novine", "Pretplata na novine", ["novine", "jutarnji", "vecernji", "index", "telegram", "dnevnik", "magazin"], "ostalo", "file"),
  E("substack", "Substack", ["substack"], "ostalo", "file", "#FF6719"),
  E("medium", "Medium", ["medium"], "ostalo", "file", "#000000"),
  E("patreon", "Patreon", ["patreon"], "ostalo", "gift", "#000000"),
  // Ostalo
  E("nordvpn", "NordVPN", ["nordvpn", "nord vpn", "vpn"], "ostalo", "shield", "#4687FF"),
  E("surfshark", "Surfshark", ["surfshark"], "ostalo", "shield", "#1EBFBF"),
  E("expressvpn", "ExpressVPN", ["expressvpn", "express vpn"], "ostalo", "shield", "#DA3940"),
  E("protonmail", "Proton", ["proton"], "ostalo", "shield", "#6D4AFF"),
  E("mullvad", "Mullvad VPN", ["mullvad"], "ostalo", "shield", "#294D73"),
  E("bitdefender", "Bitdefender", ["bitdefender", "antivirus"], "ostalo", "shield", "#ED1C24"),
  E("norton", "Norton", ["norton"], "ostalo", "shield", "#FFE01A"),
  E("tinder", "Tinder", ["tinder"], "ostalo", "heart", "#FF6B6B"),
  E("bumble", "Bumble", ["bumble"], "ostalo", "heart", "#FFC629", "B"),
  E("vrtic", "Vrtić", ["vrtic", "skola", "skolarina", "dadilja", "dzeparac"], "ostalo", "gift"),
];

export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Ključ ikone koji se sprema uz pretplatu: `brand:<key>` za marke, inače opća ikona. */
export function catalogIconKey(e: CatalogEntry): string {
  return e.brand ? `brand:${e.key}` : e.icon;
}

export function catalogEntry(key: string): CatalogEntry | undefined {
  return CATALOG.find((e) => e.key === key);
}

/** Koliko dobro naziv odgovara stavci: 3 = cijela riječ, 2 = naziv počinje upisanim, 1 = riječ počinje upisanim. */
function score(e: CatalogEntry, n: string): number {
  const padded = ` ${n} `;
  let best = 0;
  for (const w of e.words) {
    if (padded.includes(` ${w} `)) best = Math.max(best, 3 + w.length / 100); // duža riječ = precizniji pogodak
    else if (n.length >= 2 && w.length > n.length && w.startsWith(n)) best = Math.max(best, 1);
  }
  if (n.length >= 2 && normalizeName(e.name).startsWith(n)) best = Math.max(best, 2);
  return best;
}

/** Prijedlozi dok tipkaš naziv (najbolji prvi). Prazan ili jednoslovan upis nema prijedloga. */
export function searchCatalog(query: string, limit = 4): CatalogEntry[] {
  const n = normalizeName(query);
  if (n.length < 2) return [];
  return CATALOG.map((e) => ({ e, s: score(e, n) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.e);
}

/**
 * Prijedlog kategorije i ikone po nazivu pretplate: „Kredit“ → Stan i režije, „Disney+“ → logo Disney+.
 * Traži pogodak cijele riječi, ili početak riječi od barem 4 slova („kred“ → kredit). Nepoznat naziv vraća null.
 */
export function suggestRecurring(name: string): { categoryKey: string; icon: string; entry: CatalogEntry } | null {
  const n = normalizeName(name);
  if (n.length < 2) return null;
  let best: { e: CatalogEntry; s: number } | null = null;
  for (const e of CATALOG) {
    const s = score(e, n);
    const ok = s >= 2 || (s >= 1 && n.length >= 4);
    if (ok && (!best || s > best.s)) best = { e, s };
  }
  return best ? { categoryKey: best.e.categoryKey, icon: catalogIconKey(best.e), entry: best.e } : null;
}
