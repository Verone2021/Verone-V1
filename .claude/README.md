# Claude Code Configuration - Verone Back Office

**Version**: 4.1.0 (Kit Perso Exclusif)
**Date**: 2026-01-19

## Philosophie

**Règle**: Tout le kit Claude perso vit **exclusivement dans `.claude/`** de ce repo.

- Pas de dépendance à `~/.claude/` (portable, copiable entre repos)
- Wrappers de compatibilité pour les hooks (jamais de casse)
- Automatisation safe (moves only, no deletes)

## Structure

```
.claude/
├── settings.json           # Permissions MCP
├── README.md               # Ce fichier
├── scripts/                # Wrappers de compatibilité
│   ├── task-completed.sh   # Stop hook wrapper
│   └── session-token-report.sh
├── agents/                 # 4 agents core
│   ├── database-architect.md
│   ├── frontend-architect.md
│   ├── verone-debug-investigator.md
│   └── verone-orchestrator.md
└── commands/               # 6 commands core
    ├── db.md
    ├── explore.md
    ├── fix-warnings.md      # 🆕 ESLint fix workflow 2026
    ├── implement.md
    ├── plan.md
    └── pr.md
```

## Dossier `rules/` (Standards 2026)

Règles de comportement pour Claude Code, organisées par domaine.

**Structure** :

- `rules/general.md` - Règles cross-cutting
- `rules/frontend/` - Next.js, React, UI
- `rules/backend/` - API, middleware, auth
- `rules/database/` - Supabase, migrations, RLS

**Utilisation** : Tous fichiers `.md` sont auto-découverts récursivement.

**Symlinks** : Supportés pour partager règles entre projets.

## Hooks (Protection Branch)

### PreToolUse: Protection `main`

Le hook PreToolUse dans `settings.json` empêche les commits sur `main`:

```json
{
  "PreToolUse": [
    {
      "matcher": "Bash(git commit*)",
      "hooks": [
        {
          "type": "command",
          "command": "bash -c '...if [ \"$BRANCH\" = \"main\" ]...exit 1...'"
        }
      ]
    }
  ]
}
```

**Comportement:**

- ❌ Bloque `git commit` sur `main` ou `master`
- ❌ Bloque commits sans Task ID valide
- ✅ Autorise commits sur feature branches avec format `[APP-XXX-NNN]` ou `[NO-TASK]`

**Message d'erreur:**

```
❌ INTERDIT de commit sur main. Créer une feature branch: git checkout -b feat/XXX
```

### Stop: Task Completed

Le hook Stop notifie quand une tâche Claude Code est terminée:

```json
{
  "Stop": [
    {
      "hooks": [
        {
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/.claude/scripts/task-completed.sh"
        }
      ]
    }
  ]
}
```

## Règles "Expert"

### Wrappers de compatibilité

Les scripts dans `.claude/scripts/` sont des **wrappers** qui:

1. Cherchent le script réel dans `scripts/claude/`
2. Si trouvé et exécutable → l'appellent
3. Sinon → log "SKIP" et `exit 0`

**Résultat**: Jamais de "hook error", même si le script cible n'existe pas.

### Portabilité

- **Pas de chemins absolus** (`/Users/...`) dans les scripts
- Utiliser `$SCRIPT_DIR`, `$PROJECT_ROOT`, `$CLAUDE_PROJECT_DIR`
- Tester avec `bash -n script.sh` avant commit

### Safe by default

- `set -euo pipefail` en haut de chaque script
- Fallback `|| true` pour les opérations non critiques
- `exit 0` si prérequis manquant (pas d'échec silencieux)

## Où les choses vivent

| Item            | Location                  |
| --------------- | ------------------------- |
| Permissions MCP | `.claude/settings.json`   |
| Wrappers hooks  | `.claude/scripts/`        |
| Agents core     | `.claude/agents/`         |
| Commands core   | `.claude/commands/`       |
| Scripts projet  | `scripts/claude/`         |
| Workflow docs   | `docs/claude/`            |
| Plans           | `.claude/work/`           |
| Archives        | `archive/YYYY-MM/claude/` |

## Hygiène hebdomadaire

**Workflow**: `.github/workflows/repo-hygiene-weekly.yml`

```bash
# Déclencher manuellement UNIQUEMENT
gh workflow run repo-hygiene-weekly --field dry_run=false

# ❌ SCHEDULE DISABLED: Plus de PR automatique
```

**Script**: `scripts/maintenance/repo-hygiene.sh`

- Moves only, no deletes
- Skip si fichier absent
- **Mode manuel uniquement** (workflow_dispatch)

## Règles de Génération de Fichiers

**INTERDIT** d'écrire directement sous `.claude/`:

- ❌ Rapports/audits temporels
- ❌ Backups JSON
- ❌ Logs de session

**Destinations autorisées**:

- ✅ Rapports sessions → `.claude/audits/generated/` (ignoré)
- ✅ Backups JSON → `.claude/backups/` (ignoré)
- ✅ Plans session → `.claude/plans/` (auto-ignorés `*-agent-*.md`)
- ✅ Docs historiques → `docs/_archive/claude/YYYY-MM/`
- ✅ Docs stables → `docs/claude/`

**Fichiers trackés autorisés uniquement**:

- README.md, MANUAL_MODE.md, settings.json
- agents/_.md, commands/_.md, scripts/\*.sh
- plans/README.md, plans/\*-template.md
- audits/README.md (doc règles uniquement)

## Copier ce kit vers un autre repo

```bash
# Depuis le repo source
cp -r .claude/ /path/to/new-repo/.claude/
cp -r scripts/claude/ /path/to/new-repo/scripts/claude/
cp scripts/maintenance/repo-hygiene.sh /path/to/new-repo/scripts/maintenance/

# Adapter settings.json si MCP différents
```

## Status Line Configuration

**Requirement**: bun installé globalement

```bash
curl -fsSL https://bun.sh/install | bash
```

**Configuration actuelle**: `.claude/settings.json` (lignes 10-14)

```json
"statusLine": {
  "type": "command",
  "command": "bun x ccusage@17.2.1 statusline --visual-burn-rate emoji",
  "padding": 0
}
```

**Pourquoi bun x ccusage@17.2.1** :

- Version stable pinnée (évite instabilité de 18.x)
- Commande directe (pas de path resolution nécessaire)
- Performance optimale avec caching bun
- Prouvé fonctionnel (Jan 19, 2026)

**Troubleshooting**: Si Status Line n'apparaît pas

```bash
# Vérifier bun disponible
which bun

# Tester manuellement
echo '{}' | bun x ccusage@17.2.1 statusline --visual-burn-rate emoji
# Note: Erreur "Invalid input format" est NORMALE (JSON incomplet)

# Fallback: installer ccusage globalement
npm install -g ccusage@17.2.1
# Puis modifier settings.json: "command": "ccusage statusline --visual-burn-rate emoji"
```

**⚠️ Important** :

- `$CLAUDE_PROJECT_DIR` ne fonctionne PAS dans `statusLine.command` (unsupported, GitHub #7925)
- Toujours utiliser commande directe ou chemin absolu
- Restart Claude Code requis après modification de `settings.json`

## See Also

- `CLAUDE.md` - Instructions principales
- `docs/claude/` - Workflow et MCP docs
- `scripts/claude/` - Scripts projet
