# /context-update - Mise à Jour Repository Automatisée

## Description
**AUTO-UPDATE SYSTEM 2025** : Mise à jour systématique manifests/memory-bank/tasks après chaque tâche selon best practices repository maintenance.

## Usage
```bash
/context-update [task-summary]
```

## Repository Auto-Update Protocol

### Phase 1: TASK COMPLETION ANALYSIS
1. **Current Context Analysis** :
   - `mcp__serena__read_memory` pour récupérer session courante
   - Identifier les modules/files modifiés
   - Analyser impact changes sur business rules

2. **Changes Impact Assessment** :
   - `mcp__serena__find_referencing_symbols` pour dépendances
   - `mcp__supabase__get_advisors` pour impacts database
   - Liste complète modifications effectuées

### Phase 2: MANIFESTS UPDATE
1. **Business Rules Validation** :
   - Examiner `manifests/business-rules/` concernés
   - Mettre à jour règles si changements architecturaux
   - Validation cohérence avec implémentation

2. **PRD Updates** :
   - `manifests/prd/` mis à jour si nouvelles fonctionnalités
   - Statut features updated (pending → implemented)
   - Dependencies et requirements à jour

3. **Architecture Documentation** :
   - `manifests/architecture/` si changements structurels
   - Database schema updates si migrations
   - API specifications updates si endpoints modifiés

### Phase 3: MEMORY-BANK MAINTENANCE
1. **Active Context Update** :
   - Créer/update `MEMORY-BANK/active-context.md`
   - Session summary avec tâches accomplies
   - Context pour prochaines sessions

2. **AI Context Preservation** :
   - `mcp__serena__write_memory` avec nouveau context
   - Key learnings et décisions importantes
   - Architecture insights pour future development

3. **Process Archive** :
   - Archiver session complétée vers `MEMORY-BANK/process-archive/`
   - Format: `2025-MM-DD-task-summary.md`
   - Links vers commits et PRs associés

### Phase 4: TASKS MANAGEMENT
1. **Active Tasks Update** :
   - Marquer tâche courante comme completed dans `TASKS/active/`
   - Move vers `TASKS/completed/` avec timestamp
   - Update statut dependencies/blockers

2. **Backlog Prioritization** :
   - Update `TASKS/backlog-prioritized.md` si nécessaire
   - Nouveau issues découverts durant development
   - Technical debt identified

3. **Module Features Tracking** :
   - Update `TASKS/modules-features/` concernés
   - Features status: planned → in-progress → completed
   - Cross-module dependencies tracking

### Phase 5: GITHUB INTEGRATION
1. **Commit Message Generation** :
   - Générer commit message détaillé basé sur changes
   - Include task summary et impact business
   - Reference PRD/business rules modifiés

2. **GitHub Documentation** :
   - Update README.md si workflow changes
   - Update CHANGELOG.md si user-facing features
   - Tag releases si milestone completed

### Phase 6: KNOWLEDGE PERSISTENCE
1. **Documentation Cross-Links** :
   - Créer links entre manifests/memory-bank/tasks
   - Maintain consistency across documentation
   - Update index files si nouveaux documents

2. **Future Context Preparation** :
   - Identifier next logical development steps
   - Pre-populate upcoming tasks context
   - Dependencies mapping pour planning

## Arguments & Customization
```bash
/context-update                           # Auto-detect changes et update
/context-update "Dashboard metrics impl"  # Custom task summary
```

## Auto-Detection Logic
1. **Git Changes Analysis** :
   - Analyser `git diff` pour files modifiés
   - Categorize changes: features/fixes/refactor/docs

2. **Code Analysis** :
   - `mcp__serena__get_symbols_overview` sur files changed
   - Impact analysis sur modules business

3. **Database Changes** :
   - `mcp__supabase__list_migrations` pour nouvelles migrations
   - Schema impact sur business rules

## Update Templates

### **Manifest Update Template**
```markdown
# Updated: [DATE]
## Changes Summary
- Feature: [description]
- Impact: [business rules affected]
- Status: [implementation complete/partial]

## Implementation Notes
- [technical details]
- [architectural decisions]
- [future considerations]
```

### **Memory Bank Template**
```markdown
# Session: [DATE] - [TASK_SUMMARY]

## Accomplished
- [task 1] ✅
- [task 2] ✅

## Key Decisions
- [architectural choice with reasoning]

## Context for Next Session
- [what to continue/focus next]

## Links
- Commit: [hash]
- PR: [link]
- Business Rules Updated: [files]
```

### **Tasks Archive Template**
```markdown
# Completed: [DATE] - [TASK]

## Status: ✅ COMPLETED

## Implementation Summary
[description of work done]

## Files Modified
- [list of key files]

## Business Impact
- [user-facing changes]
- [performance impacts]
- [business rules changes]

## Follow-up Tasks Generated
- [ ] [new task discovered]
```

## Success Metrics
- ✅ **All documentation current**
- ✅ **Context preserved for future**
- ✅ **Business rules consistent**
- ✅ **Tasks tracking accurate**

## Integration dans Workflow Standard
```bash
# Workflow complet automatisé
/feature-start → development → /error-check → /test-critical → /deploy-check → /context-update
```

**AVANTAGE RÉVOLUTIONNAIRE : Repository toujours à jour sans effort manuel !**