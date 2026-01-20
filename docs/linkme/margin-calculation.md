# Module de Calcul de Marge LinkMe - SSOT

> **Single Source of Truth (SSOT)** - Ce module centralise tous les calculs de marge LinkMe.

## Introduction

Ce document décrit le module `margin-calculation` qui unifie tous les calculs de marge dans l'application LinkMe. Il garantit que les mêmes valeurs sont affichées partout (Back-office, LinkMe sélection, LinkMe commande).

## Composant Principal

**Nom du composant**: `margin-calculation.ts`

**Chemin**: `packages/@verone/utils/src/linkme/margin-calculation.ts`

**Import**:
```typescript
import {
  calculateMargin,
  calculateGainFromSellingPrice,
  calculateCartTotals,
  formatEuros,
  // Types
  type MarginCalculationInput,
  type MarginCalculationResult,
  type CartItemForCalculation,
  type CartTotalsResult
} from '@verone/utils';
```

## Formule Utilisée : TAUX DE MARQUE

La formule utilisée est le **taux de marque** (et non le taux de marge simple).

### Différence entre Taux de Marge et Taux de Marque

| Formule | Calcul | Exemple (base=100€, taux=15%) |
|---------|--------|-------------------------------|
| **Taux de marge** | `prix_vente = base × (1 + taux)` | 100 × 1.15 = **115€** |
| **Taux de marque** | `prix_vente = base / (1 - taux)` | 100 / 0.85 = **117.65€** |

**Nous utilisons le TAUX DE MARQUE** car c'est la formule utilisée dans la base de données (colonne `selling_price_ht` de `linkme_selection_items` qui est GENERATED).

### Calcul du Gain

```
gain = selling_price_ht - base_price_ht
```

Pour l'exemple ci-dessus (base=100€, taux=15%):
- Prix de vente = 117.65€
- Gain = 117.65 - 100 = **17.65€**

## Fonctions Disponibles

### `calculateMargin(input)`

Calcule le prix de vente et le gain pour un produit CATALOGUE.

```typescript
const result = calculateMargin({
  basePriceHt: 100,
  marginRate: 15,
});
// result = { sellingPriceHt: 117.65, gainEuros: 17.65, marginRate: 15 }
```

### `calculateGainFromSellingPrice(basePriceHt, sellingPriceHt)`

Calcule le gain directement depuis les valeurs DB (utilisé quand `selling_price_ht` est déjà calculé en base).

```typescript
const gain = calculateGainFromSellingPrice(100, 117.65);
// gain = 17.65
```

### `calculateAffiliateCommission(input)`

Calcule la commission prélevée sur un produit AFFILIÉ (revendeur).

```typescript
const result = calculateAffiliateCommission({
  sellingPriceHt: 500,
  commissionRate: 15,
});
// result = { commissionEuros: 75, affiliateReceives: 425, commissionRate: 15 }
```

### `calculateCartTotals(items)`

Calcule les totaux du panier avec la commission affilié.

```typescript
const totals = calculateCartTotals([
  { basePriceHt: 100, marginRate: 15, quantity: 2 },
  { basePriceHt: 50, marginRate: 10, quantity: 1 },
]);
// totals = { totalHT, totalTVA, totalTTC, totalCommission, itemsCount }
```

### Utilitaires

- `formatEuros(value)` - Formate un montant en euros (ex: "117,65 €")
- `formatPercent(value)` - Formate un pourcentage (ex: "15,0%")

## Exemple Concret : Plateau Bois 20x30cm

| Donnée | Valeur |
|--------|--------|
| Prix de base HT | 20.19 € |
| Taux de marge | 15% |
| **Prix de vente HT** | 20.19 / (1 - 0.15) = **23.75 €** |
| **Gain affilié** | 23.75 - 20.19 = **3.56 €** |

## Où ce Module est Utilisé

| Fichier | Usage |
|---------|-------|
| `EditMarginModal.tsx` | Affichage du gain dans la modal de modification de marge |
| `use-order-form.ts` | Calcul des totaux du panier et de la commission |
| `ProductsStep.tsx` | Passage de `basePriceHt` au CartItem |
| `ma-selection/[id]/produits/page.tsx` | Affichage du gain dans la liste et la modal détail |

## Principes à Respecter

1. **Ne JAMAIS dupliquer les formules** - Toujours importer depuis `@verone/utils`
2. **Préférer la lecture DB** - Utiliser `calculateGainFromSellingPrice()` quand `selling_price_ht` est disponible
3. **Arrondi à 2 décimales** - Toutes les fonctions arrondissent automatiquement

## Migration

Ce module remplace les calculs locaux suivants :

```typescript
// AVANT (incorrect - taux de marge)
const gain = basePriceHt * (marginRate / 100);

// APRÈS (correct - taux de marque via SSOT)
import { calculateMargin } from '@verone/utils';
const { gainEuros } = calculateMargin({ basePriceHt, marginRate });
```

## Tests

Pour vérifier le bon fonctionnement:

```bash
# Type-check
npm run type-check

# Build
npm run build
```

## Contact

Pour toute question sur ce module, consulter la documentation technique ou contacter l'équipe de développement.

---

**Version**: 1.0.0
**Dernière mise à jour**: 2026-01-20
