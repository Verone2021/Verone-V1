# Documentation Verone - Source de Verite

**Derniere mise a jour:** 2026-03-27

Cette documentation est la **source unique de verite** pour le projet Verone.
Voir aussi `docs/README.md` (index general) et `.claude/INDEX.md` (index agent).

---

## Documentation Consolidee

| Doc                                                                              | Description                                 | Usage                |
| -------------------------------------------------------------------------------- | ------------------------------------------- | -------------------- |
| [database/triggers-stock-reference.md](./database/triggers-stock-reference.md)   | 48 triggers PostgreSQL, notifications       | Triggers DB          |
| [linkme/commission-reference.md](./linkme/commission-reference.md)               | 2 types produits, formules commission       | Commissions LinkMe   |
| [modules/stock-module-reference.md](./modules/stock-module-reference.md)         | 14 pages stock, alertes 3 couleurs          | Module Stock         |
| [modules/orders-workflow-reference.md](./modules/orders-workflow-reference.md)   | Statuts SO/PO, triggers par transition      | Workflow Commandes   |
| [modules/sourcing-reference.md](./modules/sourcing-reference.md)                 | Machine a etats sourcing, 7 workflows       | Sourcing & Catalogue |
| [modules/purchase-price-pmp-system.md](./modules/purchase-price-pmp-system.md)   | PMP, prix achat moyen pondere               | Prix Achat           |
| [finance/finance-reference.md](./finance/finance-reference.md)                   | PCG, Qonto, rapprochement bancaire          | Finance & Compta     |
| [finance/invoicing-system-reference.md](./finance/invoicing-system-reference.md) | Double table invoices + financial_documents | Facturation          |
| [finance/quotes-architecture.md](./finance/quotes-architecture.md)               | Devis via API Qonto                         | Devis                |
| [users/daily-workflows.md](./users/daily-workflows.md)                           | Owner vs Admin, checklist matin             | Workflows Quotidiens |

---

## Reference technique

| Doc                                            | Description                    |
| ---------------------------------------------- | ------------------------------ |
| [stack.md](./stack.md)                         | Technologies et outils actifs  |
| [architecture.md](./architecture.md)           | Structure monorepo Turborepo   |
| [database/database.md](./database/database.md) | Supabase, migrations, RLS      |
| [security-auth.md](./security-auth.md)         | Auth, roles, permissions, RLS  |
| [integrations.md](./integrations.md)           | Qonto, Google OAuth, Supabase  |
| [deploy-runbooks.md](./deploy-runbooks.md)     | Vercel, GitHub CI/CD, rollback |

---

## Documentation par app

| App           | Index complet                                                      | Guide                                                              |
| ------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Back-Office   | [INDEX-BACK-OFFICE-COMPLET.md](./INDEX-BACK-OFFICE-COMPLET.md)     | [INDEX-PAGES-BACK-OFFICE.md](./INDEX-PAGES-BACK-OFFICE.md)         |
| LinkMe        | [INDEX-LINKME-COMPLET.md](./INDEX-LINKME-COMPLET.md)               | [linkme/GUIDE-COMPLET-LINKME.md](./linkme/GUIDE-COMPLET-LINKME.md) |
| Site-Internet | [INDEX-SITE-INTERNET-COMPLET.md](./INDEX-SITE-INTERNET-COMPLET.md) | [site-internet/ARCHITECTURE.md](./site-internet/ARCHITECTURE.md)   |

---

## Ancienne documentation

Voir `docs/archive/` pour la documentation archivee.
