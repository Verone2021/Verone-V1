#!/usr/bin/env node
/**
 * Script Auto-Fix Structure Repository Vérone
 * Corrige automatiquement les violations courantes de structure
 *
 * Usage: node scripts/auto-fix-structure.js
 */

const fs = require('fs');
const path = require('path');

class StructureAutoFixer {
  constructor() {
    this.fixes = [];
  }

  log(message, type = 'info') {
    const prefix = {
      error: '❌',
      warning: '⚠️',
      success: '✅',
      info: 'ℹ️',
      fix: '🔧',
    }[type];

    console.log(`${prefix} ${message}`);
  }

  addFix(description) {
    this.fixes.push(description);
    this.log(description, 'fix');
  }

  // Créer la structure de dossiers si manquante
  ensureDirectoryStructure() {
    this.log('🔧 Vérification et création de la structure des dossiers...');

    const requiredDirs = [
      'tests/debug/rls-policies',
      'tests/debug/storage',
      'tests/debug/forms',
      'tests/fixtures/csv',
      'tests/fixtures/images',
      'tests/fixtures/sql',
      'tests/screenshots/auth',
      'tests/screenshots/catalogue',
      'tests/screenshots/families',
      'tests/screenshots/dashboard',
      'docs/deployment',
      'docs/development',
      'docs/troubleshooting',
      'docs/api',
    ];

    requiredDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.addFix(`Créé dossier manquant: ${dir}`);
      }
    });
  }

  // Déplacer fichiers mal placés
  moveFiles() {
    this.log('🔧 Déplacement des fichiers mal placés...');

    // Scripts debug à la racine
    const debugPatterns = ['test-*.js', 'debug-*.js', 'fix-*.js', 'apply-*.js'];
    const rootFiles = fs
      .readdirSync('.')
      .filter(file => fs.statSync(file).isFile());

    rootFiles.forEach(file => {
      // Scripts debug/test
      if (file.match(/^(test|debug|fix|apply)-.*\.js$/)) {
        let targetDir = 'tests/debug/';

        // Déterminer sous-dossier approprié
        if (file.includes('rls') || file.includes('policies')) {
          targetDir += 'rls-policies/';
        } else if (
          file.includes('storage') ||
          file.includes('upload') ||
          file.includes('image')
        ) {
          targetDir += 'storage/';
        } else if (file.includes('form') || file.includes('family')) {
          targetDir += 'forms/';
        }

        if (!fs.existsSync(path.join(targetDir, file))) {
          fs.renameSync(file, path.join(targetDir, file));
          this.addFix(`Déplacé ${file} → ${targetDir}`);
        }
      }

      // Assets test
      if (file.match(/\.(png|jpg|jpeg|csv)$/) && !file.startsWith('.')) {
        let targetDir = 'tests/fixtures/';
        if (file.match(/\.(png|jpg|jpeg)$/)) {
          targetDir += 'images/';
        } else if (file.endsWith('.csv')) {
          targetDir += 'csv/';
        }

        if (!fs.existsSync(path.join(targetDir, file))) {
          fs.renameSync(file, path.join(targetDir, file));
          this.addFix(`Déplacé ${file} → ${targetDir}`);
        }
      }

      // Migrations SQL (sauf scripts admin autorisés)
      const allowedSqlInRoot = [
        'apply-all-migrations.sql',
        'apply-migrations.sql',
        'create-owner-user.sql',
      ];

      if (file.endsWith('.sql') && !allowedSqlInRoot.includes(file)) {
        const targetPath = `supabase/migrations/${file}`;
        if (!fs.existsSync(targetPath)) {
          fs.renameSync(file, targetPath);
          this.addFix(`Déplacé ${file} → supabase/migrations/`);
        }
      }
    });
  }

  // Créer README manquants
  createMissingReadmes() {
    this.log('🔧 Création des README manquants...');

    const readmes = {
      'tests/debug/rls-policies/README.md': `# Scripts Debug RLS Policies

Scripts pour tester et déboguer les politiques Row-Level Security (RLS) de Supabase.

## Fichiers
- \`test-*\` - Scripts de validation RLS
- \`debug-*\` - Outils de debugging
- \`fix-*\` - Scripts de correction temporaire
- \`apply-*\` - Scripts d'application RLS

## Usage
\`\`\`bash
node test-storage-rls-validation.js
\`\`\``,

      'tests/debug/storage/README.md': `# Scripts Debug Storage

Scripts pour tester le système de stockage et upload d'images.

## Fichiers
- Tests d'upload vers Supabase Storage
- Validation des politiques de stockage
- Debug des problèmes d'upload

## Usage
\`\`\`bash
node test-upload-simple.js
\`\`\``,

      'tests/debug/forms/README.md': `# Scripts Debug Forms

Scripts pour tester les formulaires et composants UI.

## Fichiers
- Tests des formulaires de création
- Validation des interactions utilisateur
- Debug des problèmes de soumission

## Usage
\`\`\`bash
node test-family-form-final.js
\`\`\``,
    };

    Object.entries(readmes).forEach(([filePath, content]) => {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content);
        this.addFix(`Créé README: ${filePath}`);
      }
    });
  }

  // Ajouter script de validation au package.json
  updatePackageJson() {
    const packagePath = 'package.json';
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      if (!pkg.scripts['validate:structure']) {
        pkg.scripts['validate:structure'] =
          'node scripts/validate-repository-structure.js';
        pkg.scripts['fix:structure'] = 'node scripts/auto-fix-structure.js';

        fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
        this.addFix(
          'Ajouté scripts validate:structure et fix:structure au package.json'
        );
      }
    }
  }

  // Méthode principale
  autoFix() {
    console.log('🚀 Auto-Fix Structure Repository Vérone\n');

    this.ensureDirectoryStructure();
    this.moveFiles();
    this.createMissingReadmes();
    this.updatePackageJson();

    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ AUTO-FIX');
    console.log('='.repeat(60));

    if (this.fixes.length === 0) {
      this.log(
        'Aucune correction nécessaire - Structure déjà conforme!',
        'success'
      );
    } else {
      this.log(`${this.fixes.length} correction(s) appliquée(s)`, 'success');
    }

    console.log('\n🎯 PROCHAINES ÉTAPES:');
    console.log('1. Exécuter: npm run validate:structure');
    console.log(
      '2. Commit des changements: git add . && git commit -m "fix: repository structure"'
    );
    console.log('3. Vérifier que tout fonctionne: npm run dev');

    console.log('\n📚 Référence: Section "RÈGLES STRICTES" dans CLAUDE.md');
    console.log('='.repeat(60));

    return this.fixes.length;
  }
}

// Exécution si script appelé directement
if (require.main === module) {
  const fixer = new StructureAutoFixer();
  fixer.autoFix();
}

module.exports = StructureAutoFixer;
