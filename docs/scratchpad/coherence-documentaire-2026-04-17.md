# AXE 2 — COHERENCE DOCUMENTAIRE

**Date** : 17 avril 2026
**Objectif** : Lister chemins casses, contradictions, doublons et fichiers orphelins.
**Format** : tableau actionnable. Chaque ligne = une action a valider par Romeo.
**Sortie attendue apres validation** : commits de correction documentaire.

---

## 1. CHEMINS CASSES (CRITIQUE — AGENTS IA DERAILLENT)

Ces chemins sont cites dans des fichiers de reference (CLAUDE.md, README.md) mais **le fichier cible n'existe pas a l'emplacement indique**. Un agent qui suit les instructions tombe sur une erreur.

| #   | Fichier source                            | Chemin casse                             | Vraie location                                                  | Action                                              |
| --- | ----------------------------------------- | ---------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------- |
| 1   | `CLAUDE.md` (racine, ligne interdictions) | `rules/stock-triggers-protected.md`      | `.claude/rules/stock-triggers-protected.md`                     | Corriger le chemin dans CLAUDE.md racine            |
| 2   | `apps/linkme/CLAUDE.md` (ligne tableau)   | `.claude/rules/database/rls-patterns.md` | N'existe pas. Contenu probable dans `.claude/rules/database.md` | Corriger chemin OU creer `rls-patterns.md` en dedie |
| 3   | `apps/site-internet/CLAUDE.md`            | `.claude/rules/database/rls-patterns.md` | N'existe pas                                                    | Meme correction que #2                              |
| 4   | `PROTECTED_FILES.json` (requiresReview)   | `packages/@verone/kpi/**`                | Package inexistant                                              | Supprimer l'entree OU creer le package              |

---

## 2. CONTRADICTIONS ENTRE DOCS

### 2.1 Branche cible des PR

| Source                   | Dit                                                        |
| ------------------------ | ---------------------------------------------------------- |
| `CLAUDE.md` (racine)     | "PR vers staging uniquement (jamais main)"                 |
| `README.md` (racine)     | Section Contributing : "Créer PR vers main"                |
| `README.md` (CI/CD)      | "Auto-deploy sur merge vers main"                          |
| `.claude/work/ACTIVE.md` | "PR = toujours vers staging, jamais vers main directement" |
| `quality.yml`            | Triggers sur PR vers `main`, `staging`, `integration/*`    |
| **Decision Romeo 17/04** | **staging**                                                |

**Action** : reecrire la section Contributing du README pour aligner sur staging. Preciser que main est protegee et recoit uniquement des merges depuis staging.

### 2.2 Nombre de packages @verone

| Source        | Dit    |
| ------------- | ------ |
| `README.md`   | 26     |
| Audit 16/04   | 22     |
| Realite 17/04 | **23** |

**Action** : corriger README (`26 packages` → `23 packages`) + **automatiser** via `pnpm docs:generate:deps`.

### 2.3 Nombre de documents canoniques

| Source                  | Dit                                                                          |
| ----------------------- | ---------------------------------------------------------------------------- |
| `README.md` (arbo)      | "12 docs canoniques"                                                         |
| `README.md` (texte)     | "9 fichiers"                                                                 |
| Realite `docs/current/` | 28+ fichiers plats + 10 sous-dossiers + ~100 fichiers dans les sous-dossiers |

**Action** : supprimer les deux chiffres du README. Remplacer par un lien vers `docs/README.md` qui est deja l'index reel.

### 2.4 Nombre de workflows CI/CD

| Source         | Dit                                                              |
| -------------- | ---------------------------------------------------------------- |
| `README.md`    | "8 workflows GitHub Actions"                                     |
| Tableau README | deploy-production.yml, pr-validation.yml, typescript-quality.yml |
| Realite        | **2 workflows** (quality.yml, scratchpad-cleanup.yml)            |

**Action** : reecrire la section CI/CD du README en decrivant la realite : un seul workflow qualite qui filtre par app changee, auto-deploy Vercel en dehors d'Actions, pas de tests E2E en CI.

### 2.5 Nombre de dossiers business-rules

| Source      | Dit                                             |
| ----------- | ----------------------------------------------- |
| `README.md` | "93 dossiers regles metier"                     |
| Realite     | **3 sous-dossiers** dans `docs/business-rules/` |

**Action** : corriger le README (3 domaines : organisations-contacts, stocks, commandes).

### 2.6 Version projet

| Source         | Dit                   |
| -------------- | --------------------- |
| `package.json` | `"version": "1.0.0"`  |
| `README.md`    | `v5.1.0 - 2026-01-09` |

**Action** : aligner. Soit bump le package.json, soit corriger la note bas de README. Recommandation : **ignorer le versionnage string du README** et dater simplement ("Derniere mise a jour : YYYY-MM-DD").

