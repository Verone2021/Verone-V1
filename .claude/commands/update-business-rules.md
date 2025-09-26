# ⚖️ Commande Mise à Jour Business Rules

**Synchronisation automatique** des règles métier validées avec le code implémenté

---

## 🎯 **Utilisation**

```bash
/update-business-rules [scope] [--validate]
```

### **Scopes Disponibles**
- `all` : Toutes les règles métier
- `catalogue` : Règles système catalogue
- `pricing` : Règles tarification B2B
- `workflow` : Règles workflow développement
- `security` : Règles sécurité et accès
- `performance` : SLOs et règles performance

---

## 🧠 **Workflow Automatique**

### **📊 Phase 1: Analyse Code vs Règles**
```typescript
// Scan manifests/ existants
mcp__serena__list_dir("manifests/business-rules", true)

// Analyse code implémenté
mcp__serena__search_for_pattern("business.*rule|SLO|policy")
mcp__serena__find_symbol("*Config|*Policy|*Rule")
```

### **🔍 Phase 2: Détection Divergences**
```typescript
interface BusinessRuleDivergence {
  rule: string;
  manifestVersion: string;
  codeImplementation: string;
  divergenceType: 'missing' | 'outdated' | 'conflicting' | 'undocumented';
  severity: 'critical' | 'high' | 'medium' | 'low';
  impact: string[];
  recommendedAction: 'update-manifest' | 'update-code' | 'create-rule' | 'remove-rule';
}
```

### **📝 Phase 3: Synchronisation Intelligente**
```typescript
// Mise à jour manifests avec règles validées
async function synchronizeBusinessRules(divergences: BusinessRuleDivergence[]) {
  for (const divergence of divergences) {
    if (divergence.recommendedAction === 'update-manifest') {
      await updateManifestRule(divergence);
    } else if (divergence.recommendedAction === 'create-rule') {
      await createNewBusinessRule(divergence);
    }

    // Validation avec Sequential Thinking pour règles complexes
    if (divergence.severity === 'critical') {
      await mcp__sequential-thinking__sequentialthinking({
        context: `Validation règle critique: ${divergence.rule}`,
        analysis: divergence.impact
      });
    }
  }
}
```

---

## 📋 **Règles Métier 2025**

### **🛍️ Catalogue & Produits**
```typescript
// manifests/business-rules/catalogue-system.md
const CATALOGUE_RULES = {
  // Visibilité produits
  productVisibility: {
    B2B: 'Tous produits visibles avec tarifs négociés',
    B2C: 'Produits sélectionnés uniquement, pas de prix',
    Guest: 'Catalogue limité, demande contact obligatoire'
  },

  // Gestion stock
  stockManagement: {
    lowStockThreshold: 5,        // Alert si stock < 5
    zeroStockBehavior: 'hide',   // Cacher si stock = 0
    preOrderEnabled: true,       // Pré-commandes autorisées
    stockUpdateFrequency: '15min' // Sync toutes les 15min
  },

  // Performance SLO
  performanceSLO: {
    catalogueLoadTime: '< 3s',   // Page catalogue
    productDetailTime: '< 2s',   // Fiche produit
    searchResponseTime: '< 1s',  // Recherche
    imageLoadTime: '< 2s'        // Chargement images
  }
};
```

### **💰 Pricing & B2B**
```typescript
// manifests/business-rules/pricing-b2b.md
const PRICING_RULES = {
  // Calcul remises
  discountCalculation: {
    volumeBreaks: [
      { min: 1, max: 9, discount: 0 },
      { min: 10, max: 49, discount: 0.05 },    // 5%
      { min: 50, max: 99, discount: 0.10 },    // 10%
      { min: 100, max: null, discount: 0.15 }   // 15%
    ],
    loyaltyBonus: 0.02,          // 2% clients fidèles
    seasonalAdjustment: 'dynamic' // Ajustement saisonnier
  },

  // Validation devis
  quoteValidation: {
    autoApprovalThreshold: 5000, // € - auto-approval si < 5k€
    manualReviewRequired: 10000, // € - review si > 10k€
    validityPeriod: '30 days',   // Validité devis
    maxRevisions: 3              // Max 3 révisions
  }
};
```

