# AXE 4 — DETTE TECHNIQUE CODE

**Date** : 17 avril 2026
**Objectif** : Identifier la dette technique code a traiter.
**Source** : synthese audit 16/04 + observations directes 17/04 + ACTIVE.md.
**Sortie attendue apres validation** : tickets priorises `[APP-DOMAIN-NNN]`.

---

## 1. DETTE CRITIQUE — bloque des refactorings futurs

### 1.1 Doublons imbriques anormaux dans `packages/@verone/types/`

Structure observee (filesystem 17/04) :

```
packages/@verone/types/
├── src/
│   └── supabase.ts (15 262 lignes — genere, attendu)
├── apps/          ← ANORMAL
│   └── back-office/src/types/supabase.ts (10 435 lignes)
├── packages/      ← ANORMAL
│   └── @verone/types/src/supabase.ts (10 435 lignes)
├── dist/
├── README.md
├── package.json
└── tsconfig.json
```

**Diagnostic probable** : ancien artefact de generation Supabase qui aurait duplique la structure dans le package lui-meme. Les 2 sous-dossiers `apps/` et `packages/` imbriques ne devraient pas exister.

**Risques si non nettoye** :

- Les imports `@verone/types` peuvent resoudre de facon ambigue
- Le type checker parcourt ~30 000 lignes de types en plus
- Occupe de l'espace disque
- Desoriente les agents IA qui voient des chemins bizarres

**Action recommandee** :

1. Verifier qu'aucun import ne reference ces sous-dossiers (grep)
2. `rm -rf packages/@verone/types/apps packages/@verone/types/packages`
3. `pnpm install` + `pnpm type-check` pour verifier

Meme probleme potentiel dans `packages/@verone/ui/packages/` (vu en listing 17/04). A inspecter.

**Ticket propose** : `[BO-TECH-002] refactor: nettoyer doublons imbriques @verone/types et @verone/ui`
Effort : 1h (verification + suppression + re-install).

### 1.2 `apps/back-office/src/types/supabase.d.ts` (15 230 lignes)

Duplication du meme contenu que `packages/@verone/types/src/supabase.ts`. D'apres `PROTECTED_FILES.json`, les types Supabase sont auto-generes vers **un seul** endroit : `packages/@verone/types/src/supabase.ts`.

**Question** : pourquoi `apps/back-office/src/types/supabase.d.ts` existe-t-il ?

- Soit c'est un artefact oublie d'une ancienne generation
- Soit une app l'importe directement (dans ce cas, a migrer vers `@verone/types`)

**Action recommandee** : grep pour verifier les imports, puis supprimer si inutilise.

**Ticket propose** : `[BO-TECH-003] refactor: supprimer apps/back-office/src/types/supabase.d.ts dupliquee`

### 1.3 `apps/back-office/src/app/api/qonto/invoices/route.ts` (882-889 lignes)

**Deja identifie comme ticket** `[BO-TECH-001]` dans ACTIVE.md. Depasse le seuil projet (400 lignes). Prerequis pour `BO-FIN-009` (alignement arrondi DB/Qonto).

Decoupage propose dans ACTIVE.md : formatters / validators / handlers.

Effort : 3-4h.

---

## 2. DETTE GRAVE — impact lisibilite/maintenabilite

### 2.1 Fichiers >500 lignes (hors auto-generes)

Extrait audit 16/04 (Section 9.1). Tous a reviser sauf les auto-generes (supabase.ts).

