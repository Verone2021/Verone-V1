---
status: CURRENT
verified: 2025-12-17
code_pointers:
  - supabase/migrations/*trigger*.sql
  - packages/@verone/*/src/
references:
  - docs/business-rules/
---

# Business Rules Verone

Regles metier CRM/ERP.

## Modules principaux

| Module               | Tables                                | Description          |
| -------------------- | ------------------------------------- | -------------------- |
| **Catalogue**        | products, categories, variants        | Gestion produits     |
| **Stocks**           | stock_movements, reservations, alerts | Inventaire           |
| **Commandes ventes** | sales_orders, items, shipments        | B2B/B2C              |
| **Commandes achats** | purchase_orders, items, receptions    | Fournisseurs         |
| **Organisations**    | organisations, contacts               | Clients/Fournisseurs |
| **Pricing**          | price_lists, price_list_items         | Tarification         |
| **LinkMe**           | affiliates, referrals, commissions    | Affiliation          |

## Workflows commandes ventes

```
Draft → Validated → Shipped → Delivered
         ↓
      Cancelled
```

## Workflows commandes achats

```
Draft → Sent → Partially Received → Received
         ↓
      Cancelled
```

## Stock automatique (triggers)

Ces colonnes sont calculees automatiquement:

| Colonne                         | Calcul                        |
| ------------------------------- | ----------------------------- |
| `products.stock_quantity`       | `stock_real - reserved`       |
| `products.stock_real`           | Somme stock_movements         |
| `products.stock_forecasted_in`  | Somme purchase_orders pending |
| `products.stock_forecasted_out` | Somme sales_orders pending    |

## Pricing multi-canaux

| Canal    | Description         |
| -------- | ------------------- |
| `retail` | Prix magasin        |
| `online` | Prix e-commerce     |
| `b2b`    | Prix professionnels |
| `linkme` | Prix affiliation    |

## Documentation detaillee

Voir `docs/business-rules/` pour regles specifiques:

- `05-pricing-tarification/tarification.md` - TVA, remises, MOQ
- `06-stocks/alertes/guide-configuration-seuils.md` - Config seuils stock
- `07-commandes/clients/address-autofill-orders.md` - Adresses commandes
- `07-commandes/expeditions/COMMANDES-WORKFLOW-VALIDATION-EXPEDITION.md` - Workflow expeditions

## Liens

- [Database](./03-database.md) - Schema tables
- [API](./05-api.md) - Endpoints

---

_Derniere verification: 2025-12-17_
