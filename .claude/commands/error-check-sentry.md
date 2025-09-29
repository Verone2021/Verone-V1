# Console Error Checking avec Escalation Sentry

**Command**: `/error-check-sentry`

**Description**: Console error checking complet avec escalation automatique vers Sentry selon la règle "Zero Tolerance" du repository Vérone.

## 🎯 Usage

```bash
# Check console errors page courante
/error-check-sentry

# Check console errors URL spécifique
/error-check-sentry https://localhost:3000/catalogue

# Full quality check (navigation + console + accessibility)
/error-check-sentry --full https://localhost:3000
```

## 🚀 Fonctionnalités

### **Automation Playwright ↔ Sentry**
- ✅ Detection console errors via MCP Playwright
- ✅ Escalation automatique erreurs critiques vers Sentry
- ✅ Zero tolerance policy (échec si erreurs critiques)
- ✅ Accessibility snapshot si console clean

### **Integration MCPs**
- **Playwright MCP**: `browser_console_messages`, `browser_navigate`, `browser_snapshot`
- **Sentry MCP**: Escalation issues automatique (via API si MCP indisponible)
- **Sequential Thinking**: Planning et validation résultats

### **Business Rules Conformité**
- 🚨 **Zero Tolerance**: Échec automatique si erreurs console critiques
- 📊 **Métriques**: Tracking erreurs/warnings/escalations
- 🎯 **SLOs**: Validation performance <2s selon targets Vérone
- 🔍 **Quality Gates**: Intégration hooks Claude Code

## 🛠️ Implementation

```typescript
// Workflow automatique
1. Validation connexion Sentry
2. Navigation URL (si spécifiée)
3. Console error detection (Playwright MCP)
4. Analysis erreurs selon criticité business
5. Escalation Sentry pour erreurs critiques
6. Accessibility snapshot si clean
7. Report résultats + métriques
```

## 📊 Outputs Esperés

### **Succès (Zero Errors)**
```
🟢 [PLAYWRIGHT-SENTRY AUTOMATION] Console clean - Zero errors detected
   Console Errors: 0 total (0 critiques)
   Sentry Reports: 0 escalated
   Duration: 1240ms
   Status: SUCCESS
```

### **Échec (Critical Errors)**
```
🔴 [PLAYWRIGHT-SENTRY AUTOMATION] ÉCHEC: 3 erreurs console critiques (Zero Tolerance Rule)
   Console Errors: 5 total (3 critiques)
   Sentry Reports: 3 escalated
   Duration: 2100ms
   Status: FAILED
```

### **Partiel (Warnings)**
```
🟡 [PLAYWRIGHT-SENTRY AUTOMATION] 2 warnings console (non-bloquants)
   Console Errors: 2 total (0 critiques)
   Sentry Reports: 0 escalated
   Duration: 890ms
   Status: PARTIAL
```

## 🔗 Integration Hooks

### **Tool Usage Hook** (.claude/settings.json)
```json
{
  "matcher": "mcp__playwright__browser_console_messages",
  "hooks": [
    {
      "type": "command",
      "command": "/error-check-sentry"
    }
  ]
}
```

### **Task Completion Hook**
```json
{
  "matcher": "console.*check.*complete",
  "hooks": [
    {
      "type": "automation",
      "trigger": "quickConsoleCheck()"
    }
  ]
}
```

## 📋 Business Logic

### **Erreurs Critiques (Auto-escalation)**
- `TypeError`, `ReferenceError`, `SyntaxError`
- `Failed to fetch` (problèmes API/réseau)
- `Uncaught` exceptions
- Erreurs bloquant fonctionnalités business

### **Warnings (Monitoring uniquement)**
- Console.warn messages
- Deprecated API usage
- Performance warnings
- Non-critical third-party errors

### **SLOs Validation**
- Navigation: <3s (according to catalogue target)
- Console check: <2s (according to dashboard target)
- Sentry escalation: <1s per error
- Total workflow: <10s maximum

## 🎯 Success Criteria

1. **Zero Console Errors**: Aucune erreur critique détectée
2. **Sentry Integration**: Escalation automatique fonctionnelle
3. **Performance**: Workflow complet <10s
4. **Accessibility**: Snapshot capturé si console clean
5. **Business Compliance**: Règles métier Vérone respectées

*Command intégré dans workflow Claude Code 2025 - Vérone Back Office Professional*