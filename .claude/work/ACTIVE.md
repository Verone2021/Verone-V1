# Plan Actif

**Branche**: `fix/multi-bugs-2026-01`
**Last sync**: 2026-01-13 (7a48a74d)

## Regles

- Task ID obligatoire: `[APP]-[DOMAIN]-[NNN]` (ex: BO-DASH-001, LM-ORD-002, WEB-CMS-001)
- Bypass: `[NO-TASK]` dans le message de commit (rare)
- Apres commit avec Task ID: `pnpm plan:sync` puis `git commit -am "chore(plan): sync"`

## Taches

- [x] BO-WORK-001 Mise en place du workflow Claude Code avec source de verite unique (738dcc67)
- [x] BO-WORK-002 Fix Stop hook - gestion chemins absolus et exit codes (ff74fdaa)
- [x] BO-WORK-003 Documenter workflow Task ID dans CLAUDE.md et memoire Serena (d695ad88)
- [x] BO-WORK-004 Handoff READ→WRITE mailbox (boite aux lettres locale) (b447c5ef)
- [x] LM-ORG-001 Transformer page /reseau en onglet Vue Carte dans /organisations (e3930d65)
- [x] BO-SENTRY-001 Setup Sentry expert (Replay + Feedback + Security fixes) (0368aeca)

## Done
- [x] LM-ORG-002 (7a48a74d) (auto-added)

<!-- Taches completees automatiquement deplacees ici -->
