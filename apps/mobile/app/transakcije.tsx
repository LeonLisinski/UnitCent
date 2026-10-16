import { useMemo, useState } from "react";
import { FlatList, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { formatEur, previousMonth, yearMonthOf, type YearMonth } from "@unitcent/core";
import { Chip } from "../src/components";
import { useDb } from "../src/data";
import { Glow, RoundButton, SwipeRow } from "../src/fx";
import { monthTitle, nextMonthOf, relativeDay } from "../src/format";
import { Icon } from "../src/icons";
import { MonthSwitcher, PAD, PageHeader } from "../src/layout";
import { Safe } from "../src/safe";
import { textStyle, useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { TxRow } from "../src/TxRow";
import { T } from "../src/ui";
import { deleteTransaction, earliestTxMonth, listCategories, restoreTransaction, searchTransactions, today, type Transaction } from "../src/db/repo";

type Item = { kind: "head"; date: string; total: number } | { kind: "tx"; tx: Transaction; first: boolean };

/**
 * Svi troškovi: po mjesecima, uz pretragu (po cijeloj povijesti), filter kategorije, brisanje povlačenjem i uređivanje dodirom.
 * Otvara se s Početne („Sve“) i iz Pregleda (dodir na kategoriju ili „Svi troškovi“).
 */
export default function Transakcije() {
  const { colors, fx } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ month?: string; categoryId?: string }>();
  const thisMonth = yearMonthOf(today());
  const [month, setMonth] = useState<YearMonth>(params.month ?? thisMonth);
  const [categoryId, setCategoryId] = useState<string | "none" | null>(params.categoryId ?? null);
  const [query, setQuery] = useState("");

  const first = useDb(() => earliestTxMonth());
  const earliest = first && first < thisMonth ? first : thisMonth;
  const cats = useDb(() => listCategories());
  const catById = new Map(cats.map((c) => [c.id, c]));
  const searching = query.trim().length > 0;
  const txs = useDb(() => searchTransactions({ month: searching ? null : month, categoryId, query }), [month, categoryId, query]);

  const { items, total } = useMemo(() => {
    const out: Item[] = [];
    let sum = 0;
    let lastDate = "";
    let headIdx = -1;
    for (const tx of txs) {
      if (tx.localDate !== lastDate) {
        lastDate = tx.localDate;
        headIdx = out.length;
        out.push({ kind: "head", date: tx.localDate, total: 0 });
      }
      const head = out[headIdx] as Extract<Item, { kind: "head" }>;
      if (tx.type === "expense") {
        head.total += tx.amountCents;
        sum += tx.amountCents;
      }
      out.push({ kind: "tx", tx, first: out[out.length - 1]?.kind === "head" });
    }
    return { items: out, total: sum };
  }, [txs]);

  const day = today();
  const header = (
    <View style={{ gap: 12, paddingBottom: 8 }}>
      {searching ? null : (
        <MonthSwitcher month={month} onChange={setMonth} min={earliest} max={thisMonth} />
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          minHeight: 48,
          paddingHorizontal: 14,
          borderRadius: 999,
          backgroundColor: fx.glass,
          borderWidth: 1,
          borderColor: fx.glassBorder,
        }}
      >
        <Icon name="search" size={18} color={colors["ink-muted"]} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Traži po bilješci, kategoriji ili iznosu"
          placeholderTextColor={colors["ink-muted"]}
          accessibilityLabel="Pretraga troškova"
          returnKeyType="search"
          style={[textStyle("body"), { flex: 1, color: colors.ink, paddingVertical: 10 }]}
        />
        {searching ? (
          <RoundButton icon="x" label="Očisti pretragu" onPress={() => setQuery("")} />
        ) : null}
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ id: "all", name: "Sve" }, ...cats.map((c) => ({ id: c.id, name: c.name })), { id: "none", name: "Bez kategorije" }]}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ gap: 8 }}
        style={{ marginHorizontal: -PAD, paddingHorizontal: PAD, flexGrow: 0 }}
        renderItem={({ item: c }) => (
          <Chip label={c.name} selected={c.id === "all" ? categoryId === null : categoryId === c.id} onPress={() => setCategoryId(c.id === "all" ? null : c.id)} />
        )}
      />

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <T v="caption" muted>
          {searching ? "Rezultati (cijela povijest)" : "Troškovi"} · {txs.length}
          {txs.length >= 300 ? "+" : ""}
        </T>
        <T v="caption" muted>{formatEur(total)}</T>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Glow />
      <Safe>
        <View style={{ paddingHorizontal: PAD, paddingTop: 8 }}>
          <PageHeader right={<RoundButton icon="x" label="Zatvori" onPress={() => router.back()} />}>
            <T v="title-1" style={{ fontSize: 26, lineHeight: 32 }}>Troškovi</T>
          </PageHeader>
        </View>
        <FlatList
          data={items}
          keyExtractor={(it, i) => (it.kind === "head" ? `h-${it.date}` : it.tx.id) + i}
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingHorizontal: PAD, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListEmptyComponent={<T muted style={{ paddingTop: 24, textAlign: "center" }}>{searching ? "Nema rezultata." : "Nema troškova u ovom mjesecu."}</T>}
          renderItem={({ item }) =>
            item.kind === "head" ? (
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16 }}>
                <T v="caption" muted style={{ fontWeight: "600" }}>{relativeDay(item.date, day)}</T>
                {item.total > 0 ? <T v="caption" muted>{formatEur(item.total)}</T> : null}
              </View>
            ) : (
              <SwipeRow
                onDelete={() => {
                  deleteTransaction(item.tx.id);
                  toast.show("Obrisano", { label: "Poništi", run: () => restoreTransaction(item.tx.id) });
                }}
              >
                <View>
                  <TxRow
                    tx={item.tx}
                    first={item.first}
                    category={item.tx.categoryId ? catById.get(item.tx.categoryId) : undefined}
                    hideDate
                    onPress={() => router.push({ pathname: "/dodaj", params: { id: item.tx.id } } as Href)}
                  />
                </View>
              </SwipeRow>
            )
          }
        />
      </Safe>
    </View>
  );
}
