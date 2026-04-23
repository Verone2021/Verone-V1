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

## ADR-008 — 2026-04-19 — Acceptation T2-only sur 15 composants secondaires

**Contexte** : PR #651 migre 3 pages pilotes avec pattern complet 3-fichiers (factures, fournisseurs, inventaire) + 16 composants en « T2 hidden classes only » (colonnes masquables `hidden lg/xl/2xl:table-cell` sans MobileCard dédiée).

Audit runtime à 375px (`docs/scratchpad/audit-t2-only-375px-2026-04-19.md`) révèle :

- 🟢 4/19 OK (organisation listings avec viewMode grid natif = cards par défaut mobile)
- 🟡 11/19 limite/non-testable (empty states, sections non accessibles)
- 🔴 4/19 KO : expeditions (3 tabs) + CommissionsTable → 1-2 colonnes seulement visibles à 375px, tables inutilisables mobile

T2-only viole formellement T1 de `.claude/rules/responsive.md` ("Sous md, tableau INTERDIT → obligation cartes empilées"). Dette technique explicite.

**Décision** : merger PR #651 avec la dette documentée plutôt que bloquer le merge.

Justifications :

1. Les 3 pages pilotes full (factures, fournisseurs, inventaire) ont pattern complet validé runtime
2. Les 4 organisation listings ont cards natives via viewMode grid (user mobile tombe sur la bonne UI par défaut)
3. Les 4 🔴 concernent des tables admin office (expeditions = logistique staff, commissions = back-office affiliés), pas d'usage mobile terrain critique
4. Bloquer le merge multiplie risque de conflits et retard sur autres sprints. Ticket catch-up incrémental préféré

**Conséquence** :

- PR #651 mergée telle quelle sur staging
- Tâche `.claude/queue/BO-UI-RESP-LISTS-T1-CATCH-UP.md` créée (priority P2, estimated 2h)
- Dette traquée explicitement dans queue, pas perdue dans backlog

**Référence** :

- Audit : `docs/scratchpad/audit-t2-only-375px-2026-04-19.md`
- Screenshots : `.playwright-mcp/screenshots/audit-t2-*-375.png` (7 fichiers)
- Tâche catch-up : `.claude/queue/BO-UI-RESP-LISTS-T1-CATCH-UP.md`
- PR parente : #651

---

## ADR-009 — 2026-04-19 — Cleanup Phase 2 orpheline + suppression agents morts

**Contexte** : audit en session Claude Code (`docs/scratchpad/audit-config-agent-2026-04-19.md` + analyse croisée claude.ai web) révèle que Phase 2 (commits `74bd7b42e` + `cd571e925`) a créé un système auto-référencé fermé :

- `.claude/queue/` (4 fichiers) et `.claude/done/` (1 README) ne sont référencés que par `playbooks/`, `INDEX.md`, et eux-mêmes. **Zéro référence depuis le point d'entrée réel** (CLAUDE.md, ACTIVE.md, apps/\*/CLAUDE.md). Romeo continue d'utiliser `.claude/work/ACTIVE.md` comme source unique → la queue est inutilisée.
- Phase 3 promise (auto-advance-queue, MCP GitHub, `/next-task`) dépendait de la queue → devient caduque.
- `writer-agent.md` + `market-agent.md` : 0 utilisation en 3 mois (audit dans `audit-agents-2026-04-19.md`). Documenté comme « suppression à valider » dans ADR-005 [différé] depuis 2026-04-19 matin.

**Décision** :

1. **Supprimer** `.claude/queue/` + `.claude/done/` (orphelins prouvés).
2. **Supprimer** `.claude/agents/writer-agent.md` + `.claude/agents/market-agent.md` (concrétise ADR-005).
3. **Garder** les 4 playbooks (vrai contenu utile, ~22 KB de recettes) en les ré-ancrant sur `ACTIVE.md` au lieu de queue/done. Référencés depuis `.claude/rules/workflow.md` (nouvelle section Playbooks) pour qu'un agent les trouve réellement.
4. **Garder** `autonomy-boundaries.md`, `DECISIONS.md`, `scripts/check-config-integrity.sh` (utilité confirmée).
5. **Annuler Phase 3** (devenue caduque sans queue).

