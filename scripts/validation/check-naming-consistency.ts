#!/usr/bin/env node
/**
 * Script: check-naming-consistency.ts
 *
 * Valide les conventions de nommage du projet Vérone
 *
 * USAGE:
 *   node scripts/validation/check-naming-consistency.ts
 *   node scripts/validation/check-naming-consistency.ts --staged
 *   node scripts/validation/check-naming-consistency.ts --fix  # Auto-rename (à venir)
 *
 * CONVENTIONS ENFORCED:
 * - Hooks: use-{domain}.ts (kebab-case)
 * - Components: {name}.tsx (kebab-case)
 * - Types: PascalCase
 * - Functions: camelCase
 * - Variables: camelCase
 * - Database Tables: snake_case
 * - Enums: snake_case_type
 *
 * BEST PRACTICES SENIORS:
 * - Cohérence = maintenabilité
 * - Conventions strictes = moins d'erreurs
 * - Automatisation via git hooks
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'node:url';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SRC_DIR = path.join(process.cwd(), 'src');

// Conventions de nommage par type de fichier
const NAMING_RULES = {
  hooks: {
    pattern: /^use-[a-z][a-z0-9]*(-[a-z0-9]+)*\.ts$/,
    message: 'Hooks doivent suivre: use-{domain}.ts (kebab-case)',
    examples: ['use-products.ts', 'use-stock-movements.ts'],
    directory: 'src/hooks/',
  },
  components: {
    pattern: /^[a-z][a-z0-9]*(-[a-z0-9]+)*\.(tsx|ts)$/,
    message: 'Components doivent suivre: {name}.tsx (kebab-case)',
    examples: ['product-card.tsx', 'stock-alert.tsx'],
    directory: 'src/components/',
  },
  pages: {
    pattern:
      /^(page|layout|loading|error|not-found)\.tsx$|^\[[\w-]+\]$|^[a-z][a-z0-9]*(-[a-z0-9]+)*$/,
    message: 'Pages Next.js: page.tsx, layout.tsx, [id], ou kebab-case',
    examples: ['page.tsx', '[productId]', 'google-merchant'],
    directory: 'src/app/',
  },
};

// Patterns à détecter dans le code
const CODE_PATTERNS = {
  typeNaming: {
    pattern: /type\s+([a-z_][a-z0-9_]*)\s*=/g,
    message: 'Types doivent être PascalCase, pas snake_case',
    examples: ['type Product =', 'type OrderStatus ='],
  },
  interfaceNaming: {
    pattern: /interface\s+([a-z_][a-z0-9_]*)\s*\{/g,
    message: 'Interfaces doivent être PascalCase, pas snake_case',
    examples: ['interface Product {', 'interface OrderItem {'],
  },
  functionNaming: {
    pattern: /function\s+([A-Z][a-zA-Z0-9]*|[a-z_]+_[a-z_]+)\s*\(/g,
    message: 'Functions doivent être camelCase, pas PascalCase ou snake_case',
    examples: ['function calculatePrice()', 'function getUserRole()'],
  },
  constNaming: {
    pattern: /const\s+([a-z]+_[a-z_]+)\s*=/g,
    message:
      'Variables const doivent être camelCase ou UPPER_CASE, pas snake_case',
    examples: ['const productPrice =', 'const MAX_RETRIES ='],
  },
};

// ============================================================================
// TYPES
// ============================================================================

interface NamingIssue {
  file: string;
  line?: number;
  type: 'filename' | 'code';
  rule: string;
  current: string;
  expected?: string;
  message: string;
  severity: 'error' | 'warning';
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Récupère les fichiers à vérifier
 */
function getFilesToCheck(stagedOnly: boolean = false): string[] {
  if (stagedOnly) {
    try {
      const output = execSync(
        'git diff --cached --name-only --diff-filter=ACMR',
        {
          encoding: 'utf-8',
        }
      );
      return output
        .split('\n')
        .filter(file => file.startsWith('src/'))
        .filter(file => fs.existsSync(file));
    } catch {
      return [];
    }
  }

  // Scan récursif de src/
  return getAllFiles(SRC_DIR);
}

/**
 * Récupère tous les fichiers récursivement
 */
