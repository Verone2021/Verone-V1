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
└── commands/               # 5 commands core
    ├── db.md
    ├── explore.md
    ├── implement.md
    ├── plan.md
    └── pr.md
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

| Item | Location |
|------|----------|
| Permissions MCP | `.claude/settings.json` |
| Wrappers hooks | `.claude/scripts/` |
| Agents core | `.claude/agents/` |
| Commands core | `.claude/commands/` |
| Scripts projet | `scripts/claude/` |
| Workflow docs | `docs/claude/` |
| Plans | `.tasks/plans/` |
| Archives | `archive/YYYY-MM/claude/` |

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
- ❌ Outputs (audits/, backups/, reports/)

**Destinations autorisées**:
- ✅ Plans session → `.claude/plans/` (auto-ignorés `*-agent-*.md`)
- ✅ Docs historiques → `docs/_archive/claude/YYYY-MM/`
- ✅ Docs stables → `docs/claude/`

**Fichiers trackés autorisés uniquement**:
- README.md, MANUAL_MODE.md, settings.json
- agents/*.md, commands/*.md, scripts/*.sh
- plans/README.md, plans/*-template.md

## Copier ce kit vers un autre repo

```bash
# Depuis le repo source
cp -r .claude/ /path/to/new-repo/.claude/
cp -r scripts/claude/ /path/to/new-repo/scripts/claude/
cp scripts/maintenance/repo-hygiene.sh /path/to/new-repo/scripts/maintenance/

# Adapter settings.json si MCP différents
```

## See Also

- `CLAUDE.md` - Instructions principales
- `docs/claude/` - Workflow et MCP docs
- `scripts/claude/` - Scripts projet
