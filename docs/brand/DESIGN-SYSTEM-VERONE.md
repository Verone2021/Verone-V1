# VÉRONE — Design System

> Concept store parisien de décoration et mobilier d'intérieur premium éditorial.
> Mood : quiet luxury · intemporel · éditorial — Architectural Digest, Vogue Living, Axel Vervoordt, The Row.

---

## Brand Overview

Vérone curate, ne vend pas. Chaque pièce est sélectionnée. Le design reflète cette exigence : sobre, raffiné, confiant. Jamais de bruit visuel, jamais de promotion criée. L'objet parle, la marque s'efface.

**Archétypes :** The Sage + The Creator  
**Cible :** 30–55 ans, urbains CSP+, amateurs de décoration haut-de-gamme  
**Références :** Architectural Digest, Vogue Living, Axel Vervoordt, The Row, Bottega Veneta

---

## Colors

### Primary Palette (strict — 3 colors only)

| Name       | Hex       | Usage                                                        |
| ---------- | --------- | ------------------------------------------------------------ |
| Gold       | `#C9A961` | Primary accent, CTAs, hover states, prix, accents éditoriaux |
| Gold Deep  | `#B8954A` | Hover / pressed states of gold                               |
| Gold Light | `#D4B86E` | Gradient embossage, highlights                               |
| Charcoal   | `#1d1d1b` | Primary text, buttons, backgrounds night mode                |
| White      | `#FFFFFF` | Backgrounds day mode, text night mode                        |

**STRICTLY FORBIDDEN:** Any other hue. No color gradients (gold linear gradient only for emboss effect: `#B8954A` → `#D4B86E`).

### UI-only Colors (never brand)

| Name       | Hex       | Usage                                   |
| ---------- | --------- | --------------------------------------- |
| Pearl      | `#9B9B98` | Muted text, secondary labels, disabled  |
| Pearl Soft | `#E6E5E2` | Subtle backgrounds, dividers (day mode) |

### Semantic Modes

**Day Mode** (default — catalogue, product pages, forms, long reads):

- Background: `#FFFFFF`
- Foreground: `#1d1d1b`
- Accent: `#C9A961`
- Border / Rule: `rgba(29,29,27,0.12)`

**Night Mode** (hero, footer, premium modals):

- Background: `#1d1d1b`
- Foreground: `#FFFFFF`
- Accent: `#C9A961`
- Border / Rule: `rgba(255,255,255,0.12)`

---

## Typography

### Font Stack

| Role               | Primary (proprietary)    | Fallback (use this)                                           |
| ------------------ | ------------------------ | ------------------------------------------------------------- |
| Display / Wordmark | Balgin Light SM Expanded | `DM Sans Light`, letter-spacing `0.18em`, font-stretch `125%` |
| Headings H1–H4     | Migra Extrabold          | `Bodoni Moda Black` or `Playfair Display Black`               |
| Body / UI          | Montserrat Regular       | `Montserrat` (Google Fonts)                                   |

**Google Fonts import:**

```
https://fonts.googleapis.com/css2?family=DM+Sans:wght@200;300;400&family=Bodoni+Moda:ital,wght@0,800;0,900;1,800;1,900&family=Playfair+Display:ital,wght@0,800;0,900;1,800;1,900&family=Montserrat:wght@300;400;500;600&display=swap
```

### Type Scale

