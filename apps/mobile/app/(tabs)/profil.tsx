import { Pressable, View } from "react-native";
import { Screen, T } from "../../src/ui";
import { useTheme, type ThemePreference } from "../../src/theme";

const OPTIONS: { key: ThemePreference; label: string }[] = [
  { key: "system", label: "Sustav" },
  { key: "light", label: "Svijetla" },
  { key: "dark", label: "Tamna" },
];

export default function Profil() {
  const { colors, radius, space, preference, setPreference } = useTheme();
  return (
    <Screen title="Profil">
      <View style={{ gap: space["2"] }}>
        <T v="mono-label" muted>Tema</T>
        <View style={{ flexDirection: "row", backgroundColor: colors["surface-2"], borderRadius: radius.md, padding: 4 }}>
          {OPTIONS.map((o) => {
            const on = preference === o.key;
            return (
              <Pressable
                key={o.key}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => setPreference(o.key)}
                style={{
                  flex: 1,
                  minHeight: 44,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: radius.sm + 2,
                  backgroundColor: on ? colors.surface : "transparent",
                }}
              >
                <T v="headline" muted={!on}>{o.label}</T>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}