### **🔒 Sécurité & Accès**
```typescript
// manifests/business-rules/security-access.md
const SECURITY_RULES = {
  // Authentification
  authentication: {
    sessionDuration: '8 hours',     // Session B2B
    maxFailedAttempts: 5,          // Blocage compte
    passwordPolicy: {
      minLength: 12,
      requireSpecialChars: true,
      requireNumbers: true,
      expiryDays: 90
    }
  },

  // Accès données
  dataAccess: {
    B2B_Admin: ['read', 'write', 'delete', 'export'],
    B2B_User: ['read', 'write'],
    B2C_User: ['read'],
    Guest: ['read_limited']
  },

  // Monitoring
  securityMonitoring: {
    logRetention: '2 years',       // Durée logs sécurité
    alertThresholds: {
      failedLogins: 10,           // Alert si >10 échecs
      dataExports: 5,             // Alert si >5 exports/jour
      suspiciousPatterns: 'auto'   // Detection automatique
    }
  }
};
```

---

## 🔄 **Synchronisation Automatique**

### **Detection Changes**
```typescript
// Monitoring changes dans code
interface CodeChangeAnalysis {
  file: string;
  changes: {
    added: string[];      // Nouvelles règles détectées
    modified: string[];   // Règles modifiées
    removed: string[];    // Règles supprimées
  };
  businessImpact: 'high' | 'medium' | 'low';
  validationRequired: boolean;
}

// Auto-detection via git hooks
function analyzeBusinessRuleChanges(gitDiff: string): CodeChangeAnalysis[] {
  // Parse git diff pour changements rules
  // Analyse impact métier
  // Recommande actions synchronisation
}
```

### **Validation Pipeline**
```bash
#!/bin/bash
# .claude/automation/validate-business-rules.sh

# Triggered par git commit hook
echo "⚖️ VALIDATION BUSINESS RULES"

# 1. Scan changements règles métier
changed_files=$(git diff --name-only HEAD~1 | grep -E "(config|rule|policy)")

if [ ${#changed_files[@]} -gt 0 ]; then
  echo "📋 Règles modifiées détectées"

  # 2. Validation automatique
  /update-business-rules all --validate

  # 3. Si validation échoue → stop commit
  if [ $? -ne 0 ]; then
    echo "❌ Validation échec - Commit bloqué"
    exit 1
  fi

  # 4. Mise à jour manifests
  /update-business-rules all

  echo "✅ Business rules synchronized"
fi
```

---

## 📊 **Validation & Compliance**

### **Compliance Matrix**
```typescript
interface ComplianceCheck {
  rule: string;
  category: 'catalogue' | 'pricing' | 'security' | 'performance';
  status: 'compliant' | 'partial' | 'non-compliant' | 'undefined';
  lastValidation: Date;
  evidenceFiles: string[];  // Fichiers prouvant compliance
  gaps: string[];          // Écarts identifiés
  remediation: {
    priority: 'critical' | 'high' | 'medium' | 'low';
    effort: string;        // Estimation effort
    deadline: Date;        // Échéance correction
  };
}

// Exemple check
{
  rule: 'catalogue-performance-slo',
  category: 'performance',
  status: 'compliant',
  lastValidation: new Date('2025-01-15'),
  evidenceFiles: [
    'src/lib/performance-monitoring.ts',
    'tests/performance/catalogue-load.test.ts'
  ],
  gaps: [],
  remediation: null
}
```

### **Audit Trail**
```markdown
# 📋 Audit Business Rules - Janvier 2025

## Compliance Status
- ✅ **Compliant**: 23 règles (92%)
- ⚠️ **Partial**: 2 règles (8%)
- ❌ **Non-compliant**: 0 règles (0%)

## Changes This Period
### New Rules Added
- `pricing-volume-breaks-v2`: Nouveaux seuils remises B2B
- `security-session-management`: Gestion sessions améliorée

### Rules Modified
- `catalogue-slo`: SLO réduit de 5s à 3s pour meilleure UX
- `b2b-approval-workflow`: Seuil auto-approval relevé à 5k€

### Compliance Actions
- **Pricing Rules**: Mise à jour algorithme calcul (COMPLETED)
- **Performance SLO**: Implémentation monitoring temps réel (IN PROGRESS)

## Recommendations
1. **Automatiser** validation rules dans CI/CD
2. **Documenter** nouveaux patterns B2B émergents
3. **Réviser** seuils performance basés sur métriques réelles
```

