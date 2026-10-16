import { Platform, Pressable, View } from "react-native";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { toLocalDate, type LocalDate } from "@unitcent/core";
import { fullDate } from "./format";
import { Icon } from "./icons";
import { today } from "./db/repo";
import { useTheme } from "./theme";
import { T } from "./ui";

function parse(d: LocalDate): Date {
  const [y, m, day] = d.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, day, 12);
}

/**
 * Datum s uređivanjem: kompaktan izbornik (iOS) ili dijalog (Android). Ispod pokazuje što datum znači za limit:
 * u budućnosti, iz drugog mjeseca (ne ulazi u dnevni limit) ili običan dan ovog mjeseca. „Danas“ vraća na današnji dan.
 */
export function DateField({
  label,
  value,
  onChange,
  plain,
}: {
  label: string;
  value: LocalDate;
  onChange: (d: LocalDate) => void;
  /** Bez objašnjenja o dnevnom limitu (za datume koji nisu datum troška). */
  plain?: boolean;
}) {
  const { colors, fx, scheme } = useTheme();
  const now = today();
  const set = (d: Date) => onChange(toLocalDate(d.getFullYear(), d.getMonth() + 1, d.getDate()));

  const future = value > now;
  const otherMonth = value.slice(0, 7) !== now.slice(0, 7);
  const note = plain
    ? null
    : future
    ? "Datum je u budućnosti. Provjeri je li ispravan."
    : otherMonth
      ? "Iz drugog mjeseca: ne ulazi u današnji limit."
      : value !== now
        ? "Ulazi u potrošnju tog dana, a ne današnjeg."
        : null;
  const warn = future || otherMonth;

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 48 }}>
        <Icon name="calendar" size={20} color={colors["ink-muted"]} />
        <T v="headline" style={{ flex: 1 }}>{label}</T>
        {Platform.OS === "ios" ? (
          <DateTimePicker
            value={parse(value)}
            mode="date"
            display="compact"
            themeVariant={scheme}
            accentColor={colors.brand}
            onChange={(_, d) => d && set(d)}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${fullDate(value)}. Promijeni`}
            onPress={() => DateTimePickerAndroid.open({ value: parse(value), mode: "date", onChange: (_, d) => d && set(d) })}
            style={{ paddingHorizontal: 14, minHeight: 40, borderRadius: 999, justifyContent: "center", backgroundColor: fx.track }}
          >
            <T v="headline" style={{ fontSize: 15 }}>{fullDate(value)}</T>
          </Pressable>
        )}
      </View>
      {note ? (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <T v="caption" color={warn ? colors.warning : undefined} muted={!warn} style={{ flex: 1 }}>{note}</T>
          {value !== now ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                void Haptics.selectionAsync();
                onChange(now);
              }}
            >
              <T v="caption" color={colors.brand} style={{ fontWeight: "800" }}>Danas</T>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
