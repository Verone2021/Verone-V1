# /error-check - Console Error Checking Protocol

## Description
**RÈGLE SACRÉE 2025** : Console Error Checking complet avant toute validation. Zero tolerance pour erreurs console.

## Usage
```bash
/error-check
```

## Console Error Checking Protocol (OBLIGATOIRE)

### Phase 1: BROWSER ERROR DETECTION
1. **Playwright Console Check** :
   - `mcp__playwright__browser_console_messages` sur l'application courante
   - Capturer TOUS les messages console (errors, warnings, logs)
   - Identifier les erreurs critiques vs warnings

2. **Navigation Error Check** :
   - `mcp__playwright__browser_navigate` vers pages principales
   - `mcp__playwright__browser_console_messages` sur chaque page
   - Dashboard, Catalogue, Stocks, Commandes (pages critiques)

### Phase 2: ERROR ANALYSIS & CATEGORIZATION
1. **Error Severity Assessment** :
   - **CRITICAL** : Erreurs JavaScript bloquantes
   - **HIGH** : Warnings répétés ou performance issues
   - **MEDIUM** : Console warnings non-critiques
   - **LOW** : Info logs excessive

2. **Serena Code Analysis** :
   - `mcp__serena__find_symbol` pour localiser source erreurs
   - `mcp__serena__get_symbols_overview` sur fichiers concernés

### Phase 3: DATABASE & API ERROR CHECK
1. **Supabase Logs Analysis** :
   - `mcp__supabase__get_logs` service "api" pour erreurs backend
   - `mcp__supabase__get_logs` service "postgres" pour erreurs DB
   - `mcp__supabase__get_logs` service "auth" pour erreurs authentification

2. **Real-time Issues** :
   - Si Sentry MCP disponible : `mcp__sentry__get_recent_issues`
   - Corréler erreurs browser avec erreurs production

### Phase 4: ERROR RESOLUTION MANDATORY
1. **Zero Tolerance Policy** :
   - ❌ **1 erreur critique = ÉCHEC SYSTÈME COMPLET**
   - ❌ **3+ warnings = ÉCHEC SYSTÈME PARTIEL**
   - ✅ **Console 100% clean = SUCCESS**

2. **Resolution Workflow** :
   - Pour chaque erreur : `mcp__serena__replace_symbol_body` si fix requis
   - Re-test avec Playwright après chaque fix
   - Boucle jusqu'à console 100% clean

### Phase 5: VALIDATION & ESCALATION
1. **Final Validation** :
   - `mcp__playwright__browser_console_messages` final check
   - `mcp__playwright__browser_snapshot` pour état final
   - Confirmer zero errors/warnings critiques

2. **Escalation si Nécessaire** :
   - Erreurs récurrentes : Sentry MCP escalation
   - Issues critiques non-résolues : GitHub issue automatique

## Success Criteria
- ✅ **Zero console errors** (obligatoire)
- ✅ **Zero critical warnings** (obligatoire)
- ✅ **API logs clean** (Supabase)
- ✅ **No Sentry alerts** (si disponible)
- ✅ **All pages navigable** sans erreurs

## Failure Response
- 🚨 **STOP ALL DEVELOPMENT** jusqu'à résolution
- 🚨 **Fix ALL errors** avant déclaration succès
- 🚨 **Re-run error-check** après chaque fix

## Intégration Workflow
```bash
# Usage typique dans le workflow
/feature-start → code changes → /error-check → /test-critical → deploy
```

**RÈGLE ABSOLUE : Jamais déclarer le succès tant qu'il y a des erreurs console visibles**