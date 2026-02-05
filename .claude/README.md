# .claude Folder

Contains Claude Code configuration ONLY.

## Structure

- `commands/` - Slash commands (/db, /fix-warnings, etc.)
- `agents/` - Custom agents
- `rules/` - Development rules (backend, frontend, database, dev)
- `scripts/` - Hook scripts (used by settings.json)
- `templates/` - Code templates
- `settings.json` - Claude configuration
- `work/` - Temporary working files (analysis, plans)

## NOT for storage

- ❌ Audit reports → use `docs/audits/`
- ❌ Screenshots → use `docs/reports/`
- ❌ Test reports → use `docs/reports/`

## Best Practices

Per [Anthropic official guide](https://www.anthropic.com/engineering/claude-code-best-practices):

- Keep instructions concise to preserve context window
- Only store configuration and permanent documentation
- Temporary outputs belong in `docs/` not `.claude/`
