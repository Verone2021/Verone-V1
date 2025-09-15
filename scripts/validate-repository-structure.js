#!/usr/bin/env node
/**
 * Script de Validation Structure Repository Vérone
 * Vérifie la conformité aux règles strictes définies dans CLAUDE.md
 *
 * Usage: node scripts/validate-repository-structure.js
 */

const fs = require('fs');
const path = require('path');

// Configuration des règles selon CLAUDE.md
const RULES = {
  // Fichiers autorisés à la racine
  allowedAtRoot: [
    'CLAUDE.md',
    'package.json', 'package-lock.json',
    'tsconfig.json',
    'next.config.js', 'tailwind.config.js', 'playwright.config.ts', 'postcss.config.js',
    '.env', '.env.local', '.env.example', '.env.production', '.env.development',
    '.gitignore', '.eslintrc.json', '.prettierrc',
    'README.md', 'vercel.json',
    'next-env.d.ts', // Généré automatiquement par Next.js
    // Extensions workspace
    'verone-back-office.code-workspace'
  ],

  // Extensions interdites à la racine
  forbiddenAtRoot: ['.js', '.ts', '.sql', '.png', '.jpg', '.csv', '.webm', '.mp4'],

  // Dossiers obligatoires
  requiredDirs: [
    'src',
    'supabase/migrations',
    'scripts',
    'tests/e2e',
    'tests/debug',
    'tests/fixtures',
    'tests/screenshots',
    'docs',
    'manifests',
    '.claude'
  ]
};

class RepositoryValidator {
  constructor() {
    this.violations = [];
    this.warnings = [];
  }

  log(message, type = 'info') {
    const prefix = {
      'error': '❌',
      'warning': '⚠️',
      'success': '✅',
      'info': 'ℹ️'
    }[type];

    console.log(`${prefix} ${message}`);
  }

  addViolation(message) {
    this.violations.push(message);
    this.log(message, 'error');
  }

  addWarning(message) {
    this.warnings.push(message);
    this.log(message, 'warning');
  }

  // Vérifier les fichiers à la racine
  validateRootFiles() {
    this.log('🔍 Validation des fichiers à la racine...');

    const rootFiles = fs.readdirSync('.')
      .filter(file => fs.statSync(file).isFile())
      .filter(file => !file.startsWith('.'));

    // Vérifier fichiers interdits par extension
    rootFiles.forEach(file => {
      const ext = path.extname(file);

      if (RULES.forbiddenAtRoot.includes(ext) && !RULES.allowedAtRoot.includes(file)) {
        this.addViolation(`Fichier interdit à la racine: ${file} (extension ${ext})`);
      }
    });

    // Vérifier patterns spécifiques
    const problematicPatterns = [
      /^test-.*\.(js|ts)$/,
      /^debug-.*\.(js|ts)$/,
      /^fix-.*\.(js|ts)$/,
      /^apply-.*\.(js|ts)$/,
      /.*\.sql$/,
      /.*\.(png|jpg|jpeg|csv)$/
    ];

    rootFiles.forEach(file => {
      for (const pattern of problematicPatterns) {
        if (pattern.test(file) && !RULES.allowedAtRoot.includes(file)) {
          this.addViolation(`Pattern interdit à la racine: ${file}`);

          // Suggérer emplacement correct
          if (file.includes('test-') || file.includes('debug-') || file.includes('fix-')) {
            this.log(`  → Déplacer vers: tests/debug/`, 'info');
          } else if (file.endsWith('.sql')) {
            this.log(`  → Déplacer vers: supabase/migrations/`, 'info');
          } else if (file.match(/\.(png|jpg|csv)$/)) {
            this.log(`  → Déplacer vers: tests/fixtures/`, 'info');
          }
        }
      }
    });
  }

