# 🔄 Migration Guide - Filtres Catégories V1 → V2

**Date** : 2025-10-07
**Durée estimée** : 15 minutes
**Niveau de risque** : Faible (rétrocompatibilité maintenue)

---

## 📋 VUE D'ENSEMBLE DE LA MIGRATION

### Changements majeurs

| Aspect | V1 (Ancien) | V2 (Nouveau) |
|--------|-------------|--------------|
| **Affichage** | Toutes les catégories | Uniquement si produits |
| **Badges** | ❌ Aucun | ✅ Badges amovibles |
| **Compteurs** | Basiques | Dynamiques à tous niveaux |
| **Repliage** | Manuel uniquement | Auto + Manuel |
| **Props requises** | 5 props | 6 props (+products) |
| **Performance** | Bonne | Optimisée (useMemo) |

---

## 🚀 ÉTAPES DE MIGRATION

### Étape 1 : Backup du code actuel (5 min)

```bash
# 1. Créer une branche de migration
git checkout -b feature/filtres-categories-v2

# 2. Backup de l'ancien composant (optionnel)
cp src/components/business/category-hierarchy-filter.tsx \
   src/components/business/category-hierarchy-filter-v1-backup.tsx

# 3. Backup de la page catalogue
cp src/app/catalogue/page.tsx \
   src/app/catalogue/page-backup.tsx
```

### Étape 2 : Modifier les imports (2 min)

Dans `/src/app/catalogue/page.tsx` :

```typescript
// LIGNE 17 - AVANT
import { CategoryHierarchyFilter } from "../../components/business/category-hierarchy-filter"

// LIGNE 17 - APRÈS
import { CategoryHierarchyFilterV2 } from "../../components/business/category-hierarchy-filter-v2"
```

### Étape 3 : Mettre à jour l'utilisation (5 min)

Dans `/src/app/catalogue/page.tsx`, chercher l'utilisation actuelle :

```typescript
// LIGNES 331-338 - AVANT
<CategoryHierarchyFilter
  families={families}
  categories={allCategories}
  subcategories={subcategories}
  selectedSubcategories={filters.subcategories}
  onSubcategoryToggle={handleSubcategoryToggle}
/>

// LIGNES 331-339 - APRÈS
<CategoryHierarchyFilterV2
  families={families}
  categories={allCategories}
  subcategories={subcategories}
  products={products}  // ← NOUVELLE PROP REQUISE
  selectedSubcategories={filters.subcategories}
  onSubcategoryToggle={handleSubcategoryToggle}
/>
```

### Étape 4 : Vérifier les dépendances (2 min)

```bash
# Vérifier que ces composants UI existent
ls src/components/ui/badge.tsx
ls src/components/ui/button.tsx
ls src/components/ui/collapsible.tsx

# Si l'un manque, installer :
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add button
npx shadcn-ui@latest add collapsible
```

### Étape 5 : Tester localement (5 min)

```bash
# Lancer le serveur de dev
npm run dev

# Ouvrir le catalogue
open http://localhost:3000/catalogue

# Tests manuels :
✅ Les familles sans produits n'apparaissent pas
✅ Les compteurs sont corrects
✅ Sélectionner une sous-catégorie → Badge apparaît
✅ Cliquer X sur badge → Filtre retiré
✅ Cliquer "Réinitialiser" → Tous filtres retirés
✅ Repliage automatique après sélection
✅ Console errors = 0
```

---

## 🔍 DIFFÉRENCES DÉTAILLÉES

### Interface (Props)

```typescript
// V1
interface CategoryHierarchyFilterProps {
  families: Family[]
  categories: Category[]
  subcategories: Subcategory[]
  selectedSubcategories: string[]
  onSubcategoryToggle: (subcategoryId: string) => void
  className?: string
}

// V2 (ajout de products)
interface CategoryHierarchyFilterV2Props {
  families: Family[]
  categories: Category[]
  subcategories: Subcategory[]
  products: Product[]  // ← NOUVEAU
  selectedSubcategories: string[]
  onSubcategoryToggle: (subcategoryId: string) => void
  className?: string
}
```

### Comportement

```typescript
// V1 : Toutes les catégories affichées
// Problème : Confusion avec catégories vides
{families.map(family => (
  <FamilyNode family={family} />
))}

// V2 : Filtrage intelligent
// Solution : Uniquement si produits > 0
{enrichedHierarchy
  .filter(family => family.productCount > 0)
  .map(family => (
    <FamilyNode family={family} />
  ))
}
```

### UI/UX

