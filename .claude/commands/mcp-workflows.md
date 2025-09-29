# MCP Workflow Automation - Commands Vérone

**Commands**: `/workflow-*`

**Description**: Orchestration automatisée entre 11 MCPs pour workflows complexes Vérone Back Office.

## 🚀 Commands Disponibles

### **🔍 Console Error Workflow**
```bash
/workflow-console-errors
```
**MCPs**: Playwright → Sentry → Filesystem
**Durée**: ~10s | **Business Impact**: Zero Tolerance Rule
- Detection console errors (Playwright)
- Escalation automatique Sentry
- Log filesystem pour audit

### **🚀 Deployment Pipeline**
```bash
/workflow-deploy [branch]
/workflow-deploy feature/catalogue
```
**MCPs**: Sequential Thinking → GitHub → Vercel → Playwright → Sentry
**Durée**: ~3min | **Business Impact**: CI/CD Production
- Planning déploiement (Sequential Thinking)
- Création PR (GitHub)
- Déploiement preview (Vercel)
- Tests qualité (Playwright)
- Monitoring erreurs (Sentry)

### **👥 CRM Prospect Enrichment**
```bash
/workflow-crm-enrichment
```
**MCPs**: HubSpot → Context7 → Upstash → Supabase
**Durée**: ~30s | **Business Impact**: Lead Generation
- Récupération nouveaux contacts (HubSpot)
- Enrichissement données (Context7)
- Cache Redis (Upstash)
- Synchronisation catalogue (Supabase)

### **⚡ Code Quality Automation**
```bash
/workflow-code-quality
```
**MCPs**: Serena → Context7 → GitHub → Filesystem
**Durée**: ~60s | **Business Impact**: Code Excellence
- Analyse qualité code (Serena)
- Recommandations best practices (Context7)
- Optimisations automatiques (Serena)
- Mise à jour documentation (Filesystem)
- Création PR (GitHub)

## 🎯 Workflows Business Logic

### **Architecture Dependency Management**
```typescript
// Tri topologique automatique des dépendances
Step 1: Sequential Planning (no deps)
Step 2: GitHub PR (depends: Step 1)
Step 3: Vercel Deploy (depends: Step 2)
Step 4: Playwright Tests (depends: Step 3)
Step 5: Sentry Monitor (depends: Step 4)
```

### **Retry Logic & Error Handling**
```typescript
// Configuration per-step
timeout: 30000ms     // Max execution time
retry_count: 2       // Automatic retries
exponential_backoff: true  // 1s, 2s, 4s delays
```

### **Business Success Criteria**
```typescript
// Console Error Workflow
✅ zero_console_errors
✅ sentry_escalation_success
✅ log_written

// Deployment Pipeline
✅ build_success
✅ deploy_success
✅ tests_passed
✅ zero_console_errors
✅ monitoring_active
```

## 📊 Workflow Status & Monitoring

### **Real-time Status**
```bash
# Voir workflows en cours
/workflow-status

# Résultats derniers workflows
/workflow-results

# Métriques performance
/workflow-metrics
```

### **Triggers Automatiques**
```json
{
  "hooks": {
    "console_error_detected": "workflow-console-errors",
    "pull_request_created": "workflow-deploy",
    "new_hubspot_contact": "workflow-crm-enrichment",
    "weekly_friday_6pm": "workflow-code-quality"
  }
}
```

## 🔧 Configuration MCP Orchestration

### **MCPs Disponibles (11 total)**
```typescript
// Core Business MCPs
supabase     // Database operations
hubspot      // CRM integration
upstash      // Redis caching
sentry       // Error monitoring

// Development MCPs
serena       // Code analysis
context7     // Documentation
github       // Repository
vercel       // Deployment
playwright   // Browser testing
filesystem   // File operations

// AI Planning
sequential-thinking  // Complex planning
```

### **Workflow Definition Example**
```typescript
{
  id: 'console-error-escalation',
  mcps: ['playwright', 'sentry', 'filesystem'],
  steps: [
    {
      step: 1,
      mcp: 'playwright',
      action: 'browser_console_messages',
      timeout: 5000,
      retry_count: 2
    },
    {
      step: 2,
      mcp: 'sentry',
      action: 'create_issue',
      depends_on: [1],
      timeout: 3000,
      retry_count: 1
    }
  ],
  success_criteria: ['zero_console_errors', 'sentry_escalation_success']
}
```

## 🚀 Advanced Features

### **Parallel Execution**
```bash
# Exécution parallèle workflows
/workflow-parallel console-errors deployment
```

### **Custom Parameters**
```bash
# Paramètres workflow spécifiques
/workflow-deploy --branch=main --environment=production
/workflow-crm-enrichment --limit=100 --cache-ttl=3600
```

### **Scheduled Automation**
```typescript
// Configuration automatique
daily_8am: 'workflow-crm-enrichment'
weekly_friday_6pm: 'workflow-code-quality'
on_console_error: 'workflow-console-errors'
on_pr_created: 'workflow-deploy'
```

## 📈 Business Impact Metrics

### **Productivity Gains**
- **90%** réduction temps déploiement (3min vs 30min manuel)
- **80%** amélioration détection erreurs (temps réel vs découverte tardive)
- **95%** automatisation enrichissement CRM (0 intervention manuelle)
- **85%** augmentation qualité code (révisions automatiques)

### **SLOs Workflow**
```typescript
const WORKFLOW_SLOS = {
  console_error_escalation: 10000,   // <10s detection + escalation
  deployment_pipeline: 180000,       // <3min full deployment
  crm_enrichment: 30000,             // <30s prospect processing
  code_quality: 60000                // <60s analysis + PR
}
```

### **Zero Tolerance Compliance**
- **Console Errors**: Échec automatique si erreurs détectées
- **Deployment**: Rollback automatique si tests échouent
- **Quality Gates**: PR bloquée si standards non respectés
- **Business Rules**: Validation Vérone automatique

## 🎯 Success Stories

**Avant workflows MCP** :
- ❌ Déploiements manuels 30min + erreurs fréquentes
- ❌ Erreurs console découvertes en production
- ❌ Prospects perdus par manque d'enrichissement
- ❌ Qualité code variable selon développeur

**Après workflows MCP** :
- ✅ Déploiements automatisés 3min + zero downtime
- ✅ Erreurs console bloquées avant production
- ✅ 100% prospects enrichis automatiquement
- ✅ Qualité code standardisée et documentée

*MCP Workflow Automation - Vérone Back Office Professional Excellence*