| Lignes | Fichier                                                                                                | Statut                                                  |
| ------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| 1 654  | `packages/@verone/integrations/src/qonto/client.ts`                                                    | A decouper par endpoint                                 |
| 1 036  | `packages/@verone/consultations/src/hooks/use-consultations.ts`                                        | A decouper par operation                                |
| 882    | `apps/back-office/src/app/api/qonto/invoices/route.ts`                                                 | **Ticket BO-TECH-001 ouvert**                           |
| 767    | `packages/@verone/consultations/src/components/interfaces/ConsultationOrderInterface.tsx`              | A decouper                                              |
| 703    | `apps/site-internet/src/app/checkout/page.tsx`                                                         | Sprint SI-CHECKOUT-REFACTOR a creer                     |
| 697    | `packages/@verone/integrations/src/qonto/types.ts`                                                     | Probablement acceptable (types)                         |
| 676    | `chrome-extension/popup.js`                                                                            | Hors flux principal — reporter                          |
| 634    | `packages/@verone/types/src/collections.ts`                                                            | Types manuels — a revisiter                             |
| 610    | `packages/@verone/channels/src/components/google-merchant/GoogleMerchantProductManager.tsx`            | A decouper                                              |
| 603    | `packages/@verone/stock/src/hooks/use-stock.ts`                                                        | A decouper par domaine (mvt, alertes, reservation)      |
| 601    | `apps/linkme/src/lib/hooks/use-linkme-catalog.ts`                                                      | A decouper                                              |
| 593    | `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal/use-create-order.ts`                 | A decouper                                              |
| 584    | `apps/linkme/src/app/(main)/profil/page.tsx`                                                           | Decoupage en sous-sections                              |
| 577    | `apps/linkme/src/components/organisations/organisation-detail/InfosTab.tsx`                            | Decoupage                                               |
| 573    | `packages/@verone/finance/src/components/InvoiceCreateServiceModal.tsx`                                | Audit BO-FIN-001 recent — stabilise avant de refactorer |
| 569    | `packages/@verone/stock/src/components/modals/StockMovementModal.tsx`                                  | Wizard a decouper                                       |
| 553    | `packages/@verone/orders/src/components/modals/CreateLinkMeOrderModal/use-create-linkme-order-form.ts` | Decoupage                                               |
| 551    | `apps/linkme/src/components/layout/AppSidebar.tsx`                                                     | Acceptable si sidebar complete                          |
| 534    | `packages/@verone/stock/src/hooks/use-stock-reservations.ts`                                           | Decoupage                                               |
| 530    | `apps/linkme/src/app/(main)/ma-selection/page.tsx`                                                     | Decoupage                                               |
| 526    | `apps/linkme/src/components/orders/RestaurantSelectorModal.tsx`                                        | Decoupage                                               |
| 526    | `apps/back-office/src/app/api/sourcing/import/route.ts`                                                | Decoupage par etape import                              |
| 524    | `packages/@verone/stock/src/components/modals/GeneralStockMovementModal.tsx`                           | Decoupage                                               |
| 524    | `apps/linkme/src/app/(main)/notifications/page.tsx`                                                    | Decoupage                                               |
| 523    | `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/details/hooks.ts`             | Decoupage                                               |

**Total estime** : ~25 fichiers a refactorer (hors auto-generes).

**Strategie proposee** : creer un sprint `[XX-MAXLINES-YYY]` par app. L'audit 16/04 evoque un fichier `AUDIT-MAX-LINES-2026-04-14.md` (216 lignes) dans `docs/current/`. A lire avant d'ouvrir de nouveaux tickets.

### 2.2 TODO / FIXME non traites (99 occurrences)

Audit 16/04 dresse la liste :

- TODO : 68
- FIXME : 15
- XXX : 16

**Strategie proposee** :

1. Categoriser (perf / fonctionnalite / TODO-dead-code)
2. Transformer les FIXME en tickets `[APP-DOMAIN-NNN]`
3. Supprimer les TODO obsoletes (code effectivement non pertinent)

**Action immediate** : creer `docs/scratchpad/inventaire-todo-2026-04-XX.md` apres grep systematique.

### 2.3 Warnings DB stock — 3 restants (W1, W2, W5)

**Deja identifies** dans ACTIVE.md. Necessitent migration. Reportes le temps que Romeo soit reveille pour valider.

Details :

- **W1** : `trigger_so_insert_validated_forecast` ne voit pas les `sales_order_items` inseres apres le `sales_orders`
- **W2** : `update_forecasted_out_on_so_validation` utilise `search_path = public, pg_temp` non standard
- **W5** : `reset_stock_alerts_on_po_cancel` reset trop large (devrait filter par `draft_order_id`)

**Ticket existant** : voir `docs/scratchpad/review-report-retroactive-2026-04-17.md`.

---

