# Plan de restructuration config — 3 phases

**Base** : `docs/scratchpad/audit-config-agent-2026-04-19.md` (rapport brutal)
**Public** : Romeo + l'agent coordinateur
**Rigueur** : ordre d'exécution strict. Ne pas sauter de phase.

---

## Principe directeur

**On nettoie AVANT de restructurer AVANT d'automatiser.** L'inverse ne marche pas : automatiser un bordel donne un bordel automatisé plus rapide.

Chaque phase = une ou deux PRs distinctes sur `staging`. Pas de tout-en-un. Romeo valide phase par phase.

---

## PHASE 1 — Nettoyage (2-3 heures de travail)

Objectif : supprimer les doublons, corriger les chemins cassés, dégager la vue. **Zéro nouvelle structure.**

### 1.A — Fichiers à SUPPRIMER

| Fichier                                          | Justification                                        |
|--------------------------------------------------|-----------------------------------------------------|
| `docs/current/RESPONSIVE-SETUP-RECAP.md`         | Snapshot d'installation — sa valeur était "ce qui vient d'être fait". Plus valable. Contenu utile (liste des 18 fichiers) à déplacer dans `docs/archive/` ou dans un commit message. |
| `docs/current/RESPONSIVE-INDEX.md`               | Duplique `docs/current/GUIDE-RESPONSIVE.md` + pointe vers des fichiers redondants. Garder uniquement GUIDE-RESPONSIVE.md. |
| `.claude/work/PROMPTS-TO-COPY.md`                | Prompts destinés à Romeo pour copier dans une autre conversation. N'a pas sa place dans `.claude/work/` qui est pour l'agent. Déplacer dans `.claude/prompts/templates/` si utile, sinon supprimer. |
| `.claude/work/plan-canaux-de-vente.md`           | Plan vieux non référencé. Vérifier son contenu ; soit archiver, soit supprimer. |
| `docs/refonte-inventaire.md` (racine de `docs/`) | Orphelin. Déplacer vers `docs/archive/`. |

### 1.B — Fichiers à FUSIONNER

#### 1.B.1 — Fusionner 3 points d'entrée en 1

**Actuel** :
- `CLAUDE.md` racine (240L) — règles globales + checklist AVANT ACTION
- `.claude/work/AGENT-ENTRY-POINT.md` (196L) — mode d'emploi sprint responsive
- Hook `settings.json` SessionStart qui dit "LIRE EN PREMIER: ACTIVE.md + INDEX.md"

**Cible** : `.claude/ENTRY.md` (~40 lignes max), référencé par :
- Le hook SessionStart (remplace le message inline)
- La toute première section de CLAUDE.md

Contenu type :
```markdown
# Point d'entrée agent Verone

## 1. Lire obligatoirement
- CLAUDE.md (racine) — identité, autorisations, interdictions
- .claude/work/SPRINT-CURRENT.md — sprint en cours
- .claude/queue/01-TODO/INDEX.md — prochaine tâche à faire

## 2. Si tâche UI
- .claude/config/domain/responsive.md — les 5 techniques

## 3. Si tâche DB
- .claude/config/domain/database.md — RLS patterns
- docs/current/database/schema/ — schéma DB

## 4. Pour prendre la prochaine tâche
- bash .claude/scripts/next-task.sh

## 5. STOP et demander Romeo si
- Voir .claude/config/autonomy-boundaries.md section "feu rouge"
```

**AGENT-ENTRY-POINT.md** : son contenu sprint-responsive-spécifique migre vers `.claude/queue/01-TODO/BO-UI-RESP-002.md` + playbook associé.

#### 1.B.2 — Fusionner les 5 fichiers `.claude/work/` en 1

**Cible** : `.claude/work/SPRINT-CURRENT.md` (~80 lignes max). Un seul fichier vivant.

Contenu type :
```markdown
# Sprint en cours

**Nom** : Migration responsive (Bloc A)
**Task IDs actifs** : [BO-UI-RESP-001], [BO-UI-RESP-002]
**Branche** : feat/responsive-foundation
**Status** : en cours
**PR cible** : à créer quand Bloc A terminé

## Prochaines actions
- [ ] Commit infrastructure (18 fichiers)
- [ ] Audit global 250+ pages

## Bloqueurs
Aucun.

## Historique du sprint
- 2026-04-19 12:00 — début

---

# Sprints terminés récemment

(remontent dans .claude/queue/03-DONE/ ; ne les garder ici que 7 jours max)
```