  // Vérifier structure des dossiers
  validateDirectoryStructure() {
    this.log('🔍 Validation de la structure des dossiers...');

    RULES.requiredDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        this.addViolation(`Dossier obligatoire manquant: ${dir}`);
      } else {
        this.log(`Dossier requis présent: ${dir}`, 'success');
      }
    });
  }

  // Vérifier migrations Supabase
  validateMigrations() {
    this.log('🔍 Validation des migrations Supabase...');

    // Chercher fichiers .sql hors du bon dossier
    const findSqlFiles = (dir, relativePath = '') => {
      const files = [];
      if (!fs.existsSync(dir)) return files;

      fs.readdirSync(dir).forEach(item => {
        const fullPath = path.join(dir, item);
        const relPath = path.join(relativePath, item);

        if (fs.statSync(fullPath).isDirectory()) {
          files.push(...findSqlFiles(fullPath, relPath));
        } else if (item.endsWith('.sql')) {
          files.push(relPath);
        }
      });

      return files;
    };

    // Scripts SQL autorisés dans scripts/ (administration et setup)
    const allowedInScripts = [
      'scripts/apply-all-migrations.sql',    // Script consolidé
      'scripts/apply-migrations.sql',        // Script d'application
      'scripts/create-owner-user.sql'        // Setup utilisateur initial
    ];

    const allSqlFiles = findSqlFiles('.');
    const badPlacedSql = allSqlFiles.filter(file =>
      !file.startsWith('supabase/migrations') &&
      !file.startsWith('tests/') &&
      !allowedInScripts.includes(file)
    );

    if (badPlacedSql.length > 0) {
      badPlacedSql.forEach(file => {
        this.addViolation(`Migration SQL mal placée: ${file}`);
        this.log(`  → Déplacer vers: supabase/migrations/`, 'info');
      });
    } else {
      this.log('Migrations SQL correctement placées', 'success');
    }
  }

  // Vérifier conventions de nommage
  validateNamingConventions() {
    this.log('🔍 Validation des conventions de nommage...');

    // Vérifier tests/debug/
    if (fs.existsSync('tests/debug')) {
      const debugFiles = fs.readdirSync('tests/debug', { recursive: true });
      debugFiles.forEach(file => {
        if (file.endsWith('.js') || file.endsWith('.ts')) {
          if (!file.match(/^[a-z0-9\-]+\.(js|ts)$/)) {
            this.addWarning(`Nommage non-conforme dans tests/debug/: ${file} (utiliser kebab-case)`);
          }
        }
      });
    }
  }

  // Générer rapport
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RAPPORT DE VALIDATION REPOSITORY');
    console.log('='.repeat(60));

    if (this.violations.length === 0) {
      this.log('Repository conforme aux standards professionnels 2024! 🎉', 'success');
    } else {
      this.log(`${this.violations.length} violation(s) détectée(s)`, 'error');
      console.log('\n🚨 VIOLATIONS À CORRIGER:');
      this.violations.forEach((violation, i) => {
        console.log(`${i + 1}. ${violation}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️ ${this.warnings.length} avertissement(s):`);
      this.warnings.forEach((warning, i) => {
        console.log(`${i + 1}. ${warning}`);
      });
    }

    console.log('\n📚 Référence: Section "RÈGLES STRICTES" dans CLAUDE.md');
    console.log('='.repeat(60));

    return this.violations.length === 0;
  }

  // Auto-fix suggestions
  suggestFixes() {
    if (this.violations.length === 0) return;

    console.log('\n🛠️ COMMANDES AUTO-FIX SUGGÉRÉES:');
    console.log('mkdir -p tests/debug tests/fixtures tests/screenshots');
    console.log('mv test-*.js debug-*.js fix-*.js tests/debug/ 2>/dev/null');
    console.log('mv *.png *.jpg *.csv tests/fixtures/ 2>/dev/null');
    console.log('mv *.sql supabase/migrations/ 2>/dev/null');
    console.log('\n⚠️ Vérifier manuellement avant exécution!');
  }

  // Méthode principale
  validate() {
    console.log('🚀 Validation Structure Repository Vérone\n');

    this.validateRootFiles();
    this.validateDirectoryStructure();
    this.validateMigrations();
    this.validateNamingConventions();

    const isValid = this.generateReport();

    if (!isValid) {
      this.suggestFixes();
      process.exit(1);
    }

    return isValid;
  }
}

// Exécution si script appelé directement
if (require.main === module) {
  const validator = new RepositoryValidator();
  validator.validate();
}

module.exports = RepositoryValidator;