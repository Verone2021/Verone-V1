# 🗄️ Commande Archive Session

**Archivage intelligent** des sessions terminées avec classification automatique

---

## 🎯 **Utilisation**

```bash
/archive-session [type] [--cleanup]
```

### **Types d'Archivage**
- `current` : Archive session courante uniquement
- `old` : Archive toutes sessions anciennes (>7 jours)
- `selective` : Archive sessions sélectionnées interactivement
- `cleanup` : Archivage + nettoyage fichiers obsolètes

---

## 🧠 **Workflow Automatique**

### **📊 Phase 1: Analyse Sessions Actives**
```typescript
// Scan MEMORY-BANK pour sessions
mcp__serena__list_dir("MEMORY-BANK/sessions", true)

interface SessionToArchive {
  file: string;
  date: Date;
  type: 'feature' | 'bugfix' | 'refactor' | 'research';
  completionStatus: 'completed' | 'abandoned' | 'partial';
  importance: 'high' | 'medium' | 'low';
  archiveDestination: string;
}
```

### **🏷️ Phase 2: Classification Intelligente**
```typescript
function classifySession(sessionFile: string): SessionClassification {
  const content = readSessionFile(sessionFile);

  // Analyse contenu pour classification
  const classification = {
    type: detectSessionType(content),
    importance: calculateImportance(content),
    retentionPeriod: determineRetentionPeriod(content),
    keywords: extractKeywords(content),
    relatedSessions: findRelatedSessions(content)
  };

  return classification;
}
```

### **📦 Phase 3: Archivage Structuré**
```typescript
// Organisation archive par thématique et période
const ARCHIVE_STRUCTURE = {
  'features/': {
    retention: '2 years',
    subfolders: ['ui-components', 'business-logic', 'integrations']
  },
  'bugfixes/': {
    retention: '1 year',
    subfolders: ['critical', 'performance', 'ui-bugs']
  },
  'research/': {
    retention: '3 years',
    subfolders: ['architecture', 'technology', 'optimization']
  },
  'deprecated/': {
    retention: '6 months',
    autoCleanup: true
  }
};
```

---

## 📁 **Structure Archive 2025**

### **Organisation Hiérarchique**
```
archive/
├── 2025/                          # Année courante
│   ├── Q1/                        # Par trimestre
│   │   ├── features/
│   │   │   ├── dashboard-v2/      # Par feature majeure
│   │   │   └── catalogue-system/
│   │   ├── bugfixes/
│   │   │   ├── critical/
│   │   │   └── performance/
│   │   └── research/
│   │       ├── architecture/
│   │       └── technology/
│   └── sessions-index.md          # Index toutes sessions 2025
└── retention-policy.md            # Règles rétention
```

### **Index Automatique**
```markdown
# 📚 Index Sessions 2025

## Q1 - Janvier-Mars

### Features Majeures
- [Dashboard V2](Q1/features/dashboard-v2/) - Sessions: 12, Durée: 45h
- [Système Catalogue](Q1/features/catalogue-system/) - Sessions: 8, Durée: 32h

### Bugfixes Critiques
- [Performance Loading](Q1/bugfixes/critical/perf-loading.md) - Résolu: 2025-01-15
- [Memory Leaks](Q1/bugfixes/critical/memory-leaks.md) - Résolu: 2025-01-22

### Recherche & Architecture
- [MCP Optimization](Q1/research/architecture/mcp-optimization.md) - Impact: High
- [Security Framework](Q1/research/technology/security-framework.md) - Impact: Critical

## Métriques Trimestrielles
- **Sessions archivées**: 45
- **Features complétées**: 8
- **Bugs résolus**: 23
- **Heures développement**: 156h
- **Qualité code**: 98% (0 erreurs console)
```

---

## 🔍 **Critères Classification**

### **Importance Session**
```typescript
function calculateImportance(session: SessionContent): 'high' | 'medium' | 'low' {
  const factors = {
    // Impact métier
    businessImpact: session.features?.length > 0 ? 3 : 0,

    // Complexité technique
    technicalComplexity: session.agentsUsed?.length > 5 ? 2 : 1,

    // Apprentissages
    learnings: session.learnings?.length > 3 ? 2 : 0,

    // Durée session
    duration: session.duration > 4 ? 2 : 1,

    // Réutilisabilité
    reusability: session.patterns?.length > 0 ? 2 : 0
  };

  const score = Object.values(factors).reduce((a, b) => a + b, 0);

  if (score >= 8) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
}
```

### **Période de Rétention**
```typescript
const RETENTION_POLICIES = {
  'critical-bugfixes': '3 years',    // Bugs critiques
  'major-features': '2 years',       // Features majeures
  'architecture-research': '5 years', // Recherche architecture
  'routine-maintenance': '6 months',  // Maintenance routine
  'experimental': '1 year',          // Expérimentations
  'deprecated': '3 months'           // Code deprecated
};
```

---

## 🔄 **Automation Pipeline**

### **Archivage Automatique**
```bash
#!/bin/bash
# .claude/automation/auto-archive.sh

# Tous les dimanche à 20h - archivage automatique
cron: "0 20 * * 0"

echo "🗄️ ARCHIVAGE AUTOMATIQUE SESSIONS"

# 1. Archive sessions >7 jours
/archive-session old --cleanup

# 2. Génère index trimestre
/archive-session index --update

# 3. Nettoyage fichiers temporaires
/organize-files cache

# 4. Commit archivage
git add archive/
git commit -m "📚 Archivage automatique sessions $(date +%Y-%m-%d)"

echo "✅ Archivage automatique terminé"
```

