# 🎨 ButtonUnified Patterns 2025

**Mise à jour:** 2025-11-11
**Version:** ButtonUnified v2.1.0 (Pattern Hybride) + IconButton v1.0.0

---

## 📚 Table des Matières

1. [Pattern 1: Icon Prop (Recommandé)](#pattern-1-icon-prop-recommandé)
2. [Pattern 2: JSX Children Icons (Nouveau 2025)](#pattern-2-jsx-children-icons-nouveau-2025)
3. [Pattern 3: Icon-only (IconButton)](#pattern-3-icon-only-iconbutton)
4. [Quand Utiliser Quel Pattern?](#quand-utiliser-quel-pattern)
5. [Exemples Avancés](#exemples-avancés)
6. [Migration Guide](#migration-guide)

---

## Pattern 1: Icon Prop (Recommandé)

**Simplicité + Gestion automatique taille/spacing**

### Usage Basique

```tsx
import { ButtonUnified } from '@verone/ui';
import { Save, CheckCircle, Trash2 } from 'lucide-react';

// Icon gauche (défaut)
<ButtonUnified icon={Save} variant="default">
  Enregistrer
</ButtonUnified>

// Icon droite
<ButtonUnified icon={Save} iconPosition="right" variant="default">
  Enregistrer
</ButtonUnified>
```

### Variants Sémantiques CRUD

```tsx
// Success (Confirmer, Valider, Approuver)
<ButtonUnified icon={CheckCircle} variant="success">
  Confirmer
</ButtonUnified>

// Danger (Supprimer, Annuler, Rejeter)
<ButtonUnified icon={Trash2} variant="danger">
  Supprimer
</ButtonUnified>
```

### Sizes Disponibles

```tsx
// Extra Small (7px height)
<ButtonUnified icon={Edit} size="xs">Modifier</ButtonUnified>

// Small (9px height) - Tables compactes
<ButtonUnified icon={Edit} size="sm">Modifier</ButtonUnified>

// Medium (10px height) - Défaut
<ButtonUnified icon={Edit} size="md">Modifier</ButtonUnified>

// Large (11px height) - CTAs
<ButtonUnified icon={Save} size="lg">Enregistrer</ButtonUnified>

// Extra Large (12px height) - Hero sections
<ButtonUnified icon={Plus} size="xl">Nouveau Produit</ButtonUnified>
```

### Loading State

```tsx
const [isSubmitting, setIsSubmitting] = useState(false);

<ButtonUnified
  icon={Save}
  variant="default"
  loading={isSubmitting}
  onClick={handleSubmit}
>
  Enregistrer
</ButtonUnified>;
// Loading: Affiche Loader2 spinner automatiquement
```

### Polymorphic (asChild)

```tsx
import Link from 'next/link';

<ButtonUnified icon={Eye} variant="outline" asChild>
  <Link href="/products/123">Voir Détails</Link>
</ButtonUnified>;
// Render: <a> avec styles button
```

---

## Pattern 2: JSX Children Icons (Nouveau 2025)

**Flexibilité maximale + shadcn/ui style moderne**

### Usage Basique

```tsx
import { ButtonUnified } from '@verone/ui';
import { CopyIcon, DownloadIcon } from 'lucide-react';

// Icon manuel avant texte
<ButtonUnified variant="outline" className="border-sky-600 text-sky-600">
  <CopyIcon />
  Duplicate
</ButtonUnified>

// Border dashed (download style)
<ButtonUnified variant="outline" className="border-dashed shadow-none">
  <DownloadIcon />
  Download
</ButtonUnified>
```

### Layouts Complexes

#### Icon + Badge Notification

```tsx
import { MessageSquareIcon } from 'lucide-react';

<ButtonUnified variant="outline" className="relative">
  <MessageSquareIcon />
  Messages
  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
    3
  </span>
</ButtonUnified>;
```

#### Multiple Icons

```tsx
import { CheckIcon, ChevronDownIcon } from 'lucide-react';

<ButtonUnified variant="outline">
  <CheckIcon className="mr-1" />
  Sélectionné
  <ChevronDownIcon className="ml-1" />
</ButtonUnified>;
```

#### Icon + Loading Custom

```tsx
const [isProcessing, setIsProcessing] = useState(false);

<ButtonUnified variant="outline" disabled={isProcessing}>
  {isProcessing ? (
    <>
      <Loader2 className="animate-spin" />
      Traitement...
    </>
  ) : (
    <>
      <SendIcon />
      Envoyer
    </>
  )}
</ButtonUnified>;
```

### Semantic Colors Custom

```tsx
// Sky (Duplication, Info)
<ButtonUnified
  variant="outline"
  className="border-sky-600 text-sky-600 hover:bg-sky-50 hover:border-sky-700 hover:text-sky-700"
>
  <CopyIcon />
  Duplicate
</ButtonUnified>

// Amber (Warning, Sécurité)
<ButtonUnified
  variant="outline"
  className="border-amber-600 text-amber-600 hover:bg-amber-50"
>
  <ShieldIcon />
  Sécurité
</ButtonUnified>

// Purple (Premium, Upgrade)
<ButtonUnified
  variant="outline"
  className="border-purple-600 text-purple-600 hover:bg-purple-50"
>
  <SparklesIcon />
  Upgrade
</ButtonUnified>
```

---

## Pattern 3: Icon-only (IconButton)

**Tables denses + Tooltip intégré + Accessibilité WCAG AA**

### Usage Basique

```tsx
import { IconButton } from '@verone/ui';
import { Eye, Edit, Trash2, CheckCircle, Ban } from 'lucide-react';

// Bouton icon-only avec tooltip automatique
<IconButton
  icon={Eye}
  variant="outline"
  size="sm"
  label="Voir les détails"
  onClick={handleView}
/>

// Boutons sémantiques CRUD
<IconButton icon={CheckCircle} variant="success" label="Confirmer" />
<IconButton icon={Trash2} variant="danger" label="Supprimer" />
<IconButton icon={Edit} variant="outline" label="Éditer" />
```

### Variants Disponibles (10)

```tsx
// Tous variants ButtonUnified supportés
<IconButton icon={Eye} variant="default" label="Action" />
<IconButton icon={Eye} variant="outline" label="Action" />      // ← Plus courant
<IconButton icon={Eye} variant="ghost" label="Action" />
<IconButton icon={Eye} variant="success" label="Confirmer" />   // ← CRUD
<IconButton icon={Eye} variant="danger" label="Supprimer" />    // ← CRUD
<IconButton icon={Eye} variant="gradient" label="Premium" />
<IconButton icon={Eye} variant="glass" label="Modern" />
```

### Sizes Disponibles (3)

```tsx
// Small (32x32px, icon 14px) - Tables denses
<IconButton icon={Edit} size="sm" label="Modifier" />

// Medium (40x40px, icon 16px) - Défaut
<IconButton icon={Edit} size="md" label="Modifier" />

// Large (48x48px, icon 18px) - Headers, CTAs
<IconButton icon={Edit} size="lg" label="Modifier" />
```

### Disabled State (Tooltip fonctionnel)

```tsx
const [canCancel, setCanCancel] = useState(false);

<IconButton
  icon={Ban}
  variant="outline"
  size="sm"
  label="Impossible d'annuler : commande déjà reçue"
  disabled={!canCancel}
/>;
// ✅ Tooltip s'affiche même si disabled (accessibilité)
```

### Loading State

```tsx
const [isDeleting, setIsDeleting] = useState(false);

<IconButton
  icon={Trash2}
  variant="danger"
  label="Supprimer"
  loading={isDeleting}
  onClick={handleDelete}
/>;
// Loading: Affiche Loader2 spinner automatiquement
```

### Button Group Compact (Tables)

```tsx
// Use case réel : Page commandes fournisseurs
<div className="flex items-center gap-2">
  <IconButton icon={Eye} variant="outline" size="sm" label="Voir détails" />
  <IconButton icon={Edit} variant="outline" size="sm" label="Éditer" />
  <IconButton icon={CheckCircle} variant="success" size="sm" label="Valider" />
  <IconButton icon={Ban} variant="danger" size="sm" label="Annuler" />
  <IconButton icon={Trash2} variant="danger" size="sm" label="Supprimer" />
</div>
// Gain espace : ~84px par bouton vs ButtonUnified avec text
```

### Tooltip Position Custom

```tsx
// Position tooltip si bouton près bord tableau
<IconButton
  icon={Eye}
  variant="outline"
  label="Voir détails"
  tooltipSide="top" // top | right | bottom | left
/>
```

### Accessibilité WCAG AA

```tsx
// ✅ Tooltip intégré automatiquement (Radix UI)
// ✅ aria-label automatique (prop label)
// ✅ Keyboard navigation (Tab + Enter)
// ✅ Disabled state avec tooltip fonctionnel
// ✅ Focus visible ring

<IconButton icon={Save} label="Enregistrer" />
// Génère automatiquement : aria-label="Enregistrer"
// Tooltip au hover/focus : "Enregistrer"
```

---

## Quand Utiliser Quel Pattern?

### ✅ Pattern 1 (Icon Prop) - Cas d'Usage

**Recommandé pour:**

- ✅ Boutons simples icon + text (95% des cas)
- ✅ Gestion automatique taille icon selon `size`
- ✅ Spacing icon-text automatique (`gap-2`)
- ✅ Loading state built-in
- ✅ Code plus concis

**Exemples:**

```tsx
// CRUD actions standard
<ButtonUnified icon={Save} variant="default">Enregistrer</ButtonUnified>
<ButtonUnified icon={Edit} variant="outline">Modifier</ButtonUnified>
<ButtonUnified icon={Trash2} variant="danger">Supprimer</ButtonUnified>
```

---

### ✅ Pattern 2 (JSX Children) - Cas d'Usage

**Recommandé pour:**

- ✅ Layouts complexes (icon + badge, multiple icons)
- ✅ Custom spacing/positioning icon
- ✅ Semantic colors custom (ex: sky-600)
- ✅ Animations icon custom
- ✅ Style shadcn/ui moderne

**Exemples:**

```tsx
// Badge notification
<ButtonUnified variant="outline">
  <BellIcon />
  Notifications
  <span className="badge">5</span>
</ButtonUnified>

// Custom semantic color
<ButtonUnified variant="outline" className="border-sky-600 text-sky-600">
  <CopyIcon />
  Duplicate
</ButtonUnified>
```

---

### ✅ Pattern 3 (Icon-only IconButton) - Cas d'Usage

**Recommandé pour:**

- ✅ Tables denses avec multiples actions CRUD
- ✅ Toolbars avec boutons répétitifs
- ✅ Interfaces mobiles space-constrained
- ✅ Boutons où text est redondant (contexte clair)
- ✅ Accessibilité WCAG AA garantie (tooltip + aria-label intégrés)

**Exemples:**

```tsx
// Table dense avec 5 actions par ligne
<IconButton icon={Eye} variant="outline" size="sm" label="Voir" />
<IconButton icon={Edit} variant="outline" size="sm" label="Éditer" />
<IconButton icon={CheckCircle} variant="success" size="sm" label="Valider" />
<IconButton icon={Ban} variant="danger" size="sm" label="Annuler" />
<IconButton icon={Trash2} variant="danger" size="sm" label="Supprimer" />

// Gain espace : 420px économisés (5 buttons × 84px)
```

---

## Exemples Avancés

### Responsive Icon-only ↔ Icon+Text

```tsx
{
  /* Mobile: Icon-only (space-constrained) - IconButton */
}
<div className="flex md:hidden">
  <IconButton
    icon={CheckCircle}
    variant="success"
    size="sm"
    label="Confirmer commande"
  />
</div>;

{
  /* Desktop: Icon + Text - ButtonUnified */
}
<div className="hidden md:flex">
  <ButtonUnified icon={CheckCircle} variant="success" size="sm">
    Confirmer
  </ButtonUnified>
</div>;
```

### Button Group CRUD

```tsx
<div className="flex gap-2">
  <ButtonUnified icon={Eye} variant="ghost" size="sm">
    Voir
  </ButtonUnified>
  <ButtonUnified icon={Edit} variant="outline" size="sm">
    Modifier
  </ButtonUnified>
  <ButtonUnified icon={Trash2} variant="danger" size="sm">
    Supprimer
  </ButtonUnified>
</div>
```

### Tooltip pour Icon-only

```tsx
import { Tooltip, TooltipContent, TooltipTrigger } from '@verone/ui';

<Tooltip>
  <TooltipTrigger asChild>
    <ButtonUnified variant="ghost" size="icon" aria-label="Copier">
      <CopyIcon size={16} />
    </ButtonUnified>
  </TooltipTrigger>
  <TooltipContent>
    <p>Copier le texte</p>
  </TooltipContent>
</Tooltip>;
```

### Gradient Modern CTA

```tsx
// Pattern 1 (icon prop)
<ButtonUnified icon={Plus} variant="gradient" size="lg">
  Nouveau Produit
</ButtonUnified>

// Pattern 2 (JSX children)
<ButtonUnified variant="gradient" size="lg">
  <SparklesIcon />
  Créer Produit
</ButtonUnified>
```

---

## Migration Guide

### De ButtonV2 → ButtonUnified

**Avant (ButtonV2):**

```tsx
<ButtonV2 onClick={handleClick} loading={isLoading}>
  Save
</ButtonV2>
```

**Après (ButtonUnified):**

```tsx
<ButtonUnified icon={Save} loading={isLoading} onClick={handleClick}>
  Enregistrer
</ButtonUnified>
```

### De ActionButton → ButtonUnified

**Avant (ActionButton):**

```tsx
<ActionButton
  text="Confirmer"
  variant="success"
  icon="check"
  onClick={handleConfirm}
/>
```

**Après (ButtonUnified Pattern 1):**

```tsx
<ButtonUnified icon={CheckCircle} variant="success" onClick={handleConfirm}>
  Confirmer
</ButtonUnified>
```

### De shadcn/ui Button → ButtonUnified

**Avant (shadcn/ui):**

```tsx
import { Button } from '@/components/ui/button';

<Button variant="outline" className="border-sky-600 text-sky-600">
  <CopyIcon />
  Duplicate
</Button>;
```

**Après (ButtonUnified Pattern 2):**

```tsx
import { ButtonUnified } from '@verone/ui';

<ButtonUnified variant="outline" className="border-sky-600 text-sky-600">
  <CopyIcon />
  Duplicate
</ButtonUnified>;
```

**Aucun changement nécessaire!** Pattern 2 compatible à 100%.

---

## 🎯 Best Practices

### ✅ DO

```tsx
// ✅ Pattern 1 pour simplicité (95% cas)
<ButtonUnified icon={Save} variant="default">Enregistrer</ButtonUnified>

// ✅ Pattern 2 pour layouts complexes
<ButtonUnified variant="outline">
  <BellIcon />
  Notifications
  <span className="badge">3</span>
</ButtonUnified>

// ✅ Loading state built-in (Pattern 1)
<ButtonUnified icon={Save} loading={isSubmitting}>Enregistrer</ButtonUnified>

// ✅ Semantic variants CRUD
<ButtonUnified icon={CheckCircle} variant="success">Confirmer</ButtonUnified>

// ✅ aria-label pour icon-only (accessibility)
<ButtonUnified variant="ghost" size="icon" aria-label="Copier">
  <CopyIcon size={16} />
</ButtonUnified>
```

### ❌ DON'T

```tsx
// ❌ Mélanger Pattern 1 + Pattern 2 (duplication icon)
<ButtonUnified icon={Save}>
  <SaveIcon />  {/* Icon dupliqué! */}
  Enregistrer
</ButtonUnified>

// ❌ Icon-only sans aria-label (accessibility fail)
<ButtonUnified variant="ghost" size="icon">
  <CopyIcon />  {/* Pas de label pour screen readers! */}
</ButtonUnified>

// ❌ Size icon hardcodé manuel (incohérence)
<ButtonUnified icon={Save} size="lg">
  <SaveIcon size={16} />  {/* Devrait être 18px pour size="lg"! */}
  Enregistrer
</ButtonUnified>

// ❌ Over-engineering Pattern 2 pour cas simple
<ButtonUnified variant="outline">
  <SaveIcon className="mr-2" />  {/* Pattern 1 plus simple ici */}
  Enregistrer
</ButtonUnified>
```

---

## 📚 Ressources

- **Code Source:** `packages/@verone/ui/src/components/ui/button-unified.tsx`
- **Storybook:** `packages/@verone/ui/src/components/ui/button-unified.stories.tsx`
- **Analyse complète:** `docs/audits/2025-11/ANALYSE-UI-UX-2025-11-11.md`
- **Patterns shadcn Studio:** `.claude/resources/analysis/shadcn-studio-button-patterns.md`

---

**Version:** 1.0.0
**Date:** 2025-11-11
**Auteur:** Claude Code
**Status:** ✅ Production Ready
