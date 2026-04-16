# AUDIT COMPLET DU PROJET VERONE

**Date :** 16 avril 2026
**Branche auditee :** staging (alignee sur main, 0 fichiers modifies)
**Methode :** Lecture seule, aucune modification effectuee

---

## SECTION 1 : IDENTIFICATION DU PROJET

### 1.1 Informations generales

| Champ                   | Valeur                                  |
| ----------------------- | --------------------------------------- |
| Nom                     | @verone/monorepo                        |
| Version                 | 1.0.0                                   |
| Type                    | Monorepo (pnpm workspaces + Turborepo)  |
| Gestionnaire de paquets | pnpm 10.13.1                            |
| Orchestrateur           | Turborepo 2.6.0 (remote cache active)   |
| Depot                   | https://github.com/Verone2021/Verone-V1 |

### 1.2 Applications

| Application   | Chemin                | Existe | Port |
| ------------- | --------------------- | ------ | ---- |
| back-office   | `apps/back-office/`   | Oui    | 3000 |
| linkme        | `apps/linkme/`        | Oui    | 3002 |
| site-internet | `apps/site-internet/` | Oui    | 3001 |

### 1.3 Packages partages (22 packages sous `packages/@verone/`)

| Package         | Nom npm                 | Description                                              |
| --------------- | ----------------------- | -------------------------------------------------------- |
| categories      | @verone/categories      | Module categories pour CRM/ERP                           |
| channels        | @verone/channels        | Module channels (canaux de vente)                        |
| collections     | @verone/collections     | Module collections produits                              |
| common          | @verone/common          | Utilitaires communs                                      |
| consultations   | @verone/consultations   | Module consultations clients                             |
| customers       | @verone/customers       | Module customers (DEPRECATED pour les formulaires)       |
| dashboard       | @verone/dashboard       | Module dashboard / KPIs                                  |
| eslint-config   | @verone/eslint-config   | Configuration ESLint partagee                            |
| finance         | @verone/finance         | Module finance et comptabilite                           |
| hooks           | @verone/hooks           | Collection de hooks React reutilisables                  |
| integrations    | @verone/integrations    | Integrations externes (Google Merchant, Qonto)           |
| logistics       | @verone/logistics       | Module logistique (expeditions, receptions)              |
| notifications   | @verone/notifications   | Module notifications                                     |
| orders          | @verone/orders          | Module commandes (SO + PO)                               |
| organisations   | @verone/organisations   | SOURCE DE VERITE pour tous les formulaires organisations |
| prettier-config | @verone/prettier-config | Configuration Prettier partagee                          |
| products        | @verone/products        | Module produits / catalogue                              |
| roadmap         | @verone/roadmap         | Module auto-roadmap intelligent                          |
| stock           | @verone/stock           | Module stock (composants UI + hooks)                     |
| types           | @verone/types           | Types TypeScript partages (Supabase + Business)          |
| ui              | @verone/ui              | Composants UI / Design System (shadcn/ui + Radix)        |
| ui-business     | @verone/ui-business     | Composants UI metier                                     |
| utils           | @verone/utils           | Utilitaires et helpers partages                          |

---

## SECTION 2 : STACK TECHNIQUE PAR APPLICATION

### 2.1 Back-Office (@verone/back-office)

**Framework :** Next.js 15.5.7 | **React :** 18.3.1 | **TypeScript :** 5.3.3

**10 dependances principales :**

| Dependance            | Version |
| --------------------- | ------- |
| next                  | 15.5.7  |
| react / react-dom     | 18.3.1  |
| @supabase/ssr         | 0.8.0   |
| @supabase/supabase-js | 2.57.4  |
| html2canvas           | 1.4.1   |
| jspdf                 | 4.0.0   |
| maplibre-gl           | 4.7.1   |
| qrcode                | 1.5.4   |
| react-map-gl          | 7.1.9   |
| resend                | 6.6.0   |

**Scripts :** dev, build, start, lint, lint:fix, type-check, format, format:check

### 2.2 LinkMe (@verone/linkme)

**Framework :** Next.js 15.5.7 | **React :** 18.3.1 | **TypeScript :** 5.3.3

**10 dependances principales :**

| Dependance            | Version |
| --------------------- | ------- |
| next                  | 15.5.7  |
| react / react-dom     | 18.3.1  |
| @supabase/ssr         | 0.8.0   |
| @supabase/supabase-js | 2.57.4  |
| @tanstack/react-query | 5.72.2  |
| @dnd-kit/core         | 6.3.1   |
| @tremor/react         | 3.18.7  |
| lucide-react          | 0.400.0 |
| recharts              | 3.3.0   |
| resend                | 6.6.0   |

**Scripts :** dev, build, start, lint, lint:fix, type-check, format, format:check, e2e:smoke, e2e:smoke:ui

### 2.3 Site-Internet (@verone/site-internet)

**Framework :** Next.js 15.5.7 | **React :** 18.3.1 | **TypeScript :** 5.3.3

**10 dependances principales :**

| Dependance            | Version  |
| --------------------- | -------- |
| next                  | 15.5.7   |
| react / react-dom     | 18.3.1   |
| @supabase/ssr         | 0.8.0    |
| @supabase/supabase-js | 2.57.4   |
| @tanstack/react-query | 5.90.7   |
| framer-motion         | 12.23.24 |
| stripe                | 20.4.1   |
| @stripe/stripe-js     | 8.10.0   |
| resend                | 6.6.0    |
| lucide-react          | 0.344.0  |

**Scripts :** dev, build, start, lint, lint:fix, type-check, format, format:check

### 2.4 Outils transversaux (racine)

| Outil            | Version | Role                          |
| ---------------- | ------- | ----------------------------- |
| turbo            | 2.6.0   | Orchestration monorepo        |
| typescript       | 5.3.3   | Typage                        |
| eslint           | 9.28.0  | Linting (Flat Config)         |
| prettier         | 3.6.2   | Formatage                     |
| @playwright/test | 1.55.0  | Tests E2E                     |
| tailwindcss      | 3.4.18  | CSS utilitaire                |
| husky            | 9.1.7   | Git hooks                     |
| lint-staged      | 16.2.7  | Pre-commit linting            |
| knip             | 5.66.2  | Dead code detection           |
| madge            | 8.0.0   | Circular dependency detection |
| jscpd            | 4.0.5   | Duplicate code detection      |
| cspell           | 9.2.1   | Spell checking                |

