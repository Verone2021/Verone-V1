# 🎭 MCP Testing Automation Workflow - Standard Vérone 2025

## 📋 **Vue d'ensemble**

**Objectif** : Automatisation complète testing via MCP Playwright Browser + Sentry
**Statut** : ✅ Opérationnel - Configuration validée
**Version** : 2.0.0 (28 septembre 2025)
**Maintenu par** : Vérone Back Office Team

---

## 🏗 **Architecture MCP**

### **Servers MCP Configurés**
```json
{
  "playwright": {
    "command": "npx",
    "args": ["-y", "@playwright/mcp@latest"]
  },
  "sentry": {
    "url": "https://mcp.sentry.dev/mcp"
  }
}
```

### **Intégration Workflow**
```
Application ←→ Playwright MCP ←→ Console Monitoring ←→ Sentry Dashboard ←→ Claude Corrections
```

---

## 🚀 **Workflow Standard**

### **Étape 1 : Préparation Environment**
```bash
# Vérification pré-requis
npm run dev                    # Application localhost:3000
claude mcp:list               # Validation MCP servers actifs
```

### **Étape 2 : Tests Automatisés Navigation**
```typescript
// Navigation pages critiques
mcp__playwright__browser_navigate("http://localhost:3000")
mcp__playwright__browser_navigate("http://localhost:3000/catalogue")
mcp__playwright__browser_navigate("http://localhost:3000/catalogue/collections")

// Validation interactions
mcp__playwright__browser_click(element, ref)
mcp__playwright__browser_snapshot()
```

### **Étape 3 : Monitoring Console Errors**
```typescript
// Détection temps réel
mcp__playwright__browser_console_messages()

// Validation règle zéro erreur
if (console.errors.length > 0) {
  trigger_sentry_analysis()
}
```

### **Étape 4 : Sentry Integration**
```bash
# Dashboard monitoring
URL: https://verone.sentry.io/explore/traces/
DSN: https://25698064b38f249e069e5dcf9b8a6314@o4510076285943808.ingest.de.sentry.io/4510095142289488

# Interface application
Button: "Sentry Error Report" → Modal confirmation
```

### **Étape 5 : Corrections Automatiques**
```typescript
// Analyse erreurs via Claude
error_analysis = claude_analyze(sentry_errors)
corrections = claude_generate_fixes(error_analysis)
apply_corrections(corrections)
validate_fixes()
```

---

## 📊 **Critères Validation**

### **Success Metrics**
- ✅ **Chrome Navigation** : Visible et interactive
- ✅ **Console Errors** : Count = 0 (tolérance zéro)
- ✅ **Sentry Traces** : Génération automatique
- ✅ **Performance** : SLO < 2s dashboard, < 3s catalogue
- ✅ **Error Detection** : Temps réel + dashboard accessible

### **Failure Conditions**
- ❌ Console errors détectées
- ❌ Navigation Chrome impossible
- ❌ Sentry traces absentes
- ❌ Performance SLO dépassés
- ❌ Interface Sentry inaccessible

---

## 🔧 **Configuration Technique**

### **Environnement Variables**
```bash
# Sentry Configuration
SENTRY_DSN=https://25698064b38f249e069e5dcf9b8a6314@...
SENTRY_TRACES_SAMPLE_RATE=1.0
SENTRY_ENVIRONMENT=development

# Application
NEXT_PUBLIC_APP_ENV=development
NODE_ENV=development
```

### **Dependencies Required**
```json
{
  "@playwright/mcp": "latest",
  "@sentry/nextjs": "^8.x",
  "@sentry/cli": "latest"
}
```

---

## 📋 **Checklist Validation**

### **Pré-déploiement**
- [ ] MCP servers connectés et opérationnels
- [ ] Application accessible localhost:3000
- [ ] Chrome navigation fonctionnelle
- [ ] Console errors = 0
- [ ] Sentry traces générées
- [ ] Dashboard Sentry accessible

### **Post-correction**
- [ ] Fixes appliqués via Claude Code
- [ ] Re-test navigation complete
- [ ] Validation performance SLO
- [ ] Confirmation zéro erreur console
- [ ] Documentation mise à jour

---

## 🎯 **Commandes Rapides**

### **Tests Manuels**
```bash
/browser-test                  # Navigation complète
/console-check                # Vérification erreurs
/sentry-analysis              # Dashboard monitoring
```

### **Debugging**
```bash
# Logs application
npm run dev 2>&1 | grep -E "(error|warn|sentry)"

# Status MCP
claude mcp:status playwright
claude mcp:status sentry
```

---

## 📚 **Documentation Référence**

### **Official Sources**
- [MCP Protocol Specification](https://modelcontextprotocol.io/specification/2025-06-18)
- [Playwright MCP Documentation](https://playwright.dev/docs/mcp)
- [Sentry Performance Monitoring](https://docs.sentry.io/platforms/javascript/guides/nextjs/tracing/)
- [Claude Code MCP Integration](https://docs.claude.com/en/docs/claude-code)

### **Best Practices 2025**
- **Security** : OAuth URLs vs CLI/STDIO
- **Performance** : Minimal configuration pour latence optimale
- **Testing** : Schema validation + regression coverage
- **Documentation** : Semantic versioning + changelog
- **Containerization** : Docker isolation dependencies

---

## 🔄 **Versioning & Updates**

### **Version History**
- **v2.0.0** : Configuration MCP restaurée + Sentry integration
- **v1.5.x** : Tests manuels automatisés
- **v1.0.x** : Setup initial Playwright Browser

### **Maintenance Schedule**
- **Hebdomadaire** : Validation workflow complet
- **Mensuel** : Update MCP servers versions
- **Trimestriel** : Review performance metrics + SLO
- **Annuel** : Architecture review + best practices update

---

**Workflow MCP Testing Automation 2025 : Standard Opérationnel Vérone** ✅

*Ce manifeste définit le workflow de test automatisé le plus avancé pour garantir la qualité et performance continue de Vérone Back Office*