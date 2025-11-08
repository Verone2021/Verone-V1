# Guide Design System V2 - Vérone Back-Office

**Date** : 2025-11-07
**Auteur** : verone-design-expert agent
**Public** : Développeurs front-end Vérone
**Objectif** : Documentation usage et contribution composants génériques

---

## Introduction

### Vision Design System

Le Design System V2 de Vérone est un système de composants UI **moderne, accessible et maintenable** basé sur :

- ✅ **shadcn/ui** : Copy-paste architecture (ownership total du code)
- ✅ **Radix UI** : Primitives headless accessibles (WAI-ARIA)
- ✅ **Tailwind CSS** : Utility-first styling avec design tokens
- ✅ **CVA** : Class Variance Authority pour variants cohérents
- ✅ **TypeScript strict** : Types exhaustifs, 0 `any`

**Philosophie** : "Composants génériques réutilisables + Composition business-specific"

---

## Table des Matières

1. [Quick Start](#quick-start)
2. [Composants Génériques - Guide Complet](#composants-génériques---guide-complet)
3. [Bonnes Pratiques Contribution](#bonnes-pratiques-contribution)
4. [Guidelines Styling](#guidelines-styling)
5. [Accessibilité WCAG 2.2 AA](#accessibilité-wcag-22-aa)
6. [Performance Targets](#performance-targets)
7. [Integration Storybook](#integration-storybook)

---

## Quick Start

### Installation

Les composants sont **déjà installés** dans le projet. Pas besoin d'installer de packages supplémentaires.

### Importer un Composant

```typescript
// Import depuis src/components/ui/
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
```

### Utiliser avec Variants

```typescript
import { Button } from '@/components/ui/button'
import { Save } from 'lucide-react'

export function MyComponent() {
  return (
    <div className="space-y-4">
      {/* Bouton primaire simple */}
      <Button variant="default">Enregistrer</Button>

      {/* Bouton avec icône et loading */}
      <Button
        variant="default"
        icon={<Save className="h-4 w-4" />}
        loading={isSubmitting}
      >
        Enregistrer
      </Button>

      {/* Bouton destructive */}
      <Button variant="destructive">Supprimer</Button>
    </div>
  )
}
```

---

## Composants Génériques - Guide Complet

### 1. Button

**Import** :

```typescript
import { Button } from '@/components/ui/button'
```

**Props disponibles** :

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link' \| 'gradient' \| 'glass'` | `'default'` | Style du bouton |
| `size` | `'default' \| 'sm' \| 'lg' \| 'icon'` | `'default'` | Taille du bouton |
| `loading` | `boolean` | `false` | État chargement (affiche spinner) |
| `icon` | `ReactNode` | - | Icône left/right |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Position icône |
| `asChild` | `boolean` | `false` | Render as child (polymorphic) |
| `disabled` | `boolean` | `false` | Bouton désactivé |

**Exemples par use-case** :

```typescript
import { Button } from '@/components/ui/button'
import { Save, Plus, Trash2, Download, ChevronRight } from 'lucide-react'
import Link from 'next/link'

// 1. Bouton primaire action principale
<Button variant="default">
  Enregistrer
</Button>

// 2. Bouton avec loading state
<Button variant="default" loading={isSubmitting}>
  Enregistrer
</Button>

// 3. Bouton danger (suppression, actions destructives)
<Button variant="destructive" onClick={handleDelete}>
  Supprimer
</Button>

// 4. Bouton outline (actions secondaires)
<Button variant="outline" icon={<Plus className="h-4 w-4" />}>
  Ajouter produit
</Button>

// 5. Bouton ghost (actions tertiaires, toolbars)
<Button variant="ghost" size="icon" aria-label="Paramètres">
  <Settings className="h-4 w-4" />
</Button>

// 6. Bouton link (navigation inline)
<Button variant="link">
  En savoir plus
</Button>

// 7. Bouton gradient (CTA premium, highlights)
<Button variant="gradient" size="lg">
  Découvrir les nouveautés
</Button>

// 8. Bouton glass (overlays, modals)
<Button variant="glass">
  Fermer
</Button>

// 9. Bouton polymorphic (Link Next.js)
<Button asChild variant="default">
  <Link href="/catalogue">Voir le catalogue</Link>
</Button>

// 10. Bouton avec icône droite
<Button
  variant="default"
  icon={<ChevronRight className="h-4 w-4" />}
  iconPosition="right"
>
  Suivant
</Button>

// 11. Bouton disabled
<Button variant="default" disabled>
  Indisponible
</Button>

// 12. Bouton download
<Button variant="outline" icon={<Download className="h-4 w-4" />}>
  Télécharger rapport
</Button>
```

**Do's & Don'ts** :

✅ **DO**
- Utiliser `variant="destructive"` pour actions de suppression
- Ajouter `loading={true}` pour actions async
- Préférer `iconPosition="left"` pour boutons CTA principaux
- Utiliser `aria-label` pour boutons icon seuls
- Utiliser `asChild` avec Link pour navigation

❌ **DON'T**
- Créer custom bouton sans vérifier variants disponibles
- Utiliser inline styles (toujours passer par CVA variants)
- Omettre loading state pour actions serveur
- Utiliser plusieurs boutons `variant="default"` côte à côte (hiérarchie visuelle)
- Oublier `aria-label` sur boutons icon

---

### 2. KPICard

**Import** :

```typescript
import { KPICard } from '@/components/ui/kpi-card'
```

**Props disponibles** :

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'compact' \| 'elegant' \| 'detailed'` | `'compact'` | Layout du card |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Hauteur minimum |
| `title` | `string` | - | Titre du KPI (requis) |
| `value` | `string \| number` | - | Valeur principale (requis) |
| `change` | `number \| { value: number; label: string }` | - | Évolution (%) |
| `description` | `string` | - | Description/subtitle |
| `icon` | `ReactNode` | - | Icône (variant compact/detailed) |
| `actions` | `ReactNode` | - | Actions (variant detailed) |
| `trend` | `'up' \| 'down' \| 'neutral'` | auto | Direction trend (couleur) |

**Exemples** :

```typescript
import { KPICard } from '@/components/ui/kpi-card'
import { Euro, Users, ShoppingCart, TrendingUp } from 'lucide-react'

// 1. KPI compact (dashboard overview)
<KPICard
  variant="compact"
  title="Chiffre d'affaires"
  value="€45,231"
  change={12.5}
  icon={<Euro className="h-6 w-6" />}
/>

// 2. KPI elegant (highlights)
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

// 4. KPI sans change (statique)
<KPICard
  variant="compact"
  title="Produits catalogue"
  value="12,543"
  icon={<ShoppingCart className="h-6 w-6" />}
/>

// 5. KPI avec change personnalisé
<KPICard
  variant="compact"
  title="Taux conversion"
  value="3.2%"
  change={{ value: 0.5, label: '+0.5 points' }}
  trend="up"
  icon={<TrendingUp className="h-6 w-6" />}
/>

// 6. KPI grid dashboard
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <KPICard variant="compact" title="Revenue" value="€45k" change={12} />
  <KPICard variant="compact" title="Orders" value="234" change={-3} />
  <KPICard variant="compact" title="Users" value="1.2k" change={8} />
  <KPICard variant="compact" title="Products" value="543" />
</div>
```

**Do's & Don'ts** :

✅ **DO**
- Utiliser `variant="compact"` pour dashboards (4-6 KPIs)
- Utiliser `variant="elegant"` pour highlights/hero sections
- Utiliser `variant="detailed"` pour pages dédiées KPI
- Fournir `change` pour KPIs temporels (évolution)
- Utiliser `trend` explicit si logique métier complexe

❌ **DON'T**
- Mélanger plusieurs variants dans même grid
- Omettre `description` si valeur nécessite contexte
- Utiliser `variant="detailed"` dans grids compacts
- Oublier unités dans `value` (€, %, unités)
- Créer custom KPI card sans vérifier variants

---

### 3. Badge

**Import** :

```typescript
import { Badge } from '@/components/ui/badge'
```

**Props disponibles** :

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'secondary' \| 'destructive' \| 'outline' \| 'success' \| 'warning' \| 'info' \| 'customer' \| 'supplier' \| 'partner'` | `'default'` | Style du badge |

**Exemples** :

```typescript
import { Badge } from '@/components/ui/badge'

// Badges génériques
<Badge variant="default">New</Badge>
<Badge variant="secondary">Beta</Badge>
<Badge variant="success">Actif</Badge>
<Badge variant="destructive">Archivé</Badge>
<Badge variant="warning">En attente</Badge>
<Badge variant="info">Info</Badge>
<Badge variant="outline">Draft</Badge>

// Badges métier
<Badge variant="customer">Client Pro</Badge>
<Badge variant="supplier">Fournisseur Vérifié</Badge>
<Badge variant="partner">Partenaire Premium</Badge>

// Status badges
function getStatusBadge(status: OrderStatus) {
  const variants = {
    pending: 'warning',
    confirmed: 'info',
    shipped: 'success',
    delivered: 'success',
    cancelled: 'destructive',
  } as const

  const labels = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    cancelled: 'Annulée',
  }

  return <Badge variant={variants[status]}>{labels[status]}</Badge>
}
```

**Do's & Don'ts** :

✅ **DO**
- Utiliser variants sémantiques (`success` pour actif, `destructive` pour erreur)
- Créer mapping functions pour status métier
- Garder texte badge court (<20 caractères)

❌ **DON'T**
- Créer custom badge pour chaque status (utiliser mapping)
- Utiliser badge pour actions (utiliser Button)
- Texte trop long (utiliser Tooltip si nécessaire)

---

### 4. Card (Compound Components)

**Import** :

```typescript
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
```

**Exemples** :

```typescript
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
        <span className="text-sm text-muted-foreground">Prix:</span>
        <span className="font-semibold">€89.99</span>
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-muted-foreground">Stock:</span>
        <Badge variant="success">En stock (45)</Badge>
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

// 4. Card grid layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>
    <CardHeader>
      <CardTitle>Feature 1</CardTitle>
    </CardHeader>
    <CardContent>
      <p>Description feature 1</p>
    </CardContent>
  </Card>
  {/* ... autres cards */}
</div>
```

---

### 5. Dialog / Modal

**Import** :

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog'
```

**Exemples** :

```typescript
// 1. Dialog simple avec trigger
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Ouvrir dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Dialog description expliquant le contexte
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      {/* Content */}
    </div>
    <DialogFooter>
      <Button variant="outline">Annuler</Button>
      <Button variant="default">Confirmer</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// 2. Dialog controlled (programmatic)
const [open, setOpen] = useState(false)

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Êtes-vous sûr ?</DialogTitle>
      <DialogDescription>
        Cette action est irréversible.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Annuler
      </Button>
      <Button
        variant="destructive"
        onClick={() => {
          handleDelete()
          setOpen(false)
        }}
      >
        Supprimer
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Trigger programmatic
<Button onClick={() => setOpen(true)}>Ouvrir</Button>
```

---

### 6. Form Components

**Input** :

```typescript
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Input simple
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="email@example.com"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</div>

// Input avec error
<div className="space-y-2">
  <Label htmlFor="name">Nom</Label>
  <Input
    id="name"
    className={errors.name && "border-destructive"}
    {...register('name')}
  />
  {errors.name && (
    <p className="text-sm text-destructive">{errors.name.message}</p>
  )}
</div>
```

**Select** :

```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Sélectionner..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>
```

**Checkbox** :

```typescript
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

<div className="flex items-center space-x-2">
  <Checkbox
    id="terms"
    checked={accepted}
    onCheckedChange={setAccepted}
  />
  <Label htmlFor="terms" className="cursor-pointer">
    J'accepte les conditions
  </Label>
</div>
```

---

## Bonnes Pratiques Contribution

### Ajouter Nouveau Variant

**Procédure** :

1. **Identifier besoin** non couvert par variants existants
2. **Vérifier** qu'aucun variant existant convient (check Storybook)
3. **Ajouter variant** dans CVA config
4. **Créer story** Storybook
5. **Documenter** dans ce guide
6. **PR** avec exemples usage

**Exemple : Ajouter variant Button**

```typescript
// src/components/ui/button.tsx

const buttonVariants = cva(
  "inline-flex items-center...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        // ... existing variants

        // ✨ NOUVEAU : Variant success
        success: "bg-success text-success-foreground hover:bg-success/90"
      }
    }
  }
)
```

```typescript
// button.stories.tsx - Ajouter story

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Valider',
  },
}
```

---

### Modifier Composant Existant

**Règles strictes** :

- ⚠️ **Breaking changes interdits** sans migration plan
- ✅ Backward compatibility obligatoire
- ✅ Deprecation warnings si suppression props
- ✅ Tests regression avant merge

**Workflow** :

```typescript
// 1. Créer issue GitHub
// Title: [Button] Add support for icon size prop
// Description: Use case, examples, API proposal

// 2. Proposer modification props (non-breaking)
interface ButtonProps {
  // ... existing props
  iconSize?: 'sm' | 'md' | 'lg'  // ✅ Optional prop (non-breaking)
}

// 3. Implémenter + tests
export const Button = ({ iconSize = 'md', ... }) => {
  const iconSizeMap = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }
  // ...
}

// 4. Update Storybook stories
export const WithCustomIconSize: Story = {
  args: { icon: <Save />, iconSize: 'lg' }
}

// 5. Update documentation
// Ce guide : section Button, ajouter prop iconSize

// 6. PR review obligatoire
```

---

### Checklist Validation Nouveau Composant

**Avant créer nouveau composant générique** :

- [ ] ✅ Vérifier qu'aucun composant existant convient
- [ ] ✅ Design aligné Design System V2 tokens
- [ ] ✅ TypeScript strict (pas de `any`)
- [ ] ✅ Props minimales mais configurables
- [ ] ✅ Variants CVA pour styles
- [ ] ✅ Accessibilité WCAG 2.2 AA complète
- [ ] ✅ Storybook story avec tous variants
- [ ] ✅ Tests visuels (screenshots before/after)
- [ ] ✅ Documentation dans ce guide
- [ ] ✅ Performance validée (<100ms render)

**Template nouveau composant** :

```typescript
// src/components/ui/my-component.tsx

import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const myComponentVariants = cva(
  // Base classes
  "base-class-1 base-class-2",
  {
    variants: {
      variant: {
        default: "variant-default-classes",
        secondary: "variant-secondary-classes"
      },
      size: {
        sm: "size-sm-classes",
        md: "size-md-classes",
        lg: "size-lg-classes"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
)

export interface MyComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof myComponentVariants> {
  // Additional props
}

export function MyComponent({
  className,
  variant,
  size,
  ...props
}: MyComponentProps) {
  return (
    <div
      className={cn(myComponentVariants({ variant, size }), className)}
      {...props}
    />
  )
}
```

---

## Guidelines Styling

### CVA (Class Variance Authority) Obligatoire

**Pattern standard** :

```typescript
import { cva } from 'class-variance-authority'

const componentVariants = cva(
  // Base classes (toujours appliquées)
  "rounded-md font-medium transition-colors",
  {
    variants: {
      // Variant groups
      variant: {
        default: "bg-primary text-white",
        outline: "border border-input"
      },
      size: {
        sm: "px-2 py-1 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base"
      }
    },
    // Compound variants (combinaisons spécifiques)
    compoundVariants: [
      {
        variant: "outline",
        size: "sm",
        className: "border-2"  // Outline small → border plus épais
      }
    ],
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
)
```

**❌ Éviter** :

```typescript
// ❌ Inline conditions (difficile à maintenir)
className={`px-4 py-2 ${variant === 'primary' ? 'bg-blue-600' : 'bg-gray-200'} ${size === 'lg' ? 'text-lg' : 'text-sm'}`}

// ❌ Object styles (pas Tailwind)
style={{ backgroundColor: variant === 'primary' ? '#4F46E5' : '#E5E7EB' }}
```

---

### Design Tokens Application

**Utiliser CSS variables** :

```typescript
// ✅ DO : Semantic tokens
className="bg-primary text-primary-foreground"
className="border-border text-muted-foreground"
className="bg-success text-success-foreground"

// ❌ DON'T : Hardcoded colors
className="bg-blue-500 text-white"
className="border-gray-200 text-gray-600"
```

**Tokens disponibles** :

```css
/* Colors */
--primary, --primary-foreground
--secondary, --secondary-foreground
--success, --success-foreground
--destructive, --destructive-foreground
--muted, --muted-foreground
--accent, --accent-foreground
--border, --input, --ring

/* Spacing : utiliser scale Tailwind (p-4, m-6, gap-2) */
/* Typography : text-xs, text-sm, text-base, text-lg, text-xl, text-2xl */
/* Shadows : shadow-sm, shadow-md, shadow-lg, shadow-xl */
/* Radius : rounded-sm, rounded-md, rounded-lg, rounded-xl, rounded-full */
```

---

### Responsive Breakpoints

**Breakpoints Tailwind standard** :

```typescript
sm: '640px'   // Mobile landscape
md: '768px'   // Tablet
lg: '1024px'  // Desktop
xl: '1280px'  // Large desktop
2xl: '1536px' // Extra large
```

**Pattern mobile-first** :

```typescript
// ✅ DO : Mobile-first approach
<div className="flex flex-col md:flex-row lg:gap-6">
  {/* Mobile : column, Tablet+ : row, Desktop+ : gap-6 */}
</div>

// ✅ DO : Grid responsive
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Mobile : 1 col, Tablet : 2 cols, Desktop : 4 cols */}
</div>

// ❌ DON'T : Desktop-first
<div className="flex flex-row lg:flex-col">
  {/* Anti-pattern : défaut desktop */}
</div>
```

---

### Dark Mode Support

**Utiliser `dark:` variant** :

```typescript
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  {/* Light : bg-white text-gray-900 */}
  {/* Dark : bg-gray-900 text-white */}
</div>

// Semantic tokens (auto dark mode via CSS variables)
<div className="bg-background text-foreground">
  {/* Adapte automatiquement selon theme */}
</div>
```

---

## Accessibilité WCAG 2.2 AA

### Checklist ARIA Attributes

**Boutons** :

```typescript
// ✅ Bouton avec label texte
<Button>Enregistrer</Button>  // aria-label auto depuis children

// ✅ Bouton icon avec aria-label
<Button variant="ghost" size="icon" aria-label="Paramètres">
  <Settings className="h-4 w-4" />
</Button>

// ✅ Toggle button avec aria-pressed
<Button
  variant={isActive ? 'default' : 'outline'}
  onClick={() => setIsActive(!isActive)}
  aria-pressed={isActive}
>
  {isActive ? 'Actif' : 'Inactif'}
</Button>

// ✅ Loading state avec aria-busy
<Button loading={isSubmitting} aria-busy={isSubmitting}>
  Enregistrer
</Button>

// ✅ Dropdown trigger avec aria-expanded
<Button aria-expanded={isOpen} aria-controls="dropdown-menu">
  Menu
</Button>
```

**Forms** :

```typescript
// ✅ Label associé input
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" aria-required="true" />

// ✅ Input avec error
<Label htmlFor="name">Nom</Label>
<Input
  id="name"
  aria-invalid={!!errors.name}
  aria-describedby={errors.name ? "name-error" : undefined}
/>
{errors.name && (
  <p id="name-error" className="text-sm text-destructive" role="alert">
    {errors.name.message}
  </p>
)}

// ✅ Input avec help text
<Label htmlFor="password">Mot de passe</Label>
<Input
  id="password"
  type="password"
  aria-describedby="password-help"
/>
<p id="password-help" className="text-xs text-muted-foreground">
  Minimum 8 caractères
</p>
```

**Modals/Dialogs** :

```typescript
// Radix UI Dialog gère automatiquement :
// - aria-labelledby (DialogTitle)
// - aria-describedby (DialogDescription)
// - Focus trap
// - Escape key close
// - Body scroll lock

<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>  {/* Auto aria-labelledby */}
        Confirmer suppression
      </DialogTitle>
      <DialogDescription>  {/* Auto aria-describedby */}
        Cette action est irréversible
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

---

### Keyboard Navigation

**Patterns obligatoires** :

| Composant | Keys | Comportement |
|-----------|------|--------------|
| **Button** | `Enter`, `Space` | Activer bouton |
| **Dialog** | `Escape` | Fermer modal |
| **Dropdown** | `Arrow Up/Down` | Naviguer items |
| **Tabs** | `Arrow Left/Right` | Changer tab |
| **Combobox** | `Arrow Up/Down`, `Enter` | Sélectionner option |
| **Checkbox** | `Space` | Toggle checked |

**Tous composants** :

- ✅ **Focusable** : `tabindex="0"` pour interactifs
- ✅ **Focus visible** : Outline automatique (Tailwind `focus-visible:ring`)
- ✅ **Skip links** : Navigation rapide contenu principal

---

### Color Contrast

**Ratios minimum WCAG AA** :

| Type | Ratio | Exemple |
|------|-------|---------|
| **Normal text** (<18px) | 4.5:1 | Body text, labels |
| **Large text** (>18px ou bold >14px) | 3:1 | Headings, buttons |
| **UI components** | 3:1 | Borders, icons |

**Validation automatique** :

```bash
# Vérifier contraste
npm run a11y:check

# Lighthouse audit
npm run lighthouse
```

**Tokens conformes** :

```typescript
// ✅ Conformes WCAG AA
text-foreground / bg-background       // 13:1 (excellent)
text-muted-foreground / bg-background // 4.6:1 (AA)
border-border / bg-background         // 3.2:1 (UI components OK)

// ❌ Non-conformes (à éviter)
text-gray-400 / bg-white              // 2.8:1 (fail AA)
```

---

## Performance Targets

### Bundle Size Limits

**Targets par composant** :

| Composant | Max Size | Actuel | Status |
|-----------|----------|--------|--------|
| Button | 2kb | 1.5kb | ✅ |
| Card | 3kb | 2.8kb | ✅ |
| Dialog | 5kb | 4.2kb | ✅ |
| Select | 6kb | 5.8kb | ✅ |
| Table | 8kb | 7.5kb | ✅ |

**Validation** :

```bash
# Analyze bundle
npm run analyze

# Check specific component size
npm run size -- src/components/ui/button.tsx
```

---

### Render Performance

**Target : <100ms par composant**

**Profiling** :

```typescript
import { Profiler } from 'react'

function onRenderCallback(
  id: string,
  phase: "mount" | "update",
  actualDuration: number
) {
  console.log(`${id} ${phase} took ${actualDuration}ms`)
}

<Profiler id="Button" onRender={onRenderCallback}>
  <Button>Test</Button>
</Profiler>
```

**React.memo selective** :

```typescript
// ✅ Composants render intensifs → memo
export const DataTable = React.memo(function DataTable({ data }: Props) {
  // Render lourd (mapping 1000+ rows)
}, (prev, next) => prev.data === next.data)

// ❌ Composants simples → pas memo
export function Badge({ children }: Props) {
  // Render léger
  return <span>{children}</span>
}
```

---

### Tree-Shaking Validation

**Imports named (tree-shakable)** :

```typescript
// ✅ DO : Named imports
import { Button, Badge } from '@/components/ui'

// ❌ DON'T : Default import all
import * as UI from '@/components/ui'
```

**Barrel exports optimized** :

```typescript
// src/components/ui/index.ts

// ✅ Named re-exports (tree-shakable)
export { Button } from './button'
export { Badge } from './badge'
export { Card, CardHeader, CardContent } from './card'

// ❌ Export * (bundler peut avoir difficultés)
export * from './button'
```

---

## Integration Storybook

### Structure Story Standard

**Template obligatoire** :

```typescript
// ComponentName.stories.tsx

import type { Meta, StoryObj } from '@storybook/react'
import { ComponentName } from './component-name'

const meta: Meta<typeof ComponentName> = {
  title: 'UI/ComponentName',  // Catégorie/Nom
  component: ComponentName,
  parameters: {
    layout: 'centered',  // ou 'fullscreen', 'padded'
  },
  tags: ['autodocs'],  // Auto-generate docs
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive']
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg']
    },
    disabled: {
      control: 'boolean'
    }
  }
}

export default meta
type Story = StoryObj<typeof ComponentName>

// Story principale (default)
export const Default: Story = {
  args: {
    children: 'Component',
  },
}

// Stories variants
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
}

// Story interactive
export const WithIcon: Story = {
  args: {
    children: 'With Icon',
    icon: '🚀'
  },
}
```

---

### Documentation Interactive (MDX)

```mdx
<!-- ComponentName.mdx -->

import { Canvas, Meta, Controls } from '@storybook/blocks'
import * as ComponentStories from './ComponentName.stories'

<Meta of={ComponentStories} />

# ComponentName

Description du composant, use cases, best practices.

## Usage

<Canvas of={ComponentStories.Default} />

## Props

<Controls of={ComponentStories.Default} />

## Variants

### Secondary
<Canvas of={ComponentStories.Secondary} />

### Disabled
<Canvas of={ComponentStories.Disabled} />

## Best Practices

- ✅ DO: Utiliser variant sémantique
- ❌ DON'T: Créer custom component sans check variants
```

---

### Tests Visuels Chromatic

**Configuration CI** :

```yaml
# .github/workflows/chromatic.yml

name: Chromatic

on: [push, pull_request]

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v3
      - run: npm ci

      - name: Publish to Chromatic
        uses: chromaui/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          exitZeroOnChanges: true
```

---

## Ressources & Support

### Documentation Externe

| Resource | URL | Description |
|----------|-----|-------------|
| **shadcn/ui** | [ui.shadcn.com](https://ui.shadcn.com) | Composants base + docs |
| **Radix UI** | [radix-ui.com](https://radix-ui.com) | Primitives headless |
| **CVA** | [cva.style](https://cva.style) | Variant system |
| **Tailwind CSS** | [tailwindcss.com](https://tailwindcss.com) | Utility classes |
| **WCAG 2.2** | [w3.org/WAI/WCAG22](https://www.w3.org/WAI/WCAG22/quickref/) | Accessibilité |

### Contact

- **Issues GitHub** : [github.com/verone/issues](...)
- **Slack channel** : #design-system
- **Maintainer** : Romeo Dos Santos

---

**Fin du Guide Design System V2**

**Happy coding! 🎨**
