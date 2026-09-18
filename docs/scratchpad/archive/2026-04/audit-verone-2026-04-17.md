# AUDIT VERONE — MISE A JOUR 2026-04-17

**Date** : 17 avril 2026
**Auteur** : Claude (session coordinateur)
**Branche auditee** : staging (supposee)
**Base** : `docs/scratchpad/audit-verone-2026-04-16.md` + collecte directe filesystem
**Objectif** : Rafraichir l'audit du 16 avril (periye de 48h) et combler ses trous.

---

## 1. CE QUI A CHANGE DEPUIS LE 16 AVRIL

### 1.1 `docs/scratchpad/` est passe de 1 a 25 fichiers

L'audit du 16 avril indiquait "un seul fichier : README.md, 1 125 octets" (Section 9.5). C'est faux aujourd'hui. Contenu actuel :

| Type               | Fichiers | Exemples                                                        |
| ------------------ | -------- | --------------------------------------------------------------- |
| Audits             | 5        | `audit-exhaustif-stock-triggers-2026-04-17.md`, regressions...  |
| Plans de dev       | 6        | `dev-plan-2026-04-18-BO-FIN-010.md`, BO-STOCK-008, BO-UI-001... |
| Rapports de dev    | 3        | `dev-report-2026-04-18-BO-STOCK-008.md`, etc.                   |
| Rapports de review | 2        | `review-report-BO-SHIP-003-2026-04-17.md`, retroactive          |
| Diagnostics bugs   | 4        | `bug-expedition-modal-2026-04-16.md`, etc.                      |
| Session nocturne   | 1        | `session-nocturne-2026-04-18.md`                                |
| Protocoles / plans | 2        | `plan-tests-regression-2026-04-16.md`, smoke-tests-stock        |
| Cleanup / divers   | 2        | `cleanup-report-2026-04-16.md`, Stitch redesign                 |

Signal : le workflow dev-plan -> dev-report -> review-report est **reellement utilise**. Ce n'est pas du theatre. En revanche il n'y a **aucune regle de purge** : les fichiers s'accumulent.

### 1.2 Sessions merges tres denses

`/.claude/work/ACTIVE.md` documente pour le 17 avril seulement :

- **11 PRs mergees** (session stock-triggers + UX expeditions)
- **10 anomalies A1-A10 traitees**

Session nocturne 2026-04-18 : 4 PRs livrees supplementaires (BO-STOCK-008, 009, BO-FIN-010, 011).

Consequence pour l'audit : les sections 8 (git) et 9 (signaux d'alerte) du 16 avril sont obsoletes — au moins 15 PRs mergees entre les deux dates.

### 1.3 Dette technique nouvellement documentee

`ACTIVE.md` liste 3 warnings trigger DB residuels (W1, W2, W5) a traiter avec Romeo reveille (source : `review-report-retroactive-2026-04-17.md`).

---

## 2. TROUS DE L'AUDIT DU 16 AVRIL — DESORMAIS COMBLES

### 2.1 Sous-dossiers de `docs/` non analyses

`docs/` racine contient **16 sous-dossiers**. L'audit precedent s'etait concentre sur `current/`. Inventaire complet :

| Dossier                 | Contenu reel                                               | Statut                           |
| ----------------------- | ---------------------------------------------------------- | -------------------------------- |
| `current/`              | 28+ fichiers + 10 sous-dossiers (source principale)        | Actif, fourni                    |
| `archive/`              | 3 sous-dossiers (perf, finance, plans)                     | Archive OK                       |
| `architecture/`         | 2 fichiers (COMPOSANTS-CATALOGUE, notifications)           | Actif minimal                    |
| `business-rules/`       | 3 sous-dossiers (**pas 93** comme annonce le README)       | Actif mais faux                  |
| `governance/`           | 1 fichier (GITHUB-RULESETS.md)                             | Actif minimal                    |
| `integrations/`         | 2 fichiers + sous-dossier qonto/                           | Actif partiel                    |
| `linkme/`               | 1 fichier (margin-calculation.md)                          | Quasi vide                       |
| `logs/`                 | 3 fichiers (2026-04-16, 17, 18)                            | Journal quotidien, non documente |
| `marketing/`            | `.gitkeep` seul                                            | **Dossier vide**                 |
| `metrics/`              | 1 fichier (database-triggers.md)                           | Actif minimal                    |
| `runbooks/`             | 1 fichier (incident.md)                                    | Actif minimal                    |
| `scratchpad/`           | 25 fichiers (voir 1.1)                                     | Tres actif                       |
| `templates/`            | 2 fichiers (product-import)                                | Actif minimal                    |
| `workflows/`            | 1 fichier (typescript-types-generation.md)                 | Actif minimal                    |
| `assets/`               | 8 fichiers (logos, chartes, PDF externes)                  | Actif                            |
| `refonte-inventaire.md` | Fichier orphelin racine (inventaire `.claude/` refonte V2) | Orphelin                         |

