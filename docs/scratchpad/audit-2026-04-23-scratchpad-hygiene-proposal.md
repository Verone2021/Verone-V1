# Audit + proposition — Hygiène scratchpad et archivage

**Date** : 2026-04-23
**Auteur** : coordinateur (session Cowork Claude Desktop)
**Scope** : `docs/scratchpad/` et archivage — PAS de refonte structurelle
**Statut** : proposition à valider par Roméo avant toute exécution

---

## TL;DR

La convention Verone existe déjà, elle est correcte, et **je ne propose PAS de la changer**. Le problème n'est pas la structure (plate par design, c'est l'intention) — le problème est que **le système d'hygiène automatique n'est jamais déclenché et ne couvre pas tous les préfixes utilisés**. Résultat : 131 fichiers empilés à plat depuis avril.

Je propose 7 optimisations ciblées, aucune ne casse l'existant.

---

## 1. Ce que j'ai lu (sources de vérité consultées)

| Fichier                                                                               | Ce qu'il établit                                                                                                                                                                        |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/scratchpad/README.md`                                                           | Convention de nommage `{type}-YYYY-MM-DD.md` + 5 types canoniques (dev-plan, dev-report, review-report, verify-report, deploy-report) + règle « après merge, archiver ou supprimer »    |
| `.claude/README.md` ligne 22                                                          | Pipeline officiel : `dev-plan → dev-report → review-report → verify-report → deploy-report`                                                                                             |
| `.claude/INDEX.md` sections Scratchpad + Scripts                                      | Liste les scratchpads notables + liste les scripts maintenance                                                                                                                          |
| `.claude/DECISIONS.md` (ADR-001 à ADR-013)                                            | Historique des décisions structurelles. Prochain numéro libre : ADR-014                                                                                                                 |
| `.claude/scripts/cleanup-scratchpad.sh`                                               | Script archivage existant : 14 jours pour les 5 types pipeline, 30 jours pour session-_, 90 jours purge définitive. Alerte promotion pour audit-_/post-mortem-_/protocole-_/decision-\* |
| `.claude/agents/dev-agent.md` ligne 26, 29                                            | Écrit `docs/scratchpad/dev-plan-{date}.md` et `dev-report-{date}.md`                                                                                                                    |
| `.claude/agents/reviewer-agent.md` ligne 93                                           | Écrit `docs/scratchpad/review-report-{date}.md`                                                                                                                                         |
| `.claude/agents/verify-agent.md` ligne 28                                             | Écrit `docs/scratchpad/verify-report-{date}.md`                                                                                                                                         |
| `.claude/agents/ops-agent.md` ligne 75                                                | Lit `docs/scratchpad/review-report-{date}.md` avant merge, écrit deploy-report                                                                                                          |
| `.claude/agents/perf-optimizer.md` ligne 50                                           | Écrit `docs/current/perf/audit-YYYY-MM-DD.md` (PAS dans scratchpad)                                                                                                                     |
| `.claude/playbooks/migrate-page-responsive.md` ligne 146                              | Écrit `dev-report-[date]-[task-id].md`                                                                                                                                                  |
| `.claude/rules/autonomy-boundaries.md`                                                | Feu rouge sur `.claude/agents/`, `.claude/rules/`, `.claude/scripts/`, `CLAUDE.md`                                                                                                      |
| `.claude/settings.json`                                                               | 14 hooks PreToolUse + 2 PostToolUse. Aucun ne touche à docs/scratchpad                                                                                                                  |
| `scripts/generate-docs.py`                                                            | Génère `docs/current/INDEX-*.md`, `DEPENDANCES-PACKAGES.md`, etc.                                                                                                                       |
| `docs/README.md`                                                                      | Liste les docs canoniques dans `docs/current/`                                                                                                                                          |
| `apps/back-office/CLAUDE.md`, `apps/linkme/CLAUDE.md`, `apps/site-internet/CLAUDE.md` | Pas de convention scratchpad spécifique app                                                                                                                                             |

---

## 2. Ce qui fonctionne et ne doit PAS être touché

