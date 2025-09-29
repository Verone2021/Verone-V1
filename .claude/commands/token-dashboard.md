# Claude Code Token Dashboard - Monitoring Professional

**Command**: `/token-dashboard`

**Description**: Dashboard monitoring tokens Claude Code avec métriques business et optimisation automatique selon configuration settings.json.

## 🚀 Commands Disponibles

### **📊 Dashboard Principal**
```bash
# Affichage dashboard complet
/token-dashboard

# Dashboard temps réel
/token-dashboard --live

# Rapport session courante
/token-dashboard --session

# Métriques optimisation
/token-dashboard --optimization
```

### **📈 Métriques Spécialisées**
```bash
# Usage par MCP
/token-dashboard --mcp-breakdown

# Coûts par workflow
/token-dashboard --workflow-costs

# Trends hebdomadaires
/token-dashboard --trends

# SLO compliance
/token-dashboard --slo
```

## 📊 Dashboard Output Example

### **Session Courante**
```
📊 ═══════════════════════════════════════════════════════════
   CLAUDE CODE TOKEN DASHBOARD - VÉRONE PROFESSIONAL
═══════════════════════════════════════════════════════════
🎯 Session: session_1704067200_abc123
📈 Tokens: 15,247 (8,124→7,123)
🤖 MCPs: 23 calls
⚡ Workflows: 3 executed
💰 Cost: $0.0847
⭐ Efficiency: 87% (good)
═══════════════════════════════════════════════════════════
```

### **Métriques Globales**
```json
{
  "daily_usage": 45892,
  "weekly_trend": "+15.5%",
  "monthly_limit": 1000000,
  "efficiency_score": 82.3,
  "cost_optimization": 91,
  "slo_compliance": {
    "dashboard_load": "✅ 1.8s (<2s)",
    "mcp_response": "✅ 2.5s (<3s)",
    "workflow_completion": "✅ 8.0s (<10s)",
    "error_rate": "✅ 0.02% (<5%)",
    "availability": "✅ 99.8% (>99%)"
  }
}
```

### **Optimisation Suggestions**
```
💡 OPTIMISATION RECOMMENDATIONS
─────────────────────────────────────────────────────────
🔴 HIGH: Session inefficace détectée
   → Diviser tâche en sessions plus petites
   → Économies: $0.025 (30%)

🟡 MEDIUM: Usage MCP élevé
   → Utiliser caching Redis Upstash
   → Économies: $0.017 (20%)

🟢 LOW: Multiple workflows détectés
   → Orchestration parallèle recommandée
   → Économies: $0.021 (25%)
```

## 🎯 Business Metrics Integration

### **Vérone SLOs Compliance**
```typescript
const VERONE_TOKEN_SLOS = {
  dashboard_load: 2000,      // <2s selon business rules
  catalogue_tokens: 3000,    // <3000 tokens/page catalogue
  crm_workflow: 5000,        // <5000 tokens/workflow CRM
  deployment_pipeline: 8000, // <8000 tokens/deployment
  console_error_check: 1000  // <1000 tokens/error check
}
```

### **Cost Optimization Targets**
```typescript
const OPTIMIZATION_TARGETS = {
  monthly_budget: 50,        // $50/mois budget
  efficiency_threshold: 80,  // >80% efficiency score
  mcp_cache_hit_rate: 70,   // >70% cache hit rate
  workflow_reuse: 60,       // >60% workflow reuse
  session_optimization: 85   // >85% session efficiency
}
```

## 🤖 Auto-Monitoring Integration

### **Settings.json Configuration**
```json
{
  "monitoring": {
    "token_usage": {
      "track_per_session": true,
      "report_in_summary": true,
      "optimization_target": "minimize_while_effective",
      "auto_dashboard": true,
      "cost_alerts": true
    }
  }
}
```

### **Hooks Automatiques**
```typescript
// Integration hooks existants
tool_usage_hook: trackMCPCall(mcp_name, input, output)
workflow_completion: trackWorkflow(workflow_name, tokens)
session_end: generateTokenReport()
efficiency_alert: displayOptimizationSuggestions()
```

## 📊 Real-time Tracking

### **Token Recording Automatique**
```typescript
// Tracking automatique par type
recordTokenUsage(input, output)           // Usage général
recordTokenUsage(input, output, mcp)      // Appel MCP
recordTokenUsage(input, output, null, wf) // Workflow

// Métriques temps réel
efficiency_score: 0-100   // Score optimisation
cost_estimate: $0.0000   // Coût session courante
optimization_rating: excellent|good|fair|poor
```

### **Alerts & Notifications**
```typescript
// Alerts automatiques
cost_threshold_exceeded: $1.00/session
efficiency_below_threshold: <70%
session_duration_excessive: >30min
mcp_calls_excessive: >50/session
```

## 🎯 Workflow-Specific Metrics

### **Console Error Workflow**
```
Workflow: console-error-escalation
├─ Playwright: 234 tokens (detection)
├─ Sentry: 156 tokens (escalation)
├─ Filesystem: 89 tokens (logging)
└─ Total: 479 tokens | $0.0028 | 8.2s
```

### **Deployment Pipeline**
```
Workflow: deployment-validation-pipeline
├─ Sequential Thinking: 1,247 tokens (planning)
├─ GitHub: 456 tokens (PR creation)
├─ Vercel: 234 tokens (deployment)
├─ Playwright: 567 tokens (testing)
├─ Sentry: 123 tokens (monitoring)
└─ Total: 2,627 tokens | $0.0158 | 2.4min
```

## 💡 Optimization Features

### **Smart Caching**
```typescript
// Cache automatique résultats MCPs
upstash_cache: {
  hit_rate: "73%",
  savings: "$0.156/day",
  ttl_optimization: "auto-tuned"
}
```

### **Session Management**
```typescript
// Gestion intelligente sessions
auto_session_split: true     // Division auto si >10k tokens
workflow_batching: true      // Groupement workflows similaires
mcp_call_optimization: true  // Déduplication appels
```

### **Cost Prediction**
```typescript
// Prédiction coûts
current_trajectory: "$0.156/hour"
daily_estimate: "$1.24"
monthly_projection: "$37.20"
budget_compliance: "74% under budget"
```

## 🏆 Performance Targets

### **Excellence Benchmarks**
```
🟢 EXCELLENT (90-100%)
   └─ <3000 tokens/workflow
   └─ >85% MCP cache hit
   └─ <$0.50/session

🟡 GOOD (75-89%)
   └─ <5000 tokens/workflow
   └─ >70% efficiency
   └─ <$1.00/session

🔴 NEEDS IMPROVEMENT (<75%)
   └─ Optimisation requise
   └─ Suggestions automatiques
   └─ Session splitting recommandé
```

### **Business ROI Metrics**
```typescript
const ROI_METRICS = {
  development_acceleration: "300%",    // vs développement manuel
  error_detection_improvement: "95%",  // vs découverte manuelle
  deployment_time_reduction: "80%",    // vs process manuel
  cost_per_feature: "$2.34"          // vs coût développeur
}
```

*Token Dashboard - Vérone Back Office Professional Excellence*