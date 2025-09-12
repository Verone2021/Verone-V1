#!/usr/bin/env node

/**
 * 📊 Advanced Log Analyzer for Want It Now V1
 * Comprehensive log analysis tool with export capabilities for Claude Code debugging
 */

const fs = require('fs');
const path = require('path');
const { createReadStream } = require('fs');
const { createInterface } = require('readline');

// Configuration
const config = {
  logSources: [
    '.next/server.log',
    '.next/development.log',
    'logs/application.log',
    'logs/error.log',
  ],
  outputDir: 'logs/analysis',
  claudeExportFile: 'logs/claude-export.md',
  
  // Analysis filters
  filters: {
    timeRange: {
      enabled: false,
      start: null,
      end: null,
    },
    levels: ['error', 'warn', 'info', 'debug'],
    components: [],
    users: [],
    organisations: [],
  },
  
  // Export settings
  export: {
    includeContext: true,
    includeStackTraces: true,
    maxEntriesPerError: 5,
    summarizeRepeated: true,
  }
};

/**
 * Log entry parser for our structured logs
 */
class LogParser {
  static parseEntry(line) {
    try {
      // Try to parse as JSON first (production logs)
      const parsed = JSON.parse(line);
      return {
        timestamp: parsed['@timestamp'] || parsed.timestamp,
        level: parsed.level,
        message: parsed.message,
        context: parsed,
        raw: line,
        type: 'structured'
      };
    } catch (e) {
      // Try to parse development logs with our custom format
      const devMatch = line.match(/^(.+?)\s+\[(.+?)\]\s+(.+?):\s+(.+)$/);
      if (devMatch) {
        return {
          timestamp: devMatch[1],
          level: devMatch[2].toLowerCase(),
          component: devMatch[3],
          message: devMatch[4],
          raw: line,
          type: 'development'
        };
      }
      
      // Fallback for unstructured logs
      return {
        timestamp: new Date().toISOString(),
        level: 'unknown',
        message: line,
        raw: line,
        type: 'raw'
      };
    }
  }
  
  static shouldInclude(entry, filters) {
    // Level filter
    if (!filters.levels.includes(entry.level)) {
      return false;
    }
    
    // Time range filter
    if (filters.timeRange.enabled) {
      const entryTime = new Date(entry.timestamp);
      if (filters.timeRange.start && entryTime < filters.timeRange.start) {
        return false;
      }
      if (filters.timeRange.end && entryTime > filters.timeRange.end) {
        return false;
      }
    }
    
    // Component filter
    if (filters.components.length > 0) {
      const component = entry.context?.component || entry.component;
      if (!component || !filters.components.some(c => component.includes(c))) {
        return false;
      }
    }
    
    return true;
  }
}

/**
 * Log analyzer with statistical analysis
 */
class LogAnalyzer {
  constructor() {
    this.entries = [];
    this.stats = {
      total: 0,
      byLevel: {},
      byComponent: {},
      byUser: {},
      byOrganisation: {},
      byHour: {},
      errors: {
        unique: new Map(),
        repeated: new Map(),
      },
      performance: {
        slowRequests: [],
        slowQueries: [],
        memoryLeaks: [],
      }
    };
  }
  
  async loadLogs() {
    console.log('📂 Loading logs from multiple sources...');
    
    for (const source of config.logSources) {
      if (fs.existsSync(source)) {
        console.log(`  Reading ${source}...`);
        await this.processLogFile(source);
      }
    }
    
    console.log(`✅ Loaded ${this.entries.length} log entries`);
  }
  
  async processLogFile(filePath) {
    const fileStream = createReadStream(filePath);
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    for await (const line of rl) {
      if (line.trim()) {
        const entry = LogParser.parseEntry(line);
        if (LogParser.shouldInclude(entry, config.filters)) {
          this.entries.push(entry);
          this.updateStats(entry);
        }
      }
    }
  }
  
