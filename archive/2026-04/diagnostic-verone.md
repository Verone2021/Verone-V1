# Diagnostic Verone Back Office — 2026-04-09 18:53

---

## 1. .claude/hooks.json

```
FICHIER INEXISTANT
```

---

## 2. Liste des fichiers .claude/rules/

```
.claude/rules/backend/api.md
.claude/rules/database/rls-patterns.md
.claude/rules/database/supabase.md
.claude/rules/dev/build-commands.md
.claude/rules/dev/clean-code.md
.claude/rules/dev/component-safety.md
.claude/rules/dev/context-loading.md
.claude/rules/dev/deployment-verification.md
.claude/rules/dev/git-workflow.md
.claude/rules/dev/hooks-bloquants.md
.claude/rules/dev/multi-agent.md
.claude/rules/dev/playwright-large-pages.md
.claude/rules/dev/playwright-screenshots.md
.claude/rules/dev/servers.md
.claude/rules/dev/stock-triggers-protected.md
.claude/rules/frontend/async-patterns.md
```

---

## 3. .claude/INDEX.md

```markdown
# INDEX CENTRALISE — Verone Back Office

**Derniere mise a jour** : 2026-04-01 (nettoyage ACTIVE.md + restauration 40 docs + agent memories)

Ce fichier est le sommaire unique pour trouver toute l'information du repository.
Tout agent ou commande doit commencer par consulter cet index.

---

## Taches en cours

- **`.claude/work/ACTIVE.md`** — Sprints, taches, bugs en cours. LIRE EN PREMIER.
- **`.claude/work/MEGA-PLAN-REFONTE.md`** — Plan de refonte infrastructure (7 phases).

---

## Commandes Slash

| Commande        | Description                                                                 | Fichier                            |
| --------------- | --------------------------------------------------------------------------- | ---------------------------------- |
| `/search`       | Exploration exhaustive codebase + DB + RLS (remplace /explore et /research) | `.claude/commands/search.md`       |
| `/implement`    | Feature implementation (search → plan → code → verify)                      | `.claude/commands/implement.md`    |
| `/plan`         | Transformer observations en checklist dans ACTIVE.md                        | `.claude/commands/plan.md`         |
| `/db`           | Operations Supabase rapides                                                 | `.claude/commands/db.md`           |
| `/pr`           | Push + PR (**sur ordre Romeo uniquement**)                                  | `.claude/commands/pr.md`           |
| `/review`       | Audit code complet avec rapport                                             | `.claude/commands/review.md`       |
| `/fix-warnings` | ESLint auto-fix                                                             | `.claude/commands/fix-warnings.md` |
| `/teach`        | Mode pedagogique (expliquer avant implementer)                              | `.claude/commands/teach.md`        |
| `/status`       | Resume rapide (branche, taches, fichiers non commites)                      | `.claude/commands/status.md`       |

---

## Agents Specialises

### Agents par application (utiliser en priorite)

| Agent                  | App           | Quand l'utiliser                                                               |
| ---------------------- | ------------- | ------------------------------------------------------------------------------ |
| `linkme-expert`        | LinkMe        | Commandes affilies, commissions, selections, formulaires, organisations, roles |
| `back-office-expert`   | Back-Office   | Produits, stock, commandes, factures, finance Qonto, expeditions               |
| `site-internet-expert` | Site-Internet | E-commerce, catalogue, checkout, panier, SEO                                   |

### Agents transversaux

| Agent                | Role               | Quand l'utiliser                             |
| -------------------- | ------------------ | -------------------------------------------- |
| `code-reviewer`      | QA avant PR        | Audit qualite TypeScript, async, RLS         |
| `database-architect` | Expert DB Supabase | Tables, migrations, triggers, RLS            |
| `frontend-architect` | Expert UI/UX       | Next.js 15, composants, patterns generiques  |
| `perf-optimizer`     | Performance        | Dead code, overfetch, bundle, DB bottlenecks |

---

## Skills (charges on-demand)

| Skill           | Usage                                                  | Fichier                                 |
| --------------- | ------------------------------------------------------ | --------------------------------------- |
| `rls-patterns`  | Reference patterns RLS Supabase                        | `.claude/skills/rls-patterns/SKILL.md`  |
| `schema-sync`   | Reference rapide schema DB (tables, colonnes, FK, RLS) | `.claude/skills/schema-sync/SKILL.md`   |
| `oneshot`       | Correctif rapide (bug isole, typo, ajustement CSS)     | `.claude/skills/oneshot/SKILL.md`       |
| `new-component` | Template creation composant React standard             | `.claude/skills/new-component/SKILL.md` |

---

## Regles (auto-discovered par Claude Code)

| Fichier                                        | Contenu                                                        |
| ---------------------------------------------- | -------------------------------------------------------------- |
| `.claude/rules/dev/git-workflow.md`            | Branches, commits, PR — **STOP avant commit/push/PR**          |
| `.claude/rules/dev/context-loading.md`         | **OBLIGATOIRE** — consulter contexte avant de coder            |
| `.claude/rules/dev/build-commands.md`          | Toujours filtrer `pnpm --filter @verone/[app]`                 |
| `.claude/rules/dev/hooks-bloquants.md`         | Documentation des hooks actifs                                 |
| `.claude/rules/dev/servers.md`                 | Ports 3000/3001/3002 — JAMAIS lancer dev                       |
| `.claude/rules/dev/multi-agent.md`             | Coordination multi-agents                                      |
| `.claude/rules/dev/deployment-verification.md` | Checklist post-deploiement                                     |
| `.claude/rules/dev/playwright-screenshots.md`  | Screenshots dans `.playwright-mcp/screenshots/`                |
| `.claude/rules/frontend/async-patterns.md`     | Promesses, handlers async, invalidateQueries                   |
| `.claude/rules/backend/api.md`                 | Route handlers, validation Zod, JAMAIS modifier API existantes |
| `.claude/rules/database/supabase.md`           | Migrations, RLS, queries, types                                |
| `.claude/rules/database/rls-patterns.md`       | Patterns RLS complets (staff, affilies, public)                |
| `.claude/rules/dev/clean-code.md`              | Fichier > 400 lignes = refactoring obligatoire                 |

---

## Documentation par domaine

### Back-Office

| Sujet          | Source                                       |
| -------------- | -------------------------------------------- |
| Guide complet  | `docs/current/INDEX-BACK-OFFICE-COMPLET.md`  |
| Pages index    | `docs/current/INDEX-PAGES-BACK-OFFICE.md`    |
| Entites metier | `docs/current/back-office-entities-index.md` |
| CLAUDE.md      | `apps/back-office/CLAUDE.md`                 |

### Composants & Formulaires partages (CRITIQUE)

| Sujet                | Source                                          |
| -------------------- | ----------------------------------------------- |
| Index transversal    | `docs/current/INDEX-COMPOSANTS-FORMULAIRES.md`  |
| 22 packages @verone/ | Tous les modals, hooks, formulaires par package |

### LinkMe

| Sujet         | Source                                        |
| ------------- | --------------------------------------------- |
| Guide complet | `docs/current/linkme/GUIDE-COMPLET-LINKME.md` |
| Index complet | `docs/current/INDEX-LINKME-COMPLET.md`        |
| Commissions   | `docs/current/linkme/commission-reference.md` |
| CLAUDE.md     | `apps/linkme/CLAUDE.md`                       |

### Site Internet

| Sujet         | Source                                        |
| ------------- | --------------------------------------------- |
| Index complet | `docs/current/INDEX-SITE-INTERNET-COMPLET.md` |
| CLAUDE.md     | `apps/site-internet/CLAUDE.md`                |

### Database

| Sujet                | Source                                              |
| -------------------- | --------------------------------------------------- |
| Tables par domaine   | Serena `database-tables-by-domain`                  |
| Triggers stock       | `docs/current/database/triggers-stock-reference.md` |
| Triggers metriques   | `docs/metrics/database-triggers.md`                 |
| RLS patterns         | `.claude/rules/database/rls-patterns.md`            |
| Mapping pages-tables | `docs/current/MAPPING-PAGES-TABLES.md`              |
| Architecture DB      | `docs/current/serena/database-implementation.md`    |

### Finance

| Sujet                     | Source                                               |
| ------------------------- | ---------------------------------------------------- |
| Reference finance         | `docs/current/finance/finance-reference.md`          |
| Systeme Qonto             | Serena `qonto-invoicing-system`                      |
| Qonto env setup           | `docs/integrations/qonto-env-setup.md`               |
| Never finalize            | `docs/current/serena/qonto-never-finalize.md`        |
| Invoicing system (routes) | `docs/current/finance/invoicing-system-reference.md` |
| Workflow ventes complet   | `docs/current/WORKFLOW-VENTES.md`                    |
| Dependances composants    | `docs/current/COMPONENT-DEPENDENCIES.md`             |

### Modules

| Sujet                | Source                                              |
| -------------------- | --------------------------------------------------- |
| Stock                | `docs/current/modules/stock-module-reference.md`    |
| Commandes (workflow) | `docs/current/modules/orders-workflow-reference.md` |
| Sourcing             | `docs/current/modules/sourcing-reference.md`        |

### Regles metier (restaurees 2026-04-01)

| Sujet                      | Source                                                                          |
| -------------------------- | ------------------------------------------------------------------------------- |
| Alertes stock              | `docs/business-rules/06-stocks/alertes/`                                        |
| Backorders                 | `docs/business-rules/06-stocks/backorders/BACKORDERS-POLICY.md`                 |
| Stock reel vs previsionnel | `docs/business-rules/06-stocks/movements/real-vs-forecast-separation.md`        |
| Tracabilite stock          | `docs/business-rules/06-stocks/movements/stock-traceability-rules.md`           |
| Annulation commande        | `docs/business-rules/07-commandes/clients/sales-order-cancellation-workflow.md` |
| Workflow expedition        | `docs/business-rules/07-commandes/expeditions/`                                 |
| Workflow PO complet        | `docs/business-rules/07-commandes/fournisseurs/`                                |
| Notifications commandes    | `docs/business-rules/07-commandes/notifications-workflow.md`                    |
| Calcul marge LinkMe        | `docs/linkme/margin-calculation.md`                                             |
| Decisions projet           | `docs/current/serena/project-decisions.md`                                      |
| Incident runbook           | `docs/runbooks/incident.md`                                                     |

---

## Serena Memories (contexte metier persistant)

### Architecture

- `project-architecture` — Architecture globale monorepo
- `site-internet-architecture` — Architecture site e-commerce
- `back-office-sections-index` — Sections du back-office
- `linkme-business-model` — Modele metier LinkMe

### Database

- `database-tables-by-domain` — Tables par domaine metier
- `address-system-architecture` — Systeme d'adresses
- `business-rules-organisations` — Regles metier organisations

### LinkMe (11 memories)

- `linkme-order-commission-workflow` — Workflow commandes + commissions
- `linkme-auth-patterns` — Authentification et roles
- `linkme-public-selections-architecture` — Selections publiques
- `linkme-price-locking-system` — Verrouillage prix
- `linkme-commission-rules` — Regles de commission
- `linkme-commission-vs-margin-fields` — Champs commission vs marge
- `linkme-order-contact-workflow` — Workflow contacts commande
- `linkme-info-request-workflow` — Workflow demandes d'info
- `linkme-price-correction-workflow` — Correction prix post-commande
- `linkme-order-forms-comparison` — Comparaison 2 formulaires commande
- `linkme-facture-verification-bubble-rules` — Regles verification facturation

### Operations

- `stock-triggers-alerts-complete` — Triggers stock et alertes
- `notifications-system-audit-2026-03` — Systeme notifications
- `sales-order-status-workflow-complete` — Workflow commandes vente
- `purchase-order-status-workflow-complete` — Workflow commandes achat
- `sales-invoices-processing-rules` — Regles traitement factures
- `qonto-invoicing-system` — Systeme facturation Qonto
- `auth-middleware-patterns` — Patterns middleware auth

---

## Agent Memories (7 agents, tous configures)

| Agent                  | Memoire                                      |
| ---------------------- | -------------------------------------------- |
| `back-office-expert`   | `.claude/agent-memory/back-office-expert/`   |
| `linkme-expert`        | `.claude/agent-memory/linkme-expert/`        |
| `site-internet-expert` | `.claude/agent-memory/site-internet-expert/` |
| `database-architect`   | `.claude/agent-memory/database-architect/`   |
| `frontend-architect`   | `.claude/agent-memory/frontend-architect/`   |
| `code-reviewer`        | `.claude/agent-memory/code-reviewer/`        |
| `perf-optimizer`       | `.claude/agent-memory/perf-optimizer/`       |

## Memoire persistante (feedbacks & projets)

- **Emplacement** : `~/.claude/projects/-Users-romeodossantos-verone-back-office-V1/memory/`
- **Index** : `MEMORY.md` dans ce repertoire
- **Contenu** : Feedbacks de Romeo, bugs connus, decisions projet, references externes

---

## MCP Servers disponibles

| Serveur                      | Usage                                             |
| ---------------------------- | ------------------------------------------------- |
| Supabase                     | SQL, tables, migrations, types                    |
| Playwright (lane-1 & lane-2) | Tests visuels, navigation, screenshots            |
| Serena                       | Navigation code semantique, memories              |
| Context7                     | Documentation librairies a jour                   |
| shadcn                       | Registre composants shadcn/ui (officiel, gratuit) |

---

## Stack technique

- **Framework** : Next.js 15 App Router
- **Language** : TypeScript strict (zero `any`)
- **UI** : shadcn/ui + Tailwind CSS
- **DB** : Supabase PostgreSQL (RLS obligatoire)
- **State** : React Query (TanStack Query)
- **Validation** : Zod
- **Tests** : Playwright MCP (visuels)
- **Monorepo** : pnpm workspaces + Turborepo
```

