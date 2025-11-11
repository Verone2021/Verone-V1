# 🎯 Guide d'Intégration - Filtre de Catégories Hiérarchique V2

**Date** : 2025-10-07
**Version** : 2.0
**Statut** : Production Ready

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Fonctionnalités clés](#fonctionnalités-clés)
3. [Design System Vérone](#design-system-vérone)
4. [Installation et Intégration](#installation-et-intégration)
5. [API et Props](#api-et-props)
6. [Exemples d'utilisation](#exemples-dutilisation)
7. [Customisation avancée](#customisation-avancée)
8. [Performance et optimisations](#performance-et-optimisations)

---

## 🎨 VUE D'ENSEMBLE

Le composant `CategoryHierarchyFilterV2` est un filtre de catégories hiérarchique à 3 niveaux avec badges amovibles, conçu pour le catalogue Vérone.

### Architecture hiérarchique

```
Familles (niveau 0)
  ├─ Catégories (niveau 1)
  │   └─ Sous-catégories (niveau 2) ← Niveau filtrable
  └─ Catégories (niveau 1)
      └─ Sous-catégories (niveau 2) ← Niveau filtrable
```

### Schéma visuel

```
┌─────────────────────────────────────────────────────────────┐
│ FILTRES ACTIFS (2)                        [Réinitialiser]   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Mobilier › Chaises › Fauteuil ✕  Décoration › ... ✕    │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 🏷️ CATÉGORIES                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ▼ 📁 Maison et décoration (45) [2]                      │ │
│ │   ▼ Mobilier (30) [1]                                   │ │
│ │     ☑ Fauteuil (12)                                     │ │
│ │     ☐ Canapé (8)                                        │ │
│ │     ☐ Table (10)                                        │ │
│ │   ▶ Linge de maison (15) [1]                            │ │
│ │ ▶ 📁 Électroménager (20)                                │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

Légende :
▼ = Ouvert    ▶ = Fermé    ☑ = Sélectionné    ☐ = Non sélectionné
(45) = Nombre de produits    [2] = Nombre de sélections
```

---

## ✨ FONCTIONNALITÉS CLÉS

### 1. Filtrage intelligent

- ✅ **Affichage conditionnel** : Seules les catégories contenant au moins 1 produit sont affichées
- ✅ **Compteurs dynamiques** : Affichage du nombre de produits à chaque niveau
- ✅ **Sélection multiple** : Possibilité de sélectionner plusieurs sous-catégories simultanément

### 2. Interface utilisateur

- ✅ **Badges amovibles** : Les sélections actives s'affichent en haut avec bouton X pour retirer
- ✅ **Arborescence repliable** : Chaque niveau peut être ouvert/fermé indépendamment
- ✅ **Repliage automatique** : Après sélection, la catégorie se replie automatiquement
- ✅ **Indicateurs visuels** : Compteurs de sélections à chaque niveau

### 3. UX optimisée

- ✅ **Auto-expansion** : Les catégories des filtres actifs s'ouvrent automatiquement au chargement
- ✅ **Fil d'Ariane dans badges** : Format "Famille › Catégorie › Sous-catégorie"
- ✅ **Bouton Réinitialiser** : Permet de retirer tous les filtres en un clic
- ✅ **Scroll vertical** : Hauteur maximale 384px (max-h-96) avec scroll automatique

### 4. Design Vérone

- ✅ **Palette stricte** : Noir (#000000), blanc (#FFFFFF), gris (#666666) uniquement
- ✅ **Typographie** : Respect de la hiérarchie Vérone (sm, xs)
- ✅ **Interactions minimales** : Transitions subtiles (150ms hover, 300ms expand)
- ✅ **Accessibilité** : Contraste élevé, zones cliquables >44px

---

## 🎨 DESIGN SYSTEM VÉRONE

### Palette de couleurs (STRICT)

```css
/* Couleurs autorisées UNIQUEMENT */
--verone-black:
  #000000 /* Texte principal, bordures, fond sélection */
    --verone-white: #ffffff /* Fond, texte inversé */ --verone-gray-50: #f9fafb
    /* Hover states */ --verone-gray-100: #f3f4f6 /* Backgrounds secondaires */
    --verone-gray-200: #e5e7eb /* Bordures */ --verone-gray-400: #9ca3af
    /* Icônes inactives */ --verone-gray-600: #4b5563 /* Texte secondaire */
    /* Couleurs système (uniquement pour états) */ --verone-blue-50: #eff6ff
    /* Sélection catégorie */ --verone-blue-100: #dbeafe /* Badge sélection */
    --verone-blue-800: #1e40af /* Texte badge */ /* INTERDIT ABSOLU */ ❌ Jaune,
  doré, ambre, orange ❌ Couleurs vives ou saturées;
```

### Typographie

```typescript
// Hiérarchie typographique
{
  familyName: "text-sm font-medium",     // 14px, medium
  categoryName: "text-sm",               // 14px, regular
  subcategoryName: "text-sm",            // 14px, regular
  productCount: "text-xs opacity-50",    // 12px, light
  badgeText: "text-xs",                  // 12px
  sectionTitle: "text-sm font-medium"    // 14px, medium
}
```

### Espacements

```typescript
{
  padding: {
    badge: "px-2.5 py-0.5",        // 10px horizontal, 2px vertical
    node: "p-2",                    // 8px tous côtés
    container: "p-2",               // 8px
    section: "space-y-4"            // 16px vertical
  },
  spacing: {
    iconText: "space-x-2",          // 8px
    badges: "gap-2",                // 8px
    nodes: "space-y-1"              // 4px
  }
}
```

### Animations

```typescript
{
  hover: "transition-colors duration-150",
  expand: "transition-all duration-300",
  badge: "transition-colors duration-150"
}
```

---

## 🔧 INSTALLATION ET INTÉGRATION

### Étape 1 : Vérifier les dépendances

Le composant utilise les dépendances shadcn/ui déjà installées :

```bash
# Vérifier que ces composants existent
ls apps/back-office/src/components/ui/badge.tsx
ls apps/back-office/src/components/ui/button.tsx
ls apps/back-office/src/components/ui/collapsible.tsx

# Si manquants, installer via shadcn/ui
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add button
npx shadcn-ui@latest add collapsible
```

### Étape 2 : Importer le nouveau composant

Dans `/apps/back-office/src/app/catalogue/page.tsx` :

```typescript
// REMPLACER l'ancien import
// import { CategoryHierarchyFilter } from "../../components/business/category-hierarchy-filter"

// PAR le nouveau
import { CategoryHierarchyFilterV2 } from '../../components/business/category-hierarchy-filter-v2';
```

### Étape 3 : Mettre à jour l'utilisation

```typescript
// AVANT (ancien composant)
<CategoryHierarchyFilter
  families={families}
  categories={allCategories}
  subcategories={subcategories}
  selectedSubcategories={filters.subcategories}
  onSubcategoryToggle={handleSubcategoryToggle}
/>

// APRÈS (nouveau composant V2)
<CategoryHierarchyFilterV2
  families={families}
  categories={allCategories}
  subcategories={subcategories}
  products={products} // ← NOUVELLE PROP REQUISE pour compteurs
  selectedSubcategories={filters.subcategories}
  onSubcategoryToggle={handleSubcategoryToggle}
/>
```

### Étape 4 : Tester le composant

```bash
# Lancer le dev server
npm run dev

# Naviguer vers
http://localhost:3000/catalogue

# Vérifications :
✅ Les familles sans produits n'apparaissent pas
✅ Les compteurs affichent le bon nombre de produits
✅ Les badges apparaissent en haut lors de la sélection
✅ Le repliage automatique fonctionne après sélection
✅ Le bouton "Réinitialiser" retire tous les filtres
```

---

## 📚 API ET PROPS

### Props du composant

```typescript
interface CategoryHierarchyFilterV2Props {
  // Données hiérarchiques (depuis hooks Supabase)
  families: Family[]; // Liste des familles
  categories: Category[]; // Liste des catégories
  subcategories: Subcategory[]; // Liste des sous-catégories
  products: Product[]; // ← NOUVEAU : Liste des produits pour compteurs

  // État de sélection (contrôlé depuis parent)
  selectedSubcategories: string[]; // IDs des sous-catégories sélectionnées

  // Callback de sélection
  onSubcategoryToggle: (subcategoryId: string) => void;

  // Classe CSS optionnelle
  className?: string;
}
```

### Types de données

```typescript
interface Family {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  family_id: string;
}

interface Subcategory {
  id: string;
  name: string;
  category_id: string;
}

interface Product {
  id: string;
  subcategory_id?: string;
  // ... autres props non utilisées pour le filtre
}
```

### Méthodes exposées

```typescript
// Aucune méthode exposée - composant contrôlé uniquement via props
// La logique de filtrage est gérée par le composant parent (page.tsx)
```

---

## 💡 EXEMPLES D'UTILISATION

### Exemple 1 : Intégration basique

```typescript
import { CategoryHierarchyFilterV2 } from "@/components/business/category-hierarchy-filter-v2"
import { useCatalogue } from "@/hooks/use-catalogue"
import { useFamilies } from "@/hooks/use-families"
import { useCategories } from "@/hooks/use-categories"
import { useSubcategories } from "@/hooks/use-subcategories"

export default function CataloguePage() {
  const { products, setFilters } = useCatalogue()
  const { families } = useFamilies()
  const { allCategories } = useCategories()
  const { subcategories } = useSubcategories()

  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([])

  const handleSubcategoryToggle = (subcategoryId: string) => {
    setSelectedSubcategories(prev =>
      prev.includes(subcategoryId)
        ? prev.filter(id => id !== subcategoryId)
        : [...prev, subcategoryId]
    )

    // Synchroniser avec le hook catalogue
    setFilters({ subcategories: selectedSubcategories })
  }

  return (
    <CategoryHierarchyFilterV2
      families={families}
      categories={allCategories}
      subcategories={subcategories}
      products={products}
      selectedSubcategories={selectedSubcategories}
      onSubcategoryToggle={handleSubcategoryToggle}
    />
  )
}
```

### Exemple 2 : Avec gestion d'état locale

```typescript
const [filters, setFilters] = useState({
  subcategories: [] as string[],
});

const handleSubcategoryToggle = (subcategoryId: string) => {
  const newSubcategories = filters.subcategories.includes(subcategoryId)
    ? filters.subcategories.filter(id => id !== subcategoryId)
    : [...filters.subcategories, subcategoryId];

  setFilters(prev => ({
    ...prev,
    subcategories: newSubcategories,
  }));

  // Synchroniser avec le backend
  setCatalogueFilters({
    search: filters.search,
    statuses: filters.status,
    subcategories: newSubcategories,
  });
};
```

### Exemple 3 : Avec URL state (persistance)

```typescript
import { useRouter, useSearchParams } from 'next/navigation';

const router = useRouter();
const searchParams = useSearchParams();

// Lire depuis URL au montage
const initialSubcategories =
  searchParams.get('subcategories')?.split(',') || [];
const [selectedSubcategories, setSelectedSubcategories] =
  useState(initialSubcategories);

const handleSubcategoryToggle = (subcategoryId: string) => {
  const newSubcategories = selectedSubcategories.includes(subcategoryId)
    ? selectedSubcategories.filter(id => id !== subcategoryId)
    : [...selectedSubcategories, subcategoryId];

  setSelectedSubcategories(newSubcategories);

  // Mettre à jour l'URL
  const params = new URLSearchParams(searchParams.toString());
  if (newSubcategories.length > 0) {
    params.set('subcategories', newSubcategories.join(','));
  } else {
    params.delete('subcategories');
  }
  router.push(`/catalogue?${params.toString()}`);
};
```

---

## 🎨 CUSTOMISATION AVANCÉE

### 1. Modifier les couleurs de sélection

```typescript
// Dans category-hierarchy-filter-v2.tsx

// Changer la couleur de fond des sélections actives
className={cn(
  "w-full flex items-center space-x-2 p-2 rounded transition-colors",
  isSelected
    ? "bg-black text-white"      // ← Modifier ici
    : "text-black hover:bg-gray-100"
)}
```

### 2. Ajuster la hauteur maximale

```typescript
// Modifier la hauteur de scroll
<div className="max-h-96 overflow-y-auto p-2 space-y-1">
  // Pour 512px : max-h-[512px]
  // Pour 600px : max-h-[600px]
  // Pour full viewport : max-h-[calc(100vh-200px)]
</div>
```

### 3. Personnaliser les badges

```typescript
<Badge
  variant="default"
  className={cn(
    "bg-black text-white border-black cursor-pointer",
    "hover:bg-gray-800 transition-colors",
    "text-xs"  // ← Modifier la taille ici
  )}
>
  {/* Contenu badge */}
</Badge>
```

### 4. Changer le format du fil d'Ariane

```typescript
// Dans le mapping activeFilters
<span className="text-xs">
  {filter.familyName} › {filter.categoryName} › {filter.subcategoryName}

  // Alternatives :
  // {filter.subcategoryName} ({filter.categoryName})
  // {filter.categoryName} / {filter.subcategoryName}
  // {filter.subcategoryName}
</span>
```

---

## ⚡ PERFORMANCE ET OPTIMISATIONS

### 1. Mémoïsation intelligente

Le composant utilise `useMemo` pour les calculs coûteux :

```typescript
// Enrichissement hiérarchique mémoïsé
const enrichedHierarchy = useMemo(() => {
  // Calculs de compteurs et filtrage
  // Se recalcule UNIQUEMENT si les données changent
}, [families, categories, subcategories, products]);

// Filtres actifs mémoïsés
const activeFilters = useMemo(() => {
  // Génération des badges
  // Se recalcule UNIQUEMENT si les sélections changent
}, [selectedSubcategories, subcategories, categories, families]);
```

### 2. Optimisation du rendu

```typescript
// Évite les re-renders inutiles des nœuds
{enrichedHierarchy.map(family => (
  <div key={family.id}> {/* ← Key stable pour React */}
    {/* Contenu */}
  </div>
))}
```

### 3. Lazy loading (optionnel)

Pour de très grandes arborescences (>1000 sous-catégories) :

```typescript
import dynamic from 'next/dynamic';

const CategoryHierarchyFilterV2 = dynamic(
  () =>
    import('@/components/business/category-hierarchy-filter-v2').then(
      mod => mod.CategoryHierarchyFilterV2
    ),
  { ssr: false } // Désactiver SSR si nécessaire
);
```

### 4. Metrics de performance

```typescript
// Temps de calcul enrichedHierarchy
Performance attendue :
- 10 familles × 5 catégories × 10 sous-catégories = 500 items
- Calcul initial : <50ms
- Re-calcul sur changement : <20ms

// Temps de rendu
- Rendu initial complet : <100ms
- Toggle expand/collapse : <16ms (60fps)
- Sélection sous-catégorie : <16ms (60fps)
```

---

## 🧪 TESTS ET VALIDATION

### Tests manuels recommandés

```bash
# Test 1 : Affichage conditionnel
✅ Créer une famille sans produits → Ne doit PAS apparaître
✅ Ajouter un produit → La famille doit apparaître

# Test 2 : Compteurs
✅ Vérifier que les compteurs correspondent au nombre réel de produits
✅ Archiver un produit → Le compteur doit se mettre à jour

# Test 3 : Badges
✅ Sélectionner une sous-catégorie → Badge apparaît en haut
✅ Cliquer sur X du badge → Le filtre est retiré
✅ Cliquer "Réinitialiser" → Tous les badges disparaissent

# Test 4 : Repliage
✅ Sélectionner une sous-catégorie → La catégorie se replie
✅ Re-ouvrir la catégorie → La sélection est toujours active

# Test 5 : Auto-expansion
✅ Sélectionner plusieurs sous-catégories
✅ Rafraîchir la page → Les catégories sélectionnées s'ouvrent automatiquement
```

### Tests de performance

```bash
# Test avec Playwright MCP (selon CLAUDE.md)
mcp__playwright__browser_navigate("http://localhost:3000/catalogue")
mcp__playwright__browser_console_messages() # Vérifier 0 erreur
mcp__playwright__browser_take_screenshot() # Capture visuelle
```

---

## 🚀 DÉPLOIEMENT

### Checklist pré-déploiement

```bash
✅ Tests manuels complets effectués
✅ Console errors = 0 (vérifier avec MCP Playwright)
✅ Build production réussi (npm run build)
✅ Tests accessibilité (contraste, zones cliquables)
✅ Tests responsive (mobile, tablet, desktop)
✅ Documentation à jour
✅ Code review validé
```

### Commandes de déploiement

```bash
# 1. Build local
npm run build

# 2. Test build local
npm run start

# 3. Push vers repository
git add .
git commit -m "✨ FEAT: Filtre catégories hiérarchique V2 avec badges"
git push origin main

# 4. Déploiement automatique Vercel
# (configuré via GitHub Actions)
```

---

## 📞 SUPPORT ET MAINTENANCE

### Problèmes connus

```typescript
// Problème : Compteurs incorrects après archivage
// Solution : Recharger les produits après archivage
await loadCatalogueData();

// Problème : Auto-expansion ne fonctionne pas
// Solution : Vérifier que les IDs des sélections sont valides
console.log('Selected:', selectedSubcategories);
console.log(
  'Available:',
  subcategories.map(s => s.id)
);
```

### Contact

- **Design System** : Vérone Design Expert
- **Support technique** : Repository GitHub Issues
- **Documentation** : `/docs/guides/`

---

## 📝 CHANGELOG

### Version 2.0 (2025-10-07)

**Ajouté** :

- ✨ Badges amovibles pour filtres actifs
- ✨ Repliage automatique après sélection
- ✨ Auto-expansion des catégories sélectionnées
- ✨ Affichage conditionnel (uniquement si produits)
- ✨ Compteurs de produits à tous les niveaux
- ✨ Bouton "Réinitialiser" global

**Modifié** :

- 🎨 Design minimaliste strict noir/blanc
- ⚡ Optimisation performances avec useMemo
- 📱 Amélioration responsive mobile

**Supprimé** :

- ❌ Couleurs non Vérone (bleu, vert, rouge sauf états système)
- ❌ Animations lourdes

---

**Vérone Back Office 2025** - Design System Excellence
