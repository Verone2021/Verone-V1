# Architecture Composants Génériques V2 - Design System Vérone

**Date** : 2025-11-07
**Auteur** : verone-design-expert agent
**Contexte** : Refonte architecture composants UI selon best practices 2025
**Stack** : Next.js 15 + shadcn/ui + Radix UI + Tailwind CSS + CVA

---

## Executive Summary

🎨 **Architecture unifiée** basée sur Atomic Design + Copy-Paste Pattern (shadcn/ui)

🎯 **Objectif** : Réduire 305+ composants à ~220 composants maintenus via système de variants

⚡ **Principes** : Two-layer design (Radix UI structure + Tailwind styling), accessibilité WCAG 2.2 AA, TypeScript strict

📦 **Composants génériques clés** : Button unifié (7 variants), KPICard unifié (3 variants), Badge système, Card compound

🔧 **Design tokens consolidés** : Source unique `design-system/tokens/` (colors, spacing, typography, shadows, radius)

---

## Table des Matières

1. [Architecture Globale](#architecture-globale)
2. [Design Tokens Consolidés](#design-tokens-consolidés)
3. [Spécifications Composants Génériques](#spécifications-composants-génériques)
4. [Patterns Composition](#patterns-composition)
5. [Références Best Practices 2025](#références-best-practices-2025)

---

## Architecture Globale

### Diagramme Système

```
┌─────────────────────────────────────────────────────────────────┐
│                    VÉRONE DESIGN SYSTEM V2                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  LAYER 1 : DESIGN TOKENS (Source unique de vérité)     │  │
│  │  ───────────────────────────────────────────────────────│  │
│  │  • Colors (semantic: primary, secondary, success, etc.) │  │
│  │  • Spacing (scale 4-64px base 4)                       │  │
│  │  • Typography (scale xs-2xl)                           │  │
│  │  • Shadows (5 elevation levels)                        │  │
│  │  • Border Radius (sm-full)                             │  │
│  │                                                         │  │
│  │  📁 apps/back-office/src/lib/design-system/tokens/                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  LAYER 2 : PRIMITIVES (Radix UI Headless)              │  │
│  │  ───────────────────────────────────────────────────────│  │
│  │  • Structure & Behavior (logic, a11y, keyboard nav)    │  │
│  │  • WAI-ARIA attributes automatiques                    │  │
│  │  • Pas de styles (headless components)                 │  │
│  │                                                         │  │
│  │  📦 @radix-ui/react-*                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  LAYER 3 : STYLED COMPONENTS (shadcn/ui)               │  │
│  │  ───────────────────────────────────────────────────────│  │
│  │  • Primitives + Styling (Tailwind CSS)                 │  │
│  │  • CVA (Class Variance Authority) pour variants        │  │
│  │  • Copy-paste dans apps/back-office/src/components/ui/                  │  │
│  │  • Ownership total du code                             │  │
│  │                                                         │  │
│  │  📁 apps/back-office/src/components/ui/ (51 composants base)           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  LAYER 4 : ATOMIC DESIGN STRUCTURE                     │  │
│  │  ───────────────────────────────────────────────────────│  │
│  │  • Atoms (Button, Badge, Input) → 25 composants        │  │
│  │  • Molecules (Card, KPICard, Alert) → 22 composants    │  │
│  │  • Organisms (Table, Tabs, Modal) → 18 composants      │  │
│  │                                                         │  │
│  │  📁 apps/back-office/src/components/ui/{atoms,molecules,organisms}/    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  LAYER 5 : BUSINESS COMPONENTS                         │  │
│  │  ───────────────────────────────────────────────────────│  │
│  │  • Compositions business-specific                      │  │
│  │  • Utilisent composants génériques (layers 3-4)        │  │
│  │  • Logique métier Vérone                               │  │
│  │                                                         │  │
│  │  📁 apps/back-office/src/components/business/                           │  │
│  │  📁 src/shared/modules/**/components/                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Principes Fondateurs

#### 1. Copy-Paste Architecture (shadcn/ui)

**Philosophie** : "The design of your components should be separate from their implementation"

✅ **Avantages** :

- Ownership total du code composants
- Pas de dépendances cachées (pas de `node_modules` black box)
- Customisation complète sans fork library
- Upgrade contrôlé composant par composant
- AI-friendly (Claude Code peut modifier code directement)

```typescript
// ✅ Code copié dans projet, modifiable librement
apps / back - office / src / components / ui / button.tsx; // Notre implémentation
apps / back - office / src / components / ui / dialog.tsx; // Notre implémentation

// vs ❌ Package external (vendor lock-in)
import { Button } from '@some-ui-lib'; // Code inaccessible
```

#### 2. Two-Layer Design

**Layer 1 : Structure & Behavior** (Radix UI)

- Composants headless (pas de styles)
- Accessibilité WAI-ARIA complète
- Keyboard navigation automatique
- Focus management

**Layer 2 : Styling** (Tailwind CSS + CVA)

- Design tokens → CSS variables
- Variants system avec CVA
- Responsive avec breakpoints Tailwind
- Dark mode support

```typescript
// Exemple : Dialog
import * as DialogPrimitive from '@radix-ui/react-dialog'  // Layer 1: Behavior

const Dialog = DialogPrimitive.Root                         // Layer 1: Logic
const DialogTrigger = DialogPrimitive.Trigger

const DialogContent = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50" />  {/* Layer 2: Styles */}
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 translate-x-1/2 translate-y-1/2",  {/* Layer 2: Tailwind */}
        "w-full max-w-lg rounded-lg bg-white p-6 shadow-lg",
        className
      )}
      {...props}
    />
  </DialogPrimitive.Portal>
))
```

#### 3. Atomic Design Pattern

**Hiérarchie** :

```
Atoms (Éléments de base, indivisibles)
  ↓
Molecules (Combinaisons simples d'atoms)
  ↓
Organisms (Combinaisons complexes de molecules)
  ↓
Templates (Structures pages avec placeholders)
  ↓
Pages (Templates avec données réelles)
```

**Application Vérone** :

| Niveau        | Composants Vérone | Exemples                                  |
| ------------- | ----------------- | ----------------------------------------- |
| **Atoms**     | 25                | Button, Badge, Input, Label, Checkbox     |
| **Molecules** | 22                | Card, KPICard, Alert, FormField           |
| **Organisms** | 18                | Table, DataTable, CommandPalette, Sidebar |
| **Templates** | -                 | DashboardLayout, CatalogueLayout          |
| **Pages**     | -                 | `/dashboard`, `/produits/catalogue`       |

#### 4. Accessibilité WCAG 2.2 AA

**Requirements** :

- ✅ Tous composants interactifs focusables (`tabindex`)
- ✅ ARIA attributes complets (`aria-label`, `aria-expanded`, etc.)
- ✅ Keyboard navigation complète (Tab, Enter, Escape, Arrow keys)
- ✅ Color contrast minimum 4.5:1 (texte normal)
- ✅ Focus indicators visibles
- ✅ Screen reader compatible

#### 5. TypeScript Strict Mode

**Configuration** :

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

**Tous composants** :

- ✅ Props interfaces complètes
- ✅ Pas de `any` (0 tolerance)
- ✅ Generic types pour réutilisabilité
- ✅ VariantProps inference (CVA)

---

## Design Tokens Consolidés

### Source Unique : `apps/back-office/src/lib/design-system/tokens/`

```
apps/back-office/src/lib/design-system/tokens/
├── index.ts          # Export centralisé
├── colors.ts         # Semantic colors
├── spacing.ts        # Scale espacement
├── typography.ts     # Scale typographique
├── shadows.ts        # Elevation levels
└── radius.ts         # Border radius scale
```

---

### 1. Colors (Semantic)

**Fichier** : `apps/back-office/src/lib/design-system/tokens/colors.ts`

```typescript
/**
 * Design Tokens - Colors
 * Semantic color system basé sur HSL pour dark mode support
 */

export const colors = {
  // Primary (Brand)
  primary: {
    50: 'hsl(250, 100%, 97%)',
    100: 'hsl(251, 91%, 95%)',
    200: 'hsl(251, 95%, 92%)',
    300: 'hsl(252, 95%, 85%)',
    400: 'hsl(255, 92%, 76%)',
    500: 'hsl(258, 90%, 66%)', // Primary base
    600: 'hsl(262, 83%, 58%)',
    700: 'hsl(263, 70%, 50%)',
    800: 'hsl(263, 69%, 42%)',
    900: 'hsl(264, 67%, 35%)',
    950: 'hsl(260, 73%, 23%)',
  },

  // Secondary (Accent)
  secondary: {
    50: 'hsl(210, 40%, 98%)',
    // ... scale complète
    500: 'hsl(217, 19%, 38%)', // Secondary base
  },

  // Success
  success: {
    500: 'hsl(142, 71%, 45%)', // Green
  },

  // Danger (Destructive)
  danger: {
    500: 'hsl(0, 84%, 60%)', // Red
  },

  // Warning
  warning: {
    500: 'hsl(45, 93%, 47%)', // Amber
  },

  // Info
  info: {
    500: 'hsl(199, 89%, 48%)', // Blue
  },

  // Neutrals (Grayscale)
  neutral: {
    50: 'hsl(210, 40%, 98%)',
    100: 'hsl(210, 40%, 96%)',
    200: 'hsl(214, 32%, 91%)',
    300: 'hsl(213, 27%, 84%)',
    400: 'hsl(215, 20%, 65%)',
    500: 'hsl(215, 16%, 47%)',
    600: 'hsl(215, 19%, 35%)',
    700: 'hsl(215, 25%, 27%)',
    800: 'hsl(217, 33%, 17%)',
    900: 'hsl(222, 47%, 11%)',
    950: 'hsl(229, 84%, 5%)',
  },
};

// CSS Variables export (Tailwind config)
export const cssVariables = {
  '--primary': colors.primary[500],
  '--primary-foreground': 'hsl(0, 0%, 100%)',
  '--secondary': colors.secondary[500],
  '--secondary-foreground': 'hsl(0, 0%, 100%)',
  '--success': colors.success[500],
  '--success-foreground': 'hsl(0, 0%, 100%)',
  '--destructive': colors.danger[500],
  '--destructive-foreground': 'hsl(0, 0%, 100%)',
  '--muted': colors.neutral[100],
  '--muted-foreground': colors.neutral[500],
  '--accent': colors.neutral[100],
  '--accent-foreground': colors.neutral[900],
  '--border': colors.neutral[200],
  '--input': colors.neutral[200],
  '--ring': colors.primary[500],
};
```

**Usage** :

```typescript
// ✅ Utiliser semantic colors
className = 'bg-primary text-primary-foreground';
className = 'border-border text-muted-foreground';

// ❌ Éviter hardcoded colors
className = 'bg-blue-500 text-white'; // Non-semantic
```

---

### 2. Spacing (Scale)

**Fichier** : `apps/back-office/src/lib/design-system/tokens/spacing.ts`

```typescript
/**
 * Design Tokens - Spacing
 * Scale basée 4px (0.25rem) pour cohérence verticale/horizontale
 */

export const spacing = {
  0: '0px',
  px: '1px',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px   ← Base scale
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px  ← Standard
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  32: '8rem', // 128px
  40: '10rem', // 160px
  48: '12rem', // 192px
  56: '14rem', // 224px
  64: '16rem', // 256px
};

// Aliases sémantiques
export const semanticSpacing = {
  'spacing-xs': spacing[1], // 4px
  'spacing-sm': spacing[2], // 8px
  'spacing-md': spacing[4], // 16px
  'spacing-lg': spacing[6], // 24px
  'spacing-xl': spacing[8], // 32px
  'spacing-2xl': spacing[12], // 48px
  'spacing-3xl': spacing[16], // 64px
};
```

**Usage patterns** :

```typescript
// ✅ Padding/Margin cohérents
className="p-4"        // 16px padding standard
className="px-6 py-4"  // 24px horizontal, 16px vertical
className="gap-2"      // 8px gap dans flex/grid

// ✅ Composants spacing
<div className="space-y-4">  {/* 16px entre éléments verticaux */}
  <Item />
  <Item />
</div>
```

---

### 3. Typography (Scale)

**Fichier** : `apps/back-office/src/lib/design-system/tokens/typography.ts`

```typescript
/**
 * Design Tokens - Typography
 * Scale modulaire basée Golden Ratio (~1.618) pour harmonie visuelle
 */

export const typography = {
  fontSizes: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px   ← Base
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
  },

  fontWeights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  lineHeights: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  fontFamilies: {
    sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
};

// Semantic typography (composants UI)
export const semanticTypography = {
  // Headings
  h1: {
    size: typography.fontSizes['4xl'],
    weight: typography.fontWeights.bold,
    lineHeight: typography.lineHeights.tight,
  },
  h2: {
    size: typography.fontSizes['3xl'],
    weight: typography.fontWeights.bold,
    lineHeight: typography.lineHeights.tight,
  },
  h3: {
    size: typography.fontSizes['2xl'],
    weight: typography.fontWeights.semibold,
    lineHeight: typography.lineHeights.snug,
  },
  h4: {
    size: typography.fontSizes.xl,
    weight: typography.fontWeights.semibold,
    lineHeight: typography.lineHeights.snug,
  },

  // Body
  bodyLarge: {
    size: typography.fontSizes.lg,
    weight: typography.fontWeights.normal,
    lineHeight: typography.lineHeights.relaxed,
  },
  bodyBase: {
    size: typography.fontSizes.base,
    weight: typography.fontWeights.normal,
    lineHeight: typography.lineHeights.normal,
  },
  bodySmall: {
    size: typography.fontSizes.sm,
    weight: typography.fontWeights.normal,
    lineHeight: typography.lineHeights.normal,
  },

  // UI
  caption: {
    size: typography.fontSizes.xs,
    weight: typography.fontWeights.normal,
    lineHeight: typography.lineHeights.normal,
  },
  button: {
    size: typography.fontSizes.sm,
    weight: typography.fontWeights.medium,
    lineHeight: typography.lineHeights.none,
  },
  label: {
    size: typography.fontSizes.sm,
    weight: typography.fontWeights.medium,
    lineHeight: typography.lineHeights.normal,
  },
};
```

**Usage** :

```typescript
// ✅ Text classes Tailwind
className="text-sm"              // 14px
className="text-base font-medium" // 16px medium
className="text-2xl font-bold"    // 24px bold

// ✅ Headings
<h1 className="text-4xl font-bold leading-tight">Title</h1>
<p className="text-base leading-normal">Body text</p>
```

---

### 4. Shadows (Elevation)

**Fichier** : `apps/back-office/src/lib/design-system/tokens/shadows.ts`

```typescript
/**
 * Design Tokens - Shadows
 * 5 levels d'elevation pour hiérarchie visuelle
 */

export const shadows = {
  // Elevation 0 : Flat (pas d'ombre)
  none: 'none',

  // Elevation 1 : Hover states, cards
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',

  // Elevation 2 : Dropdowns, popovers
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',

  // Elevation 3 : Modals, dialogs
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',

  // Elevation 4 : Command palettes, important overlays
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',

  // Elevation 5 : Maximum prominence
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
};

// Semantic shadows
export const semanticShadows = {
  card: shadows.sm,
  dropdown: shadows.md,
  modal: shadows.lg,
  commandPalette: shadows.xl,
};
```

**Usage** :

```typescript
// ✅ Shadow classes
className = 'shadow-sm'; // Cards
className = 'shadow-md'; // Dropdowns
className = 'shadow-lg'; // Modals
className = 'shadow-xl'; // Command palette
```

---

### 5. Border Radius

**Fichier** : `apps/back-office/src/lib/design-system/tokens/radius.ts`

```typescript
/**
 * Design Tokens - Border Radius
 * Scale cohérente pour UI moderne
 */

export const radius = {
  none: '0px',
  sm: '0.125rem', // 2px
  base: '0.25rem', // 4px   ← Standard
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px', // Capsule
};

// Semantic radius
export const semanticRadius = {
  button: radius.md, // 6px
  input: radius.md, // 6px
  card: radius.lg, // 8px
  modal: radius.xl, // 12px
  badge: radius.full, // Capsule
};
```

**Usage** :

```typescript
// ✅ Rounded classes
className = 'rounded-md'; // Standard (6px)
className = 'rounded-lg'; // Cards (8px)
className = 'rounded-full'; // Badges, avatars (capsule)
```

---

## Spécifications Composants Génériques

### 1. Button Unifié

**Fichier** : `apps/back-office/src/components/ui/button.tsx`

#### Props TypeScript

```typescript
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from '@radix-ui/react-slot'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  // Base classes (toujours appliquées)
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",

        // ✨ NOUVEAUX : Variants modernes
        gradient: "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-md",
        glass: "backdrop-blur-lg bg-white/10 border border-white/20 text-white hover:bg-white/20"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Render as child component (polymorphic)
   * @example <Button asChild><Link href="/home">Home</Link></Button>
   */
  asChild?: boolean

  /**
   * Loading state avec spinner
   */
  loading?: boolean

  /**
   * Icône gauche ou droite
   */
  icon?: React.ReactNode

  /**
   * Position icône
   * @default 'left'
   */
  iconPosition?: 'left' | 'right'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      icon,
      iconPosition = 'left',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!loading && icon && iconPosition === 'left' && (
          <span className="inline-flex shrink-0">{icon}</span>
        )}
        {children}
        {!loading && icon && iconPosition === 'right' && (
          <span className="inline-flex shrink-0">{icon}</span>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"
```

#### Exemples Usage

```typescript
import { Button } from '@/components/ui/button'
import { Save, Plus, Trash2 } from 'lucide-react'

// 1. Bouton primaire simple
<Button variant="default">
  Enregistrer
</Button>

// 2. Bouton avec loading state
<Button variant="default" loading={isSubmitting}>
  Enregistrer
</Button>

// 3. Bouton destructive (suppression)
<Button variant="destructive" onClick={handleDelete}>
  Supprimer
</Button>

// 4. Bouton outline avec icône gauche
<Button variant="outline" icon={<Plus className="h-4 w-4" />}>
  Ajouter produit
</Button>

// 5. Bouton ghost icon seul
<Button variant="ghost" size="icon" aria-label="Paramètres">
  <Settings className="h-4 w-4" />
</Button>

// 6. Bouton gradient moderne
<Button variant="gradient" size="lg">
  Découvrir les nouveautés
</Button>

// 7. Bouton glass effect (overlays)
<Button variant="glass">
  Fermer
</Button>

// 8. Bouton polymorphic (Link)
<Button asChild variant="link">
  <Link href="/catalogue">
    Voir le catalogue
  </Link>
</Button>

// 9. Bouton avec icône droite
<Button
  variant="default"
  icon={<ChevronRight className="h-4 w-4" />}
  iconPosition="right"
>
  Suivant
</Button>
```

#### Migration depuis Composants Existants

```typescript
// AVANT : ActionButton
<ActionButton
  label="Enregistrer"
  onClick={handleSave}
  variant="primary"
  icon={<Save />}
/>

// APRÈS : Button unifié
<Button variant="default" onClick={handleSave} icon={<Save className="h-4 w-4" />}>
  Enregistrer
</Button>

// ---

// AVANT : ModernActionButton
<ModernActionButton variant="gradient">
  Action Premium
</ModernActionButton>

// APRÈS : Button variant gradient
<Button variant="gradient">
  Action Premium
</Button>

// ---

// AVANT : StandardModifyButton
<StandardModifyButton onClick={handleEdit} />

// APRÈS : Button standardisé
<Button variant="outline" size="sm" onClick={handleEdit}>
  Modifier
</Button>
```

---

### 2. KPICard Unifié

**Fichier** : `apps/back-office/src/components/ui/kpi-card.tsx`

#### Props TypeScript

```typescript
import { cva, type VariantProps } from 'class-variance-authority'
import { TrendingUp, TrendingDown } from 'lucide-react'

const kpiCardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm transition-all",
  {
    variants: {
      variant: {
        compact: "p-4",
        elegant: "p-6 bg-gradient-to-br from-accent/10 to-primary/5",
        detailed: "p-5"
      },
      size: {
        sm: "min-h-[100px]",
        md: "min-h-[140px]",
        lg: "min-h-[180px]"
      }
    },
    defaultVariants: {
      variant: "compact",
      size: "md"
    }
  }
)

export interface KPICardProps extends VariantProps<typeof kpiCardVariants> {
  /** Titre du KPI */
  title: string

  /** Valeur principale */
  value: string | number

  /** Évolution (nombre ou objet avec label custom) */
  change?: number | { value: number; label: string }

  /** Description/subtitle */
  description?: string

  /** Icône (affiché selon variant) */
  icon?: React.ReactNode

  /** Actions (buttons, etc.) */
  actions?: React.ReactNode

  /** Trend direction (détermine couleur change) */
  trend?: 'up' | 'down' | 'neutral'

  /** Additional className */
  className?: string
}

export function KPICard({
  title,
  value,
  change,
  description,
  icon,
  actions,
  trend,
  variant,
  size,
  className
}: KPICardProps) {
  return (
    <div className={cn(kpiCardVariants({ variant, size }), className)}>
      {variant === 'compact' && (
        <CompactLayout
          title={title}
          value={value}
          change={change}
          icon={icon}
          trend={trend}
        />
      )}

      {variant === 'elegant' && (
        <ElegantLayout
          title={title}
          value={value}
          description={description}
        />
      )}

      {variant === 'detailed' && (
        <DetailedLayout
          title={title}
          value={value}
          description={description}
          change={change}
          actions={actions}
          trend={trend}
        />
      )}
    </div>
  )
}

// Layout Components

function CompactLayout({ title, value, change, icon, trend }: Partial<KPICardProps>) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {change !== undefined && <ChangeIndicator change={change} trend={trend} className="mt-2" />}
      </div>
      {icon && <div className="text-muted-foreground ml-4 text-2xl">{icon}</div>}
    </div>
  )
}

