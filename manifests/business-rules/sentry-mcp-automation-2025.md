# 🚨 Sentry MCP Automation Rules 2025

**Référence** : BR-SENTRY-001
**Date validation** : 28 septembre 2025
**Criticité** : BUSINESS CRITICAL

---

## 🎯 RÈGLES BUSINESS ESSENTIELLES

### **R1 - Zero Error Tolerance Policy**
- **RÈGLE** : Aucune erreur console autorisée en production
- **ACTION** : Blocage automatique déploiement si erreurs détectées
- **EXCEPTION** : Aucune (politique stricte)

### **R2 - Monitoring Temps Réel Obligatoire**
- **RÈGLE** : MCP Sentry doit être connecté en permanence
- **VERIFICATION** : Tools `mcp__sentry__*` disponibles
- **ESCALATION** : Alert équipe technique si déconnexion > 10 minutes

### **R3 - Configuration MCP Standards 2025**
- **RÈGLE** : Command-based approach uniquement (plus d'URL legacy)
- **PACKAGE** : `@sentry/mcp-server@latest` officiel
- **TOKENS** : Organization Token prioritaire sur Personal Token

---

## ⚙️ CONFIGURATION TECHNIQUE VALIDÉE

### **MCP Configuration (.mcp.json)**
```json
"sentry": {
  "command": "npx",
  "args": ["-y", "@sentry/mcp-server@latest"],
  "env": {
    "SENTRY_AUTH_TOKEN": "${SENTRY_ORGANIZATION_TOKEN}",
    "SENTRY_ORG": "${SENTRY_ORG}",
    "SENTRY_PROJECT": "${SENTRY_PROJECT}"
  }
}
```

### **Variables Environnement (.env.local)**
```bash
SENTRY_ORGANIZATION_TOKEN=sntrys_***RT/k  # Token org actif
SENTRY_ORG=verone                         # Organisation
SENTRY_PROJECT=verone-backoffice          # Projet
```

---

## 🤖 WORKFLOWS AUTOMATION

### **W1 - Console Error Checking**
```bash
# Trigger: Avant chaque déploiement
1. mcp__playwright__browser_console_messages
2. if (errors.length > 0) → escalate_sentry()
3. Classification: ERROR|WARNING|INFO
4. Action: BLOCK|TICKET|LOG
```

### **W2 - Sentry Integration Pipeline**
```bash
# Trigger: Erreur console détectée
1. mcp__sentry__create_issue (auto)
2. mcp__sentry__assign_team (dev team)
3. Slack notification (channel #tech-alerts)
4. Dashboard update (real-time metrics)
```

### **W3 - CI/CD Integration**
```bash
# GitHub Actions Workflow
- name: Console Error Check
  run: /console-error-check
  if: failure() → block deployment
  if: success() → continue pipeline
```

---

## 📊 MÉTRIQUES & KPIs

### **Indicateurs Criticité Business**
- **Zero-Error Streak** : Jours consécutifs sans erreur console
- **MTTR** : Mean Time To Resolution erreurs critiques
- **Detection Rate** : % erreurs détectées vs échappées
- **Deployment Success** : % déploiements sans blocage erreur

### **Alertes Automatiques**
- **CRITICAL** : Erreur TYPE/REFERENCE → Alert immédiate
- **HIGH** : Erreur NETWORK/API → Alert 5 minutes
- **MEDIUM** : Warning performance → Alert 30 minutes
- **LOW** : Info/Debug → Log uniquement

---

## 🚀 IMPACT BUSINESS

### **Avant Implementation**
- ❌ Erreurs découvertes manuellement en production
- ❌ MTTR élevé (heures à jours)
- ❌ Expérience utilisateur dégradée
- ❌ Coût debugging production

### **Après Implementation**
- ✅ Détection automatique < 1 minute
- ✅ MTTR réduit < 15 minutes
- ✅ Zero défaut client final
- ✅ Monitoring proactif vs réactif

---

## 🛡️ CONFORMITÉ & SÉCURITÉ

### **Tokens & Authentication**
- Organization Token rotation : 90 jours
- Personal Token backup : Toujours maintenu
- Environment separation : DEV|STAGING|PROD
- Access control : Team-based permissions

### **Data Privacy**
- Sentry EU region : `https://de.sentry.io`
- PII exclusion : Auto-configured
- Retention policy : 30 jours erreurs
- GDPR compliance : Activé

---

## ✅ VALIDATION & TESTS

### **Tests Acceptance**
1. **MCP Connection** : Tools `mcp__sentry__*` disponibles
2. **Error Detection** : Console error → Sentry issue (< 60s)
3. **Deployment Block** : Erreur critique → Pipeline stopped
4. **Alert System** : Notification équipe (< 5 minutes)

### **Tests Régression**
- **Quotidien** : Health check MCP Sentry
- **Hebdomadaire** : End-to-end error pipeline
- **Mensuel** : Performance metrics review

---

**RESPONSABLE** : Équipe DevOps + Product Team
**REVIEW** : Mensuelle obligatoire
**MISE À JOUR** : Sur évolution standards MCP ou Sentry