---

## 4. .claude/rules/dev/context-loading.md

```markdown
# Chargement de Contexte (OBLIGATOIRE)

## CRITICAL : Triple Lecture

Avant TOUTE modification de code, lire au minimum **3 fichiers ou references similaires** pour garantir l'alignement sur les patterns existants du projet. Cela empeche la creation de doublons fonctionnels et force la coherence.

## CRITICAL : NE JAMAIS coder sans contexte

### Etapes obligatoires

1. **Lire ACTIVE.md** (`.claude/work/ACTIVE.md`) — taches en cours, sprints, bugs connus
2. **Lire le CLAUDE.md de l'app concernee** — regles specifiques, documentation par tache
3. **Consulter la memoire persistante** — feedbacks, bugs connus, decisions passees
4. **Verifier Serena memories pertinentes** — workflows, schemas, patterns metier
5. **Explorer le code existant** — patterns, hooks, composants similaires AVANT de creer
6. **Lire 3 fichiers similaires** — composants, hooks ou pages qui font la meme chose

### Sources par domaine

| Domaine       | Sources a consulter                                                                          |
| ------------- | -------------------------------------------------------------------------------------------- |
| LinkMe        | `apps/linkme/CLAUDE.md`, Serena `linkme-*` memories, `docs/current/linkme/`                  |
| Back-office   | `apps/back-office/CLAUDE.md`, Serena `business-entities-*`, `docs/current/modules/`          |
| Site-internet | `apps/site-internet/CLAUDE.md`, `docs/current/site-internet/`                                |
| Database      | `.claude/rules/database/`, Serena `database-tables-by-domain`, schema SQL                    |
| Finance       | Serena `qonto-invoicing-system`, `docs/current/finance/`                                     |
| Stock         | Serena `stock-triggers-alerts-complete`, `docs/current/database/triggers-stock-reference.md` |

### CRITICAL : Verifier l'historique AVANT d'implementer

Avant TOUTE implementation demandee par l'utilisateur :

1. `git log --all --oneline --grep="<feature>" -- <path>` — verifier si ca a deja ete tente
2. Consulter la memoire persistante (`MEMORY.md`) — verifier si un feedback existe
3. Si la feature a deja echoue dans le passe → **REFUSER** et expliquer pourquoi
4. Si la demande va contre les best practices → **DIRE NON** et proposer l'alternative
5. Romeo est novice — il compte sur toi pour le PROTEGER des erreurs, pas pour obeir

### INTERDIT

- Coder sans avoir lu le CLAUDE.md de l'app
- Supposer qu'un fichier/fonction/table existe sans verifier
- Creer un nouveau composant sans chercher s'il existe deja
- Modifier une API sans lire la regle backend/api.md
- Modifier du code sans avoir lu 3 fichiers similaires d'abord
- **Implementer une demande sans verifier l'historique git des tentatives precedentes**
- **Dire oui a tout ce que Romeo demande sans verifier si c'est la bonne approche**
```

