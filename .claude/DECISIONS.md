# DECISIONS — Architecture Decision Records `.claude/`

**Format** : ADR (Architecture Decision Record). Chaque décision structurelle touchant `.claude/` ou la configuration agent est loggée ici avec contexte + conséquence + référence.

**Règle** : toute PR modifiant `.claude/` (hors `.claude/work/` qui est gitignored et hors scratchpad) doit ajouter une entrée dans ce fichier. Un script CI (`scripts/check-config-integrity.sh` — à activer en GitHub Actions plus tard) vérifiera ce contrat.

---

## ADR-001 — 2026-04-15 — Suppression des agents « expert »

**Contexte** : 4 agents avaient été créés en début de projet pour spécialiser par app : `back-office-expert`, `linkme-expert`, `site-internet-expert`, `frontend-architect`. En pratique ils dupliquaient dev-agent avec un contexte figé par app, ce qui empêchait la collaboration inter-app et alourdissait le choix d'agent pour le coordinateur.

**Décision** : supprimer les 4 agents expert. Garder dev-agent comme agent de code universel, qui lit `apps/[app]/CLAUDE.md` pour son contexte app-specific.

**Conséquence** : 4 fichiers en moins dans `.claude/agents/`. Coordinateur n'a plus qu'un seul agent de code à appeler. Contexte app récupéré via lecture CLAUDE.md de l'app.

**Référence** : commit 8e44d3013 (deletions tracées dans `settings.local.json`).

---

## ADR-002 — 2026-04-18 — Workflow « 1 PR = 1 bloc cohérent »

**Contexte** : multiplication de PRs atomiques (9 PRs prévues pour 1 sprint responsive) entraînait ~135 min de CI/review overhead par sprint complet. Inefficace.

**Décision** : regrouper plusieurs sprints logiquement liés dans une seule PR « bloc ». 5 PRs max au lieu de 9 pour le sprint responsive (infrastructure / lists / details / forms / apps).

**Conséquence** : `.claude/rules/workflow.md` créé avec la règle. `CLAUDE.md` racine ajoute une section « ⚡ WORKFLOW : 1 PR = 1 BLOC COHERENT ». `ops-agent.md` mis à jour pour ne plus créer de PR par sprint.

**Référence** : session nocturne 2026-04-18. `.claude/rules/workflow.md` (206 lignes).

---

## ADR-003 — 2026-04-19 — Restructuration `.claude/` en 3 phases

**Contexte** : audit brutal de la config agent (`docs/scratchpad/audit-config-agent-2026-04-19.md`) révèle :
- 4 chemins cassés (corrigés en Phase 1, commit [INFRA-DOC-001] pending)
- Règles responsive dupliquées à 7 endroits
- Workflow Git dupliqué à 4 endroits
- Script `check-open-prs.sh` référencé OBLIGATOIRE mais inexistant
- Contradictions internes de `CLAUDE.md` (ligne 7 « JAMAIS code » vs 47-53 « code si < 10 lignes »)
- `.claude/INDEX.md` incohérent (5 rules en haut, 7 en bas)
- Pas de queue de tâches machine-lisible → agent ne peut pas enchaîner seul

**Décision** : restructuration en 3 phases.
- **Phase 1** (2-3 h) : nettoyage sans restructuration — chemins, contradictions, INDEX. **APPLIQUÉE** (commit pending).
- **Phase 2** (4-6 h) : queue + playbooks + DECISIONS + autonomy-boundaries. **EN COURS** (cet ADR). Sans déplacement physique de fichiers tant que Claude Code est actif sur `feat/responsive-lists`.
- **Phase 3** (9-12 h priorité haute) : automation — auto-review CI, auto-advance-queue, MCP GitHub, commandes slash `/next-task` + `/ship`.

**Conséquence** : création de `.claude/DECISIONS.md`, `.claude/rules/autonomy-boundaries.md`, `.claude/queue/`, `.claude/done/`, `.claude/playbooks/`, `scripts/check-config-integrity.sh`. Réduction de `CLAUDE.md` racine à environ 120 lignes (de 240) — application différée à après merge PR A.

**Référence** : `docs/scratchpad/audit-config-agent-2026-04-19.md`, `docs/scratchpad/plan-restructuration-config.md`.

---

## ADR-004 — 2026-04-19 — 4 ajustements validés à l'audit de restructuration

**Contexte** : un second agent (autre Claude Code) a relu les 3 rapports de la restructuration et proposé 4 ajustements spécifiques. Romeo les a validés sans réserve.

**Décisions retenues** :

1. **Queue simplifiée à 2 dossiers** (`.claude/queue/` + `.claude/done/`) au lieu de 4 (TODO/IN-PROGRESS/DONE/BLOCKED). Statut dans le YAML frontmatter (`status: todo | in-progress | blocked | done`). Raison : Romeo est seul développeur, pas Linear. 4 dossiers physiques = friction inutile.
2. **`.claude/rules/` conservé** (pas renommé en `.claude/config/`). Ajout d'un sous-dossier `.claude/rules/domain/` pour `finance.md`, `stock-triggers-protected.md`, `responsive.md`. Raison : renommer casse trop de références existantes ; ajouter un sous-dossier est non-invasif.
3. **Test CI bloquant** toute PR touchant `.claude/` sans entrée dans DECISIONS.md. Raison : garde-fou anti-dérive ; Romeo a reconnu lui-même qu'il empile des fichiers sous l'émotion. Le script est créé (`scripts/check-config-integrity.sh`), l'activation en GitHub Actions est en Phase 3.
4. **Audit des 6 agents** → résultat dans `docs/scratchpad/audit-agents-2026-04-19.md`. writer-agent et market-agent à supprimer (0 rapport en 3 mois).

