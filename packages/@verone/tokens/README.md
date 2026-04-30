# @verone/tokens

Design tokens **cross-marques** pour le monorepo Vérone. Format W3C Design Tokens.

## Scope

Contient uniquement les tokens **neutres** qui ne varient PAS selon la marque :

- `spacing` — scale d'espacement en rem (0 → 32)
- `breakpoints` — points de rupture responsive (sm/md/lg/xl/2xl)
- `motion.duration` — durées d'animation (instant/fast/normal/slow)
- `motion.easing` — courbes d'accélération CSS
- `zIndex` — hiérarchie des couches UI

**Les tokens qui varient par marque** (couleurs, typographie, ombres, radius) sont dans `@verone/themes`.

## Usage

```ts
import {
  spacing,
  breakpoints,
  motionDuration,
  motionEasing,
  zIndex,
} from '@verone/tokens';

// Spacing
const gap = spacing[4]; // '1rem'

// Breakpoints (pour matchMedia ou conditions JS)
const isMobile = window.innerWidth < breakpoints.md; // < 768

// Animation
const transition = `all ${motionDuration.normal} ${motionEasing.easeOut}`;
// → 'all 250ms cubic-bezier(0, 0, 0.2, 1)'

// Z-index
el.style.zIndex = String(zIndex.modal); // '50'
```

## Fichier source (W3C format)

`src/tokens.json` — consultable par les outils design (Figma Tokens Plugin, Style Dictionary, etc.).

## Relation avec l'existant

`@verone/ui/design-system` contient des tokens colors/spacing/typography/shadows spécifiques à la version actuelle de l'UI Vérone. Ces deux packages cohabitent pendant la transition vers le design system multi-marques. Migration future : sprint BO-DS-003+.

## Roadmap

- **BO-DS-001** (ce sprint) — scaffolding, tokens neutres cross-marques
- **BO-DS-002** — intégration des outputs claude.ai (tokens par marque dans `@verone/themes`)
- **BO-DS-003+** — migration `@verone/ui/design-system` → `@verone/tokens`