Probleme structurel : la **frontiere entre `docs/current/` et les autres dossiers `docs/`** n'est jamais explicitee. Un agent IA ne sait pas si `docs/architecture/COMPOSANTS-CATALOGUE.md` est canonique ou legacy (il est canonique et reference par `apps/back-office/CLAUDE.md`).

### 2.2 Fichier `PROTECTED_FILES.json` (jamais audite)

Present a la racine, v3.0.0 du 2026-03-27. Definit 4 categories (`protected`, `requiresReview`, `criticalFiles`, `autoGenerated`).

Points forts :

- Protection explicite des migrations Supabase, `.env.*`, CLAUDE.md
- Patterns glob clairs
- Mecanismes d'enforcement listes (CODEOWNERS, Branch Protection, Actions, hooks `.claude/settings.json`)

Points faibles :

- Reference `packages/@verone/kpi/**` — **ce package n'existe pas** (regle morte)
- Reference `.github/CODEOWNERS` — a verifier si le fichier existe
- Reference `apps/back-office/src/hooks/use-customers.ts` — a verifier

### 2.3 Dossier `tools/` et doublon avec `scripts/`

Deux dossiers de scripts coexistent :

- `scripts/` (14 fichiers, racine) : dev-clean.sh, dev-stop.sh, generate-docs.py, monitor-health.sh, etc. **Le plus utilise** (reference dans package.json).
- `tools/scripts/` (2 fichiers) : `audit-database.js` + README. Commande `pnpm audit:database` s'en sert.

Aucune justification documentee pour deux dossiers distincts. Fusion ou documentation recommandee.

### 2.4 Dossier `reports/` (racine)

3 fichiers : `.gitignore`, `AUDIT-SUMMARY-2026-01-23.md` (janvier), `baseline-2026-01-23.json`. C'est une archive de janvier, potentiellement candidate a deplacement vers `docs/archive/`.

### 2.5 Workflows GitHub Actions — le README ment

README.md annonce "**8 workflows**" avec tableau detaille :

- `deploy-production.yml`
- `pr-validation.yml`
- `typescript-quality.yml`

**Realite** : `.github/workflows/` contient **2 fichiers** :

| Fichier                  | Role                                                                          |
| ------------------------ | ----------------------------------------------------------------------------- |
| `quality.yml`            | ESLint + Type-Check + Build, filtre par app changee, sur PR/push main+staging |
| `scratchpad-cleanup.yml` | Menage scratchpad                                                             |

Le workflow `quality.yml` est bien concu (cache Next.js, filtrage changements, commentaires PR automatiques). Mais :

- **Pas de tests E2E en CI** (malgre Playwright installe + tests e2e dans chaque app)
- **Pas de deploiement Vercel via Actions** (le deploy passe par auto-deploy Vercel, pas par Actions)
- **Pas de check console, ni validation types DB** en CI malgre les scripts locaux (`check:console:ci`, `validate:types`)
- **Pas de scan securite** (malgre la mention dans README "Security Scan")

### 2.6 Package.json racine — informations utiles

- Version : **1.0.0** (README annonce "v5.1.0" → dissonance)
- Nombre de scripts : **44** (tres riche)
- Commandes documentaires automatisees : `docs:generate:*` (Python) — confirme que la generation auto est prevue
- Hook `prepare: husky` configure
- Overrides pnpm : `d3-color`, `glob`, `jws`, `qs` (secu)

### 2.7 Packages @verone — realite