### 2.7 Nombre de tables DB

| Source                      | Dit                        |
| --------------------------- | -------------------------- |
| `README.md` (diagramme)     | "74 tables"                |
| `README.md` (intro)         | "74 migrations" (confondu) |
| `docs/README.md`            | "78+ tables"               |
| Audit 16/04 (verifie en DB) | **142 tables**             |

**Action** : corriger le README pour mettre 142 tables. Verifier que `docs/current/database/schema/00-SUMMARY.md` est aussi a jour.

### 2.8 Nombre de migrations

| Source      | Dit                |
| ----------- | ------------------ |
| `README.md` | "74 migrations"    |
| Audit 16/04 | **660 migrations** |

**Action** : corriger.

### 2.9 Commandes dev : npm vs pnpm

| Source         | Commandes                                                       |
| -------------- | --------------------------------------------------------------- |
| `README.md`    | `npm run dev`, `npm run build`, `npm run type-check`            |
| `CLAUDE.md`    | `pnpm --filter @verone/[app] build`, interdit `pnpm dev` global |
| `package.json` | Scripts utilisables via pnpm ou npm (resolvent sur turbo)       |

**Action** : reecrire le README avec `pnpm` systematique (coherent avec ce que la CI utilise + ce que CLAUDE.md exige). Ajouter encart "Commandes interdites en local : `pnpm dev`, `pnpm start` globaux".

---

## 3. DOUBLONS DOCUMENTAIRES (DANS DOCS)

### 3.1 INDEX back-office — 3 fichiers redondants

| Fichier                                     | Role suppose                               |
| ------------------------------------------- | ------------------------------------------ |
| `docs/current/INDEX-BACK-OFFICE-APP.md`     | Index auto-genere (pages, API, composants) |
| `docs/current/INDEX-BACK-OFFICE-COMPLET.md` | 20 sections, 134 pages, flux               |
| `docs/current/INDEX-PAGES-BACK-OFFICE.md`   | 165 pages, sidebar                         |

**Question** : les 3 sont-ils distincts ou partiellement redondants ? Probable que `INDEX-BACK-OFFICE-APP.md` (auto-genere) chevauche avec `INDEX-PAGES-BACK-OFFICE.md` (manuel).

**Action proposee** : lire les 3 fichiers, decider :

- lequel est la **reference humaine** (1 fichier)
- lequel est la **reference machine/agent** (1 fichier auto-genere)
- supprimer le 3e ou le transformer en redirection

### 3.2 INDEX linkme — 2 fichiers redondants

- `docs/current/INDEX-LINKME-APP.md` (auto-genere)
- `docs/current/INDEX-LINKME-COMPLET.md` (manuel)
- **+ dans `docs/current/linkme/`** : `INDEX-PAGES-LINKME.md`

Meme probleme. 3 index pour la meme app.

### 3.3 INDEX site-internet — 2 fichiers redondants

- `docs/current/INDEX-SITE-INTERNET-APP.md`
- `docs/current/INDEX-SITE-INTERNET-COMPLET.md`

### 3.4 Schema DB — 2 emplacements

- `docs/current/DATABASE-SCHEMA-COMPLETE.md` (a plat)
- `docs/current/database/DATABASE-SCHEMA-COMPLETE.md` (dans sous-dossier)

**Action** : verifier si contenu identique. Si oui, supprimer le plat, garder celui dans `database/` (plus logique).

### 3.5 Architecture — 2 fichiers

- `docs/current/architecture.md`
- `docs/current/architecture-packages.md`

A verifier : sont-ils complementaires ou redondants ?

### 3.6 LinkMe business rules — 2 fichiers

- `docs/current/linkme/business-rules-linkme.md`
- `docs/current/linkme/06-business-rules.md`

A verifier : lequel est canonique ?

### 3.7 Dev workflow — 2 emplacements

- `docs/current/dev-workflow.md`
- `.claude/rules/workflow.md`

Premier pour humains, second pour agents ? A expliciter dans un header de chaque fichier.

### 3.8 Memoires serena vs docs canoniques

17 fichiers `docs/current/serena/` recoupent partiellement `docs/current/` :

- `serena/database-implementation.md` ↔ `database/database.md`
- `serena/linkme-architecture.md` ↔ `linkme/GUIDE-COMPLET-LINKME.md`
- `serena/stock-orders-logic.md` ↔ `modules/stock-module-reference.md`
- `serena/products-architecture.md` ↔ (non trouve en direct)

**Strategie a formaliser** : memoires serena = digests courts agent (max 100 lignes) ; docs/current = reference longue humain. Ajouter header explicite dans chaque memoire : "Digest de <fichier canonique>. Ne pas editer sans mettre a jour la source."