**Conséquence** :
- Structure `.claude/queue/ + .claude/done/` appliquée dans cette Phase 2.
- Sous-dossier `.claude/rules/domain/` créé vide pour l'instant — déplacement physique des fichiers après merge PR A (éviter conflit avec Claude Code qui lit activement `.claude/rules/responsive.md`).
- Script `scripts/check-config-integrity.sh` créé. Activation CI en Phase 3.
- Suppression writer-agent + market-agent → ADR-005 ci-dessous.

**Référence** : audit second agent daté 2026-04-19 (cité par Romeo dans conversation).

---

## ADR-005 — 2026-04-19 — Suppression writer-agent et market-agent (différée)

**Contexte** : audit d'usage (`docs/scratchpad/audit-agents-2026-04-19.md`) révèle que writer-agent et market-agent n'ont produit aucun rapport dans les 3 derniers mois. Ils sont définis mais jamais invoqués.

**Décision** : supprimer `.claude/agents/writer-agent.md` et `.claude/agents/market-agent.md`. Si besoin futur de contenu marketing/documentation structurée, passer par claude.ai ou recréer un agent dédié à ce moment-là.

**Application différée** : Claude Code est actif sur `feat/responsive-lists` et pourrait invoquer ces agents (improbable mais possible). Suppression physique après merge PR A, dans une PR dédiée `[INFRA-DOC-002]`.

**Conséquence** : 2 fichiers en moins. `.claude/INDEX.md` section Agents passera de 6 à 4 agents. `.claude/commands/README.md` idem.

**Référence** : `docs/scratchpad/audit-agents-2026-04-19.md`.

---

## ADR-006 — 2026-04-19 — `.claude/work/` reste gitignored, consolidation différée

**Contexte** : le `.gitignore` exclut `.claude/work/` — les 5 fichiers (`ACTIVE.md`, `AGENT-ENTRY-POINT.md`, `NEXT-SPRINTS.md`, `PROMPTS-TO-COPY.md`, `plan-canaux-de-vente.md`) vivent uniquement en local sur le Mac de Romeo. Un agent sur une autre machine ou un clone frais ne voit pas ces fichiers.

**Décision envisagée puis reportée** : consolidation des 5 fichiers en 1 seul `SPRINT-CURRENT.md` + migration du backlog vers `.claude/queue/`.

**Application différée** : Claude Code lit ces 5 fichiers activement pour le sprint responsive. Les toucher en parallèle casse son flux. Consolidation après merge PR A.

**Décision intermédiaire** : on garde `.claude/work/` gitignored pour l'instant. Quand on consolidera, on décidera si `.claude/work/SPRINT-CURRENT.md` doit être versionné ou pas (probablement pas — c'est éphémère).

**Référence** : `.gitignore` ligne 95 (`.claude/work/`), `docs/scratchpad/audit-config-agent-2026-04-19.md` trou D.1.

---

## ADR-007 — 2026-04-19 — Pattern pilote v2 responsive validé comme standard

**Contexte** : le pilote v1 (commit fc9af2806) a FAIL avec bug React « Rendered more hooks ». Revert propre. Le pilote v2 (commit 51bced9e5 sur `/factures`) a PASS tous les checks runtime.

**Décision** : formaliser le pattern v2 comme standard pour toute migration responsive de liste.

Pattern en 3 fichiers :
- `[Entity]Table.tsx` (~250 L) — orchestrateur `ResponsiveDataView`, zéro hook dans les callbacks `renderCard`/`renderTable`
- `[Entity]MobileCard.tsx` (~200 L) — vrai composant React, toutes les props actions explicites
- `[Entity]Actions.tsx` (~200 L) — `ResponsiveActionMenu` commun desktop+mobile

Règle hooks : tous les hooks au TOP du composant, jamais après early return, jamais dans un if/else, jamais dans un callback passé en prop.

Checklist pré-commit : `wc -l < 400`, `grep w-auto = vide`, `type-check PASS`, `build PASS`, **runtime Playwright PASS** (console 0 erreur aux 5 tailles).

**Conséquence** : le pattern est documenté dans `.claude/playbooks/migrate-page-responsive.md`. Référence canonique : `docs/scratchpad/BO-UI-RESP-LISTS-pilot-v2-template.md`.

**Référence** : commits fc9af2806 (v1 failed), 9a03b16c6 (revert), 51bced9e5 (v2 success).

---

## Contrat pour futurs ADRs

Chaque nouvelle décision structurelle ajoute une entrée ici avec :
- Numéro `ADR-NNN` (séquentiel, pas réutilisable)
- Date au format ISO (`2026-MM-DD`)
- Titre court (une ligne)
- **Contexte** — le problème qu'on résout
- **Décision** — ce qu'on a choisi
- **Conséquence** — ce que ça change concrètement
- **Référence** — commit SHA, scratchpad, ou PR number

Les ADRs ne se modifient pas rétroactivement. Si une décision est renversée, on ajoute un nouveau ADR qui référence l'ancien (« ADR-007 remplace ADR-002 »).

---

## Index rapide

- ADR-001 : Suppression agents expert (2026-04-15)
- ADR-002 : Workflow 1 PR = 1 bloc (2026-04-18)
- ADR-003 : Restructuration `.claude/` en 3 phases (2026-04-19)
- ADR-004 : 4 ajustements (queue 2 dossiers, rules/domain/, test CI, audit agents) (2026-04-19)
- ADR-005 : Suppression writer-agent + market-agent [DIFFÉRÉ] (2026-04-19)
- ADR-006 : `.claude/work/` reste gitignored [DIFFÉRÉ] (2026-04-19)
- ADR-007 : Pattern pilote v2 responsive validé (2026-04-19)
