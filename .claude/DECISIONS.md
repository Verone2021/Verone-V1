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
- ADR-018 : Script `db-drift-check.py` contre le drift silencieux de schéma DB (2026-04-24)
- ADR-022 : Bundling thématique obligatoire pour PRs liées (2026-04-28)
- ADR-023 : Multi-agent workflow — branche tôt, push draft, rebase précoce, worktree (2026-04-30)

---

## ADR-018 — Détecter le drift de schéma DB vs migrations (2026-04-24)

**Contexte** : le 2026-04-24, on a découvert que la FK
`financial_documents.sales_order_id` était `ON DELETE RESTRICT` en DB alors
que la migration d'origine (`20251222_012_create_financial_tables.sql:222`)
la définissait comme `fk_sales_order … ON DELETE SET NULL`. Aucune migration
versionnée ne trace ce changement. La FK a donc été modifiée manuellement
(probablement via le SQL Editor de Supabase Studio). Conséquence : impossible
de supprimer une commande annulée liée à des devis soft-deletés (incident
SO-2026-00165 Pokawa Avignon, corrigé dans PR #743).

La règle `.claude/rules/database.md` exige pourtant :

> Ne JAMAIS éditer une migration existante (append-only)
> TOUJOURS exécuter `python3 scripts/generate-docs.py --db` après chaque migration

Cette règle est respectée POUR les migrations versionnées. Mais rien
n'empêche une modification directe en DB qui contourne tout le workflow.

**Décision** : créer `scripts/db-drift-check.py` qui :

1. Parse toutes les migrations `supabase/migrations/*.sql` et extrait pour
   chaque couple `(table, colonne)` la dernière règle `ON DELETE` déclarée.
2. Interroge la DB live (`information_schema.referential_constraints`)
   pour récupérer les règles actuellement en vigueur.
3. Compare et retourne :
   - `ON DELETE mismatch` : la DB diverge de la migration.
   - `Undeclared FK` : une FK existe en DB sans aucune migration qui la
     déclare.
   - `Missing FK` : une FK déclarée dans une migration est absente de la DB.
4. Exit code non-zéro si drift → bloque la CI si ajouté comme gate.

**Usage** :

```bash
# Local (avec DATABASE_URL en .env.local)
python3 scripts/db-drift-check.py

# CI
SUPABASE_DB_URL=... python3 scripts/db-drift-check.py --ci
```

**Impact** :

- **Immédiat** : on peut détecter les drifts existants (au moins celui de
  `financial_documents.sales_order_id`).
- **Préventif** : chaque nouvelle modif manuelle silencieuse sera attrapée
  au prochain run.
- **Hebdomadaire** en premier lieu (cron GitHub Actions) pour ne pas
  ralentir chaque PR ; promotion en gate bloquant une fois le backlog de
  drifts existants nettoyé.

**Non-décidé pour l'instant** : que faire des drifts existants détectés ?
Deux choix possibles, à arbitrer par Romeo :

- **A** — Aligner la DB sur la migration d'origine (créer une migration
  `ALTER TABLE … DROP CONSTRAINT … ADD CONSTRAINT … ON DELETE SET NULL`).
- **B** — Déclarer la nouvelle intention dans une migration rétroactive
  (`… ON DELETE RESTRICT`) si le RESTRICT était voulu.

**Référence** : `scripts/db-drift-check.py`. Branche
`feat/infra-hardening-001`. Suite de ADR-016.

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

---

## ADR-019 — 2026-04-24 — INFRA-HARDENING-002/003 : filet smoke exhaustif + drift DB + types + advisors

**Contexte** : suite d'ADR-016 (smoke CI gate initial) et ADR-018 (drift
check). L'audit 2 semaines avait révélé que 50 % des régressions passaient
sous le radar de la CI. Il fallait (1) étendre le filet smoke au-delà de 15
tests, (2) activer le drift DB comme gate bloquant après nettoyage du
backlog, (3) automatiser les best practices Supabase officielles (types
regen, security advisors).

**Décisions** :

### INFRA-HARDENING-002 (PR #750, mergée staging 2026-04-24)