| Count       | Valeur                                                                                                                                                                                                                                                          |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| README dit  | 26                                                                                                                                                                                                                                                              |
| Audit 16/04 | 22                                                                                                                                                                                                                                                              |
| Reel 17/04  | **23** (categories, channels, collections, common, consultations, customers, dashboard, eslint-config, finance, hooks, integrations, logistics, notifications, orders, organisations, prettier-config, products, roadmap, stock, types, ui, ui-business, utils) |

Le **23e non vu par l'audit 16/04 est `categories`** (probablement oubli du compteur).

### 2.8 `docs/current/modules/` — 5 fichiers (pas 4 comme lu le 16/04)

Fichier non liste dans l'audit 16/04 : `packlink-shipping-reference.md`. Reference probable dans docs/current/modules/. Integration Packlink a documenter/verifier si active.

### 2.9 `docs/current/linkme/` — 9 fichiers (audit 16/04 listait 4)

Ajouts non listes : `06-business-rules.md`, `GLOSSAIRE-CHAMPS-PRIX.md`, `INDEX-PAGES-LINKME.md`, `commission-pricing-rules.md`, `formulaires-commande-comparaison.md`. Doublon apparent : `business-rules-linkme.md` et `06-business-rules.md`.

### 2.10 `docs/current/site-internet/` — 8 fichiers

Ajout non liste le 16/04 : `DMARC-HARDENING-PLAN.md`. Sujet securite email, a remonter dans une liste de priorites si en attente.

### 2.11 `docs/current/serena/` — 17 fichiers

Audit du 16/04 n'a pas explore ce dossier. C'est pourtant un dossier central (memoires d'agent). Contenu : `INDEX.md`, `_TEMPLATE.md` + 15 fichiers de decisions et architectures (project-decisions, qonto-never-finalize, linkme-commissions, linkme-architecture, stock-orders-logic, database-implementation, products-architecture, user-expectations, business-context, turborepo-paths, migrations-workflow, project-overview, claude-code-workflow, vercel-workflow, database-schema-mappings).

### 2.12 `.claude/rules/` — structure plate (pas arborescente)

`apps/linkme/CLAUDE.md` et `apps/site-internet/CLAUDE.md` referencent tous les deux `.claude/rules/database/rls-patterns.md` (chemin arborescent avec sous-dossier `database/`).

**Realite** : `.claude/rules/` contient 5 fichiers plats (`code-standards.md`, `database.md`, `playwright.md`, `stock-triggers-protected.md`, `workflow.md`). **Aucun sous-dossier `database/`, aucun fichier `rls-patterns.md`**.

Consequence : **2 chemins casses** dans les CLAUDE.md des apps. Un agent qui tente de lire ce fichier obtiendra une erreur.

---

## 3. MISE A JOUR DES CHIFFRES CLES

| Metrique                            | Audit 16/04 | Reel 17/04   | Ecart                   |
| ----------------------------------- | ----------- | ------------ | ----------------------- |
| Packages @verone                    | 22          | 23           | +1                      |
| Fichiers docs/scratchpad            | 1           | 25           | +24                     |
| Workflows GitHub Actions            | non analyse | 2            | README ment (annonce 8) |
| Fichiers docs/current/linkme        | 4           | 9            | +5                      |
| Fichiers docs/current/site-internet | 4           | 8            | +4                      |
| Sous-dossiers docs/                 | 10 partiels | 16 listes    | +6                      |
| Fichiers docs/current/serena        | non analyse | 17           | nouveau                 |
| Total fichiers .md                  | 208         | ~230 (estim) | +20                     |

Chiffres stables depuis le 16/04 (pas de regeneration probable, mais a confirmer apres `pnpm docs:generate`) :

- 142 tables PostgreSQL
- 660 migrations SQL (probablement +1 ou 2 depuis)
- 3 221 fichiers TS/JS
- 600 143 lignes de code

---

## 4. VALIDATION DES SOURCES DE VERITE DECLAREES

Le `CLAUDE.md` racine declare 4 sources de verite (section "SOURCES DE VERITE"). Verification :

| Source declaree                                | Chemin reel              | Statut |
| ---------------------------------------------- | ------------------------ | ------ |
| `docs/current/database/schema/`                | OK (10 fichiers 00 a 09) | ✓      |
| `docs/current/INDEX-COMPOSANTS-FORMULAIRES.md` | OK (655 lignes)          | ✓      |
| `docs/current/DEPENDANCES-PACKAGES.md`         | OK (133 lignes)          | ✓      |
| `docs/current/INDEX-PAGES-BACK-OFFICE.md`      | OK (436 lignes)          | ✓      |

Les 4 sources de verite existent bien. En revanche, `rules/stock-triggers-protected.md` cite dans la section "INTERDICTIONS ABSOLUES" **n'existe pas** — le vrai fichier est `.claude/rules/stock-triggers-protected.md` (confirme).

---

## 5. NOUVELLES DECOUVERTES NOTABLES

### 5.1 Workflow `scratchpad-cleanup.yml` — interessant

Un workflow de menage automatique du scratchpad existe. A verifier : sa periode, ce qu'il supprime. Si trop agressif, il risque de supprimer des dev-plans/dev-reports encore utiles.

### 5.2 Script `pnpm docs:generate --auto`

Commande existante et deja utilisee (confirme dans ACTIVE.md historique : "pre-commit now runs docs:generate --auto on every commit"). Signifie que certains INDEX sont auto-generes. A verifier lesquels, car **l'edition manuelle d'un fichier auto-genere est inutile**.

### 5.3 Memoires serena — doublon avec docs/current/

Le dossier `docs/current/serena/` contient 17 memoires agent. Plusieurs recoupent le contenu de `docs/current/` :

- `database-implementation.md` vs `docs/current/database/database.md`
- `linkme-architecture.md` vs `docs/current/linkme/GUIDE-COMPLET-LINKME.md`
- `stock-orders-logic.md` vs `docs/current/modules/stock-module-reference.md`

Strategie probable : les memoires serena sont des **digests** courts pour l'agent, les docs longues sont pour l'humain. A formaliser.

---

## 6. SIGNAUX D'ALERTE A JOUR

### 6.1 Fichiers tres volumineux (non auto-generes)

Confirmes depuis l'audit 16/04 (non revues aujourd'hui par calcul direct) :

