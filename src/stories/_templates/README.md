# 📝 Templates Storybook

**Objectif** : Templates standardisés pour créer rapidement des stories cohérentes.

---

## 🎯 Choix du Template

### Template Basique (`basic-story.template.tsx`)

**Utiliser quand** :
- Composant simple avec peu de props (< 5 props)
- Pas de variantes multiples
- Pas de logique complexe

**Exemples** :
- `Badge`
- `Avatar`
- `Separator`
- `Label`
- `Progress`

**Caractéristiques** :
- 3 stories : Default, Interactive, EdgeCase
- Layout : `centered`
- Minimal argTypes

---

### Template Variants (`variants-story.template.tsx`)

**Utiliser quand** :
- Composant avec multiples variantes visuelles
- Props `variant`, `size`, `disabled`
- Design system avec états multiples

**Exemples** :
- `Button` (default, primary, destructive, outline, ghost)
- `Card` (default, elevated, bordered, glass)
- `Badge` (default, success, warning, error)
- `Input` (default, error, success)

**Caractéristiques** :
- 10+ stories (une par variante + combinaisons)
- Story `AllVariants` avec grille visuelle
- Story `Sizes` pour comparaison
- ArgTypes complets avec options

---

### Template Business (`business-story.template.tsx`)

**Utiliser quand** :
- Composant métier avec logique complexe
- Nécessite données mock (products, orders, stock)
- Intégration avec Supabase/Context
- Permissions requises

**Exemples** :
- `ProductCard`
- `OrderTable`
- `StockMovementForm`
- `OrganisationSelector`
- `DashboardKPI`

**Caractéristiques** :
- Mock data au début du fichier
- 10 stories (Default, Loading, Empty, Error, Complete, Partial, ManyItems, Interactive, Mobile, Desktop, RealWorld)
- Decorator avec layout background
- Parameters avec documentation métier
- Viewport stories (mobile/desktop)

---

## 🚀 Utilisation

### Étape 1 : Copier template approprié

```bash
# Pour Button (variants)
cp src/stories/_templates/variants-story.template.tsx \
   src/stories/1-ui-base/Buttons/Button.stories.tsx

# Pour ProductCard (business)
cp src/stories/_templates/business-story.template.tsx \
   src/stories/2-business/Products/ProductCard.stories.tsx
```

### Étape 2 : Remplacer placeholders

**Rechercher et remplacer** :
- `ComponentName` → Nom réel du composant (`Button`, `ProductCard`)
- `@/components/path/to/component-name` → Chemin réel (`@/components/ui/button`)
- `Category/Subcategory/ComponentName` → Title Storybook (`1-UI-Base/Buttons/Button`)
- Mock data → Données réelles si applicable

### Étape 3 : Adapter stories

- Supprimer stories non applicables
- Ajouter stories spécifiques au composant
- Compléter argTypes avec props réelles
- Tester dans Storybook (`npm run storybook`)

---

## 📋 Checklist Création Story

- [ ] Template approprié copié
- [ ] Placeholders remplacés
- [ ] Import path correct
- [ ] Title Storybook correct (hiérarchie)
- [ ] Meta `tags: ['autodocs']` présent
- [ ] ArgTypes complets avec descriptions
- [ ] Au moins 3 stories (Default + 2 variantes)
- [ ] Parameters.docs avec description
- [ ] Story testée visuellement dans Storybook
- [ ] Accessibilité validée (addon a11y)
- [ ] Responsive testé (si applicable)

---

## 🎨 Conventions

### Title Hierarchy

```typescript
// UI Base Components
title: '1-UI-Base/Buttons/Button'
title: '1-UI-Base/Cards/Card'
title: '1-UI-Base/Inputs/Input'

// Business Components
title: '2-Business/Products/ProductCard'
title: '2-Business/Orders/OrderTable'
title: '2-Business/Stock/StockMovementCard'

// Forms
title: '3-Forms/Products/ProductForm'
title: '3-Forms/Orders/CreateOrderForm'

// Layout
title: '4-Layout/Header'
title: '4-Layout/Sidebar'

// Admin
title: '5-Admin/UserManagement/UserTable'
```

### Story Naming

```typescript
// ✅ Bon
export const Default: Story = { ... }
export const Primary: Story = { ... }
export const Loading: Story = { ... }
export const WithLongText: Story = { ... }

// ❌ Mauvais
export const story1: Story = { ... }
export const test: Story = { ... }
export const Example: Story = { ... }
```

### Mock Data Convention

```typescript
// Au début du fichier, avant meta
const mockProduct = {
  id: '1',
  name: 'Fauteuil Milo - Vert',
  sku: 'FAUT-MILO-VERT',
  price: 299.99,
  stock: 5,
  primary_image_url: '/placeholder.jpg',
};

const mockProducts = Array.from({ length: 10 }, (_, i) => ({
  ...mockProduct,
  id: `${i + 1}`,
  name: `Produit ${i + 1}`,
}));
```

---

## 🔧 Auto-Génération (Phase 6)

**Script à créer** : `tools/scripts/generate-stories.js`

**Fonctionnement** :
1. Lire tous les fichiers `.tsx` dans `src/components/`
2. Détecter type de composant (ui/business/form)
3. Sélectionner template approprié
4. Générer story avec placeholders remplacés
5. Sauvegarder dans bon dossier `src/stories/`

**Utilisation** :
```bash
npm run generate:stories
# Génère stories manquantes automatiquement
```

---

**Créé** : 2025-10-21
**Mis à jour** : 2025-10-21