---

## SECTION 3 : BASE DE DONNEES

| Champ                      | Valeur                                                          |
| -------------------------- | --------------------------------------------------------------- |
| Type                       | PostgreSQL via Supabase                                         |
| Client/ORM                 | @supabase/supabase-js 2.57.4 + @supabase/ssr 0.8.0              |
| Migrations                 | `supabase/migrations/` (SQL pur)                                |
| Nombre total de migrations | 660                                                             |
| Migration la plus recente  | `20260416020000_create_v_all_payments_view.sql` (16 avril 2026) |
| Types generes              | `packages/@verone/types/src/supabase.ts` (auto-genere)          |
| Pas de Prisma/Drizzle      | Acces exclusivement via client Supabase                         |

### Tables principales par domaine (142 tables, 326 politiques RLS, 296 triggers, 45 enums)

**Organisations et Contacts (8 tables) :**
addresses, contacts, counterparty_bank_accounts, customer_addresses, enseignes, individual_customers, organisation_families, organisations

**Produits et Catalogue (17 tables) :**
categories, collection_images, collection_products, collection_shares, collections, families, product_colors, product_commission_history, product_group_members, product_groups, product_images, product_packages, product_purchase_history, product_reviews, products, subcategories, variant_groups

**Commandes et Consultations (17 tables) :**
client_consultations, consultation_emails, consultation_images, consultation_products, order_discounts, order_payments, purchase_order_items, purchase_order_receptions, purchase_orders, sales_order_events, sales_order_items, sales_order_linkme_details, sales_order_shipments, sales_orders, sample_order_items, sample_orders, shopping_carts

**Stock et Stockage (9 tables) :**
affiliate_archive_requests, affiliate_storage_allocations, affiliate_storage_requests, stock_alert_tracking, stock_movements, stock_reservations, storage_allocations, storage_billing_events, storage_pricing_tiers

**Finance et Comptabilite (13 tables) :**
bank_transactions, bank_transactions_enrichment_audit, finance_settings, financial_document_items, financial_documents, fiscal_obligations_done, fixed_asset_depreciations, fixed_assets, matching_rules, mcp_resolution_queue, mcp_resolution_strategies, pcg_categories, transaction_document_links

**LinkMe et Affiliation (10 tables) :**
linkme_affiliates, linkme_channel_suppliers, linkme_commissions, linkme_info_requests, linkme_onboarding_progress, linkme_page_configurations, linkme_payment_request_items, linkme_payment_requests, linkme_selection_items, linkme_selections

**Notifications et Formulaires (9 tables) :**
email_templates, form_submission_messages, form_submissions, form_types, newsletter_subscribers, notifications, site_contact_messages, site_content, user_notification_preferences

**Utilisateurs et Securite (8 tables) :**
app_settings, audit_logs, user_activity_logs, user_app_roles, user_profiles, user_sessions, webhook_configs, webhook_logs

**Autres (51 tables) :**
Inclut : affiliate*pending_orders, ambassador_codes, channel_price_lists, channel_pricing, cms_pages, customer_groups, expenses, feed_configs, google_merchant_syncs, linkme_globe_items, price_lists, sales_channels, site_ambassadors, sourcing*\*, sync_runs, + 22 vues (v_all_payments, v_expenses_with_details, v_linkme_users, etc.)

### Documentation schema DB

Localisee dans `docs/current/database/schema/` (10 fichiers, 7 domaines documentes).

---

## SECTION 4 : ARCHITECTURE DU CODE

### 4.1 Back-Office

**Pattern :** Next.js 15 App Router

```
apps/back-office/src/
  app/
    (protected)/        -- Pages authentifiees (dashboard, commandes, stocks, etc.)
    actions/            -- Server Actions
    api/                -- 28 groupes de routes API
    login/              -- Page de connexion
    module-inactive/    -- Page module inactif
    unauthorized/       -- Page non autorise
  components/
    admin/  business/  catalogue/  errors/  forms/
    layout/  orders/  profile/  providers/  ui/  ui-v2/
  hooks/
    base/  core/
  lib/
    auth/  guards/  mcp/  security/
  styles/
  types/
```

**Routes API (28 groupes) :** meta-commerce, ambassadors, quotes, financial-documents, linkme, qonto, csp-report, cron, sourcing, etc.
**Gestion d'etat :** React Context + React Query (pas de Redux/Zustand)

### 4.2 LinkMe

**Pattern :** Next.js 15 App Router avec route groups

```
apps/linkme/src/
  app/
    (auth)/             -- Authentification
    (legal)/            -- Pages legales
    (main)/             -- App principale (commandes, profil, etc.)
    (marketing)/        -- Landing pages
    (public)/           -- Pages publiques (selections)
    api/                -- 9 groupes de routes API
  components/
    analytics/  auth/  cart/  catalogue/  commissions/
    contacts/  dashboard/  forms/  landing/  layout/
    network/  onboarding/  order-form/  orders/
    organisations/  providers/  public-selection/
    selection/  shared/  storage/  ui/
  config/  contexts/  hooks/
  lib/
    hooks/  rbac/  revolut/  schemas/  utils/
  styles/  types/
```

**Gestion d'etat :** React Context (AuthContext) + React Query + @dnd-kit (drag-and-drop)

### 4.3 Site-Internet

**Pattern :** Next.js 15 App Router avec routes en francais

```
apps/site-internet/src/
  app/
    a-propos/  ambassadeur/  api/  auth/  catalogue/
    cgv/  checkout/  collections/  compte/  confidentialite/
    contact/  cookies/  faq/  livraison/  mentions-legales/
    panier/  politique-de-confidentialite/  produit/  retours/
  components/
    analytics/  catalogue/  cms/  home/  layout/  product/  seo/  ui/
  contexts/  emails/  hooks/
  lib/
    supabase/
  styles/  types/
```

