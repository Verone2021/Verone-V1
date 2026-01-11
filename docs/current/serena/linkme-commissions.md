# Calcul des Commissions LinkMe

---

Status: CRITICAL
Last_verified_commit: 1fc9646c
Primary_sources:

- apps/linkme/src/lib/hooks/
- supabase/migrations/20260109\*.sql
  Owner: Romeo Dos Santos
  Created: 2026-01-07
  Updated: 2026-01-10

---

## Hierarchie des Donnees

```
products → channel_pricing → linkme_selection_items → sales_order_items → linkme_commissions
```

---

## Sources de Verite par Donnee

| Donnee                   | Source       | Table                         | Colonne                |
| ------------------------ | ------------ | ----------------------------- | ---------------------- |
| Prix produit catalogue   | products     | `products`                    | `price_ht`             |
| **Marge affilie (%)**    | Selection    | `linkme_selection_items`      | `margin_rate`          |
| Prix vente affilie       | Selection    | `linkme_selection_items`      | `selling_price_ht`     |
| **Commission par ligne** | Vue enrichie | `linkme_order_items_enriched` | `affiliate_margin`     |
| Commission par commande  | Commissions  | `linkme_commissions`          | `affiliate_commission` |

---

## Formules Officielles

### Produits CATALOGUE (Verone distribue a l'affilie)

```sql
-- L'affilie GAGNE une marge SUR le prix de base
commission_affilie = base_price_ht × (margin_rate / 100) × quantity
prix_vente_final = base_price_ht × (1 + margin_rate / 100)
```

### Produits AFFILIE/REVENDEUR (Verone preleve sur l'affilie)

```sql
-- INVERSE: Verone DEDUIT sa commission du prix de vente
-- Le prix catalogue EST le prix de vente final au client
prix_vente_client = products.price_ht  -- C'est le prix affiche
commission_verone = prix_vente_client × (affiliate_commission_rate / 100)
payout_affilie = prix_vente_client - commission_verone
-- Exemple: 500€ vente - 75€ commission = 425€ pour l'affilie
```

---

## Formule Correcte (Taux de Marque)

**ERREUR CORRIGEE (2026-01-10)** : Le RPC `create_public_linkme_order` utilisait la mauvaise formule.

```sql
-- margin_rate = TAUX DE MARQUE (sur prix de vente), PAS taux de marge (sur cout)
retrocession_amount = selling_price_ht × margin_rate / 100 × quantity
```

**Exemple Plateau bois 20x30:**

- base_price_ht = 20.19€
- selling_price_ht = 23.75€
- margin_rate = 15%
- **CORRECT**: 23.75 × 15% = **3.56€**
- **INCORRECT**: 20.19 × 15% = 3.03€

---

## Colonnes a Utiliser

- `sales_order_items.retrocession_amount` - Correctement peuple depuis 2026-01-10
- `sales_order_items.retrocession_rate` - Taux de marque depuis selection
- `linkme_order_items_enriched.affiliate_margin` pour vues enrichies
- `products.created_by_affiliate` pour identifier le type de produit
- `products.affiliate_commission_rate` pour le taux Verone sur produits affilies

---

## Identification Type de Produit

```typescript
const isAffiliateProduct = item.product?.created_by_affiliate !== null;

if (isAffiliateProduct) {
  // Modele INVERSE: Verone DEDUIT sa commission
  const fraisLinkMe = prixVente * (affiliateCommissionRate / 100);
  const payoutAffilie = prixVente - fraisLinkMe;
} else {
  // Modele STANDARD: L'affilie GAGNE une marge
  const margeAffilie = prixBase * (marginRate / 100);
  const prixFinal = prixBase + margeAffilie;
}
```

---

## Vues Importantes

- `linkme_order_items_enriched` - Items avec calcul marge correct
- `linkme_orders_with_margins` - Commandes avec marge totale
- `linkme_orders_enriched` - Commandes avec infos client/affilie

---

## Regles Absolues

1. **JAMAIS** confondre taux de marge et taux de marque
2. **TOUJOURS** utiliser selling_price_ht pour calcul commission
3. **JAMAIS** supposer que margin_rate s'applique sur base_price

---

## References

- `apps/linkme/src/lib/hooks/use-affiliate-analytics.ts` - Analytics
- `packages/@verone/orders/src/hooks/linkme/use-linkme-orders.ts` - Hook commandes
- `supabase/migrations/20260109_004_recalculate_pokawa_commissions.sql` - Recalcul
