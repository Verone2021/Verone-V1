# Plan: Redesign CLAUDE.md - Minimalist Approach

## Objective

Reduce CLAUDE.md from 696 lines to 300-350 lines following "less is more" philosophy while maintaining all critical information through lazy-loaded contexts.

---

## Analysis of Current CLAUDE.md (696 lines)

### Content Breakdown by Section

| Section                      | Lines | %   | Essential? | Action                                    |
| ---------------------------- | ----- | --- | ---------- | ----------------------------------------- |
| Header + Phase Info          | 35    | 5%  | Partially  | Reduce to 10 lines                        |
| Turborepo Paths              | 50    | 7%  | YES        | Keep (critical anti-hallucination)        |
| Anti-Hallucination Workflow  | 65    | 9%  | Partially  | Move detailed workflow to context         |
| Universal Workflow           | 70    | 10% | Partially  | Condense to checklist                     |
| Golden Rules                 | 50    | 7%  | YES        | Keep but consolidate                      |
| Stack + Commands             | 35    | 5%  | YES        | Keep essential commands                   |
| MCP Configuration            | 95    | 14% | NO         | Move entirely to context                  |
| Git Workflow                 | 30    | 4%  | YES        | Keep concise                              |
| Documentation Classification | 160   | 23% | NO         | Move to .claude/contexts/docs-workflow.md |
| MCP Agents                   | 30    | 4%  | NO         | Move to context                           |
| Success Metrics              | 10    | 1%  | Reduce     | 3 lines                                   |
| Documentation Navigation     | 35    | 5%  | Reduce     | Reference only                            |
| Changelog                    | 35    | 5%  | NO         | Remove or minimal                         |

### Issues Identified

1. **Duplication**: Anti-hallucination rules appear 3x (lines 89-152, 236-249, 349-369)
2. **Out-of-scope**: 23% is documentation classification workflow (not Claude-specific)
3. **Stale content**: MCP server list, memory file lists (change frequently)
4. **Over-specification**: Detailed MCP commands in workflows (Claude knows these)

---

## Proposed Structure (Target: 300-320 lines)

### Section 1: Project Identity (10 lines)

- One-line description
- Stack summary (1 line)
- Language rule (French communication)

### Section 2: Architecture (35 lines)

- 3 apps + packages paths (critical)
- Import conventions
- Obsolete paths warning (CRITICAL for anti-hallucination)

### Section 3: Core Rules (40 lines)

- 6-8 consolidated rules
- No duplication
- Actionable statements

### Section 4: Workflow (35 lines)

- Think > Test > Code > Re-test
- Validation checklist (concise)
- Commit format

### Section 5: Commands (20 lines)

- Essential npm scripts only
- Supabase types generation

### Section 6: Context Loading (25 lines)

- Table of contexts with when to load
- Reference format

### Section 7: Documentation Map (15 lines)

- Key paths only
- Single reference to docs/README.md

### Section 8: Quick Reference (10 lines)

- Branch strategy
- Success metrics

**Estimated Total: ~190-200 content lines + ~100 formatting = 290-320 lines**

---

## Content Migration Plan

### 1. NEW: `.claude/contexts/workflows.md`

Move from CLAUDE.md:

- Detailed Universal Workflow (current lines 156-221)
- Documentation Classification workflow (current lines 476-637)
- Anti-hallucination detailed git commands

**Estimated size: 200 lines**

### 2. NEW: `.claude/contexts/mcp-config.md`

Move from CLAUDE.md:

- Full MCP server list (lines 333-347)
- Permission paths (lines 296-313)
- Serena memories list (lines 315-331)
- Validation checklists (lines 371-381)

**Estimated size: 120 lines**

### 3. ENHANCE: `.claude/contexts/design-system.md`

Add from CLAUDE.md:

- ProductThumbnail emphasis (lines 137-152)
- Catalogue-first rule with examples
- Update paths to Phase 4 Turborepo format

### 4. KEEP AS-IS:

- `.claude/contexts/database.md` - Already well-structured
- `.claude/contexts/monorepo.md` - Architecture reference
- `.claude/contexts/deployment.md` - CI/CD details

---

## Design Principles Applied

### 1. Front-load Critical Information

- Architecture paths FIRST (most common mistake source)
- Rules summary early
- Details available on demand

### 2. Single Source of Truth

- Each piece of information appears ONCE
- Anti-hallucination: ONE consolidated section (not 3x)
- Reference to contexts for details

### 3. Scannable Format

- Tables over prose where possible
- Bullet points over paragraphs
- Code blocks for commands only (not explanations)

### 4. Lazy Loading Strategy

- Core CLAUDE.md: Always loaded (~300 lines)
- Contexts: Loaded when relevant task detected
- Total available: ~1,800 lines (but never all at once)

---

## Proposed New CLAUDE.md (Draft)

