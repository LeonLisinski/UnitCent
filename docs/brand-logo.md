# UnitCent logotip: prsten dnevnog limita

## Boje
- Znak na svijetloj pozadini: `#0e7a5f` (brand)
- Znak na tamnoj pozadini: `#3dd6a3` (brand, tamna tema)
- Ikona aplikacije: limeta `#c8f169` na `#0e7a5f`
- Natpis: Manrope 800, pretvoren u krivulje (font ne treba biti instaliran)

## Datoteke
- `svg/znak-*.svg`: sam znak. Crna i bijela verzija su bez blijedog prstena, za tisak i jednobojnu upotrebu.
- `svg/logotip-*.svg`: znak + natpis UnitCent, vodoravno.
- `svg/ikona-aplikacije.svg` i `png/ikona-aplikacije-1024.png`: kvadratna ikona bez zaobljenih kutova. iOS i Android ih zaobljuju sami.
- `favicon/`: sve za web stranicu.

## Favicon za Next.js
Datoteke iz `favicon/` stavi u `public/`, a u `<head>` (ili `metadata.icons`):

```html
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

`favicon.svg` sam mijenja boju kad je preglednik u tamnoj temi. `icon-192.png`, `icon-512.png` i `icon-512-maskable.png` idu u web manifest.

## Pravila
- Najmanja veličina znaka: 16 px.
- Oko znaka ostavi prazan prostor barem pola njegove širine.
- Ne dodaji gradijente, sjene ni obrube.
