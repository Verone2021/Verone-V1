# Cohabitation Chrome DevTools MCP + Playwright MCP

**Date** : 2026-01-22
**Statut** : ACTIF (les deux MCP activés)

## 🎯 Stratégie de Cohabitation

### Configuration Actuelle

**MCP Browsers Actifs** :

- ✅ **Playwright MCP** (playwright-lane-1, playwright-lane-2)
- ✅ **Chrome DevTools MCP** (chrome-devtools)

**Node.js** : v24.13.0 LTS (via nvm)
**npm** : 11.6.2

---

## 📋 Quand Utiliser Quel MCP ?

### Playwright MCP (Tests & Automation)

**Cas d'usage PRIORITAIRES** :

- ✅ Tests E2E automatisés (packages/e2e-linkme, e2e-back-office)
- ✅ Workflows automation multi-étapes
- ✅ Scraping données structurées (via accessibility tree)
- ✅ Tests cross-browser (Chrome, Firefox, Safari)
- ✅ Validation fonctionnelle UI
- ✅ Screenshots rapides

**Commandes MCP Playwright** :

```javascript
// Console errors uniquement (économise tokens)
browser_console_messages({ onlyErrors: true });

// Navigation et interaction
browser_navigate({ url: 'http://localhost:3000' });
browser_click({ selector: "button[type='submit']" });
browser_fill({ selector: "input[name='email']", value: 'test@verone.com' });

// Screenshot
browser_take_screenshot({ filename: 'debug.png' });

// Accessibility snapshot (préférer au screenshot)
browser_snapshot();
```

---

### Chrome DevTools MCP (Debugging & Performance)

**Cas d'usage SPÉCIFIQUES** :

- 🐛 **Debugging bugs critiques** (erreurs runtime, 500s)
- 🔍 **Inspection Network requests** (APIs Supabase, Qonto)
- ⚡ **Analyse performance** (LCP, CLS, FID)
- 🕵️ **Reverse engineering API** (endpoints non documentés)
- 🔧 **Fix console errors** en temps réel

**Commandes MCP Chrome DevTools** :

```javascript
// Performance profiling (LCP, CLS)
devtools_performance_trace();

// Network inspection (API calls)
devtools_network_requests();

// Console errors avec stack traces
devtools_console_logs();

// DOM/CSS inspection
devtools_inspect_element({ selector: '#app' });
```

**⚠️ Prérequis** : Lancer Chrome avec remote debugging

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

---

## 🚨 Gestion des Conflits

### Problème : Commandes Overlapping

Les deux MCP ont des commandes similaires (click, navigate, screenshot) mais avec implémentations différentes. Le client Claude peut se confondre.