```markdown
# Verone Back Office

CRM/ERP for luxury furniture | Next.js 15 + Supabase + Turborepo
Communicate in French | Code in English

---

## Architecture

### Apps

| App           | Path                | Port |
| ------------- | ------------------- | ---- |
| back-office   | apps/back-office/   | 3000 |
| site-internet | apps/site-internet/ | 3001 |
| linkme        | apps/linkme/        | 3002 |

### Packages (@verone/\*)

| Package                            | Purpose                       |
| ---------------------------------- | ----------------------------- |
| ui                                 | Design System (86 components) |
| products, orders, stock, customers | Business logic                |
| types, utils                       | Shared utilities              |

### Imports

import { Button } from '@verone/ui'
import { ProductCard } from '@verone/products'
import type { Database } from '@verone/types'

### OBSOLETE PATHS (never use)

- src/ - Does not exist
- src/app/ - Use apps/back-office/src/app/
- src/components/ - Use apps/\*/src/components/ or packages/

---

## Rules

1. **Zero Console Errors** - 1 error = complete failure
2. **Build Validation** - npm run build before AND after changes
3. **Commit Authorization** - NEVER commit without explicit user approval
4. **Anti-Hallucination** - Check git history before modifying existing code
5. **Catalogue First** - Read COMPOSANTS-CATALOGUE.md before creating components
6. **No Production Test Data** - Never seed/mock data without explicit approval
7. **Documentation First** - Consult docs before modifying

### Anti-Hallucination Commands

git log --oneline -- [file] # Check history
git show [sha]:[file] # View old version
git diff [sha] HEAD -- [file] # Compare changes

---

## Workflow

1. **Before** - Consult docs, verify build passes, check console
2. **Code** - Minimal changes, strict TypeScript, no `any`
3. **After** - type-check (0 errors), build passes, console clean
4. **Commit** - ASK permission, use conventional format

### Commit Format

feat|fix|refactor(scope): Description

Co-Authored-By: Claude <noreply@anthropic.com>

---

## Commands

npm run dev # Development server
npm run build # Production build (required)
npm run type-check # TypeScript validation
npm run lint # ESLint

# Supabase types

supabase gen types typescript --local > packages/@verone/types/src/supabase.ts

---

## Contexts

Load specialized contexts as needed:

| Context          | When                               |
| ---------------- | ---------------------------------- |
| database.md      | Schema, migrations, RLS, triggers  |
| design-system.md | UI components, Storybook, styling  |
| monorepo.md      | Package architecture, dependencies |
| deployment.md    | CI/CD, Vercel, production          |
| workflows.md     | Detailed processes, documentation  |
| mcp-config.md    | MCP servers, permissions, Serena   |

Usage: Read('.claude/contexts/[name].md')

---

## Documentation

| Topic                | Path                                      |
| -------------------- | ----------------------------------------- |
| Architecture         | docs/architecture/                        |
| Database (78 tables) | docs/database/                            |
| Components (86)      | docs/architecture/COMPOSANTS-CATALOGUE.md |
| Business Rules       | docs/business-rules/                      |
| All docs             | docs/README.md                            |

---

## Reference

**Branches**: main (staging) -> production-stable (auto-deploy)
**Metrics**: Build <20s | Pages <3s LCP | Console: 0 errors
**Version**: 5.0.0 | Updated: 2025-11-25
```

---

## Implementation Steps

### Phase 1: Create New Contexts (Do First)

1. Create `.claude/contexts/workflows.md`
   - Extract detailed workflow from CLAUDE.md
   - Add documentation classification guide
2. Create `.claude/contexts/mcp-config.md`
   - MCP server list
   - Permissions
   - Serena memories

### Phase 2: Update Existing Contexts

1. Update `.claude/contexts/design-system.md`
   - Fix paths to Phase 4 format
   - Add catalogue-first emphasis

### Phase 3: Rewrite CLAUDE.md

1. Start with proposed structure
2. Verify all critical rules present
3. Add context references
4. Target: 300-320 lines

### Phase 4: Validation

1. Count lines (must be < 350)
2. Check for duplications
3. Test with sample tasks

---

## Success Metrics

| Metric                         | Current   | Target    | Reduction |
| ------------------------------ | --------- | --------- | --------- |
| CLAUDE.md lines                | 696       | 300-320   | 54-57%    |
| Anti-hallucination occurrences | 3x        | 1x        | 66%       |
| Out-of-scope content           | 23%       | 0%        | 100%      |
| MCP config in main file        | 95 lines  | 0         | 100%      |
| Documentation classification   | 160 lines | 0 (moved) | 100%      |

---

## Critical Files for Implementation

1. **`/Users/romeodossantos/verone-back-office-V1/CLAUDE.md`**
   - Main file to rewrite
   - Target: 300-320 lines

2. **`/Users/romeodossantos/verone-back-office-V1/.claude/contexts/workflows.md`** (NEW)
   - Detailed workflow processes
   - Documentation classification guide
   - ~200 lines

3. **`/Users/romeodossantos/verone-back-office-V1/.claude/contexts/mcp-config.md`** (NEW)
   - MCP server configuration
   - Permissions and Serena setup
   - ~120 lines

4. **`/Users/romeodossantos/verone-back-office-V1/.claude/contexts/design-system.md`**
   - Update paths to Phase 4
   - Add catalogue-first rules

5. **`/Users/romeodossantos/verone-back-office-V1/docs/architecture/COMPOSANTS-CATALOGUE.md`**
   - Reference file (no changes needed)
   - Used for component lookup
