# Automation roadmap — rendre l'agent autonome

**Base** : `audit-config-agent-2026-04-19.md` + `plan-restructuration-config.md`
**Scope** : intégrations externes (GitHub, MCP, Claude Code settings) qui permettent à l'agent de travailler sans Romeo sur son périmètre feu-vert.
**Prérequis** : Phase 1 + Phase 2 du plan de restructuration mergées.

---

## Pourquoi cet axe existe

Même avec une config parfaitement restructurée, l'agent reste dépendant de Romeo s'il n'a pas les **signaux** pour savoir quand agir et s'il n'a pas les **actions** pour s'exécuter sans intervention humaine. C'est ce que les équipes d'outillage chez Stripe / Linear / Shopify appellent le **plumbing** — la tuyauterie invisible qui permet au bot de ne pas être une marionnette.

Objectif : **Romeo ne donne que des missions**. Le reste (choisir la tâche, coder, reviewer, créer la PR, attendre la CI, reporter) doit se faire sans son intervention.

---

## 1. GitHub Actions — workflows à ajouter

### 1.1 — `auto-review.yml` — lance reviewer-agent sur chaque PR

**Trigger** : `pull_request.opened` et `pull_request.synchronize` (nouveau commit poussé).

**Comportement** :

- Un job CI exécute la logique du `reviewer-agent` (à extraire en script réutilisable).
- Poste un commentaire sur la PR avec le verdict PASS / FAIL / PASS_WITH_WARNINGS + détails.
- Si FAIL : ajoute le label `review-failed` sur la PR.

**Ce que ça résout** : actuellement Romeo doit lancer `/review` manuellement avant d'autoriser la PR. Oubli fréquent. En automatisant, le feedback arrive en 2-3 minutes sans action humaine.

**Référence industrie** : GitHub Copilot PR Review, CodeRabbit, Codemagic. Ils font exactement ce pattern.

**Implémentation** :

```yaml
name: Auto Review
on:
  pull_request:
    types: [opened, synchronize]
    branches: [staging]

jobs:
  reviewer-agent:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - name: Run reviewer-agent logic
        run: |
          # Appeler un script node/python qui :
          # 1. git diff origin/staging...HEAD
          # 2. Applique les 4 axes de reviewer-agent.md
          # 3. Écrit un verdict dans /tmp/review.md
          bash .claude/scripts/ci-reviewer.sh
      - name: Comment PR
        uses: marocchino/sticky-pull-request-comment@v2
        with:
          path: /tmp/review.md
```

**Effort** : 2-3h (le plus long = extraire la logique du reviewer-agent en script CI).

### 1.2 — `auto-advance-queue.yml` — déplace la tâche après merge

**Trigger** : `pull_request.closed` avec `merged == true`.

**Comportement** :

- Parse le titre/body de la PR pour extraire les Task IDs (`[BO-UI-RESP-001]`).
- Pour chaque Task ID :
  - Déplace le fichier de `.claude/queue/02-IN-PROGRESS/` vers `.claude/queue/03-DONE/`
  - Met à jour le YAML frontmatter (`status: done`, `merged_at`, `pr_number`)
  - Commit "chore: mark [TASK-ID] as done" sur staging
- Si la tâche avait des `depends_on`, déverrouille les tâches bloquées et poste un commentaire sur la PR : "Next available tasks: X, Y, Z"

**Ce que ça résout** : l'agent n'a plus besoin de se rappeler de mettre à jour ACTIVE.md après un merge. C'est le système qui le fait.

**Effort** : 2h.

### 1.3 — `e2e-smoke.yml` — tests Playwright minimaux en CI

**Trigger** : `pull_request` vers staging.

**Comportement** : lance un sous-ensemble de tests Playwright (les "smoke tests") sur les 3 apps. Bloque la PR si rouge.

Actuellement : aucun test E2E en CI (confirmé par audit 17/04). Playwright installé mais uniquement en local. Risque de régression non détecté.

**Périmètre minimal** (à définir avec Romeo, mais une base raisonnable) :

- `apps/back-office` : login + dashboard + créer une SO simple
- `apps/linkme` : login affilié + voir une sélection
- `apps/site-internet` : homepage + ajout panier

