# Architecture du Design System Vérone

**Date** : 2026-04-30
**Statut** : fondations en place (BO-DS-001) — tokens par marque à venir (BO-DS-002)

---

## Vue d'ensemble — 4 couches

```
Couche 4 : Applications
┌──────────────────────────────────────────────────────────────┐
│  apps/back-office  apps/site-internet  apps/linkme           │
│  apps/bohemia (futur)  apps/solar (futur)  apps/flos (futur) │
└──────────────────────────────────────────────────────────────┘
         ↓ imports composants + variables CSS

Couche 3 : Composants UI (indépendants des marques)
┌──────────────────────────────────────────────────────────────┐
│  @verone/ui (Button, Input, Card, Table, Dialog, etc.)       │
│  @verone/ui-business (composants métier)                     │
└──────────────────────────────────────────────────────────────┘
         ↓ lit les variables CSS injectées par ThemeProvider

Couche 2 : Thèmes par marque
┌──────────────────────────────────────────────────────────────┐
│  @verone/themes                                              │
│  ├── ThemeProvider (inject --color-primary, --font-heading…) │
│  ├── themeRegistry (verone|boemia|solar|flos|linkme|office)  │
│  └── tokens par marque : BrandTokens (couleurs, typo, etc.)  │
└──────────────────────────────────────────────────────────────┘
         ↓ imports pour tokens neutres

Couche 1 : Tokens neutres cross-marques (W3C Design Tokens)
┌──────────────────────────────────────────────────────────────┐
│  @verone/tokens                                              │
│  ├── spacing (0→32rem)                                       │
│  ├── breakpoints (sm/md/lg/xl/2xl)                           │
│  ├── motion.duration / motion.easing                         │
│  └── zIndex (dropdown/sticky/modal/toast)                    │
└──────────────────────────────────────────────────────────────┘
```

---

## Détail des packages

### @verone/tokens (Couche 1)

**Scope** : tokens qui ne varient PAS selon la marque.

| Token             | Valeurs                                | Usage                        |
| ----------------- | -------------------------------------- | ---------------------------- |
| `spacing`         | 0/0.5/1/1.5/2/3/4/6/8/12/16/24/32 rem  | Gap, padding, margin         |
| `breakpoints`     | 640/768/1024/1280/1536 px              | Media queries, conditions JS |
| `motion.duration` | instant/fast/normal/slow               | Durées d'animation           |
| `motion.easing`   | linear/easeIn/easeOut/easeInOut/bounce | cubic-bezier CSS             |
| `zIndex`          | 10/20/50/60                            | Dropdown/sticky/modal/toast  |

Consommables directement par les apps :

```ts
import { spacing, motionDuration, zIndex } from '@verone/tokens';
```

Format source : `tokens.json` (W3C Design Tokens — compatible Figma Tokens Plugin, Style Dictionary).

---

### @verone/themes (Couche 2)

**Scope** : tokens qui VARIENT selon la marque (couleurs, typographie, ombres, radius) + ThemeProvider.

#### BrandSlug

| Slug technique | Label humain | App associée                 |
| -------------- | ------------ | ---------------------------- |
| `verone`       | Vérone       | `apps/site-internet`         |
| `boemia`       | Boêmia       | `apps/bohemia` (futur)       |
| `solar`        | Solar        | `apps/solar` (futur)         |
| `flos`         | Flos         | `apps/flos` (futur)          |
| `linkme`       | LinkMe       | `apps/linkme`                |
| `office`       | Office       | `apps/back-office` (interne) |

**Orthographe** : slugs techniques = sans accent, sans `h` (`boemia`). Libellés humains via `BRAND_LABELS` (`Boêmia` avec accent ê).

#### ThemeProvider

Injecte les variables CSS sur le `<html>` (mode `injectOnRoot`) ou sur un wrapper `<div>` (mode sandbox, utile pour Storybook ou side-by-side).

