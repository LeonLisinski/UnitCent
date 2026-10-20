/**
 * Logotipi marki kao slike (128×128 PNG, `assets/brands`), za marke kojih nema u otvorenim skupovima znakova.
 * Izvor: službene ikone sa stranica marki (apple-touch-icon, favicon) i Wikimedia Commons. Zaštitni znakovi su vlasništvo
 * svojih vlasnika i služe samo za prepoznavanje usluge. GENERIRANO skriptom; ne uređuj ručno.
 * fill: true = slika ispunjava cijeli krug; false = bijeli znak na boji marke (iz kataloga).
 */
import type { ImageSourcePropType } from "react-native";

export const BRAND_IMAGES: Record<string, { source: ImageSourcePropType; fill: boolean }> = {
  "bonbon": { source: require("../assets/brands/bonbon.png"), fill: true },
  "tomato": { source: require("../assets/brands/tomato.png"), fill: true },
  "telemach": { source: require("../assets/brands/telemach.png"), fill: true },
  "eon": { source: require("../assets/brands/eon.png"), fill: true },
  "iskon": { source: require("../assets/brands/iskon.png"), fill: true },
  "hep": { source: require("../assets/brands/hep.png"), fill: true },
  "hrt": { source: require("../assets/brands/hrt.png"), fill: true },
  "hzzo": { source: require("../assets/brands/hzzo.png"), fill: true },
  "zet": { source: require("../assets/brands/zet.png"), fill: true },
  "hak": { source: require("../assets/brands/hak.png"), fill: true },
  "parking": { source: require("../assets/brands/parking.png"), fill: true },
  "nextbike": { source: require("../assets/brands/nextbike.png"), fill: true },
  "sportklub": { source: require("../assets/brands/sportklub.png"), fill: true },
  "skyshowtime": { source: require("../assets/brands/skyshowtime.png"), fill: true },
  "voyo": { source: require("../assets/brands/voyo.png"), fill: true },
  "pickbox": { source: require("../assets/brands/pickbox.png"), fill: true },
  "wolt": { source: require("../assets/brands/wolt.png"), fill: true },
  "calm": { source: require("../assets/brands/calm.png"), fill: true },
  "capcut": { source: require("../assets/brands/capcut.png"), fill: true },
  "cursor": { source: require("../assets/brands/cursor.png"), fill: true },
  "midjourney": { source: require("../assets/brands/midjourney.png"), fill: true },
  "myfitnesspal": { source: require("../assets/brands/myfitnesspal.png"), fill: true },
  "whoop": { source: require("../assets/brands/whoop.png"), fill: true },
  "bolt": { source: require("../assets/brands/bolt.png"), fill: false },
  "arenasport": { source: require("../assets/brands/arenasport.png"), fill: true },
  "iskontv": { source: require("../assets/brands/iskon.png"), fill: true },
  "dopunsko": { source: require("../assets/brands/hzzo.png"), fill: true },
  "struja": { source: require("../assets/brands/hep.png"), fill: true },
};