| Token      | Size  | Font                | Weight | Tracking | Notes                            |
| ---------- | ----- | ------------------- | ------ | -------- | -------------------------------- |
| Display    | 112px | Balgin / DM Sans    | 300    | 0.18em   | Wordmark — UPPERCASE only        |
| H1         | 72px  | Migra / Bodoni Moda | 800    | -0.01em  | Line-height 1.04                 |
| H2         | 52px  | Migra / Bodoni Moda | 800    | -0.005em | Line-height 1.04                 |
| H3         | 38px  | Migra / Bodoni Moda | 800    | 0        | Line-height 1.18                 |
| H4         | 28px  | Migra / Bodoni Moda | 700    | 0        | Line-height 1.18                 |
| H5         | 22px  | Migra / Bodoni Moda | 700    | 0        | Line-height 1.18                 |
| Eyebrow    | 12px  | Montserrat          | 500    | 0.32em   | UPPERCASE — muted color          |
| Body Large | 17px  | Montserrat          | 300    | 0        | Line-height 1.7                  |
| Body       | 15px  | Montserrat          | 400    | 0        | Line-height 1.55                 |
| Body Small | 13px  | Montserrat          | 400    | 0        | Captions, meta                   |
| Button     | 13px  | Montserrat          | 500    | 0.16em   | UPPERCASE                        |
| Price      | 15px  | Montserrat          | 400    | 0.04em   | Tabular nums — format: `2 480 €` |

### Typography Rules

- **Display / Eyebrow / Buttons:** UPPERCASE always
- **Headings:** Sentence case, italic variant available (editorial accent)
- **Body:** Sentence case, French punctuation (non-breaking space before `:` `;` `?` `!`)
- **Emoji:** Never. Use `—` em dash, `·` middle dot, `№`, Roman numerals instead
- **Prices:** French format — `2 480 €` (space separator, € after, no cents unless required)

---

## Spacing

Base unit: **4px**

| Token | Value |
| ----- | ----- |
| s-1   | 4px   |
| s-2   | 8px   |
| s-3   | 12px  |
| s-4   | 16px  |
| s-5   | 24px  |
| s-6   | 32px  |
| s-7   | 48px  |
| s-8   | 64px  |
| s-9   | 96px  |
| s-10  | 128px |
| s-11  | 160px |

**Layout:**

- Container max-width: `1440px`
- Gutters: `32px` (default), `64px` (large desktop)
- Breakpoints: 375 / 768 / 1024 / 1440 / 1920 px

---

## Shape & Borders

**Corner radii:**

- Default: `0px` — square everywhere. No rounded cards. No rounded buttons.
- Pills / chips only: `999px`
- Hairline forms: `1px`

**Dividers:**

- Hairline `1px` separator, opacity `0.12` (day and night)
- Prefer hairlines over shadows to separate sections

**Shadows — extremely restrained:**

- Default: `none`
- Product card hover only: `0 12px 40px -16px rgba(29,29,27,0.18)`
- Never use shadows on buttons

---

## Motion & Animation

**Single easing:** `cubic-bezier(0.22, 0.61, 0.36, 1)` — "editorial ease"

| Duration | Use                                    |
| -------- | -------------------------------------- |
| 180ms    | Micro-interactions (hover, focus)      |
| 320ms    | Standard transitions (nav, overlays)   |
| 620ms    | Editorial reveals (fade + translate-y) |

**Reveal pattern:** `opacity: 0 → 1` + `transform: translateY(12px) → translateY(0)` at 620ms

**Rules:**

- Never bounce, never spring, never 3D tilt
- Image hover: `scale(1.03)` at 620ms editorial ease
- No backdrop-blur

---

## Components

### Buttons

**Primary (charcoal solid):**

- Background: `#1d1d1b` · Text: `#FFFFFF` · Border: `#1d1d1b`
- Hover: add inset border `inset 0 0 0 1px #C9A961` — background stays unchanged
- Padding: `16px 32px` · Radius: `0px` · Min-height: `48px`
- Font: Montserrat 500, 13px, UPPERCASE, tracking `0.16em`

**Secondary (gold outline):**

- Background: `transparent` · Text: `#C9A961` · Border: `1px solid #C9A961`
- Hover: background fills to `#C9A961`, text becomes `#1d1d1b`
- Same sizing as primary

**Ghost / text link:**

- Background: `transparent` · Text: current color · No border
- Underline 1px, offset 6px
- Hover: text turns `#C9A961`

### Product Card

- **Aspect ratio:** 4:5 portrait (photo dominant)
- **No border, no shadow, no background** by default
- **Content:** photo → name (Montserrat 400) → price (tabular, `2 480 €`)
- **Hover:** name color → `#C9A961` + underline 1px animated + image `scale(1.03)` at 620ms