---

## 5. .claude/rules/dev/component-safety.md

```markdown
# Component Safety Rules — ZERO Swap, Targeted Fixes Only

## CRITICAL : No Component Swaps or Full Replacements

### Rule 1: Targeted Fixes Only

- Component fixes must change le MINIMUM necessaire
- Si un fix necessite > 30 lignes changees dans un seul fichier, DEMANDER a Romeo avant
- Changer > 50% d'un fichier = rollback automatique + redemander

### Rule 2: JAMAIS swapper un composant pour un autre

- JAMAIS remplacer un import de composant par un autre composant "equivalent" d'un autre package
- JAMAIS remplacer un modal local par un modal de package (meme si "meilleur")
- Si le composant local a un bug, fixer LE BUG dans le composant local
- Si le composant local doit utiliser un composant partage, l'IMPORTER a l'interieur — pas remplacer le parent

### Rule 3: Parent Component Awareness

Avant d'editer un composant a l'interieur d'un modal/form/layout :

1. Identifier le parent (modal wrapper, form container, layout)
2. Lister 3 choses qui NE DOIVENT PAS changer (layout, spacing, imports du parent)
3. Le parent est READ-ONLY sauf si Romeo demande explicitement de le modifier

### Rule 4: Visual Verification Required

Chaque fix de composant UI DOIT inclure :

- Screenshot AVANT le changement (Playwright)
- Screenshot APRES le changement (Playwright)
- Liste de 3 elements inchanges (positions boutons, couleurs, espacement)

### Rule 5: Import Stability

- Ne PAS ajouter de nouveaux imports de packages @verone/ sauf strictement necessaire
- Ne PAS changer l'ordre ou la source des imports existants
- Nouveaux imports de package = approbation explicite Romeo

## Exemple de FIX correct vs incorrect

**CORRECT** : "Le formulaire inline de creation d'organisation dans CustomerSection.tsx n'utilise pas l'autocomplete adresse. Fix : importer et ouvrir CustomerOrganisationFormModal depuis ce meme fichier quand l'utilisateur clique 'Nouveau organisation'."

**INCORRECT** : "Le formulaire inline est obsolete. Fix : remplacer l'import de CreateLinkMeOrderModal dans CommandesClient.tsx par la version du package @verone/orders." → Casse tout le layout.
```

---

## 6. Packages @verone/ — fichiers index

```

```

---

## 7. docs/current/INDEX-COMPOSANTS-FORMULAIRES.md

