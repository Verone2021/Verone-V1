# Architecture Centrale des Produits - Vérone

**Date**: 2025-12-02
**Importance**: CRITIQUE

---

## PRINCIPE FONDAMENTAL

**La table `products` est l'élément CENTRAL de tout développement** pour :

- Site Internet (e-commerce public)
- LinkMe (affiliés/apporteurs)
- Back-office (CRM/ERP)

---

## ARCHITECTURE CANAUX DE VENTE

```
products (SOURCE CENTRALE)
├── price_ht → Prix de vente HT (défini dans page produit > onglet Tarification)
├── cost_price → Prix d'achat fournisseur
├── name, sku, stock_real, etc.
└── [autres colonnes produit]

Tables de liaison par canal:
├── linkme_catalog_products → Paramètres spécifiques LinkMe (marges, featured, etc.)
├── channel_pricing → Pricing multi-canaux (B2B, B2C, Wholesale, etc.)
└── [autres tables canal]
```

---

## RÈGLES D'OR

1. **TOUJOURS récupérer les données produit depuis `products`**
   - Prix de vente : `products.price_ht`
   - Prix d'achat : `products.cost_price`
   - Nom, SKU, stock : depuis `products`

2. **Tables de liaison ajoutent UNIQUEMENT les infos spécifiques au canal**
   - `linkme_catalog_products` : marges affiliés, is_featured, is_enabled
   - `channel_pricing` : prix custom par canal SI override nécessaire

3. **Ne PAS dupliquer les données produit dans les tables canal**
   - Utiliser JOIN pour récupérer les données

---

## EXEMPLE : CATALOGUE LINKME

```sql
-- La RPC doit retourner:
SELECT
  lcp.id,
  lcp.min_margin_rate,
  lcp.max_margin_rate,
  lcp.is_featured,
  -- Données produit depuis products (SOURCE CENTRALE)
  p.price_ht AS selling_price_ht,  -- Prix de vente = products.price_ht
  p.cost_price,                     -- Prix d'achat
  p.name,
  p.sku
FROM linkme_catalog_products lcp
JOIN products p ON p.id = lcp.product_id
```

---

## PAGE PRODUIT - ONGLET TARIFICATION

URL: `/produits/catalogue/[product_id]`

Cet onglet permet de définir :

- `price_ht` : Prix de vente HT (ce qui apparaît sur LinkMe/site-internet)
- Marges par canal (si applicable)
- Prix promotionnels (si applicable)

---

## RAPPEL

**NE JAMAIS demander où sont stockées les données produit.**
**Réponse : Dans la table `products`, accessible via JOIN depuis les tables canal.**
