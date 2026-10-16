import { View } from "react-native";
import { daysInMonth, occurrenceDate, parseYearMonth, toLocalDate, type LocalDate, type YearMonth } from "@unitcent/core";
import { CatIcon } from "./components";
import { firstWeekdayMondayIndex } from "./format";
import { useTheme } from "./theme";
import { T } from "./ui";
import type { Category, RecurringRecord } from "./db/repo";

const WD = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];

/**
 * Mini kalendar naplata: puni tjedni (pon–ned), dani iz drugih mjeseci jedva vidljivi,
 * današnji dan istaknut, naplate kao ikone u boji kategorije.
 */
export function Calendar({
  month,
  items,
  categories,
  todayDate,
}: {
  month: YearMonth;
  items: readonly RecurringRecord[];
  categories: readonly Category[];
  todayDate: LocalDate;
}) {
  const { colors } = useTheme();
  const { y, m } = parseYearMonth(month);
  const lead = firstWeekdayMondayIndex(y, m);
  const dim = daysInMonth(y, m);
  const prevDim = daysInMonth(m === 1 ? y - 1 : y, m === 1 ? 12 : m - 1);
  const catById = new Map(categories.map((c) => [c.id, c]));

  const byDate = new Map<LocalDate, RecurringRecord[]>();
  for (const it of items) {
    const d = occurrenceDate(it, month);
    if (d) byDate.set(d, [...(byDate.get(d) ?? []), it]);
  }

  type Cell = { label: number; out: boolean; date?: LocalDate };
  const cells: Cell[] = [];
  for (let i = lead - 1; i >= 0; i--) cells.push({ label: prevDim - i, out: true });
  for (let d = 1; d <= dim; d++) cells.push({ label: d, out: false, date: toLocalDate(y, m, d) });
  let n = 1;
  while (cells.length % 7 !== 0) cells.push({ label: n++, out: true });

  const rows: Cell[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <View accessibilityLabel="Kalendar naplata" style={{ gap: 2 }}>
      <View style={{ flexDirection: "row" }}>
        {WD.map((w) => (
          <View key={w} style={{ flex: 1, alignItems: "center", paddingBottom: 6 }}>
            <T v="mono-label" muted style={{ fontSize: 10 }}>{w}</T>
          </View>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: "row" }}>
          {row.map((c, ci) => {
            const subs = c.date ? byDate.get(c.date) ?? [] : [];
            const isToday = c.date === todayDate;
            const past = !!c.date && c.date < todayDate;
            return (
              <View key={ci} style={{ flex: 1, alignItems: "center", minHeight: 62, paddingTop: 2, gap: 4 }}>
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isToday ? colors.brand : "transparent",
                  }}
                >
                  <T
                    v="caption"
                    color={isToday ? colors["on-brand"] : c.out ? colors["ink-muted"] : colors.ink}
                    style={{ opacity: c.out ? 0.22 : past ? 0.5 : 1, fontWeight: subs.length || isToday ? "800" : "500" }}
                  >
                    {c.label}
                  </T>
                </View>
                {subs.slice(0, 2).map((s) => {
                  const cat = catById.get(s.categoryId ?? "");
                  return (
                    <View key={s.id} style={{ opacity: past ? 0.55 : 1 }}>
                      <CatIcon colorToken={cat?.colorToken ?? "cat-pretplate"} icon={s.iconKey ?? cat?.icon ?? "repeat"} size={26} />
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