1. 7 fichiers smoke thématiques (`smoke-{stock,commandes,finance,linkme,canaux,produits,contacts}.spec.ts`) = 53 tests interactifs. Pattern ADR-016 strict (`domcontentloaded` + `SETTLE_MS=800`, pas de `networkidle`).
2. Suppression `smoke-all-modules.spec.ts` (doublon intégral avec `smoke-147-pages.spec.ts`).
3. Migration `20260424_001_retrofit_legacy_fk_declarations.sql` : retrofit 94 FK UNDECLARED + 3 MISMATCH alignés live. Idempotente (DROP IF EXISTS + ADD CONSTRAINT). Appliquée sur DB prod.
4. Parser `db-drift-check.py` durci : strip commentaires SQL + filtre `BASE TABLE` (exclut VIEWs) + blacklist mots-clés SQL.
5. Gate CI `db-drift-check` bloquant (sans `continue-on-error`).
6. Cron hebdo `.github/workflows/db-drift-cron.yml` (lundi 06h UTC) : ouvre/ferme auto une issue GitHub sur drift détecté.

### INFRA-HARDENING-003 (PR #751, mergée staging 2026-04-24)

1. Fix paths-filter `quality.yml` : ajoute `tests/**`, `playwright.config.ts` au filtre `back-office`. Smoke tourne désormais sur toute PR modifiant les specs (gap observé PR #750).
2. Nouveau filtre `migrations` + job `supabase-types-drift` bloquant : regénère `packages/@verone/types/src/supabase.ts` via `supabase gen types typescript --db-url` et échoue sur diff.
3. Job `supabase-advisors-security` informational (non-bloquant) : appelle Supabase Management API `/v1/projects/{ref}/advisors/lints?type=security`, compare au baseline `scripts/supabase-advisors-baseline.json` (97 issues figées), comment PR avec delta.

### Sources (best practices officielles)

- Supabase types : https://supabase.com/docs/reference/cli/supabase-gen-types
- Supabase advisors : https://supabase.com/docs/guides/database/database-advisors
- API advisors : https://supabase.com/docs/reference/api/v1-list-project-lints-types

### Secrets GitHub Actions requis

Configurés le 2026-04-24 via Playwright :

- `SUPABASE_DB_URL` (postgresql://...pooler.supabase.com:5432/postgres) — utilisé par drift + types
- `SUPABASE_ACCESS_TOKEN` (PAT `sbp_...`) — utilisé par advisors
- `SUPABASE_PROJECT_REF` (`aorroydfjsrygmosnzrl`) — utilisé par advisors

### Conséquence

- 67 tests smoke bloquants (vs 14 avant — x4.8) couvrant les 7 rubriques critiques.
- Gate drift DB empêche toute modification de schéma hors migration.
- Gate types drift empêche toute migration sans régénération des types.
- Monitoring hebdo automatique, issue GitHub auto.

### Recommandations explicitement non-retenues

- **Lighthouse CI / visual regression / dead code detection** : cargo cult au stade actuel, coût maintenance > bénéfice.
- **Auto-PR release staging → main hebdo** : non une best practice universelle, dépend du workflow équipe. À activer si bruit acceptable.

**Référence** : PR #750, #751 et suite (Dependabot + auto-release + release staging→main).

---

## ADR-020 — 2026-04-24 — INFRA-HARDENING-004/005 + branch protection + retour d'expérience SSR crash

**Contexte** : suite et fin de la série INFRA-HARDENING (ADR-019). Extension
avec Dependabot, auto-release hebdo, retry du release prod après régression
SSR découverte en production.

### INFRA-HARDENING-004 (PR #752, mergée staging)

- `.github/dependabot.yml` : bumps npm hebdo groupés minor/patch + github-actions mensuel.
- `.github/workflows/auto-release-staging-to-main.yml` : cron lundi 06h UTC ouvrant/maj la release PR si staging ahead.
- Fix endpoint Supabase advisors : `/v1/projects/{ref}/advisors/security` (pas `/advisors/lints`). User-Agent explicite vs Cloudflare 1010.

### INFRA-HARDENING-005 (PR #754, mergée staging)

- Fix types drift gate CI : `pnpm install` complet pour résoudre `@verone/prettier-config` + prettier format sur le fichier régénéré avant diff. Sans ça : 30000 lignes de faux positif à chaque run.
- Fix smoke-produits selector : `a[href*='/produits/catalogue/']` avec exclusions des sous-routes (categories, collections, etc.) + assertion URL `not.toHaveURL(/catalogue$/)` au lieu de regex UUID.
- **Smoke tests durcis** (leçon régression SSR du 24/04) : 3 assertions contenu ajoutées sur les tests 'détail' des 3 rubriques critiques (produits, commandes, linkme) :
  - `body text !== 'Page introuvable'`
  - `body text !matches /^404/m`
  - `getByRole('tab').first()` visible

### Branch protection rules (2026-04-24, activée via `gh api`)

- **main** : `required_status_checks.strict=true`, contexts = ESLint+Type-Check+Build, DB FK drift, E2E Smoke, Supabase TS types drift. `enforce_admins=true` (admin ne peut PAS bypasser).
- **staging** : mêmes contexts. `enforce_admins=false` (urgence autorisée).
- Sans ces règles, tous les gates CI étaient contournables par un merge direct.

### Secrets Supabase configurés (Playwright → GitHub Settings)

- `SUPABASE_DB_URL` — drift + types drift
- `SUPABASE_ACCESS_TOKEN` (PAT existant dans `.env.local`)
- `SUPABASE_PROJECT_REF` = `aorroydfjsrygmosnzrl`

### Régression SSR prod — retour d'expérience

Pendant la session, la release staging→main #749 (15:51 UTC) a propagé en
prod ~15 commits incluant la refonte des 7 onglets produit. Résultat :
`/produits/catalogue/[productId]` a renvoyé **404** en prod, alors que :

- Le fichier `page.tsx` existe sur main
- Le build Vercel inclut la route (40.8 kB output)
- Aucun `notFound()` n'est appelé dans le code

Signature HTTP : `x-matched-path: /_not-found`, `x-next-error-status: 404`.
→ Crash runtime SSR silencieux. Next.js bascule sur le fallback `/_not-found`.

**Rollback appliqué** : `vercel promote <njqx4dcu9-url>` vers le déploiement
d'hier (22:14 UTC) qui fonctionnait. Prod rétablie HTTP 200 immédiatement.

**Pourquoi mes smoke tests initiaux n'ont pas attrapé le bug** : ils ne
testaient que l'URL (`not.toHaveURL(/catalogue$/)`). Or en cas de 404 SSR,
Next.js sert le contenu `/_not-found` **mais l'URL reste sur
`/produits/catalogue/UUID`** → l'assertion passait vert alors que la page
était cassée.

**Fix** : assertions contenu dans INFRA-HARDENING-005 (cf. ci-dessus).

**Investigation root cause** : à faire dans un sprint séparé (décision
Romeo 2026-04-24). Le code fautif fait partie des ~15 commits poussés entre
yesterday 22:14 et today 15:51. Bisection git recommandée, ou déploiement
progressif onglet par onglet.

### Référence CI finale — état au 2026-04-24

| Gate                            |   Blocking    | Déclenché sur                                 |
| ------------------------------- | :-----------: | --------------------------------------------- |
| ESLint + Type-Check + Build     |      ✅       | chaque PR (apps/back-office, packages, tests) |
| E2E Smoke Playwright (67 tests) |      ✅       | apps/back-office, packages, tests             |
| DB FK drift check               |      ✅       | chaque PR et push                             |
| Supabase TS types drift         |      ✅       | changements supabase/migrations ou types.ts   |
| Supabase security advisors      | Informational | chaque PR                                     |
| Vercel preview deploy           |      ✅       | main push                                     |

Monitoring hebdo : cron DB drift (lundi), Dependabot (lundi),
auto-release staging→main (lundi).

**Référence** : PR #750, #751, #752, #753 (release), #754 (fixes post-release).

---

## ADR-021 — 2026-04-26 — Architecture programme ambassadeurs site-internet

**Statut** : Accepté
**Décideur** : Romeo
**Référence** : `docs/scratchpad/audit-2026-04-26-ambassadeurs-architecture.md`

### Contexte

Le système ambassadeurs B2C site-internet a été créé en avril 2026 (PR #583 [SI-AMB-001]) sur un modèle "profil ambassadeur séparé" : table `site_ambassadors` distincte de `individual_customers`, avec son propre `auth_user_id` et ses propres workflows BO. 0 ambassadeurs en production à ce jour.

Romeo veut refondre pour aligner avec son modèle métier : **un client est un compte unique ; "ambassadeur" est juste une option qu'il peut activer**. Audit complet livré, benchmark industrie 2026 (Refersion, Shopify Collabs, Awin, Amazon Associates) effectué.

### Décisions tranchées

| #   | Sujet                                    | Décision                                                                                                                                                                                                      |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Modèle de données                        | **Refacto** `site_ambassadors` → flag `is_ambassador` + colonnes `ambassador_*` sur `individual_customers`. Drop table séparée.                                                                               |
| D2  | Système de niveaux                       | **Pas de tiers** au lancement. Flat rate par défaut + custom override par ambassadeur (champ `commission_rate`). Tiers introduits éventuellement >30 ambassadeurs actifs.                                     |
| D3  | Base de calcul commission                | **HT après remise** (standard industrie 2026). Verone le fait déjà via `orderHt = finalTtc / 1.20`. Documenter en CGU.                                                                                        |
| D4  | Lien sans code promo                     | **Ambassadeur tracé via cookie, pas de réduction client.** Si client oublie de saisir le code mais a cliqué sur le lien d'affiliation, l'ambassadeur reçoit sa prime mais le client paye plein tarif.         |
| D5  | Durée cookie tracking                    | **30 jours** (déjà en place dans `apps/site-internet/src/middleware.ts`). Standard e-commerce.                                                                                                                |
| D6  | Notification email                       | **Email à chaque gain** (après webhook Stripe paid) + opt-out via toggle dans paramètres ambassadeur. Vision Romeo R6.                                                                                        |
| D7  | Onboarding ambassadeur                   | **Double entrée** : (a) self-service client via toggle dans `/compte/ambassadeur`, (b) admin BO peut activer un client existant ou créer un client+ambassadeur direct (envoi email avec password temporaire). |
| D8  | URL pages ambassadeur                    | `/ambassadeur` reste **dashboard public partagé** (KPIs, codes, history). Nouvelle section `/compte/ambassadeur` pour les **paramètres** (toggle, taux, IBAN, opt-in notifs).                                 |
| D9  | Workflow paiement                        | **SEPA manuel** + UI BO "Marquer payé" avec date virement + référence. Email auto à l'ambassadeur. Intégration Qonto API plus tard si volume justifie.                                                        |
| D10 | Bug 404 BO `/canaux-vente/site-internet` | **À fixer en priorité (PR 0)** avant tout sprint ambassadeur. Sans BO admin fonctionnel, impossible d'administrer la feature.                                                                                 |
| D11 | Règle d'attribution conflictuelle        | **Le code saisi gagne** sur le cookie (action explicite > tracking implicite). Si client visite via lien Ambassadeur A puis saisit code Ambassadeur B au checkout, B est attribué.                            |
| D12 | Seuil minimum retrait prime              | **20 €** (override Romeo de la recommandation 50€ de la CGU page site). Aligner les CGU site et BO sur 20€.                                                                                                   |

### Plan d'exécution (6 PRs séquentielles)

| PR         | Branche                                    | Scope                                        | FEU                       |
| ---------- | ------------------------------------------ | -------------------------------------------- | ------------------------- |
| **PR 0**   | `fix/canaux-vente-site-internet-route-404` | Investiguer + fixer 404 BO prod              | VERT                      |
| **PR 0.5** | `test/ambassador-baseline-e2e`             | Tests E2E filet de sécurité avant migration  | VERT                      |
| **PR A**   | `feat/ambassador-customer-unification`     | Migration DB unification client/ambassadeur  | **ROUGE** (migration SQL) |
| **PR B**   | `feat/ambassador-link-tracking-completion` | Tracking lien sans code + email gain         | VERT                      |
| **PR C**   | `feat/ambassador-ui-unification`           | UI client `/compte/ambassadeur` + refonte BO | ORANGE (>5 fichiers)      |
| **PR D**   | `feat/ambassador-payout-workflow`          | Workflow paiement primes BO                  | VERT                      |

### Conséquences

**Positives** :

- Modèle CRM unifié (un client = un compte = potentiellement aussi ambassadeur)
- Self-onboarding client (réduit la charge admin, aligné avec Refersion/Shopify Collabs)
- Tracking dual (code + lien) déjà en place côté DB et middleware → juste à compléter côté checkout
- Calcul commission conforme standard 2026 (déjà en place)

**Risques** :

- Migration DB sur table avec FK existantes (mitigé par 0 records)
- RLS à reconcevoir sur `individual_customers` (pattern Verone connu)
- Tests E2E manquants → PR 0.5 obligatoire avant PR A

**À documenter** :

- ADR séparé si Verone décide d'introduire les tiers (D2 phase 2)
- Mise à jour CGU site (seuil retrait 20€ vs 50€ actuel)
- Mise à jour CGU ambassadeur (mention HT après remise)

### Sources benchmark

- [Refgrow — Affiliate Commission Structures](https://refgrow.com/blog/affiliate-commission-structures-guide)
- [Influence Flow — Multi-Tier Affiliate 2026](https://influenceflow.io/resources/mastering-multi-tier-affiliate-commission-structures-in-2026/)
- [iRev — Server-Side Tracking 2026](https://irev.com/blog/cookieless-affiliate-tracking-what-actually-works-in-2026/)
- [Refersion Shopify](https://www.refersion.com/partners/shopify/)
- [Shopify Affiliate Apps Comparison (Hulkapps)](https://www.hulkapps.com/blogs/compare/shopify-affiliate-program-apps-refersion-affiliate-marketing-vs-shopify-collabs)

---

## ADR-022 — Bundling thématique obligatoire pour PRs liées (2026-04-28)

**Contexte** : le 27-28 avril 2026, Romeo a enchaîné 3 demandes liées à la section Canaux de Vente du back-office :

1. Fix bug Meta : page `/canaux-vente/meta` affichait compteurs 30/28/2 mais liste vide (RPC `get_meta_commerce_products` plantait après drop colonnes `custom_*` du 21 avril).
2. "Tu corriges Google Merchant" : 2 onglets fantômes dans channel-tabs.tsx (`/flux` + `/sync` → 404).
3. "Tu corriges Site Internet" : 1 onglet fantôme (`/site-internet/commandes` → 404).

L'agent a interprété "L'un après l'autre" comme "1 PR par sujet" et créé **4 PRs** :

- PR #822 [BO-CHAN-META-001] (fix Meta)
- PR #823 [BO-CHAN-GOOGLE-002] (fix Google)
- PR #824 [BO-CHAN-SITE-002] (fix Site)
- PR #826 [BO-CHAN-META-001 types-drift] (rattrapage régen types — la PR #822 avait omis la régénération `pnpm run generate:types` après modif de RPC)

Plus la PR release staging→main #825 qui a fail une fois (drift TS) et a dû être re-run après merge #826.

**Coût total** : ~1h50 de cycles CI (4 PRs staging + 1 PR main fail + 1 PR rattrapage + 1 PR main re-run) vs ~25 min estimés pour un bundle propre `[BO-CHAN-CLEANUP-001]` avec 4 commits.

Romeo a explicitement critiqué : _"Mais tu te rends compte, le temps que ça prend ? Pour faire 4 PR ça prend 1h20."_ puis : _"il faut vraiment que tu corriges cela dans tout ce qui est réalisation de PR"_.

La règle `1 PR = 1 BLOC COHÉRENT` existait déjà dans `.claude/rules/workflow.md` mais sans cas concret d'incident pour la rendre vivante. La règle de régénération des types après migration n'existait nulle part de manière explicite.

**Décision** :

1. Renforcer `CLAUDE.md` racine section INTERDICTIONS ABSOLUES avec 2 nouvelles interdictions :
   - "JAMAIS 1 PR par sous-tâche quand plusieurs fixes sont thématiquement liés"
   - "JAMAIS migration SQL sans régénération des types dans la même PR"
2. Renforcer `.claude/rules/workflow.md` avec une section "Incident 2026-04-28" qui documente :
   - Le cas concret
   - La règle "détecter le bundling potentiel à la 2e demande"
   - La règle "toujours bundler la régénération TS dans la PR de migration"
   - La règle "détection systématique des onglets fantômes"
3. Renforcer `.claude/rules/branch-strategy.md` avec une 4e question dans la checklist : "Le sujet touche-t-il un RPC, une fonction DB, ou une colonne ?" → si oui, inclure régen types dans la même PR.
4. Documenter dans cet ADR.

**Conséquences** :

- Tout futur agent, même sans la mémoire de cette session, lira ces règles à chaque démarrage et appliquera le bundling correct.
- La 2e demande liée déclenche un push back senior automatique de l'agent : "Vu que [Y] suit [X] dans le même domaine, je mets sur la même branche en 2 commits, 1 seule PR. OK ?"
- Toute migration SQL touchant un RPC/fonction/colonne déclenche `pnpm run generate:types` dans la même branche AVANT le push.
- Le coût de cet incident (1h50 de Romeo perdues) ne se reproduira plus.

**Trace** :

- 4 PRs concernées : #822, #823, #824, #826 (toutes mergées sur staging)
- Release : PR #825 (mergée sur main 2026-04-28 00:42:35 UTC après 2 cycles CI)
- 3 fichiers `.claude/` modifiés dans la même session : `CLAUDE.md`, `workflow.md`, `branch-strategy.md`

**Référence** :

- `CLAUDE.md` racine section INTERDICTIONS ABSOLUES
- `.claude/rules/workflow.md` section "Incident 2026-04-28"
- `.claude/rules/branch-strategy.md` checklist question 4

---

## ADR-023 — Multi-agent workflow : branche tôt, push draft, rebase précoce, worktree (2026-04-30)

**Contexte** : Romeo travaille régulièrement avec plusieurs agents Claude Code en parallèle (sessions différentes, ou un agent qui dispatche un sous-agent via Agent tool). Il observe que ces sessions multi-agents génèrent des conflits récurrents qui lui font perdre une demi-journée chaque fois (cycle CI 30 min + rebase manuel + retry).

L'audit (cette session 2026-04-30) révèle :

1. **Mémoires perso codifiées, mais pas dans le repo** — 4 mémoires en `~/.claude/projects/.../memory/` (`feedback_rebase_first_branch_early.md`, `feedback_stacked_prs_and_blocking_checks.md`, `feedback_multi_agent_scope.md`, `feedback_multi_agent_use_worktree.md`) couvrent exactement la pratique senior 2026. Mais elles sont attachées à une session/agent — quand Romeo lance un autre agent ou un nouveau Claude Code, il ne les lit pas. Les autres agents ne lisent que `CLAUDE.md` + `.claude/rules/*`.

2. **Lacunes dans `.claude/rules/`** :
   - `git worktree` pour multi-agents non documenté nulle part
   - Rebase précoce mentionné en passant ("rebase régulier") mais sans timing ni pourquoi
   - Push draft immédiat non explicité (la règle disait "PR draft quand bloc complet")
   - Stacked PRs (B depuis A) absents
   - Section `## Fichiers touchés` dans PR description absente
   - Anti-pattern « j'attends l'autre agent » non interdit explicitement

3. **Incident 2026-04-30** : pendant cette session, l'agent allait faire `git fetch && git checkout staging && git pull --rebase` dans le working dir partagé alors qu'un autre agent travaillait dessus sur sa propre branche. Romeo a interrompu : `git checkout staging` aurait viré l'autre agent de sa branche au milieu de son travail. Romeo a aussi mergé 3 PRs avec `--admin` la veille pour bypasser un drift TS, ce qui a propagé un faux signal en prod.

**Décision** :

1. **Créer `.claude/rules/multi-agent-workflow.md`** (~310 lignes, source de vérité unique). Codifie la pratique senior 2026 :
   - Branche créée IMMÉDIATEMENT depuis `staging` à jour, push draft tout de suite
   - Rebase précoce avant chaque push (réflexe toutes les 1-2h), pas une fois en fin de bloc
   - `git worktree add` OBLIGATOIRE en multi-agents (autre agent dans working dir partagé)
   - Sous-agent (Agent tool) : `isolation: "worktree"` systématique en multi-agents
   - Stacked PRs (B depuis A) si dépendance forte
   - Section `## Fichiers touchés` en haut de chaque PR description (visibilité multi-agents)
   - `git push --force-with-lease` jamais `--force` nu
   - Fix CI blocking par commit atomique sur même branche, JAMAIS `--admin`
   - INTERDIT explicite : « j'attends que l'autre agent finisse »

2. **Mettre à jour les fichiers existants** pour pointer vers le nouveau et compléter les anti-patterns :
   - `CLAUDE.md` racine (table SOURCES DE VERITE + section WORKFLOW GIT + INTERDICTIONS ABSOLUES)
   - `.claude/rules/workflow.md` (pointer + section Rebase précoce + Push draft immédiat)
   - `.claude/rules/branch-strategy.md` (5e question dans la checklist : « autre agent en parallèle ? »)
   - `.claude/rules/autonomy-boundaries.md` (`git worktree add` en FEU VERT, `--force` nu et `git checkout` en working dir partagé en FEU ROUGE)
   - `.claude/INDEX.md` (liste Rules passe à 14 fichiers)
   - `.claude/agents/dev-agent.md` (workflow inclut branche+push draft immédiat, anti-pattern « j'attends » interdit)
   - `.claude/agents/ops-agent.md` (workflow standard mis à jour avec rebase précoce, push draft, worktree, fichiers touchés, jamais `--admin`)
   - `.claude/commands/pr.md` (rebase précoce dans Phase 2, section Fichiers touchés dans body, draft par défaut, `--force-with-lease`)

3. **Documenter dans cet ADR** la pratique senior 2026 et les sources externes (trunk-based development DORA/Accelerate, Phabricator/Graphite stacked PRs Meta, Git worktree natif depuis 2.5 en 2015, GitHub branch protection rules avec enforce_admins).

**Conséquences** :

- Tout futur agent (humain Claude Code, sous-agent dev-agent, etc.), même sans accès aux mémoires perso, lira ces règles à chaque démarrage et appliquera le workflow senior. Fin des conflits récurrents qui faisaient perdre une demi-journée à Romeo.
- Le tool Agent avec `isolation: "worktree"` devient le default en multi-agents (au lieu d'une option ignorée).
- `--admin` est désormais INTERDIT ABSOLU codifié dans 4 fichiers (rules + agents + CLAUDE.md), pas juste en mémoire perso.
- La pratique « branche tôt » remplace l'anti-pattern « j'attends », qui apparaissait régulièrement quand un agent était poliment en train de proposer d'attendre la fin d'une release main.
- L'incident 2026-04-30 ne se reproduit plus : l'agent qui voit qu'un autre agent travaille fait `git worktree add` automatiquement.

**Trace** :

- 9 fichiers modifiés dans la même session :
  - `CLAUDE.md` (4 sections)
  - `.claude/rules/multi-agent-workflow.md` (CRÉÉ)
  - `.claude/rules/workflow.md` (3 sections)
  - `.claude/rules/branch-strategy.md` (3 sections)
  - `.claude/rules/autonomy-boundaries.md` (3 sections)
  - `.claude/INDEX.md` (2 sections)
  - `.claude/agents/dev-agent.md` (2 sections)
  - `.claude/agents/ops-agent.md` (5 sections)
  - `.claude/commands/pr.md` (4 sections)
  - `.claude/DECISIONS.md` (cet ADR)

**Sources externes (best practices senior 2026)** :

- Trunk-based development : DORA reports, _Accelerate_ (Forsgren/Humble/Kim, IT Revolution Press)
- Stacked PRs : Phabricator (Meta), Graphite, Reviewable
- Git worktree : Git 2.5 (2015), https://git-scm.com/docs/git-worktree
- Branch protection rules : https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository
- `--force-with-lease` vs `--force` : https://git-scm.com/docs/git-push
- Anthropic Claude Code Agent tool : `isolation: "worktree"` natif

**Référence** : session 2026-04-30 avec Romeo, audit complet `.claude/` puis codification.