**Gestion d'etat :** React Context (CartContext) + React Query

### 4.4 Packages partages

Les composants UI partages sont dans `packages/@verone/ui/` (shadcn/ui + Radix).
La logique metier est repartie dans les packages de domaine : `@verone/orders`, `@verone/stock`, `@verone/finance`, `@verone/organisations`, etc.
Les types TypeScript centralises sont dans `packages/@verone/types/`.

---

## SECTION 5 : COMMUNICATION INTER-APPLICATIONS

### 5.1 Base de donnees partagee

Les 3 applications partagent **un seul projet Supabase**. L'isolation est assuree par RLS :

- **Back-Office :** acces complet via `is_backoffice_user()` (staff bypass)
- **LinkMe :** isolation stricte par `enseigne_id` XOR `organisation_id`
- **Site-Internet :** lecture anonyme des selections publiees uniquement

Pas de gateway API entre les apps. Toute la communication passe par la BDD Supabase.

### 5.2 Authentification

Systeme : **Supabase Auth** (JWT). Pas de next-auth.

- Client-side : `createClient()` depuis `@verone/utils/supabase/client`
- Server-side : `createServerClient()` depuis `@supabase/ssr`
- Roles back-office : owner, admin, sales, catalog_manager
- Roles LinkMe : enseigne_admin, org_independante
- Fonctions helper RLS : `is_backoffice_user()`, `is_back_office_admin()`

### 5.3 Variables d'environnement (NOMS uniquement)

**Supabase (communes) :**
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ACCESS_TOKEN, DATABASE_URL

**Back-Office specifiques :**
QONTO_API_KEY, QONTO_ORGANIZATION_ID, QONTO_AUTH_MODE, RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_REPLY_TO

**LinkMe specifiques :**
REVOLUT_API_KEY, NEXT_PUBLIC_REVOLUT_PUBLIC_KEY, NEXT_PUBLIC_REVOLUT_ENVIRONMENT, REVOLUT_MERCHANT_ID, REVOLUT_WEBHOOK_SECRET, RESEND_API_KEY

**Site-Internet specifiques :**
STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (detecte via dependance stripe)

**Google Merchant (racine) :**
GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL, GOOGLE_MERCHANT_PRIVATE_KEY, GOOGLE_MERCHANT_PRIVATE_KEY_ID, GOOGLE_MERCHANT_CLIENT_ID, GOOGLE_CLOUD_PROJECT_ID

**Feature Flags (racine) :** 16 flags pour phases 1-3, modules, features speciales

**CI/CD :** VERCEL_TOKEN, NOTION_API_KEY

---

## SECTION 6 : DOCUMENTATION EXISTANTE

**Total : 208 fichiers .md**

### A. Documentation technique (architecture, API, BDD)

| Fichier                                                                                    | Lignes | Sujet                      |
| ------------------------------------------------------------------------------------------ | ------ | -------------------------- |
| `docs/current/architecture.md`                                                             | 142    | Architecture systeme       |
| `docs/current/database/schema/00-SUMMARY.md`                                               | ~50    | Metriques schema           |
| `docs/current/database/schema/01-organisations.md`                                         | 394    | Organisations et Contacts  |
| `docs/current/database/schema/02-produits.md`                                              | 681    | Produits et Catalogue      |
| `docs/current/database/schema/03-commandes.md`                                             | 821    | Commandes et Consultations |
| `docs/current/database/schema/04-stock.md`                                                 | 342    | Stock                      |
| `docs/current/database/schema/05-finance.md`                                               | 498    | Finance                    |
| `docs/current/database/schema/06-linkme.md`                                                | 371    | LinkMe                     |
| `docs/current/database/schema/07-notifications.md`                                         | 263    | Notifications              |
| `docs/current/database/schema/09-autres.md`                                                | 1616   | Autres (vues, configs)     |
| `docs/current/database/database.md`                                                        | 153    | Vue d'ensemble BDD         |
| `docs/current/database/triggers-stock-reference.md`                                        | 598    | Reference triggers stock   |
| `docs/current/modules/stock-module-reference.md`                                           | 340    | Module stock               |
| `docs/current/linkme/GUIDE-COMPLET-LINKME.md`                                              | 1367   | Guide complet LinkMe       |
| `docs/current/linkme/commission-reference.md`                                              | ~200   | Calcul commissions         |
| `docs/current/linkme/business-rules-linkme.md`                                             | 238    | Regles metier LinkMe       |
| `docs/current/linkme/routes-index.md`                                                      | 472    | Index routes LinkMe        |
| `docs/current/finance/AUDIT-WORKFLOW-COMMANDES-DEVIS-FACTURES.md`                          | 193    | Workflow facturation       |
| `docs/current/finance/finance-reference.md`                                                | ~200   | Module finance             |
| `docs/current/finance/quotes-architecture.md`                                              | 118    | Architecture devis         |
| `docs/integrations/qonto/GUIDE-COMPLET-API-QONTO.md`                                       | 307    | Integration Qonto          |
| `docs/current/INDEX-BACK-OFFICE-APP.md`                                                    | 632    | Index pages/composants BO  |
| `docs/current/INDEX-PAGES-BACK-OFFICE.md`                                                  | 436    | Index sidebar BO           |
| `docs/current/INDEX-COMPOSANTS-FORMULAIRES.md`                                             | 655    | 541 composants indexes     |
| `docs/current/DEPENDANCES-PACKAGES.md`                                                     | 133    | Carte dependances          |
| `docs/current/back-office-entities-index.md`                                               | 388    | Entites metier             |
| `docs/current/component-audit-guidelines.md`                                               | 398    | Audit composants           |
| `docs/architecture/COMPOSANTS-CATALOGUE.md`                                                | 141    | Catalogue UI               |
| `docs/architecture/notifications-et-approbations.md`                                       | 444    | Notifications/approbations |
| `docs/business-rules/07-commandes/notifications-workflow.md`                               | 689    | Workflow notifications     |
| `docs/business-rules/07-commandes/clients/sales-order-cancellation-workflow.md`            | 840    | Annulation SO              |
| `docs/business-rules/07-commandes/fournisseurs/PURCHASE-ORDER-WORKFLOW-COMPLET.md`         | 684    | Workflow PO                |
| `docs/business-rules/07-commandes/expeditions/COMMANDES-WORKFLOW-VALIDATION-EXPEDITION.md` | 464    | Validation expedition      |
| `docs/business-rules/06-stocks/movements/real-vs-forecast-separation.md`                   | 386    | Stock reel vs previsionnel |
| `docs/business-rules/06-stocks/alertes/guide-configuration-seuils.md`                      | 448    | Seuils alertes stock       |
| `docs/business-rules/06-stocks/backorders/BACKORDERS-POLICY.md`                            | 314    | Politique backorders       |
| `docs/current/site-internet/AUDIT-BACK-OFFICE-CMS.md`                                      | 418    | Audit CMS                  |
| `docs/current/site-internet/AUDIT-DATABASE-SITE.md`                                        | 314    | Audit BDD site             |
| `docs/current/site-internet/AUDIT-SITE-INTERNET-FRONTEND.md`                               | 330    | Audit frontend site        |
| `docs/current/site-internet/AUDIT-ISSUES-CRITIQUES.md`                                     | 316    | Issues critiques site      |
| `docs/current/troubleshooting/dev-environment.md`                                          | 313    | Troubleshooting dev        |
| `docs/current/deploy-runbooks.md`                                                          | 132    | Procedures deploiement     |

