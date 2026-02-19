# Index Complet des Entites Back Office Verone

**Date audit** : 2026-02-19
**Source** : Audit direct DB production

---

## Vue d'ensemble rapide

| Domaine              | Entite principale      | Donnees reelles                         | Statut                         |
| -------------------- | ---------------------- | --------------------------------------- | ------------------------------ |
| Produits             | `products`             | 224 produits (200 actifs)               | ACTIF                          |
| Variantes            | `variant_groups`       | 0 groupes utilises                      | STRUCTURE PRETE, PAS UTILISE   |
| Collections          | `collections`          | 2 collections, 0 produits lies          | QUASI VIDE                     |
| Commandes vente      | `sales_orders`         | 130 commandes (toutes shipped)          | ACTIF                          |
| Factures             | `invoices`             | 23 records legacy (donnees historiques) | LEGACY - Facturation via Qonto |
| Stocks               | `stock_movements`      | 248 mouvements                          | ACTIF                          |
| Achats fournisseurs  | `purchase_orders`      | 14 bons de commande                     | ACTIF                          |
| Organisations        | `organisations`        | 198 orgs                                | ACTIF                          |
| Enseignes            | `enseignes`            | 2 (Pokawa, Black & White)               | ACTIF                          |
| Contacts             | `contacts`             | 8 contacts                              | ACTIF                          |
| Clients particuliers | `individual_customers` | 19 clients                              | ACTIF                          |
| LinkMe               | `linkme_affiliates`    | 3 affilies                              | ACTIF                          |
| Listes de prix       | `price_lists`          | 5 listes, toutes vides                  | STRUCTURE PRETE, PAS UTILISE   |
| Banque               | `bank_transactions`    | 646 transactions                        | ACTIF                          |

---

## 1. PRODUITS

### Table principale : `products` (224 records)

Un produit = une fiche article unique (ex: "Chaise Eames DSW Noire").

**Statuts** : active (200), discontinued (13), preorder (7), draft (4)

**Champs cles** :

- Identite : `name`, `sku`, `slug`, `brand`, `description`, `technical_description`
- Classification : `subcategory_id` → subcategories → categories → families
- Fournisseur : `supplier_id` → organisations (le fournisseur est une organisation)
- Prix achat : `cost_price`, `cost_price_avg/min/max/last`, `cost_net_avg/min/max/last`
- Stock : `stock_quantity`, `stock_real`, `stock_forecasted_in/out`, `min_stock`, `reorder_point`
- Dimensions : `dimensions` (jsonb), `weight`
- SEO : `meta_title`, `meta_description`, `slug`, `is_published_online`
- Affiliation LinkMe : `created_by_affiliate`, `affiliate_payout_ht`, `affiliate_commission_rate`, `affiliate_approval_status`
- Enseigne : `enseigne_id` → enseignes (enseigne pour laquelle le produit est source)

**Relations** :

- `product_images` : photos du produit (257 images au total)
- `product_colors` : couleurs disponibles (20 records)
- `product_packages` : conditionnements (0 records)
- `product_status_changes` : historique des changements de statut
- `product_commission_history` : historique des commissions
- `product_purchase_history` : historique des achats fournisseur

### Variantes : `variant_groups` + `products.variant_group_id`

**ATTENTION : PAS DE TABLE `product_variants`**. Les variantes fonctionnent ainsi :

- Un `variant_group` regroupe plusieurs `products` qui sont des declinaisons (couleur, taille, etc.)
- Chaque variante est un `product` a part entiere avec son propre `variant_group_id`
- Le groupe porte les attributs communs : dimensions, poids, prix de revient, fournisseur

**Etat actuel** : 0 produits utilisent les variantes. Les 211 produits actifs sont tous independants.

### Collections : `collections` (2 records)

Une collection = un regroupement editorial de produits (ex: "Selection Ete 2025").

**Etat actuel** : 2 collections creees mais 0 produits lies (`collection_products` vide).

**Relations** :

- `collection_products` : produits dans la collection (N:N)
- `collection_images` : images de la collection
- `collection_shares` : liens de partage
- `collection_translations` : traductions

### Classification

```
families (7)
  └── categories (11)
       └── subcategories (41)
            └── products
```

**Familles** : Maison et deco, Haute techno, Electromenager, Sport, Beaute, Alimentation, Bebe
**Categories** : Mobilier (12 sous-cat), Art de table (8), Eclairage (6), Objets deco (6), Accessoires (4), etc.

---

## 2. COMMANDES DE VENTE (sales_orders)

### Table principale : `sales_orders` (130 records)

Une commande = une vente a un client (organisation ou particulier).

**TOUTES les 130 commandes sont en statut `shipped`** (pas de draft, confirmed, cancelled, etc. actuellement).

**Polymorphisme client** :

