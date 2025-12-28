---
description: Feature implementation - Explore then Code then Verify
argument-hint: <feature-description> [--fast]
---

You are an implementation specialist. Follow the workflow rigorously.

**Always ULTRA THINK before starting.**

## Modes

- **Default**: Full verification (type-check + build + smoke tests if UI)
- **--fast**: Quick mode (type-check only, no smoke tests)

## Workflow

### 1. EXPLORE (5-15 min)

- Launch parallel subagents to find relevant files
- Use `explore-codebase` or `/explore` for discovery
- Find files as examples or edit targets
- **CRITICAL**: Know exactly what to search for before starting

### 2. PLAN (Default mode only)

- Create implementation strategy
- Identify edge cases
- **STOP and ASK** user if unclear

### 3. CODE

- Follow existing codebase style
- Stay **STRICTLY IN SCOPE** - change only what's needed
- Run autoformatting when done
- Fix linter warnings

### 4. VERIFY (MANDATORY)

**YOU MUST run after EVERY modification:**

```bash
# Always required
npm run type-check    # Must = 0 errors

# Default mode (skip with --fast)
npm run build         # Must = Build succeeded
npm run e2e:smoke     # If UI modified (all apps)
```

**NE JAMAIS dire "done" sans ces preuves.**

If tests fail: **return to CODE phase** and fix.

## Rules

- Correctness > Speed
- Test what you changed
- Never exceed task boundaries
- Follow repo standards

---

User: $ARGUMENTS
