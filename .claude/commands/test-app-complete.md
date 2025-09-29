# 🚀 /test-app-complete - Test Complet Application Vérone

**Description** : Test automatisé complet de l'application avec orchestration MCP intelligente

## Usage
```bash
/test-app-complete [module] [--quick]
```

## Workflow MCP Orchestré

### Phase 1: Analyse Architecture (Serena)
1. **Code Analysis**
   ```typescript
   mcp__serena__get_symbols_overview(src/app/catalogue/collections/page.tsx)
   mcp__serena__find_symbol(CollectionsPage)
   ```

2. **Hook Validation**
   ```typescript
   mcp__serena__find_symbol(useCollections, src/hooks/use-collections.ts)
   mcp__serena__find_referencing_symbols(useCollections)
   ```

### Phase 2: Database Validation (Supabase)
1. **Tables Check**
   ```typescript
   mcp__supabase__list_tables()
   mcp__supabase__execute_sql("SELECT COUNT(*) FROM collections")
   ```

2. **Logs Analysis**
   ```typescript
   mcp__supabase__get_logs("api")
   mcp__supabase__get_advisors("security")
   ```

### Phase 3: Application Testing (Multi-MCP)
1. **Server Check**
   ```bash
   curl -I http://localhost:3000
   curl -s http://localhost:3000/catalogue/collections | head -100
   ```

2. **Performance Monitoring**
   ```typescript
   // Sentry integration (via logs)
   - Response time < 2s
   - Memory usage < 80%
   - No console errors
   ```

### Phase 4: Business Logic (Sequential Thinking)
```typescript
mcp__sequential-thinking__sequentialthinking({
  thought: "Analyser la cohérence business des Collections",
  totalThoughts: 5
})
```

## Validation Criteria ✅

| Module | Test | MCP Tool | Success Criteria |
|--------|------|----------|------------------|
| **Collections** | Page Load | curl | HTTP 200 |
| **Collections** | Component Analysis | Serena | Symbols detected |
| **Collections** | Data Access | Supabase | Query success |
| **Collections** | Business Logic | Sequential | Logic coherent |

## Output Format

```markdown
## 🎯 Résultats Test Complet - Vérone Collections

### ✅ Architecture Code (Serena MCP)
- CollectionsPage: ✅ Détecté (12 symboles)
- useCollections: ✅ Fonctionnel (3 références)
- Imports: ✅ Tous résolus

### ✅ Base de Données (Supabase MCP)
- Table collections: ✅ 45 entrées
- Logs API: ✅ Aucune erreur
- Advisors: ✅ Sécurité OK

### ✅ Application Web
- Homepage: ✅ HTTP 200 (1.2s)
- Collections: ✅ HTTP 200 (0.8s)
- Console: ✅ 0 erreurs

### 🧠 Analyse Business (Sequential Thinking)
- Logique métier: ✅ Cohérente
- UX Flow: ✅ Optimisé
- Performance: ✅ Targets atteints

**Score Global: 98/100** 🏆
```

## Paramètres

- `[module]` : Collections, Dashboard, Stocks (défaut: Collections)
- `--quick` : Tests essentiels uniquement (30s vs 2min)

## Auto-Fix

En cas d'erreur détectée, la commande propose automatiquement :
- Correction Serena pour erreurs code
- Migration Supabase pour erreurs DB
- Restart server pour erreurs runtime

## Intégration CLAUDE.md

Cette commande respecte la **RÈGLE ABSOLUE Console Error Checking** :
- Zero tolerance: 1 erreur = échec système
- Fix ALL errors before success declaration
- Agent MCP usage systématique