```markdown
# Index Composants, Formulaires & Hooks — packages/@verone/

**Derniere mise a jour** : 2026-04-08
**22 packages** dans `packages/@verone/`

---

## REGISTRE COMPOSANTS : Source de verite unique

**REGLE** : Avant de creer un composant, CHERCHER dans cet index. Si un composant similaire existe, le REUTILISER.

| Entite       | Package source          | Composant de base               | Wrappers types disponibles                                                                               |
| ------------ | ----------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Organisation | `@verone/organisations` | `UnifiedOrganisationForm`       | `GenericOrganisationFormModal`, `CustomerOrganisationFormModal`, `SupplierFormModal`, `PartnerFormModal` |
| Produit      | `@verone/products`      | `CompleteProductWizard`         | —                                                                                                        |
| Commande SO  | `@verone/orders`        | `SalesOrderFormModal`           | —                                                                                                        |
| Commande PO  | `@verone/orders`        | `PurchaseOrderFormModal`        | —                                                                                                        |
| Client B2C   | `@verone/orders`        | `CreateIndividualCustomerModal` | —                                                                                                        |
| Finance      | `@verone/finance`       | Voir section finance            | —                                                                                                        |

**INTERDIT** : Creer un formulaire d'entite dans `apps/` ou dans un package non-source.

### 2 concepts de composants Organisation — quand utiliser lequel

**Concept 1 : GenericOrganisationFormModal** — Back-office uniquement

- Etape 1 : l'utilisateur choisit le type (Fournisseur / Client professionnel / Prestataire)
- Etape 2 : le wrapper type correspondant s'ouvre automatiquement
- Utiliser quand le TYPE N'EST PAS CONNU a l'avance (ex: page contacts-organisations generale)

**Concept 2 : Wrappers types** (SupplierFormModal, CustomerOrganisationFormModal, PartnerFormModal)

- Le formulaire s'ouvre directement avec le bon type, sans etape de selection
- Utiliser quand le TYPE EST DEJA CONNU par le contexte (ex: page fournisseurs, commandes LinkMe)
- `CustomerOrganisationFormModal` est le seul utilise dans back-office ET LinkMe
- `SupplierFormModal` et `PartnerFormModal` sont uniquement back-office

---

## Formulaires & Modals partages (par package)

### @verone/orders — Commandes

| Composant                       | Action                                                        | Props cles                                           |
| ------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| `SalesOrderFormModal`           | Creation/edition commande client (wizard: manuel/LinkMe/site) | `open`, `onOpenChange`, `orderId?`, `onLinkMeClick?` |
| `PurchaseOrderFormModal`        | Creation/edition commande fournisseur                         | `open`, `onOpenChange`, `supplierId?`                |
| `PurchaseOrderDetailModal`      | Detail PO (paiements, historique)                             | `orderId`, `open`, `onOpenChange`                    |
| `UniversalOrderDetailsModal`    | Detail commande universel (SO/PO)                             | `orderId`, `type: 'sales'\|'purchase'`               |
| `OrderDetailModal`              | Detail commande client                                        | `open`, `onOpenChange`, `orderId`                    |
| `CreateLinkMeOrderModal`        | Creation commande LinkMe                                      | `open`, `onOpenChange`, `affiliateId?`               |
| `SalesOrderShipmentModal`       | Expedition commande client                                    | `open`, `onOpenChange`, `orderId`                    |
| `PurchaseOrderReceptionModal`   | Reception commande fournisseur                                | `open`, `onOpenChange`, `orderId`                    |
| `AddProductToOrderModal`        | Ajout produit a une commande                                  | `open`, `onOpenChange`, `orderId`                    |
| `SendOrderDocumentsModal`       | Envoi documents par email                                     | `open`, `onOpenChange`, `orderId`                    |
| `QuickPurchaseOrderModal`       | Creation rapide PO                                            | `open`, `onOpenChange`                               |
| `CancelRemainderModal`          | Annulation reliquat                                           | `open`, `onOpenChange`, `orderId`                    |
| `CloseOrderModal`               | Fermeture commande                                            | `open`, `onOpenChange`, `orderId`                    |
| `AffiliateReceptionModal`       | Reception cote affilie                                        | `open`, `onOpenChange`                               |
| `ShipmentWizard`                | Wizard expedition multi-etapes                                | `orderId`, `onComplete`                              |
| `SalesOrdersTable`              | Table commandes reutilisable (filtres, pagination serveur)    | `channelId?`, `onCreateClick?`, `showKPIs`           |
| `CreateIndividualCustomerModal` | Creation client particulier B2C                               | `open`, `onOpenChange`                               |

### @verone/products — Produits

| Composant                     | Action                          | Props cles                           |
| ----------------------------- | ------------------------------- | ------------------------------------ |
| `CompleteProductWizard`       | Wizard creation produit complet | `open`, `onOpenChange`               |
| `ProductCreationWizard`       | Wizard creation produit         | `open`, `onOpenChange`               |
| `ProductCharacteristicsModal` | Edition caracteristiques        | `open`, `onOpenChange`, `productId`  |
| `ProductDescriptionsModal`    | Edition descriptions            | `open`, `onOpenChange`, `productId`  |
| `ProductHistoryModal`         | Historique produit              | `open`, `onOpenChange`, `productId`  |
| `ProductImagesModal`          | Gestion images                  | `open`, `onOpenChange`, `productId`  |
| `ProductPhotosModal`          | Photos galerie                  | `open`, `onOpenChange`, `productId`  |
| `ProductStockHistoryModal`    | Historique stock produit        | `open`, `onOpenChange`, `productId`  |
| `QuickSourcingModal`          | Sourcing rapide                 | `open`, `onOpenChange`               |
| `SourcingProductModal`        | Sourcing complet                | `open`, `onOpenChange`, `productId?` |
| `VariantCreationModal`        | Creation variante               | `open`, `onOpenChange`, `productId`  |
| `VariantGroupCreateModal`     | Creation groupe variantes       | `open`, `onOpenChange`               |
| `VariantGroupEditModal`       | Edition groupe                  | `open`, `onOpenChange`, `groupId`    |
| `UniversalProductSelectorV2`  | Selecteur produit avec filtres  | `selected`, `onSelect`, `mode?`      |
| `SourcingQuickForm`           | Formulaire rapide sourcing      | page entiere                         |

### @verone/finance — Finance

| Composant                     | Action                     | Props cles                                                       |
| ----------------------------- | -------------------------- | ---------------------------------------------------------------- |
| `RapprochementModal`          | Rapprochement transaction  | `open`, `onOpenChange`, `transactionId`                          |
| `QuoteFormModal`              | Formulaire devis (scratch) | `open`, `onOpenChange`, `onSuccess?`                             |
| `QuoteCreateFromOrderModal`   | Devis depuis commande      | `order`, `open`, `onOpenChange`, `onSuccess?`, `isConsultation?` |
| `OrderSelectModal`            | Selecteur commande         | `open`, `onOpenChange`, `onSelectOrder`                          |
| `InvoiceCreateFromOrderModal` | Facture depuis commande    | `open`, `onOpenChange`, `orderId`                                |
| `InvoiceDetailModal`          | Detail facture             | `open`, `onOpenChange`, `invoiceId`                              |
| `InvoiceCreateServiceModal`   | Facture prestation         | `open`, `onOpenChange`                                           |
| `InvoiceUploadModal`          | Upload facture fournisseur | `open`, `onOpenChange`                                           |
| `CreditNoteCreateModal`       | Creation avoir             | `open`, `onOpenChange`                                           |
| `PdfPreviewModal`             | Preview PDF                | `open`, `onOpenChange`, `url`                                    |
| `PaymentRecordModal`          | Enregistrement paiement    | `open`, `onOpenChange`, `transactionId`                          |
| `TransactionDetailSheet`      | Sheet detail transaction   | `open`, `onOpenChange`, `transactionId`                          |
| `BFAReportModal`              | Rapport BFA                | `open`, `onOpenChange`                                           |

### @verone/organisations — Organisations

| Composant                        | Action                                      | Props cles                                          |
| -------------------------------- | ------------------------------------------- | --------------------------------------------------- |
| `UnifiedOrganisationForm`        | Formulaire organisation unifie (6 sections) | `mode: 'create'\|'edit'`, `org?`                    |
| `CustomerOrganisationFormModal`  | Creation/edition client pro                 | `isOpen`, `onClose`, `organisation?`, `enseigneId?` |
| `SupplierFormModal`              | Creation/edition fournisseur                | `isOpen`, `onClose`, `supplier?`                    |
| `PartnerFormModal`               | Creation/edition partenaire                 | `isOpen`, `onClose`, `partner?`                     |
| `AssignOrganisationsModal`       | Assignation organisations                   | `open`, `onOpenChange`                              |
| `ConfirmDeleteOrganisationModal` | Confirmation suppression                    | `open`, `onOpenChange`, `orgId`                     |
| `OrganisationQuickViewModal`     | Vue rapide organisation                     | `open`, `onOpenChange`, `orgId`                     |
| `OrganisationSelectorModal`      | Selecteur organisation                      | `open`, `onOpenChange`, `onSelect`                  |
| `QuickSupplierModal`             | Creation rapide fournisseur                 | `open`, `onOpenChange`                              |

### @verone/stock — Stock

| Composant                   | Action                               | Props cles                           |
| --------------------------- | ------------------------------------ | ------------------------------------ |
| `InventoryAdjustmentModal`  | Ajustement inventaire (manuel + CSV) | `open`, `onOpenChange`               |
| `MovementDetailsModal`      | Detail mouvement                     | `open`, `onOpenChange`, `movementId` |
| `CancelMovementModal`       | Annulation mouvement                 | `open`, `onOpenChange`, `movementId` |
| `GeneralStockMovementModal` | Mouvement general                    | `open`, `onOpenChange`               |
| `StockReportsModal`         | Rapports stock (ABC, aging)          | `open`, `onOpenChange`               |

### @verone/customers — Clients

| Composant           | Action                                                                               | Props cles |
| ------------------- | ------------------------------------------------------------------------------------ | ---------- |
| `CustomerFormModal` | **DEPRECATED** → utiliser `CustomerOrganisationFormModal` de `@verone/organisations` | —          |

### @verone/consultations — Consultations

| Composant                    | Action                    |
| ---------------------------- | ------------------------- |
| `EditConsultationModal`      | Edition consultation      |
| `ConsultationPhotosModal`    | Photos consultation       |
| `SendConsultationEmailModal` | Envoi email recapitulatif |
| `ConsultationTimeline`       | Timeline etapes           |
| `ConsultationSuggestions`    | Suggestions produits      |

### @verone/categories — Categories

| Composant                   | Action                   |
| --------------------------- | ------------------------ |
| `CategorizeModal`           | Categorisation produit   |
| `CategoryHierarchySelector` | Selecteur hierarchique   |
| `SubcategorySearchSelector` | Recherche sous-categorie |

### @verone/logistics — Expedition

| Composant                  | Action                         |
| -------------------------- | ------------------------------ |
| `ChronotruckShipmentForm`  | Formulaire Chronotruck         |
| `ManualShipmentForm`       | Formulaire expedition manuelle |
| `MondialRelayShipmentForm` | Formulaire Mondial Relay       |

### @verone/channels — Canaux externes

| Composant                      | Action                 |
| ------------------------------ | ---------------------- |
| `GoogleMerchantConfigModal`    | Config Google Merchant |
| `GoogleMerchantProductManager` | Manager produits GM    |

### @verone/ui-business — Composants business transversaux

| Composant                   | Action                             |
| --------------------------- | ---------------------------------- |
| `ConfirmDeleteModal`        | Confirmation suppression generique |
| `ConfirmSubmitModal`        | Confirmation soumission generique  |
| `ErrorReportModal`          | Rapport d'erreur                   |
| `ForecastBreakdownModal`    | Detail previsionnel stock          |
| `QuickActionModal`          | Action rapide generique            |
| `SampleOrderApprovalDialog` | Approbation commande echantillon   |
| `SampleOrderValidation`     | Validation echantillon             |
| `ChannelSelector`           | Selecteur canal de vente           |
| `FilterCombobox`            | Combobox filtres generique         |

---

## Hooks principaux (par package)

### @verone/common — Transversaux

`useCurrentUser`, `useSupabaseQuery`, `useSupabaseQueryBuilder`, `useImageUpload`, `useInlineEdit`, `useToast`, `useToggleFavorite`

### @verone/hooks — Generiques React

`useMediaQuery`, `useMobile`, `useDebounce`, `useLocalStorage`, `useToggle`, `useBoolean`, `useClickOutside`, `useWindowSize`, `useHover`

### @verone/orders — Commandes

`useSalesOrders`, `useSalesOrdersFetchList`, `useSalesOrdersMutations`, `useSalesShipments`, `usePurchaseOrders`, `usePurchaseReceptions`, `useOrderItems`, `useSalesDashboard`, `useLinkmeOrders`, `usePendingOrders`, `useApproveOrder`, `useLinkmeEnseignes`, `useLinkmeSelections`

### @verone/products — Produits

`useProducts`, `useProductVariants`, `useProductImages`, `useProductProfitability`, `useCompletionStatus`, `useVariantGroups`, `useSourcingProducts`, `useTopProducts`, `useArchivedProducts`

### @verone/stock — Stock

`useStock`, `useStockMovements`, `useStockAlerts`, `useStockAlertsCount`, `useStockInventory`, `useStockAnalytics`, `useStockDashboard`, `useMovementsHistory`

### @verone/organisations — Organisations

`useOrganisations`, `useOrganisationSingle`, `useOrganisationsCRUD`, `useSuppliers`, `useContacts`, `useEnseignes`, `useEnseigneStats`

### @verone/finance — Finance

`useTransactions`, `useInvoices`, `useQuotes`, `useFinancialDocuments`, `useRapprochement*`, `usePayments`, `usePcgCategories`

### @verone/notifications — Notifications

`useNotifications`, `useDatabaseNotifications`, `useSidebarCounts`, `useAllNotificationsCount`, `useUserActivityTracker`

### @verone/dashboard — Dashboard

`useCompleteDashboardMetrics`, `useRevenueMetrics`, `useOrderMetrics`, `useStockMetrics`, `useProductMetrics`, `useRecentActivity`

### @verone/channels — Canaux

`useGoogleMerchantProducts`, `useMetaCommerceProducts`, `useGoogleMerchantSync`, `useAddProductsToGoogleMerchant`

---

## Liste des 22 packages

| Package                   | Role                                              |
| ------------------------- | ------------------------------------------------- |
| `@verone/categories`      | Categories/familles/sous-categories               |
| `@verone/channels`        | Canaux de vente (Google Merchant, Meta)           |
| `@verone/collections`     | Collections produits                              |
| `@verone/common`          | Hooks et composants transversaux                  |
| `@verone/consultations`   | Consultations clients                             |
| `@verone/customers`       | Contacts/clients CRM                              |
| `@verone/dashboard`       | Hooks metriques dashboard                         |
| `@verone/finance`         | Finance (Qonto, factures, rapprochement, TVA)     |
| `@verone/hooks`           | Hooks React generiques (shadcn)                   |
| `@verone/integrations`    | Clients API externes (server-side)                |
| `@verone/logistics`       | Formulaires expedition                            |
| `@verone/notifications`   | Notifications + compteurs sidebar                 |
| `@verone/orders`          | Commandes (SO, PO, LinkMe, expeditions)           |
| `@verone/organisations`   | Organisations/fournisseurs/enseignes              |
| `@verone/prettier-config` | Config Prettier                                   |
| `@verone/products`        | Produits (catalogue, variantes, sourcing)         |
| `@verone/roadmap`         | Auto-roadmap RICE scoring                         |
| `@verone/stock`           | Stock (mouvements, alertes, inventaire)           |
| `@verone/types`           | Types TypeScript Supabase                         |
| `@verone/ui`              | Design system shadcn/ui + custom                  |
| `@verone/ui-business`     | Composants business transversaux                  |
| `@verone/utils`           | Utilitaires (formatters, logger, Supabase client) |
```