**La structure plate est INTENTIONNELLE.** Preuves :

- Le README scratchpad énumère 5 types nommés à plat, sans sous-dossier.
- Les 4 agents (dev, reviewer, verify, ops) sont configurés pour écrire à plat.
- Le script cleanup utilise `find -maxdepth 1` — il ne regarde QUE la racine du scratchpad.
- Les playbooks pointent vers `docs/scratchpad/dev-report-{date}.md` sans sous-dossier.

Conclusion : tout changement vers des sous-dossiers thématiques (ce que j'avais proposé avant — design-docs/, work-logs/, etc.) casserait 4 agents, 1 script, 1 README, 1 playbook, et les ADRs futurs. **C'était une mauvaise piste. Je l'abandonne.**

---

## 3. Ce qui ne fonctionne pas (diagnostic précis)

### Problème A — Le script d'archivage n'est jamais invoqué automatiquement

`.claude/scripts/cleanup-scratchpad.sh` a un header qui dit « Lance automatiquement apres merge PR (hook post-merge) ». Or :

- `.claude/settings.json` a 14 hooks PreToolUse + 2 PostToolUse
- AUCUN de ces hooks n'appelle `cleanup-scratchpad.sh`
- Il n'y a pas non plus de hook `.husky/post-merge` qui le ferait

Résultat : le script n'est lancé QUE si Roméo le lance à la main (il ne le fait pas). Donc aucune archive depuis son écriture.

### Problème B — Le script ne couvre que 6 préfixes sur les 15 utilisés en pratique

Inventaire actuel des préfixes à plat dans `docs/scratchpad/` :

| Préfixe                | Exemples                                             | Nb fichiers | Géré par cleanup ?                  |
| ---------------------- | ---------------------------------------------------- | ----------- | ----------------------------------- |
| `dev-plan-*`           | dev-plan-2026-04-22-BO-UI-PROD-CHAR-001.md           | 28          | OUI (archive 14j)                   |
| `dev-report-*`         | dev-report-2026-04-21-BO-FIN-023-sprint1.md          | 42          | OUI (archive 14j)                   |
| `review-report-*`      | review-report-BO-FIN-019-2026-04-18.md               | 8           | OUI (archive 14j)                   |
| `verify-report-*`      | (aucun ce mois-ci)                                   | 0           | OUI                                 |
| `deploy-report-*`      | (aucun ce mois-ci)                                   | 0           | OUI                                 |
| `session-*`            | session-nocturne-2026-04-18.md                       | 1           | OUI (archive 30j)                   |
| `audit-*`              | audit-config-agent-2026-04-19.md                     | 25          | NON (alerte promotion seulement)    |
| `rapport-*`            | rapport-2026-04-23-packlink-bug-pour-claude-haiku.md | 2           | **NON**                             |
| `bug-*`                | bug-expedition-code-fantome-2026-04-16.md            | 3           | **NON**                             |
| `fix-*`                | fix-proforma-orphelines-2026-04-16.md                | 2           | **NON**                             |
| `handoff-*`            | handoff-2026-04-21-product-detail-tabs-redesign.md   | 2           | **NON**                             |
| `plan-*` (sans "dev-") | plan-restructuration-config.md                       | 3           | **NON**                             |
| `diagnostic-*`         | diagnostic-trigger-s2026-04-17.md                    | 1           | **NON**                             |
| `cleanup-*`            | cleanup-report-2026-04-16.md                         | 1           | **NON**                             |
| `dette-*`              | dette-technique-2026-04-17.md                        | 1           | **NON**                             |
| `coherence-*`          | coherence-documentaire-2026-04-17.md                 | 1           | **NON**                             |
| `documentation-*`      | documentation-manquante-2026-04-17.md                | 1           | **NON**                             |
| `protocole-*`          | protocole-smoke-tests-stock-complet.md               | 1           | alerte promotion                    |
| `automation-*`         | automation-roadmap.md                                | 1           | **NON**                             |
| `CLAUDE-*`             | CLAUDE-md-proposed-v2.md                             | 1           | **NON**                             |
| `BO-UI-RESP-LISTS-*`   | BO-UI-RESP-LISTS-pilot-v2-template.md                | 2           | **NON**                             |
| `stitch-*`             | stitch-redesign-site-internet-prompt-2026-04-17.md   | 2           | **NON** (devrait être dans stitch/) |

**89 des 131 fichiers sont hors patterns gérés par le cleanup**. Ils restent à plat pour toujours.

### Problème C — Les audits restent en scratchpad alors qu'ils sont promus manuellement

Le script alerte mais ne déplace pas `audit-*`. Aucun outil n'automatise la promotion vers `docs/current/`. Roméo devrait décider au cas par cas, mais il n'est pas alerté (le script n'est jamais lancé — cf. problème A).

### Problème D — 4 fichiers INDEX dupliqués à la racine du repo

`git status` montre 4 fichiers untracked à la racine du repo :

- `ACTIVE.md` (11762 bytes, mtime 2026-04-23 00:59)
- `DEPENDANCES-PACKAGES.md` (4192 bytes)
- `INDEX-COMPOSANTS-FORMULAIRES.md` (75069 bytes)
- `INDEX-PAGES-BACK-OFFICE.md` (20521 bytes)

Les VRAIS sont :

- `.claude/work/ACTIVE.md` (canonique, pointé par CLAUDE.md et hooks)
- `docs/current/DEPENDANCES-PACKAGES.md` (canonique, pointé par docs/README.md)
- `docs/current/INDEX-COMPOSANTS-FORMULAIRES.md` (canonique, pointé partout)
- `docs/current/INDEX-PAGES-BACK-OFFICE.md` (canonique, pointé par docs/README.md)

Ce sont des **doublons obsolètes** à la racine, probablement crées par erreur par une session antérieure (peut-être une ancienne version de `generate-docs.py` ou un `cp` manuel). Ils sont gitignored (ne polluent pas le repo) mais induisent les agents en erreur (`Read /CLAUDE.md` a touché le doublon au lieu du vrai plus tôt dans cette session).

### Problème E — `stitch-*.md` à plat au lieu du dossier `stitch/`

2 fichiers `stitch-redesign-*.md` sont à la racine du scratchpad alors qu'un dossier `stitch/` existe (utilisé pour les `.png`). Convention incohérente.

### Problème F — Fichiers de référence permanents mélangés aux fichiers éphémères

- `BO-UI-RESP-LISTS-pilot-v2-template.md` est cité par ADR-007 comme « référence canonique du pattern v2 ». C'est un template permanent, pas un scratchpad éphémère. Il devrait vivre dans `docs/current/responsive/`.
- `automation-roadmap.md` est cité par `.claude/INDEX.md` comme référence. Pareil, permanent.

Ces fichiers ne devraient pas être archivés après 14 jours — ils devraient être PROMUS vers `docs/current/` et ne plus apparaître en scratchpad.

---

## 4. Proposition — 7 optimisations ciblées

### Optimisation O1 — Étendre `cleanup-scratchpad.sh` pour couvrir tous les préfixes Verone

**Changement ciblé** dans `.claude/scripts/cleanup-scratchpad.sh` section « 1. ARCHIVE », ajouter à la liste des patterns :

```bash
for pattern in \
  "dev-plan-*" "dev-report-*" "verify-report-*" "review-report-*" "deploy-report-*" \
  "rapport-*" "bug-*" "fix-*" "handoff-*" "plan-*" "diagnostic-*" \
  "cleanup-*" "dette-*" "coherence-*" "documentation-*" "CLAUDE-*proposed*"
do
```

Cut-off identique (14 jours). Les audits restent en alerte promotion (pas archivés tant que Roméo n'a pas décidé).

**Impact** : 89 fichiers → gérés. Le script devient exhaustif.

### Optimisation O2 — Auto-invocation du cleanup après merge et après push

**Ajouter dans `.claude/settings.json`** section `hooks.PostToolUse` :

```json
{
  "matcher": "Bash(gh pr merge*) || Bash(git push*)",
  "hooks": [
    {
      "type": "command",
      "command": "bash $CLAUDE_PROJECT_DIR/.claude/scripts/cleanup-scratchpad.sh"
    }
  ]
}
```

**Impact** : le cleanup tourne automatiquement après chaque merge et après chaque push. Roméo n'a rien à faire.

### Optimisation O3 — Nettoyage one-shot immédiat

Lancer le cleanup amélioré UNE fois après O1 pour archiver les fichiers actuellement > 14 jours. Création de `docs/scratchpad/archive/2026-04/` et déplacement d'environ 70-80 fichiers.

**Impact** : scratchpad passe de 131 à ~50-60 fichiers actifs.

### Optimisation O4 — Promouvoir les 2 références permanentes vers `docs/current/`

Déplacer :

- `docs/scratchpad/BO-UI-RESP-LISTS-pilot-v2-template.md` → `docs/current/responsive/pilot-v2-template.md`
- `docs/scratchpad/automation-roadmap.md` → `docs/current/automation-roadmap.md`

Mettre à jour les références dans `.claude/INDEX.md`, `.claude/DECISIONS.md` (ADR-007), `.claude/playbooks/migrate-page-responsive.md`.

**Impact** : fin de l'ambiguïté référence permanente vs éphémère. `ADR-007` et le playbook pointent vers le bon endroit.

### Optimisation O5 — Supprimer les 4 doublons INDEX à la racine du repo

Supprimer :

- `/ACTIVE.md` (racine repo) — doublon de `.claude/work/ACTIVE.md`
- `/DEPENDANCES-PACKAGES.md` (racine) — doublon de `docs/current/`
- `/INDEX-COMPOSANTS-FORMULAIRES.md` (racine) — doublon de `docs/current/`
- `/INDEX-PAGES-BACK-OFFICE.md` (racine) — doublon de `docs/current/`

Gitignored donc zéro impact git. Ajouter dans `.gitignore` les patterns explicites pour éviter qu'ils reviennent (si un script les régénère par erreur) :

```gitignore
# Doublons root des INDEX (canonical dans docs/current/ et .claude/work/)
/ACTIVE.md
/DEPENDANCES-PACKAGES.md
/INDEX-*.md
!/docs/**/INDEX-*.md
```

**Impact** : zéro ambiguïté pour les agents. Ils Read le canonique.

### Optimisation O6 — Déplacer les 2 stitch-\*.md vers `stitch/`

```bash
git mv docs/scratchpad/stitch-redesign-site-internet-prompt-2026-04-17.md docs/scratchpad/stitch/
git mv docs/scratchpad/stitch-redesign-tarification-tab-2026-04-20.md docs/scratchpad/stitch/
```

**Impact** : cohérence avec le dossier `stitch/` existant pour les `.png`.

### Optimisation O7 — Mettre à jour `docs/scratchpad/README.md` pour refléter la réalité

Version actuelle (28 lignes) ne documente que 5 types sur les 15. Version étendue documente :

- Les 5 types pipeline (pattern existant)
- Les préfixes secondaires autorisés (audit-, rapport-, bug-, fix-, handoff-, plan-, diagnostic-)
- Le dossier `stitch/` et son contenu
- Le dossier `archive/YYYY-MM/` et son cycle (14j → 90j → suppression)
- La règle de promotion audit → `docs/current/`
- Pointeur vers `cleanup-scratchpad.sh`

**Impact** : les agents futurs ont une règle claire, les fichiers non-standards ne prolifèrent plus.

---

## 5. Ce qui NE change PAS (par design)

- Structure plate de `docs/scratchpad/` — convention Verone respectée
- Les 4 agents (dev, reviewer, verify, ops) continuent d'écrire exactement comme avant
- Le pipeline `dev-plan → dev-report → review-report → verify-report → deploy-report` intact
- Format de nommage `{type}-YYYY-MM-DD.md` intact
- Le dossier `stitch/` existant n'est pas renommé
- `.claude/rules/` non modifié (hors `.claude/DECISIONS.md` pour l'ADR-014)
- `CLAUDE.md` racine non modifié (sujet collatéral — voir § 7)
- Les CLAUDE.md des apps non modifiés

---

## 6. Autonomie — classification des 7 optimisations

Selon `.claude/rules/autonomy-boundaries.md` :

| Optimisation                                    | Feu       | Justification                                                        |
| ----------------------------------------------- | --------- | -------------------------------------------------------------------- |
| O1 — étendre `cleanup-scratchpad.sh`            | 🔴 ROUGE  | Modification `.claude/scripts/` → ADR-014 + PR dédiée                |
| O2 — hook PostToolUse dans `settings.json`      | 🔴 ROUGE  | Modification `.claude/settings.json` → ADR-014                       |
| O3 — nettoyage one-shot (lancer le script)      | 🟠 ORANGE | Touche > 70 fichiers (archivage massif), demande confirmation courte |
| O4 — promouvoir 2 fichiers vers `docs/current/` | 🟠 ORANGE | 2 `git mv` + mise à jour de 3 références                             |
| O5 — supprimer 4 doublons INDEX racine          | 🟠 ORANGE | Gitignored, mais suppression à acter                                 |
| O6 — déplacer 2 stitch-\*.md                    | 🟢 VERT   | 2 `git mv` cohérence, zéro impact                                    |
| O7 — étendre `docs/scratchpad/README.md`        | 🟢 VERT   | Fichier scratchpad existant, modification documentaire               |

**O1 et O2 exigent un ADR-014 + une PR dédiée `[INFRA-DOC-014]`**. Je ne les applique PAS moi-même. Je rédige le draft ADR-014 ci-dessous, tu l'intègres dans `.claude/DECISIONS.md` et on crée la PR.

**O3, O4, O5** : j'attends ton « ok » court et j'exécute.

**O6, O7** : je peux exécuter sans autre validation si tu dis « go sur tout ».

---

## 7. Sujets collatéraux détectés (HORS scope, je flagge juste)

- **`/CLAUDE.md` racine est un clone de `apps/site-internet/CLAUDE.md`** — un agent a écrasé le CLAUDE.md monorepo par erreur à une date indéterminée. Le vrai CLAUDE.md monorepo n'existe plus dans le repo (le contenu qu'on voit dans les system-reminders vient en fait de docs projet Cowork, pas du fichier réel). À restaurer en PR dédiée.
- **`docs/scratchpad/stitch/` contient des `.html` et `.png`** parmi les `.md` (ex: `stitch-general-VALIDATED-vd+v2.html`). Convention à clarifier : `stitch/` = tout Stitch, ou séparer `stitch/img/` et `stitch/md/` ? À discuter plus tard.
- **Pas de changelog `docs/logs/YYYY-MM-DD.md`** alors que `dev-agent.md` ligne 76 dit d'écrire dedans. Dossier existe (`docs/logs/`) mais peu utilisé. À auditer plus tard.
- **`.claude/work/` est gitignored (ADR-006)** mais les agents y écrivent ACTIVE.md. Roméo seul a la copie fiable. Risque si machine perdue. À décider plus tard (consolidation mentionnée dans ADR-006 comme « différée »).

Aucun de ces 4 sujets ne bloque les 7 optimisations ci-dessus.

---

## 8. Draft ADR-014 (à insérer dans `.claude/DECISIONS.md`)

```markdown
## ADR-014 — 2026-04-23 — Hygiène scratchpad : extension cleanup + auto-invocation

**Contexte** : audit session Cowork (rapport `docs/scratchpad/audit-2026-04-23-scratchpad-hygiene-proposal.md`) révèle que `docs/scratchpad/` accumule 131 fichiers depuis début avril parce que (a) le script `.claude/scripts/cleanup-scratchpad.sh` n'est jamais invoqué automatiquement, et (b) il ne couvre que 6 préfixes sur les 15 utilisés en pratique (non couverts : `rapport-*`, `bug-*`, `fix-*`, `handoff-*`, `plan-*`, `diagnostic-*`, `cleanup-*`, `dette-*`, `coherence-*`, `documentation-*`, `CLAUDE-*proposed*`, `BO-*`). La convention plate du scratchpad (réaffirmée dans `docs/scratchpad/README.md` et les 4 agents) reste valable — c'est le flux d'archivage qui est cassé.

**Décision** :

1. Étendre la liste des patterns archivés (14 jours) dans `cleanup-scratchpad.sh` pour couvrir les 11 préfixes Verone aujourd'hui non gérés.
2. Ajouter un hook `PostToolUse` dans `.claude/settings.json` qui invoque `cleanup-scratchpad.sh` après `Bash(gh pr merge*)` et `Bash(git push*)`.
3. Lancer un nettoyage one-shot pour archiver les fichiers déjà > 14 jours.
4. Promouvoir 2 fichiers de référence permanents (`BO-UI-RESP-LISTS-pilot-v2-template.md`, `automation-roadmap.md`) de `docs/scratchpad/` vers `docs/current/`.
5. Supprimer 4 doublons INDEX à la racine du repo (gitignored) et renforcer `.gitignore`.
6. Déplacer 2 `stitch-*.md` vers le dossier `stitch/` existant pour cohérence.
7. Étendre `docs/scratchpad/README.md` pour documenter tous les patterns, `stitch/` et `archive/`.

**Conséquence** :

- `cleanup-scratchpad.sh` passe d'une couverture 6/15 préfixes à 15/15.
- Scratchpad s'auto-nettoie après chaque merge/push. Fin du dump permanent.
- Références permanentes sortent du scratchpad (fin du conflit éphémère vs canonique).
- README scratchpad devient une vraie source de vérité au lieu d'une ébauche partielle.
- Les 4 agents (dev, reviewer, verify, ops) ne sont PAS modifiés — leur convention d'écriture reste plate.
- `.claude/settings.json`, `.claude/scripts/cleanup-scratchpad.sh`, `.claude/INDEX.md` sections Scratchpad/Scripts, `docs/scratchpad/README.md` sont modifiés.

**Référence** : rapport scratchpad `docs/scratchpad/audit-2026-04-23-scratchpad-hygiene-proposal.md`. PR `[INFRA-DOC-014]`.
```

---

## 9. Plan d'exécution (dès ton « OK »)

**Phase A — optimisations locales non-risquées (O6 + O7 + O3 + O4 + O5)** :

1. O6 : déplacer 2 stitch-\*.md vers stitch/
2. O7 : réécrire `docs/scratchpad/README.md` complet
3. O4 : promouvoir les 2 références permanentes vers `docs/current/`
4. O5 : supprimer les 4 doublons INDEX racine + renforcer `.gitignore`
5. O3 : lancer le cleanup one-shot (nécessite O1 déjà en place, donc en phase B)

**Phase B — optimisations `.claude/` (O1 + O2 + ADR-014)** — dans une PR dédiée `[INFRA-DOC-014]` :

1. Mettre à jour `.claude/scripts/cleanup-scratchpad.sh` (O1)
2. Mettre à jour `.claude/settings.json` hooks PostToolUse (O2)
3. Ajouter ADR-014 dans `.claude/DECISIONS.md`
4. Lancer le cleanup étendu → archivage massif 80+ fichiers (O3)
5. Mettre à jour `.claude/INDEX.md` sections Scratchpad et Scripts
6. Commit, push, PR vers staging

**Aucune des 7 optimisations ne touche aux agents `.claude/agents/*.md`, aux règles `.claude/rules/*.md`, ni au `CLAUDE.md` racine.** C'est intentionnel.

---

## 10. Ce que j'attends de toi

Une seule décision, formulée comme tu veux :

- **« go phase A »** → je fais O6, O7, O4, O5 (tout ce qui ne touche pas `.claude/scripts/` ni `.claude/settings.json`). Tu relis. Ensuite tu dis si on fait Phase B.
- **« go phase A et B »** → je fais tout d'affilée, avec la PR `[INFRA-DOC-014]` en fin.
- **« stop, je préfère autre chose »** → tu me dis quoi, je n'exécute rien.

Je ne touche plus à quoi que ce soit tant que tu n'as pas choisi.
