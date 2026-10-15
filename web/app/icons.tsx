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
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M12 12h.01",
  file: "M6 3h8l4 4v14H6z M14 3v4h4 M9 13h6 M9 17h6",
  tag: "M3 12V4h8l9 9-8 8z M7.5 8h.01",
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
  minus: "M6 12h12",
  arrowUp: "M12 19V5 M6 11l6-6 6 6",
  sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M12 2.5v2 M12 19.5v2 M2.5 12h2 M19.5 12h2 M5.3 5.3l1.4 1.4 M17.3 17.3l1.4 1.4 M5.3 18.7l1.4-1.4 M17.3 6.7l1.4-1.4",
  moon: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
};

export function Icon({ name, size = 22, stroke = 1.6 }: { name: keyof typeof P | string; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name]} />
    </svg>
  );
}
