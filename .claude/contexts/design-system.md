# 🎨 DESIGN SYSTEM CONTEXT - Vérone Back Office

**Chargement** : Uniquement si travail UI, composants, Storybook, design V2

---

## 🎨 DESIGN SYSTEM VÉRONE V2 (2025)

**Palette Moderne 2025** - Inspirée Odoo, Figma, Dribbble, shadcn/ui

```css
--verone-primary: #3b86d1 /* Bleu professionnel */ --verone-success: #38ce3c
  /* Vert validation */ --verone-warning: #ff9b3e /* Orange attention */
  --verone-accent: #844fc1 /* Violet créatif */ --verone-danger: #ff4d6b
  /* Rouge critique */ --verone-neutral: #6c7293 /* Gris interface */;
```

**Fichiers Design System V2 (Phase 4 Turborepo)** :

```
packages/@verone/ui/src/lib/design-system/  # Tokens, themes, utils
packages/@verone/ui/src/themes/theme-v2.ts  # Thème complet avec gradients
packages/@verone/ui/src/components/         # Composants modernes (Button, KPI Cards, etc.)
```

**Tendances 2025** :

- ✅ Couleurs vives et gradients autorisés
- ✅ Rounded corners (border-radius: 8-16px)
- ✅ Micro-interactions (hover, focus, active states)
- ✅ Shadows élégantes (drop-shadow, box-shadow subtiles)
- ✅ Transitions fluides (200-300ms ease-in-out)

---

## 📖 STORYBOOK - COMPOSANTS UI

**Installation** : `npx storybook@latest init`

**Structure stories (Phase 4 Turborepo)** :

```
packages/@verone/ui/src/stories/
├── design-system/
│   ├── Colors.stories.tsx
│   ├── Typography.stories.tsx
│   └── Spacing.stories.tsx
├── components/
│   ├── Button.stories.tsx
│   ├── Input.stories.tsx
│   ├── Card.stories.tsx
│   └── [autres...]
└── pages/
    ├── Dashboard.stories.tsx
    └── ProductDetail.stories.tsx
```

**Règles Storybook** :

1. **Tout composant réutilisable DOIT avoir une story**
2. **Stories = documentation vivante** (props, variants, examples)
3. **Tests visuels** : Chromatic ou Percy pour régression visuelle
4. **Accessibilité** : Addon a11y activé par défaut

---

## 🔄 WORKFLOW CRÉATION COMPOSANT (Phase 4 Turborepo)

```typescript
1. Créer composant : packages/@verone/ui/src/components/NewComponent.tsx
2. Exporter : packages/@verone/ui/src/index.ts
3. Créer story : packages/@verone/ui/src/stories/components/NewComponent.stories.tsx
4. Tester dans Storybook : npm run storybook
5. Documenter props, variants, best practices
6. Ajouter tests unitaires (Vitest)
7. PR avec screenshots Storybook
```

---

## 🖼️ PRODUCT IMAGES PATTERN (BR-TECH-002)

**OBLIGATOIRE** : Toujours utiliser jointure `product_images`

```typescript
// ✅ CORRECT : Jointure product_images
const { data } = await supabase.from('products').select(`
    id, name, sku,
    product_images!left (public_url, is_primary)
  `);

// Enrichissement MANDATORY
const enriched = data.map(p => ({
  ...p,
  primary_image_url: p.product_images?.[0]?.public_url || null,
}));

// ❌ INTERDIT : products.primary_image_url (colonne supprimée)
```

---

## 🧩 COMPOSANTS UI-V2 (Design System V2)

### ButtonV2

**Variants** :

- `primary` : Action principale (CTA)
- `secondary` : Actions secondaires
- `outline` : Actions neutres
- `ghost` : Actions discrètes
- `danger` : Actions destructives

**Sizes** :

- `sm` : Petits boutons (interfaces denses)
- `md` : Taille par défaut
- `lg` : Boutons proéminents (hero sections)

**Usage** :

```typescript
import { ButtonV2 } from '@/components/ui/button'

<ButtonV2 variant="primary" size="md" icon={Plus}>
  Nouveau Produit
</ButtonV2>
```

### InputV2

**Variants** :

- `default` : Champ standard
- `error` : Erreur validation
- `success` : Validation réussie

**Props** :

- `error` : Message d'erreur (affiche automatiquement variant error)
- `success` : Message de succès

### KPI Card

**Usage** :

```typescript
import { KPICard } from '@/components/ui-v2/kpi-card'

<KPICard
  title="Chiffre d'affaires"
  value="124 500 €"
  trend={+12.5}
  period="vs mois dernier"
  icon={TrendingUp}
  variant="success"
/>
```

---

## 🎨 COMPOSANT PATTERN

**Template minimal** :

```typescript
// src/components/ui-v2/new-component.tsx
import { cn } from '@/lib/utils'
import { spacing, colors } from '@/lib/design-system'

interface NewComponentProps {
  variant?: 'default' | 'accent'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children: React.ReactNode
}

export function NewComponent({
  variant = 'default',
  size = 'md',
  className,
  children
}: NewComponentProps) {
  return (
    <div
      className={cn(
        // Base styles
        'rounded-lg transition-all',

        // Variant styles
        variant === 'default' && 'bg-white border border-neutral-200',
        variant === 'accent' && 'bg-gradient-to-r from-primary to-accent',

        // Size styles
        size === 'sm' && 'p-2 text-sm',
        size === 'md' && 'p-4',
        size === 'lg' && 'p-6 text-lg',

        className
      )}
    >
      {children}
    </div>
  )
}
```

---

## 📚 DOCUMENTATION RÉFÉRENCES

- **Design tokens** : `src/lib/design-system/tokens.ts`
- **Thème V2** : `src/lib/theme-v2.ts`
- **Composants** : `src/components/ui-v2/`
- **Stories** : `src/stories/`
- **Figma** : [Lien vers maquettes si disponible]

---

**Dernière mise à jour** : 2025-10-23
**Mainteneur** : Romeo Dos Santos