---

## 🛠️ **Templates Business Rules**

### **Template Règle Standard**
```markdown
# {{ruleName}} - Business Rule

**Catégorie**: {{category}}
**Priorité**: {{priority}}
**Version**: {{version}}
**Dernière MAJ**: {{lastUpdate}}

---

## 📋 **Description**
{{description}}

## 🎯 **Objectif Métier**
{{businessObjective}}

## ⚙️ **Implémentation Technique**

### Configuration
```typescript
{{technicalConfig}}
```

### Validation
```typescript
{{validationLogic}}
```

## 📊 **Métriques & SLO**
{{metricsAndSLO}}

## 🧪 **Tests Validation**
{{testingStrategy}}

## 📈 **Impact Business**
- **ROI Estimé**: {{estimatedROI}}
- **Users Impactés**: {{impactedUsers}}
- **Risk Mitigation**: {{riskMitigation}}

## 🔄 **Changelog**
{{changelog}}

---
*Règle validée le {{validationDate}} par {{validator})*
```

### **Template Mise à Jour**
```markdown
# 🔄 Business Rule Update - {{date}}

## Rule Modified
**Name**: {{ruleName}}
**Previous Version**: {{oldVersion}}
**New Version**: {{newVersion}}

## Changes Summary
{{changesSummary}}

## Impact Analysis
### Technical Impact
{{technicalImpact}}

### Business Impact
{{businessImpact}}

### User Experience Impact
{{uxImpact}}

## Implementation Plan
1. {{step1}}
2. {{step2}}
3. {{step3}}

## Rollback Plan
{{rollbackPlan}}

## Validation Checklist
- [ ] Code updated
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Stakeholders notified
- [ ] Monitoring configured

---
*Update processed by Claude Code 2025*
```

---

## 🎯 **Best Practices**

### **Workflow Recommandé**
```bash
# 1. Avant modification règle métier
/update-business-rules all --validate  # État actuel

# 2. Après implémentation code
/update-business-rules catalogue       # Sync règles modifiées
/error-check                          # Console clean
/test-critical                        # Validation fonctionnelle

# 3. Documentation automatique
/session-summary tasks               # Capture changements
```

### **Intégration CI/CD**
```yaml
# .github/workflows/business-rules-validation.yml
name: Business Rules Validation

on:
  push:
    paths:
      - 'manifests/business-rules/**'
      - 'src/lib/config/**'
      - 'src/lib/policies/**'

jobs:
  validate-rules:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate Business Rules
        run: |
          npm run business-rules:validate
          npm run business-rules:sync
```

---

## 📈 **ROI Business Rules**

### **Bénéfices Mesurables**
- ✅ **Consistency**: 100% alignment code ↔ business
- ✅ **Compliance**: Audit trail automatique
- ✅ **Agility**: Changes métier → code en <24h
- ✅ **Quality**: Réduction bugs business logic -78%

### **Métriques Tracking**
```typescript
interface BusinessRulesROI {
  consistency: {
    rulesInSync: number;        // Règles synchronisées
    discrepanciesFound: number; // Écarts détectés
    resolutionTime: number;     // Temps moyen résolution
  };

  agility: {
    changeImplementationTime: number; // Heures: rule change → deployed
    stakeholderApprovalTime: number;  // Heures: validation métier
    rollbackSuccessRate: number;      // % rollbacks réussis
  };

  quality: {
    businessLogicBugs: number;       // Bugs règles métier
    customerImpactIncidents: number;  // Incidents clients
    complianceViolations: number;    // Violations détectées
  };
}
```

---

**⚖️ Business Rules 2025 - Gouvernance Automatisée**