Le reste (backlog long, faits anciens, faq développeur) remonte dans **`.claude/queue/01-TODO/`** (format YAML/MD par tâche) et **`.claude/queue/03-DONE/`** (archive auto).

#### 1.B.3 — Fusionner les 7 redondances responsive

**Source unique** : `.claude/config/domain/responsive.md` (ex `.claude/rules/responsive.md`).

Les 6 autres endroits (CLAUDE.md STANDARDS RESPONSIVE, reviewer-agent Axe 4, dev-agent Anti-patterns, GUIDE-RESPONSIVE.md, RESPONSIVE-INDEX.md, RESPONSIVE-SETUP-RECAP.md) sont réduits à **une seule ligne pointeur** :

```markdown
## Responsive
Règles complètes : `.claude/config/domain/responsive.md`.
```

Exception : `docs/current/GUIDE-RESPONSIVE.md` garde l'exemple de code copier-coller — c'est sa valeur. Mais il ne redit plus les règles, il pointe.

#### 1.B.4 — Fusionner les 4 versions du workflow Git

**Source unique** : `.claude/config/workflow.md` (ex `.claude/rules/workflow.md`).

CLAUDE.md section "WORKFLOW 1 PR = 1 BLOC" → 3 lignes pointeur.
`ops-agent.md` section "RÈGLE FONDAMENTALE" → 3 lignes pointeur.
`NEXT-SPRINTS.md` → disparaît (contenu tactique migre dans queue).

### 1.C — Fichiers à RENOMMER / DÉPLACER

| Actuel                                          | Cible                                            | Raison                                      |
|-------------------------------------------------|--------------------------------------------------|---------------------------------------------|
| `.claude/rules/`                                | `.claude/config/` (avec `domain/` sous-dossier)  | Clarifier : ce sont des règles stables (config), pas du workflow vivant |
| `.claude/rules/code-standards.md`               | `.claude/config/standards.md`                    | Plus court, même niveau que workflow.md     |
| `.claude/rules/workflow.md`                     | `.claude/config/workflow.md`                     | Idem                                        |
| `.claude/rules/database.md`                     | `.claude/config/domain/database.md`              | Sous-dossier domaine                        |
| `.claude/rules/finance.md`                      | `.claude/config/domain/finance.md`               |                                             |
| `.claude/rules/responsive.md`                   | `.claude/config/domain/responsive.md`            |                                             |
| `.claude/rules/playwright.md`                   | `.claude/config/domain/playwright.md`            |                                             |
| `.claude/rules/stock-triggers-protected.md`     | `.claude/config/domain/stock-triggers-protected.md` |                                        |

### 1.D — Chemins cassés à CORRIGER

4 corrections non-négociables :

| Fichier                                     | Chemin cassé                                   | Chemin correct                                  |
|---------------------------------------------|------------------------------------------------|-------------------------------------------------|
| `CLAUDE.md` (racine)                         | `rules/stock-triggers-protected.md`            | `.claude/config/domain/stock-triggers-protected.md` (après renommage) |
| `apps/linkme/CLAUDE.md` (×2)                 | `.claude/rules/database/rls-patterns.md`       | `.claude/config/domain/database.md`              |
| `apps/site-internet/CLAUDE.md`               | `.claude/rules/database/rls-patterns.md`       | `.claude/config/domain/database.md`              |
| `.husky/pre-commit` ligne 22                 | `.claude/rules/database/rls-patterns.md`       | `.claude/config/domain/database.md`              |

### 1.E — Chose à CRÉER dans cette phase (juste 2)

1. `.claude/scripts/check-open-prs.sh` — le script fantôme promis par CLAUDE.md. Contenu minimal :
```bash
#!/bin/bash
# Affiche les PRs ouvertes + signale conflits/oublis
gh pr list --state open --json number,title,mergeable,createdAt,headRefName \
  | jq -r '.[] | "\(.number) \(.title) (\(.headRefName)) - mergeable: \(.mergeable) - created: \(.createdAt)"'
```

2. Un test de cohérence `scripts/check-claude-config-paths.sh` qui vérifie que tous les chemins référencés dans `CLAUDE.md`, `.claude/**`, `apps/*/CLAUDE.md` existent. À ajouter dans `.husky/pre-commit` pour bloquer les dérives futures.

### 1.F — Critères de fin de Phase 1

