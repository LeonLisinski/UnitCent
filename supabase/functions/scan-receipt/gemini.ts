import type { RawScan } from "./validate.ts";

const SCHEMA = {
  type: "object",
  properties: {
    legible: { type: "boolean" },
    merchant: { type: "string", nullable: true },
    date: { type: "string", nullable: true },
    total_cents: { type: "integer", nullable: true },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          raw_name: { type: "string" },
          name: { type: "string" },
          amount_cents: { type: "integer" },
          category_id: { type: "string", nullable: true },
          line_type: { type: "string", enum: ["item", "discount", "deposit"] },
          confidence: { type: "number" },
        },
        required: ["raw_name", "name", "amount_cents", "category_id", "line_type", "confidence"],
      },
    },
  },
  required: ["legible", "merchant", "date", "total_cents", "items"],
};

function prompt(categories: { id: string; name: string }[]): string {
  const list = categories.map((c) => `- ${c.id}: ${c.name}`).join("\n");
  return `Ti čitaš hrvatski fiskalni račun sa slike i vraćaš JSON prema zadanoj shemi.

Pravila:
- Sve iznose vrati kao cijele brojeve u CENTIMA (12,99 € = 1299). Nikad decimale.
- "items": svaki redak kupnje. "raw_name" je točno kako je ispisano na računu; "name" je čitljiv naziv na hrvatskom (razvij kratice, ispravi velika/mala slova, npr. "MLIJEKO UHT 2.8% 1L" → "Mlijeko UHT 2,8 % 1 L").
- "amount_cents" je ukupni iznos retka (količina × cijena), ne jedinična cijena.
- Popusti, akcije, loyalty umanjenja i kuponi su ZASEBNI retci s line_type "discount" i NEGATIVNIM iznosom. Povratna naknada za ambalažu je line_type "deposit" (pozitivan iznos). Sve ostalo je "item".
- "total_cents" je konačni ukupni iznos za platiti ("UKUPNO"), a ne međuzbroj ni PDV.
- Ne izmišljaj retke i ne zbrajaj retke koji su na računu odvojeni. PDV, poreze, način plaćanja i podatke o trgovini NE vraćaj kao stavke.
- "merchant": naziv trgovine; "date": datum računa kao YYYY-MM-DD (ako ga nema ili je nečitljiv, null).
- "category_id": odaberi ISKLJUČIVO jedan od ID-eva dolje; ako nijedan ne odgovara ili nisi siguran, null. Popusti i naknade dobivaju kategoriju stavke na koju se odnose ako je jasno, inače null.
- "confidence" (0 do 1) je tvoja sigurnost da je redak ispravno pročitan i razvrstan.
- Ako slika nije račun ili je potpuno nečitljiva: legible=false i prazan "items".

Kategorije:
${list}`;
}

export async function scanWithGemini(args: {
  apiKey: string;
  model: string;
  imageBase64: string;
  mime: string;
  categories: { id: string; name: string }[];
}): Promise<RawScan> {
  if (!args.apiKey) throw new Error("GEMINI_API_KEY nije postavljen");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${args.model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": args.apiKey },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt(args.categories) }, { inline_data: { mime_type: args.mime, data: args.imageBase64 } }] }],
      generationConfig: { temperature: 0, responseMimeType: "application/json", responseSchema: SCHEMA },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) {
    const t = await res.text();
    const status = t.match(/"status"\s*:\s*"([A-Z_]+)"/)?.[1] ?? "";
    throw new Error(`gemini ${res.status} ${status}: ${t.slice(0, 300)}`);
  }
  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("");
  if (!text) throw new Error("gemini: prazan odgovor");
  // Neki modeli ipak omotaju JSON u ```; skidamo ograde.
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(cleaned) as RawScan;
}