function ElegantLayout({ title, value, description }: Partial<KPICardProps>) {
  return (
    <>
      <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
      <div className="text-3xl font-bold mb-1">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </>
  )
}

function DetailedLayout({ title, value, description, change, actions, trend }: Partial<KPICardProps>) {
  return (
    <>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      {description && <p className="text-sm text-muted-foreground mb-2">{description}</p>}
      {change !== undefined && <ChangeIndicator change={change} trend={trend} />}
    </>
  )
}

// Composant auxiliaire
function ChangeIndicator({
  change,
  trend,
  className
}: {
  change: number | { value: number; label: string }
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}) {
  const value = typeof change === 'number' ? change : change.value
  const label = typeof change === 'number' ? `${value > 0 ? '+' : ''}${value}%` : change.label

  // Auto-detect trend si non fourni
  const finalTrend = trend || (value > 0 ? 'up' : value < 0 ? 'down' : 'neutral')

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-muted-foreground'
  }

  return (
    <p className={cn(
      "text-xs font-medium flex items-center gap-1",
      trendColors[finalTrend],
      className
    )}>
      {finalTrend === 'up' && <TrendingUp className="h-3 w-3" />}
      {finalTrend === 'down' && <TrendingDown className="h-3 w-3" />}
      {label}
    </p>
  )
}
```

#### Exemples Usage

```typescript
import { KPICard } from '@/components/ui/kpi-card'
import { Euro, Users, ShoppingCart } from 'lucide-react'

