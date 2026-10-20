import { Image, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { catalogEntry, suggestRecurring } from "@unitcent/core";
import { BRAND_GLYPHS } from "./brandGlyphs";
import { BRAND_IMAGES } from "./brandImages";
import { useTheme } from "./theme";
import { T } from "./ui";

/** Svjetlina boje (0–1), za odabir svijetlog ili tamnog znaka na krugu marke. */
function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Logo pretplate: slika logotipa, krug u boji marke sa znakom (Simple Icons, Tabler) ili, kad ničega nema, kratica (npr. „A1“).
 * Iste veličine kao CatIcon, pa se mogu miješati u istom popisu.
 */
export function BrandIcon({ brandKey, size = 40 }: { brandKey: string; size?: number }) {
  const { fx } = useTheme();
  const entry = catalogEntry(brandKey);
  const glyph = BRAND_GLYPHS[brandKey];
  const image = BRAND_IMAGES[brandKey];
  // Slika logotipa (marke bez otvorenog znaka): ispunjava krug ili je bijeli znak na boji marke.
  if (image?.fill) {
    return (
      <Image
        source={image.source}
        accessibilityIgnoresInvertColors
        style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: fx.glassBorder }}
      />
    );
  }
  const bg = entry?.brand ?? glyph?.color ?? "#5b6b68";
  const fg = luminance(bg) > 0.55 ? "#111111" : "#ffffff";
  const dark = luminance(bg) < 0.03; // crni krug na tamnoj pozadini dobiva tanki rub
  const mono = entry?.mono ?? (entry?.name ?? brandKey).charAt(0).toUpperCase();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: dark ? 1 : 0,
        borderColor: fx.glassBorder,
      }}
    >
      {image ? (
        <Image source={image.source} style={{ width: size, height: size }} />
      ) : glyph ? (
        <Svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24">
          {glyph.stroke ? (
            <Path d={glyph.d} fill="none" stroke={fg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <Path d={glyph.d} fill={fg} />
          )}
        </Svg>
      ) : (
        <T
          v="headline"
          color={fg}
          numberOfLines={1}
          style={{ fontSize: size * (mono.length >= 4 ? 0.22 : mono.length === 3 ? 0.28 : mono.length === 2 ? 0.36 : 0.44), lineHeight: size * 0.5, fontWeight: "800", letterSpacing: -0.3 }}
        >
          {mono}
        </T>
      )}
    </View>
  );
}

/**
 * Ikona pretplate za prikaz: spremljeni logo, ili logo marke prepoznate iz naziva (stavke dodane prije kataloga,
 * npr. „Netflix“ s ikonom „play“), ili spremljena ikona, ili ikona kategorije.
 */
export function recurringIcon(rec: { name: string; iconKey: string | null }, categoryIcon?: string): string {
  if (rec.iconKey?.startsWith("brand:")) return rec.iconKey;
  const hint = suggestRecurring(rec.name);
  if (hint?.icon.startsWith("brand:")) return hint.icon;
  return rec.iconKey ?? categoryIcon ?? "repeat";
}
