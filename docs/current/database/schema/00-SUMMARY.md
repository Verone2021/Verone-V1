# Schema Base de Donnees — Verone

**Projet :** Verone Back Office (Supabase / PostgreSQL)
**Date de generation :** 2026-04-09
**Tables documentees :** 91
**Cles etrangeres :** 166
**Tables avec RLS :** 106

---

## Domaines

| #   | Domaine                              | Tables | Description                                                             |
| --- | ------------------------------------ | ------ | ----------------------------------------------------------------------- |
| 01  | [organisations](01-organisations.md) | 8      | CRM — fournisseurs, partenaires, enseignes, clients, contacts, adresses |
| 02  | [produits](02-produits.md)           | 17     | Catalogue produits, images, couleurs, groupes, collections              |
| 03  | [commandes](03-commandes.md)         | 17     | Commandes clients (SO), fournisseurs (PO), expeditions, consultations   |
| 04  | [stock](04-stock.md)                 | 9      | Mouvements de stock, alertes, reservations, stockage affilies           |
| 05  | [finance](05-finance.md)             | 13     | Factures, transactions bancaires, rapprochement, immobilisations, PCG   |
| 06  | [linkme](06-linkme.md)               | 10     | Plateforme affiliation B2B2C — affilies, selections, commissions        |
| 07  | [notifications](07-notifications.md) | 9      | Notifications in-app, templates email, newsletter, formulaires site     |
| 08  | [utilisateurs](08-utilisateurs.md)   | 8      | Roles applicatifs, profils, sessions, logs activite, webhooks           |

---

## Relations cles

```
auth.users
  └── user_profiles (user_id)
  └── user_app_roles (user_id)

enseignes
  └── organisations (enseigne_id)
  └── linkme_affiliates (enseigne_id)
  └── user_app_roles (enseigne_id)

organisations
  └── contacts (organisation_id)
  └── sales_orders (customer_id)
  └── purchase_orders (supplier_id)
  └── financial_documents (partner_id)

products
  └── sales_order_items (product_id)
  └── purchase_order_items (product_id)
  └── stock_movements (product_id)
  └── stock_alert_tracking (product_id)
  └── linkme_selection_items (product_id)

sales_orders
  └── sales_order_items (sales_order_id)
  └── sales_order_shipments (sales_order_id)
  └── financial_documents (sales_order_id)
  └── linkme_commissions (order_id)

linkme_affiliates
  └── linkme_selections (affiliate_id)
  └── linkme_commissions (affiliate_id)
  └── linkme_payment_requests (affiliate_id)
```

---

## Fonctions RLS helper

| Fonction                 | Role                                                        |
| ------------------------ | ----------------------------------------------------------- |
| `is_backoffice_user()`   | Verifie si user est staff back-office (n'importe quel role) |
| `is_back_office_admin()` | Verifie si user est admin back-office                       |

---

## Enums principaux

| Enum                    | Valeurs                                                 |
| ----------------------- | ------------------------------------------------------- |
| `sales_order_status`    | draft, confirmed, shipped, delivered, cancelled, closed |
| `purchase_order_status` | draft, validated, sent, received, cancelled             |
| `document_status`       | draft, finalized, sent, paid, cancelled                 |
| `matching_status`       | unmatched, matched, partial, ignored                    |
| `bank_provider`         | qonto, revolut                                          |
| `app_type`              | back-office, linkme, site-internet                      |

---

**Regenerer :** `python3 scripts/generate-db-docs.py` (necessite DATABASE_URL)
