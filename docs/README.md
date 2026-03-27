# Documentation Verone

## Index par Application (LIRE EN PREMIER)

| Document                                                                 | Description                                                            |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| [INDEX-BACK-OFFICE-COMPLET.md](current/INDEX-BACK-OFFICE-COMPLET.md)     | **20 sections, 134 pages, flux metier, relations canaux**              |
| [INDEX-LINKME-COMPLET.md](current/INDEX-LINKME-COMPLET.md)               | **Modele eco, 4 types users, 2 formulaires, flux commande/commission** |
| [INDEX-SITE-INTERNET-COMPLET.md](current/INDEX-SITE-INTERNET-COMPLET.md) | **Parcours client, Stripe, 11 hooks, SEO, pilotage depuis BO**         |
| [architecture-packages.md](current/architecture-packages.md)             | **347 composants, 150+ hooks partages dans @verone/**                  |

## Architecture & Stack

| Document                                                        | Description                           |
| --------------------------------------------------------------- | ------------------------------------- |
| [architecture.md](current/architecture.md)                      | Architecture monorepo, apps, packages |
| [stack.md](current/stack.md)                                    | Stack technique avec versions         |
| [COMPOSANTS-CATALOGUE.md](architecture/COMPOSANTS-CATALOGUE.md) | Catalogue composants UI               |
| [security-auth.md](current/security-auth.md)                    | Roles, auth, middleware               |

## Base de donnees

| Document                                                                    | Description                           |
| --------------------------------------------------------------------------- | ------------------------------------- |
| [database.md](current/database/database.md)                                 | Schema DB (78+ tables)                |
| [triggers-stock-reference.md](current/database/triggers-stock-reference.md) | Reference 48 triggers stock           |
| [database-schema-mappings.md](current/serena/database-schema-mappings.md)   | Mapping colonnes (anti-hallucination) |

## Modules metier

| Document                                                                     | Description                    |
| ---------------------------------------------------------------------------- | ------------------------------ |
| [orders-workflow-reference.md](current/modules/orders-workflow-reference.md) | Workflow commandes vente/achat |
| [stock-module-reference.md](current/modules/stock-module-reference.md)       | Module stock complet           |
| [sourcing-reference.md](current/modules/sourcing-reference.md)               | Sourcing fournisseurs          |
| [purchase-price-pmp-system.md](current/modules/purchase-price-pmp-system.md) | Systeme PMP prix achat         |

## Finance

| Document                                                                       | Description                    |
| ------------------------------------------------------------------------------ | ------------------------------ |
| [finance-reference.md](current/finance/finance-reference.md)                   | Categories PCG, regles finance |
| [invoicing-system-reference.md](current/finance/invoicing-system-reference.md) | Systeme facturation dual-table |
| [quotes-architecture.md](current/finance/quotes-architecture.md)               | Architecture devis (Qonto)     |

## LinkMe

| Document                                                            | Description              |
| ------------------------------------------------------------------- | ------------------------ |
| [GUIDE-COMPLET-LINKME.md](current/linkme/GUIDE-COMPLET-LINKME.md)   | Source de verite LinkMe  |
| [INDEX-PAGES-LINKME.md](current/linkme/INDEX-PAGES-LINKME.md)       | 48 pages LinkMe indexees |
| [GLOSSAIRE-CHAMPS-PRIX.md](current/linkme/GLOSSAIRE-CHAMPS-PRIX.md) | Glossaire champs prix    |
| [commission-reference.md](current/linkme/commission-reference.md)   | Logique commissions      |

## Site Internet

| Document                                                 | Description                |
| -------------------------------------------------------- | -------------------------- |
| [ARCHITECTURE.md](current/site-internet/ARCHITECTURE.md) | Architecture site-internet |
| [FEATURES.md](current/site-internet/FEATURES.md)         | Features e-commerce        |
| [API-ROUTES.md](current/site-internet/API-ROUTES.md)     | Routes API                 |

## Back-Office

| Document                                                               | Description                   |
| ---------------------------------------------------------------------- | ----------------------------- |
| [INDEX-PAGES-BACK-OFFICE.md](current/INDEX-PAGES-BACK-OFFICE.md)       | 165 pages back-office         |
| [MAPPING-PAGES-TABLES.md](current/MAPPING-PAGES-TABLES.md)             | Pages → tables DB             |
| [back-office-entities-index.md](current/back-office-entities-index.md) | Entites metier avec counts    |
| [daily-workflows.md](current/users/daily-workflows.md)                 | Workflows quotidiens par role |

## Integrations

| Document                                                                    | Description                 |
| --------------------------------------------------------------------------- | --------------------------- |
| [GUIDE-COMPLET-API-QONTO.md](integrations/qonto/GUIDE-COMPLET-API-QONTO.md) | API Qonto (facturation)     |
| [integrations.md](current/integrations.md)                                  | Vue d'ensemble integrations |
| [resend-dns-setup.md](integrations/resend-dns-setup.md)                     | DNS emails (Resend)         |

## Operations

| Document                                                         | Description                 |
| ---------------------------------------------------------------- | --------------------------- |
| [deploy-runbooks.md](current/deploy-runbooks.md)                 | Runbooks deploiement Vercel |
| [GITHUB-RULESETS.md](governance/GITHUB-RULESETS.md)              | Branch protection rules     |
| [dev-environment.md](current/troubleshooting/dev-environment.md) | Troubleshooting dev         |

## Archives

Audits historiques dans `docs/archive/` — reference uniquement.
