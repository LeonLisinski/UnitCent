import Svg, { Path } from "react-native-svg";

/** Isti skup ikona kao na webu (24 × 24, linijske). */
const P: Record<string, string> = {
  plus: "M12 5v14 M5 12h14",
  camera: "M4 8h3l2-3h6l2 3h3v11H4z M12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
  chart: "M4 20h16 M7 20v-7 M12 20V6 M17 20v-10",
  repeat: "M17 3l3 3-3 3 M20 6H8a4 4 0 0 0-4 4 M7 21l-3-3 3-3 M4 18h12a4 4 0 0 0 4-4",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z M10 20.5h4",
  check: "M5 12.5l4.5 4.5L19 7",
  cart: "M3 4h2l2.4 11h10.2L20 8H6.2 M9 20a.6.6 0 1 0 0-.01 M17 20a.6.6 0 1 0 0-.01",
  car: "M5 16h14v-4l-2-5H7l-2 5z M7 19v-3 M17 19v-3 M8 12.5h.01 M16 12.5h.01",
  smoke: "M3 14h13v3H3z M18.5 14v3 M21 14v3 M17 4c0 2-2 2-2 4s2 2 2 4",
  arrow: "M5 12h14 M13 6l6 6-6 6",
  wifi: "M3 9a14 14 0 0 1 18 0 M6 12.5a9.5 9.5 0 0 1 12 0 M9 16a5 5 0 0 1 6 0 M12 19.5h.01",
  card: "M3 6h18v12H3z M3 10h18 M7 15h3",
  music: "M9 18V6l10-2v12 M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z M19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z",
  bolt: "M13 3 5 13h6l-1 8 8-10h-6z",
  play: "M7 4.5l12 7.5-12 7.5z",
  dumbbell: "M2 9v6 M5 7v10 M19 7v10 M22 9v6 M5 12h14",
  phone: "M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M11 18h2",
  cloud: "M7 18a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17.2 9.5 3.5 3.5 0 0 1 17 18z",
  shield: "M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z",
  drop: "M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z",
  x: "M6 6l12 12 M18 6 6 18",
  cup: "M5 8h12v5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z M17 9h1.5a2.5 2.5 0 0 1 0 5H17 M8 3v2 M12 3v2",
  fuel: "M5 20V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v15 M4 20h11 M14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-3-3 M7 8h5",
  house: "M4 11 12 4l8 7 M6 9.5V20h12V9.5",
  home: "M4 10.5 12 4l8 6.5V20h-5v-5h-6v5H4z",
  calendar: "M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4.5 20a7.5 7.5 0 0 1 15 0",
  glass: "M7 3h10l-1 7a4 4 0 0 1-8 0z M12 14v6 M8 20h8",
  heart: "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z",
  gift: "M4 11h16v9H4z M3 8h18v3H3z M12 8v12 M12 8C10 4 6.5 5 7.5 8 M12 8c2-4 5.5-3 4.5 0",
  dots: "M6 12h.01 M12 12h.01 M18 12h.01",
  trash: "M5 7h14 M10 7V4h4v3 M7 7l1 13h8l1-13",
  back: "M15 6l-6 6 6 6",
  chev: "M9 6l6 6-6 6",
};

export function Icon({
  name,
  size = 22,
  color = "#ffffff",
  stroke = 1.7,
}: {
  name: string;
  size?: number;
  color?: string;
  stroke?: number;
}) {
  const d = P[name] ?? P["dots"]!;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden importantForAccessibility="no">
      <Path
        d={d}
        stroke={color}
        strokeWidth={name === "dots" ? 3 : stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
