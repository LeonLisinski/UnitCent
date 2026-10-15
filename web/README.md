# UnitCent web

Marketing stranica (Next.js 15, App Router, statički generirana). Dizajn: UnitCent dizajn sustav.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # produkcijski build
```

- Adresa i FAQ: `app/site.ts` (`NEXT_PUBLIC_SITE_URL`, zadano https://unitcent.com, prilagoditi kad se kupi domena).
- SEO: metadata u `app/layout.tsx`, JSON-LD (Organization, WebSite, SoftwareApplication, FAQPage) u `app/page.tsx`, `sitemap`, `robots`, `public/llms.txt`, OG slika.
- Vercel: import mape `web/` kao projekt, framework Next.js, bez dodatnih postavki.
- Tipke App Store / Google Play vode na #preuzmi dok aplikacija nije objavljena.
- Privatnost (`/privatnost`) je nacrt: treba pravnu provjeru prije lansiranja.
