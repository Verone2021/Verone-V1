# Archive 2026-01 (Claude hygiene)

This folder contains items moved out of `.claude/` to keep the repo clean and portable.

**Policy**: No destructive deletes — only moves with git history preserved.

## Contents

- `agents/` - Archived non-core agents
- `commands/` - Archived non-core commands
- `memories/` - Historical memories (not standard)
- `plans/` - Historical plans (now in .tasks/)

## Restore

To restore an archived item:
```bash
git mv archive/2026-01/claude/<path> .claude/<path>
```
