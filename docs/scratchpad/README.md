# Scratchpad — Communication inter-agents

## Regles de retention (automatiques)

| Type de fichier                                      | Duree de vie | Destination finale              |
| ---------------------------------------------------- | ------------ | ------------------------------- |
| `dev-plan-*.md`                                      | 14 jours     | `archive/AAAA-MM/` puis purge   |
| `dev-report-*.md`                                    | 14 jours     | `archive/AAAA-MM/` puis purge   |
| `review-report-*.md`                                 | 14 jours     | `archive/AAAA-MM/` puis purge   |
| `verify-report-*.md`                                 | 14 jours     | `archive/AAAA-MM/` puis purge   |
| `deploy-report-*.md`                                 | 14 jours     | `archive/AAAA-MM/` puis purge   |
| `session-*.md`                                       | 30 jours     | `archive/AAAA-MM/` puis purge   |
| `archive/*` plus de 90 jours                         | —            | **SUPPRIMES definitivement**    |
| `audit-*.md` / `post-mortem-*.md` / `protocole-*.md` | Permanent    | **PROMUS vers `docs/current/`** |

## Automatisation (3 couches)

### 1. Hook local `post-merge` (instantane)

Fichier : `.husky/post-merge`
Se declenche apres chaque `git pull` ou `git merge` reussi sur `staging`/`main`.
Lance `.claude/scripts/cleanup-scratchpad.sh`.

### 2. GitHub Action hebdomadaire (filet de securite)

Fichier : `.github/workflows/scratchpad-cleanup.yml`
Tous les dimanches 3h UTC. Cree une PR `chore: auto-archive scratchpad`.
Lancable manuellement via l'onglet "Actions" GitHub.

### 3. Script manuel (debug)

```bash
bash .claude/scripts/cleanup-scratchpad.sh
```

## Conventions de nommage

- `dev-plan-YYYY-MM-DD-{task-id}.md` : Plan avant implementation
- `dev-report-YYYY-MM-DD-{task-id}.md` : Rapport apres implementation
- `review-report-YYYY-MM-DD-{task-id}.md` : Verdict reviewer (PASS/FAIL)
- `verify-report-YYYY-MM-DD-{task-id}.md` : Rapport validation
- `deploy-report-YYYY-MM-DD-{task-id}.md` : Rapport deploiement
- `session-YYYY-MM-DD.md` : Rapport de session nocturne ou longue
- `audit-{sujet}-YYYY-MM-DD.md` : Audit metier (a promouvoir si important)
- `post-mortem-{incident}-YYYY-MM-DD.md` : Post-mortem (a promouvoir)
- `protocole-{sujet}.md` : Protocole reutilisable (a promouvoir)

## Droits d'ecriture

| Fichier       | Qui ecrit      | Qui lit                 |
| ------------- | -------------- | ----------------------- |
| dev-plan      | coordinateur   | dev-agent               |
| dev-report    | dev-agent      | reviewer-agent          |
| review-report | reviewer-agent | coordinateur, ops-agent |
| verify-report | verify-agent   | coordinateur            |
| deploy-report | ops-agent      | coordinateur, Romeo     |

## Philosophie (ephemeral artifacts)

Inspire des pratiques Google/Meta : les artefacts de travail
sont ephemeres. Seuls les audits, post-mortems et decisions
d'architecture ont de la valeur historique et sont promus vers
`docs/current/`.

Le code est la verite. Les dev-plans et dev-reports sont des
echafaudages qu'on retire apres construction.