```diff
+ Zone badges filtres actifs en haut
+ Bouton "Réinitialiser" global
+ Fil d'Ariane dans badges (Famille › Catégorie › Sous-catégorie)
+ Repliage automatique après sélection
+ Auto-expansion au chargement si filtres actifs
+ Compteurs dynamiques à tous les niveaux
```

---

## 🧪 VALIDATION POST-MIGRATION

### Checklist fonctionnelle

```bash
# 1. Affichage
✅ Familles sans produits n'apparaissent pas
✅ Catégories sans produits n'apparaissent pas
✅ Sous-catégories sans produits n'apparaissent pas
✅ Compteurs corrects à tous les niveaux

# 2. Badges
✅ Badge apparaît en haut lors de sélection
✅ Format fil d'Ariane correct (Famille › Catégorie › Sous-catégorie)
✅ Clic sur X retire le filtre
✅ Bouton "Réinitialiser" retire tous les filtres
✅ Compteur "Filtres actifs (n)" correct

# 3. Interactions
✅ Repliage automatique après sélection
✅ Toggle famille ouvre/ferme correctement
✅ Toggle catégorie ouvre/ferme correctement
✅ Checkbox sous-catégorie fonctionne
✅ Auto-expansion au chargement si filtres actifs

# 4. Filtrage
✅ Sélection unique fonctionne
✅ Sélection multiple fonctionne
✅ Désélection fonctionne
✅ Produits filtrés correspondent aux sélections
✅ Compteur produits dans page mis à jour

# 5. Performance
✅ Temps de rendu <100ms
✅ Toggle expand/collapse instantané (<16ms)
✅ Sélection instantanée (<16ms)
✅ Console errors = 0
✅ Pas de memory leaks
```

### Tests de régression

```bash
# Scénarios à tester pour éviter les régressions

# Test 1 : Navigation normale
1. Ouvrir /catalogue
2. Sélectionner une sous-catégorie
3. Vérifier que les produits sont filtrés
4. Désélectionner → Tous les produits s'affichent

# Test 2 : Multi-sélection
1. Sélectionner "Fauteuil"
2. Sélectionner "Canapé"
3. Vérifier que les produits des 2 sous-catégories s'affichent
4. Compteur total correct

# Test 3 : Badges
1. Sélectionner 3 sous-catégories
2. Vérifier que 3 badges apparaissent
3. Retirer 1 badge via X
4. Vérifier que le filtre est bien retiré

# Test 4 : Réinitialisation
1. Sélectionner plusieurs sous-catégories
2. Cliquer "Réinitialiser"
3. Vérifier que tous les badges disparaissent
4. Vérifier que tous les produits s'affichent

# Test 5 : Persistance
1. Sélectionner une sous-catégorie
2. Rafraîchir la page (F5)
3. Vérifier que la sélection est conservée (si URL state implémenté)
4. Vérifier que la catégorie s'auto-expand

# Test 6 : États vides
1. Archiver tous les produits d'une famille
2. Vérifier que la famille disparaît du filtre
3. Restaurer les produits
4. Vérifier que la famille réapparaît

# Test 7 : Responsive
1. Tester sur mobile (320px width)
2. Tester sur tablet (768px width)
3. Tester sur desktop (1920px width)
4. Vérifier que les badges wrappent correctement
```

---

## 🐛 RÉSOLUTION DE PROBLÈMES

### Problème 1 : Props `products` undefined

**Symptôme** : Erreur TypeScript ou compteurs à 0

```typescript
// Solution : Vérifier que products est bien passé
<CategoryHierarchyFilterV2
  families={families}
  categories={allCategories}
  subcategories={subcategories}
  products={products}  // ← Vérifier cette ligne
  selectedSubcategories={filters.subcategories}
  onSubcategoryToggle={handleSubcategoryToggle}
/>

// Debug : Vérifier la valeur
console.log('Products pour filtre:', products.length)
```

### Problème 2 : Compteurs incorrects

**Symptôme** : Les compteurs ne correspondent pas au nombre réel de produits

```typescript
// Cause probable : Produits archivés inclus
// Solution : Vérifier que loadCatalogueData exclut les archivés

const loadProducts = async () => {
  let query = supabase
    .from('products')
    .select('*')
    .is('archived_at', null) // ← IMPORTANT
}
```

### Problème 3 : Badges ne s'affichent pas

**Symptôme** : Sélection fonctionne mais badges vides

