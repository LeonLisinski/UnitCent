import { formatEur } from "@unitcent/core";
import { CatIcon } from "./components";
import { relativeDay } from "./format";
import { ListRow, RowAmount } from "./layout";
import { useTheme } from "./theme";
import { today, type Category, type Transaction } from "./db/repo";

/**
 * Redak troška. Naziv je bilješka, trgovina ili kategorija; podnaslov kategorija (ako nije naslov), izvor i vrijeme.
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
  // Naslov: bilješka, pa trgovina (skenirani račun), pa kategorija. Podnaslov nikad ne ponavlja naslov.
  const title = tx.note ?? tx.merchant ?? category?.name ?? "Trošak";
  const source = tx.source === "recurring" ? "Pretplata" : tx.source === "scan" ? "Račun" : null;
  // Vrijeme unosa (kad se datum ne prikazuje, npr. pod „Danas“); knjižene pretplate nemaju pravo vrijeme.
  const time = hideDate && tx.source !== "recurring" ? timeOf(tx.occurredAt) : null;
  const sub = [
    hideDate ? null : relativeDay(tx.localDate, today()),
    title !== category?.name ? category?.name : null,
    source,
    time,
  ]
    .filter(Boolean)
    .join(" · ");
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

/** „12:30“ po lokalnom vremenu uređaja. */
function timeOf(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
