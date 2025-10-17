# /context-update - Mise à Jour Repository

Mise à jour automatique manifests + MEMORY-BANK + TASKS après chaque session.

## Usage
```bash
/context-update [task-summary]
```

## Auto-Update Protocol

### 1. Session Analysis
- `mcp__serena__read_memory` - Récupérer contexte session courante
- Identifier fichiers/modules modifiés (git status)
- Analyser impact des changements sur business rules
- `mcp__serena__find_referencing_symbols` pour dépendances

### 2. Manifests Update
**Business Rules:**
- Examiner `manifests/business-rules/` concernés
- Mettre à jour si changements architecturaux
- Validation cohérence implémentation ↔ règles

**PRD Updates:**
- `manifests/prd/` mis à jour si nouvelles features
- Statut : pending → in-progress → completed
- Dependencies et requirements à jour

**Architecture:**
- `manifests/architecture/` si changements structurels
- Database schema si migrations Supabase
- API specifications si nouveaux endpoints

### 3. MEMORY-BANK Maintenance
**Active Context:**
- Créer/update `MEMORY-BANK/active-context.md`
- Session summary : tâches accomplies + décisions
- Contexte pour prochaines sessions

**AI Context Preservation:**
- `mcp__serena__write_memory` avec nouveau contexte
- Key learnings et insights architecturaux
- Best practices découvertes

**Session Archive:**
- Archiver session → `MEMORY-BANK/sessions/YYYY-MM-DD-<task>.md`
- Links vers commits/PRs associés
- Format standardisé pour recherche future

### 4. TASKS Management
**Active Tasks:**
- Marquer tâche completed dans `TASKS/active/`
- Move vers `TASKS/completed/` avec timestamp
- Update blockers/dependencies

**Backlog Update:**
- `TASKS/backlog-prioritized.md` si nouveaux issues
- Technical debt identifiée durant dev
- Priorisation selon impact business

**Module Features:**
- Update `TASKS/modules-features/` concernés
- Status : planned → in-progress → completed
- Cross-module dependencies tracking

### 5. Git Integration (Optionnel)
Si demandé explicitement :
- Générer commit message détaillé
- Include task summary + business impact
- Reference PRD/business rules modifiés
- Auto-commit avec signature Claude

### 6. Knowledge Cross-Links
- Créer liens entre manifests ↔ memory-bank ↔ tasks
- Maintain consistency documentation
- Update index files si nouveaux docs

## Auto-Detection
**Git Changes Analysis:**
- Analyser `git diff` pour files modifiés
- Catégoriser : features | fixes | refactor | docs

**Code Analysis (Serena):**
- `mcp__serena__get_symbols_overview` sur fichiers changés
- Impact analysis modules business

**Database Changes:**
- Détecter nouvelles migrations Supabase
- Schema impact sur business rules

## Templates

### Manifest Update
```markdown
# Updated: [DATE]
## Changes
- Feature: [description]
- Impact: [business rules affected]
- Status: [complete/partial]

## Technical Notes
- [architectural decisions]
- [future considerations]
```

### Memory Bank Session
```markdown
# Session [DATE] - [TASK]

## Accomplished
- [task 1] ✅
- [task 2] ✅

## Key Decisions
- [architectural choice + reasoning]

## Next Session
- [what to continue/focus]

## Links
- Commit: [hash]
- PR: [url]
- Business Rules: [files updated]
```

### Task Archive
```markdown
# Completed [DATE] - [TASK]

## Summary
[work description]

## Files Modified
- [key files list]

## Business Impact
- [user-facing changes]
- [performance impacts]

## Follow-up
- [ ] [new task discovered]
```

## Success Metrics
✅ Documentation à jour
✅ Contexte persisté
✅ Business rules cohérents
✅ Tasks tracking précis

**AVANTAGE : Repository toujours synchronisé automatiquement !**
