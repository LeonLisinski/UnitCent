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
};

export function Icon({ name, size = 22, stroke = 1.6 }: { name: keyof typeof P | string; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name]} />
    </svg>
  );
}