**Durée cible** : < 5 min total (sinon les devs finiront par `--no-verify`).

**Effort** : 3-4h (le plus long = rendre les tests déterministes en CI avec fixtures).

### 1.4 — `config-integrity-check.yml` — détecte la dérive config

**Trigger** : `push` vers toute branche + `schedule` hebdomadaire.

**Comportement** : exécute `scripts/check-claude-config-paths.sh` (créé en Phase 1.E du plan). Vérifie que tous les chemins cités dans `CLAUDE.md`, `.claude/**`, `apps/*/CLAUDE.md` existent réellement.

Si un chemin est cassé : issue créée automatiquement avec le label `config-drift`.

**Ce que ça résout** : le problème principal identifié dans l'audit — la dérive silencieuse. Un agent humain ou IA peut casser un chemin sans s'en rendre compte. Ce workflow attrape ça en moins d'une minute.

**Effort** : 1-2h.

### 1.5 — `scratchpad-archive.yml` — nettoie les scratchpads anciens

**Trigger** : `schedule` hebdomadaire (dimanche nuit).

**Comportement** : déplace les fichiers de `docs/scratchpad/` de plus de 30 jours vers `docs/scratchpad/archive/YYYY-MM/`. Évite que le dossier explose (il est déjà à 28 fichiers en 3 jours).

`scratchpad-cleanup.yml` existe déjà. À vérifier / ajuster son comportement.

