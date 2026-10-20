import { usePremium } from "./premium";
import { useTheme } from "./theme";

/**
 * Boja AI funkcija. Bez Premiuma: zlatno-ljubičasti prijelaz (AI je dio Premiuma, zlatni dio to nagovješćuje).
 * S Premiumom zlatno nestaje i ostaje čista ljubičasta.
 */
export function useAiGradient(): { colors: [string, string, ...string[]]; locations?: [number, number, ...number[]] } {
  const { fx } = useTheme();
  const premium = usePremium();
  return premium
    ? { colors: [fx.aiHi, fx.aiLo] }
    : { colors: [fx.aiGold, fx.aiHi, fx.aiLo], locations: [0, 0.45, 1] };
}