// 1. KPI compact simple
<KPICard
  variant="compact"
  title="Chiffre d'affaires"
  value="€45,231"
  change={12.5}
  icon={<Euro />}
/>

// 2. KPI elegant avec description
<KPICard
  variant="elegant"
  title="Utilisateurs actifs"
  value="1,234"
  description="Connectés ce mois"
/>

// 3. KPI detailed avec actions
<KPICard
  variant="detailed"
  title="Commandes"
  value="456"
  description="Derniers 30 jours"
  change={{ value: -5.2, label: '-5.2% vs mois dernier' }}
  trend="down"
  actions={
    <Button size="sm" variant="outline">
      Voir détails
    </Button>
  }
/>

// 4. KPI compact avec change personnalisé
<KPICard
  variant="compact"
  title="Stock total"
  value="12,543 unités"
  change={{ value: 8, label: '+8% cette semaine' }}
  trend="up"
  icon={<ShoppingCart />}
/>
```

#### Migration

```typescript
// AVANT : CompactKpiCard
<CompactKpiCard
  title="Revenue"
  value="€45,231"
  change={12.5}
  icon={<Euro />}
/>

// APRÈS : KPICard variant="compact"
<KPICard
  variant="compact"
  title="Revenue"
  value="€45,231"
  change={12.5}
  icon={<Euro />}