  updateStats(entry) {
    this.stats.total++;
    
    // Level statistics
    this.stats.byLevel[entry.level] = (this.stats.byLevel[entry.level] || 0) + 1;
    
    // Component statistics
    const component = entry.context?.component || entry.component || 'unknown';
    this.stats.byComponent[component] = (this.stats.byComponent[component] || 0) + 1;
    
    // User statistics
    if (entry.context?.userId) {
      this.stats.byUser[entry.context.userId] = (this.stats.byUser[entry.context.userId] || 0) + 1;
    }
    
    // Organization statistics
    if (entry.context?.organisationId) {
      this.stats.byOrganisation[entry.context.organisationId] = (this.stats.byOrganisation[entry.context.organisationId] || 0) + 1;
    }
    
    // Time-based statistics
    const hour = new Date(entry.timestamp).getHours();
    this.stats.byHour[hour] = (this.stats.byHour[hour] || 0) + 1;
    
    // Error analysis
    if (['error', 'fatal'].includes(entry.level)) {
      this.analyzeError(entry);
    }
    
    // Performance analysis
    this.analyzePerformance(entry);
  }
  
  analyzeError(entry) {
    const errorKey = entry.context?.error?.name + ':' + entry.message;
    
    if (this.stats.errors.unique.has(errorKey)) {
      const existing = this.stats.errors.unique.get(errorKey);
      existing.count++;
      existing.lastSeen = entry.timestamp;
      this.stats.errors.repeated.set(errorKey, existing);
    } else {
      this.stats.errors.unique.set(errorKey, {
        error: entry,
        count: 1,
        firstSeen: entry.timestamp,
        lastSeen: entry.timestamp,
      });
    }
  }
  
  analyzePerformance(entry) {
    // Slow API requests
    if (entry.context?.api_request?.response_time_ms > 1000) {
      this.stats.performance.slowRequests.push({
        url: entry.context.api_request.url,
        method: entry.context.api_request.method,
        responseTime: entry.context.api_request.response_time_ms,
        timestamp: entry.timestamp,
      });
    }
    
    // Slow database queries
    if (entry.context?.database_query?.duration_ms > 500) {
      this.stats.performance.slowQueries.push({
        operation: entry.context.database_query.operation,
        table: entry.context.database_query.table,
        duration: entry.context.database_query.duration_ms,
        timestamp: entry.timestamp,
      });
    }
    
    // Memory usage analysis
    if (entry.context?.metadata?.memoryUsage) {
      const memUsage = entry.context.metadata.memoryUsage;
      if (memUsage.usedJSHeapSize > 100 * 1024 * 1024) { // 100MB
        this.stats.performance.memoryLeaks.push({
          used: memUsage.usedJSHeapSize,
          total: memUsage.totalJSHeapSize,
          timestamp: entry.timestamp,
          component: entry.context.component,
        });
      }
    }
  }
  
  generateReport() {
    const report = {
      summary: this.generateSummary(),
      errors: this.generateErrorReport(),
      performance: this.generatePerformanceReport(),
      recommendations: this.generateRecommendations(),
    };
    
    return report;
  }
  
  generateSummary() {
    const timeRange = this.getTimeRange();
    
    return {
      totalEntries: this.stats.total,
      timeRange,
      levelDistribution: this.stats.byLevel,
      topComponents: this.getTop(this.stats.byComponent, 10),
      activeUsers: Object.keys(this.stats.byUser).length,
      activeOrganisations: Object.keys(this.stats.byOrganisation).length,
      errorRate: ((this.stats.byLevel.error || 0) / this.stats.total * 100).toFixed(2) + '%',
      warningRate: ((this.stats.byLevel.warn || 0) / this.stats.total * 100).toFixed(2) + '%',
    };
  }
  
  generateErrorReport() {
    const uniqueErrors = Array.from(this.stats.errors.unique.values())
      .sort((a, b) => b.count - a.count);
    
    const repeatedErrors = Array.from(this.stats.errors.repeated.values())
      .sort((a, b) => b.count - a.count);
    
    return {
      totalUniqueErrors: uniqueErrors.length,
      totalRepeatedErrors: repeatedErrors.length,
      mostFrequent: uniqueErrors.slice(0, 10),
      mostRepeated: repeatedErrors.slice(0, 10),
      recentErrors: this.getRecentErrors(24), // Last 24 hours
    };
  }
  
