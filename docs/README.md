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

| Document                                                                    | Description                    |
| --------------------------------------------------------------------------- | ------------------------------ |
| [database.md](current/database/database.md)                                 | Schema DB (78+ tables)         |
| [triggers-stock-reference.md](current/database/triggers-stock-reference.md) | Reference 48 triggers stock    |
| [tables-by-domain.md](current/database/tables-by-domain.md)                 | Tables par domaine (99 tables) |

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

## Regles Metier (restaurees 2026-04-01)

### Stock

| Document                                                                                            | Description                                   |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| [guide-configuration-seuils.md](business-rules/06-stocks/alertes/guide-configuration-seuils.md)     | Guide utilisateur seuils alertes stock        |
| [stock-alert-tracking-system.md](business-rules/06-stocks/alertes/stock-alert-tracking-system.md)   | Architecture technique systeme alertes        |
| [BACKORDERS-POLICY.md](business-rules/06-stocks/backorders/BACKORDERS-POLICY.md)                    | Politique backorders (stock negatif autorise) |
| [real-vs-forecast-separation.md](business-rules/06-stocks/movements/real-vs-forecast-separation.md) | Separation stock reel vs previsionnel         |
| [stock-traceability-rules.md](business-rules/06-stocks/movements/stock-traceability-rules.md)       | Regles tracabilite mouvements stock           |

### Commandes

| Document                                                                                                                           | Description                             |
| ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| [sales-order-cancellation-workflow.md](business-rules/07-commandes/clients/sales-order-cancellation-workflow.md)                   | Workflow annulation (5 regles absolues) |
| [COMMANDES-WORKFLOW-VALIDATION-EXPEDITION.md](business-rules/07-commandes/expeditions/COMMANDES-WORKFLOW-VALIDATION-EXPEDITION.md) | Workflow validation + expedition        |
| [PURCHASE-ORDER-WORKFLOW-COMPLET.md](business-rules/07-commandes/fournisseurs/PURCHASE-ORDER-WORKFLOW-COMPLET.md)                  | Workflow complet commandes fournisseurs |
| [notifications-workflow.md](business-rules/07-commandes/notifications-workflow.md)                                                 | 13 triggers notifications commandes     |
| [address-autofill-orders.md](business-rules/07-commandes/clients/address-autofill-orders.md)                                       | Auto-remplissage adresses commandes     |

## LinkMe (docs supplementaires)

| Document                                                                  | Description                       |
| ------------------------------------------------------------------------- | --------------------------------- |
| [commission-pricing-rules.md](current/linkme/commission-pricing-rules.md) | Audit commissions (97% match)     |
| [business-rules-linkme.md](current/linkme/business-rules-linkme.md)       | Regles metier LinkMe detaillees   |
| [routes-index.md](current/linkme/routes-index.md)                         | Audit 60+ routes LinkMe           |
| [margin-calculation.md](linkme/margin-calculation.md)                     | Calcul marge SSOT (@verone/utils) |

## Operations

| Document                                                               | Description                        |
| ---------------------------------------------------------------------- | ---------------------------------- |
| [deploy-runbooks.md](current/deploy-runbooks.md)                       | Runbooks deploiement Vercel        |
| [GITHUB-RULESETS.md](governance/GITHUB-RULESETS.md)                    | Branch protection rules            |
| [dev-environment.md](current/troubleshooting/dev-environment.md)       | Troubleshooting dev                |
| [incident.md](runbooks/incident.md)                                    | Protocole stabilisation (restaure) |
| [dev-workflow.md](current/dev-workflow.md)                             | Workflow dev quotidien (restaure)  |
| [component-audit-guidelines.md](current/component-audit-guidelines.md) | Dead code detection (restaure)     |
| [qonto-env-setup.md](integrations/qonto-env-setup.md)                  | Config env Qonto (restaure)        |
| [database-triggers.md](metrics/database-triggers.md)                   | 13+ triggers metriques (restaure)  |

## Archives

Audits historiques dans `docs/archive/` — reference uniquement.
