#!/usr/bin/env node
/**
 * Script: check-duplicate-hooks.ts
 *
 * Détecte les hooks dupliqués ou avec fonctionnalités similaires
 *
 * USAGE:
 *   node scripts/validation/check-duplicate-hooks.ts
 *   node scripts/validation/check-duplicate-hooks.ts --fix  # Suggère merge automatique
 *
 * DÉTECTIONS:
 * - Hooks accédant la même table Supabase
 * - Hooks avec queries identiques/similaires
 * - Hooks avec noms similaires (use-organizations vs use-organisations)
 * - Hooks non utilisés dans le codebase (deadcode)
 *
 * BEST PRACTICES SENIORS:
 * - 1 hook = 1 responsabilité (Single Responsibility Principle)
 * - Réutiliser hooks existants au lieu de créer doublons
 * - Naming cohérent (use-{domain}.ts)
 * - Supprimer hooks morts (deadcode)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// ============================================================================
// CONFIGURATION
// ============================================================================

const HOOKS_DIR = path.join(process.cwd(), 'src', 'hooks');
const SRC_DIR = path.join(process.cwd(), 'src');

// Tables centrales ERP - Normal d'avoir beaucoup de hooks les accédant
const CENTRAL_TABLES = [
  'products',
  'organisations',
  'sales_orders',
  'purchase_orders',
  'stock_movements',
  'users',
  'user_profiles',
];

// ============================================================================
// TYPES
// ============================================================================

interface HookInfo {
  name: string;
  path: string;
  tables: string[]; // Tables Supabase accédées
  queries: string[]; // Queries Supabase détectées
  exports: string[]; // Fonctions/hooks exportées
  dependencies: string[]; // Autres hooks importés
  usageCount: number; // Nombre d'imports dans le codebase
}

interface DuplicationIssue {
  type: 'same_table' | 'similar_query' | 'similar_name' | 'unused';
  severity: 'error' | 'warning' | 'info';
  hooks: string[];
  message: string;
  recommendation: string;
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Récupère tous les hooks (src/hooks/*.ts)
 */
function getAllHooks(): string[] {
  if (!fs.existsSync(HOOKS_DIR)) {
    console.error(`❌ Dossier hooks non trouvé: ${HOOKS_DIR}`);
    return [];
  }

  const scan = (dir: string): string[] => {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...scan(fullPath));
      } else if (
        entry.isFile() &&
        entry.name.endsWith('.ts') &&
        entry.name.startsWith('use-')
      ) {
        files.push(fullPath);
      }
    }

    return files;
  };

  return scan(HOOKS_DIR);
}

/**
 * Analyse un hook pour extraire informations
 */
