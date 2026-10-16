import { Pressable, View } from "react-native";
import { formatEur } from "@unitcent/core";
import { CatIcon } from "./components";
import { relativeDay } from "./format";
import { useTheme } from "./theme";
import { T } from "./ui";
import { today, type Category, type Transaction } from "./db/repo";

/**
 * Redak troška: ikona kategorije, naziv, podatak i iznos. Bez kutije; na početnom je omotan
 * u SwipeRow (povuci ulijevo za brisanje), a dugi pritisak je rezerva za pristupačnost.
 */
export function TxRow({
  tx,
  category,
  onPress,
  onLongPress,
  hideDate,
}: {
  tx: Transaction;
  category?: Category;
  onPress?: () => void;
  onLongPress?: () => void;
  hideDate?: boolean;
}) {
  const { colors } = useTheme();
  const title = tx.note ?? category?.name ?? "Trošak";
  const sub = [hideDate ? null : relativeDay(tx.localDate, today()), category?.name]
    .filter(Boolean)
    .join(" · ");
  const amount = tx.type === "income" ? `+${formatEur(tx.amountCents)}` : formatEur(-tx.amountCents);
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={450}
      accessibilityRole="button"
      accessibilityHint="Dodirni za uređivanje, povuci ulijevo za brisanje"
      style={{ minHeight: 64, flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 10 }}
    >
      <CatIcon colorToken={category?.colorToken ?? "cat-ostalo"} icon={category?.icon ?? "dots"} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <T v="headline" numberOfLines={1} style={{ fontWeight: "700" }}>{title}</T>
        <T v="caption" muted numberOfLines={1}>{sub}</T>
      </View>
      <T v="amount" color={tx.type === "income" ? colors.brand : colors.ink} style={{ fontWeight: "800" }}>{amount}</T>
    </Pressable>
  );
}
