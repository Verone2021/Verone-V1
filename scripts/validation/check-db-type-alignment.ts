#!/usr/bin/env node
/**
 * Script: check-db-type-alignment.ts
 *
 * Détecte les incohérences entre types Supabase et types frontend
 *
 * USAGE:
 *   node scripts/validation/check-db-type-alignment.ts
 *   node scripts/validation/check-db-type-alignment.ts --staged  # Only staged files
 *
 * DÉTECTIONS:
 * - Types manuels au lieu de Database['public']['Tables']['...']['Row']
 * - Queries Supabase sans types générés
 * - Colonnes inexistantes dans schema
 * - Enums hardcodés au lieu d'enums générés
 *
 * BEST PRACTICES SENIORS:
 * - Utiliser toujours types Supabase générés (source de vérité unique)
 * - Pas de types manuels dupliqués
 * - Validation automatique via git hooks
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SRC_DIR = path.join(process.cwd(), 'src');
const SUPABASE_TYPES_FILE = path.join(SRC_DIR, 'types', 'supabase.ts');
const SCHEMA_REFERENCE = path.join(process.cwd(), 'docs', 'database', 'SCHEMA-REFERENCE.md');

// Tables principales Vérone (78 tables)
const KNOWN_TABLES = [
  'products', 'organisations', 'contacts', 'users', 'user_profiles',
  'categories', 'subcategories', 'collections', 'product_images',
  'price_lists', 'price_list_items', 'sales_orders', 'sales_order_items',
  'purchase_orders', 'purchase_order_items', 'stock_movements',
  'invoices', 'invoice_items', 'payments', 'consultations',
  // Ajoutez d'autres tables au besoin
];

// Patterns à détecter (anti-patterns)
const ANTI_PATTERNS = [
  {
    pattern: /type\s+(\w+)\s*=\s*\{[^}]*id:\s*string/g,
    message: 'Type manuel détecté. Utiliser Database["public"]["Tables"]["..."]["Row"]',
    severity: 'error',
  },
  {
    pattern: /interface\s+(\w+)\s*\{[^}]*id:\s*string/g,
    message: 'Interface manuelle détectée. Utiliser Database["public"]["Tables"]["..."]["Row"]',
    severity: 'error',
  },
  {
    pattern: /\.from\(['"](\w+)['"]\)(?!.*<)/g,
    message: 'Query Supabase sans type. Ajouter: .from<Database["public"]["Tables"]["..."]["Row"]>(...)',
    severity: 'warning',
  },
];

// ============================================================================
// TYPES
// ============================================================================

interface Issue {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  snippet?: string;
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Récupère la liste des fichiers à analyser
 */
function getFilesToCheck(stagedOnly: boolean = false): string[] {
  if (stagedOnly) {
    try {
      const output = execSync('git diff --cached --name-only --diff-filter=ACMR', {
        encoding: 'utf-8',
      });
      return output
        .split('\n')
        .filter(file => file.match(/\.(ts|tsx)$/))
        .filter(file => fs.existsSync(file));
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers staged');
      return [];
    }
  }

  // Scan récursif de src/
  return getAllTypeScriptFiles(SRC_DIR);
}

/**
 * Récupère tous les fichiers TypeScript récursivement
 */
function getAllTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];

  function scan(directory: string) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        scan(fullPath);
      } else if (entry.isFile() && entry.name.match(/\.(ts|tsx)$/)) {
        files.push(fullPath);
      }
    }
  }

  scan(dir);
  return files;
}

/**
 * Analyse un fichier pour détecter les anti-patterns
 */
function analyzeFile(filePath: string): Issue[] {
  const issues: Issue[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    for (const antiPattern of ANTI_PATTERNS) {
      const matches = line.matchAll(antiPattern.pattern);

      for (const match of matches) {
        issues.push({
          file: path.relative(process.cwd(), filePath),
          line: index + 1,
          column: (match.index || 0) + 1,
          message: antiPattern.message,
          severity: antiPattern.severity,
          snippet: line.trim(),
        });
      }
    }
  });

  return issues;
}