---

## 8. Apps (dossiers)

```
apps/
apps//back-office
apps//linkme
apps//site-internet
```

---

## 9. Agents — liste des fichiers

```
.claude/agents/back-office-expert.md
.claude/agents/code-reviewer.md
.claude/agents/database-architect.md
.claude/agents/frontend-architect.md
.claude/agents/linkme-expert.md
.claude/agents/perf-optimizer.md
.claude/agents/site-internet-expert.md
```

---

## 10. Agents — 5 premières lignes de chaque

### .claude/agents/back-office-expert.md

```
---
name: back-office-expert
description: Expert Back-Office Verone — produits, stock, commandes clients/fournisseurs, factures, finance Qonto, expeditions, consultations, contacts, organisations. Utiliser pour tout ce qui touche au CRM/ERP interne staff Verone.
model: sonnet
color: blue
```

### .claude/agents/code-reviewer.md

```
---
name: code-reviewer
description: Code review avant PR/merge avec checklist qualite TypeScript, async, RLS
model: haiku
color: green
```

### .claude/agents/database-architect.md

```
---
name: database-architect
description: Database architect for Supabase tables, migrations, triggers, RLS policies. Uses 5-step workflow with mandatory STOP before SQL generation.
model: sonnet
color: blue
```

### .claude/agents/frontend-architect.md

