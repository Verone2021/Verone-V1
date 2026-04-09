---
description: Feature implementation - Explore then Code then Verify
argument-hint: <feature-description> [--fast]
allowed-tools:
  [
    Read,
    Edit,
    Write,
    Glob,
    Grep,
    Bash,
    mcp__serena__*,
    mcp__context7__*,
    mcp__supabase__execute_sql,
    mcp__supabase__list_tables,
    mcp__supabase__get_advisors,
  ]
---

You are an implementation specialist. Follow the workflow rigorously.

**Always ULTRA THINK before starting.**

## MCP Tools — UTILISATION OBLIGATOIRE

- **Context7** : AVANT d'utiliser une API de librairie externe (React Query, Zod, Next.js, shadcn), consulter la doc via `mcp__context7__resolve-library-id` puis `mcp__context7__query-docs`. Ne jamais deviner la syntaxe.
- **Serena** : Utiliser `mcp__serena__find_symbol` et `mcp__serena__read_memory` pour naviguer le code et consulter les memories projet avant de coder.
- **Supabase** : Utiliser `mcp__supabase__execute_sql` pour verifier le schema DB des tables concernees avant implementation.

## Modes

- **Default**: Full verification (type-check + build + smoke tests if UI)
- **--fast**: Quick mode (type-check only, no smoke tests)

## Workflow

### 1. SEARCH (OBLIGATOIRE — ne jamais sauter)

**CRITICAL : NE JAMAIS ecrire de code sans avoir explore le code existant et le schema DB.**

Executer `/search <domaine>` pour obtenir le resume structure :

- Tables DB + schema + FK + RLS
- Code existant + patterns + hooks
- Points d'attention

**Triple Lecture** : lire au minimum 3 fichiers similaires avant toute modification.

### 2. PLAN (Default mode only)

- Create implementation strategy based on research findings
- Identify edge cases
- **STOP and ASK** user if unclear

### 3. CODE

- Follow existing codebase style and patterns discovered in RESEARCH
- Stay **STRICTLY IN SCOPE** - change only what's needed
- Run autoformatting when done
- Fix linter warnings

### 4. VERIFY (MANDATORY)

**YOU MUST run after EVERY modification:**

```bash
# Always required — TOUJOURS filtrer sur le package concerne
pnpm --filter @verone/[app] type-check    # Must = 0 errors

# Default mode (skip with --fast)
pnpm --filter @verone/[app] build         # Must = Build succeeded
```

**NE JAMAIS dire "done" sans ces preuves.**

If checks fail: **return to CODE phase** and fix.

## Rules

- Correctness > Speed
- Test what you changed
- Never exceed task boundaries
- Follow repo standards
- **NEVER use `npm run` — always `pnpm --filter`**
- **NEVER skip RESEARCH step**
- **TOUJOURS lire ACTIVE.md** avant de commencer — verifier le contexte des taches en cours
- **TOUJOURS verifier `git branch --show-current`** avant commit

---

User: $ARGUMENTS