- `packages/@verone/integrations/src/qonto/client.ts` : 1 654 lignes
- `packages/@verone/consultations/src/hooks/use-consultations.ts` : 1 036 lignes
- `apps/back-office/src/app/api/qonto/invoices/route.ts` : 882 lignes (note : ACTIVE.md mentionne 889 — refactor planifie en BO-TECH-001)
- `chrome-extension/popup.js` : 676 lignes
- `apps/site-internet/src/app/checkout/page.tsx` : 703 lignes

### 6.2 Doublons types Supabase imbriques (persistent)

L'audit 16/04 a signale :

- `packages/@verone/types/packages/@verone/types/src/supabase.ts` (10 435 lignes)
- `packages/@verone/types/apps/back-office/src/types/supabase.ts` (10 435 lignes)

Ces copies imbriquees anormales devraient etre supprimees (artefact de generation probable). Verification du 17/04 non effectuee (pas d'acces ls recursif), mais rien ne suggere qu'elles aient ete nettoyees.

### 6.3 `chrome-extension/` toujours non documente

676 + 592 lignes de JS. Pas de CLAUDE.md, pas de README dedie. Sujet de la question 14 de l'audit 16/04 (reste ouverte).

---

## 7. VERDICT GLOBAL

**Audit du 16/04 : valable a 80%** apres seulement 48h.

Pourquoi il reste utile :

- Inventaire technique (tables, triggers, migrations) : stable
- Analyse package.json et dependances : stable
- Detection dette `any`, doublons, TODO : stable
- 15 questions ouvertes : **toutes encore valides**

Pourquoi il doit etre complete :

- Scratchpad vide il y a 2 jours, explose aujourd'hui (changement majeur de signal)
- 4 dossiers `docs/` jamais audites (`serena`, `governance`, `workflows`, `logs`)
- `PROTECTED_FILES.json` jamais audite
- `tools/`, `reports/` jamais audites
- Workflows CI/CD jamais audites (fraude du README detectee)
- Chemins casses dans les CLAUDE.md d'apps non detectes

**Recommandation** : traiter cet audit 17/04 comme **complement** a celui du 16/04, pas comme remplacement. Garder les deux pour reference croisee.

---

**FIN DU RAPPORT — AXE 1**

Voir `docs/scratchpad/coherence-documentaire-2026-04-17.md` pour les incoherences et chemins casses a corriger.