### B. Configuration agents (CLAUDE.md, rules, skills)

| Fichier                                         | Lignes | Role                             |
| ----------------------------------------------- | ------ | -------------------------------- |
| `CLAUDE.md` (racine)                            | ~120   | Instructions principales projet  |
| `apps/back-office/CLAUDE.md`                    | 56     | Instructions back-office         |
| `apps/linkme/CLAUDE.md`                         | 60     | Instructions LinkMe              |
| `apps/site-internet/CLAUDE.md`                  | 51     | Instructions site-internet       |
| `packages/@verone/organisations/CLAUDE.md`      | 31     | Source de verite formulaires org |
| `packages/@verone/orders/CLAUDE.md`             | 27     | Workflow commandes               |
| `packages/@verone/customers/CLAUDE.md`          | 20     | DEPRECATED pour formulaires      |
| `.claude/rules/code-standards.md`               | 142    | Standards code                   |
| `.claude/rules/workflow.md`                     | 96     | Workflow git/build               |
| `.claude/rules/database.md`                     | 104    | Patterns BDD/RLS                 |
| `.claude/rules/playwright.md`                   | 40     | Tests E2E                        |
| `.claude/rules/stock-triggers-protected.md`     | 47     | Triggers proteges                |
| `.claude/agents/dev-agent.md`                   | 66     | Agent developpeur                |
| `.claude/agents/reviewer-agent.md`              | 78     | Agent review                     |
| `.claude/agents/verify-agent.md`                | 45     | Agent validation                 |
| `.claude/agents/ops-agent.md`                   | 44     | Agent deploiement                |
| `.claude/agents/writer-agent.md`                | 33     | Agent documentation              |
| `.claude/agents/market-agent.md`                | 36     | Agent marketing                  |
| `.claude/skills/oneshot/SKILL.md`               | 37     | Quick fix                        |
| `.claude/skills/new-component/SKILL.md`         | 102    | Creation composant               |
| `.claude/skills/schema-sync/SKILL.md`           | 86     | Reference schema DB              |
| `.claude/guides/cross-app-protection.md`        | 579    | Protection inter-apps            |
| `.claude/guides/typescript-errors-debugging.md` | 390    | Debug TypeScript                 |

### C. Rapports et logs

| Fichier                                                            | Lignes | Date                  |
| ------------------------------------------------------------------ | ------ | --------------------- |
| `docs/scratchpad/README.md`                                        | ~30    | 16 avr 2026           |
| `diagnostic-verone.md`                                             | 1041   | Diagnostic systeme    |
| `export-claude-config-complet.md`                                  | 8605   | Export config complet |
| `reports/AUDIT-SUMMARY-2026-01-23.md`                              | ~200   | Audit janvier         |
| `docs/archive/finance/AUDIT-FACTURATION-QONTO-2026-01.md`          | 995    | Audit facturation     |
| `docs/archive/perf/audit-linkme-complet-2026-03-17.md`             | 378    | Audit perf LinkMe     |
| `docs/archive/perf/audit-pricing-commissions-linkme-2026-03-18.md` | 443    | Audit pricing         |
| `docs/archive/perf/audit-back-office-2026-03-24.md`                | 355    | Audit perf BO         |
| `docs/current/AUDIT-MAX-LINES-2026-04-14.md`                       | 216    | Audit taille fichiers |
| `CHANGELOG.md`                                                     | 235    | Historique versions   |

---

## SECTION 7 : CONFIGURATION DES AGENTS

### 7.1 Structure du dossier .claude/

```
.claude/
  agents/                    (6 fichiers, 302 lignes total)
    dev-agent.md             66 lignes
    reviewer-agent.md        78 lignes
    verify-agent.md          45 lignes
    ops-agent.md             44 lignes
    writer-agent.md          33 lignes
    market-agent.md          36 lignes
  commands/                  (9 fichiers, 1313 lignes total)
    README.md                61 lignes
    search.md                108 lignes
    review.md                118 lignes
    pr.md                    150 lignes
    status.md                38 lignes
    review-references/
      performance-rules.md   213 lignes
      security-rules.md      209 lignes
      size-thresholds.md     179 lignes
      typescript-rules.md    237 lignes
  rules/                     (5 fichiers, 429 lignes total)
    database.md              104 lignes
    workflow.md              96 lignes
    code-standards.md        142 lignes
    playwright.md            40 lignes
    stock-triggers-protected.md  47 lignes
  skills/                    (3 skills)
    oneshot/SKILL.md         37 lignes
    new-component/SKILL.md   102 lignes
    schema-sync/SKILL.md     86 lignes
  hooks/                     (2 scripts)
    check-component-creation.sh
    session-context.sh
  scripts/                   (6 scripts)
    auto-sync-with-main.sh
    clarify-before-code.sh
    cleanup-active-tasks.sh
    statusline-debug.sh
    validate-git-checkout.sh
    validate-playwright-screenshot.sh
  guides/                    (2 guides)
    cross-app-protection.md  579 lignes
    typescript-errors-debugging.md  390 lignes
  templates/
    component.tsx
  work/
    ACTIVE.md                369 lignes
    plan-canaux-de-vente.md
  settings.json              ~10 Ko (permissions + 14 PreToolUse + 2 PostToolUse hooks)
  settings.local.json        ~1.5 Ko (overrides locaux)
  README.md
  INDEX.md                   79 lignes
  test-credentials.md
```

