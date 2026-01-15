# BUG CRITIQUE : LM-ORD-006 Implémentation Incomplète

**Date**: 2026-01-15
**Statut**: 🔴 BLOQUANT
**Détecté par**: Tests manuels Playwright READ1

---

## 📊 Problème

L'implémentation de **LM-ORD-006** (Refonte UX Sélection Produits) est **incomplète** :

### ❌ CE QUI MANQUE (CRITIQUE)

1. **Barre de recherche produits** - ABSENT
2. **Filtres par catégories** - ABSENT
3. **Filtres par sous-catégories** - ABSENT
4. **Layout trop compressé** - Les produits sont affichés en petite grille dans un espace réduit

### ✅ CE QUI FONCTIONNE

1. ✅ Layout 2 sections (Sélection + Restaurant)
2. ✅ Grille de produits responsive
3. ✅ Pagination (visible dans le snapshot)
4. ✅ Panier sticky à droite (vide state visible)

---

## 🔍 Evidence

**Screenshot** : `.claude/reports/test-LM-ORD-006-top-of-modal.png`

**Code** : `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx`

**Flow testé** : "Restaurant existant" → Sélection "Collection Mobilier Pokawa" (31 produits)

**Ce qui apparaît** :
- Section "Sélection de produits" (titre uniquement)
- Titre "Sélection de produits — Collection Mobilier Pokawa"
- Grille 3 colonnes avec produits (Plateau bois, Coussin Bleu, etc.)
- **PAS de barre de recherche au-dessus**
- **PAS d'onglets catégories**
- Pagination présente (1, 2, 3)

---

## 💡 Solution Proposée par l'Utilisateur

**Séparer le flow "Restaurant existant" en 2 étapes** (comme le flow "Nouveau restaurant") :

### Architecture Actuelle (PROBLÉMATIQUE)

```
┌─────────────────────────────────────────────────────┐
│ Commande - Restaurant existant                     │
├──────────────────────┬──────────────────────────────┤
│ Sélection produits   │ Restaurant                   │
│ (compressée)         │ (liste restaurants)          │
│                      │                              │
│ [Grille produits]    │ - Pokawa Bourgoin           │
│ (manque search +     │ - Pokawa Saint Maximin      │
│  filtres)            │ - POKAWA MEYLAN             │
│                      │                              │
│ [Pagination]         │                              │
└──────────────────────┴──────────────────────────────┘
```

### Architecture Recommandée (SOLUTION)

**Étape 1 : Sélection Restaurant**
```
┌─────────────────────────────────────────────────────┐
│ Commande - Restaurant existant                     │
│ Étape 1/2                                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Sélectionnez le restaurant                        │
│                                                     │
│  ○ Pokawa Bourgoin Jallieu                        │
│  ○ Pokawa Saint Maximin                           │
│  ○ POKAWA MEYLAN                                   │
│                                                     │
│                    [Suivant →]                      │
└─────────────────────────────────────────────────────┘
```

**Étape 2 : Sélection Produits (FULL SCREEN)**
```
┌──────────────────────────────────────────────────────────────────┐
│ Commande - Restaurant existant                                  │
│ Étape 2/2 - Pokawa Bourgoin Jallieu                            │
├─────────────────────────────┬────────────────────────────────────┤
│ CATALOGUE (60%)             │ PANIER (40%)                       │
│                             │                                    │
│ [🔍 Recherche produits...]  │ ┌────────────────────────────────┐│
│                             │ │ Panier                         ││
│ [Tout] [Mobilier] [Déco]   │ │ 3 articles                     ││
│ [Luminaires] [Textile]      │ │ Total: 125,00 € TTC           ││
│                             │ │                                ││
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐       │ │ [Liste produits panier]       ││
│ │  │ │  │ │  │ │  │       │ │                                ││
│ └──┘ └──┘ └──┘ └──┘       │ │ [Commission: +15,00 €]        ││
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐       │ └────────────────────────────────┘│
│ │  │ │  │ │  │ │  │       │                                    │
│ └──┘ └──┘ └──┘ └──┘       │                                    │
│                             │                                    │
│ [1] [2] [3] [>]            │                                    │
│                             │                                    │
│         [← Retour]          │         [Créer commande →]         │
└─────────────────────────────┴────────────────────────────────────┘
```

