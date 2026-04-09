# Back-Office Verone

Staff CRM/ERP pour concept store decoration et mobilier d'interieur.
Gestion complete : produits, stock, commandes, finance, clients, fournisseurs.

## CRITICAL : Index a consulter AVANT toute modification

- Pages, routes, sidebar : @docs/current/INDEX-PAGES-BACK-OFFICE.md
- Composants, formulaires, hooks partages : @docs/current/INDEX-COMPOSANTS-FORMULAIRES.md
- Entites metier : @docs/current/back-office-entities-index.md

## Documentation par Tache

| Tache              | Lire AVANT                                          |
| ------------------ | --------------------------------------------------- |
| Produits/Catalogue | `docs/current/modules/sourcing-reference.md`        |
| Stock/Alertes      | `docs/current/modules/stock-module-reference.md`    |
| Triggers stock     | `docs/current/database/triggers-stock-reference.md` |
| Commandes SO/PO    | `docs/current/modules/orders-workflow-reference.md` |
| Finance/Factures   | `docs/current/finance/finance-reference.md`         |
| Dashboard/KPIs     | `docs/current/users/daily-workflows.md`             |
| Schema DB          | `docs/current/database/tables-by-domain.md`         |

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

## Documentation Complementaire

- Tables par domaine : `docs/current/database/tables-by-domain.md`
- Triggers stock : `docs/current/database/triggers-stock-reference.md`
- Workflow commandes : `docs/current/modules/orders-workflow-reference.md`
- Facturation Qonto : `docs/current/finance/finance-reference.md`