- [ ] Les 4 chemins cassés corrigés (vérifiables par grep)
- [ ] Les 5 fichiers redondants supprimés (listés en 1.A)
- [ ] `.claude/work/` contient 1 seul fichier `SPRINT-CURRENT.md`
- [ ] `.claude/rules/` → `.claude/config/` (+ sous-dossier `domain/`)
- [ ] Les 7 endroits responsive ont été réduits à 1 source + 6 pointeurs
- [ ] `check-claude-config-paths.sh` passe (zéro chemin cassé)
- [ ] 1 PR vers staging : `[INFRA-DOC-001] chore: clean and consolidate .claude/ config`

**Effort estimé** : 2-3h par un dev attentif ou délégation à `writer-agent` avec briefing précis.

---

## PHASE 2 — Restructuration (4-6 heures)

Objectif : mettre en place la queue de tâches structurée et les playbooks. **C'est la phase qui débloque l'autonomie.**

### 2.A — Créer `.claude/queue/`

Structure :
```
.claude/queue/
├── 01-TODO/
├── 02-IN-PROGRESS/
├── 03-DONE/
├── 04-BLOCKED/
└── INDEX.md   (généré auto par scripts/queue-index.sh)
```

**Format d'une tâche** (`.claude/queue/01-TODO/BO-UI-RESP-002.md`) :

```markdown
---
id: BO-UI-RESP-002
title: "Audit global 250+ pages responsive"
app: all
domain: UI-RESPONSIVE
priority: P1
status: todo
estimated: 4h
blockers: []
playbook: audit-global
depends_on: [BO-UI-RESP-001]
branch: feat/responsive-foundation
can_agent_act_alone: false   # audit = besoin validation Romeo avant Bloc B
created: 2026-04-18
assigned: dev-agent + writer-agent
---

# BO-UI-RESP-002 — Audit global 250+ pages responsive

## Contexte
[...]

## Livrable
`docs/scratchpad/audit-responsive-global-2026-04-19.md`
avec classification par pattern A/B/C/D/E/F.

## Critères de succès
- [ ] Toutes les pages back-office listées
- [ ] Toutes les pages linkme listées
- [ ] Toutes les pages site-internet listées
- [ ] Chaque page a un pattern assigné
- [ ] Plan en blocs proposé

## Notes
Voir playbook : .claude/playbooks/audit-global.md
```

### 2.B — Créer les playbooks

Minimum viable (6 playbooks) :

| Playbook                             | Utilisé par                                  | Contenu                                     |
|--------------------------------------|----------------------------------------------|---------------------------------------------|
| `migrate-page-responsive.md`          | BO-UI-RESP-003 à 009                         | Recette : lire pattern, appliquer 3 composants, tester 5 tailles |
| `audit-global.md`                     | BO-UI-RESP-002                               | Recette : lister pages, classer, proposer plan |
| `fix-bug.md`                          | Tout ticket `fix/*`                          | Recette : reproduire, triple lecture, fix, test |
| `add-new-page.md`                     | Nouveaux écrans                              | Recette : route, composant, RLS, test       |
| `review-and-merge.md`                 | ops-agent                                    | Recette : review, CI, merge, update queue   |
| `handle-ci-failure.md`                | Quand CI échoue                              | Recette : diagnostiquer, fixer, re-push     |

### 2.C — Créer `.claude/config/autonomy-boundaries.md`

Ce fichier remplace les contradictions actuelles. Structure :

```markdown
# Périmètre d'autonomie de l'agent

## FEU VERT — l'agent fait sans demander

- Lire/écrire dans docs/scratchpad/
- Commit sur feature branch (format commit respecté)
- Push sur feature branch
- Rebase sur staging
- Créer une branche depuis staging
- Exécuter type-check, build, tests
- Invoquer un sous-agent (dev, reviewer, verify)
- Passer une tâche de 01-TODO à 02-IN-PROGRESS
- Passer une tâche de 02-IN-PROGRESS à 03-DONE après merge PR
- Créer une PR DRAFT quand bloc fonctionnellement complet

## FEU ORANGE — l'agent propose, demande confirmation laconique ("ok" suffit)

- Marquer une PR "ready for review" (retirer draft)
- Créer une PR non-draft sur staging
- Modifier le premier fichier d'un sprint (déclenche check "confirme-tu le scope ?")
- Choisir un playbook si la tâche n'en a pas explicite

## FEU ROUGE — l'agent refuse jusqu'à ordre explicite Romeo

- Merge vers staging
- Merge vers main
- Migration DB (mcp__supabase__apply_migration est déjà bloqué en settings.json)
- Modification de fichiers .claude/ (règles, config, agents)
- Modification de CLAUDE.md racine
- Modification de PROTECTED_FILES.json
- Force push, reset commits, suppression branche distante
- Modification de routes API existantes (Qonto, adresses, emails, webhooks)
- Modification de triggers stock (voir stock-triggers-protected.md)
- Créer une tâche hors queue (doit passer par Romeo pour validation prio)

## Principe

En cas d'ambiguïté : **FEU ROUGE par défaut**. Mieux vaut une attente
inutile qu'une casse silencieuse.
```