```typescript
// Cause probable : selectedSubcategories vide
// Solution : Vérifier la synchronisation state

const handleSubcategoryToggle = (subcategoryId: string) => {
  console.log('Toggle:', subcategoryId)
  console.log('Before:', filters.subcategories)

  const newSubcategories = filters.subcategories.includes(subcategoryId)
    ? filters.subcategories.filter(id => id !== subcategoryId)
    : [...filters.subcategories, subcategoryId]

  console.log('After:', newSubcategories)

  setFilters(prev => ({
    ...prev,
    subcategories: newSubcategories
  }))
}
```

### Problème 4 : Auto-expansion ne fonctionne pas

**Symptôme** : Catégories sélectionnées ne s'ouvrent pas au chargement

```typescript
// Cause probable : useEffect dépendances incorrectes
// Solution déjà implémentée dans V2 :

useEffect(() => {
  if (selectedSubcategories.length > 0) {
    // Auto-expand logic
  }
}, []) // ← Dépendances vides = uniquement au montage
```

### Problème 5 : Performance dégradée

**Symptôme** : Lenteur lors des interactions

```typescript
// Cause probable : Re-renders excessifs
// Solution : Vérifier useMemo

// Bad ❌
const enrichedHierarchy = buildHierarchy() // Recalcule à chaque render

// Good ✅
const enrichedHierarchy = useMemo(() => {
  return buildHierarchy()
}, [families, categories, subcategories, products])
```

---

## 🔄 ROLLBACK (si nécessaire)

Si la migration pose problème, rollback facile :

```bash
# Option 1 : Rollback Git
git checkout src/app/catalogue/page.tsx
git checkout src/components/business/category-hierarchy-filter.tsx

# Option 2 : Restaurer backup
cp src/app/catalogue/page-backup.tsx \
   src/app/catalogue/page.tsx

# Option 3 : Utiliser V1 temporairement
# Dans page.tsx
import { CategoryHierarchyFilter } from "../../components/business/category-hierarchy-filter"
// Utiliser CategoryHierarchyFilter au lieu de CategoryHierarchyFilterV2
```

---

## 📊 COMPARAISON VISUELLE

### V1 (Ancien)
```
┌─────────────────────────────────┐
│ 🏷️ CATÉGORIES                  │
│ ┌─────────────────────────────┐ │
│ │ ▼ 📁 Mobilier               │ │
│ │   ▼ Chaises                 │ │
│ │     ☐ Fauteuil              │ │
│ │     ☐ Canapé                │ │
│ │ ▼ 📁 Linge (vide!)          │ │  ← Affichage même si vide
│ │   (Aucune sous-catégorie)   │ │
│ └─────────────────────────────┘ │
│ 2 sous-catégories sélectionnées │  ← Compteur basique
│ [Tout désélectionner]           │
└─────────────────────────────────┘
```

### V2 (Nouveau)
```
┌─────────────────────────────────┐
│ FILTRES ACTIFS (2)  [Réinit.]  │  ← Zone badges
│ ┌─────────────────────────────┐ │
│ │ Mobilier › Chaises › ... ✕  │ │  ← Badges amovibles
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ 🏷️ CATÉGORIES                  │
│ ┌─────────────────────────────┐ │
│ │ ▼ 📁 Mobilier (30) [2]      │ │  ← Compteurs
│ │   ▼ Chaises (18) [2]        │ │
│ │     ☑ Fauteuil (12)         │ │
│ │     ☑ Canapé (6)            │ │
│ └─────────────────────────────┘ │
│                                 │  ← Linge vide = masqué
└─────────────────────────────────┘
```

---

## ✅ CHECKLIST FINALE

Avant de merger la branche :

```bash
✅ Backup code V1 effectué
✅ Migration code complète
✅ Tests manuels validés
✅ Tests de régression OK
✅ Console errors = 0
✅ Build production réussi
✅ Tests responsive OK
✅ Documentation mise à jour
✅ Code review effectué
✅ Rollback plan documenté
```

---

## 🚀 DÉPLOIEMENT

```bash
# 1. Commit des changements
git add .
git commit -m "✨ FEAT: Migration filtres catégories V1 → V2 (badges + compteurs)"

# 2. Push vers repository
git push origin feature/filtres-categories-v2

# 3. Créer Pull Request
gh pr create --title "✨ FEAT: Filtres catégories V2" \
  --body "Migration vers filtres V2 avec badges amovibles et compteurs dynamiques"

# 4. Review et merge
# (après validation code review)

# 5. Déploiement automatique Vercel
# (GitHub Actions CI/CD)
```

---

**Migration complétée avec succès !** 🎉

Pour toute question ou problème, consulter :
- Guide d'intégration : `/docs/guides/GUIDE-INTEGRATION-FILTRES-CATEGORIES-V2.md`
- Design System : `CLAUDE.md` section Design Vérone
- Support : Repository GitHub Issues