### **Notifications Archivage**
```typescript
interface ArchiveNotification {
  type: 'session-archived' | 'cleanup-performed' | 'retention-expired';
  details: {
    sessionsArchived: number;
    spaceSaved: string;
    retentionActions: string[];
  };
  recommendations: string[];
}

// Exemple notification
{
  type: 'session-archived',
  details: {
    sessionsArchived: 12,
    spaceSaved: '2.4MB',
    retentionActions: [
      'Supprimé 3 sessions expérées',
      'Archivé 12 sessions anciennes',
      'Mis à jour index Q1'
    ]
  },
  recommendations: [
    'Réviser patterns récurrents dans bugfixes',
    'Documenter learnings architecture pour équipe',
    'Planifier revue sessions high-importance Q1'
  ]
}
```

---

## 📊 **Métriques Archivage**

### **Dashboard Archive**
```typescript
interface ArchiveMetrics {
  storage: {
    totalSessions: number;
    totalSizeMB: number;
    growthRate: string;      // MB/month
    retentionCompliance: number; // % policy respected
  };

  classification: {
    byType: Map<string, number>;     // feature: 45, bugfix: 23, etc.
    byImportance: Map<string, number>; // high: 12, medium: 34, etc.
    byQuarter: Map<string, number>;   // Q1: 67, Q2: 45, etc.
  };

  access: {
    mostReferenced: string[];      // Sessions souvent consultées
    searchPatterns: string[];      // Termes recherchés
    retrievalTime: number;         // Temps moyen recherche
  };

  efficiency: {
    autoClassification: number;    // % sessions auto-classées
    manualOverrides: number;      // Corrections manuelles
    archiveAccuracy: number;      // % classifications correctes
  };
}
```

### **Rapport Mensuel**
```markdown
# 📈 Rapport Archive - Janvier 2025

## Résumé Exécutif
- **Sessions archivées**: 23 (+15% vs Déc 2024)
- **Espace total**: 12.4MB (+2.1MB ce mois)
- **Classification auto**: 91% (Target: >85%)
- **Compliance rétention**: 100%

## Classification Sessions
### Par Type
- Features: 12 sessions (52%)
- Bugfixes: 8 sessions (35%)
- Research: 3 sessions (13%)

### Par Importance
- High: 5 sessions (architecture, features majeures)
- Medium: 13 sessions (features standard, bugfixes)
- Low: 5 sessions (maintenance, expérimentations)

## Insights & Recommandations
1. **Pattern détecté**: 60% bugfixes liés à performance
   → Recommandation: Focus performance dans prochains développements

2. **Réutilisation**: 8 sessions consultées >5 fois
   → Recommandation: Créer documentation référence

3. **Efficiency gain**: Temps recherche -23% vs mois précédent
   → Index automatique améliore découvrabilité
```

---

## 🛠️ **Outils Gestion Archive**

### **Recherche Intelligente**
```bash
# Recherche dans archives
/archive-search "performance optimization" --type=research
/archive-search "dashboard" --period=2025-Q1 --importance=high

# Résultats avec contexte
📚 RÉSULTATS RECHERCHE ARCHIVE
================================
🔍 Terme: "performance optimization"
📊 5 sessions trouvées (2025-Q1)

1. [HIGH] Dashboard Performance Boost
   📅 2025-01-15 | ⏱️ 4.2h | 🏷️ feature
   📝 Optimisation rendu composants -60% load time
   🔗 archive/2025/Q1/features/dashboard-v2/perf-boost.md

2. [MED] Cache Strategy Implementation
   📅 2025-01-22 | ⏱️ 2.1h | 🏷️ research
   📝 Redis cache + CDN setup
   🔗 archive/2025/Q1/research/performance/cache-strategy.md
```

### **Extraction Patterns**
```typescript
// Analyse patterns cross-sessions
function extractPatterns(archiveQuarter: string): ArchivePatterns {
  return {
    techPatterns: [
      'React performance optimization récurrent',
      'Supabase query optimization pattern',
      'Console error debugging workflow'
    ],
    processPatterns: [
      'Sequential thinking améliore planning',
      'Serena analysis critique avant code changes',
      'Console error checking prévient 100% régressions'
    ],
    businessPatterns: [
      'Features UI demandent plus tests manuels',
      'Performance SLO respectés dans 96% cas',
      'User feedback intégré dans 24h average'
    ]
  };
}
```

---

## 🎯 **Cas d'Usage Avancés**

### **Audit Trimestriel**
```bash
# Génération rapport audit Q1
/archive-session audit --period=Q1 --detailed

# Génère:
# - Métriques productivité
# - Analyse qualité code
# - ROI features développées
# - Recommendations amélioration
```

### **Knowledge Transfer**
```bash
# Préparation onboarding nouveau dev
/archive-session knowledge-pack --topic=architecture
/archive-session knowledge-pack --topic=testing-strategy

# Génère pack formation ciblé
```

### **Compliance Check**
```bash
# Vérification conformité rétention
/archive-session compliance-check

# Vérifie et nettoie selon retention policies
```

---

**🗄️ Archivage Sessions 2025 - Mémoire Organisationnelle Durable**