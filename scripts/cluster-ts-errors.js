#!/usr/bin/env node

/**
 * TypeScript Error Clustering Script
 *
 * Analyse ts-errors-raw.log et génère :
 * - error-clusters.json : Clusters d'erreurs par famille
 * - TS_ERRORS_PLAN.md : Plan de correction priorisé
 *
 * Usage: node scripts/cluster-ts-errors.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_FILE = 'ts-errors-raw.log';
const OUTPUT_JSON = 'error-clusters.json';
const OUTPUT_PLAN = 'TS_ERRORS_PLAN.md';

// Priorités par code d'erreur
const ERROR_PRIORITIES = {
  'TS7006': 'P0', // Implicit any - Blocking
  'TS2322': 'P1', // Type incompatibility - Critical
  'TS2345': 'P1', // Argument type mismatch - Critical
  'TS2339': 'P1', // Property does not exist - Critical
  'TS2531': 'P1', // Object is possibly null - Critical
  'TS2532': 'P1', // Object is possibly undefined - Critical
  'TS2769': 'P2', // No overload matches - High
  'TS2783': 'P2', // Type has no properties - High
  'TS2749': 'P2', // Cannot find module - High
  'TS2307': 'P2', // Cannot find module - High
  'TS18046': 'P2', // Unknown type - High
  'DEFAULT': 'P3' // Low priority par défaut
};

// Stratégies de correction par code
const ERROR_STRATEGIES = {
  'TS2322': 'Null coalescing (??), optional chaining (?.)',
  'TS2345': 'Type assertions, generic constraints',
  'TS2339': 'Interface extension, optional properties',
  'TS7006': 'Explicit typing, remove implicit any',
  'TS2531': 'Null checks, optional chaining',
  'TS2532': 'Undefined checks, optional chaining',
  'DEFAULT': 'Manual review and fix'
};

/**
 * Parse une ligne d'erreur TypeScript
 * Format: src/file.tsx(45,12): error TS2322: Message
 */
function parseErrorLine(line) {
  const regex = /^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/;
  const match = line.match(regex);

  if (!match) return null;

  return {
    file: match[1],
    line: parseInt(match[2]),
    column: parseInt(match[3]),
    code: match[4],
    message: match[5].trim()
  };
}

/**
 * Extrait le pattern d'un message d'erreur
 */
function extractPattern(message) {
  // Remplace les types spécifiques par des placeholders
  let pattern = message
    .replace(/Type '.*?'/g, "Type 'X'")
    .replace(/type '.*?'/g, "type 'X'")
    .replace(/Property '.*?'/g, "Property 'X'")
    .replace(/property '.*?'/g, "property 'X'")
    .replace(/Argument of type '.*?'/g, "Argument of type 'X'")
    .replace(/Parameter '.*?'/g, "Parameter 'X'")
    .replace(/'.*?' is not assignable/g, "'X' is not assignable")
    .replace(/Cannot find name '.*?'/g, "Cannot find name 'X'")
    .replace(/Cannot find module '.*?'/g, "Cannot find module 'X'");

  return pattern;
}

/**
 * Calcule la priorité basée sur code, fréquence et impact
 */
function calculatePriority(errorCode, count) {
  const basePriority = ERROR_PRIORITIES[errorCode] || ERROR_PRIORITIES.DEFAULT;

  // Augmente priorité si très fréquent
  if (count > 100 && basePriority === 'P2') return 'P1';
  if (count > 200 && basePriority === 'P3') return 'P2';

  return basePriority;
}

/**
 * Estime l'effort de correction
 */
function estimateEffort(errorCode, count) {
  const baseTime = {
    'TS7006': 2,   // 2 min/erreur (simple typing)
    'TS2322': 3,   // 3 min/erreur (null handling)
    'TS2345': 4,   // 4 min/erreur (type assertions)
    'TS2339': 5,   // 5 min/erreur (interface changes)
    'DEFAULT': 5
  };

  const time = baseTime[errorCode] || baseTime.DEFAULT;
  const totalMinutes = Math.ceil((count * time) / 60) * 60; // Arrondi heure
  const hours = Math.floor(totalMinutes / 60);

  if (hours < 2) return `${hours}h`;
  if (hours < 4) return `${hours-1}-${hours+1}h`;
  return `${hours-1}-${hours+2}h`;
}

/**
 * Génère un ID de famille unique
 */
function generateFamilyId(errorCode, pattern) {
  const shortPattern = pattern
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 30);

  return `${errorCode}-${shortPattern}`;
}

/**
 * Parse le fichier d'erreurs et crée les clusters
 */