### 7.2 Fichiers CLAUDE.md - Contenu integral

#### CLAUDE.md racine (contenu integral dans le fichier du projet, ~120 lignes)

Definit l'identite du coordinateur :

- Role : coordinateur qui delegue aux agents, ne code pas directement sauf taches triviales
- Romeo est declare NOVICE, l'agent doit le proteger
- Langue : francais (code/commits en anglais)
- Avant chaque action : lire doc DB, Triple Lecture (3 fichiers similaires), verifier git log
- Delegation automatique : dev-agent, reviewer-agent, verify-agent, ops-agent, writer-agent, market-agent
- Sources de verite : docs/current/database/schema/, INDEX-COMPOSANTS-FORMULAIRES, DEPENDANCES-PACKAGES
- Interdictions : zero `any` TypeScript, ne jamais modifier routes API existantes, triggers stock, ne jamais lancer pnpm dev
- Fichier > 400 lignes = refactoring obligatoire
- PR vers staging uniquement (jamais main)
- Format commit : `[APP-DOMAIN-NNN] type: description`

#### apps/back-office/CLAUDE.md (56 lignes)

- Staff CRM/ERP pour concept store decoration/mobilier d'interieur
- Lectures critiques : INDEX-PAGES, INDEX-BACK-OFFICE-APP, INDEX-COMPOSANTS, entities index
- Build filtre : `pnpm --filter @verone/back-office`
- Roles staff : owner, admin, sales, catalog_manager

#### apps/linkme/CLAUDE.md (60 lignes)

- Plateforme B2B d'affiliation ("linkme" PAS "affiliate")
- Lecture critique : GUIDE-COMPLET-LINKME.md
- Build filtre : `pnpm --filter @verone/linkme`
- Isolation RLS par enseigne_id XOR organisation_id
- 2 types de commissions : Verone + affilie

#### apps/site-internet/CLAUDE.md (51 lignes)

- E-commerce public concept store
- Produits via RPC `get_site_internet_products()`
- Build filtre : `pnpm --filter @verone/site-internet`
- Positionnement : "Concept store - sourcing creatif, produits originaux, qualite-prix"

#### packages/@verone/organisations/CLAUDE.md (31 lignes)

- SOURCE DE VERITE pour TOUS les formulaires organisations
- Composants : UnifiedOrganisationForm, SupplierFormModal, PartnerFormModal, CustomerOrganisationFormModal
- Regle : ne JAMAIS creer de formulaires org dans d'autres packages ou apps/

#### packages/@verone/orders/CLAUDE.md (27 lignes)

- Gere les workflows commandes, PAS les formulaires entite
- Composants : SalesOrderFormModal, PurchaseOrderFormModal, CreateLinkMeOrderModal
- Regle : importer les formulaires org depuis @verone/organisations

#### packages/@verone/customers/CLAUDE.md (20 lignes)

- DEPRECATED pour les composants formulaires
- CustomerFormModal est un DOUBLON de UnifiedOrganisationForm
- Valide : hooks lecture/recherche, composants affichage, logique metier

### 7.3 Agents configures (6)

| Agent          | Modele            | Role                                                                 |
| -------------- | ----------------- | -------------------------------------------------------------------- |
| dev-agent      | claude-sonnet-4-6 | Developpeur senior - code + TDD + changelog auto                     |
| reviewer-agent | claude-sonnet-4-6 | Code reviewer impartial - qualite, securite, performance (read-only) |
| verify-agent   | claude-sonnet-4-6 | Validateur conformite - tests, types, build                          |
| ops-agent      | claude-sonnet-4-6 | Deploiement et infrastructure (uniquement apres review PASS)         |
| writer-agent   | claude-sonnet-4-6 | Documentation technique et rapports                                  |
| market-agent   | claude-sonnet-4-6 | Analyse et positionnement produit                                    |

### 7.4 Skills (3)

| Skill         | Lignes | Fonction                                                             |
| ------------- | ------ | -------------------------------------------------------------------- |
| oneshot       | 37     | Correctif rapide (bugs isoles, typos, CSS) sans exploration profonde |
| new-component | 102    | Creation composant React avec structure standard Verone              |
| schema-sync   | 86     | Reference rapide schema DB Supabase (lecture seule)                  |

### 7.5 Commands (5 slash commands)

| Commande | Lignes | Fonction                        |
| -------- | ------ | ------------------------------- |
| /search  | 108    | Exploration codebase + DB + RLS |
| /review  | 118    | Audit qualite code structure    |
| /pr      | 150    | Commit + push + PR vers staging |
| /status  | 38     | Resume rapide etat projet       |
| /README  | 61     | Guide de travail agent          |

### 7.6 Hooks configures

**SessionStart (2 hooks) :**

1. Rappel contexte critique (monorepo, DB, composants)
2. `session-context.sh` (branche, compteurs DB/composants)

**UserPromptSubmit (1 hook) :**

1. `clarify-before-code.sh` (checklist pre-implementation)

**PreToolUse (14 hooks) :**

1. Bloquer creation composants dans `apps/` (forcer `packages/@verone/`)
2. Bloquer ecriture sur branche main
3. Valider `git checkout` via script
4. Bloquer `--no-verify`
5. Verifier branche + format commit avant `git commit`
6. Bloquer push direct sur main
7. Rappeler /review avant PR
8. Forcer `--base staging` sur `gh pr create`
9. Bloquer `pnpm dev` / `pnpm start`
10. Alerte duplication composants
11. Protection fichiers `@protected`
12. Rappel middleware
13. Rappel politiques RLS
14. Detection `any` TypeScript
15. Validation screenshots Playwright