/>

// ---

// AVANT : ElegantKpiCard
<ElegantKpiCard
  title="Users"
  value="1,234"
  subtitle="Active this month"
  gradient
/>

// APRÈS : KPICard variant="elegant"
<KPICard
  variant="elegant"
  title="Users"
  value="1,234"
  description="Active this month"
/>
```

---

### 3. Badge Unifié (avec Variants Métier)

**Fichier** : `apps/back-office/src/components/ui/badge.tsx`

#### Props TypeScript

```typescript
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border border-input",
        success: "border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
        warning: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
        info: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",

        // ✨ Variants métier
        customer: "border-transparent bg-blue-100 text-blue-800",
        supplier: "border-transparent bg-purple-100 text-purple-800",
        partner: "border-transparent bg-teal-100 text-teal-800",
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}
```

#### Exemples Usage

```typescript
// Badges génériques
<Badge variant="default">New</Badge>
<Badge variant="success">Actif</Badge>
<Badge variant="destructive">Archivé</Badge>
<Badge variant="warning">En attente</Badge>

// Badges métier
<Badge variant="customer">Client Pro</Badge>
<Badge variant="supplier">Fournisseur Vérifié</Badge>
<Badge variant="partner">Partenaire Premium</Badge>
```

#### Migration Badges Spécialisés

```typescript
// AVANT : CustomerBadge custom
<CustomerBadge type="professional" />