### 2.D — Créer `.claude/DECISIONS.md`

Format ADR (Architecture Decision Record). Une entrée = une décision structurelle.

Exemple initial :
```markdown
# Decisions — .claude/ config

## ADR-001 — 2026-04-15 — Suppression des agents "expert"
**Contexte** : 4 agents existaient (back-office-expert, linkme-expert, site-internet-expert, frontend-architect) qui dupliquaient dev-agent.
**Décision** : supprimés, remplacés par dev-agent + lectures ciblées des CLAUDE.md d'apps.
**Conséquence** : 4 fichiers en moins.
**Ref** : commit 8e44d3013

## ADR-002 — 2026-04-18 — Workflow "1 PR = 1 bloc cohérent"
**Contexte** : trop de PRs atomiques (9 PRs pour 1 sprint responsive) = 135 min de CI perdues.
**Décision** : regrouper en blocs (5 PRs max).
**Conséquence** : .claude/rules/workflow.md créé ; docs existants mis à jour.
**Ref** : session 2026-04-18 ; PR #TBD

## ADR-003 — 2026-04-19 — Restructuration .claude/ en queue + playbooks
**Contexte** : config devenue illisible (audit-config-agent-2026-04-19.md).
**Décision** : passer à structure config/ + queue/ + playbooks/.
**Conséquence** : ce plan (plan-restructuration-config.md).
**Ref** : audit 2026-04-19.
```

### 2.E — Migrer les tâches existantes dans la queue

Actuellement `.claude/work/ACTIVE.md` et `.claude/work/NEXT-SPRINTS.md` contiennent ~15-20 tâches. Les migrer :

- Tâches dans "EN COURS" → `.claude/queue/02-IN-PROGRESS/`
- Tâches dans "A FAIRE" / "SPRINTS" → `.claude/queue/01-TODO/`
- Tâches "FAIT" de moins de 7 jours → `.claude/queue/03-DONE/`
- Tâches "FAIT" anciennes → `.claude/queue/03-DONE/archive-2026-04.md` (regroupées)
- Tâches avec bloqueur → `.claude/queue/04-BLOCKED/`

Chaque tâche devient un fichier `[APP-DOMAIN-NNN].md` avec YAML frontmatter.

### 2.F — Scripts queue

2 scripts à créer :

1. `.claude/scripts/next-task.sh` — sort la prochaine tâche de 01-TODO triée par priorité :
```bash
#!/bin/bash
ls .claude/queue/01-TODO/*.md 2>/dev/null \
  | xargs grep -l 'status: todo' \
  | xargs awk 'FNR==1{file=FILENAME} /^priority:/{p=$2; print p"|"file; nextfile}' \
  | sort \
  | head -1 \
  | cut -d'|' -f2 \
  | xargs cat
```

2. `.claude/scripts/queue-index.sh` — régénère `.claude/queue/INDEX.md` à partir du contenu des dossiers.

### 2.G — Critères de fin de Phase 2

- [ ] `.claude/queue/` créée avec 4 sous-dossiers
- [ ] 6 playbooks créés
- [ ] `autonomy-boundaries.md` créé et référencé depuis CLAUDE.md
- [ ] `DECISIONS.md` initialisé
- [ ] Tâches d'ACTIVE.md + NEXT-SPRINTS.md migrées dans la queue
- [ ] `next-task.sh` et `queue-index.sh` créés et testés
- [ ] `CLAUDE.md` mis à jour pour référencer la queue
- [ ] 1 PR vers staging : `[INFRA-DOC-002] feat: add queue + playbooks structure`