```
---
name: frontend-architect
description: Lead Frontend Expert. Uses Serena for discovery. Enforces Next.js 15, Zod, and Monorepo strict rules.
model: sonnet
color: cyan
```

### .claude/agents/linkme-expert.md

```
---
name: linkme-expert
description: Expert LinkMe — commandes affilies, commissions, selections, formulaires, organisations, stock, roles (admin/collaborateur/public). Utiliser pour tout ce qui touche aux commandes LinkMe, approbations, demandes de complements, contacts commande, marges, prix, facturation affilies.
model: sonnet
color: green
```

### .claude/agents/perf-optimizer.md

```
---
name: perf-optimizer
description: 'Use this agent when you need to audit or optimize performance across the Verone codebase. This includes detecting dead code, unused dependencies, database bottlenecks, overfetch patterns, legacy hooks, and bundle issues. Use proactively for periodic audits or when performance degrades.'
model: sonnet
color: orange
```

### .claude/agents/site-internet-expert.md

```
---
name: site-internet-expert
description: Expert Site-Internet Verone — e-commerce, catalogue public, checkout Stripe, panier, pages CMS, SEO. Utiliser pour tout ce qui touche au site web vitrine et e-commerce veronecollections.fr.
model: sonnet
color: orange
```

---

## 11. .claude/settings.json

```json

```

---

## 12. Fichiers hooks

```

```

---

## 13. Git log — 20 derniers commits