// APRÈS : Badge variant + data mapping
<Badge variant="customer">
  {customer.type === 'professional' ? 'Client Pro' : 'Client Particulier'}
</Badge>

// Ou avec composant wrapper si logique complexe
function CustomerBadge({ customer }: { customer: Customer }) {
  return (
    <Badge variant="customer">
      {customer.is_favorite && '⭐ '}
      {customer.name}
    </Badge>
  )
}
```

---

### 4. Card Unifié (Compound Components)

**Fichier** : `apps/back-office/src/components/ui/card.tsx`

#### Pattern Compound Components

```typescript
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  )
)

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
)

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  )
)

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
)

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
)

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  )
)

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

#### Exemples Usage

```typescript
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

// 1. Card simple
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card Description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card Content</p>
  </CardContent>
</Card>

// 2. Card avec footer actions
<Card>
  <CardHeader>
    <CardTitle>Produit #1234</CardTitle>
    <CardDescription>Chaise scandinave en bois</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <div className="flex justify-between">
        <span>Prix:</span>
        <span className="font-bold">€89.99</span>
      </div>
      <div className="flex justify-between">
        <span>Stock:</span>
        <span className="text-green-600">En stock (45)</span>
      </div>
    </div>
  </CardContent>
  <CardFooter className="gap-2">
    <Button variant="outline" className="flex-1">Modifier</Button>
    <Button variant="default" className="flex-1">Voir détails</Button>
  </CardFooter>
</Card>

// 3. Card sans header (content only)
<Card>
  <CardContent className="pt-6">
    <p>Simple content card</p>
  </CardContent>
</Card>
```

