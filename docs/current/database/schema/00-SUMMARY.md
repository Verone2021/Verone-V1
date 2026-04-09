# Schema Base de Donnees Verone — Sommaire

_Generated: 2026-04-09 23:55_

## Stats Globales

| Metrique     | Valeur |
| ------------ | ------ |
| Tables       | 106    |
| Foreign Keys | 0      |
| RLS Policies | 0      |
| Triggers     | 0      |
| Enums        | 0      |

## Index des Domaines

| #   | Domaine                     | Tables | Fichier                                    |
| --- | --------------------------- | ------ | ------------------------------------------ |
| 01  | Organisations & Contacts    | 8      | [01-organisations.md](01-organisations.md) |
| 02  | Produits & Catalogue        | 17     | [02-produits.md](02-produits.md)           |
| 03  | Commandes & Consultations   | 17     | [03-commandes.md](03-commandes.md)         |
| 04  | Stock & Stockage            | 9      | [04-stock.md](04-stock.md)                 |
| 05  | Finance & Comptabilite      | 13     | [05-finance.md](05-finance.md)             |
| 06  | LinkMe & Affiliation        | 10     | [06-linkme.md](06-linkme.md)               |
| 07  | Notifications & Formulaires | 9      | [07-notifications.md](07-notifications.md) |
| 08  | Utilisateurs & Securite     | 8      | [08-utilisateurs.md](08-utilisateurs.md)   |
| 09  | Autres                      | 15     | [09-autres.md](09-autres.md)               |

## Enums

## Relations Inter-Domaines

```
Organisations ←── Contacts (contacts.organisation_id)
Organisations ←── Enseignes (organisations.enseigne_id)
Organisations ←── Produits (products.supplier_id)
Produits ←── Commandes-SO (sales_order_items.product_id)
Produits ←── Commandes-PO (purchase_order_items.product_id)
Produits ←── Stock (stock_movements.product_id)
Commandes-SO ←── Finance (financial_documents.sales_order_id)
Commandes-PO ←── Finance (financial_documents.purchase_order_id)
Finance ←── BankTx (transaction_document_links.document_id)
LinkMe ←── Commandes-SO (sales_orders.linkme_selection_id)
LinkMe ←── Finance (financial_documents.linkme_affiliate_id)
LinkMe ←── Stock (affiliate_storage_allocations.product_id)
Utilisateurs ←── Toutes tables (created_by, user_id)
```
