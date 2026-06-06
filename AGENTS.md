<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Al Noor — Design System

## Typography

**Two distinct zones — deliberately different fonts for different purposes.**

Our customers come primarily from Flipkart. On product/commerce pages we match that familiar, fast UX. On the homepage we make a luxury brand impression.

### Zone 1 — Homepage (`/`) — Luxury Editorial

| Font | Use |
|---|---|
| **Bodoni Moda** | Hero headline (large italic, `clamp(3rem, 12vw, 8rem)`, weight 700), section headings |
| **Amiri** | Arabic brand name "النور" in the hero — signals the brand's dual heritage |
| **EB Garamond** | Subheadings, intro paragraph copy |
| **Raleway** | Nav, CTAs, fine print |

Goal: Maximum drama and luxury impression on first visit.

### Zone 2 — All Product & Commerce Pages — Flipkart-style Clarity

Pages: `/products`, `/product/[id]`, `/cart`, `/checkout`, `/order-confirmation`, `/track-order`, `/account`, `/login`, `/orders`, `/profile`

| Font | Use |
|---|---|
| **Inter** | PRIMARY — all body text, product names, descriptions, prices, spec tables, form fields, card text |
| **Bodoni Moda italic** | ACCENT ONLY — page H1 headings (e.g. "My Cart", "Order Confirmed!", "Track Your Order") and product name on PDP at large size |
| **Raleway** | Buttons, nav badges, labels, status pills — retains brand UI identity |

**No EB Garamond on commerce pages** — too literary, slows scanning.

**Why Inter?** Inter was designed for screen readability at 12–16px — the exact size range used in product cards, prices, spec rows, and form fields. Flipkart, Meesho, and Amazon India all use a neutral grotesque (Roboto/Inter) for this reason. Raleway is beautiful but has unusual letterforms that slow reading at small sizes.

### Zone 3 — Admin / CRM

- **Inter only** — internal tool, no brand expression needed.

### Fonts loaded in `src/app/layout.tsx`

```ts
import { Bodoni_Moda, Inter, Raleway } from 'next/font/google'
// Amiri used only on homepage — add to homepage segment layout if needed
```

EB Garamond is homepage-only and does NOT need to be in the global layout.

---

## Colour Tokens

These are the canonical values. Always use these constants — never hardcode hex values:

```ts
const T = {
  ivory:       '#FAF7F2',   // page background (storefront)
  parchment:   '#F0EBE2',   // section backgrounds, card alternates
  white:       '#FFFFFF',   // card surfaces
  gold:        '#9E7F4A',   // primary brand accent, CTAs, active states
  goldDark:    '#7A5C2E',   // gold hover, strong emphasis
  goldPale:    '#EDD9B8',   // gold tints, label backgrounds
  deep:        '#1A1410',   // primary text
  mid:         '#5C4F3A',   // secondary text
  muted:       '#8C7B65',   // placeholder, helper text
  light:       '#B8A99A',   // disabled, crossed-out
  border:      'rgba(158,127,74,0.18)',
  borderLight: 'rgba(158,127,74,0.10)',
  shadowSm:    '0 1px 4px rgba(26,20,16,0.06)',
  shadowMd:    '0 4px 16px rgba(26,20,16,0.09)',
  green:       '#27864A',   // success, in-stock, paid
  red:         '#C0392B',   // error, out-of-stock, cancelled
  orange:      '#D97706',   // warning, pending
}
```

---

## Design Principles

- **Luxury restraint**: never use more than two font families on a single section
- **Gold is earned**: use `T.gold` only for interactive elements and brand moments — not decorative fills
- **Bodoni Moda italic** is the brand's "signature" — use it for the most emotionally significant moments (hero headline, order confirmed, welcome back)
- **Raleway** carries all commerce UI — consistency here builds trust
- **No gradients on the storefront** — flat surfaces with subtle shadow only
- Indian price formatting: always `₹` + `.toLocaleString('en-IN')` via `formatPrice()` in `src/lib/products-data.ts`
