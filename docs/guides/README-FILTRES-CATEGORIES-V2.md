# 🎯 Filtre de Catégories Hiérarchique V2 - README

**Composant** : `CategoryHierarchyFilterV2`
**Version** : 2.0
**Date** : 2025-10-07
**Statut** : ✅ Production Ready

---

## 🚀 DÉMARRAGE RAPIDE (5 MINUTES)

### 1. Installer le composant

Le composant est déjà créé dans :
```
/src/components/business/category-hierarchy-filter-v2.tsx
```

### 2. Importer dans votre page

```typescript
import { CategoryHierarchyFilterV2 } from "@/components/business/category-hierarchy-filter-v2"
```

### 3. Utiliser le composant

```typescript
<CategoryHierarchyFilterV2
  families={families}
  categories={allCategories}
  subcategories={subcategories}
  products={products}  // ← Nouvelle prop requise
  selectedSubcategories={filters.subcategories}
  onSubcategoryToggle={handleSubcategoryToggle}
/>
```

### 4. Tester

```bash
npm run dev
# Ouvrir http://localhost:3000/catalogue
```

---

## ✨ NOUVEAUTÉS V2

### Ce qui change par rapport à l'ancien filtre

| Fonctionnalité | Ancien (V1) | Nouveau (V2) |
|----------------|-------------|--------------|
| **Badges amovibles** | ❌ Non | ✅ Oui (avec fil d'Ariane) |
| **Affichage conditionnel** | Toutes les catégories | Uniquement si produits |
| **Compteurs** | Basiques | Dynamiques à tous niveaux |
| **Repliage auto** | ❌ Non | ✅ Oui (après sélection) |
| **Auto-expansion** | ❌ Non | ✅ Oui (au chargement) |
| **Bouton Réinitialiser** | Texte simple | Bouton styled |
| **Performance** | Bonne | Optimisée (useMemo) |

### Capture d'écran conceptuelle

```
┌─────────────────────────────────────────────────────────┐
│ FILTRES ACTIFS (2)                    [Réinitialiser]   │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Mobilier › Chaises › Fauteuil ✕                     │ │ ← NOUVEAU
│ │ Mobilier › Tables › Table basse ✕                   │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ 🏷️ CATÉGORIES                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ▼ 📂 Maison et décoration (45) [2]                  │ │ ← Compteurs
│ │    ▶ Mobilier (30) [2]                              │ │
│ │    ▶ Linge de maison (15)                           │ │
│ │ ▼ 📂 Électroménager (20)                            │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 📚 DOCUMENTATION COMPLÈTE

### Guides disponibles

1. **[GUIDE-INTEGRATION-FILTRES-CATEGORIES-V2.md](./GUIDE-INTEGRATION-FILTRES-CATEGORIES-V2.md)**
   - Installation détaillée
   - API et props
   - Exemples d'utilisation
   - Customisation avancée
   - Performance et optimisations

2. **[MIGRATION-FILTRES-V1-TO-V2.md](./MIGRATION-FILTRES-V1-TO-V2.md)**
   - Étapes de migration
   - Différences détaillées
   - Tests de validation
   - Résolution de problèmes
   - Rollback si nécessaire

3. **[DESIGN-MOCKUPS-FILTRES-V2.md](./DESIGN-MOCKUPS-FILTRES-V2.md)**
   - Design System Vérone
   - Mockups visuels
   - États et interactions
   - Responsive mobile
   - Accessibilité

---

## 🎯 FONCTIONNALITÉS PRINCIPALES

### 1. Badges amovibles

Les sélections actives s'affichent en haut sous forme de badges avec :
- ✅ Fil d'Ariane complet (Famille › Catégorie › Sous-catégorie)
- ✅ Bouton X pour retirer individuellement
- ✅ Bouton "Réinitialiser" pour tout effacer
- ✅ Compteur "Filtres actifs (n)"

**Exemple** :
```
Maison et décoration › Mobilier › Fauteuil ✕
```

### 2. Affichage intelligent

Seules les familles/catégories/sous-catégories contenant au moins 1 produit sont affichées.

**Avantages** :
- Interface plus propre
- Pas de confusion avec catégories vides
- Performance améliorée

### 3. Compteurs dynamiques

Affichage du nombre de produits et de sélections à chaque niveau :
```
▼ 📂 Maison et décoration (45) [2]
   ^                        ^   ^
   |                        |   └─ Nombre de sélections
   |                        └───── Nombre de produits
   └──────────────────────────── État ouvert/fermé
```

### 4. Repliage automatique

Après avoir sélectionné une sous-catégorie, la catégorie parent se replie automatiquement pour :
- ✅ Économiser l'espace vertical
- ✅ Améliorer la navigation
- ✅ Éviter l'effet "arbre trop ouvert"

### 5. Auto-expansion au chargement

Si des filtres sont actifs au chargement (ex: URL state, persistance), les familles/catégories correspondantes s'ouvrent automatiquement.

---

## 🎨 DESIGN VÉRONE (STRICT)

### Palette de couleurs autorisée

```css
/* AUTORISÉ */
✅ Noir (#000000) - Texte principal, sélections
✅ Blanc (#FFFFFF) - Fond, texte inversé
✅ Gris (#666666, #9CA3AF, #E5E7EB) - États intermédiaires

/* INTERDIT ABSOLU */
❌ Jaune, doré, ambre
❌ Couleurs vives ou saturées
✅ Seulement bleu pour états système (sélection catégorie)
```

### Typographie

```typescript
Famille : text-sm font-medium (14px medium)
Catégorie : text-sm (14px regular)
Sous-catégorie : text-sm (14px regular)
Compteur : text-xs opacity-50 (12px light)
Badge : text-xs (12px)
```

### Interactions

```typescript
Hover : transition-colors 150ms
Expand : transition-all 300ms
Clic : Instantané (<16ms pour 60fps)
```

---

## 💻 EXEMPLE DE CODE COMPLET

### Dans `/src/app/catalogue/page.tsx`

```typescript
"use client"

import { useState } from "react"
import { CategoryHierarchyFilterV2 } from "@/components/business/category-hierarchy-filter-v2"
import { useCatalogue } from "@/hooks/use-catalogue"
import { useFamilies } from "@/hooks/use-families"
import { useCategories } from "@/hooks/use-categories"
import { useSubcategories } from "@/hooks/use-subcategories"

export default function CataloguePage() {
  // Hooks de données
  const { products, setFilters } = useCatalogue()
  const { families } = useFamilies()
  const { allCategories } = useCategories()
  const { subcategories } = useSubcategories()

  // État local des filtres
  const [filters, setLocalFilters] = useState({
    subcategories: [] as string[]
  })

  // Fonction de toggle sous-catégorie
  const handleSubcategoryToggle = (subcategoryId: string) => {
    const newSubcategories = filters.subcategories.includes(subcategoryId)
      ? filters.subcategories.filter(id => id !== subcategoryId)
      : [...filters.subcategories, subcategoryId]

    // Mise à jour état local
    setLocalFilters(prev => ({
      ...prev,
      subcategories: newSubcategories
    }))

    // Synchronisation avec hook catalogue
    setFilters({
      subcategories: newSubcategories
    })
  }

  return (
    <div className="space-y-6">
      {/* Autres filtres (Statut, etc.) */}

      {/* FILTRE CATÉGORIES V2 */}
      <CategoryHierarchyFilterV2
        families={families}
        categories={allCategories}
        subcategories={subcategories}
        products={products}
        selectedSubcategories={filters.subcategories}
        onSubcategoryToggle={handleSubcategoryToggle}
      />

      {/* Grille produits */}
      <ProductGrid products={products} />
    </div>
  )
}
```

---

## 🧪 CHECKLIST DE TEST

Avant de déployer, vérifier :

```bash
# Fonctionnalités
✅ Les familles sans produits n'apparaissent pas
✅ Les compteurs sont corrects
✅ Sélection → Badge apparaît en haut
✅ Clic X sur badge → Filtre retiré
✅ Clic "Réinitialiser" → Tous filtres retirés
✅ Repliage automatique après sélection
✅ Auto-expansion au chargement si filtres actifs

# Performance
✅ Temps de rendu <100ms
✅ Toggle expand/collapse instantané
✅ Sélection instantanée
✅ Console errors = 0

# Design
✅ Couleurs strictement noir/blanc/gris
✅ Typographie Vérone respectée
✅ Animations subtiles (150ms/300ms)
✅ Responsive mobile OK

# Accessibilité
✅ Contraste élevé (WCAG AA)
✅ Zones cliquables >44px
✅ Navigation clavier fonctionnelle
✅ ARIA labels présents
```

---

## 🚀 DÉPLOIEMENT

### Build et test

```bash
# 1. Build local
npm run build

# 2. Test build
npm run start

# 3. Vérifier console errors avec Playwright MCP
mcp__playwright__browser_navigate("http://localhost:3000/catalogue")
mcp__playwright__browser_console_messages()

# 4. Capture screenshot
mcp__playwright__browser_take_screenshot()
```

### Commit et push

```bash
git add .
git commit -m "✨ FEAT: Filtre catégories V2 avec badges et compteurs"
git push origin main
```

### Auto-déploiement Vercel

Le déploiement se fait automatiquement via GitHub Actions après merge sur `main`.

---

## ⚡ PERFORMANCE

### Métriques attendues

```typescript
// Temps de calcul
Enrichissement hiérarchie : <50ms (initial)
Re-calcul sur changement : <20ms

// Temps de rendu
Rendu initial complet : <100ms
Toggle expand/collapse : <16ms (60fps)
Sélection sous-catégorie : <16ms (60fps)

// Mémoire
État enrichedHierarchy : ~50KB (500 items)
activeFilters : ~1KB (10 filtres)
```

### Optimisations implémentées

```typescript
✅ useMemo pour enrichissement hiérarchie
✅ useMemo pour filtres actifs
✅ Keys stables pour React reconciliation
✅ Évite re-renders inutiles
✅ Lazy computation des compteurs
```

---

## 🐛 DÉPANNAGE

### Problème : Compteurs à 0

**Cause** : Prop `products` manquante ou vide

**Solution** :
```typescript
// Vérifier que products est bien passé
console.log('Products:', products.length)

// Vérifier que products n'est pas filtré incorrectement
// (doit inclure TOUS les produits actifs, pas seulement filtrés)
```

### Problème : Badges ne s'affichent pas

**Cause** : `selectedSubcategories` vide ou incorrect

**Solution** :
```typescript
// Debug l'état
console.log('Selected:', selectedSubcategories)

// Vérifier la fonction toggle
const handleSubcategoryToggle = (subcategoryId: string) => {
  console.log('Toggle:', subcategoryId)
  // ...
}
```

### Problème : Performance lente

**Cause** : Trop de produits ou re-renders excessifs

**Solution** :
```typescript
// 1. Vérifier useMemo
const enrichedHierarchy = useMemo(() => {
  // ...
}, [families, categories, subcategories, products])

// 2. Limiter le nombre de produits si nécessaire
const limitedProducts = products.slice(0, 1000)
```

---

## 📞 SUPPORT

### Documentation

- **Guide complet** : [GUIDE-INTEGRATION-FILTRES-CATEGORIES-V2.md](./GUIDE-INTEGRATION-FILTRES-CATEGORIES-V2.md)
- **Migration** : [MIGRATION-FILTRES-V1-TO-V2.md](./MIGRATION-FILTRES-V1-TO-V2.md)
- **Design System** : [DESIGN-MOCKUPS-FILTRES-V2.md](./DESIGN-MOCKUPS-FILTRES-V2.md)
- **CLAUDE.md** : Règles générales du projet

### Contact

- **Issues** : Repository GitHub Issues
- **Design System** : Vérone Design Expert
- **Questions** : Documentation `/docs/guides/`

---

## 📝 CHANGELOG

### Version 2.0 (2025-10-07) - Initial Release

**Ajouté** :
- ✨ Badges amovibles avec fil d'Ariane
- ✨ Affichage conditionnel (uniquement si produits)
- ✨ Compteurs dynamiques à tous niveaux
- ✨ Repliage automatique après sélection
- ✨ Auto-expansion au chargement
- ✨ Bouton "Réinitialiser" global
- ✨ Performance optimisée (useMemo)
- ✨ Design strict noir/blanc Vérone

**Documentation** :
- 📚 Guide d'intégration complet
- 📚 Guide de migration V1 → V2
- 📚 Mockups design détaillés
- 📚 README (ce fichier)

---

## 🎉 PRÊT À L'EMPLOI

Le composant est **production-ready** et respecte strictement :
- ✅ Design System Vérone (noir/blanc uniquement)
- ✅ Performance SLO (<2s dashboard)
- ✅ Accessibilité WCAG AA
- ✅ Best practices React/TypeScript
- ✅ Optimisations useMemo
- ✅ Documentation complète

**Prochaine étape** : Suivre le guide d'intégration pour migrer depuis V1 !

---

**Vérone Back Office 2025** - Excellence Minimaliste