### Inputs / Form Fields

- **Style:** border-bottom only (1px `#1d1d1b`), no box, no background
- **Focus:** border-bottom turns `#C9A961`
- **Label:** floating — starts at body level, animates up to eyebrow size on focus/fill
- **Error:** border-bottom indicator only

### Navigation

- Background: white (day) or charcoal (night)
- Links: Montserrat 500, 12px, UPPERCASE, tracking `0.32em`
- Active / hover: text → `#C9A961`
- Hairline separator `1px` between nav and content

### Newsletter / Email capture

- Dark section (night mode): charcoal background
- Single input, bottom border only
- CTA: primary button (charcoal on charcoal → inset gold border on hover)
- Copy: short, editorial, tutoiement

---

## Iconography

Library: **Lucide** (stroke `1.25–1.5`, no fill)

```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
```

- Default color: current (charcoal or white depending on mode)
- Gold reserved for active states only
- No icon fonts, no emoji, no decorative illustrations

**Brand symbol:** Monogram V/A — used as favicon, avatar, card corner accent. See `assets/logos/`.

---

## Patterns & Textures

**Damier signature** (gold/charcoal checkerboard, 6px cells):

- Used as corner accent on business cards, section transitions, micro-decoration
- Never as full background — decorative only

```css
background-image:
  linear-gradient(45deg, #c9a961 25%, transparent 25%),
  linear-gradient(-45deg, #c9a961 25%, transparent 25%),
  linear-gradient(45deg, transparent 75%, #c9a961 75%),
  linear-gradient(-45deg, transparent 75%, #c9a961 75%);
background-size: 12px 12px;
background-color: #1d1d1b;
```

**Photo overlay (hero legibility):** `rgba(29,29,27,0.6)` on dark hero photos to ensure white wordmark readability. No other overlays.

---

## Photography Style

- Editorial, natural light, warm neutral tones
- Noble materials: travertine, marble, linen, oak, patinated metal
- Never over-saturated, never filtered
- Composition: wide negative space, object as protagonist
- No people (unless lifestyle, far-shot editorial)
- Aspect ratios: 4:5 (product cards), 16:9 or 3:2 (hero editorial), 1:1 (social)

---

## Voice & Tone

**Principles:** Refined · Confident · Timeless. The object speaks, the brand steps back.

- **Never:** emoji, exclamation points as enthusiasm, superlatives ("unique", "exclusive", "best"), promotional language ("profitez de", "-20%"), first person plural with exclamation
- **Always:** em dash `—` for editorial breaks, middle dot `·` as meta separator, short descriptive prose
- **Copy register:** tutoiement (tu, ton, tes) when addressing the customer directly. Descriptive third-person for product copy ("Une console en travertin sculptée à la main…")

**Copy examples:**

- ✅ `Console Travertine — édition limitée. Sculptée à la main dans un atelier toscan.`
- ✅ `Une lumière qui dessine la pièce.`
- ✅ `Sourcé en Italie · 8 pièces · livraison sur rendez-vous`
- ❌ `🔥 Notre best-seller de l'été !`
- ❌ `Découvrez notre collection unique et exclusive`

---

## Page Structure Reference

**Homepage:** Hero éditorial plein écran (night mode, wordmark or, tagline Migra, photo fond) → Valeurs (night mode, 3 colonnes, eyebrows or) → Catalogue (day mode, grille 4 col, product cards) → Bannière éditoriale (damier + citation) → Newsletter (night mode) → Footer

**Catalogue:** Header page jour + filtres → Grille produits 4 col desktop / 2 col mobile → Lazy load

**Fiche produit:** Photo 4:5 gauche / Infos droite → Nom (Migra H2) → Prix → Description prose → CTA primary → Détails (Montserrat small)

**À-propos:** Hero plein écran nuit → Storytelling 3 paragraphes (Montserrat body large) → Séparateurs hairline

---

_Design system version: 2026-05-10 — Source: `_hub/brand-assets/verone/design-system/`_
