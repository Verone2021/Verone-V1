# Prompt Claude Code — Correction logo veronecollections.fr

**Date : 2026-07-01**
**Priorité : haute — identité visuelle incorrecte en production**

---

## Contexte

Le design system Vérone utilise `font-bodoni` (Bodoni serif) comme
typographie de marque pour le nom "Vérone". Le **footer** l'utilise
correctement depuis `Footer.tsx` :

```tsx
<h3 className="mb-4 font-bodoni text-2xl font-black tracking-tight text-verone-white">
  Vérone
</h3>
```

Le **header** utilise à la place un fichier image PNG :
`apps/site-internet/public/logo-verone.png`

Ce fichier fait **3508 × 2481 px** (résolution A4, format scan).
Il est affiché à 40px de hauteur avec `brightness-0 invert`.
Résultat visible sur le site : le mot "VERONE" apparaît en tout petits
caractères sans personnalité, sans rapport avec la calligraphie Bodoni
de la marque.

Sur **mobile**, le menu hamburger n'affiche aucun logo Vérone — juste
le mot "Menu" en Playfair.

---

## Fichiers à modifier

- `apps/site-internet/src/components/layout/Header.tsx`
- `apps/site-internet/src/components/layout/MobileNav.tsx`

**Ne pas toucher :**

- `apps/site-internet/src/components/layout/Footer.tsx` (référence correcte)
- `apps/site-internet/public/logo-verone.png` (garder le fichier)

---

## Modifications exactes

### 1. Header.tsx — remplacer l'Image par du texte font-bodoni

**Avant (lignes 37–45) :**

```tsx
<Image
  src="/logo-verone.png"
  alt="Vérone"
  width={120}
  height={40}
  priority
  className="h-10 w-auto brightness-0 invert"
/>
```

**Après :**

```tsx
<span className="font-bodoni text-2xl font-black tracking-tight text-verone-white">
  Vérone
</span>
```

Supprimer l'import `Image` de `next/image` **seulement** s'il n'est
plus utilisé ailleurs dans ce fichier (vérifier avant de supprimer).

---

### 2. MobileNav.tsx — ajouter le logo Vérone dans l'en-tête du panneau

**Avant (ligne ~30–33) :**

```tsx
<div className="flex items-center justify-between p-6 border-b border-verone-gray-200">
  <Dialog.Title className="font-playfair text-2xl font-bold text-verone-black tracking-tight">
    Menu
  </Dialog.Title>
```

**Après :**

```tsx
<div className="flex items-center justify-between p-6 border-b border-verone-gray-200">
  <Dialog.Title className="sr-only">Menu de navigation</Dialog.Title>
  <Link href="/" onClick={onClose}>
    <span className="font-bodoni text-2xl font-black tracking-tight text-verone-black">
      Vérone
    </span>
  </Link>
```

Vérifier que l'import `Link` de `next/link` est bien présent en haut du
fichier — l'ajouter si absent.

---

## Vérifications après modifications

```bash
pnpm --filter @verone/site-internet type-check
pnpm --filter @verone/site-internet lint
```

Vérifier visuellement :

- Header desktop : "Vérone" en Bodoni, blanc sur fond charbon
- Header sticky (scroll) : même rendu
- Mobile : panneau menu affiche "Vérone" en Bodoni noir
- Footer : toujours identique (ne pas avoir cassé)

---

## Format commit

```
[SITE-UI-001] fix: replace PNG logo with font-bodoni wordmark in header and mobile nav
```

## PR vers staging uniquement

```bash
gh pr create --base staging --head fix/site-ui-001-logo-bodoni
```