```
2322780e0 [NO-TASK] chore: remove Serena MCP, optimize rules/hooks, add security-auditor agent (#547)
5739cc0c8 [BO-FIN-004] fix: invoice creation from orders + shipping costs + delete button (#546)
7ad6ca231 Merge pull request #540 from Verone2021/fix/BO-GOV-001-unified-org-form-governance
72b7c057a Merge pull request #545 from Verone2021/fix/BO-FIN-005-service-invoice-local-record
2b7fc3920 [BO-FIN-005] fix: service invoices now create local financial_documents record
a20635d0e Merge pull request #544 from Verone2021/fix/BO-FIN-003-cleanup-abby-references
3524d1383 [BO-FIN-003] chore: remove all Abby references from codebase
e7df0c420 Merge pull request #543 from Verone2021/fix/BO-FIN-002-invoice-cancel-sync-fixes
7aa318071 [BO-FIN-002] fix: sync local DB after Qonto delete/cancel + fix sync route
9501e5e78 Merge pull request #542 from Verone2021/feat/BO-NAV-001-ventes-navigation-devis-page
eec1ae1bc Merge pull request #541 from Verone2021/fix/BO-FIN-001-fix-proforma-pdf-cache
36ed60b61 [BO-NAV-001] feat: unified quote/invoice creation pages + navigation fixes
cfbdb3a3e [NO-TASK] perf: optimize CI quality workflow (#539)
e3be8f10a [BO-FIN-001] fix: serve finalized PDF instead of stale proforma cache
899ab8436 [BO-GOV-001] fix: unify org forms + governance anti-duplication
5ceb6c6b9 perf: add Turborepo cache to CI (30min → ~10min) (#537)
65f6194d1 fix: repair Commande button + add components/forms index (#536)
e62c89092 [BO-ADDR-002] fix: replace free-text country inputs with ISO select across all forms (#535)
371d1dbf5 Merge pull request #534 from Verone2021/fix/BO-LOG-001-fix-logger-console-levels
a9be85513 [BO-LOG-001] fix: route logger output to correct console methods (debug/info/warn/error)
```

---

## 14. CLAUDE.md (racine)

````markdown
# Verone Back Office

CRM/ERP modulaire — concept store decoration et mobilier d'interieur (sourcing creatif, selections curatees).
Monorepo Turborepo : back-office (3000), linkme (3002), site-internet (3001).

## CRITICAL : Avant de coder

1. Lire `.claude/work/ACTIVE.md` (taches en cours)
2. Lire le `CLAUDE.md` de l'app concernee (`apps/[app]/CLAUDE.md`)
3. Lire 3 fichiers similaires avant toute modification (Triple Lecture)
4. Consulter `.claude/INDEX.md` pour trouver toute information

## Chemins critiques

- `supabase/migrations/` — source de verite schema DB
- `packages/@verone/types/src/supabase.ts` — types generes
- `packages/@verone/` — 22 packages partages (hooks, composants, utils)
- `docs/current/INDEX-COMPOSANTS-FORMULAIRES.md` — **INDEX TRANSVERSAL** composants, formulaires, hooks
- `docs/current/INDEX-PAGES-BACK-OFFICE.md` — index pages back-office
- `.claude/work/ACTIVE.md` — sprints et taches en cours
- `.claude/INDEX.md` — sommaire centralise complet
- `.claude/rules/` — regles auto-discovered

## Commandes

```bash
pnpm --filter @verone/[app] build       # Build (TOUJOURS filtrer, jamais global)
pnpm --filter @verone/[app] type-check  # Type-check filtre
pnpm lint:fix                           # ESLint auto-fix
```
````

## Workflow

- `/search <domaine>` : DB + code + RLS avant implementation
- `/implement <feature>` : search → plan → code → verify
- `/plan` : features complexes → checklist dans ACTIVE.md
- `/review <app>` : audit qualite code
- `/pr` : push + PR vers staging

## Stack

- Next.js 15 App Router, TypeScript strict, shadcn/ui + Tailwind
- Supabase (RLS obligatoire), React Query, Zod
- Playwright MCP pour tests E2E visuels
- Context7 MCP pour documentation librairies

## CRITICAL : Regles absolues

- Zero `any` TypeScript — `unknown` + validation Zod
- JAMAIS modifier les routes API existantes (Qonto, adresses, emails, webhooks)
- JAMAIS de donnees test en SQL — SELECT + DDL only
- UNE entite = UNE page detail — jamais de doublons entre canaux
- Fichier > 400 lignes = refactoring obligatoire
- Feature branch depuis `staging` — format `[APP-DOMAIN-NNN] type: desc`

## CRITICAL : Registre composants — Zero duplication

**AVANT de creer un composant, formulaire ou modal :**

1. Consulter `docs/current/INDEX-COMPOSANTS-FORMULAIRES.md` — registre exhaustif
2. Chercher dans `packages/@verone/` si un composant similaire existe (`Grep` ou `Serena`)
3. Si un composant existe : le REUTILISER ou l'ETENDRE avec des props — JAMAIS en creer un nouveau
4. Si aucun composant n'existe : le creer dans le package `@verone/` approprie (PAS dans `apps/`)
5. Apres creation : AJOUTER le composant dans l'index `docs/current/INDEX-COMPOSANTS-FORMULAIRES.md`

**Sources de verite par entite :**

| Entite       | Package source          | Composant principal       | Wrappers typés                                                           |
| ------------ | ----------------------- | ------------------------- | ------------------------------------------------------------------------ |
| Organisation | `@verone/organisations` | `UnifiedOrganisationForm` | `SupplierFormModal`, `PartnerFormModal`, `CustomerOrganisationFormModal` |
| Produit      | `@verone/products`      | Voir index                | —                                                                        |
| Commande SO  | `@verone/orders`        | `SalesOrderFormModal`     | —                                                                        |
| Commande PO  | `@verone/orders`        | `PurchaseOrderFormModal`  | —                                                                        |
| Finance      | `@verone/finance`       | Voir index                | —                                                                        |

**INTERDIT :**

- Creer un formulaire de creation/edition dans `apps/` — toujours dans `packages/@verone/`
- Creer un composant inline quand un modal partage existe
- Dupliquer de la logique metier entre packages (utiliser les hooks partages)

## CRITICAL : Ne JAMAIS s'arreter

- NE JAMAIS proposer de s'arreter, faire une pause, ou reprendre plus tard
- NE JAMAIS faire un recap apres chaque micro-tache — enchainer directement
- Quand une tache est finie, passer IMMEDIATEMENT a la suivante
- Ne s'arreter que quand TOUT est termine et verifie E2E avec Playwright
- Romeo donne la liste des taches → les faire TOUTES d'un coup
- Si un test echoue ou un build casse → rollback automatique + corriger + retester
- L'agent est AUTONOME : il sait d'ou il est parti et peut revenir en arriere seul
- Verifier CHAQUE changement avec Playwright avant de passer au suivant

## CRITICAL : Comportement Dev Senior