**PostToolUse (2 hooks) :**

1. Auto type-check apres edition fichier .ts/.tsx
2. Verification compteur composants + nettoyage ACTIVE.md apres commit

### 7.7 MCP configures (5 serveurs actifs)

| Serveur           | Type      | Fonction                                               |
| ----------------- | --------- | ------------------------------------------------------ |
| context7          | CLI (npx) | Documentation bibliotheques a jour                     |
| playwright-lane-1 | CLI       | Chrome vision mode, profil 1                           |
| playwright-lane-2 | CLI       | Chrome vision mode, profil 2                           |
| shadcn            | CLI (npx) | Registre composants UI shadcn                          |
| supabase          | HTTP      | Acces projet Supabase (execute_sql, list_tables, etc.) |

### 7.8 Permissions

**26 patterns autorises** (git, pnpm, gh, node, outils lecture, MCP)
**7+ patterns refuses** (rm -rf, sudo, apply_migration, create/merge/delete/reset branch Supabase, deploy edge function)

---

## SECTION 8 : ETAT GIT ET HISTORIQUE RECENT

### Etat actuel

| Champ                      | Valeur                      |
| -------------------------- | --------------------------- |
| Branche actuelle           | staging                     |
| Fichiers modifies          | 0 (arbre de travail propre) |
| Commits en avance sur main | 0 (staging = main)          |

### Branches locales (7)

```
  feat/BO-LM-001-inline-editing-linkme-orders
  feat/BO-PAY-001-cleanup-manual-payment-columns
  feat/SI-AUTH-001-google-identity-services
  fix/BO-LM-001-fix-create-order-reset-loop
  main
  refonte/verone-v2-claude-config
* staging
```

### Branches distantes (8)

```
  origin/feat/BO-LM-001-inline-editing-linkme-orders
  origin/feat/BO-PAY-001-cleanup-manual-payment-columns
  origin/feat/BO-TEST-001-e2e-infrastructure-audit-fixes
  origin/feat/SI-AUTH-001-google-identity-services
  origin/fix/BO-LM-001-fix-create-order-reset-loop
  origin/main
  origin/refonte/verone-v2-claude-config
  origin/staging
```

### 30 derniers commits

| Hash      | Date       | Message                                                                                       |
| --------- | ---------- | --------------------------------------------------------------------------------------------- |
| e4f06cb8a | 2026-04-16 | [BO-FIN-001] fix: add missing billing/shipping address fields to order detail fetch           |
| bdf666a81 | 2026-04-16 | [BO-FIN-001] fix: restore original InvoiceCreateServiceModal -- revert broken refactor        |
| af2f15ec5 | 2026-04-16 | [NO-TASK] chore: add @protected guards on LinkMe order creation flow                          |
| 872a3cde6 | 2026-04-16 | [BO-LME-001] fix: stabilize resetNewCustomerForm with useCallback to stop infinite reset loop |
| 75b70abb6 | 2026-04-16 | [BO-FIN-001] fix: display billing/delivery addresses on devis detail page                     |
| c85742bdb | 2026-04-16 | [NO-TASK] chore: pre-commit now runs docs:generate --auto on every commit                     |
| 4776477d1 | 2026-04-15 | [NO-TASK] chore: corrections post-audit coherence                                             |
| 2171a4a7d | 2026-04-15 | [NO-TASK] chore: Phase 6 -- Nettoyage fichiers orphelins + hooks                              |
| b72a59199 | 2026-04-15 | [NO-TASK] chore: Phase 5 -- CLAUDE.md + INDEX.md + README.md + scratchpad                     |
| 3160c0f14 | 2026-04-15 | [NO-TASK] chore: Phase 4 -- Commands nettoyees (10 -> 5)                                      |
| 5fbf9af14 | 2026-04-15 | [NO-TASK] chore: Phase 3 -- Agents recrees (7 -> 6, pattern 5 piliers)                        |
| f10bf58c0 | 2026-04-15 | [NO-TASK] chore: Phase 2 -- Memoire migree et centralisee                                     |
| f66a83057 | 2026-04-15 | [NO-TASK] chore: Phase 1 -- Rules fusionnees (17 -> 5)                                        |
| e9c1e201e | 2026-04-15 | [NO-TASK] chore: inventaire pre-refonte v2 configuration Claude Code                          |
| 8e44d3013 | 2026-04-16 | Merge pull request #609 from Verone2021/feat/SI-AUTH-001-google-identity-services             |
| 911641d85 | 2026-04-16 | Merge pull request #608 from Verone2021/feat/BO-LM-001-inline-editing-linkme-orders           |
| 646802c89 | 2026-04-16 | [NO-TASK] feat: replace Google OAuth redirect with signInWithIdToken                          |
| 97576d9e0 | 2026-04-16 | [NO-TASK] feat: inline editing on LinkMe order detail page                                    |
| 109b2e3e6 | 2026-04-16 | Merge pull request #607 from Verone2021/staging                                               |
| 106b8d28b | 2026-04-16 | Merge pull request #606 from Verone2021/feat/BO-PAY-001-cleanup-manual-payment-columns        |
| bce652df2 | 2026-04-16 | [BO-PAY-001] refactor: drop legacy manual_payment columns + create v_all_payments view        |
| d22c6fcd0 | 2026-04-15 | Merge pull request #605 from Verone2021/staging                                               |
| c3a4c8dde | 2026-04-15 | [BO-TEST-001] E2E test infrastructure + error boundaries + audit fixes                        |
| 4a41a3984 | 2026-04-15 | Merge pull request #603 from Verone2021/staging                                               |
| 9626fc94e | 2026-04-15 | Merge pull request #602 from Verone2021/feat/BO-PROD-001-sourcing-notebook-audit              |
| 8f50a97de | 2026-04-15 | [NO-TASK] docs: mise a jour ACTIVE.md avec sprint BO-PROD-001 termine                         |
| c76a3ea61 | 2026-04-15 | [BO-PROD-001] feat: PO multi-produits, consultation tableau, assigned_to resolu, notes wizard |
| 69d9ab58e | 2026-04-15 | [BO-PROD-001] feat: PDF client TVA + redesign filtres consultations                           |
| 7188ae36e | 2026-04-15 | [BO-PROD-001] feat: simulateur marges consultations + sourcing multi-vues                     |
| 6ae17a31f | 2026-04-15 | Merge pull request #593 from Verone2021/feat/BO-PROD-001-sourcing-notebook-audit              |

