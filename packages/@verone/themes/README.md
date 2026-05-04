# @verone/themes

Thèmes **multi-marques** pour le monorepo Vérone. Fournit le `ThemeProvider` et la structure pour les tokens de chaque marque (Vérone, Boêmia, Solar, Flos, LinkMe, Office).

## Marques

| Slug technique | Label humain | Statut                  |
| -------------- | ------------ | ----------------------- |
| `verone`       | Vérone       | placeholder — BO-DS-002 |
| `boemia`       | Boêmia       | placeholder — BO-DS-002 |
| `solar`        | Solar        | placeholder — BO-DS-002 |
| `flos`         | Flos         | placeholder — BO-DS-002 |
| `linkme`       | LinkMe       | placeholder — BO-DS-002 |
| `office`       | Office       | placeholder — BO-DS-002 |

Orthographe : slugs techniques sans accents/h ; libellés humains via `BRAND_LABELS`.

## Usage

```tsx
import { ThemeProvider, useTheme, BRAND_LABELS } from '@verone/themes';

// Layout racine d'une app
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <ThemeProvider brand="boemia" injectOnRoot>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

// Composant consommateur
function Header() {
  const { brand, setBrand } = useTheme();
  return (
    <header style={{ color: 'var(--color-primary)' }}>
      <span>{BRAND_LABELS[brand]}</span>
      <button onClick={() => setBrand('solar')}>Switcher</button>
    </header>
  );
}
```

## Variables CSS injectées

Quand `ThemeProvider` est monté, ces variables CSS sont disponibles pour les composants enfants :

| Variable CSS                 | Token `BrandTokens`        |
| ---------------------------- | -------------------------- |
| `--color-primary`            | `colors.primary`           |
| `--color-primary-foreground` | `colors.primaryForeground` |
| `--color-secondary`          | `colors.secondary`         |
| `--color-accent`             | `colors.accent`            |
| `--color-background`         | `colors.background`        |
| `--color-foreground`         | `colors.foreground`        |
| `--color-muted`              | `colors.muted`             |
| `--color-border`             | `colors.border`            |
| `--color-destructive`        | `colors.destructive`       |
| `--font-heading`             | `typography.fontHeading`   |
| `--font-body`                | `typography.fontBody`      |
| `--font-mono`                | `typography.fontMono`      |
| `--shadow-sm/md/lg`          | `shadows.*`                |
| `--radius-sm/md/lg/full`     | `radius.*`                 |

## Relation avec @verone/tokens

- `@verone/tokens` contient les tokens **neutres** (spacing, breakpoints, motion, z-index).
- `@verone/themes` contient les tokens **par marque** (couleurs, typo, ombres, radius).
- Les deux packages sont complémentaires.

## Roadmap

- **BO-DS-001** (ce sprint) — infrastructure ThemeProvider + 6 placeholders
- **BO-DS-002** — remplir les tokens via outputs claude.ai web (procédure dans `docs/architecture/HANDOFF-CLAUDE-AI.md`)
- **BO-DS-003+** — migration apps vers `@verone/themes`
