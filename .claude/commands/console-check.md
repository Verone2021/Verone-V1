# 🚨 /console-check - Vérification Console Zéro Erreur

**Description** : Validation console selon la **RÈGLE SACRÉE Console Error Checking** du CLAUDE.md

## Usage
```bash
/console-check [page] [--fix]
```

## Workflow Révolutionnaire 2025

### RÈGLE ABSOLUE (CLAUDE.md)
```typescript
// WORKFLOW OBLIGATOIRE (Règle Sacrée)
1. browser_console_messages() avant TOUTE validation
2. Zero tolerance: 1 erreur = échec système
3. Fix ALL errors before success declaration
4. Sentry MCP escalation si récurrent
```

## Phase 1: Détection Console (Browser MCP)

**Note**: Playwright MCP parfois instable, utilisation alternative avec curl + logs

```bash
# Alternative 1: Direct Browser Check (si disponible)
# mcp__playwright__browser_navigate(http://localhost:3000/catalogue/collections)
# mcp__playwright__browser_console_messages()

# Alternative 2: Sentry Auto-Detection (toujours disponible)
# Vérification via système auto-détection intégré
```

## Phase 2: Analyse Logs Server (Supabase MCP)
```typescript
mcp__supabase__get_logs("api")
- Filtrer erreurs dernière minute
- Identifier patterns récurrents
- Escalation automatique si critique
```

## Phase 3: Monitoring Sentry Integration
```bash
# Vérification Sentry auto-detection active
grep -r "SentryAutoDetector" src/lib/error-detection/
cat logs/console-errors.log 2>/dev/null || echo "Aucune erreur logged"
```

## Phase 4: Business Validation (Serena MCP)
```typescript
mcp__serena__search_for_pattern({
  substring_pattern: "console\.(error|warn)",
  restrict_search_to_code_files: true
})
- Détection console.error/warn dans le code
- Validation que tous sont gérés proprement
```

## Critères Validation ✅

| Type Erreur | Detection | Auto-Fix | Escalation |
|-------------|-----------|----------|------------|
| **Console Errors** | Playwright/Sentry | Immédiate | Critical |
| **Network 4xx/5xx** | Supabase logs | Retry logic | High |
| **React Warnings** | Code scan | Dev guidance | Medium |
| **Performance** | Timing analysis | Optimization | Low |

## Output Format

```markdown
## 🚨 Console Check Results - Collections Page

### ❌ ERREURS CRITIQUES DÉTECTÉES
1. **TypeError**: Cannot read property 'map' of undefined
   - File: collections/page.tsx:156
   - Fix: Add data?.collections?.map() safety check
   - Priority: 🔴 CRITICAL

### ⚠️ WARNINGS
1. **React**: componentWillMount deprecated
   - Component: CollectionFormModal
   - Fix: Use useEffect instead
   - Priority: 🟡 MEDIUM

### ✅ STATUS FINAL
- Console Errors: ❌ 1 CRITIQUE
- Performance: ✅ <2s load time
- Sentry Auto-Detection: ✅ Actif
- **VERDICT: ÉCHEC - Fix required before deploy**
```

## Auto-Fix Intégré

```typescript
// Si erreurs détectées
if (errors.length > 0) {
  // 1. Serena MCP: Auto-correction code
  mcp__serena__replace_symbol_body(errorLocation, fixedCode)

  // 2. Restart server clean
  rm -rf .next && npm run dev

  // 3. Re-test immédiatement
  /console-check --validate-fix
}
```

## Paramètres

- `[page]` : collections, dashboard, stocks (défaut: collections)
- `--fix` : Auto-correction via Serena MCP
- `--validate-fix` : Re-test après correction
- `--strict` : Mode zero-warning (dev)

## Intégration Workflow 2025

```typescript
// Usage dans workflow principal
/feature-start "nouvelle-fonctionnalité"
// ... développement ...
/console-check --fix          // ← OBLIGATOIRE avant validation
/test-app-complete            // ← Seulement si console clean
/deploy-check                 // ← Deploy autorisé
```

## Monitoring Continu

La commande s'intègre avec :
- **Sentry Auto-Detection** : Monitoring temps réel
- **Sequential Thinking** : Analyse patterns erreurs
- **GitHub Actions** : Validation automatique PR

**Règle d'Or** : Jamais de déploiement avec erreurs console non résolues !