### Tags (5 derniers)

```
backup-before-consolidation-20260128-234421
archive-scripts-2025-11
backup-pre-reset-2025-11-16
backup-reset-20251116-final
v2.0.0-monorepo-complete
```

### Stash (18 entrees)

| Index         | Branche d'origine        | Description                                              |
| ------------- | ------------------------ | -------------------------------------------------------- |
| stash@{0}     | fix/SI-MAXLINES          | resolve ESLint consistent-type-imports in validate-promo |
| stash@{1}     | fix/BO-MAXLINES-pages    | add resetNewCustomerForm to useEffect deps               |
| stash@{2}     | fix/SI-MAXLINES          | refactor: checkout/page.tsx 703->248 lines               |
| stash@{3}     | staging                  | PR #578 BO-FIN-002-cleanup-quote-service-only            |
| stash@{4}     | staging                  | PR #527 refactor/MAXLINES-integration-all                |
| stash@{5}     | refactor/BO-MAXLINES-051 | split RuleModal (1047L) into 9 sub-files                 |
| stash@{6}     | refactor/BO-MAXLINES-004 | delete dead code                                         |
| stash@{7}     | staging                  | nouveau-produit-two-forms                                |
| stash@{8-10}  | --                       | lint-staged automatic backup (x3)                        |
| stash@{11}    | feat/BO-MSG-001          | Finance M1-M6 complete, Stocks hub redesign              |
| stash@{12-13} | fix/BO-PLAN3             | Dashboard KPI + LinkMeCataloguePage refactoring          |
| stash@{14}    | fix/BO-AUDIT-001-phase-a | agent work in progress                                   |
| stash@{15-16} | staging                  | fix: remove circular dependencies (x2)                   |
| stash@{17}    | --                       | lint-staged automatic backup                             |

---

## SECTION 9 : SIGNAUX D'ALERTE DETECTES

### 9.1 Fichiers depassant 500 lignes (top 30)

| Lignes | Fichier                                                                                                |
| ------ | ------------------------------------------------------------------------------------------------------ |
| 15 262 | `packages/@verone/types/src/supabase.ts` (auto-genere)                                                 |
| 15 230 | `apps/back-office/src/types/supabase.d.ts` (auto-genere)                                               |
| 10 435 | `packages/@verone/types/packages/@verone/types/src/supabase.ts` (doublon ?)                            |
| 10 435 | `packages/@verone/types/apps/back-office/src/types/supabase.ts` (doublon ?)                            |
| 1 654  | `packages/@verone/integrations/src/qonto/client.ts`                                                    |
| 1 036  | `packages/@verone/consultations/src/hooks/use-consultations.ts`                                        |
| 882    | `apps/back-office/src/app/api/qonto/invoices/route.ts`                                                 |
| 767    | `packages/@verone/consultations/src/components/interfaces/ConsultationOrderInterface.tsx`              |
| 703    | `apps/site-internet/src/app/checkout/page.tsx`                                                         |
| 697    | `packages/@verone/integrations/src/qonto/types.ts`                                                     |
| 676    | `chrome-extension/popup.js`                                                                            |
| 634    | `packages/@verone/types/src/collections.ts`                                                            |
| 610    | `packages/@verone/channels/src/components/google-merchant/GoogleMerchantProductManager.tsx`            |
| 603    | `packages/@verone/stock/src/hooks/use-stock.ts`                                                        |
| 601    | `apps/linkme/src/lib/hooks/use-linkme-catalog.ts`                                                      |
| 593    | `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal/use-create-order.ts`                 |
| 592    | `chrome-extension/content-script.js`                                                                   |
| 584    | `apps/linkme/src/app/(main)/profil/page.tsx`                                                           |
| 577    | `apps/linkme/src/components/organisations/organisation-detail/InfosTab.tsx`                            |
| 573    | `packages/@verone/finance/src/components/InvoiceCreateServiceModal.tsx`                                |
| 569    | `packages/@verone/stock/src/components/modals/StockMovementModal.tsx`                                  |
| 553    | `packages/@verone/orders/src/components/modals/CreateLinkMeOrderModal/use-create-linkme-order-form.ts` |
| 551    | `apps/linkme/src/components/layout/AppSidebar.tsx`                                                     |
| 534    | `packages/@verone/stock/src/hooks/use-stock-reservations.ts`                                           |
| 530    | `apps/linkme/src/app/(main)/ma-selection/page.tsx`                                                     |
| 526    | `apps/linkme/src/components/orders/RestaurantSelectorModal.tsx`                                        |
| 526    | `apps/back-office/src/app/api/sourcing/import/route.ts`                                                |
| 524    | `packages/@verone/stock/src/components/modals/GeneralStockMovementModal.tsx`                           |
| 524    | `apps/linkme/src/app/(main)/notifications/page.tsx`                                                    |
| 523    | `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/details/hooks.ts`             |

**Note :** Les 4 premiers fichiers (supabase.ts) sont auto-generes. Les 2 derniers dans `packages/@verone/types/` semblent etre des doublons imbriques anormaux.

### 9.2 Compteurs generaux

| Metrique                             | Valeur           |
| ------------------------------------ | ---------------- |
| Total fichiers TS/JS/TSX/JSX         | 3 221            |
| Total lignes de code                 | 600 143          |
| Fichiers > 500 lignes                | ~30              |
| Fichiers > 400 lignes (seuil projet) | ~45 (estimation) |

### 9.3 Marqueurs TODO / FIXME / HACK / XXX