## 3. DETTE MOYENNE — a surveiller

### 3.1 18 stash Git non resolus

Audit 16/04 liste 18 entrees dans `git stash`, dont :

- Refactoring MAXLINES (plusieurs)
- PR #578, #527 (contenus en stash)
- Finance M1-M6 complete
- Dashboard KPI
- Circular dependencies fixes

**Risque** : du travail est potentiellement bloque en stash. Sans RAM mentale, l'auteur (Romeo) ne se souviendra probablement pas de ce que chacune contient.

**Action recommandee** :

1. `git stash list` + inspection de chaque stash
2. Pour chaque : recuperer (si travail valide) OU supprimer (si obsolete)
3. Limite cible : 0-2 stash max

**Ticket propose** : `[NO-TASK] chore: audit et nettoyage git stash`. Effort : 2h.

### 3.2 Branches feature locales non mergees (7 branches locales, 8 remotes)

Audit 16/04 liste :

- `feat/BO-LM-001-inline-editing-linkme-orders`
- `feat/BO-PAY-001-cleanup-manual-payment-columns`
- `feat/SI-AUTH-001-google-identity-services`
- `feat/BO-TEST-001-e2e-infrastructure-audit-fixes` (remote)
- `fix/BO-LM-001-fix-create-order-reset-loop`
- `refonte/verone-v2-claude-config`

Plusieurs ont probablement ete mergees (PRs closes dans historique). Besoin de menage.

**Action recommandee** : `git branch --merged staging` + suppression des branches mergees.

### 3.3 Chrome extension non alignee

`popup.js` : 676 lignes, `content-script.js` : 592 lignes, non documentes (voir Axe 3). Si elle est en production :

- Pas de TypeScript
- Pas de tests
- Pas de build automatise vraisemblablement

**Question a Romeo** : faut-il la garder, la migrer en TS, la sortir dans un repo dedie ?

### 3.4 Tests E2E non executes en CI

Playwright installe, tests existent dans `apps/*/e2e/`, mais `quality.yml` ne les lance pas. Les tests ne sont lances qu'en local.

**Consequence** : chaque PR repose sur le bon vouloir du dev qui lance ou pas les tests. La CI ne protege pas.

**Action recommandee** : ajouter un job `e2e-smoke` dans `quality.yml` qui lance le sous-ensemble critique :

- `apps/linkme/e2e/smoke.spec.ts` (deja existe)
- Tests critiques back-office (a identifier)

**Ticket propose** : `[BO-CI-001] feat: integrer e2e smoke tests a quality.yml`

### 3.5 Pas de workflow pour les migrations SQL

`PROTECTED_FILES.json` protege `supabase/migrations/*.sql` mais aucun workflow ne :

- Lint des migrations
- Teste une migration contre une DB shadow
- Verifie qu'il n'y a pas de `DROP TABLE` accidentel

**Action recommandee** : long-terme, ajouter un workflow `migrations-validate.yml`.

---

## 4. DETTE BASSE — propre mais ameliorer

### 4.1 Dependances potentiellement desalignees

Observations du 17/04 (lecture des package.json apps + racine) :

- `lucide-react` : 0.344.0 (site-internet), 0.400.0 (linkme), 0.309.0 (racine) → 3 versions differentes
- `@tanstack/react-query` : 5.20.1 (racine), 5.72.2 (linkme), 5.90.7 (site-internet) → 3 versions
- `@supabase/supabase-js` : 2.57.4 (apps), 2.49.0 (racine)

**Risque** : duplications dans le bundle, comportements differents selon les apps.

**Action recommandee** : aligner sur une version unique par dependance, au niveau du workspace root.

### 4.2 Scripts de monitoring inutilises ?

`package.json` contient `monitor:start`, `monitor:stop`, `monitor:logs` qui lancent `scripts/monitor-health.sh`. Non documente, utilise par qui ?

**Action recommandee** : soit documenter dans un runbook, soit supprimer.

### 4.3 Workflow `scratchpad-cleanup.yml` non audite

Existe mais non inspecte. S'il supprime les fichiers > 30 jours, par exemple, il efface des dev-plans archivables.