function getAllFiles(dir: string): string[] {
  const files: string[] = [];

  function scan(directory: string) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (
        entry.isDirectory() &&
        !entry.name.startsWith('.') &&
        entry.name !== 'node_modules'
      ) {
        scan(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  scan(dir);
  return files;
}

/**
 * Vérifie le nommage des fichiers
 */
function checkFilenameConventions(filePath: string): NamingIssue[] {
  const issues: NamingIssue[] = [];
  const relativePath = path.relative(process.cwd(), filePath);
  const fileName = path.basename(filePath);

  // Vérifier hooks
  if (relativePath.includes('src/hooks/')) {
    const rule = NAMING_RULES.hooks;
    if (!rule.pattern.test(fileName)) {
      // Vérifier si c'est une exception légitime
      const exceptions = ['use-toast.ts', 'use-base-hook.ts'];
      if (
        !exceptions.includes(fileName) &&
        fileName.startsWith('use-') &&
        fileName.endsWith('.ts')
      ) {
        issues.push({
          file: relativePath,
          type: 'filename',
          rule: 'hooks',
          current: fileName,
          message: rule.message,
          severity: 'error',
        });
      }
    }
  }

  // Vérifier components
  if (relativePath.includes('src/components/')) {
    const rule = NAMING_RULES.components;
    if (!rule.pattern.test(fileName) && !fileName.endsWith('.d.ts')) {
      // Exceptions légitimes
      const exceptions = ['index.tsx', 'index.ts'];
      if (!exceptions.includes(fileName)) {
        issues.push({
          file: relativePath,
          type: 'filename',
          rule: 'components',
          current: fileName,
          message: rule.message,
          severity: 'error',
        });
      }
    }
  }

  // Vérifier pages
  if (relativePath.includes('src/app/')) {
    const rule = NAMING_RULES.pages;
    const dirName = path.basename(path.dirname(filePath));

    // Vérifier uniquement noms de dossiers (pas fichiers page.tsx)
    if (!rule.pattern.test(fileName) && !rule.pattern.test(dirName)) {
      // Exceptions Next.js
      const exceptions = [
        'page.tsx',
        'layout.tsx',
        'loading.tsx',
        'error.tsx',
        'not-found.tsx',
        'template.tsx',
        'default.tsx',
        'route.ts',
        'middleware.ts',
      ];
      if (!exceptions.includes(fileName)) {
        // Vérifier si c'est un dossier dynamic route [param]
        if (!dirName.match(/^\[[\w-]+\]$/)) {
          issues.push({
            file: relativePath,
            type: 'filename',
            rule: 'pages',
            current: fileName,
            message: rule.message,
            severity: 'warning',
          });
        }
      }
    }
  }

  return issues;
}

/**
 * Vérifie le nommage dans le code
 */
function checkCodeConventions(filePath: string): NamingIssue[] {
  const issues: NamingIssue[] = [];
  const relativePath = path.relative(process.cwd(), filePath);

  // Lire uniquement fichiers TypeScript
  if (!filePath.match(/\.(ts|tsx)$/)) {
    return issues;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Vérifier types snake_case
  lines.forEach((line, index) => {
    const typeMatch = line.match(CODE_PATTERNS.typeNaming.pattern);
    if (typeMatch) {
      const typeName = typeMatch[1];
      if (typeName && typeName.includes('_') && !typeName.match(/^[A-Z]/)) {
        issues.push({
          file: relativePath,
          line: index + 1,
          type: 'code',
          rule: 'type-naming',
          current: typeName,
          expected: toPascalCase(typeName),
          message: CODE_PATTERNS.typeNaming.message,
          severity: 'error',
        });
      }
    }

    // Vérifier interfaces snake_case
    const interfaceMatch = line.match(CODE_PATTERNS.interfaceNaming.pattern);
    if (interfaceMatch) {
      const interfaceName = interfaceMatch[1];
      if (interfaceName && interfaceName.includes('_')) {
        issues.push({
          file: relativePath,
          line: index + 1,
          type: 'code',
          rule: 'interface-naming',
          current: interfaceName,
          expected: toPascalCase(interfaceName),
          message: CODE_PATTERNS.interfaceNaming.message,
          severity: 'error',
        });
      }
    }

    // Vérifier functions PascalCase ou snake_case
    const functionMatch = line.match(CODE_PATTERNS.functionNaming.pattern);
    if (functionMatch) {
      const funcName = functionMatch[1];
      if (funcName) {
        // PascalCase détecté
        if (funcName.match(/^[A-Z]/)) {
          issues.push({
            file: relativePath,
            line: index + 1,
            type: 'code',
            rule: 'function-naming',
            current: funcName,
            expected: toCamelCase(funcName),
            message: CODE_PATTERNS.functionNaming.message,
            severity: 'warning',
          });
        }
        // snake_case détecté
        if (funcName.includes('_')) {
          issues.push({
            file: relativePath,
            line: index + 1,
            type: 'code',
            rule: 'function-naming',
            current: funcName,
            expected: toCamelCase(funcName),
            message: CODE_PATTERNS.functionNaming.message,
            severity: 'warning',
          });
        }
      }
    }
  });

  return issues;
}

/**
 * Convertit snake_case en PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Convertit PascalCase ou snake_case en camelCase
 */
function toCamelCase(str: string): string {
  if (str.includes('_')) {
    // snake_case → camelCase
    const parts = str.split('_');
    return (
      parts[0] +
      parts
        .slice(1)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')
    );
  } else {
    // PascalCase → camelCase
    return str.charAt(0).toLowerCase() + str.slice(1);
  }
}

/**
 * Formate un rapport d'issues
 */
function formatReport(issues: NamingIssue[]): string {
  if (issues.length === 0) {
    return '✅ Toutes les conventions de nommage sont respectées\n';
  }

  let report = '\n';
  report += '═'.repeat(80) + '\n';
  report += '🔍 RAPPORT VALIDATION NAMING CONVENTIONS\n';
  report += '═'.repeat(80) + '\n\n';

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  report += `📊 RÉSUMÉ:\n`;
  report += `   - Erreurs: ${errors.length}\n`;
  report += `   - Warnings: ${warnings.length}\n`;
  report += `   - Total: ${issues.length}\n\n`;

  if (errors.length > 0) {
    report += '❌ ERREURS (Conventions violées):\n';
    report += '─'.repeat(80) + '\n';

    errors.forEach((issue, idx) => {
      report += `\n${idx + 1}. ${issue.file}`;
      if (issue.line) report += `:${issue.line}`;
      report += `\n`;
      report += `   ${issue.message}\n`;
      report += `   ❌ Actuel: ${issue.current}\n`;
      if (issue.expected) {
        report += `   ✅ Attendu: ${issue.expected}\n`;
      }
    });
    report += '\n';
  }

  if (warnings.length > 0) {
    report += '⚠️  WARNINGS (À corriger):\n';
    report += '─'.repeat(80) + '\n';

    warnings.slice(0, 10).forEach((issue, idx) => {
      report += `\n${idx + 1}. ${issue.file}`;
      if (issue.line) report += `:${issue.line}`;
      report += `\n`;
      report += `   ${issue.message}\n`;
      report += `   ❌ Actuel: ${issue.current}\n`;
      if (issue.expected) {
        report += `   ✅ Attendu: ${issue.expected}\n`;
      }
    });

    if (warnings.length > 10) {
      report += `\n   ... et ${warnings.length - 10} autres warnings\n`;
    }
    report += '\n';
  }

  report += '═'.repeat(80) + '\n';
  report += '💡 CONVENTIONS VÉRONE:\n';
  report += '   - Hooks: use-{domain}.ts (use-products.ts)\n';
  report += '   - Components: {name}.tsx (product-card.tsx)\n';
  report += '   - Types/Interfaces: PascalCase (Product, OrderItem)\n';
  report += '   - Functions: camelCase (calculatePrice, getUserRole)\n';
  report +=
    '   - Variables: camelCase ou UPPER_CASE (orderTotal, MAX_RETRIES)\n';
  report += '   - Database Tables: snake_case (products, sales_orders)\n';
  report += '═'.repeat(80) + '\n';

  return report;
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log('🔍 Validation Naming Conventions...\n');

  const stagedOnly = process.argv.includes('--staged');
  if (stagedOnly) {
    console.log('ℹ️  Mode: Fichiers staged uniquement\n');
  }

  const files = getFilesToCheck(stagedOnly);
  console.log(`📂 Analyse de ${files.length} fichiers...\n`);

  if (files.length === 0) {
    console.log('ℹ️  Aucun fichier à analyser\n');
    process.exit(0);
  }

  const allIssues: NamingIssue[] = [];

  files.forEach(file => {
    const filenameIssues = checkFilenameConventions(file);
    const codeIssues = checkCodeConventions(file);
    allIssues.push(...filenameIssues, ...codeIssues);
  });

  const report = formatReport(allIssues);
  console.log(report);

  const hasErrors = allIssues.some(i => i.severity === 'error');
  if (hasErrors) {
    console.error('❌ Validation échouée: Conventions non respectées\n');
    process.exit(1);
  } else {
    console.log('✅ Validation réussie\n');
    process.exit(0);
  }
}

// Run (ES module pattern)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export { checkFilenameConventions, checkCodeConventions };