```tsx
// App layout (inject global)
<ThemeProvider brand="boemia" injectOnRoot>
  <App />
</ThemeProvider>

// Sandbox (inject wrapper div)
<ThemeProvider brand="solar">
  <PreviewCard />
</ThemeProvider>
```

Variables CSS injectées (nomenclature CSS custom properties) :
`--color-primary`, `--color-primary-foreground`, `--color-secondary`, `--color-accent`, `--color-background`, `--color-foreground`, `--color-muted`, `--color-border`, `--color-destructive`, `--font-heading`, `--font-body`, `--font-mono`, `--shadow-sm/md/lg`, `--radius-sm/md/lg/full`

#### useTheme()

```ts
const { brand, setBrand, tokens } = useTheme();
// brand: 'boemia'
// setBrand('solar') → hot-switch du thème
// tokens: BrandTokens | null (null = placeholder BO-DS-001)
```

---

### Cohabitation avec @verone/ui/design-system (existant)

`packages/@verone/ui/src/design-system/` contient tokens light/dark (colors, spacing, typography, shadows) et `theme-v2.ts` (palette Vérone Modern 2025). Ces deux artefacts **coexistent avec les nouveaux packages** pendant la transition :

- Les apps actuelles (back-office, linkme, site-internet) continuent d'utiliser `@verone/ui/design-system`
- Les nouvelles apps (bohemia, solar, flos) utiliseront `@verone/themes`
- Migration de l'existant = sprint **BO-DS-003+** (à planifier après que les tokens par marque soient définis dans BO-DS-002)

---

## Workflow design → code

### Sprint BO-DS-001 (ce sprint)

- Infrastructure technique : packages tokens + themes + ThemeProvider
- Tokens par marque : **null placeholder**

### Sprint BO-DS-002 (prochaine étape)

1. Romeo génère les brand guidelines sur **claude.ai web** (couleurs, typo, voix, logos)
2. claude.ai retourne des objets TypeScript conformes à `BrandTokens`
3. Romeo intègre dans `packages/@verone/themes/src/themes/{slug}/tokens.ts`
4. PR `BO-DS-002` pour chaque marque (ou toutes ensemble)
5. Le ThemeProvider commence à injecter de vraies valeurs CSS

Procédure détaillée : `docs/architecture/HANDOFF-CLAUDE-AI.md`

### Sprint BO-DS-003+ (futur)

- Migration `@verone/ui/design-system` → `@verone/tokens` (suppression de la duplication)
- Stories Storybook complètes par composant × marque
- Tokens CSS globaux dans les apps (remplacement des valeurs hardcodées)

---

## Décisions d'architecture

| Décision                                     | Choix         | Raison                                                                               |
| -------------------------------------------- | ------------- | ------------------------------------------------------------------------------------ |
| 2 packages séparés (tokens + themes)         | ✅            | `tokens` peut être publié npm ou importé par Figma indépendamment de React           |
| Cohabitation avec `@verone/ui/design-system` | ✅ temporaire | Migration progressive, ne casse pas les apps en production                           |
| `null` pour les tokens placeholder           | ✅            | ThemeProvider dégradé sans crash = safe pour CI                                      |
| CSS custom properties                        | ✅            | Compatible avec Tailwind CSS (via `var(--color-primary)`) et avec React style inline |
| `injectOnRoot` prop                          | ✅            | Permet sandbox Storybook sans polluer le document global                             |
| Slugs techniques sans accent                 | ✅            | Évite les bugs d'encodage dans URLs, fichiers, `data-brand` attrs                    |

---

## Référence

- Tokens source W3C : `packages/@verone/tokens/src/tokens.json`
- Types par marque : `packages/@verone/themes/src/types.ts`
- ThemeProvider : `packages/@verone/themes/src/ThemeProvider.tsx`
- Roadmap : `.claude/work/BO-BRAND-MKT-roadmap-v3.md`
- Audit factuel marques : `docs/scratchpad/audit-marques-canaux-2026-04-30.md`
- Handoff claude.ai : `docs/architecture/HANDOFF-CLAUDE-AI.md`
