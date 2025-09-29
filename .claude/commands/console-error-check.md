# 🚨 Console Error Check - Workflow Automation 2025

**Commande** : `/console-error-check`
**Objectif** : Zero Error Tolerance Policy - Vérification automatisée

## 🎯 WORKFLOW AUTOMATISÉ

### **Phase 1 : Browser Console Check**
```bash
# Navigation page active
mcp__playwright__browser_snapshot
mcp__playwright__browser_console_messages

# Vérification erreurs critiques
if [console_errors.length > 0]; then
  escalate_to_sentry()
  block_deployment()
fi
```

### **Phase 2 : Sentry Integration**
```bash
# Après reconnexion MCP Sentry
mcp__sentry__get_recent_issues
mcp__sentry__create_issue (si nouvelles erreurs)

# Classification automatique
- ERROR level → Block deployment
- WARNING level → Create ticket
- INFO level → Log only
```

### **Phase 3 : Action Matrix**
```
Console Error → Sentry Escalation → Action
├── TypeError → Critical Issue → Block Deploy + Alert
├── ENOENT → Medium Issue → Create Ticket
├── Warning → Low Issue → Log + Monitor
└── Clean → Success → Continue Deploy
```

## 🤖 USAGE

```bash
# Manuel
/console-error-check

# CI/CD Integration
npm run dev && /console-error-check && npm run build

# Pre-commit Hook
git commit → /console-error-check → [pass/fail]
```

## 📊 REPORTING

- **Dashboard temps réel** : Erreurs console + Sentry issues
- **Alerts automatiques** : Slack/Email sur erreurs critiques
- **Metrics tracking** : Zero-error streak counter

**STATUS** : Prêt après reconnexion MCP Sentry