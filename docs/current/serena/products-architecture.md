# Architecture Centrale des Produits

---

Status: CRITICAL
Last_verified_commit: 1fc9646c
Primary_sources:

- packages/@verone/products/src/
- supabase/migrations/
  Owner: Romeo Dos Santos
  Created: 2025-12-02
  Updated: 2026-01-10

---

## Principe Fondamental

**La table `products` est l'element CENTRAL de tout developpement** pour :

- Site Internet (e-commerce public)
- LinkMe (affilies/apporteurs)
- Back-office (CRM/ERP)

---

## Architecture Canaux de Vente

```
products (SOURCE CENTRALE)
├── price_ht → Prix de vente HT (defini dans page produit > onglet Tarification)
├── cost_price → Prix d'achat fournisseur
├── name, sku, stock_real, etc.
└── [autres colonnes produit]

Tables de liaison par canal:
├── linkme_catalog_products → Parametres specifiques LinkMe (marges, featured, etc.)
├── channel_pricing → Pricing multi-canaux (B2B, B2C, Wholesale, etc.)
└── [autres tables canal]
```

---

## Regles d'Or

1. **TOUJOURS recuperer les donnees produit depuis `products`**
   - Prix de vente : `products.price_ht`
   - Prix d'achat : `products.cost_price`
   - Nom, SKU, stock : depuis `products`

2. **Tables de liaison ajoutent UNIQUEMENT les infos specifiques au canal**
   - `linkme_catalog_products` : marges affilies, is_featured, is_enabled
   - `channel_pricing` : prix custom par canal SI override necessaire

3. **Ne PAS dupliquer les donnees produit dans les tables canal**
   - Utiliser JOIN pour recuperer les donnees

---

## Exemple : Catalogue LinkMe

```sql
-- La RPC doit retourner:
SELECT
  lcp.id,
  lcp.min_margin_rate,
  lcp.max_margin_rate,
  lcp.is_featured,
  -- Donnees produit depuis products (SOURCE CENTRALE)
  p.price_ht AS selling_price_ht,  -- Prix de vente = products.price_ht
  p.cost_price,                     -- Prix d'achat
  p.name,
  p.sku
FROM linkme_catalog_products lcp
JOIN products p ON p.id = lcp.product_id
```

---

## Page Produit - Onglet Tarification

URL: `/produits/catalogue/[product_id]`

Cet onglet permet de definir :

- `price_ht` : Prix de vente HT (ce qui apparait sur LinkMe/site-internet)
- Marges par canal (si applicable)
- Prix promotionnels (si applicable)

---

## Regles Absolues

1. **JAMAIS** stocker de prix dans les tables canal
2. **TOUJOURS** joindre avec `products` pour les donnees produit
3. **JAMAIS** demander ou sont stockees les donnees produit (reponse: table `products`)

---

## References

- `packages/@verone/products/src/` - Composants produits
- `apps/back-office/src/app/produits/` - Pages admin produits
- `docs/current/serena/database-schema-mappings.md` - Mappings DB
