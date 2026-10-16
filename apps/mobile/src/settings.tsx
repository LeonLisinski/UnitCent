import { Children, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { Glass } from "./fx";
import { Icon } from "./icons";
import { useTheme } from "./theme";
import { T } from "./ui";

/** Skupina povezanih redaka: mala oznaka iznad, staklena površina s tankim crtama između redaka. */
export function Group({ title, children, footer }: { title?: string; children: ReactNode; footer?: string }) {
  const { fx, space } = useTheme();
  const rows = Children.toArray(children).filter(Boolean);
  return (
    <View style={{ gap: space["2"] }}>
      {title ? <T v="mono-label" muted style={{ marginLeft: 6 }}>{title}</T> : null}
      <Glass radius={22} style={{ overflow: "hidden" }}>
        {rows.map((r, i) => (
          <View key={i} style={{ borderTopWidth: i === 0 ? 0 : 1, borderTopColor: fx.line }}>
            {r}
          </View>
        ))}
      </Glass>
      {footer ? <T v="caption" muted style={{ marginLeft: 6 }}>{footer}</T> : null}
    </View>
  );
}

/**
 * Redak postavki: ikona (ili vlastiti element) lijevo, naslov i podnaslov, vrijednost ili element desno.
 * S `onPress` je dodirljiv i prikazuje strelicu; `danger` boji naslov crveno.
 */
export function Row({
  icon,
  left,
  title,
  subtitle,
  value,
  right,
  onPress,
  danger,
  external,
  gold,
}: {
  icon?: string;
  left?: ReactNode;
  title: string;
  subtitle?: string;
  value?: string;
  right?: ReactNode;
  onPress?: () => void;
  danger?: boolean;
  external?: boolean;
  /** Premium redak: zlatna ikona. */
  gold?: boolean;
}) {
  const { colors, fx } = useTheme();
  const tone = danger ? colors.danger : colors.ink;
  const body = (
    <View style={{ minHeight: 60, flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 10 }}>
      {left ?? (
        <View style={{ width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: fx.track }}>
          <Icon name={icon ?? "dots"} size={19} color={danger ? colors.danger : gold ? fx.gold : colors.brand} />
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <T v="headline" color={tone} numberOfLines={1} style={{ fontWeight: "700" }}>{title}</T>
        {subtitle ? <T v="caption" muted numberOfLines={2}>{subtitle}</T> : null}
      </View>
      {value ? <T v="caption" muted numberOfLines={1} style={{ maxWidth: 150 }}>{value}</T> : null}
      {right}
      {onPress && !right ? <Icon name={external ? "external" : "chev"} size={external ? 17 : 18} color={colors["ink-muted"]} /> : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1, backgroundColor: pressed ? fx.track : "transparent" })}>
      {body}
    </Pressable>
  );
}
