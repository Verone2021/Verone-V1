# 🌐 /browser-test - Test Navigation Manuelle Playwright MCP

**Description** : Test complet de navigation manuelle avec Playwright MCP configuré

## Usage
```bash
/browser-test [url] [--mode=manual|auto]
```

## Configuration Playwright MCP Optimisée

### Paramètres Actuels
```json
{
  "playwright": {
    "command": "npx",
    "args": [
      "@playwright/mcp@latest",
      "--browser=chromium",
      "--executable-path=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "--isolated",
      "--output-dir=.playwright-mcp",
      "--save-session",
      "--save-trace",
      "--grant-permissions=clipboard-read,clipboard-write,geolocation",
      "--timeout-action=10000",
      "--timeout-navigation=30000"
    ]
  }
}
```

## Workflow Test Complet

### Phase 1: Lancement Browser
1. **Démarrage Playwright MCP**
   ```typescript
   // Mode navigation manuelle visible
   mcp__playwright__browser_navigate("http://localhost:3000")
   ```

2. **Vérification Browser**
   - Browser Chrome visible s'ouvre
   - Session isolée (pas d'historique précédent)
   - Permissions clipboard/geolocation accordées

### Phase 2: Navigation Application Vérone
1. **Page d'accueil**
   ```typescript
   mcp__playwright__browser_navigate("http://localhost:3000")
   mcp__playwright__browser_console_messages() // Vérifier 0 erreurs
   ```

2. **Page Collections**
   ```typescript
   mcp__playwright__browser_navigate("http://localhost:3000/catalogue/collections")
   // Redirection login attendue
   mcp__playwright__browser_take_screenshot("collections-login-redirect")
   ```

3. **Tests Interactifs**
   ```typescript
   mcp__playwright__browser_click("//input[@type='email']")
   mcp__playwright__browser_type("test@verone.com")
   // Navigation manuelle visible pour l'utilisateur
   ```

### Phase 3: Console & Performance
1. **Console Error Checking**
   ```typescript
   mcp__playwright__browser_console_messages()
   // Règle Sacrée: 0 erreur tolérance
   ```

2. **Performance Monitoring**
   - Navigation < 2s
   - Console errors: 0
   - Screenshots automatiques sauvées

## Tests Manuels Disponibles

| Test | Commande MCP | Objectif |
|------|--------------|----------|
| **Navigation** | `browser_navigate` | Tester URL application |
| **Console** | `browser_console_messages` | Vérifier erreurs JS |
| **Screenshots** | `browser_take_screenshot` | Capturer état page |
| **Interaction** | `browser_click/type` | Tests utilisateur |
| **Snapshot** | `browser_snapshot` | Accessibility check |

## Configuration Debug

### Fichiers de Sortie
```bash
.playwright-mcp/
├── session-state.json     # État session sauvegardé
├── traces/               # Traces navigation pour debug
├── screenshots/          # Captures écran automatiques
└── logs/                # Logs détaillés Playwright
```

### Troubleshooting
1. **Browser ne s'ouvre pas**
   - Vérifier Chrome installé : `/Applications/Google Chrome.app/`
   - Tester Chromium : `--browser=chromium` sans executable-path

2. **Erreurs permissions**
   - Accorder permissions système macOS
   - Vérifier `--grant-permissions` dans config

3. **Timeouts**
   - Ajuster `--timeout-action` et `--timeout-navigation`
   - Application locale : timeouts réduits

## Mode Navigation Manuelle

**Avantage Principal** : Vous voyez le browser s'ouvrir et naviger en temps réel !

```typescript
// Séquence test complète visible
1. Browser Chrome s'ouvre (visible)
2. Navigation vers http://localhost:3000 (visible)
3. Redirection login (visible)
4. Console errors checking (automatique)
5. Screenshots sauvegardées (automatique)
```

## Intégration Workflow Vérone

```bash
# Test rapide application
/browser-test localhost:3000

# Test complet avec captures
/browser-test localhost:3000/catalogue/collections --mode=manual

# Debug avec traces complètes
/browser-test --trace-mode
```

**Navigation manuelle optimisée pour tests Vérone Collections** 🎭