# Claude Code Configuration - Verone Back Office

**Version**: 12.0.0 (Post-Cleanup)
**Date**: 2026-03-14

## Structure

```
.claude/
├── settings.json           # Permissions MCP + hooks
├── README.md               # Ce fichier
├── scripts/                # Hook scripts
│   ├── auto-sync-with-main.sh
│   ├── clarify-before-code.sh
│   ├── confirm-docs-read.sh
│   ├── session-branch-check.sh
│   ├── statusline-debug.sh
│   ├── task-completed.sh
│   ├── validate-git-checkout.sh
│   └── validate-playwright-screenshot.sh
├── agents/                 # 6 agents
│   ├── code-reviewer.md
│   ├── database-architect.md
│   ├── frontend-architect.md
│   ├── perf-optimizer.md
│   ├── verone-debug-investigator.md
│   └── verone-orchestrator.md
├── commands/               # 7 slash commands
│   ├── db.md
│   ├── explore.md
│   ├── fix-warnings.md
│   ├── implement.md
│   ├── plan.md
│   ├── pr.md
│   └── teach.md
├── guides/                 # Implementation guides
│   ├── cross-app-protection.md
│   ├── expert-workflow.md
│   └── typescript-errors-debugging.md
└── rules/                  # Behavior rules (auto-discovered)
    ├── general.md
    ├── frontend/           # Next.js, React, UI
    ├── backend/            # API, middleware, auth
    ├── database/           # Supabase, migrations, RLS
    └── dev/                # Git, builds, servers, hooks
```

## Rules

Rules in `rules/` are auto-discovered recursively by Claude Code.
All `.md` files in subdirectories are loaded as behavioral rules.

## Hooks

Hooks defined in `settings.json` provide guardrails:

- **PreToolUse**: Block commits on main, block `any` in TypeScript, validate screenshot paths
- **PostToolUse**: Clarify before coding (docs read check)

## See Also

- `CLAUDE.md` - Main project instructions
- `docs/current/` - Active documentation
