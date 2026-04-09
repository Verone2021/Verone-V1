# Claude Code Configuration - Verone Back Office

**Version**: 14.0.0
**Date**: 2026-04-09

## Structure

```
.claude/
├── settings.json           # Permissions MCP + hooks
├── README.md               # Ce fichier
├── INDEX.md                # INDEX CENTRALISE — sommaire complet
├── agents/                 # 7 agents specialises
│   ├── back-office-expert.md
│   ├── code-reviewer.md
│   ├── database-architect.md
│   ├── frontend-architect.md
│   ├── linkme-expert.md
│   ├── perf-optimizer.md
│   └── site-internet-expert.md
├── commands/               # 9 slash commands
│   ├── db.md               # /db — Operations Supabase rapides
│   ├── fix-warnings.md     # /fix-warnings — ESLint auto-fix
│   ├── implement.md        # /implement — Feature implementation
│   ├── plan.md             # /plan — Observations → checklist
│   ├── pr.md               # /pr — Push + PR (sur ordre uniquement)
│   ├── review.md           # /review — Audit code complet
│   ├── search.md           # /search — Exploration codebase + DB + RLS
│   ├── status.md           # /status — Resume rapide projet
│   └── teach.md            # /teach — Mode pedagogique
├── skills/                 # 4 skills invocables
│   ├── new-component/SKILL.md
│   ├── oneshot/SKILL.md
│   ├── rls-patterns/SKILL.md
│   └── schema-sync/SKILL.md
├── hooks/                  # 2 hook scripts
│   ├── check-component-creation.sh
│   └── session-context.sh
├── scripts/                # 6 scripts utilitaires
│   ├── auto-sync-with-main.sh
│   ├── clarify-before-code.sh
│   ├── cleanup-active-tasks.sh
│   ├── statusline-debug.sh
│   ├── validate-git-checkout.sh
│   └── validate-playwright-screenshot.sh
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
2. **Avant de coder** = Lire ACTIVE.md + memoire + CLAUDE.md app + documentation projet
3. **Rules** dans `rules/` sont auto-discovered par Claude Code
4. **Hooks** dans `settings.json` sont bloquants (PreToolUse) ou informatifs (PostToolUse)
5. **Tache terminee** = supprimer de ACTIVE.md

## Voir aussi

- `CLAUDE.md` — Instructions projet principales
- `.claude/INDEX.md` — Sommaire centralise de tout le repo
- `.claude/work/ACTIVE.md` — Sprints et taches en cours
- `docs/current/` — Documentation active