**Conséquence** :

- 7 fichiers supprimés (`queue/` 4 + `done/` 1 + 2 agents morts).
- Workflow unifié autour de **ACTIVE.md + rules/ + agents/ + playbooks/**, fin de la duplication queue vs ACTIVE.
- `INDEX.md`, `commands/README.md`, `playbooks/README.md`, `playbooks/review-and-merge.md`, `rules/autonomy-boundaries.md`, `rules/workflow.md` mis à jour.
- 2 agents en moins → contexte plus léger pour le coordinateur.

**Référence** : PR `[INFRA-DOC-006]`, branche `feat/INFRA-DOC-006-cleanup-phase2`. Annule en partie ADR-003 (Phase 3) et concrétise ADR-005.

---

## ADR-010 — 2026-04-19 — Restauration ciblée 4 fichiers config supprimés le 15 avril

**Contexte** : grand nettoyage du 2026-04-15 (commits `3160c0f14`, `5fbf9af14`, `f10bf58c0`, `2171a4a7d`) a supprimé 50 fichiers `.claude/` (~6700 lignes). Audit session 2026-04-19 identifie 4 fichiers à restaurer car aucun équivalent dans la config consolidée actuelle.

**Décision** : restaurer 4 fichiers ciblés, laisser les 46 autres supprimés (consolidés correctement).

- `.claude/commands/db.md` (446 l) : slash `/db` pour ops Supabase rapides.
- `.claude/commands/teach.md` (88 l) : slash `/teach` pour mode pédagogique (Romeo novice).
- `.claude/agents/perf-optimizer.md` (386 l) : auditeur perf (zéro remplaçant aujourd'hui).
- `.claude/agent-memory/perf-optimizer/MEMORY.md` (170 l) : mémoire accumulée perf.

**Conséquence** : `perf-optimizer.md` corrigé pour pointer sur les fichiers consolidés actuels (3 chemins + 3 références à `database-architect` → `dev-agent`). INDEX.md et `commands/README.md` mis à jour.

**Référence** : PR `[INFRA-DOC-005]` #653.

---

## ADR-011 — 2026-04-19 — Suppression playbooks génériques (garder migrate-page-responsive seul)

**Contexte** : 4 playbooks créés en Phase 2 (commit `74bd7b42e`) — `migrate-page-responsive`, `fix-bug`, `review-and-merge`, `handle-ci-failure`. Audit révèle :

- `fix-bug.md`, `review-and-merge.md`, `handle-ci-failure.md` : génériques, dupliquent les capacités natives de Claude Code (workflow git, debug, CI). N'apportent aucune valeur Verone-spécifique.
- `migrate-page-responsive.md` : capture la **leçon réelle** du pilote v1 FAIL (commit `fc9af2806`) → bug "Rendered more hooks", revert, fix v2 (commit `51bced9e5`). Valeur unique non-déductible.

**Décision** : supprimer les 3 playbooks génériques + leur `README.md`. Garder uniquement `migrate-page-responsive.md`.

**Conséquence** :

- 4 fichiers en moins (`.claude/playbooks/` passe de 5 fichiers à 1).
- `INDEX.md` section Playbooks réduite à 1 ligne.
- `rules/workflow.md` section Playbooks réduite à 1 ligne (référence migrate-page-responsive uniquement, redirige vers `code-standards.md` + `playwright.md` pour les autres cas).
- Les workflows git/debug/CI = capacités natives Claude Code + règles dans `rules/workflow.md` + `rules/code-standards.md`.

**Référence** : PR `[INFRA-DOC-006]` #654 (amendée). Annule en partie ADR-009 sur l'inventaire des playbooks à garder.

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

## ADR-012 — 2026-04-20 — Règle `playwright-artifacts.md` + nettoyage artefacts

**Contexte** : `.playwright-mcp/` avait accumulé 1857 fichiers (logs jusqu'à 10 MB, screenshots de debug sans convention, un `client-secret-*.json` OAuth Google qui traînait à côté des logs). En parallèle, 34 PNG de debug Playwright polluaient la racine du repo. Aucune règle ne définissait où ranger les screenshots capturés via le MCP Playwright, ni quoi nettoyer périodiquement.

**Décision** : créer `.claude/rules/playwright-artifacts.md` qui sépare trois classes de fichiers (baseline versionnés, runtime éphémère, docs versionnés) et impose un nommage `.playwright-mcp/screenshots/YYYYMMDD/[context]-[description]-[HHmmss].png`. Nettoyer immédiatement les 1857 fichiers (sauf README + dossier screenshots), les 34 PNG racine non versionnés, et `test-results/`.

**Conséquence** : repo racine propre. `.gitignore` déjà correctement configuré (exceptions pour `docs/**/*.png` et `apps/**/public/**/*.png`). Le secret OAuth a été supprimé localement — Romeo doit le révoquer côté Google Cloud Console. Synthèse basée sur les pratiques officielles Playwright + Vercel + Shopify.

**Référence** : session 2026-04-20 avec Romeo. PR `[BO-PACKLINK-001]`.

---

## ADR-013 — 2026-04-22 — Règle « zéro donnée fantôme en prod »

**Contexte** : sur SO-2026-00158, Romeo a découvert une row `sales_order_shipments` créée la veille par un script de sauvetage manuel après échec d'INSERT côté wizard. Cette row avait `packlink_status='a_payer'` et un `packlink_shipment_id='UN2026PRO0001424092'` qui N'EXISTAIT PAS sur Packlink PRO. Le champ `notes` contenait en plus une trace technique : « Sauvetage manuel 2026-04-22: wizard a créé le shipment Packlink mais a échoué sur INSERT DB (bug useShipmentWizard:425-438 à corriger dans sprint BO-BUG-SHIPMENT-001) ». Quand Romeo cliquait « Payer », il atterrissait sur une page Packlink vide. Rupture de confiance complète.

**Décision** :

1. Créer `.claude/rules/no-phantom-data.md` qui interdit absolument toute injection de donnée non-réelle en production (rows fantômes, statuts cosmétiques, ids fictifs, notes techniques dans colonnes utilisateur).
2. Référencer la règle dans `CLAUDE.md` racine section INTERDICTIONS ABSOLUES en première position (gravité maximale).
3. Référencer dans la table SOURCES DE VERITE de CLAUDE.md.
4. Compléter par une mémoire user `feedback_no_phantom_data_in_prod.md` (4 questions garde-fou avant tout write prod).
5. Supprimer la row fantôme de SO-2026-00158 après vérification que le trigger `handle_shipment_deletion` fait un early-return safe pour `packlink_status='a_payer'` (zéro side-effect stock).

**Conséquence** : tout agent futur qui aurait l'instinct de "rattraper" un état cassé via INSERT manuel doit s'arrêter et fixer le code, pas la donnée. Le code source des règles est désormais dans le repo (visible aux agents qui n'ont pas la mémoire user). Le pattern « rescue script » reste possible uniquement après accord explicite Romeo, sans aucune trace technique laissée en DB.

**Référence** : incident 2026-04-22, branche `fix/INFRA-RULE-NO-PHANTOM-DATA`.

---

## ADR-014 — 2026-04-23 — Hygiène scratchpad : extension cleanup + auto-invocation + promotion refs

**Contexte** : audit session Cowork (rapport `docs/scratchpad/audit-2026-04-23-scratchpad-hygiene-proposal.md`) révèle que `docs/scratchpad/` accumule 131 fichiers depuis début avril parce que :

1. Le script `.claude/scripts/cleanup-scratchpad.sh` n'est jamais invoqué automatiquement (aucun hook dans `settings.json` ni `.husky/post-merge`).
2. Il ne couvre que 6 préfixes sur les 15 utilisés en pratique. Non couverts : `rapport-*`, `bug-*`, `fix-*`, `handoff-*`, `plan-*`, `diagnostic-*`, `cleanup-*`, `CLAUDE-*proposed*`, `BO-UI-RESP-*` (hors standard).
3. Deux fichiers de référence permanente (`BO-UI-RESP-LISTS-pilot-v2-template.md` cité par ADR-007, `automation-roadmap.md` cité par `.claude/INDEX.md`) vivaient dans scratchpad au lieu de `docs/current/`, ce qui les exposait à l'archivage automatique.
4. 4 doublons INDEX à la racine du repo (ACTIVE.md, DEPENDANCES-PACKAGES.md, INDEX-COMPOSANTS-FORMULAIRES.md, INDEX-PAGES-BACK-OFFICE.md) gitignored mais induisaient les agents en erreur (les canoniques sont dans `.claude/work/` et `docs/current/`).

La convention plate du scratchpad (réaffirmée dans `docs/scratchpad/README.md` et les 4 agents) reste valable — c'est le flux d'hygiène qui est cassé.

**Décision** :

1. Étendre `cleanup-scratchpad.sh` pour couvrir 13 préfixes au total (5 pipeline + 8 secondaires) avec archivage 14 jours. Ajouter alerte sur préfixes non-standards et élargir la liste des candidats promotion (audit, post-mortem, protocole, decision, dette, coherence, documentation).
2. Ajouter un hook `PostToolUse` dans `.claude/settings.json` qui invoque `cleanup-scratchpad.sh` après `Bash(gh pr merge*)` ET `Bash(git push*)`.
3. Promouvoir 2 fichiers de référence permanente :
   - `docs/scratchpad/BO-UI-RESP-LISTS-pilot-v2-template.md` → `docs/current/responsive/pilot-v2-template.md`
   - `docs/scratchpad/automation-roadmap.md` → `docs/current/automation-roadmap.md`
4. Déplacer 2 `stitch-*.md` depuis la racine du scratchpad vers `docs/scratchpad/stitch/` (cohérence avec les `.png` déjà dans ce sous-dossier).
5. Réécrire `docs/scratchpad/README.md` pour documenter les 15 préfixes autorisés, les 3 préfixes interdits, le cycle de vie complet, et le rôle de `stitch/` et `archive/`.
6. Supprimer les 4 doublons INDEX à la racine du repo (gitignored) et renforcer `.gitignore` avec les patterns explicites pour bloquer leur retour.
7. Mettre à jour les références dans `.claude/INDEX.md` (sections Scripts et Scratchpad) et `.claude/playbooks/migrate-page-responsive.md` (ligne 5 et référence dans « Triple lecture »).

**Conséquence** :

- `cleanup-scratchpad.sh` passe d'une couverture 6/15 préfixes à 13/15 (2 restent en alerte : CLAUDE-\* et préfixes non-standards).
- Le scratchpad s'auto-nettoie après chaque merge et chaque push. Fin du dump permanent.
- Les 2 références permanentes sortent du scratchpad — fin du conflit éphémère vs canonique.
- `docs/scratchpad/README.md` devient une vraie source de vérité (148 lignes contre 28 avant) au lieu d'une ébauche partielle.
- Les 4 agents (`dev`, `reviewer`, `verify`, `ops`) ne sont PAS modifiés — leur convention d'écriture reste plate.
- `ADR-007` continue de citer le template — le chemin a changé, pas l'autorité canonique.

**Référence** : rapport scratchpad `docs/scratchpad/audit-2026-04-23-scratchpad-hygiene-proposal.md`. Branche `feat/INFRA-DOC-014-scratchpad-hygiene`. PR `[INFRA-DOC-014]`.

---

## ADR-015 — 2026-04-23 — Interdit absolu : l'agent ne demande jamais à Romeo de vérifier sur un site externe

**Contexte** : sur plusieurs sessions récentes (Packlink reverse engineering, debug Vercel, vérifications Supabase), l'agent a régulièrement demandé à Romeo de se connecter à une interface web (dashboard Vercel, Packlink PRO, Supabase Studio, GitHub UI) pour vérifier un état, cliquer sur un bouton, lire un log. Romeo est novice, non-technique côté UI développeur. Chaque sollicitation externe génère friction, perte de temps, et surtout une érosion progressive de sa santé et de sa confiance dans le workflow. Le 2026-04-23 Romeo a explicitement signalé : « sa santé a été mise en jeu ». Cette règle ne peut plus attendre.

**Décision** :

1. Créer `.claude/rules/agent-autonomy-external.md` qui interdit absolument toute sollicitation de Romeo pour une vérification sur un service externe. L'agent utilise CLI (`vercel`, `gh`, `supabase` MCP) ou MCP Playwright pour toute interaction UI nécessaire.
2. Documenter pour chaque plateforme (Vercel, Packlink, Qonto, Supabase, GitHub) la liste exhaustive des outils disponibles et des credentials déjà configurés (`.env.local`, `.claude/test-credentials.md`).
3. Inscrire la règle en deuxième position dans la section INTERDICTIONS ABSOLUES de `CLAUDE.md` racine (juste après `no-phantom-data`).
4. Ajouter une ligne « Autonomie externe » dans la table SOURCES DE VERITE de `CLAUDE.md` racine.
5. Règle d'or : si une demande contient « va voir », « clique », « vérifie que », « configure sur », « teste depuis », « connecte-toi à », « ouvre le dashboard » — l'agent **ne répète jamais ces verbes à Romeo**, il exécute lui-même et rapporte le résultat avec preuve (log, screenshot, JSON).

**Conséquence** :

- L'agent gagne en autonomie totale sur les interactions externes.
- Romeo ne valide plus que le résultat final, jamais les étapes intermédiaires.
- Credentials centralisés : `.env.local` pour API, `.claude/test-credentials.md` pour UI.
- Complémentaire de `no-phantom-data.md` (ADR-013) : les deux protègent Romeo — santé, temps, confiance.
- `.claude/rules/agent-autonomy-external.md` créé (150 lignes).
- `CLAUDE.md` racine mis à jour (2 endroits).
- Aucune modification des agents existants (`dev-agent`, `reviewer-agent`, etc.) — la règle est transversale et lue automatiquement via le dossier `.claude/rules/`.

**Référence** : session Cowork 2026-04-23. Branche `fix/INFRA-RULE-AGENT-AUTONOMY`. PR `[INFRA-RULE-014]`.

---

## Index rapide

- ADR-001 : Suppression agents expert (2026-04-15)
- ADR-002 : Workflow 1 PR = 1 bloc (2026-04-18)
- ADR-003 : Restructuration `.claude/` en 3 phases (2026-04-19) — _Phase 3 annulée par ADR-009_
- ADR-004 : 4 ajustements (queue 2 dossiers, rules/domain/, test CI, audit agents) (2026-04-19) — _queue annulée par ADR-009_
- ADR-005 : Suppression writer-agent + market-agent [DIFFÉRÉ] (2026-04-19) — _appliqué par ADR-009_
- ADR-006 : `.claude/work/` reste gitignored [DIFFÉRÉ] (2026-04-19)
- ADR-007 : Pattern pilote v2 responsive validé (2026-04-19)
- ADR-008 : Acceptation T2-only sur 15 composants secondaires (2026-04-19)
- ADR-009 : Cleanup Phase 2 orpheline + suppression agents morts (2026-04-19)
- ADR-010 : Restauration 4 fichiers config supprimés le 15 avril (2026-04-19)
- ADR-011 : Suppression playbooks génériques (garder migrate-page-responsive seul) (2026-04-19)
- ADR-012 : Règle `playwright-artifacts.md` + nettoyage 1857 artefacts Playwright (2026-04-20)
- ADR-013 : Règle `no-phantom-data.md` après incident sauvetage manuel SO-00158 (2026-04-22)
- ADR-014 : Hygiène scratchpad (extension cleanup + auto-invocation + promotion refs) (2026-04-23)
- ADR-015 : Interdit absolu de solliciter Romeo pour vérifier sur un site externe (2026-04-23)
- ADR-016 : E2E smoke tests bloquants en CI + runtime guards contre les régressions silencieuses (2026-04-24)

---

## ADR-016 — Durcissement CI pour détecter les régressions runtime (2026-04-24)

**Contexte** : audit 15 jours révèle 30+ régressions concrètes en production
alors que la CI `quality.yml` était verte à chaque merge. Cause : la CI
actuelle vérifie uniquement ESLint + Type-Check + Build. Elle ne détecte pas :

- SELECT SQL qui oublie un champ → TS ne sait pas ce qui est fetché runtime.
- FK DB modifiée hors migration → la CI ne touche pas la base.
- Fragment React sans key, useEffect infini, key prop warning → ignoré.
- Props TS optionnels non propagés → TS accepte `undefined`.
- Workflow UI cassé (bouton qui n'apparaît plus, modal qui plante) →
  aucun test automatisé ne l'exerce.

**Décision** :

1. **Gate E2E smoke bloquant en CI** (`.github/workflows/quality.yml`) :
   - Nouveau job `e2e-smoke` qui run après `quality`, requis pour merger.
   - Run seulement si `back-office` ou `packages` changent.
   - 2 specs : `smoke-finance-modals.spec.ts`, `smoke-critical-workflows.spec.ts`.
   - Échec = PR bloquée + commentaire automatique + Playwright report uploadé.

2. **ConsoleErrorCollector étendu** (`tests/fixtures/base.ts`) :
   - Capture `console.error` + warnings React critiques (`key prop`,
     `Maximum update depth`, `Rendered more hooks`, `Hydration failed`).
   - Les smoke tests font `expectNoErrors()` sur chaque page.

3. **Runtime guards dans les composants à risque**
   (`quote-input-guards.ts`) :
   - Détecte `enseigne_id`, `customer_id` absents au moment du render.
   - Log `console.error` avec pointeur sur le consumer fautif.
   - Attrapé par les smoke tests → casse la PR.
   - Pattern à étendre aux autres modals critiques (facture, rapprochement).

4. **Report à ADR-017** : builder central `buildOrderForFinanceModal` dans
   `@verone/orders` pour supprimer les 6 reconstructions ad-hoc. Sprint
   dédié après stabilisation (coût plus élevé, impact fort).

**Secrets GitHub requis** (à configurer par Romeo dans Settings → Secrets) :

- `E2E_TEST_EMAIL` : email du compte de test back-office (peut être
  `veronebyromeo@gmail.com` existant, ou un compte `test@verone.fr` dédié).
- `E2E_TEST_PASSWORD` : mot de passe associé.

**Impact CI** : +5 à 8 minutes par run (build + start + 15 tests smoke).
Acceptable contre le coût des régressions silencieuses.

**Effet attendu** : 50% des 30 régressions listées dans l'audit auraient été
détectées par ces smoke tests. Les régressions DB-level (FK drift) restent
invisibles — script `db-drift-check.py` prévu pour ADR-018.

**Référence** : commit `[INFRA-HARDENING-001]`, branche
`feat/infra-hardening-001`. Suite de `[BO-FIN-041]` (fixes des 3 régressions
déclenchantes : SIRET enseigne_id, delete cancelled order, Fragment key).