function clusterErrors(inputFile) {
  console.log(`📖 Lecture ${inputFile}...`);

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Fichier ${inputFile} introuvable`);
    console.error(`💡 Générez-le avec: npm run type-check 2>&1 | tee ${inputFile}`);
    process.exit(1);
  }

  const content = fs.readFileSync(inputFile, 'utf-8');
  const lines = content.split('\n');

  const errors = [];
  let totalErrors = 0;

  // Parse toutes les lignes
  for (const line of lines) {
    const error = parseErrorLine(line);
    if (error) {
      errors.push(error);
      totalErrors++;
    }
  }

  console.log(`✅ ${totalErrors} erreurs trouvées`);

  // Groupe par code d'erreur
  const byCode = {};
  for (const error of errors) {
    if (!byCode[error.code]) {
      byCode[error.code] = [];
    }
    byCode[error.code].push(error);
  }

  // Crée les clusters par pattern
  const clusters = [];

  for (const [code, codeErrors] of Object.entries(byCode)) {
    // Groupe par pattern similaire
    const patternGroups = {};

    for (const error of codeErrors) {
      const pattern = extractPattern(error.message);
      if (!patternGroups[pattern]) {
        patternGroups[pattern] = {
          pattern,
          errors: [],
          files: new Set()
        };
      }
      patternGroups[pattern].errors.push(error);
      patternGroups[pattern].files.add(error.file);
    }

    // Crée un cluster par pattern
    for (const [pattern, group] of Object.entries(patternGroups)) {
      const count = group.errors.length;
      const files = Array.from(group.files);
      const priority = calculatePriority(code, count);
      const estimation = estimateEffort(code, count);
      const strategy = ERROR_STRATEGIES[code] || ERROR_STRATEGIES.DEFAULT;

      clusters.push({
        id: generateFamilyId(code, pattern),
        errorCode: code,
        count,
        priority,
        pattern,
        strategy,
        estimation,
        files: files.slice(0, 10), // Max 10 fichiers pour lisibilité
        fileCount: files.length,
        status: 'TODO',
        examples: group.errors.slice(0, 5).map(e => ({
          file: e.file,
          line: e.line,
          message: e.message
        }))
      });
    }
  }

  // Trie par priorité puis count
  const priorityOrder = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 };
  clusters.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.count - a.count; // Plus d'erreurs en premier
  });

  return {
    totalErrors,
    clusterCount: clusters.length,
    clusters,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Génère le fichier JSON
 */
function generateJSON(data, outputFile) {
  console.log(`\n📄 Génération ${outputFile}...`);
  fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
  console.log(`✅ ${outputFile} créé`);
}

/**
 * Génère le plan markdown
 */
function generatePlan(data, outputFile) {
  console.log(`\n📄 Génération ${outputFile}...`);

  const { totalErrors, clusterCount, clusters } = data;

  // Compte par priorité
  const byPriority = {
    'P0': clusters.filter(c => c.priority === 'P0'),
    'P1': clusters.filter(c => c.priority === 'P1'),
    'P2': clusters.filter(c => c.priority === 'P2'),
    'P3': clusters.filter(c => c.priority === 'P3')
  };

  let plan = `# 🎯 TypeScript Errors - Plan de Correction

**Date** : ${new Date().toLocaleDateString('fr-FR')}
**Total erreurs** : ${totalErrors}
**Familles** : ${clusterCount}

---

## 📊 Vue d'ensemble

| Priorité | Familles | Erreurs |
|----------|----------|---------|
| P0 (Blocking) | ${byPriority.P0.length} | ${byPriority.P0.reduce((sum, c) => sum + c.count, 0)} |
| P1 (Critical) | ${byPriority.P1.length} | ${byPriority.P1.reduce((sum, c) => sum + c.count, 0)} |
| P2 (High) | ${byPriority.P2.length} | ${byPriority.P2.reduce((sum, c) => sum + c.count, 0)} |
| P3 (Low) | ${byPriority.P3.length} | ${byPriority.P3.reduce((sum, c) => sum + c.count, 0)} |

---

## 🏆 Milestones

- [ ] **M1** : 100 erreurs résolues (${totalErrors}→${totalErrors - 100})
- [ ] **M2** : 250 erreurs résolues (${totalErrors}→${totalErrors - 250})
- [ ] **M3** : 500 erreurs résolues (${totalErrors}→${totalErrors - 500})
- [ ] **M4** : Toutes P0+P1 résolues
- [ ] **M5** : 0 erreurs TypeScript

---

`;

  // Génère sections par priorité
  for (const [priority, priorityClusters] of Object.entries(byPriority)) {
    if (priorityClusters.length === 0) continue;

    const priorityLabels = {
      'P0': 'Blocking',
      'P1': 'Critical',
      'P2': 'High',
      'P3': 'Low'
    };

    plan += `## ${priority} - ${priorityLabels[priority]} (${priorityClusters.length} familles)\n\n`;

    for (const cluster of priorityClusters) {
      const status = cluster.status === 'TODO' ? '📋' : cluster.status === 'IN_PROGRESS' ? '⏳' : '✅';

      plan += `### ${status} ${cluster.id}\n\n`;
      plan += `**Code** : ${cluster.errorCode}\n`;
      plan += `**Count** : ${cluster.count} erreurs\n`;
      plan += `**Files** : ${cluster.fileCount} fichiers\n`;
      plan += `**Estimation** : ${cluster.estimation}\n`;
      plan += `**Status** : ${cluster.status}\n\n`;
      plan += `**Pattern** :\n\`\`\`\n${cluster.pattern}\n\`\`\`\n\n`;
      plan += `**Stratégie** : ${cluster.strategy}\n\n`;

      if (cluster.examples.length > 0) {
        plan += `**Exemples** :\n`;
        for (const example of cluster.examples.slice(0, 3)) {
          plan += `- \`${example.file}:${example.line}\` - ${example.message.substring(0, 80)}...\n`;
        }
        plan += `\n`;
      }

      plan += `**Commande** : \`/typescript-fix ${cluster.id}\`\n\n`;
      plan += `---\n\n`;
    }
  }

  // Footer
  plan += `## 📝 Workflow

1. **Sélectionner famille prioritaire** (ordre P0 → P1 → P2 → P3)
2. **Analyser pattern** : Lire exemples, comprendre cause racine
3. **Corriger TOUTE la famille** : Une session complète
4. **Tests AVANT commit** :
   - \`npm run type-check\` : Erreurs réduites
   - \`npm run build\` : Success
   - \`/error-check\` : 0 console errors
5. **Commit structuré** :
   \`\`\`
   fix(types): [CODE-PATTERN] Description - X erreurs (avant→après)
   \`\`\`
6. **Update ce fichier** : Marquer famille DONE
7. **Répéter** jusqu'à 0 erreurs

---

## 🎯 Prochaine Action

Famille recommandée : **${clusters[0].id}**
- ${clusters[0].count} erreurs
- Priorité ${clusters[0].priority}
- Estimation ${clusters[0].estimation}

\`\`\`bash
/typescript-fix ${clusters[0].id}
\`\`\`

---

**Généré automatiquement** : ${new Date().toISOString()}
`;

  fs.writeFileSync(outputFile, plan);
  console.log(`✅ ${outputFile} créé`);
}

