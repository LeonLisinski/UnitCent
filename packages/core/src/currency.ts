import type { Cents } from "./money";

/**
 * Valute. Iznosi su u svakoj valuti cijeli brojevi u stotinkama (centi, pare, lipe), kao i u eurima.
 * Zadana valuta (u kojoj se vodi sve: plan, troškovi, pretplate) bira se u Postavkama; strani iznosi
 * (račun u dinarima, Netflix u dolarima) pri unosu se pretvaraju u zadanu valutu po tečaju.
 */
export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: readonly CurrencyInfo[] = [
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "USD", symbol: "$", name: "Američki dolar" },
  { code: "GBP", symbol: "£", name: "Britanska funta" },
  { code: "CHF", symbol: "CHF", name: "Švicarski franak" },
  { code: "RSD", symbol: "din.", name: "Srpski dinar" },
  { code: "BAM", symbol: "KM", name: "Konvertibilna marka" },
  { code: "MKD", symbol: "den.", name: "Makedonski denar" },
  { code: "HUF", symbol: "Ft", name: "Mađarska forinta" },
  { code: "CZK", symbol: "Kč", name: "Češka kruna" },
  { code: "PLN", symbol: "zł", name: "Poljski zlot" },
  { code: "RON", symbol: "lei", name: "Rumunjski lej" },
  { code: "BGN", symbol: "лв", name: "Bugarski lev" },
  { code: "SEK", symbol: "kr", name: "Švedska kruna" },
  { code: "NOK", symbol: "kr", name: "Norveška kruna" },
  { code: "DKK", symbol: "kr", name: "Danska kruna" },
  { code: "TRY", symbol: "₺", name: "Turska lira" },
  { code: "CAD", symbol: "C$", name: "Kanadski dolar" },
  { code: "AUD", symbol: "A$", name: "Australski dolar" },
  { code: "JPY", symbol: "¥", name: "Japanski jen" },
];

/**
 * Tečajevi: koliko jedinica valute vrijedi 1 €. Rezerva kad aplikacija još nije dohvatila svježe tečajeve
 * (bez interneta pri prvom pokretanju). Približno, listopad 2026; aplikacija ih osvježava jednom dnevno.
 */
export const FALLBACK_RATES: Readonly<Record<string, number>> = {
  EUR: 1, USD: 1.16, GBP: 0.87, CHF: 0.93, RSD: 117.2, BAM: 1.95583, MKD: 61.5, HUF: 390, CZK: 24.3, PLN: 4.25,
  RON: 5.08, BGN: 1.95583, SEK: 11.0, NOK: 11.7, DKK: 7.46, TRY: 48.5, CAD: 1.62, AUD: 1.78, JPY: 172,
};

export function currencyInfo(code: string): CurrencyInfo {
  return CURRENCIES.find((c) => c.code === code) ?? { code, symbol: code, name: code };
}

/**
 * Pretvara iznos (u stotinkama) iz jedne valute u drugu. `rates` = jedinica valute za 1 €.
 * Zaokružuje se na najbližu stotinku; nepoznata valuta vraća null (ne pogađamo tečaj).
 */
export function convertCents(cents: Cents, from: string, to: string, rates: Readonly<Record<string, number>>): Cents | null {
  if (from === to) return cents;
  const rf = rates[from];
  const rt = rates[to];
  if (!rf || !rt) return null;
  return Math.round((cents / rf) * rt);
}
