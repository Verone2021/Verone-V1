# Claude Code Configuration - Verone Back Office

**Version**: 4.0.0 (Minimal Portable Kit)
**Date**: 2026-01-19

## Philosophy

This repo uses a **minimal .claude/** approach:
- Core agents/commands live in `~/.claude/` (user's portable kit)
- Project-specific config lives here (settings, permissions)
- Repo-specific docs live in `docs/claude/`
- Scripts live in `scripts/claude/`
- Plans live in `.tasks/`

## Structure

```
.claude/
├── settings.json     # MCP permissions for this project
├── README.md         # This file
├── agents/           # Project-specific agents (4 core)
│   ├── database-architect.md
│   ├── frontend-architect.md
│   ├── verone-debug-investigator.md
│   └── verone-orchestrator.md
└── commands/         # Project-specific commands (5 core)
    ├── db.md
    ├── explore.md
    ├── implement.md
    ├── plan.md
    └── pr.md
```

## Where Things Live

| Item | Location |
|------|----------|
| MCP settings | `.claude/settings.json` |
| Core agents | `.claude/agents/` |
| Core commands | `.claude/commands/` |
| Workflow docs | `docs/claude/` |
| Scripts | `scripts/claude/` |
| Plans | `.tasks/plans/` |
| Archives | `archive/YYYY-MM/claude/` |

## Hygiene

Weekly PR via GitHub Actions:
- Moves noise out of `.claude/`
- Archives non-core items
- No destructive deletes

Manual trigger: `gh workflow run repo-hygiene-weekly`

## See Also

- `CLAUDE.md` - Main project instructions
- `docs/claude/` - Workflow and MCP documentation
- `scripts/claude/` - Project scripts
