# Products & Catalogue — Architecture Reference

**Date** : 2026-03-27

## Pages principales

| Route | Description |
|---|---|
| `/produits/catalogue/` | Liste produits avec pagination, filtres, recherche |
| `/produits/catalogue/[productId]/` | Detail produit (onglets : general, descriptions, pricing, caracteristiques, images, stock) |
| `/produits/catalogue/categories/` | Gestion des categories |
| `/produits/catalogue/variantes/` | Groupes de variantes |
| `/produits/sourcing/` | Workflow sourcing fournisseurs |

## Hooks principaux

Localisation : `packages/@verone/products/src/hooks/`

| Hook | Usage |
|---|---|
| `use-products.ts` | CRUD produits, pagination, cache SWR |
| `use-product-images.ts` | Gestion images (upload, primary, order) |
| `use-product-variants.ts` | Variantes produit |
| `use-product-status.ts` | Statut produit |
| `use-completion-status.ts` | Suivi completion fiche produit |
| `use-sourcing-products.ts` | Workflow sourcing |

## Tables DB

| Table | Description |
|---|---|
| `products` | Table principale (sku, name, cost_price, margin_percentage, product_status, stock_status, supplier_id) |
| `product_images` | Images (public_url, is_primary, display_order) |
| `product_categories` | Categories |
| `subcategories` | Sous-categories |
| `variant_groups` | Groupes de variantes |

## Systeme de prix

- `cost_price` : prix d'achat HT
- `margin_percentage` : taux de marge
- Prix de vente minimum calcule : `cost_price * (1 + margin_percentage / 100)`

## Statuts

- **product_status** : draft, active, preorder, discontinued
- **stock_status** : in_stock, out_of_stock, coming_soon
