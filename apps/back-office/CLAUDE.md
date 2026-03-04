# Back-Office Verone

Staff CRM/ERP pour decoration et mobilier d'interieur haut de gamme.
Gestion complete : produits, stock, commandes, finance, clients, fournisseurs.

## Documentation par Tache

| Tache              | Lire AVANT                                          |
| ------------------ | --------------------------------------------------- |
| Produits/Catalogue | `docs/current/serena/products-architecture.md`      |
| Stock/Alertes      | `docs/current/modules/stock-module-reference.md`    |
| Triggers stock     | `docs/current/database/triggers-stock-reference.md` |
| Commandes SO/PO    | `docs/current/modules/orders-workflow-reference.md` |
| Finance/Factures   | `docs/current/finance/finance-reference.md`         |
| Sourcing           | `docs/current/modules/sourcing-reference.md`        |
| Dashboard/KPIs     | `docs/current/users/daily-workflows.md`             |
| Composants UI      | `docs/architecture/COMPOSANTS-CATALOGUE.md`         |
| Schema DB          | `docs/current/serena/database-schema-mappings.md`   |

## Source de Verite DB

- Types generes : `packages/@verone/types/src/supabase.ts`
- TOUJOURS verifier schema reel avant SQL : `SELECT column_name FROM information_schema.columns WHERE table_name = '...'`

## Build Filtre

```bash
pnpm --filter @verone/back-office build
pnpm --filter @verone/back-office type-check
```

## Port

`localhost:3000`

## Roles Staff

- `owner`, `admin`, `sales`, `catalog_manager`
- Table : `user_app_roles` (app='back-office')
- Helper RLS : `is_backoffice_user()`, `is_back_office_admin()`

## Memories Serena Pertinentes

- `project-architecture` — Architecture globale
- `business-entities-back-office` — Entites metier
- `database-tables-by-domain` — Tables par domaine
- `stock-triggers-alerts-complete` — Triggers stock
- `sales-order-status-workflow-complete` — Workflow commandes vente
- `purchase-order-status-workflow-complete` — Workflow commandes achat
- `qonto-invoicing-system` — Systeme facturation Qonto
- `notifications-system-audit-2026-03` — Systeme notifications