**Source** : [Slav Kurochkin LinkedIn](https://www.linkedin.com/posts/slavkurochkin_model-context-protocol-mcp-is-great-for-activity-7379157764620832770-keCs)

### Solution 1 : Instructions Explicites à Claude

**Toujours préciser QUEL MCP utiliser** :

```markdown
# ✅ BON (explicite)

"Utilise PLAYWRIGHT MCP pour tester le login flow"
"Utilise CHROME DEVTOOLS MCP pour analyser la performance du dashboard"

# ❌ MAUVAIS (ambigu)

"Teste le login flow" # Claude ne sait pas quel MCP choisir
```

### Solution 2 : Désactiver Temporairement un MCP

**Si confusion ou conflit détecté**, désactiver l'un des deux MCP :

#### Désactiver Playwright (garder Chrome DevTools)

```bash
# Éditer .claude/settings.json
# Commenter les lignes playwright-lane-1 et playwright-lane-2
```

```json
{
  "enabledMcpServers": [
    "serena",
    // "playwright-lane-1",
    // "playwright-lane-2",
    "context7",
    "magic",
    "supabase",
    "chrome-devtools"
  ]
}
```

#### Désactiver Chrome DevTools (garder Playwright)

```json
{
  "enabledMcpServers": [
    "serena",
    "playwright-lane-1",
    "playwright-lane-2",
    "context7",
    "magic",
    "supabase"
    // "chrome-devtools"
  ]
}
```

**⚠️ Redémarrer Claude Code** après modification du fichier settings.json.

---

## 💰 Consommation Tokens

### Overhead Context par MCP

| MCP                  | Tokens Chargés     | % du Budget 200k |
| -------------------- | ------------------ | ---------------- |
| Playwright MCP       | 13,700 tokens      | 6.8%             |
| Chrome DevTools MCP  | 18,000 tokens      | 9.0%             |
| **TOTAL (les deux)** | **~32,000 tokens** | **16%**          |

**Impact** : 32,000 tokens consommés **AVANT même de commencer à coder**.

**Sources** :

- [Claude Code Token Bloat Analysis](https://medium.com/@joe.njenga/claude-code-just-cut-mcp-context-bloat-by-46-9-51k-tokens-down-to-8-5k-with-new-tool-search-ddf9e905f734)
- [MCP Context Optimization](https://scottspence.com/posts/optimising-mcp-server-context-usage-in-claude-code)

### Recommandation Economie Tokens

- **Tâche Tests E2E** → Désactiver Chrome DevTools
- **Tâche Debugging Performance** → Désactiver Playwright
- **Tâche Mixte** → Garder les deux mais instructions explicites

---

## 🧪 Workflow Recommandé

### Scénario 1 : Tests E2E LinkMe (Login Flow)

1. **Désactiver** Chrome DevTools temporairement
2. **Utiliser** Playwright MCP uniquement
3. Lancer tests : `pnpm test:e2e` (packages/e2e-linkme)
4. **Réactiver** Chrome DevTools après validation

### Scénario 2 : Bug Critique Dashboard (500 API)

1. **Désactiver** Playwright temporairement
2. **Lancer Chrome** avec remote debugging (port 9222)
3. **Utiliser** Chrome DevTools MCP pour :
   - Inspecter Network tab (requêtes API Supabase)
   - Analyser console errors avec stack traces
   - Vérifier timing requests (slow queries)
4. Fix le bug
5. **Réactiver** Playwright pour tests de régression

### Scénario 3 : Feature Complète (Add Invoice Workflow)

1. **Phase DEVELOP** : Garder Playwright uniquement
   - Coder la feature
   - Tests unitaires / E2E

2. **Phase DEBUG** : Switcher vers Chrome DevTools
   - Tester en local (localhost:3000)
   - Analyser performance
   - Fix console errors

3. **Phase VERIFY** : Retour Playwright
   - Tests E2E complets
   - Validation cross-browser si nécessaire

---

## 📊 Matrice Décision Rapide

```
┌──────────────────────────────────────────────────┐
│  QUELLE TÂCHE ?  →  QUEL MCP ?                   │
├──────────────────────────────────────────────────┤
│                                                  │
│  Tests E2E automatisés     →  PLAYWRIGHT        │
│  Debug erreur 500 API      →  CHROME DEVTOOLS   │
│  Performance audit (LCP)   →  CHROME DEVTOOLS   │
│  Scraping Qonto data       →  PLAYWRIGHT        │
│  Cross-browser testing     →  PLAYWRIGHT        │
│  Network inspection        →  CHROME DEVTOOLS   │
│  Automation multi-étapes   →  PLAYWRIGHT        │
│  Console errors fix        →  CHROME DEVTOOLS   │
│                                                  │
│  ⚠️ Si CONFLIT détecté → Désactiver un MCP      │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 🔧 Commandes Utiles

### Vérifier Versions

```bash
# Node.js via nvm
zsh -c 'source ~/.zshrc && node --version'

# npm
npm --version

# Playwright browsers
npx playwright --version
```

### Lancer Chrome avec Remote Debugging

```bash
# Obligatoire pour Chrome DevTools MCP
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

### Toggle MCP (Manuel)

```bash
# Éditer settings.json
code .claude/settings.json

# Commenter/décommenter les MCP selon besoin
# Redémarrer Claude Code
```

---

## 📚 Sources & Références

### Documentation Officielle

- [Chrome DevTools MCP Official Blog](https://developer.chrome.com/blog/chrome-devtools-mcp)
- [Microsoft Playwright MCP GitHub](https://github.com/microsoft/playwright-mcp)
- [Anthropic MCP Best Practices](https://github.com/anthropics/claude-code/issues/3406)

### Guides & Comparaisons

- [Slav Kurochkin - Choosing Between Playwright & Chrome DevTools](https://www.linkedin.com/posts/slavkurochkin_model-context-protocol-mcp-is-great-for-activity-7379157764620832770-keCs)
- [MCP Integration Guide - Scrapeless](https://www.scrapeless.com/en/blog/mcp-integration-guide)
- [Top 3 MCP Servers Comparison](https://karangoyal.cc/blog/top-3-essential-mcp-servers-claude-workflow)

### Performance & Token Optimization

- [Claude Code Token Bloat - 46.9% Reduction](https://medium.com/@joe.njenga/claude-code-just-cut-mcp-context-bloat-by-46-9-51k-tokens-down-to-8-5k-with-new-tool-search-ddf9e905f734)
- [MCP Performance Optimization Guide](https://www.catchmetrics.io/blog/a-brief-introduction-to-mcp-server-performance-optimization)
- [Scott Spence - Optimising MCP Context Usage](https://scottspence.com/posts/optimising-mcp-server-context-usage-in-claude-code)

---

## ✅ Validation Installation

### Checklist Post-Installation

- [x] nvm v0.40.1 installé
- [x] Node.js v24.13.0 LTS installé
- [x] npm 11.6.2 installé
- [x] Chrome DevTools MCP ajouté à ~/.claude.json
- [x] Chrome DevTools MCP activé dans .claude/settings.json
- [x] Documentation créée (.serena/memories/)
- [ ] Test Chrome DevTools MCP sur cas réel (bug critique)

### Test Rapide Chrome DevTools

1. Lancer Chrome avec remote debugging (port 9222)
2. Demander à Claude : "Utilise CHROME DEVTOOLS MCP pour inspecter localhost:3000"
3. Vérifier que Claude se connecte au browser et retourne des infos console/network

**Si erreur** : Vérifier que Chrome est bien lancé avec `--remote-debugging-port=9222`

---

## 🎓 Leçons Apprises

### Pourquoi Cohabitation (Malgré Conflits Potentiels) ?

**Décision utilisateur** : Bugs critiques nécessitent Chrome DevTools (debugging supérieur).

**Mitigation risques** :

1. Instructions explicites à Claude (QUEL MCP utiliser)
2. Toggle temporaire selon tâche
3. Monitoring tokens consumption
4. Documentation claire (ce fichier)

**Trade-off accepté** :

- ➕ Gain debugging hardcore (bugs semaines non résolus)
- ➖ +18k tokens overhead + risque confusion
- ✅ Bénéfice > Coût pour cas d'usage Verone

---

**Dernière mise à jour** : 2026-01-22
**Auteur** : Romeo (avec Claude Sonnet 4.5)
**Statut** : PRODUCTION ACTIVE
