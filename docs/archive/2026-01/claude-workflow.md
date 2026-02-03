# Workflow Claude Code - 2 Sessions

> Source de verite unique pour les plans de travail Claude Code

## Architecture des Sessions

| Session    | Role                          | Permissions                  |
| ---------- | ----------------------------- | ---------------------------- |
| **WRITE**  | Modifie le code, commit, push | Read + Write + Edit + Bash   |
| **VERIFY** | Lit, teste, propose           | Read-only, peut lancer tests |

**Note**: Fonctionne aussi avec 1 seule session si besoin.

---

## Source de Verite

```
.claude/work/ACTIVE.md
```

Ce fichier est **versionne** dans le repo et partage entre toutes les sessions.

**Ne plus utiliser** `~/.claude/plans/` (ephemere, non partage).

---

## Flow de Travail

```
1. Planifier   → Mettre a jour ACTIVE.md
2. Coder       → Implementer la tache
3. Commit      → Avec Task ID obligatoire
4. Sync        → pnpm plan:sync (automatique)
5. Commit sync → git commit -am "chore(plan): sync"
6. Verifier    → Tests (session VERIFY ou manuel)
```

---

## Task IDs

Format: `[APP]-[DOMAIN]-[NNN]`

| Prefixe | Application   |
| ------- | ------------- |
| `BO-*`  | back-office   |
| `LM-*`  | linkme        |
| `WEB-*` | site-internet |

Exemples:

- `BO-DASH-001` - Dashboard back-office
- `LM-ORD-002` - Commandes LinkMe
- `WEB-CMS-003` - CMS site internet

---

## Commits

### Avec Task ID (obligatoire)

```bash
git commit -m "[BO-DASH-001] Fix metrics calculation"
git commit -m "[LM-ORD-002] Add order validation"
```

### Prefixes autorises (sans Task ID)

- `chore(plan): sync` - Synchronisation plan
- `chore(deps): update` - Mise a jour dependances
- `chore(release): v1.0.0` - Release
- `Merge ...` - Merges
- `Revert ...` - Reverts

### Bypass explicite

```bash
git commit -m "[NO-TASK] Quick typo fix"
```

---

## Commandes

### Synchronisation plan

```bash
pnpm plan:sync
```

Execute automatiquement apres chaque `git commit` via hook PostToolUse.

### Bypass Stop hook

```bash
FORCE_STOP=1 claude ...
```

---

## Fichiers Cles

| Fichier                               | Description                   |
| ------------------------------------- | ----------------------------- |
| `.claude/work/ACTIVE.md`              | Plan actif (source de verite) |
| `.claude/scripts/plan-sync.js`        | Script de synchronisation     |
| `.claude/scripts/validate-command.js` | Validation Task ID            |
| `.claude/scripts/task-completed.sh`   | Stop hook (verification sync) |
| `.claude/archive/plans-YYYY-MM/`      | Archives des taches Done      |

---

## Hooks Claude Code

### PreToolUse (Bash)

Valide les commandes `git commit`:

- Bloque si pas de Task ID
- Autorise si prefixe chore/merge/revert
- Autorise si bypass `[NO-TASK]`

### PostToolUse (Bash)

Execute `plan-sync.js` apres chaque `git commit` reussi.

### Stop

Bloque si:

- Dernier commit contient un Task ID
- ET `ACTIVE.md` n'a pas ete modifie depuis

---

## Troubleshooting

### "Commit bloque: ajoute un Task ID"

Solution: Ajouter un Task ID dans le message

```bash
git commit -m "[BO-XXX-001] Your message"
```

Ou bypass (rare):

```bash
git commit -m "[NO-TASK] Your message"
```

### "Plan non synchronise"

Solution:

```bash
pnpm plan:sync
git commit -am "chore(plan): sync"
```

Ou bypass (rare):

```bash
FORCE_STOP=1
```

### Archive automatique

Les taches `[x]` sont archivees automatiquement quand ACTIVE.md depasse 200 lignes.

Archives: `.claude/archive/plans-YYYY-MM/`

---

## Migration depuis ~/.claude/plans

1. Copier le contenu pertinent vers `.claude/work/ACTIVE.md`
2. Supprimer les fichiers dans `~/.claude/plans/` (optionnel)
3. Utiliser uniquement ACTIVE.md a partir de maintenant

---

## Deploiement Vercel - IMPORTANT

### ⛔ INTERDIT - Vercel CLI

**NE JAMAIS utiliser `vercel` CLI pour ce projet.**

- Monorepo trop gros (>100 MB) - erreur "File size limit exceeded"
- Configuration incorrecte - erreur "path does not exist"
- N'a JAMAIS fonctionne et ne fonctionnera JAMAIS

**Refuser immediatement toute suggestion d'utiliser Vercel CLI.**

### Forcer un deploiement

Modifier le fichier `.vercel-trigger` dans l'app concernee:

```bash
# LinkMe
echo "# Force deploy $(date)" > apps/linkme/.vercel-trigger

# Back-Office
echo "# Force deploy $(date)" > apps/back-office/.vercel-trigger
```

Puis commit et push sur `main`.

### Pourquoi ca fonctionne

L'`ignoreCommand` dans `vercel.json` surveille les paths:

- `apps/linkme` ou `apps/back-office`
- `packages`
- `package.json`, `pnpm-lock.yaml`, `turbo.json`

Si aucun fichier dans ces paths n'est modifie entre HEAD^ et HEAD, le build est **skippe**.

### Deploy Hooks (Vercel Dashboard)

Les Deploy Hooks font des **Redeploy** du meme commit, pas de nouveaux builds.
Pour un nouveau build, il faut un **nouveau commit** sur `main` qui modifie les paths surveilles.

### Troubleshooting Deploiement

| Probleme               | Cause                           | Solution                               |
| ---------------------- | ------------------------------- | -------------------------------------- |
| Deploiement "Canceled" | Build concurrent (Plan Hobby)   | Attendre ou upgrader                   |
| Deploiement "Ignored"  | ignoreCommand skip              | Modifier `.vercel-trigger`             |
| Deploiement disparait  | ignoreCommand skip au demarrage | Modifier fichier dans paths surveilles |
| Redeploy meme commit   | Deploy Hook                     | Faire un nouveau commit                |

---

_Version 1.1.0 - 2026-01-16_