**Effort estimé** : 4-6h, en deux sessions si besoin. Délégable à writer-agent avec supervision serrée (migration des tâches = étape délicate, risque d'oublier des items).

---

## PHASE 3 — Automation (6-10 heures, par paliers)

Objectif : rendre l'agent **effectivement** autonome sur son périmètre feu-vert. C'est la phase qui réduit la charge cognitive de Romeo.

Voir `docs/scratchpad/automation-roadmap.md` pour le détail des intégrations. Résumé ici :

### 3.A — Palier 1 : auto-review sur PRs (2-3h)

Workflow GitHub Actions qui lance `reviewer-agent` en commentaire automatique quand une PR est ouverte.

Sortie : commentaire PR avec PASS/FAIL + détails. Romeo n'a plus à lancer `/review` manuellement.

### 3.B — Palier 2 : next-task automatique après merge (2h)

Webhook/Actions qui, après merge réussi, déplace la tâche de 02-IN-PROGRESS à 03-DONE et notifie la tâche suivante disponible.

### 3.C — Palier 3 : MCPs supplémentaires (1-2h)

- Linear MCP (ou GitHub Issues MCP) pour lier les tâches .claude/queue à un ticketing externe.
- Sentry MCP pour surveiller les erreurs prod.
- Notion MCP si Romeo documente là-bas.

### 3.D — Palier 4 : commandes slash avancées (1-2h)

- `/next-task` — prend la tâche suivante de la queue
- `/ship` — valide + push + crée la PR draft
- `/promote` — passe la PR de draft à ready
- `/rollback` — revient à l'état avant le dernier merge

### 3.E — Critères de fin de Phase 3

Progressifs, palier par palier. L'objectif global est que **Romeo ne donne plus que des missions de haut niveau** ("migre les pages stock en responsive") et que l'agent orchestre de bout en bout (prend la tâche, code, review, push, PR draft, attend validation final merge).

---

## PHASE 4 — Critères d'autonomie (déjà écrits en Phase 2.C)

Le fichier `autonomy-boundaries.md` de la Phase 2 EST la Phase 4. Elle n'est pas séparée — elle formalise ce qui est demandé dans le prompt d'audit.

**Ce que l'agent peut faire SEUL** (résumé) :
- Tout le cycle feature branch : créer, commit, push, rebase
- Invoquer sous-agents (dev, reviewer, verify)
- Gérer la queue (déplacer tâches entre dossiers)
- Créer PR DRAFT
- Lire/écrire scratchpad

**Ce que l'agent DOIT attendre Romeo pour** :
- Promouvoir PR de draft à ready
- Merger vers staging ou main
- Migrer DB
- Modifier `.claude/` ou CLAUDE.md ou PROTECTED_FILES
- Force push / reset commits mergés
- Modifier routes API existantes ou triggers stock

---

## Ordre d'exécution recommandé

Ne pas paralléliser. Séquence stricte :

1. **Phase 1** complète (2-3h) → PR `[INFRA-DOC-001]`
2. Merge → validation Romeo
3. **Phase 2** complète (4-6h) → PR `[INFRA-DOC-002]`
4. Merge → validation Romeo
5. **Phase 3 palier 1** (2-3h) → PR `[INFRA-CI-001]` (auto-review)
6. Tester pendant 3-5 jours en réel
7. **Phase 3 palier 2** (2h) → PR `[INFRA-CI-002]` (next-task auto)
8. Paliers 3 et 4 selon priorités business

**Total effort estimé** : 10-15h de travail réel, étalées sur 2-3 semaines en fonction du rythme des autres sprints en parallèle.

---

## Risques à surveiller

| Risque                                         | Mitigation                                      |
|------------------------------------------------|-------------------------------------------------|
| Suppression de fichiers utiles pendant la Phase 1 | Commit avant chaque `rm` ; la PR rend tout réversible |
| Perte de contexte pendant la migration des tâches Phase 2.E | Conserver `ACTIVE.md` original en commentaire de chaque fichier de queue créé, supprimer une fois validé |
| L'agent ne sait plus où lire pendant la transition | Ajouter un "pointeur de redirection" temporaire dans les fichiers supprimés : `# DEPLACE vers .claude/config/...` |
| Dérive future (comme actuellement) | Tests CI de cohérence + `DECISIONS.md` + revue config trimestrielle |

---

## Signal d'alerte qui dirait qu'on a mal fait

Si 2 mois après cette restructuration, Romeo se retrouve à créer un 6e fichier "ENTRY-POINT-V2-FINAL.md" parce que l'ancien ne colle plus : **la restructuration a échoué.** Le bon signal est : **la structure tient** et les changements se font par édition de fichiers existants, pas par création de nouveaux.

---

**Prochain document à lire** : `docs/scratchpad/automation-roadmap.md` pour le détail des intégrations GitHub Actions / MCP / webhooks.
