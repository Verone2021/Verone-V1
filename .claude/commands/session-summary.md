# /session-summary - Résumé Session Développement

Documentation automatique sessions de développement selon workflow 2025.

## Usage
```bash
/session-summary [type]
```

## Types de Résumé

### `complete` (défaut)
Résumé complet session courante : tâches, modifications, learnings, next steps.

### `quick`
Résumé rapide : actions principales uniquement.

### `learnings`
Focus sur insights techniques et processus.

### `archive`
Archivage session + nettoyage contexte actif.

## Workflow

### 1. Session Context Analysis
- `mcp__serena__read_memory` "active-context" - Contexte session
- `mcp__serena__list_memories` - Mémoires disponibles
- Git log aujourd'hui : `git log --since="today" --oneline`
- Git status : `git status --porcelain`

### 2. Actions Analysis
**Timespan:**
- Début/fin session
- Durée totale
- Temps effectif vs pauses

**Files Modified:**
- Créés, modifiés, supprimés, déplacés
- Catégorisation par module

**Tasks Completed:**
- Planifiées vs accomplies
- En cours vs bloquées
- Taux de complétion

**Agents MCP Used:**
- Agent → Nombre d'appels
- Tâches principales par agent
- Efficacité mesurée

**Achievements:**
- Code changes (LOC)
- Tests ajoutés
- Bugs fixés
- Performance improvements

**Learnings:**
- Techniques (frameworks, patterns)
- Process (workflow optimizations)
- Décisions architecturales

**Next Actions:**
- Immédiates (aujourd'hui)
- Court terme (semaine)
- Long terme (mois)

### 3. Documentation Generation

**Complete Summary Template:**
```markdown
# 📈 Session [DATE]

**Durée**: [HH:MM]
**Focus**: [main task]
**Status**: ✅ Succès | ⚠️ Partiel | ❌ Bloqué

## 🎯 Objectifs
- [x] [task 1]
- [x] [task 2]
- [ ] [task 3] (reporté)

## ✅ Réalisations
### Code
- [description] ([+LOC/-LOC])

### Tests
- [tests added/modified]

### Bugs Fixed
- [bug description] → [solution]

## 🔧 Modifications
**Créés**: [files]
**Modifiés**: [files]
**Supprimés**: [files]

## 🤖 Agents MCP
- [agent]: [calls] appels - [efficiency]%

## 💡 Learnings
**Techniques:**
- [learning 1]

**Process:**
- [improvement discovered]

**Décisions:**
- [architectural choice + why]

## 🚀 Next Steps
**Immédiat:**
- [ ] [action 1]

**Court Terme:**
- [ ] [action 2]

## 📊 Metrics
- Temps: [active time]
- Files: [count]
- LOC: +[added]/-[removed]
- Tests: +[count]
- Console errors: [count] (Target: 0)
- Performance: [notes]

## 🔗 Context
[What to know for next session]

---
*Session Claude Code 2025*
```

**Quick Summary Template:**
```markdown
# ⚡ Session [DATE]

**Focus**: [task]
**Status**: [status]
**Durée**: [time]

## Actions
- [action 1]
- [action 2]

## Next
- [next step]
```

### 4. MEMORY-BANK Integration
- Update `MEMORY-BANK/active-context.md`
- Archive → `MEMORY-BANK/sessions/[YYYY-MM-DD].md`
- Update `MEMORY-BANK/project-context.md` si impact global

### 5. Metrics & Trends
**Productivity:**
- Tasks/hour
- Code velocity (LOC/hour)
- Bug fix rate

**Quality:**
- Console errors (Target: 0)
- Test coverage added
- Refactorings count

**Tools:**
- Agent efficiency map
- Command usage stats
- Workflow adherence %

**Learning:**
- New concepts discovered
- Skills improved
- Process optimizations

### 6. Git Integration (Optionnel)
Si `--auto-commit` fourni :
```bash
git add -A
git commit -m "📝 Session [DATE]: [summary]

✅ [achievements]
🔧 [modifications]

🤖 Claude Code 2025
Co-Authored-By: Claude <noreply@anthropic.com>"
```

## Success Metrics
✅ Session documentée complètement
✅ Context preserved pour next session
✅ Learnings capturés
✅ Next steps clairs

**AVANTAGE : Continuité parfaite entre sessions + knowledge retention !**
