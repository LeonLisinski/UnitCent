import { Pressable, View } from "react-native";
import { formatEur } from "@unitcent/core";
import { CatIcon } from "./components";
import { relativeDay } from "./format";
import { useTheme } from "./theme";
import { T } from "./ui";
import { today, type Category, type Transaction } from "./db/repo";

/** Redak troška: ikona kategorije, naziv, datum i iznos. Dugi pritisak briše (uz „Poništi“). */
export function TxRow({
  tx,
  category,
  onLongPress,
}: {
  tx: Transaction;
  category?: Category;
  onLongPress?: () => void;
}) {
  const { colors } = useTheme();
  const title = tx.note ?? category?.name ?? "Trošak";
  const sub = [relativeDay(tx.localDate, today()), category?.name].filter(Boolean).join(" · ");
  const amount = tx.type === "income" ? `+${formatEur(tx.amountCents)}` : formatEur(-tx.amountCents);
  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={450}
      accessibilityRole="button"
      accessibilityHint={onLongPress ? "Dugo pritisni za brisanje" : undefined}
      style={{ minHeight: 64, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 }}
    >
      <CatIcon colorToken={category?.colorToken ?? "cat-ostalo"} icon={category?.icon ?? "dots"} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <T v="headline" numberOfLines={1}>{title}</T>
        <T v="caption" muted numberOfLines={1}>{sub}</T>
      </View>
      <T v="amount" color={tx.type === "income" ? colors.brand : colors.ink}>{amount}</T>
    </Pressable>
  );
}
