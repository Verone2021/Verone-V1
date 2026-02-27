# Sources de Vérité - Commissions LinkMe

**Date**: 2026-01-07

## Hiérarchie des Données

```
products → channel_pricing → linkme_selection_items → sales_order_items → linkme_commissions
```

## Sources de Vérité par Donnée

| Donnée                   | Source       | Table                         | Colonne                |
| ------------------------ | ------------ | ----------------------------- | ---------------------- |
| Prix produit catalogue   | products     | `products`                    | `price_ht`             |
| **Marge affilié (%)**    | Sélection    | `linkme_selection_items`      | `margin_rate`          |
| Prix vente affilié       | Sélection    | `linkme_selection_items`      | `selling_price_ht`     |
| **Commission par ligne** | Vue enrichie | `linkme_order_items_enriched` | `affiliate_margin`     |
| Commission par commande  | Commissions  | `linkme_commissions`          | `affiliate_commission` |

## Formules Officielles

### Produits CATALOGUE (Verone distribue à l'affilié)

```sql
-- L'affilié GAGNE une marge SUR le prix de base
commission_affilié = base_price_ht × (margin_rate / 100) × quantity
prix_vente_final = base_price_ht × (1 + margin_rate / 100)
```

### Produits AFFILIÉ/REVENDEUR (Verone prélève sur l'affilié)

```sql
-- INVERSE: Verone DÉDUIT sa commission du prix de vente
-- Le prix catalogue EST le prix de vente final au client
prix_vente_client = products.price_ht  -- C'est le prix affiché
commission_verone = prix_vente_client × (affiliate_commission_rate / 100)
payout_affilié = prix_vente_client - commission_verone
-- Exemple: 500€ vente - 75€ commission = 425€ pour l'affilié
```

**ATTENTION CRITIQUE:**

- Produit CATALOGUE: on AJOUTE la marge au prix → prix final > prix base
- Produit AFFILIÉ: on DÉDUIT la commission du prix → payout < prix vente

## ⚠️ ATTENTION CRITIQUE

### ERREUR CORRIGÉE (2026-01-10): Formule RPC Public

Le RPC `create_public_linkme_order` n'utilisait pas la bonne formule.

**FORMULE CORRECTE (TAUX DE MARQUE):**

```sql
-- margin_rate = TAUX DE MARQUE (sur prix de vente), PAS taux de marge (sur coût)
retrocession_amount = selling_price_ht × margin_rate / 100 × quantity
```

**Exemple Plateau bois 20x30:**

- base_price_ht = 20.19€
- selling_price_ht = 23.75€
- margin_rate = 15%
- **CORRECT**: 23.75 × 15% = **3.56€**
- **INCORRECT**: 20.19 × 15% = 3.03€ ❌

### ERREUR HISTORIQUE CORRIGÉE (2026-01-09)

Le code AJOUTAIT la marge au lieu de la DÉDUIRE pour les produits affiliés.

- FAUX: 500€ + 15% = 575€
- CORRECT: 500€ - 15% = 425€ payout

### À UTILISER MAINTENANT

- `sales_order_items.retrocession_amount` - ✅ Correctement peuplé depuis 2026-01-10
- `sales_order_items.retrocession_rate` - ✅ Taux de marque depuis sélection
- `linkme_order_items_enriched.affiliate_margin` pour vues enrichies
- `products.created_by_affiliate` pour identifier le type de produit
- `products.affiliate_commission_rate` pour le taux Vérone sur produits affiliés

## Vues Importantes

- `linkme_order_items_enriched` - Items avec calcul marge correct
- `linkme_orders_with_margins` - Commandes avec marge totale
- `linkme_orders_enriched` - Commandes avec infos client/affilié

## Fichiers Clés Corrigés (Audit 2026-01-09)

| Fichier                                                         | Rôle                                                | Status |
| --------------------------------------------------------------- | --------------------------------------------------- | ------ |
| `apps/back-office/.../selections/[id]/page.tsx`                 | Page sélection avec calcul corrigé + onglets        | ✅     |
| `apps/back-office/.../hooks/use-linkme-selections.ts`           | Hook avec champs produits affiliés                  | ✅     |
| `apps/linkme/src/lib/hooks/use-all-products-stats.ts`           | Stats produits (utilise vue enrichie)               | ✅     |
| `apps/linkme/src/lib/hooks/use-affiliate-analytics.ts`          | Analytics affilié (corrigé: affiliate_margin)       | ✅     |
| `packages/@verone/orders/src/hooks/linkme/use-linkme-orders.ts` | Création commandes (corrigé: base_price_ht)         | ✅     |
| `apps/back-office/.../hooks/use-linkme-orders.ts`               | Hook commandes back-office (corrigé: base_price_ht) | ✅     |

## Migrations Appliquées (2026-01-09)

| Migration                                             | Description                          | Résultat     |
| ----------------------------------------------------- | ------------------------------------ | ------------ |
| `20260109_003_fix_affiliate_products_margin_rate.sql` | margin_rate=0 pour produits affiliés | 0 violations |
| `20260109_004_recalculate_pokawa_commissions.sql`     | Recalcul 12 commissions Pokawa       | +1,737.83€   |

## Résultats Audit Pokawa

- **Commissions récupérées**: +1,737.83€
- **Total après correction**: 28,434.57€
- **Affiliate ID**: `cdcb3238-0abd-4c43-b1fa-11bb633df163`

## Comment Identifier le Type de Produit

```typescript
const isAffiliateProduct = item.product?.created_by_affiliate !== null;

if (isAffiliateProduct) {
  // Modèle INVERSÉ: Vérone DÉDUIT sa commission
  const fraisLinkMe = prixVente * (affiliateCommissionRate / 100);
  const payoutAffilie = prixVente - fraisLinkMe;
} else {
  // Modèle STANDARD: L'affilié GAGNE une marge
  const margeAffilie = prixBase * (marginRate / 100);
  const prixFinal = prixBase + margeAffilie;
}
```