- `customer_type = 'organization'` (123 commandes) → `customer_id` pointe vers `organisations.id`
- `customer_type = 'individual'` (7 commandes) → `customer_id` pointe vers `individual_customers.id`
- **ATTENTION : 'organization' avec Z (spelling US), PAS 'organisation' avec S**

**Champs cles** :

- `order_number`, `order_date`, `status`
- Montants : `total_ht`, `total_ttc`, `eco_tax_total`, `shipping_cost_ht`, `total_discount_amount`
- Affiliation : `affiliate_total_ht/ttc`, `created_by_affiliate_id`, `linkme_selection_id`
- Paiement : `payment_status_v2`, `paid_amount`, `paid_at`, `manual_payment_type/date/reference`
- Contacts : `responsable_contact_id`, `billing_contact_id`, `delivery_contact_id`
- Livraison : `shipping_address` (jsonb), `expected_delivery_date`, `shipped_at`, `delivered_at`
- Canal : `channel_id` → sales_channels

**Relations** :

- `sales_order_items` (410 lignes) : lignes de commande → `product_id`
- `sales_order_shipments` : expeditions par produit
- `sales_order_linkme_details` : details specifiques LinkMe
- `invoices` : donnees legacy (voir section Factures)
- `linkme_commissions` : commissions affilies
- `linkme_info_requests` : demandes d'info

### Cycle de vie d'une commande

```
draft → confirmed → shipped → delivered → closed
                  ↘ cancelled
```

Statuts possibles (enum) : draft, confirmed, shipped, delivered, closed, cancelled

---

## 3. FACTURES (invoices) — DONNEES LEGACY

### Table : `invoices` (23 records)

**CES FACTURES NE SONT PAS GENEREES PAR LE BACK-OFFICE VERONE.**

La table contient 23 enregistrements historiques (donnees legacy). Le back-office ne genere pas de factures.

**Facturation actuelle** : La facturation est geree via **Qonto** (outil externe). Le back-office Verone ne produit pas de factures.

**Relation** : `invoices.sales_order_id` → `sales_orders.id` (1 facture = 1 commande)

**REGLE POUR CLAUDE** : Ne JAMAIS afficher un KPI "factures emises" base sur cette table. Ne JAMAIS compter ces records comme des factures reelles.

### Difference Commande vs Facture

|                       | Commande (`sales_orders`) | Facture                    |
| --------------------- | ------------------------- | -------------------------- |
| **Cree par**          | Le back-office Verone     | Qonto (outil externe)      |
| **Quand**             | A la prise de commande    | Apres livraison (hors app) |
| **Donnees**           | 130 commandes reelles     | Gerees dans Qonto          |
| **Utiliser pour KPI** | OUI                       | NON                        |

---

## 4. STOCKS

### Table : `stock_movements` (248 records)

Un mouvement de stock = une entree, sortie ou ajustement de quantite sur un produit.

**Types** : IN (178), ADJUST (46), OUT (24)

**Champs cles** :

- `product_id` → produit concerne
- `movement_type` : IN, OUT, ADJUST
- `quantity` : quantite (positive ou negative)
- `channel_id` : canal de vente associe
- `purchase_order_item_id` : lien vers bon de commande fournisseur
- `performed_by` → user_profiles

**Tables liees** :

- `stock_reservations` : reservations de stock (0 records, pas utilise)
- `stock_alert_tracking` : suivi des alertes de stock bas

**Stock sur le produit** : `products.stock_quantity`, `stock_real`, `stock_forecasted_in`, `stock_forecasted_out`

---

## 5. ACHATS FOURNISSEURS (purchase_orders)

### Table : `purchase_orders` (14 records)

Un bon de commande fournisseur = une commande passee a un fournisseur pour reapprovisionner le stock.

**Relations** :

- `supplier_id` → organisations (le fournisseur)
- `purchase_order_items` : lignes d'achat → `product_id`, `customer_organisation_id`
- `purchase_order_receptions` : receptions marchandise → `product_id`

**Flux** :

```
purchase_order (commande fournisseur)
  → purchase_order_items (lignes)
  → purchase_order_receptions (reception physique)
  → stock_movements type=IN (entree en stock)
```

---

## 6. ORGANISATIONS & ENSEIGNES

### Enseignes : `enseignes` (2 records)

Une enseigne = une chaine/marque (ex: Pokawa = 40+ restaurants).

- **Pokawa** (id: de1bcbd7...) — active
- **Black & White Burger** (id: e93689ea...) — active

### Organisations : `organisations` (198 records)

Une organisation = une entite juridique (restaurant, entreprise, fournisseur).

**Roles multiples** : une organisation peut etre :

- Un **client** (commandes de vente)
- Un **fournisseur** (`products.supplier_id`, `purchase_orders.supplier_id`)
- Un **membre d'enseigne** (`enseigne_id` → enseignes)
- Un **affilie LinkMe** (via `linkme_affiliates`)

