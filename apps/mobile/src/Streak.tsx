import { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { addDays, longestStreak, nextMilestone, pluralHr, streakNudge, type LocalDate } from "@unitcent/core";
import { Button } from "./components";
import { markNoSpendDay } from "./db/repo";
import { Icon } from "./icons";
import { Sheet } from "./Sheet";
import { useTheme } from "./theme";
import { T } from "./ui";

const WEEKDAY = ["N", "P", "U", "S", "Č", "P", "S"]; // nedjelja = 0

/**
 * Niz dana s unosom: pilula s plamenom gore desno na Početnoj (limeta kad je danas upisano, siva dok nije) i list
 * s tjednom, najdužim nizom i sljedećim ciljem. Ton je miran (kontinuitet i pregled nad novcem, ne motivacijski
 * trener): nikad „izgubio si niz“ ni pohvale. Dan bez potrošnje se može označiti, pa ne prekida niz.
 */
export function StreakPill({ streak, enteredToday, dates, day }: { streak: number; enteredToday: boolean; dates: LocalDate[]; day: LocalDate }) {
  const { colors, fx } = useTheme();
  const [open, setOpen] = useState(false);
  const lit = enteredToday && streak > 0;
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Niz: ${streak} ${pluralHr(streak, "dan", "dana", "dana")} zaredom${enteredToday ? ", danas upisano" : ", danas još nije upisano"}`}
        hitSlop={6}
        onPress={() => {
          void Haptics.selectionAsync();
          setOpen(true);
        }}
        style={({ pressed }) => ({
          minHeight: 44,
          paddingHorizontal: 12,
          borderRadius: 22,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          backgroundColor: lit ? fx.accent2 : fx.track,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        })}
      >
        <Icon name="flame" size={18} color={lit ? colors["on-accent"] : colors["ink-muted"]} stroke={2.2} />
        <T v="headline" color={lit ? colors["on-accent"] : colors.ink} style={{ fontWeight: "800", fontVariant: ["tabular-nums"] }}>{streak}</T>
      </Pressable>
      <StreakSheet visible={open} onClose={() => setOpen(false)} streak={streak} enteredToday={enteredToday} dates={dates} day={day} />
    </>
  );
}

function StreakSheet({ visible, onClose, streak, enteredToday, dates, day }: { visible: boolean; onClose: () => void; streak: number; enteredToday: boolean; dates: LocalDate[]; day: LocalDate }) {
  const { colors, fx } = useTheme();
  const router = useRouter();
  const set = new Set(dates);
  const best = Math.max(longestStreak(dates), streak);
  const goal = nextMilestone(streak);
  const toGo = goal - streak;
  const week = Array.from({ length: 7 }, (_, i) => addDays(day, i - 6));

  return (
    <Sheet visible={visible} onClose={onClose} title="Niz">
      <View style={{ alignItems: "center", gap: 4, paddingTop: 4 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", backgroundColor: enteredToday && streak > 0 ? fx.accent2 : fx.track }}>
          <Icon name="flame" size={32} color={enteredToday && streak > 0 ? colors["on-accent"] : colors["ink-muted"]} stroke={2.1} />
        </View>
        <T v="amount-hero" style={{ fontVariant: ["tabular-nums"] }}>{streak}</T>
        <T v="body" muted>{pluralHr(streak, "dan", "dana", "dana")} zaredom</T>
        <T v="headline" style={{ textAlign: "center", marginTop: 8 }}>{streakNudge(streak, enteredToday)}</T>
      </View>

      {/* Zadnjih 7 dana: puna točka = upisano, prsten = danas još nije */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 }} accessibilityLabel="Zadnjih 7 dana">
        {week.map((d) => {
          const done = set.has(d);
          const isToday = d === day;
          return (
            <View key={d} style={{ alignItems: "center", gap: 6 }}>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: done ? colors.brand : "transparent",
                  borderWidth: done ? 0 : 2,
                  borderColor: isToday ? fx.accent2 : fx.track,
                }}
              >
                {done ? <Icon name="check" size={16} color={colors["on-brand"]} stroke={2.6} /> : null}
              </View>
              <T v="caption" muted={!isToday} style={{ fontWeight: isToday ? "800" : "500" }}>{WEEKDAY[new Date(`${d}T12:00:00Z`).getUTCDay()]}</T>
            </View>
          );
        })}
      </View>

      {/* Sljedeći cilj i najduži niz */}
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <T v="caption" muted>Još {toGo} {pluralHr(toGo, "dan", "dana", "dana")} do {goal}</T>
          <T v="caption" muted>Najduži: {best}</T>
        </View>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: fx.track, overflow: "hidden" }}>
          <View style={{ width: `${Math.min(100, (streak / goal) * 100)}%`, height: "100%", borderRadius: 4, backgroundColor: fx.accent2 }} />
        </View>
      </View>

      {enteredToday ? null : (
        <View style={{ alignItems: "center", gap: 4 }}>
          <Button
            icon="plus"
            label="Dodaj trošak"
            onPress={() => {
              onClose();
              router.push("/dodaj");
            }}
          />
          <Button
            variant="text"
            size="sm"
            label="Danas bez troška"
            onPress={() => {
              markNoSpendDay(day);
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
          />
        </View>
      )}
    </Sheet>
  );
}