| Type      | Occurrences |
| --------- | ----------- |
| TODO      | 68          |
| FIXME     | 15          |
| HACK      | 0           |
| XXX       | 16          |
| **Total** | **99**      |

**10 exemples recents :**

1. `apps/back-office/src/app/layout.tsx:20` -- TODO PERF: Migrer vers pattern routes authentifiees
2. `apps/back-office/src/app/api/csp-report/route.ts:136` -- TODO: Send to monitoring service
3. `apps/back-office/src/app/api/qonto/invoices/[id]/details/route.ts:345` -- TODO: source_quote_id pour conversion devis->facture
4. `apps/back-office/src/app/api/cron/google-merchant-poll/route.ts:126` -- TODO: Interroger Google Merchant API
5. `apps/back-office/src/components/forms/quick-variant-form.tsx:97` -- FIXME: DynamicColorSelector n'existe pas
6. `apps/back-office/src/components/business/contact-form-modal-wrapper.tsx:32` -- TODO: save logic
7. `apps/back-office/src/components/business/collection-image-upload.tsx:9` -- TODO: upload images collections
8. `apps/back-office/src/components/business/consultation-photos-modal.tsx:9` -- TODO: modal photos consultations
9. `apps/back-office/src/components/business/consultation-order-interface.tsx:9` -- TODO: interface commande consultations
10. `apps/back-office/src/app/(protected)/parametres/webhooks/[id]/edit/page.tsx:68` -- TODO: specify columns (select(\*))

### 9.4 Fichiers backup / old / deprecated

**Migrations avec "v2", "backup", "rollback" dans le nom :** 15 fichiers

- 8 migrations "\_v2" (finance, payment_status, expense_rules, etc.)
- 3 migrations "backup" ou "cleanup_backup"
- 1 migration "ROLLBACK"
- 3 migrations "drop_old" ou "drop_remaining_backups"

**Hooks archive (fonctionnalite metier, pas backup) :** 4 fichiers

- `use-variant-group-archive.ts`, `use-archived-products.ts`, `use-archive-organisation.ts`, `use-archive-notifications.ts`

**Doublons potentiels dans packages/@verone/types/ :**

- `packages/@verone/types/packages/@verone/types/src/supabase.ts` (10 435 lignes)
- `packages/@verone/types/apps/back-office/src/types/supabase.ts` (10 435 lignes)
- Ces fichiers semblent etre des copies imbriquees anormales du type Supabase genere.

### 9.5 Dossier docs/scratchpad/

| Fichier   | Taille       | Date        |
| --------- | ------------ | ----------- |
| README.md | 1 125 octets | 16 avr 2026 |

(Un seul fichier -- le rapport d'audit maxlines a ete supprime lors du git clean)

### 9.6 Dossiers archive/

- `archive/2026-01/` -- Archive historique janvier 2026
- `docs/archive/eslint-strategy-2026.md` -- Strategie ESLint archivee
- `docs/archive/finance/` -- Audit facturation Qonto
- `docs/archive/perf/` -- 3 audits performance (mars 2026)
- `docs/archive/plans/` -- Plans archives

---

## SECTION 10 : QUESTIONS POUR L'UTILISATEUR

1. **Deploiement production :** Quel est le service de deploiement (Vercel, autre) ? Les 3 apps sont-elles toutes deployees ? Quelles sont les URLs de production exactes ?

2. **Etat de production actuel :** Quelles fonctionnalites du back-office sont actuellement cassees en production ? Y a-t-il des ecrans specifiques inaccessibles ?

3. **Refactorings precedents :** Les commits "Phase 1-6" (15 avril) de refonte de la configuration Claude Code ont-ils ete testes en production ? Ont-ils cause des regressions ?

4. **Doublons types Supabase :** Pourquoi y a-t-il des copies imbriquees de supabase.ts dans `packages/@verone/types/packages/` et `packages/@verone/types/apps/` ? Est-ce un artefact de generation ?

5. **Priorites fonctionnelles :** Quelles sont les 3-5 fonctionnalites prioritaires a stabiliser ou developper ?

6. **Utilisateurs actuels :** Combien d'utilisateurs actifs sur chaque app (back-office, LinkMe, site-internet) ? Y a-t-il des affilies LinkMe en production ?

7. **Equipe :** Y a-t-il d'autres developpeurs sur le projet, ou Romeo est-il le seul operateur humain ?

8. **Stash :** Les 18 entrees stash contiennent du travail potentiellement important (refactoring MAXLINES, Finance M1-M6, Dashboard KPI). Lesquelles doivent etre conservees ? Lesquelles peuvent etre supprimees ?

9. **Branches :** Les branches feature locales (BO-LM-001, BO-PAY-001, SI-AUTH-001, etc.) sont-elles toutes mergees ? Peuvent-elles etre nettoyees ?

10. **Google Merchant Center :** L'integration est-elle active en production ou encore en cours de developpement ? Le cron poll renvoie des valeurs hardcodees (TODO dans le code).

11. **Stripe (site-internet) :** Le paiement Stripe est-il actif en production ? Le checkout fait 703 lignes et n'a pas ete decompose.

12. **Revolut (LinkMe) :** L'integration Revolut pour les paiements affilies est-elle operationnelle ?

13. **Systeme ambassadeurs :** Le systeme ambassadeurs (site-internet) est-il lance ? Des ambassadeurs actifs ?

14. **Chrome extension :** Il y a un dossier `chrome-extension/` a la racine (popup.js 676 lignes, content-script.js 592 lignes). A quoi sert-elle ? Est-elle maintenue ?

15. **Tests E2E :** Les tests Playwright sont-ils executes en CI ? Quel est le taux de reussite actuel ?

---

FIN DU RAPPORT

**Resume quantitatif :**

- 3 applications Next.js 15.5.7
- 22 packages partages
- 142 tables PostgreSQL (Supabase)
- 660 migrations SQL
- 3 221 fichiers TypeScript/JavaScript
- 600 143 lignes de code total
- 208 fichiers de documentation Markdown
- 6 agents Claude Code configures
- 99 marqueurs TODO/FIXME/XXX
