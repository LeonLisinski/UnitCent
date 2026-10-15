import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { SITE_NAME, SITE_URL } from "./site";

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
  display: "swap",
});

const title = "UnitCent: praćenje troškova koje stvarno koristiš";
const description =
  "Hrvatska aplikacija za praćenje troškova. Unos za 3 sekunde, pretplate se knjiže same, AI skenira račune i razvrstava stavke. Svaki dan znaš koliko još smiješ potrošiti.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: title, template: "%s | UnitCent" },
  description,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "hr_HR",
    siteName: SITE_NAME,
    url: "/",
    title,
    description,
  },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1211" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hr" className={manrope.variable}>
      <body>{children}</body>
    </html>
  );
}
