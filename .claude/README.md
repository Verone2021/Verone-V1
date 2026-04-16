# Configuration Claude Code — Verone Back Office

**Version** : 15.0.0 | **Date** : 2026-04-15

## Architecture

```
.claude/
├── settings.json          # Permissions + hooks (14 PreToolUse, 2 PostToolUse)
├── INDEX.md               # Sommaire centralise
├── agents/                # 6 agents (dev, reviewer, verify, ops, writer, market)
├── commands/              # 5 commands (search, review, pr, status, README)
├── skills/                # 3 skills (oneshot, new-component, schema-sync)
├── rules/                 # 5 rules (database, workflow, code-standards, playwright, stock-triggers)
├── scripts/               # 6 scripts hooks actifs
├── hooks/                 # 2 hook scripts
├── work/ACTIVE.md         # Taches en cours
└── test-credentials.md    # Credentials Playwright (local only)
```

## Pipeline scratchpad

`dev-plan → dev-report → review-report → verify-report → deploy-report`

Fichiers dans `docs/scratchpad/`. Aucun agent ne communique directement avec un autre.

## Memoire

- Centralisee dans `~/.claude/projects/.../memory/`
- 20 fichiers memoire (feedbacks, projets, references, hotspots)
- Pas de memoire par agent — memoire globale uniquement

## Regles

- Rules dans `rules/` sont auto-discovered par Claude Code
- Hooks dans `settings.json` sont bloquants (exit 1 = action annulee)
- `CLAUDE.md` racine = prompt du coordinateur
