import { useEffect } from "react";
import { Platform } from "react-native";
import { useRouter, type Href } from "expo-router";

type QA = typeof import("expo-quick-actions");

/** Nativni modul postoji tek u novom buildu: u starom buildu (ili na webu) brze radnje se tiho preskaču. */
let QuickActions: QA | null = null;
if (Platform.OS !== "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    QuickActions = require("expo-quick-actions") as QA;
  } catch {
    QuickActions = null;
  }
}

const ACTIONS = [
  { id: "scan", title: "Skeniraj račun", icon: Platform.OS === "ios" ? "symbol:camera" : null, params: { href: "/skeniraj" } },
  { id: "add", title: "Dodaj trošak", icon: Platform.OS === "ios" ? "symbol:plus" : null, params: { href: "/dodaj" } },
];

/**
 * Brze radnje na ikoni aplikacije (dugi dodir na ikonu): „Skeniraj račun“ i „Dodaj trošak“.
 * Koristi se u layoutu tabova (nakon onboardinga), jer otvara ekran.
 */
export function useQuickActions(enabled: boolean): void {
  const router = useRouter();
  useEffect(() => {
    const qa = QuickActions;
    if (!qa || !enabled) return; // prije onboardinga nema prečaca
    void qa.setItems(ACTIONS).catch(() => undefined);
    const go = (a: { params?: Record<string, unknown> | null }) => {
      const href = a.params?.href;
      if (typeof href === "string") setTimeout(() => router.push(href as Href), 0);
    };
    if (qa.initial) go(qa.initial);
    const sub = qa.addListener(go);
    return () => sub.remove();
  }, [router, enabled]);
}