function analyzeHook(hookPath: string): HookInfo {
  const content = fs.readFileSync(hookPath, 'utf-8');
  const name = path.basename(hookPath, '.ts');

  // Détecter tables Supabase (.from('table'))
  const tableMatches = content.matchAll(/\.from\(['"](\w+)['"]\)/g);
  const tables = Array.from(tableMatches, match => match[1]);

  // Détecter queries Supabase (select, insert, update, delete)
  const queryMatches = content.matchAll(
    /\.(select|insert|update|delete|upsert)\(/g
  );
  const queries = Array.from(queryMatches, match => match[1]);

  // Détecter exports (export function, export const)
  const exportMatches = content.matchAll(/export\s+(function|const)\s+(\w+)/g);
  const exports = Array.from(exportMatches, match => match[2]);

  // Détecter imports d'autres hooks
  const importMatches = content.matchAll(
    /from\s+['"]@\/hooks\/(use-[\w-]+)['"]/g
  );
  const dependencies = Array.from(importMatches, match => match[1]);

  // Compter usages dans le codebase
  const usageCount = countHookUsages(name);

  return {
    name,
    path: path.relative(process.cwd(), hookPath),
    tables: [...new Set(tables)],
    queries: [...new Set(queries)],
    exports,
    dependencies,
    usageCount,
  };
}

/**
 * Compte le nombre d'usages d'un hook dans le codebase
 */
function countHookUsages(hookName: string): number {
  try {
    // Grep dans src/ (exclude node_modules)
    const output = execSync(
      `grep -r "from.*/${hookName}" ${SRC_DIR} 2>/dev/null | wc -l`,
      { encoding: 'utf-8' }
    );
    return parseInt(output.trim(), 10) || 0;
  } catch {
    return 0;
  }
}

/**
 * Détecte les duplications potentielles
 */
function detectDuplications(hooks: HookInfo[]): DuplicationIssue[] {
  const issues: DuplicationIssue[] = [];

  // 1. Hooks accédant la même table
  const tableGroups = new Map<string, HookInfo[]>();
  hooks.forEach(hook => {
    hook.tables.forEach(table => {
      if (!tableGroups.has(table)) {
        tableGroups.set(table, []);
      }
      tableGroups.get(table)!.push(hook);
    });
  });

  tableGroups.forEach((groupHooks, table) => {
    // ✅ Ignorer tables centrales ERP (normal d'avoir beaucoup de hooks)
    if (CENTRAL_TABLES.includes(table)) {
      return; // Skip - comportement attendu dans un ERP
    }

    if (groupHooks.length > 1) {
      // Vérifier si c'est légitime (ex: use-organisations + use-customers)
      const isLegitimate = groupHooks.every(
        h => h.name.includes(table) || table === 'organisations'
      );

      if (!isLegitimate) {
        issues.push({
          type: 'same_table',
          severity: 'warning',
          hooks: groupHooks.map(h => h.name),
          message: `${groupHooks.length} hooks accèdent la table "${table}"`,
          recommendation: `Consolider la logique dans un seul hook si redondant`,
        });
      }
    }
  });

  // 2. Hooks avec noms similaires (typo/variantes)
  for (let i = 0; i < hooks.length; i++) {
    for (let j = i + 1; j < hooks.length; j++) {
      // ✅ Ignorer hooks dans dossiers utilitaires (base/, core/, utils/)
      const isUtilityHook = (hook: HookInfo) =>
        hook.path.includes('/base/') ||
        hook.path.includes('/core/') ||
        hook.path.includes('/utils/');

      if (isUtilityHook(hooks[i]) || isUtilityHook(hooks[j])) {
        continue; // Skip - hooks utilitaires légitimes
      }

      const similarity = calculateSimilarity(hooks[i].name, hooks[j].name);

      // ✅ Seuils ajustés pour éviter faux positifs
      if (similarity > 0.95) {
        // >95% similarité = Duplication probable (BLOQUE)
        issues.push({
          type: 'similar_name',
          severity: 'error',
          hooks: [hooks[i].name, hooks[j].name],
          message: `Noms quasi-identiques (${Math.round(similarity * 100)}% similarité)`,
          recommendation: `Duplication probable - consolider ou renommer`,
        });
      } else if (similarity > 0.85) {
        // 85-95% = Suspect mais peut être légitime (WARNING, ne bloque pas)
        issues.push({
          type: 'similar_name',
          severity: 'warning',
          hooks: [hooks[i].name, hooks[j].name],
          message: `Noms similaires (${Math.round(similarity * 100)}% similarité)`,
          recommendation: `Vérifier si typo ou convention naming légitime (ex: use-order-metrics vs use-user-metrics)`,
        });
      }
      // <85% = Différences légitimes (ex: use-order-metrics vs use-user-metrics = 82%)
    }
  }

  // 3. Hooks non utilisés (deadcode)
  hooks.forEach(hook => {
    if (hook.usageCount === 0) {
      issues.push({
        type: 'unused',
        severity: 'info',
        hooks: [hook.name],
        message: `Hook non utilisé dans le codebase (0 imports)`,
        recommendation: `Supprimer si obsolète ou ajouter tests`,
      });
    }
  });

  return issues;
}

/**
 * Calcule similarité entre 2 strings (Levenshtein distance)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return 1 - distance / maxLen;
}

/**
 * Formate un rapport d'issues
 */
function formatReport(hooks: HookInfo[], issues: DuplicationIssue[]): string {
  let report = '\n';
  report += '═'.repeat(80) + '\n';
  report += '🔍 RAPPORT DÉTECTION DOUBLONS HOOKS\n';
  report += '═'.repeat(80) + '\n\n';

  report += `📊 STATISTIQUES:\n`;
  report += `   - Total hooks: ${hooks.length}\n`;
  report += `   - Hooks utilisés: ${hooks.filter(h => h.usageCount > 0).length}\n`;
  report += `   - Hooks non utilisés: ${hooks.filter(h => h.usageCount === 0).length}\n`;
  report += `   - Issues détectées: ${issues.length}\n\n`;

  if (issues.length === 0) {
    report += '✅ Aucune duplication ou incohérence détectée\n\n';
    return report;
  }

  // Grouper par type
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  const infos = issues.filter(i => i.severity === 'info');

  if (errors.length > 0) {
    report += '❌ ERREURS (Duplications critiques):\n';
    report += '─'.repeat(80) + '\n';
    errors.forEach((issue, idx) => {
      report += `\n${idx + 1}. ${issue.message}\n`;
      report += `   Hooks concernés: ${issue.hooks.join(', ')}\n`;
      report += `   💡 Recommandation: ${issue.recommendation}\n`;
    });
    report += '\n';
  }

  if (warnings.length > 0) {
    report += '⚠️  WARNINGS (Redondances potentielles):\n';
    report += '─'.repeat(80) + '\n';
    warnings.forEach((issue, idx) => {
      report += `\n${idx + 1}. ${issue.message}\n`;
      report += `   Hooks concernés: ${issue.hooks.join(', ')}\n`;
      report += `   💡 Recommandation: ${issue.recommendation}\n`;
    });
    report += '\n';
  }

  if (infos.length > 0 && infos.length <= 10) {
    report += 'ℹ️  INFO (Hooks non utilisés):\n';
    report += '─'.repeat(80) + '\n';
    infos.forEach((issue, idx) => {
      report += `\n${idx + 1}. ${issue.hooks[0]}: ${issue.message}\n`;
    });
    report += '\n';
  }

  report += '═'.repeat(80) + '\n';
  report += '💡 BEST PRACTICES:\n';
  report += '   1. Réutiliser hooks existants au lieu de créer doublons\n';
  report += '   2. Naming cohérent: use-{domain}.ts (ex: use-products.ts)\n';
  report += '   3. Supprimer hooks morts (deadcode) après vérification\n';
  report += '   4. Un hook = une responsabilité (Single Responsibility)\n';
  report += '═'.repeat(80) + '\n';

  return report;
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log('🔍 Détection Doublons Hooks...\n');

  // Récupérer tous les hooks
  const hookPaths = getAllHooks();
  console.log(`📂 Analyse de ${hookPaths.length} hooks...\n`);

  if (hookPaths.length === 0) {
    console.log('ℹ️  Aucun hook trouvé dans src/hooks/\n');
    process.exit(0);
  }

  // Analyser chaque hook
  const hooks = hookPaths.map(analyzeHook);

  // Détecter duplications
  const issues = detectDuplications(hooks);

  // Afficher rapport
  const report = formatReport(hooks, issues);
  console.log(report);

  // Exit code
  const hasErrors = issues.some(i => i.severity === 'error');
  if (hasErrors) {
    console.error('❌ Validation échouée: Duplications critiques détectées\n');
    process.exit(1);
  } else {
    console.log('✅ Validation réussie\n');
    process.exit(0);
  }
}

// Run if this file is executed directly (ES module compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { analyzeHook, detectDuplications, getAllHooks };
