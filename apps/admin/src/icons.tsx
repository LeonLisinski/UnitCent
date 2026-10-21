import Svg, { Path } from "react-native-svg";

// Iste linijske ikone kao aplikacija (24 × 24, potez 1.8).
const PATHS = {
  home: "M4 11l8-7 8 7v9H4z M10 20v-5h4v5",
  list: "M8 6h12 M8 12h12 M8 18h12 M4 6h.01 M4 12h.01 M4 18h.01",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M2.5 20a6.5 6.5 0 0 1 13 0 M16 4.5a3.5 3.5 0 0 1 0 6.5 M18 14a6 6 0 0 1 3.5 6",
  coins: "M9 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M15.5 9.3A5 5 0 1 1 9.3 15.5",
  mail: "M3.5 6h17v12h-17z M4 6.5l8 6.5 8-6.5",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 24, color }: { name: IconName; size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={PATHS[name]} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