**Effort** : 0.5h (ajustement d'un workflow existant).

### 1.6 — `pr-title-linter.yml` — force le format des titres PR

Assure que chaque titre de PR respecte `[APP-DOMAIN-NNN] type: description` ou `[BLOC-NAME] description`. Bloque sinon.

Le hook `commit-msg` valide déjà les commits locaux — mais une PR sur GitHub peut être créée avec un titre libre qui ignore la convention. À fermer ce trou.

**Effort** : 0.5h.

---

## 2. GitHub Webhooks — notifications entrantes

Les webhooks permettent à Claude Code (via un serveur intermédiaire comme une Lambda/Cloud Function) d'être notifié d'événements GitHub sans polling.

### 2.1 — Webhook `pull_request.review.submitted`

Quand Romeo (ou un autre reviewer) soumet une review :

- Si `state == 'approved'` → agent peut promouvoir la PR de draft à ready
- Si `state == 'changes_requested'` → agent lit les commentaires, priorise les fixes, annonce à Romeo "j'ai vu X commentaires, je traite"

### 2.2 — Webhook `check_run.completed`

Quand la CI termine :

- Si `conclusion == 'failure'` → agent lit les logs, propose un fix ou signale à Romeo
- Si `conclusion == 'success'` ET PR draft → agent peut passer à ready (selon config autonomy)

### 2.3 — Webhook `issues.opened` (si issues utilisées)

Quand une issue est créée :

- Auto-triage : parser le titre/body pour extraire domaine, app, priorité
- Créer le fichier correspondant dans `.claude/queue/01-TODO/` avec YAML frontmatter pré-rempli

**Note** : cette automation nécessite un serveur permanent qui écoute les webhooks. Option minimale : Vercel Serverless Function ou Cloudflare Worker qui appelle l'API Claude ou déclenche un workflow GitHub Actions.

**Effort total webhooks** : 4-6h (infra + logique). À considérer **uniquement si** Phase 1/2 stabilisées.

---

## 3. MCP Servers — à activer ou ajouter

### 3.1 — Déjà actifs (listés dans `settings.json`)

| MCP                            | Usage actuel                              |
| ------------------------------ | ----------------------------------------- |
| `context7`                     | Docs bibliothèques tierces à jour         |
| `playwright-lane-1` / `lane-2` | Deux profils Chrome pour tests visuels    |
| `shadcn`                       | Registre composants UI                    |
| `supabase`                     | Accès DB (execute_sql, list_tables, etc.) |

Bon setup. Rien à toucher.

### 3.2 — À ajouter en priorité

**`mcp-github`** — accès aux issues, PRs, commentaires, labels, workflows.

Permet à l'agent de :

- Lire les commentaires de PR pour prioriser les fixes
- Créer des issues pour les TODO découverts
- Vérifier le statut CI d'une PR avant de la promouvoir
- Lister les PRs ouvertes + leurs conflits (remplace le besoin du script `check-open-prs.sh`)

**Installation** : MCP officiel GitHub, ajouter à `settings.json`.

**Effort** : 0.5h.

### 3.3 — À évaluer selon le workflow

| MCP                              | Intérêt                                                             | Effort | Prérequis                                 |
| -------------------------------- | ------------------------------------------------------------------- | ------ | ----------------------------------------- |
| **Linear MCP**                   | Si Romeo veut piloter depuis Linear. Sinon, `.claude/queue/` suffit | 1h     | Compte Linear payant (~8€/user/mois)      |
| **Notion MCP**                   | Si la doc business est dans Notion                                  | 0.5h   | Compte Notion                             |
| **Sentry MCP**                   | Agent surveille les erreurs prod, triage auto                       | 1h     | Compte Sentry (gratuit jusqu'à 5k events) |
| **Vercel MCP**                   | Lire logs déploiements, statuts                                     | 0.5h   | Token Vercel (existe déjà)                |
| **Slack MCP** ou **Discord MCP** | Notifier Romeo sur mobile quand validation nécessaire               | 1h     | Webhook Slack/Discord                     |

**Recommandation** : commencer par `mcp-github` (obligatoire) + `Sentry MCP` (surveillance prod = énorme gain). Reste en fonction des besoins.

### 3.4 — MCPs à ne PAS activer

- `mcp__supabase__apply_migration` — déjà en `deny` dans `settings.json`. Garder.
- `mcp__supabase__create_branch` / `merge_branch` — idem.
- Tout MCP qui donne accès en écriture aux emails, paiements, envois physiques.

Principe de **moindre privilège** : l'agent reçoit les autorisations dont il a besoin, rien de plus.

---

## 4. Commandes slash à ajouter dans `.claude/commands/`

Commandes slash = raccourcis pour l'agent + Romeo. Actuellement 4 existent (`/search`, `/review`, `/pr`, `/status`). À ajouter :

### 4.1 — `/next-task` (priorité haute)

Comportement : lit `.claude/queue/01-TODO/` (trié par priorité), affiche la 1ère tâche, propose :

```
Prochaine tâche dispo :
[BO-UI-RESP-002] Audit global 250+ pages responsive (P1, 4h)
Playbook : audit-global

Veux-tu que je la prenne ?
```

Si oui : déplace le fichier dans `02-IN-PROGRESS/`, lit le playbook, démarre.

**Effort** : 1h.

### 4.2 — `/ship` (priorité haute)

Comportement : enchaîne

1. `git add -A`
2. Commit avec Task ID auto-détecté
3. Push
4. Si critères remplis (voir autonomy-boundaries.md FEU VERT) : crée PR draft

Différence avec `/pr` actuel : `/pr` fait toute la chaîne review+validation. `/ship` est plus souple pour le feu vert.

**Effort** : 1h.

### 4.3 — `/promote` (priorité moyenne)

Promeut la PR actuelle de draft à ready. FEU ORANGE dans autonomy-boundaries : demande confirmation laconique.

**Effort** : 0.5h.

### 4.4 — `/rollback` (priorité moyenne)

Revient à l'état avant le dernier merge. Utilise `git revert` pour générer un commit de revert + crée immédiatement une PR de rollback.

Ce qu'il NE fait PAS : `git reset --hard` sur staging (trop dangereux).

**Effort** : 1h.

### 4.5 — `/queue` (priorité basse)

Affiche l'état de la queue : combien en TODO, IN-PROGRESS, DONE, BLOCKED. Top 5 TODO par priorité.

**Effort** : 0.5h.

### 4.6 — `/unblock` (priorité basse)

Liste les tâches en `04-BLOCKED/`, affiche la raison, propose des actions (contacter Romeo ? dépendance résolue ?).

**Effort** : 0.5h.

---

## 5. Hooks à ajuster dans `.claude/settings.json`

### 5.1 — SessionStart : charger la prochaine tâche

Ajouter à la chaîne SessionStart existante un hook qui :

1. Exécute `.claude/scripts/next-task.sh`
2. Affiche : "Prochaine tâche dispo dans la queue : [BO-UI-RESP-002]. Veux-tu la prendre ?"

Bénéfice : l'agent démarre chaque session avec une direction claire, pas en lisant 500 lignes d'ACTIVE.md.

### 5.2 — PreToolUse : bloquer modifications `.claude/` hors autorisations

Actuellement rien ne bloque la modification de `.claude/rules/*`. Ajouter :

```json
{
  "matcher": "Edit(**/.claude/config/**) || Edit(**/CLAUDE.md) || Edit(**/PROTECTED_FILES.json)",
  "hooks": [
    {
      "type": "command",
      "command": "echo 'BLOQUE: .claude/config/ et CLAUDE.md nécessitent ordre explicite de Romeo. Voir .claude/config/autonomy-boundaries.md FEU ROUGE.'; exit 1"
    }
  ]
}
```

Exception : Romeo lui-même peut bypass via `settings.local.json`.

### 5.3 — PostToolUse : auto-update queue après merge

Après chaque `gh pr merge` réussi, exécuter `.claude/scripts/queue-advance.sh` qui déplace la tâche dans `03-DONE/`.

### 5.4 — UserPromptSubmit : détecter si prompt "hors queue"

Si Romeo envoie un prompt qui ne correspond à aucune tâche de la queue, un hook peut proposer : "Cette demande n'est pas dans la queue. Créer une tâche [APP-DOMAIN-NNN] ou traitement ponctuel ?"

---

## 6. Workflow de queue automatique — flux complet

Voici le flux idéal post-restructuration :

```
┌────────────────────────────────────────────────────────────┐
│  Romeo : "Continue le sprint responsive"                   │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│  Agent lance /next-task                                    │
│  → sort BO-UI-RESP-002 (Audit global) de la queue         │
│  → déplace dans 02-IN-PROGRESS/                            │
│  → lit le playbook audit-global.md                         │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│  Agent exécute l'audit (autonomie feu vert)                │
│  → Triple lecture                                          │
│  → génère docs/scratchpad/audit-responsive-global-*.md    │
│  → commit + push sur feat/responsive-foundation            │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│  Critère de fin atteint (livrable scratchpad écrit)        │
│  → agent PROMEUT Task status: review-needed                │
│  → demande à Romeo : "Audit livré. OK pour attaquer        │
│    Bloc B (migration) ?"                                   │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
                Romeo : "OK"
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│  Agent /next-task à nouveau                                │
│  → BO-UI-RESP-003 maintenant disponible                    │
│  → applique playbook migrate-page-responsive               │
│  → itère sur les pages du Bloc B                           │
│  → commit/push après chaque groupe                         │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│  Bloc B fonctionnellement complet                          │
│  → agent crée PR DRAFT (feu vert)                          │
│  → auto-review.yml déclenche                               │
│  → reviewer-agent commente PASS ou FAIL                    │
└────────────────────────┬───────────────────────────────────┘
                         │                PASS
                         ▼
┌────────────────────────────────────────────────────────────┐
│  Agent demande : "PR prête. Promouvoir en ready ?"         │
│  → Romeo : "ok"                                            │
│  → /promote                                                │
│  → attend CI + validation Romeo pour merge                 │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
                   Romeo merge
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│  auto-advance-queue.yml déclenche                          │
│  → tâches du Bloc B migrées en 03-DONE/                    │
│  → commentaire PR : "Next available: BO-UI-RESP-006"       │
└────────────────────────────────────────────────────────────┘
```

**Temps d'interaction Romeo** : ~3 confirmations courtes ("OK", "ok", merge). Tout le reste automatisé.

---

## 7. Budget effort total

| Phase d'automation                | Effort | Priorité        | Dépendances                   |
| --------------------------------- | ------ | --------------- | ----------------------------- |
| `auto-review.yml`                 | 2-3h   | **Haute**       | Phase 1+2 finies              |
| `auto-advance-queue.yml`          | 2h     | **Haute**       | Phase 2 finie (queue)         |
| `config-integrity-check.yml`      | 1-2h   | **Haute**       | Phase 1 finie                 |
| `e2e-smoke.yml`                   | 3-4h   | Moyenne         | Tests Playwright maintenus    |
| `pr-title-linter.yml`             | 0.5h   | Basse           | —                             |
| `scratchpad-archive.yml`          | 0.5h   | Basse           | —                             |
| MCP GitHub                        | 0.5h   | **Haute**       | —                             |
| MCP Sentry                        | 1h     | Moyenne         | Compte Sentry                 |
| `/next-task`                      | 1h     | **Haute**       | Phase 2                       |
| `/ship`                           | 1h     | Moyenne         | Phase 2                       |
| `/promote` + `/rollback`          | 1.5h   | Basse           | Phase 2                       |
| `/queue` + `/unblock`             | 1h     | Basse           | Phase 2                       |
| Hook SessionStart ajusté          | 0.5h   | **Haute**       | Phase 2 + `/next-task`        |
| Hooks PreToolUse ajustés          | 0.5h   | Moyenne         | Phase 2 + autonomy-boundaries |
| Webhooks GitHub (infra + logique) | 4-6h   | Basse (phase 2) | Infra serveur                 |

**Total priorité haute** : ~9-12h
**Total priorité moyenne** : ~7-9h
**Total priorité basse** : ~7-9h

---

## 8. Ordre d'exécution recommandé

Après Phase 1 + 2 du plan de restructuration :

**Sprint d'automation 1** (1 semaine réel) — priorité haute uniquement :

1. MCP GitHub activé
2. `config-integrity-check.yml`
3. `auto-review.yml`
4. `/next-task` + hook SessionStart ajusté
5. `auto-advance-queue.yml`

Avec ça, l'agent est déjà très autonome sur son périmètre feu-vert.

**Sprint d'automation 2** (1 semaine réel) — priorité moyenne : 6. `e2e-smoke.yml` 7. MCP Sentry 8. `/ship` + hooks PreToolUse ajustés

**Sprint d'automation 3** (optionnel, selon usage) — priorité basse : 9. `/promote`, `/rollback`, `/queue`, `/unblock` 10. `pr-title-linter.yml` 11. Webhooks GitHub (si workflow scale)

---

## 9. Signaux de succès

Comment savoir que l'automation fonctionne :

- **Romeo intervient moins de 5 fois par sprint responsive** (actuellement : ~15-20)
- **Temps entre "mission donnée" et "PR mergée" divisé par 2**
- **Zéro dérive config** (config-integrity-check.yml reste vert)
- **PRs ne restent pas en attente de review > 24h** (auto-review immédiat)
- **L'agent ne demande plus "qu'est-ce que je fais ensuite ?"** — il regarde la queue tout seul

---

## 10. Signaux d'alerte

À surveiller après chaque palier :

- Si l'agent **ignore** la queue et improvise ses tâches → revoir le prompt d'entrée
- Si des PRs passent automatiquement avec `reviewer-agent PASS` mais cachent des bugs → durcir les checks du reviewer-agent OU ajouter une étape humaine obligatoire
- Si Romeo est surchargé de notifications Slack/Discord → filtrer, ne notifier que les cas FEU ORANGE et FEU ROUGE

---

## Références industrie

Ce qui est proposé ici n'est pas une invention. C'est l'application de patterns qui tournent en prod chez :

- **Vercel** : auto-merge bots, Vercel Bot qui commente chaque PR avec preview URL + statut CI
- **Stripe** : "yolo" bot qui auto-merge après 2 approbations + CI verte, rollback bot
- **Linear** : agent qui consomme les issues depuis une queue, sync bidirectionnel GitHub↔Linear
- **Shopify** : CodeOwners + auto-review obligatoire par sous-agent "shopify-bot-reviewer"
- **GitHub Copilot** : Copilot pour PR review génère automatiquement un résumé + flags
- **CodeRabbit** : agent commercial qui fait exactement l'auto-review proposé en 1.1

Ce qui les différencie de nous aujourd'hui : ils ont tous une **queue de tâches machine-lisible** au cœur de leur workflow. C'est la brique qui manque le plus à Verone.

---

**Fin des 3 livrables**. Voir résumé exécutif dans le prochain message de Claude.