**Relations** :

- `enseigne_id` → enseignes (appartenance a une chaine)
- `is_enseigne_parent` : flag societe mere
- `default_channel_id` → sales_channels
- `source_affiliate_id` → linkme_affiliates

### Contacts : `contacts` (8 records)

Un contact = une personne physique liee a une organisation ou enseigne.

- `organisation_id` → organisations
- `enseigne_id` → enseignes
- Roles : `is_primary_contact`, `is_billing_contact`, `is_commercial_contact`, `is_technical_contact`

### Clients particuliers : `individual_customers` (19 records)

Un client particulier = un acheteur qui n'est pas une organisation.

- `organisation_id` → organisations (optionnel)
- `enseigne_id` → enseignes (optionnel)
- `source_affiliate_id` → linkme_affiliates (optionnel)

---

## 7. LINKME

### Affilies : `linkme_affiliates` (3 records)

Un affilie = un partenaire qui vend nos produits via sa propre selection.

- `enseigne_id` → enseignes (affilie lie a une enseigne)
- `organisation_id` → organisations (affilie lie a une org)

### Selections : `linkme_selections` (2 records)

Une selection = un catalogue de produits cree par un affilie pour ses clients.

- `affiliate_id` → linkme_affiliates
- `linkme_selection_items` : produits dans la selection → `product_id`

### Commissions : `linkme_commissions`

Commission = montant du a l'affilie pour une vente.

- `affiliate_id`, `order_id`, `order_item_id`, `selection_id`
- `payment_request_id` → demande de paiement

### Flux LinkMe complet :

```
linkme_affiliates (affilie)
  → linkme_selections (catalogue affilie)
    → linkme_selection_items (produits selectionnes)
      → sales_orders (commandes generees)
        → sales_order_items → product_id
        → linkme_commissions (commissions calculees)
          → linkme_payment_requests (demandes de paiement)
            → linkme_payment_request_items
```

---

## 8. PRICING

### Listes de prix : `price_lists` (5 records, toutes vides)

- B2B Standard 2025
- Catalogue Base 2025
- E-Commerce Standard 2025
- Retail Standard 2025
- Wholesale Standard 2025

**Etat** : Structure prete mais aucun item (`price_list_items` vide).

### Pricing par canal : `channel_pricing`, `channel_product_pricing`

Prix specifiques par canal de vente et par produit.

### Pricing par client : `customer_pricing`

Prix specifiques par client.

---

## 9. FINANCE / BANQUE

### Transactions bancaires : `bank_transactions` (646 records)

Transactions importees depuis la banque pour rapprochement.

- `counterparty_organisation_id` → organisations
- `counterparty_individual_customer_id` → individual_customers
- `matched_document_id` → financial_documents

### Documents financiers : `financial_documents`

- `partner_id` → organisations
- `sales_order_id` → sales_orders
- `purchase_order_id` → purchase_orders
- `financial_document_lines` : lignes du document → `product_id`

---

## 10. SCHEMA RELATIONNEL SIMPLIFIE

```
enseignes
  ├── organisations (enseigne_id)
  │     ├── contacts (organisation_id)
  │     ├── sales_orders (customer_id WHERE customer_type='organization')
  │     │     ├── sales_order_items → products
  │     │     ├── invoices (sales_order_id) ⚠️ LEGACY - Facturation via Qonto
  │     │     └── linkme_commissions
  │     ├── purchase_orders (supplier_id)
  │     │     └── purchase_order_items → products
  │     └── linkme_affiliates (organisation_id)
  │           ├── linkme_selections
  │           │     └── linkme_selection_items → products
  │           └── linkme_commissions
  ├── contacts (enseigne_id)
  ├── products (enseigne_id)
  └── individual_customers (enseigne_id)

products
  ├── product_images
  ├── product_colors
  ├── subcategory → category → family
  ├── supplier → organisations
  ├── variant_group → variant_groups
  ├── stock_movements
  ├── sales_order_items
  ├── collection_products → collections
  └── price_list_items → price_lists
```

---

## 11. PIEGES A EVITER (pour Claude)

1. **`customer_type = 'organization'`** : avec Z, pas S. Typo = 0 resultats.
2. **`invoices` ≠ factures emises** : donnees legacy, la facturation est faite via Qonto.
3. **`organisations` = multi-role** : client ET fournisseur ET membre enseigne.
4. **Pas de table `product_variants`** : les variantes sont des `products` avec un `variant_group_id`.
5. **`user_profiles.app` n'existe PAS** : utiliser `user_app_roles` pour les roles.
6. **`raw_user_meta_data` est OBSOLETE** : utiliser `user_app_roles`.
7. **Listes de prix vides** : 5 listes existent mais 0 items dedans.
8. **Collections vides** : 2 collections mais 0 produits lies.
