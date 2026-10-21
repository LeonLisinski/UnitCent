import { Pressable, View } from "react-native";
import { daysInMonth, occurrenceDate, parseYearMonth, toLocalDate, type LocalDate, type YearMonth } from "@unitcent/core";
import { recurringIcon } from "./BrandIcon";
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
  onDayPress,
}: {
  month: YearMonth;
  items: readonly RecurringRecord[];
  categories: readonly Category[];
  todayDate: LocalDate;
  /** Dodir na dan mjeseca (npr. otvara list s pretplatama tog dana). */
  onDayPress?: (date: LocalDate) => void;
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
              <Pressable
                key={ci}
                disabled={!c.date || !onDayPress}
                accessibilityRole={c.date && onDayPress ? "button" : undefined}
                accessibilityLabel={c.date ? `${c.label}.${subs.length ? `, ${subs.map((s) => s.name).join(", ")}` : ""}` : undefined}
                onPress={() => c.date && onDayPress?.(c.date)}
                style={({ pressed }) => ({ flex: 1, alignItems: "center", minHeight: 48, paddingTop: 2, gap: 2, paddingBottom: 2, opacity: pressed ? 0.5 : 1 })}
              >
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
                {subs.length > 0 ? (
                  // Više naplata istog dana: ikone jedna pored druge, malo preklopljene (do 3; inače 2 i „+n“).
                  <View style={{ flexDirection: "row", alignItems: "center", opacity: past ? 0.55 : 1 }}>
                    {subs.slice(0, subs.length > 3 ? 2 : 3).map((s, si) => {
                      const cat = catById.get(s.categoryId ?? "");
                      return (
                        <View key={s.id} style={{ marginLeft: si === 0 ? 0 : -7, borderRadius: 12, borderWidth: 1.5, borderColor: colors.bg, backgroundColor: colors.bg }}>
                          <CatIcon colorToken={cat?.colorToken ?? "cat-pretplate"} icon={recurringIcon(s, cat?.icon)} size={19} />
                        </View>
                      );
                    })}
                    {subs.length > 3 ? (
                      <View style={{ marginLeft: -7, width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.bg, backgroundColor: colors["surface-2"], alignItems: "center", justifyContent: "center" }}>
                        <T v="caption" style={{ fontSize: 9, fontWeight: "800" }}>+{subs.length - 2}</T>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