---

## 4. FICHIERS ORPHELINS (non references par aucun index)

| Fichier                                        | Statut                    | Action proposee                                                    |
| ---------------------------------------------- | ------------------------- | ------------------------------------------------------------------ |
| `docs/refonte-inventaire.md`                   | Inventaire pre-refonte V2 | Deplacer vers `docs/archive/` (terminé)                            |
| `docs/marketing/.gitkeep`                      | Dossier vide              | Supprimer le dossier OU y mettre du contenu                        |
| `reports/AUDIT-SUMMARY-2026-01-23.md`          | Audit de janvier          | Deplacer vers `docs/archive/`                                      |
| `reports/baseline-2026-01-23.json`             | Baseline janvier          | Deplacer vers `docs/archive/`                                      |
| `apps/linkme/RESEND_SETUP.md`                  | Setup email               | Integrer dans `docs/integrations/resend-dns-setup.md` (existe)     |
| `apps/linkme/README.md`                        | README app                | Verifier si a jour (probable dissonance avec docs/current/linkme/) |
| `diagnostic-verone.md` (mentionne audit 16/04) | 1041 lignes               | A verifier (ne l'ai pas vu 17/04)                                  |
| `export-claude-config-complet.md` (idem)       | 8605 lignes               | A verifier (pouvant etre archive)                                  |

---

## 5. INDEX A RAFRAICHIR

| Index              | Chemin                    | Probleme                                                                                                                   |
| ------------------ | ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| README principal   | `/README.md`              | Chiffres faux (26 packages, 74 tables, 8 workflows, 93 dossiers, 12 docs, v5.1.0)                                          |
| Doc README         | `/docs/README.md`         | Quelques fichiers listes sans verification (ex : `docs/current/site-internet/ARCHITECTURE.md` OK mais d'autres ?)          |
| docs/current/index | `/docs/current/index.md`  | Date du 2026-04-16 — probablement a regenerer. **Ne liste que 11 docs "consolidees"** alors que le dossier en contient 28+ |
| .claude INDEX      | `/.claude/INDEX.md`       | Non relu — a auditer                                                                                                       |
| ACTIVE.md          | `/.claude/work/ACTIVE.md` | Bien tenu mais certains paragraphes "FAIT" pourraient basculer en archive apres 1 mois                                     |

---

## 6. STRATEGIE DE CORRECTION PROPOSEE

### Priorite 1 — chemins casses (bloquants pour agents)

1. Corriger les 3 chemins `.claude/rules/database/rls-patterns.md` → `.claude/rules/database.md` dans CLAUDE.md linkme + site-internet
2. Corriger `rules/stock-triggers-protected.md` → `.claude/rules/stock-triggers-protected.md` dans CLAUDE.md racine
3. Supprimer ou creer `packages/@verone/kpi` dans PROTECTED_FILES.json

### Priorite 2 — reecriture README

Reecrire `/README.md` en supprimant tous les chiffres obsoletes et en renvoyant vers `docs/README.md` pour l'inventaire detaille. Garder :

- Architecture Mermaid (valide)
- Getting Started (valider les commandes → `pnpm`)
- Tech Stack (valider versions)
- Task Management (OK)

Supprimer ou refaire :

- "Details par Application" (chiffres obsoletes)
- "Data Layer" (78 tables → 142)
- "Scripts & Commands" (trop long, deviation)
- "CI/CD" (8 workflows → 2)
- Footer "v5.1.0 - 2026-01-09"

### Priorite 3 — nettoyage doublons docs/current/

Pour chaque groupe de doublons (3 INDEX BO, 2 INDEX LM, 2 INDEX SI, schema a plat vs dossier, 2 business-rules linkme, 2 architecture), **valider avec Romeo** quel fichier est canonique et supprimer/fusionner les autres.

### Priorite 4 — formalisation serena vs current

Ajouter header standardise a chaque memoire serena et chaque doc current qui se chevauchent.

### Priorite 5 — archive des orphelins

Deplacer les 4 fichiers orphelins identifies vers `docs/archive/` avec un README d'index.

---

## 7. ACTIONS AUTOMATISABLES

Scripts deja disponibles qui peuvent aider :

- `pnpm docs:generate` → regenere les INDEX auto
- `pnpm audit:duplicates` → detecte duplication code
- `pnpm audit:spelling` → cspell sur docs

**Proposition** : apres les corrections manuelles, lancer `pnpm docs:generate` pour regenerer les `INDEX-*-APP.md` automatiquement et verifier la coherence.

---

**FIN DU RAPPORT — AXE 2**

Suite : `docs/scratchpad/documentation-manquante-2026-04-17.md`
