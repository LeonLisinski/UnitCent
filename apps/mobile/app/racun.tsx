import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { formatEur } from "@unitcent/core";
import { CatIcon } from "../src/components";
import { useDb } from "../src/data";
import { Amount } from "../src/fx";
import { Icon } from "../src/icons";
import { ListRow, ModalScreen, RowAmount } from "../src/layout";
import { useTheme } from "../src/theme";
import { T } from "../src/ui";
import { getReceipt, listCategories } from "../src/db/repo";

/** Stavke jednog pročitanog računa (samo za pregled): trgovina, ukupno i svaka stavka s kategorijom. */
export default function Racun() {
  const { colors, fx } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const receipt = useDb(() => (id ? getReceipt(id) : null), [id]);
  const cats = useDb(() => listCategories());
  const catById = new Map(cats.map((c) => [c.id, c]));

  return (
    <ModalScreen title="Račun" onClose={() => router.back()}>
      {receipt ? (
        <>
          <View style={{ alignItems: "center", gap: 4 }}>
            <T v="mono-label" muted numberOfLines={1}>{receipt.merchant ?? "Račun"}</T>
            <Amount cents={receipt.totalCents} base={44} maxWidth={300} />
          </View>
          <View>
            {receipt.items.map((it, i) => {
              const c = it.categoryId ? catById.get(it.categoryId) : undefined;
              return (
                <ListRow
                  key={it.id}
                  first={i === 0}
                  left={c ? <CatIcon colorToken={c.colorToken} icon={c.icon} size={40} /> : <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderStyle: "dashed", borderColor: fx.glassBorder, alignItems: "center", justifyContent: "center" }}><Icon name="dots" size={16} color={colors["ink-muted"]} /></View>}
                  title={it.name}
                  subtitle={`${it.lineType === "discount" ? "Popust · " : it.lineType === "deposit" ? "Povratna naknada · " : ""}${c?.name ?? "Bez kategorije"}`}
                  right={<RowAmount color={it.amountCents < 0 ? colors.brand : undefined}>{formatEur(it.amountCents)}</RowAmount>}
                />
              );
            })}
          </View>
        </>
      ) : (
        <T muted style={{ textAlign: "center" }}>Račun nije pronađen.</T>
      )}
    </ModalScreen>
  );
}