---

## Patterns Composition

### 1. Compound Components

**Pattern** : Composants groupés avec API déclarative

**Avantages** :

- Flexibilité maximale
- API intuitive
- Composition naturelle
- TypeScript inference

**Exemple : Tabs**

```typescript
<Tabs defaultValue="account">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">
    Account settings here
  </TabsContent>
  <TabsContent value="password">
    Password settings here
  </TabsContent>
</Tabs>
```

---

### 2. Polymorphic Components (as prop)

**Pattern** : Composant render comme autre element

**Avantages** :

- Réutilisabilité
- Flexibilité routing
- Accessibilité préservée

**Exemple : Button as Link**

```typescript
// Button render comme Link Next.js
<Button asChild>
  <Link href="/catalogue">
    Voir catalogue
  </Link>
</Button>

// Implementation (avec Slot de Radix UI)
const Comp = asChild ? Slot : "button"
return <Comp {...props}>{children}</Comp>
```

---

### 3. Render Props

**Pattern** : Fonction passée comme children pour customisation

**Exemple : Combobox custom render**

```typescript
<Combobox
  options={products}
  renderOption={(product) => (
    <div className="flex items-center gap-2">
      <Image src={product.image} alt="" className="h-8 w-8" />
      <div>
        <p className="font-medium">{product.name}</p>
        <p className="text-xs text-muted-foreground">{product.sku}</p>
      </div>
    </div>
  )}
/>
```

