// Generira dist/tokens.css (CSS varijable) i dist/tokens.ts (objekt za React Native) iz src/tokens.json.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const t = JSON.parse(readFileSync(join(root, "src/tokens.json"), "utf8"));
mkdirSync(join(root, "dist"), { recursive: true });

const vars = (obj) => Object.entries(obj).map(([k, v]) => `  --${k}: ${v};`).join("\n");
const css = `/* GENERIRANO iz src/tokens.json. Ne uređivati ručno. */
:root, [data-theme="dark"] {
${vars(t.color.dark)}
${Object.entries(t.space).map(([k, v]) => `  --space-${k}: ${v}px;`).join("\n")}
${Object.entries(t.radius).map(([k, v]) => `  --radius-${k}: ${v}px;`).join("\n")}
  color-scheme: dark;
}
[data-theme="light"] {
${vars(t.color.light)}
  color-scheme: light;
}
`;
writeFileSync(join(root, "dist/tokens.css"), css);

const ts = `// GENERIRANO iz src/tokens.json. Ne uređivati ručno.
export const tokens = ${JSON.stringify(t, null, 2)} as const;
export type ThemeName = "light" | "dark";
export type ColorToken = keyof typeof tokens.color.dark;
export const colors = tokens.color;
`;
writeFileSync(join(root, "dist/tokens.ts"), ts);
console.log("tokens: dist/tokens.css, dist/tokens.ts");