/**
 * Affiche résumé
 */
function displaySummary(data) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 CLUSTERING TERMINÉ`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\nTotal erreurs : ${data.totalErrors}`);
  console.log(`Familles détectées : ${data.clusterCount}\n`);

  const byPriority = {
    'P0': data.clusters.filter(c => c.priority === 'P0'),
    'P1': data.clusters.filter(c => c.priority === 'P1'),
    'P2': data.clusters.filter(c => c.priority === 'P2'),
    'P3': data.clusters.filter(c => c.priority === 'P3')
  };

  console.log(`P0 (Blocking) : ${byPriority.P0.length} familles, ${byPriority.P0.reduce((s, c) => s + c.count, 0)} erreurs`);
  console.log(`P1 (Critical) : ${byPriority.P1.length} familles, ${byPriority.P1.reduce((s, c) => s + c.count, 0)} erreurs`);
  console.log(`P2 (High)     : ${byPriority.P2.length} familles, ${byPriority.P2.reduce((s, c) => s + c.count, 0)} erreurs`);
  console.log(`P3 (Low)      : ${byPriority.P3.length} familles, ${byPriority.P3.reduce((s, c) => s + c.count, 0)} erreurs`);

  console.log(`\n🎯 Prochaine famille recommandée :`);
  console.log(`   ${data.clusters[0].id}`);
  console.log(`   ${data.clusters[0].count} erreurs, ${data.clusters[0].priority}, ${data.clusters[0].estimation}\n`);

  console.log(`📁 Fichiers générés :`);
  console.log(`   - ${OUTPUT_JSON}`);
  console.log(`   - ${OUTPUT_PLAN}`);

  console.log(`\n🚀 Prochaine étape :`);
  console.log(`   /typescript-fix ${data.clusters[0].id}\n`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

// Exécution principale
try {
  console.log(`\n🚀 TypeScript Error Clustering\n`);

  const data = clusterErrors(INPUT_FILE);
  generateJSON(data, OUTPUT_JSON);
  generatePlan(data, OUTPUT_PLAN);
  displaySummary(data);

} catch (error) {
  console.error(`\n❌ Erreur : ${error.message}`);
  process.exit(1);
}