  generatePerformanceReport() {
    return {
      slowRequests: {
        total: this.stats.performance.slowRequests.length,
        slowest: this.stats.performance.slowRequests
          .sort((a, b) => b.responseTime - a.responseTime)
          .slice(0, 10),
      },
      slowQueries: {
        total: this.stats.performance.slowQueries.length,
        slowest: this.stats.performance.slowQueries
          .sort((a, b) => b.duration - a.duration)
          .slice(0, 10),
      },
      memoryIssues: {
        total: this.stats.performance.memoryLeaks.length,
        highest: this.stats.performance.memoryLeaks
          .sort((a, b) => b.used - a.used)
          .slice(0, 10),
      },
    };
  }
  
  generateRecommendations() {
    const recommendations = [];
    
    // Error rate recommendations
    const errorRate = (this.stats.byLevel.error || 0) / this.stats.total;
    if (errorRate > 0.05) { // 5%
      recommendations.push({
        type: 'error_rate',
        severity: 'high',
        message: `Taux d'erreur élevé: ${(errorRate * 100).toFixed(2)}%. Investiguer les erreurs les plus fréquentes.`,
      });
    }
    
    // Performance recommendations
    if (this.stats.performance.slowRequests.length > 10) {
      recommendations.push({
        type: 'performance',
        severity: 'medium',
        message: `${this.stats.performance.slowRequests.length} requêtes lentes détectées. Optimiser les endpoints les plus lents.`,
      });
    }
    
    // Memory recommendations
    if (this.stats.performance.memoryLeaks.length > 0) {
      recommendations.push({
        type: 'memory',
        severity: 'high',
        message: `${this.stats.performance.memoryLeaks.length} problèmes de mémoire détectés. Vérifier les fuites mémoire.`,
      });
    }
    
    return recommendations;
  }
  
  exportForClaude() {
    console.log('📝 Generating Claude Code export...');
    
    const report = this.generateReport();
    const claudeReport = this.formatForClaude(report);
    
    // Ensure output directory exists
    const outputDir = path.dirname(config.claudeExportFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(config.claudeExportFile, claudeReport);
    console.log(`✅ Claude export saved to: ${config.claudeExportFile}`);
    
    return config.claudeExportFile;
  }
  
  formatForClaude(report) {
    const timestamp = new Date().toISOString();
    
    let markdown = `# 📊 Rapport d'Analyse des Logs - Want It Now V1

*Généré le: ${timestamp}*

## 🎯 Résumé Exécutif

- **Total des entrées**: ${report.summary.totalEntries}
- **Période**: ${report.summary.timeRange}
- **Taux d'erreur**: ${report.summary.errorRate}
- **Taux d'avertissement**: ${report.summary.warningRate}
- **Utilisateurs actifs**: ${report.summary.activeUsers}
- **Organisations actives**: ${report.summary.activeOrganisations}

## 📈 Distribution par Niveau

\`\`\`
${Object.entries(report.summary.levelDistribution)
  .map(([level, count]) => `${level.toUpperCase()}: ${count}`)
  .join('\n')}
\`\`\`

## 🧩 Composants les Plus Actifs

\`\`\`
${report.summary.topComponents
  .map(([component, count]) => `${component}: ${count}`)
  .join('\n')}
\`\`\`

## ❌ Rapport d'Erreurs

### Erreurs Uniques (${report.errors.totalUniqueErrors})

${report.errors.mostFrequent.slice(0, 5).map((error, index) => `
#### ${index + 1}. ${error.error.message}
- **Occurrences**: ${error.count}
- **Première occurrence**: ${error.firstSeen}
- **Dernière occurrence**: ${error.lastSeen}
- **Composant**: ${error.error.context?.component || 'N/A'}

\`\`\`json
${JSON.stringify(error.error.context, null, 2)}
\`\`\`
`).join('\n')}

### Erreurs Répétées (Top 3)

${report.errors.mostRepeated.slice(0, 3).map((error, index) => `
#### ${index + 1}. ${error.error.message}
- **Répétitions**: ${error.count}
- **Période**: ${error.firstSeen} → ${error.lastSeen}
`).join('\n')}

## ⚡ Rapport de Performance

### Requêtes Lentes (${report.performance.slowRequests.total})

${report.performance.slowRequests.slowest.slice(0, 3).map((req, index) => `
#### ${index + 1}. ${req.method} ${req.url}
- **Temps de réponse**: ${req.responseTime}ms
- **Timestamp**: ${req.timestamp}
`).join('\n')}

### Requêtes Base de Données Lentes (${report.performance.slowQueries.total})

${report.performance.slowQueries.slowest.slice(0, 3).map((query, index) => `
#### ${index + 1}. ${query.operation.toUpperCase()} ${query.table}
- **Durée**: ${query.duration}ms
- **Timestamp**: ${query.timestamp}
`).join('\n')}

## 🚨 Recommandations Prioritaires

${report.recommendations.map((rec, index) => `
### ${index + 1}. ${rec.type.toUpperCase()} - Sévérité: ${rec.severity.toUpperCase()}

${rec.message}
`).join('\n')}

## 📋 Instructions pour Claude Code

### Comment utiliser ce rapport:

1. **Copier les sections d'erreur** dans votre conversation avec Claude Code
2. **Mentionner les composants problématiques** identifiés
3. **Inclure les recommandations** pour guider les corrections
4. **Référencer les timestamps** pour la reproductibilité

### Commandes suggérées pour Claude:

\`\`\`bash
# Analyser les erreurs les plus fréquentes
grep -r "ERROR_MESSAGE" logs/

# Vérifier les performances des composants lents
grep -r "COMPONENT_NAME" logs/

# Investiguer les problèmes de mémoire
grep -r "memoryUsage" logs/
\`\`\`

### Contexte Technique

- **Stack**: Next.js + React + Supabase + TypeScript
- **Architecture**: Multi-tenant SaaS
- **Logging**: Pino + Custom Formatters
- **Environnement**: ${process.env.NODE_ENV || 'development'}

---

*Ce rapport a été généré automatiquement par le système de logging avancé de Want It Now V1*
`;

