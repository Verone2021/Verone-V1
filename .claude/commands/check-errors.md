# /check-errors - Console Error Detection via MCP Playwright

Vérifie les erreurs console sur une page avec MCP Playwright Browser

## Usage

```
/check-errors [url]
```

**Exemples** :
- `/check-errors http://localhost:3000/dashboard`
- `/check-errors http://localhost:3000/contacts-organisations/suppliers`
- `/check-errors` (page actuelle)

## Workflow Automatique

1. **Navigate** : Ouvre la page spécifiée
2. **Wait** : Attends 2s chargement complet
3. **Evaluate** : Récupère `window.__consoleErrorTracker.getErrors()`
4. **Console** : Vérifie console messages (errors uniquement)
5. **Screenshot** : Prend screenshot si erreurs détectées
6. **Report** : Génère rapport formaté

## Output Format

```
🔍 Error Check Report - http://localhost:3000/page
📅 2025-10-23T10:00:00.000Z

✅ Zero erreurs console détectées
✅ Application fonctionne correctement
```

ou

```
🔍 Error Check Report - http://localhost:3000/page
📅 2025-10-23T10:00:00.000Z

❌ 3 erreur(s) détectée(s)
⚠️  1 warning(s)

🔴 Erreurs trackées (Console Error Tracker):
1. [ERROR] Cannot read property 'map' of undefined
   Stack: TypeError: Cannot read property 'map' of undefined at ...
2. [ERROR] Failed to fetch /api/data
3. [WARN] React Hook useEffect has missing dependencies

🔴 Console Errors (MCP Playwright):
1. Uncaught TypeError: Cannot read property 'map' of undefined
2. GET http://localhost:3000/api/data 500 (Internal Server Error)
```

## Règles

- **Zero Tolerance** : 1 erreur console = échec complet
- **Fix First** : Corriger TOUTES erreurs avant continuer
- **Re-test** : Vérifier fix avec `/check-errors` après correction
- **Screenshot** : Toujours prendre screenshot comme preuve

## MCP Playwright Tools Utilisés

- `mcp__playwright__browser_navigate`
- `mcp__playwright__browser_wait_for`
- `mcp__playwright__browser_evaluate`
- `mcp__playwright__browser_console_messages`
- `mcp__playwright__browser_take_screenshot`

## Système Console Error Tracker

Le système capture automatiquement :
- `console.error()` override
- `console.warn()` override
- Global `error` events
- `unhandledrejection` events

Stockage :
- **Mémoire** : Last 100 errors (dev)
- **API** : POST `/api/logs` (production)
- **Fichiers** : `logs/logs-YYYY-MM-DD.json`

## Avantages vs Sentry

✅ **Simple** : Zero config, zero dépendances externes
✅ **Gratuit** : Aucun coût, aucune limite
✅ **Rapide** : MCP Playwright Browser instant
✅ **Privé** : Logs stockés localement
✅ **Automatisé** : Claude Code peut fixer directement

## Intégration CI/CD

```yaml
# .github/workflows/console-check.yml
- name: Check console errors
  run: |
    # MCP Playwright Browser automated check
    /check-errors http://localhost:3000/dashboard
    /check-errors http://localhost:3000/contacts-organisations/suppliers
```

## Best Practices (Reddit r/nextjs 2025)

1. **Toujours** vérifier console avant PR
2. **Zero erreur** = seul standard acceptable
3. **Logs structurés** > Sentry overkill
4. **MCP Browser** > Scripts de test manuels
5. **Console propre** = Code quality indicator

---

**Source** : Meilleures pratiques développeurs seniors Reddit, GitHub, Twitter 2025