---

## 🎯 Avantages de la Solution

### 1. Réutilisation de Code Existant

**Composants à réutiliser** (déjà fonctionnels dans `OrderFormUnified`) :
- ✅ `ProductFilters` (barre recherche)
- ✅ `CategoryTabs` (onglets catégories)
- ✅ `Pagination`
- ✅ Layout 2 colonnes (catalogue + panier)
- ✅ Logique de filtrage (search + category)

**Fichier source** : `apps/linkme/src/components/OrderFormUnified.tsx` (lignes 212-629)

### 2. Cohérence UX

- ✅ **Même expérience** entre commande authentifiée et commande publique
- ✅ **Espace optimal** pour la sélection produits (full screen)
- ✅ **Tous les filtres** disponibles (recherche + catégories)
- ✅ **Panier toujours visible** (sticky à droite)

### 3. Maintenabilité

- ✅ Un seul composant de sélection produits (`ProductSelector`)
- ✅ Moins de duplication de code
- ✅ Plus facile à tester

---

## 📝 Plan de Correction (LM-ORD-006-FIX)

### Phase 1 : Créer Composant Réutilisable

**Nouveau fichier** : `apps/linkme/src/components/ProductSelector.tsx`

Extraire la logique de sélection produits depuis `OrderFormUnified` :
- Barre recherche
- Filtres catégories
- Grille responsive
- Pagination
- Panier sticky

### Phase 2 : Refactoriser CreateOrderModal (Flow "Restaurant existant")

**Fichier** : `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx`

**Remplacer** :
```typescript
// ACTUELLEMENT (1 étape)
<div className="grid grid-cols-[50%_50%]">
  <SelectionSection />  {/* Gauche */}
  <RestaurantSection /> {/* Droite */}
</div>
```

**PAR** :
```typescript
// NOUVEAU (2 étapes)
{step === 1 && <RestaurantSelection />}
{step === 2 && <ProductSelector />}
```

### Phase 3 : Adapter Flow "Nouveau restaurant"

**Actuellement** : 5 étapes
- Étape 1 : Restaurant
- Étape 2 : Propriétaire
- Étape 3 : Facturation
- Étape 4 : Produits (PROBLÈME : même bug, pas de search/filtres)
- Étape 5 : Validation

**Correction** : Remplacer étape 4 par `<ProductSelector />`

---

## 🚨 Impact Utilisateur

**Problème actuel** :
- ❌ Catalogue de 31 produits **difficile à parcourir** sans recherche
- ❌ Pas de filtre par catégorie → l'utilisateur doit **scroller tous les produits**
- ❌ Layout compressé → **mauvaise UX**

**Avec la correction** :
- ✅ Recherche rapide par nom/SKU
- ✅ Filtrage par catégorie (ex: "Mobilier", "Déco", "Luminaires")
- ✅ Full screen → confortable
- ✅ Cohérence avec formulaire public

---

## 🔗 Fichiers Liés

**Plan initial** : `.claude/work/PLAN-LM-ORD-006-PRODUCT-SELECTION-UX.md`

**Code actuel** :
- `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx`
- `apps/linkme/src/components/OrderFormUnified.tsx` (référence à copier)

**Composants publics** (à réutiliser) :
- `apps/linkme/src/components/public-selection/ProductFilters.tsx`
- `apps/linkme/src/components/public-selection/CategoryTabs.tsx`
- `apps/linkme/src/components/public-selection/Pagination.tsx`

---

## ⏱️ Priorité & Effort

**Priorité** : 🔴 HAUTE (UX bloquante pour catalogues > 20 produits)

**Effort estimé** :
- Phase 1 (Composant ProductSelector) : 3h
- Phase 2 (Refacto CreateOrderModal) : 2h
- Phase 3 (Adapter nouveau restaurant) : 1h
- **TOTAL** : ~6h

---

**Créé par** : READ1 Agent (Tests Playwright)
**Date** : 2026-01-15
**Statut** : À implémenter par WRITE Agent
