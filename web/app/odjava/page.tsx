import type { Metadata } from "next";
import Link from "next/link";
import { Unsubscribe } from "./Unsubscribe";

export const metadata: Metadata = {
  title: "Odjava od e-mailova",
  robots: { index: false, follow: false },
};

export default async function Odjava({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  return (
    <main className="wrap legal prose">
      <p><Link href="/" className="muted">← UnitCent</Link></p>
      <h1>E-mailovi</h1>
      <Unsubscribe token={t ?? ""} />
    </main>
  );
}
