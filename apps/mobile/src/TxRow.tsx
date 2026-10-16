import { formatEur } from "@unitcent/core";
import { CatIcon } from "./components";
import { relativeDay } from "./format";
import { ListRow, RowAmount } from "./layout";
import { useTheme } from "./theme";
import { today, type Category, type Transaction } from "./db/repo";

/**
 * Redak troška. Naziv je bilješka (ili kategorija); kategorija se u podnaslovu ponavlja samo kad naziv nije ona.
 * Na početnom je omotan u SwipeRow (povuci ulijevo za brisanje), dodir uređuje.
 */
export function TxRow({
  tx,
  category,
  onPress,
  onLongPress,
  hideDate,
  first,
}: {
  tx: Transaction;
  category?: Category;
  onPress?: () => void;
  onLongPress?: () => void;
  hideDate?: boolean;
  first?: boolean;
}) {
  const { colors } = useTheme();
  const title = tx.note ?? category?.name ?? "Trošak";
  const source = tx.source === "recurring" ? "Pretplata" : tx.source === "scan" ? "Račun" : null;
  const sub = [hideDate ? null : relativeDay(tx.localDate, today()), tx.note ? category?.name : null, source].filter(Boolean).join(" · ");
  const income = tx.type === "income";
  return (
    <ListRow
      first={first}
      left={<CatIcon colorToken={category?.colorToken ?? "cat-ostalo"} icon={category?.icon ?? "dots"} size={40} />}
      title={title}
      subtitle={sub || undefined}
      right={<RowAmount color={income ? colors.brand : undefined}>{income ? `+${formatEur(tx.amountCents)}` : formatEur(-tx.amountCents)}</RowAmount>}
      onPress={onPress}
      onLongPress={onLongPress}
      hint="Dodirni za uređivanje, povuci ulijevo za brisanje"
    />
  );
}
