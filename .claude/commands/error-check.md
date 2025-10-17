# /error-check - Console Error Checking Complet

**RÈGLE SACRÉE 2025** : Zero tolerance pour erreurs console. Vérification Browser + Supabase.

## Usage
```bash
/error-check [page-url]
```

## Zero Tolerance Protocol

### 1. Browser Console Errors
- `mcp__playwright__browser_navigate` vers page spécifiée ou localhost:3000
- `mcp__playwright__browser_console_messages` - Capturer TOUS les messages
- Identifier errors (❌) vs warnings (⚠️) vs logs (ℹ️)
- Navigation pages critiques : Dashboard, Catalogue, Commandes, Stocks

### 2. Error Analysis
**Severity Levels:**
- **CRITICAL**: JavaScript errors bloquantes → STOP IMMÉDIAT
- **HIGH**: Warnings répétés (>3 fois) → Fix requis
- **MEDIUM**: Console warnings non-critiques → Review recommandé
- **LOW**: Info logs excessive → Nettoyage suggéré

### 3. Code Source Localization (Serena)
- `mcp__serena__find_symbol` pour localiser source des erreurs
- `mcp__serena__get_symbols_overview` sur fichiers concernés
- Identification rapide du code à corriger

### 4. Database & API Errors (Supabase)
- Credentials depuis `.env.local` (automatique)
- `mcp__supabase__get_logs` service "api" - Erreurs backend
- `mcp__supabase__get_logs` service "postgres" - Erreurs DB
- `mcp__supabase__get_logs` service "auth" - Erreurs authentification

### 5. Resolution Workflow
**MANDATORY:**
- ❌ 1 erreur critique = ÉCHEC SYSTÈME
- ⚠️ 3+ warnings = ÉCHEC PARTIEL
- ✅ Console 100% clean = SUCCESS

Pour chaque erreur détectée :
1. Localiser code source (Serena)
2. Appliquer fix avec `mcp__serena__replace_symbol_body`
3. Re-tester immédiatement avec Playwright
4. Répéter jusqu'à console 100% clean

### 6. Validation Finale
- `mcp__playwright__browser_console_messages` - Check final
- `mcp__playwright__browser_take_screenshot` - Preuve visuelle
- `mcp__playwright__browser_snapshot` - Accessibility check
- Confirmer zero errors/warnings critiques

## Success Criteria
✅ Zero console errors (obligatoire)
✅ Zero critical warnings (obligatoire)
✅ API/DB logs clean (Supabase)
✅ Toutes pages navigables sans erreurs

## Failure Response
🚨 **STOP DEVELOPMENT** jusqu'à résolution complète
🚨 **FIX ALL ERRORS** avant déclaration succès
🚨 **RE-RUN /error-check** après chaque correction

**RÈGLE ABSOLUE : Jamais valider avec des erreurs console visibles**