---

## Références Best Practices 2025

### Architecture & Tools

| Resource         | Description                     | URL                                        |
| ---------------- | ------------------------------- | ------------------------------------------ |
| **shadcn/ui**    | Copy-paste component collection | [ui.shadcn.com](https://ui.shadcn.com)     |
| **Radix UI**     | Headless accessible primitives  | [radix-ui.com](https://radix-ui.com)       |
| **CVA**          | Class Variance Authority        | [cva.style](https://cva.style)             |
| **Tailwind CSS** | Utility-first CSS framework     | [tailwindcss.com](https://tailwindcss.com) |

### Community Discussions

| Platform               | Topic                      | Key Insights                                 |
| ---------------------- | -------------------------- | -------------------------------------------- |
| **Reddit r/reactjs**   | shadcn/ui architecture     | Copy-paste > npm packages (ownership)        |
| **GitHub Discussions** | Component library patterns | Compound components + TypeScript generics    |
| **Twitter/X**          | UI trends 2025             | Glass morphism, gradients, microinteractions |

### Design Inspiration

| Source              | Search Query         | Use Case                   |
| ------------------- | -------------------- | -------------------------- |
| **Dribbble**        | "CRM dashboard 2025" | KPI cards, tables, layouts |
| **Dribbble**        | "B2B SaaS UI"        | Forms, modals, navigation  |
| **Figma Community** | "Design system"      | Tokens, component specs    |

### Accessibility

| Resource                         | Description                  | Compliance                   |
| -------------------------------- | ---------------------------- | ---------------------------- |
| **WCAG 2.2**                     | W3C Guidelines (stable 2025) | AA minimum                   |
| **WAI-ARIA Authoring Practices** | Component patterns           | Dialog, Tabs, Combobox, etc. |
| **Radix UI Accessibility**       | ARIA best practices          | Built-in compliance          |

---

**Fin Architecture Composants Génériques V2**

**Prochaine étape** : Consulter `PLAN-REFACTORISATION-COMPOSANTS-2025.md` pour stratégie migration progressive.