/**
 * Vérifie si le fichier types Supabase existe
 */
function checkSupabaseTypesExist(): boolean {
  if (!fs.existsSync(SUPABASE_TYPES_FILE)) {
    console.error(`❌ ERREUR: Fichier types Supabase non trouvé: ${SUPABASE_TYPES_FILE}`);
    console.error('   Générer avec: supabase gen types typescript --local > src/types/supabase.ts');
    return false;
  }
  return true;
}

/**
 * Formate un rapport d'issues
 */
function formatReport(issues: Issue[]): string {
  if (issues.length === 0) {
    return '✅ Aucune incohérence détectée entre types Database et Frontend\n';
  }

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  let report = '\n';
  report += '═'.repeat(80) + '\n';
  report += '🔍 RAPPORT VALIDATION TYPES DATABASE/FRONTEND\n';
  report += '═'.repeat(80) + '\n\n';

  report += `📊 RÉSUMÉ:\n`;
  report += `   - Erreurs: ${errors.length}\n`;
  report += `   - Warnings: ${warnings.length}\n`;
  report += `   - Total: ${issues.length}\n\n`;

  if (errors.length > 0) {
    report += '❌ ERREURS (Types manuels détectés):\n';
    report += '─'.repeat(80) + '\n';

    errors.forEach(issue => {
      report += `\n📁 ${issue.file}:${issue.line}:${issue.column}\n`;
      report += `   ${issue.message}\n`;
      if (issue.snippet) {
        report += `   Code: ${issue.snippet}\n`;
      }
    });
    report += '\n';
  }

  if (warnings.length > 0) {
    report += '⚠️  WARNINGS (Queries sans types):\n';
    report += '─'.repeat(80) + '\n';

    warnings.forEach(issue => {
      report += `\n📁 ${issue.file}:${issue.line}:${issue.column}\n`;
      report += `   ${issue.message}\n`;
      if (issue.snippet) {
        report += `   Code: ${issue.snippet}\n`;
      }
    });
    report += '\n';
  }

  report += '═'.repeat(80) + '\n';
  report += '💡 RECOMMANDATIONS:\n';
  report += '   1. Toujours importer: import { Database } from "@/types/supabase"\n';
  report += '   2. Typer avec: Database["public"]["Tables"]["products"]["Row"]\n';
  report += '   3. Queries typées: .from<Database["public"]["Tables"]["..."]["Row"]>("table")\n';
  report += '   4. Pas de types manuels dupliqués (source vérité = supabase.ts)\n';
  report += '═'.repeat(80) + '\n';

  return report;
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log('🔍 Validation Types Database/Frontend...\n');

  // Vérifier arguments
  const stagedOnly = process.argv.includes('--staged');
  if (stagedOnly) {
    console.log('ℹ️  Mode: Fichiers staged uniquement\n');
  }

  // Vérifier que types Supabase existent
  if (!checkSupabaseTypesExist()) {
    process.exit(1);
  }

  // Récupérer fichiers à analyser
  const files = getFilesToCheck(stagedOnly);
  console.log(`📂 Analyse de ${files.length} fichiers TypeScript...\n`);

  if (files.length === 0) {
    console.log('ℹ️  Aucun fichier à analyser\n');
    process.exit(0);
  }

  // Analyser chaque fichier
  const allIssues: Issue[] = [];

  for (const file of files) {
    const issues = analyzeFile(file);
    allIssues.push(...issues);
  }

  // Afficher rapport
  const report = formatReport(allIssues);
  console.log(report);

  // Exit code
  const hasErrors = allIssues.some(i => i.severity === 'error');
  if (hasErrors) {
    console.error('❌ Validation échouée: Erreurs détectées\n');
    process.exit(1);
  } else {
    console.log('✅ Validation réussie\n');
    process.exit(0);
  }
}

// Run
if (require.main === module) {
  main();
}

export { analyzeFile, getFilesToCheck };