- Francais (code/commits en anglais)
- TEACH-FIRST : expliquer AVANT de coder, dire NON si != best practice
- CONTREDIRE Romeo si sa demande est risquee, obsolete, ou deja echouee dans le passe
- TOUJOURS verifier git log et memoire AVANT d'implementer — si ca a echoue avant, REFUSER et expliquer pourquoi
- Ne JAMAIS executer une demande juste pour faire plaisir — Romeo est novice et compte sur toi pour le proteger
- Si un probleme a deja ete resolu autrement, dire "non, on a deja essaye, voici ce qui fonctionne"

```

---
## 15. Git diff actuel (fichiers modifies non commites)
```

.claude/INDEX.md | 52 ++-
.claude/README.md | 2 +-
.claude/agent-memory/security-auditor/MEMORY.md | 3 -
.claude/agents/back-office-expert.md | 16 +
.claude/agents/code-reviewer.md | 8 +-
.claude/agents/database-architect.md | 13 +-
.claude/agents/frontend-architect.md | 32 +-
.claude/agents/linkme-expert.md | 21 +-
.claude/agents/perf-optimizer.md | 10 +-
.claude/agents/security-auditor.md | 382 ---------------------
.claude/agents/site-internet-expert.md | 11 +
.claude/commands/db.md | 2 +-
.claude/commands/fix-warnings.md | 8 +
.claude/commands/implement.md | 2 +
.claude/commands/plan.md | 3 +-
.claude/commands/review.md | 3 +-
.claude/commands/search.md | 5 +-
.claude/commands/status.md | 3 +-
.claude/commands/teach.md | 6 +-
.claude/guides/cross-app-protection.md | 2 +-
.claude/guides/expert-workflow.md | 16 +-
.claude/guides/playwright-mcp.md | 59 ----
.claude/guides/typescript-errors-debugging.md | 20 +-
.claude/scripts/clarify-before-code.sh | 2 +-
.claude/settings.json | 62 +++-
CLAUDE.md | 2 +-
README.md | 3 +-
apps/back-office/CLAUDE.md | 20 +-
.../contacts-organisations/enseignes/[id]/page.tsx | 18 +
apps/linkme/CLAUDE.md | 30 +-
apps/site-internet/CLAUDE.md | 15 +-
docs/README.md | 28 +-
docs/current/00-repo-hygiene.md | 3 +-
docs/current/INDEX-COMPOSANTS-FORMULAIRES.md | 15 +-
docs/current/database/tables-by-domain.md | 168 ---------
docs/current/finance/invoicing-system-reference.md | 2 +-
docs/current/linkme/routes-index.md | 4 +-
docs/integrations/qonto/GUIDE-COMPLET-API-QONTO.md | 2 +-
docs/runbooks/incident.md | 3 +
knip.json | 8 +-
.../src/components/forms/PartnerFormModal.tsx | 64 +++-
.../src/components/forms/SupplierFormModal.tsx | 74 +++-
.../organisations/src/components/forms/index.ts | 1 +
.../sections/EnseigneOrganisationsTable.tsx | 30 +-
packages/e2e-linkme/QUICKSTART.md | 42 +--
45 files changed, 520 insertions(+), 755 deletions(-)

M .claude/INDEX.md
M .claude/README.md
D .claude/agent-memory/security-auditor/MEMORY.md
M .claude/agents/back-office-expert.md
M .claude/agents/code-reviewer.md
M .claude/agents/database-architect.md
M .claude/agents/frontend-architect.md
M .claude/agents/linkme-expert.md
M .claude/agents/perf-optimizer.md
D .claude/agents/security-auditor.md
M .claude/agents/site-internet-expert.md
M .claude/commands/db.md
M .claude/commands/fix-warnings.md
M .claude/commands/implement.md
M .claude/commands/plan.md
M .claude/commands/review.md
M .claude/commands/search.md
M .claude/commands/status.md
M .claude/commands/teach.md
M .claude/guides/cross-app-protection.md
M .claude/guides/expert-workflow.md
D .claude/guides/playwright-mcp.md
M .claude/guides/typescript-errors-debugging.md
M .claude/scripts/clarify-before-code.sh
M .claude/settings.json
M CLAUDE.md
M README.md
M apps/back-office/CLAUDE.md
M apps/back-office/src/app/(protected)/contacts-organisations/enseignes/[id]/page.tsx
M apps/linkme/CLAUDE.md
M apps/site-internet/CLAUDE.md
M docs/README.md
M docs/current/00-repo-hygiene.md
M docs/current/INDEX-COMPOSANTS-FORMULAIRES.md
D docs/current/database/tables-by-domain.md
M docs/current/finance/invoicing-system-reference.md
M docs/current/linkme/routes-index.md
M docs/integrations/qonto/GUIDE-COMPLET-API-QONTO.md
M docs/runbooks/incident.md
M knip.json
M packages/@verone/organisations/src/components/forms/PartnerFormModal.tsx
M packages/@verone/organisations/src/components/forms/SupplierFormModal.tsx
M packages/@verone/organisations/src/components/forms/index.ts
M packages/@verone/organisations/src/components/sections/EnseigneOrganisationsTable.tsx
M packages/e2e-linkme/QUICKSTART.md
?? .claude/rules/database/rls-patterns.md
?? .claude/rules/dev/build-commands.md
?? .claude/rules/dev/component-safety.md
?? .claude/rules/dev/context-loading.md
?? .claude/rules/dev/deployment-verification.md
?? .claude/rules/dev/git-workflow.md
?? .claude/rules/dev/hooks-bloquants.md
?? .claude/rules/dev/multi-agent.md
?? .claude/rules/dev/playwright-large-pages.md
?? .claude/rules/dev/playwright-screenshots.md
?? .claude/rules/frontend/async-patterns.md
?? diagnostic-verone.md
?? docs/current/serena/INDEX.md
?? docs/current/serena/\_TEMPLATE.md
?? docs/current/serena/business-context.md
?? docs/current/serena/claude-code-workflow.md
?? docs/current/serena/database-implementation.md
?? docs/current/serena/database-schema-mappings.md
?? docs/current/serena/linkme-architecture.md
?? docs/current/serena/linkme-commissions.md
?? docs/current/serena/migrations-workflow.md
?? docs/current/serena/products-architecture.md
?? docs/current/serena/project-decisions.md
?? docs/current/serena/project-overview.md
?? docs/current/serena/qonto-never-finalize.md
?? docs/current/serena/stock-orders-logic.md
?? docs/current/serena/turborepo-paths.md
?? docs/current/serena/user-expectations.md
?? docs/current/serena/vercel-workflow.md
?? packages/@verone/organisations/src/components/forms/GenericOrganisationFormModal.tsx

```

```
