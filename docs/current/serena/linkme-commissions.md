> **Source de verite** : `docs/current/linkme/GUIDE-COMPLET-LINKME.md`
> Ce fichier est conserve comme resume rapide. En cas de contradiction, le guide unifie fait foi.

# Calcul des Commissions LinkMe

---

Status: CRITICAL
Last_verified_commit: 1fc9646c
Primary_sources:

- apps/linkme/src/lib/hooks/
- supabase/migrations/20260109\*.sql
  Owner: Romeo Dos Santos
  Created: 2026-01-07
  Updated: 2026-01-11

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
-- TAUX DE MARQUE: margin_rate s'applique sur le PRIX DE VENTE, pas sur le cout
-- Formule prix de vente: selling_price = base_price / (1 - margin_rate / 100)
-- La marge de l'affilie est INCLUSE dans le prix de vente LinkMe

-- Exemple avec base = 100€, margin_rate = 15%:
selling_price_ht = base_price_ht / (1 - margin_rate / 100)
-- selling_price = 100 / (1 - 0.15) = 100 / 0.85 = 117.65€

-- La retrocession (gain affilie) = prix de vente × taux de marque
retrocession_affilie = selling_price_ht × (margin_rate / 100) × quantity
-- retrocession = 117.65 × 0.15 = 17.65€

-- Commission plateforme LinkMe (ex: 5%) AJOUTEE au prix de vente
prix_client_final = selling_price_ht × (1 + channel_commission_rate / 100)
-- prix_client = 117.65 × 1.05 = 123.53€
```

### Produits AFFILIE/REVENDEUR (LinkMe preleve sur l'affilie)

```sql
-- MODELE INVERSE: L'affilie fixe son prix, LinkMe deduit sa commission
-- Le prix que l'affilie definit = prix de vente final au client

prix_vente_client = products.price_ht  -- Prix defini par l'affilie
commission_linkme = prix_vente_client × (affiliate_commission_rate / 100)
payout_affilie = prix_vente_client - commission_linkme
-- Exemple: 100€ vente - 10% commission = 90€ payout pour l'affilie
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
  // REVENDEUR: LinkMe deduit sa commission du prix defini par l'affilie
  const commissionLinkMe = prixVente * (affiliateCommissionRate / 100);
  const payoutAffilie = prixVente - commissionLinkMe;
  // Exemple: 100€ × 10% = 10€ commission, payout = 90€
} else {
  // CATALOGUE: Taux de MARQUE (sur prix de vente)
  const prixVenteAvecMarge = prixBase / (1 - marginRate / 100);
  const margeAffilie = prixVenteAvecMarge * (marginRate / 100);
  // Exemple: 100€ / 0.85 = 117.65€, marge = 117.65 × 15% = 17.65€
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

## Commission HT vs TTC

### Principe

**Tous les calculs de commission sont effectues en HT.**

| Element               | Base de calcul | TVA         |
| --------------------- | -------------- | ----------- |
| Prix de base          | HT             | Non incluse |
| Prix de vente affilié | HT             | Non incluse |
| Marge affilié (gain)  | HT             | Non incluse |
| Commission plateforme | HT             | Non incluse |

### Formule commission HT

```sql
-- Commission = prix de vente HT × taux de marque
commission_ht = selling_price_ht × (margin_rate / 100)

-- Exemple: selling_price = 117.65€ HT, margin_rate = 15%
-- commission_ht = 117.65 × 0.15 = 17.65€ HT
```

### TVA sur commissions

| Question                                     | Réponse                                             |
| -------------------------------------------- | --------------------------------------------------- |
| La TVA s'applique-t-elle sur la commission?  | **NON**                                             |
| La commission est calculée sur quel montant? | Prix de vente **HT**                                |
| L'affilié reçoit sa commission en?           | **HT** (il déclare ensuite selon son régime fiscal) |

### Affichage pour les affiliés

| Interface             | Affichage par défaut | Configurable               |
| --------------------- | -------------------- | -------------------------- |
| Dashboard commissions | **HT**               | Non                        |
| Détail commande       | HT                   | Non                        |
| Page sélection        | HT ou TTC            | Oui (`price_display_mode`) |
| Checkout client       | **TTC**              | Non                        |

La selection a un champ `price_display_mode` ('HT' ou 'TTC') qui permet à l'affilié de choisir comment afficher les prix à ses clients, mais les calculs internes restent toujours en HT.

---

## Exemples Concrets

### Exemple 1: Pokawa - Plateau bois 20x30

```
Produit catalogue Vérone:
- base_price_ht = 20.19€
- margin_rate = 15%

Calcul (taux de marque):
- selling_price_ht = 20.19 / (1 - 0.15) = 20.19 / 0.85 = 23.75€
- gain_affilie_ht = 23.75 - 20.19 = 3.56€

Vérification:
- 23.75 × 15% = 3.56€ ✓

Commission plateforme (5%):
- prix_client_ht = 23.75 × 1.05 = 24.94€ HT
- prix_client_ttc = 24.94 × 1.20 = 29.93€ TTC
```

### Exemple 2: Black & White - Meuble sur mesure

```
Produit affilié (créé par l'affilié):
- prix_vente_defini = 500€ HT
- affiliate_commission_rate = 10%

Calcul:
- commission_linkme = 500 × 10% = 50€ HT
- payout_affilie = 500 - 50 = 450€ HT

Le client paie:
- prix_ttc = 500 × 1.20 = 600€ TTC
```

### Exemple 3: Commande multi-produits

```
Panier:
1. Plateau bois × 2 (catalogue, marge 15%)
   - base: 20.19€, selling: 23.75€, gain: 3.56€ × 2 = 7.12€
2. Chaise design × 1 (catalogue, marge 20%)
   - base: 80€, selling: 100€, gain: 20€ × 1 = 20€
3. Meuble custom × 1 (affilié, commission 10%)
   - prix: 500€, commission LinkMe: 50€, payout: 450€

Totaux affilié:
- Gains produits catalogue: 7.12 + 20 = 27.12€ HT
- Payout produit affilié: 450€ HT
- Total reçu: 477.12€ HT (avant impôts affilié)
```

---

## References

- `apps/linkme/src/lib/hooks/use-affiliate-analytics.ts` - Analytics
- `packages/@verone/orders/src/hooks/linkme/use-linkme-orders.ts` - Hook commandes
- `packages/@verone/utils/src/linkme/margin-calculation.ts` - SSOT calculs
- `packages/@verone/utils/src/linkme/constants.ts` - Constantes centralisées
- `supabase/migrations/20260109_004_recalculate_pokawa_commissions.sql` - Recalcul