    return markdown;
  }
  
  // Utility methods
  getTimeRange() {
    if (this.entries.length === 0) return 'Aucune donnée';
    
    const timestamps = this.entries.map(e => new Date(e.timestamp)).sort();
    const start = timestamps[0].toISOString();
    const end = timestamps[timestamps.length - 1].toISOString();
    
    return `${start} → ${end}`;
  }
  
  getTop(obj, limit = 10) {
    return Object.entries(obj)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit);
  }
  
  getRecentErrors(hours = 24) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.entries
      .filter(e => ['error', 'fatal'].includes(e.level))
      .filter(e => new Date(e.timestamp) > cutoff)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
}

/**
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'analyze';
  
  console.log('🔍 Want It Now V1 - Log Analyzer');
  console.log('=====================================\n');
  
  const analyzer = new LogAnalyzer();
  
  switch (command) {
    case 'analyze':
      await analyzer.loadLogs();
      const report = analyzer.generateReport();
      console.log('\n📊 Analyse terminée:');
      console.log(`- ${report.summary.totalEntries} entrées analysées`);
      console.log(`- ${report.errors.totalUniqueErrors} erreurs uniques`);
      console.log(`- ${report.performance.slowRequests.total} requêtes lentes`);
      break;
      
    case 'export':
      await analyzer.loadLogs();
      const exportFile = analyzer.exportForClaude();
      console.log(`\n📝 Export Claude créé: ${exportFile}`);
      console.log('\n💡 Pour utiliser avec Claude Code:');
      console.log('1. Ouvrez le fichier d\'export');
      console.log('2. Copiez les sections pertinentes');
      console.log('3. Collez dans votre conversation Claude Code');
      break;
      
    case 'watch':
      console.log('👀 Mode surveillance (Ctrl+C pour arrêter)...');
      // Implement log watching functionality
      break;
      
    default:
      console.log('Usage: node log-analyzer.js [analyze|export|watch]');
      console.log('');
      console.log('Commands:');
      console.log('  analyze  - Analyser les logs et afficher un résumé');
      console.log('  export   - Créer un export formaté pour Claude Code');
      console.log('  watch    - Surveiller les logs en temps réel');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { LogAnalyzer, LogParser, config };