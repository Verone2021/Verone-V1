# Claude Code Configuration - Verone Back Office

**Version**: 13.0.0
**Date**: 2026-03-27

## Structure

```
.claude/
├── settings.json           # Permissions MCP + hooks
├── README.md               # Ce fichier
├── INDEX.md                # INDEX CENTRALISE — sommaire complet
├── scripts/                # Hook scripts (5)
│   ├── auto-sync-with-main.sh
│   ├── clarify-before-code.sh
│   ├── statusline-debug.sh
│   ├── validate-git-checkout.sh
│   └── validate-playwright-screenshot.sh
├── agents/                 # 6 agents specialises
│   ├── code-reviewer.md
│   ├── database-architect.md
│   ├── frontend-architect.md
│   ├── perf-optimizer.md
│   ├── verone-debug-investigator.md
│   └── verone-orchestrator.md
├── commands/               # 9 slash commands
│   ├── db.md               # /db — Operations Supabase rapides
│   ├── explore.md          # /explore — Exploration codebase
│   ├── fix-warnings.md     # /fix-warnings — ESLint auto-fix
│   ├── implement.md        # /implement — Feature implementation
│   ├── plan.md             # /plan — Observations → checklist
│   ├── pr.md               # /pr — Push + PR (sur ordre uniquement)
│   ├── research.md         # /research — DB + Code + RLS
│   ├── review.md           # /review — Audit code complet
│   └── teach.md            # /teach — Mode pedagogique
├── skills/                 # Skills invocables
│   └── rls-patterns/SKILL.md
├── rules/                  # Regles comportementales (auto-discovered)
│   ├── dev/                # Git, builds, servers, hooks, contexte
│   ├── frontend/           # Next.js, React, async patterns
│   ├── backend/            # API, middleware, auth
│   └── database/           # Supabase, migrations, RLS patterns
├── work/                   # Taches en cours
│   └── ACTIVE.md           # Sprints et taches actives
├── guides/                 # Guides d'implementation
├── patterns/               # Patterns reutilisables
└── templates/              # Templates de code
```

## Regles importantes

1. **Commit/Push/PR** = UNIQUEMENT sur ordre explicite de Romeo
2. **Avant de coder** = Lire ACTIVE.md + memoire + CLAUDE.md app + Serena
3. **Rules** dans `rules/` sont auto-discovered par Claude Code
4. **Hooks** dans `settings.json` sont bloquants (PreToolUse) ou informatifs (PostToolUse)
5. **Tache terminee** = supprimer de ACTIVE.md

## Voir aussi

- `CLAUDE.md` — Instructions projet principales
- `.claude/INDEX.md` — Sommaire centralise de tout le repo
- `.claude/work/ACTIVE.md` — Sprints et taches en cours
- `docs/current/` — Documentation active
