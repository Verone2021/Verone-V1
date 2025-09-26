# /deploy-check - Validation Pré-Déploiement

## Description
Validation complète pré-déploiement selon GitHub Flow 2025 : build + tests + sécurité + performance avant merge main.

## Usage
```bash
/deploy-check
```

## Deployment Validation Protocol

### Phase 1: BUILD & COMPILE VALIDATION
1. **Production Build Test** :
   ```bash
   npm run build
   ```
   - Build doit réussir sans erreurs
   - Zero TypeScript errors
   - Zero ESLint critical errors

2. **Environment Variables Check** :
   - Vérifier `.env.local` présent
   - `mcp__supabase__get_project_url` et `mcp__supabase__get_anon_key`
   - Variables Sentry/GitHub configurées

3. **Dependencies Audit** :
   ```bash
   npm audit --audit-level high
   ```
   - Pas de vulnérabilités high/critical
   - Dependencies à jour pour sécurité

### Phase 2: DATABASE & API VALIDATION
1. **Database Integrity** :
   - `mcp__supabase__get_advisors` type "security"
   - `mcp__supabase__get_advisors` type "performance"
   - Résoudre toutes recommendations AVANT deploy

2. **Migration Validation** :
   - `mcp__supabase__list_migrations` pour vérifier état
   - Pas de migrations pending non-appliquées
   - Schema cohérent avec application

3. **API Endpoints Health** :
   - `mcp__supabase__get_logs` service "api" (past 5 minutes)
   - Pas d'erreurs 500/400 récurrentes
   - Response times acceptables

### Phase 3: CRITICAL TESTS FINAL RUN
1. **Auto-run Critical Tests** :
   - Execute `/test-critical` automatiquement
   - 100% pass rate mandatory
   - Console errors = deployment blocked

2. **Performance Validation** :
   - Dashboard <2s (SLO critique)
   - Catalogue <3s (SLO critique)
   - `mcp__playwright__browser_console_messages` performance warnings

3. **Accessibility Final Check** :
   - `mcp__playwright__browser_snapshot` sur pages principales
   - Design System Vérone compliance
   - Navigation keyboard fonctionnelle

### Phase 4: SECURITY & MONITORING
1. **Sentry Configuration** :
   - Si Sentry MCP disponible : vérifier pas d'issues critiques
   - Configuration production correcte
   - Error tracking opérationnel

2. **RLS & Permissions** :
   - `mcp__supabase__execute_sql` test RLS policies
   - Permissions utilisateurs correctes
   - Pas de data leaks possibles

### Phase 5: GITHUB & DEPLOYMENT PREP
1. **Branch Status** :
   - `mcp__github__create_pull_request` si pas encore créé
   - Description PR automatique avec summary changes
   - Assign reviewers si nécessaire

2. **CI/CD Pipeline Check** :
   - GitHub Actions status green
   - Vercel deployment preview disponible
   - Pas de failing tests en CI

### Phase 6: FINAL GO/NO-GO DECISION

#### ✅ **GO CONDITIONS (ALL MUST BE TRUE)**
- ✅ Build production successful
- ✅ Zero console errors critical
- ✅ All critical tests passed (100%)
- ✅ Performance SLOs respected
- ✅ Database advisors clean
- ✅ Security validations passed
- ✅ Dependencies audit clean
- ✅ Sentry no critical alerts

#### ❌ **NO-GO CONDITIONS (ANY BLOCKS DEPLOY)**
- ❌ Build errors/warnings critical
- ❌ Console errors présentes
- ❌ Critical tests failures
- ❌ Performance SLOs violated
- ❌ Security recommendations unresolved
- ❌ Database advisors show critical issues

### Phase 7: DEPLOYMENT EXECUTION
1. **If GO Decision** :
   - `mcp__github__merge_pull_request` avec message détaillé
   - Auto-deployment Vercel sur main branch
   - Monitor déploiement success

2. **If NO-GO Decision** :
   - List toutes conditions non-remplies
   - Block merge avec detailed explanation
   - Guidance pour résoudre issues

## Post-Deployment Monitoring
1. **Immediate Validation** :
   - Production site responsive
   - `mcp__supabase__get_logs` pour nouvelles erreurs
   - Sentry alerts monitoring (si disponible)

2. **Performance Validation** :
   - SLOs respectés en production
   - Database performance stable
   - User experience preserved

## Success Metrics
- ✅ **Zero deployment failures**
- ✅ **100% pre-checks passed**
- ✅ **Production stability maintained**
- ✅ **User experience preserved**

## Integration dans Workflow
```bash
# Workflow standard pre-deployment
/feature-start → development → /error-check → /test-critical → /deploy-check → production
```

## Escalation Protocol
- **Critical issues found** → Block deployment + detailed report
- **Performance regressions** → Rollback plan activated
- **Security concerns** → Security team notification

**PHILOSOPHIE : Better safe deployment than fast broken deployment**