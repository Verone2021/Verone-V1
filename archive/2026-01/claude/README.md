# Archive 2026-01 (Claude hygiene)

This folder contains items moved out of `.claude/` to keep the repo clean and portable.

**Policy**: No destructive deletes — only moves with git history preserved.

## Contents

- `agents/` - Archived non-core agents (action.md, audit-governor.md, data-layer-auditor.md)
- `commands/` - Archived non-core commands (write.md, commit.md)
- `memories/` - Historical memories (claude-autonomy-guidelines-2026-01-17.md)
- `plans/` - (empty, plans moved to .tasks/plans/)

## Restore

To restore an archived item:
```bash
git mv archive/2026-01/claude/agents/action.md .claude/agents/action.md
```

## Why Archived

| Item | Reason |
|------|--------|
| `action.md` | Doublon "next steps" de l'orchestrator |
| `audit-governor.md` | Trop "process" pour agent permanent |
| `data-layer-auditor.md` | Trop spécifique ; logique dans DB architect |
| `write.md` | Doublon de implement.md |
| `commit.md` | Règles fusionnées dans /pr |
| `memories/*` | Historique, pas standard |