**Action recommandee** : lire `scratchpad-cleanup.yml`, s'assurer de sa strategie, documenter.

### 4.4 Reports/ racine + `baseline-2026-01-23.json`

Janvier 2026 : vieux de 3 mois. A deplacer vers `docs/archive/`.

### 4.5 `DISABLED_COMPONENTS.md` dans `packages/@verone/ui/`

Existe mais non reference ailleurs. Qu'est-ce qui est desactive ? Pourquoi ? Temporaire ou definitif ?

**Action recommandee** : ajouter un lien depuis `docs/current/INDEX-COMPOSANTS-FORMULAIRES.md` + clarifier le statut.

---

## 5. RESUME : TICKETS PROPOSES

### Priorite 1 — a ouvrir tout de suite

| ID              | Sujet                                                          | Effort | Statut                    |
| --------------- | -------------------------------------------------------------- | ------ | ------------------------- |
| `[BO-TECH-001]` | Refactor `qonto/invoices/route.ts` (889 lignes)                | 3-4h   | **DEJA OUVERT** ACTIVE.md |
| `[BO-TECH-002]` | Nettoyer doublons imbriques `@verone/types` et `@verone/ui`    | 1h     | A ouvrir                  |
| `[BO-TECH-003]` | Supprimer `apps/back-office/src/types/supabase.d.ts` dupliquee | 0.5h   | A ouvrir                  |
| `[BO-CI-001]`   | Integrer e2e smoke tests a `quality.yml`                       | 2-3h   | A ouvrir                  |
| `[BO-STOCK-W1]` | Corriger W1 : trigger SO insert forecast                       | 1h     | **EN ATTENTE** Romeo      |
| `[BO-STOCK-W2]` | Corriger W2 : search_path trigger forecasted_out               | 0.5h   | **EN ATTENTE** Romeo      |
| `[BO-STOCK-W5]` | Corriger W5 : reset alertes PO cancel filtre                   | 0.5h   | **EN ATTENTE** Romeo      |

### Priorite 2 — sprint refactoring lignes

| ID                | Sujet                                                              | Effort       |
| ----------------- | ------------------------------------------------------------------ | ------------ |
| `[BO-MAXLINES-*]` | Sprint refactor fichiers > 400 lignes back-office                  | 2-3 sessions |
| `[LM-MAXLINES-*]` | Sprint refactor fichiers > 400 lignes linkme                       | 2 sessions   |
| `[SI-MAXLINES-*]` | Sprint refactor fichiers > 400 lignes site-internet (checkout 703) | 2 sessions   |

### Priorite 3 — hygiene

| ID              | Sujet                                                         | Effort |
| --------------- | ------------------------------------------------------------- | ------ |
| `[NO-TASK]`     | Audit et nettoyage git stash (18 entrees)                     | 2h     |
| `[NO-TASK]`     | Supprimer branches feature mergees                            | 0.5h   |
| `[NO-TASK]`     | Aligner versions `lucide-react`, `react-query`, `supabase-js` | 2h     |
| `[BO-DEPS-001]` | Inventaire TODO/FIXME/XXX (99 occurrences) + triage           | 3h     |

### Priorite 4 — futur

| ID                | Sujet                                                    |
| ----------------- | -------------------------------------------------------- |
| `[INFRA-MIG-001]` | Workflow validation migrations SQL                       |
| `[INFRA-CI-002]`  | Workflow securite (scan deps)                            |
| `[INFRA-CI-003]`  | Workflow check console errors (script local existe deja) |

---

## 6. POINT DE VIGILANCE

L'audit 16/04 avait 15 questions ouvertes. Parmi elles, deux concernent directement la dette technique :

- **Q14** : Chrome extension — a quoi sert-elle ? → **toujours ouverte**
- **Q4** : Doublons types Supabase — est-ce un artefact ? → **confirme ci-dessus (1.1), nettoyage a faire**

Les autres questions (deploiement, utilisateurs, stripe, revolut...) relevent plutot de l'etat business du projet — a couvrir en Axe 5.

---

**FIN DU RAPPORT — AXE 4**

Suite : `docs/scratchpad/plan-action-post-audit-2026-04-17.md`
