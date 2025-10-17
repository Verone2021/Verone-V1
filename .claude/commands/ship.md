# /ship - Livrer Feature en Production

Workflow complet de validation avant deployment : Tests + Console + Review + PR.

## Usage
```bash
/ship [feature-name]
```

## Pre-Deployment Checklist

### 1. Console Error Checking (MANDATORY)
```bash
# Exécution automatique /error-check
```
- ❌ **Si 1+ erreur critique** → STOP, fix ALL, re-run
- ⚠️ **Si 3+ warnings** → Review et fix recommandé
- ✅ **Console 100% clean** → Continue

### 2. Tests Critiques (MANDATORY)
```bash
# Exécution automatique /test-critical
```
**Modules testés selon feature :**
- Dashboard si metrics/KPIs modifiés
- Catalogue si produits/collections touchés
- Stocks si inventory management impacté
- Commandes si order flow modifié

**Success Required:**
- ✅ 100% tests critiques passed
- ✅ Performance SLOs respectés
- ✅ Zero regression détectée

### 3. Code Quality Review

**Serena Analysis:**
- `mcp__serena__get_symbols_overview` sur fichiers modifiés
- Vérifier structure code cohérente
- Pas de code commenté/debug restant

**Best Practices Check:**
- Design System Vérone V2 respecté
- Product Images Pattern (BR-TECH-002) si applicable
- RLS policies Supabase si tables touchées
- TypeScript types stricts (pas de `any`)

### 4. Database Validation (Si Migrations)

**Supabase Checks:**
- `mcp__supabase__list_migrations` - Migrations appliquées
- `mcp__supabase__get_advisors` - Security/Performance OK
- RLS policies testées avec different roles
- Backup avant migration appliquée

**Migration Safety:**
- [ ] Backward compatible (si possible)
- [ ] Rollback plan documenté
- [ ] Data migration testée sur staging
- [ ] Index performance validée

### 5. Documentation Update

**MEMORY-BANK:**
- `mcp__serena__write_memory` avec feature summary
- Archive session → `MEMORY-BANK/sessions/`
- Update `MEMORY-BANK/active-context.md`

**Manifests:**
- Update `manifests/prd/` status → completed
- Business rules modifiées documentées
- Architecture changes dans ADR si applicable

### 6. Git Commit & Branch Status

**Commit Quality:**
```bash
git log --oneline -5
```
- Messages descriptifs et conventionnels
- Commits atomiques (pas de "WIP", "fix", "test")
- Co-authored avec Claude si applicable

**Branch Clean:**
```bash
git status
```
- Pas de fichiers non-trackés critiques
- `.env.local` jamais commité
- `node_modules/` ignoré

### 7. GitHub Pull Request Creation

**PR Title Convention:**
```
[TYPE] Feature: Description courte

TYPE: feat | fix | refactor | perf | docs
```

**PR Description Auto-Generated:**
```markdown
## 🎯 Objectif
[Feature description from plan]

## ✅ Changements Principaux
- [Change 1 avec impact business]
- [Change 2 avec impact technique]

## 🧪 Tests Effectués
- [x] Console 100% clean (/error-check)
- [x] Tests critiques passed (/test-critical)
- [x] Performance SLOs respectés
- [x] Accessibility validated

## 📊 Performance
- Dashboard: [time]s (Target: <2s)
- Catalogue: [time]s (Target: <3s)
- [Other metrics]

## 🗄️ Database
- [x] Migrations appliquées et testées
- [x] RLS policies validées
- [x] Rollback plan: [description]

## 📝 Documentation
- [x] MEMORY-BANK updated
- [x] Manifests/PRD updated
- [x] ADR créé (si architecture change)

## 🔗 Liens
- Feature Planning: MEMORY-BANK/sessions/[date].md
- Business Rules: manifests/business-rules/[file]
- ADR: manifests/architecture/adr/[num]

## 🚀 Ready to Merge
- [x] All checks passed
- [x] Console zero errors
- [x] Tests 100% success
- [x] Documentation complete

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Create PR:**
```typescript
mcp__github__create_pull_request({
  owner: "[owner]",
  repo: "[repo]",
  title: "[TYPE] Feature: [name]",
  head: "feature/[name]",
  base: "main",
  body: "[auto-generated description]"
})
```

### 8. Deployment Auto-Trigger (Vercel)

**Si PR merged** → Vercel auto-deploy

**Post-Deployment Checks:**
1. Vercel build success (check dashboard)
2. Production URL accessible
3. `/error-check` sur production URL
4. Monitor console erreurs production 5 premières minutes

## Workflow Visual

```
/ship feature-name
  ↓
1. /error-check ────→ ❌ Errors? → Fix ALL → Re-run
  ✅
  ↓
2. /test-critical ──→ ❌ Failed? → Debug → Re-run
  ✅
  ↓
3. Code Review ─────→ ⚠️ Issues? → Refactor
  ✅
  ↓
4. DB Validation ───→ ⚠️ Migration risk? → Staging test
  ✅
  ↓
5. Docs Update ─────→ MEMORY-BANK + Manifests
  ✅
  ↓
6. Git Status ──────→ Clean commits
  ✅
  ↓
7. Create PR ───────→ Auto-description + checks
  ✅
  ↓
8. Merge → Deploy ──→ Vercel auto-deploy
  ✅
  ↓
9. Production Check → Monitor 5min
  ✅
  ↓
🎉 SHIPPED SUCCESSFULLY!
```

## Failure Scenarios

### ❌ Console Errors Detected
```
→ STOP deployment
→ Run /error-check for details
→ Fix ALL errors
→ Re-run /ship
```

### ❌ Tests Failed
```
→ STOP deployment
→ Debug failed test
→ Fix code
→ Re-run tests until 100% pass
→ Re-run /ship
```

### ❌ Performance Below SLO
```
→ REVIEW deployment decision
→ Profile bottlenecks
→ Optimize queries/code
→ Re-test performance
→ Re-run /ship if improved
```

### ❌ Database Migration Risk
```
→ TEST on staging environment
→ Backup production database
→ Plan rollback procedure
→ Apply migration off-peak hours
→ Monitor closely post-migration
```

## Success Metrics
✅ Zero console errors production
✅ All tests passing (100%)
✅ Performance SLOs respected
✅ Documentation complete
✅ Clean PR merged to main
✅ Production deployment successful
✅ No rollback needed

## Post-Ship Actions (Automated)

**Context Update:**
```bash
/context-update "Shipped feature: [name]"
```

**Session Archive:**
```bash
/session-summary archive
```

**Manifests Sync:**
- PRD status → completed
- Feature moved to shipped log
- Metrics baseline updated

**MEMORY-BANK:**
- Active feature removed
- Success recorded pour future reference
- Learnings documented

## Example Usage

```bash
# Ship complete feature
/ship dashboard-analytics

# Output:
✅ Console Check: PASSED (0 errors)
✅ Tests Critical: PASSED (12/12)
✅ Code Review: PASSED
✅ Database: No migrations
✅ Documentation: Updated
✅ PR Created: #123
✅ Auto-deploy: Triggered
🎉 Feature shipped successfully!

Next: Monitor production for 5 minutes
```

**AVANTAGE : Déploiement sûr et automatisé en 1 commande !**
