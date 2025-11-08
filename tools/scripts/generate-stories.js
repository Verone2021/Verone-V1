#!/usr/bin/env node

/**
 * 🤖 Script Auto-Génération Stories Storybook
 *
 * Génère automatiquement des stories Storybook pour tous les composants TSX
 * manquants dans src/stories/
 *
 * Usage:
 *   node tools/scripts/generate-stories.js [--dry-run] [--component=ComponentName]
 *
 * Options:
 *   --dry-run         Affiche les fichiers qui seraient créés sans les créer
 *   --component=Name  Génère story pour un seul composant spécifique
 *   --force           Force la régénération même si story existe déjà
 *
 * Exemples:
 *   node tools/scripts/generate-stories.js --dry-run
 *   node tools/scripts/generate-stories.js --component=ProductCard
 *   node tools/scripts/generate-stories.js --force
 */

const fs = require('fs');
const path = require('path');

// ==================== CONFIGURATION ====================

const CONFIG = {
  componentsDir: 'src/components',
  storiesDir: 'src/stories',
  templatesDir: 'src/stories/_templates',

  // Catégories de composants
  categories: {
    ui: { title: '1-UI-Base', template: 'variants-story.template.tsx' },
    business: { title: '2-Business', template: 'business-story.template.tsx' },
    forms: { title: '3-Forms', template: 'business-story.template.tsx' },
    layout: { title: '4-Layout', template: 'basic-story.template.tsx' },
    admin: { title: '5-Admin', template: 'business-story.template.tsx' },
  },

  // Exclusions (ne pas générer de stories)
  exclude: [
    'ui/button.tsx', // Déjà créé manuellement
    'ui/card.tsx',
    'ui/verone-card.tsx',
    'ui/badge.tsx',
    'ui/input.tsx',
    // Templates et providers
    'testing/',
    'providers/',
    // Fichiers spéciaux
    'index.tsx',
    'types.ts',
  ],
};

// ==================== UTILITAIRES ====================

/**
 * Parse les arguments CLI
 */
function parseArgs() {
  const args = {
    dryRun: process.argv.includes('--dry-run'),
    force: process.argv.includes('--force'),
    component: null,
  };

  const componentArg = process.argv.find(arg => arg.startsWith('--component='));
  if (componentArg) {
    args.component = componentArg.split('=')[1];
  }

  return args;
}

/**
 * Trouve tous les fichiers TSX récursivement
 */
function findTsxFiles(dir, baseDir = dir) {
  let results = [];

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Récursion dans sous-dossiers
      results = results.concat(findTsxFiles(fullPath, baseDir));
    } else if (file.endsWith('.tsx') && !file.endsWith('.stories.tsx')) {
      // Fichier TSX (pas story)
      const relativePath = path.relative(baseDir, fullPath);
      results.push(relativePath);
    }
  }

  return results;
}

/**
 * Détermine la catégorie d'un composant
 */
function getComponentCategory(componentPath) {
  if (componentPath.startsWith('ui/')) return 'ui';
  if (componentPath.startsWith('business/')) return 'business';
  if (componentPath.startsWith('forms/')) return 'forms';
  if (componentPath.startsWith('layout/')) return 'layout';
  if (componentPath.startsWith('admin/')) return 'admin';

  // Fallback basé sur le chemin
  if (
    componentPath.includes('product') ||
    componentPath.includes('order') ||
    componentPath.includes('stock')
  ) {
    return 'business';
  }
  if (componentPath.includes('form')) {
    return 'forms';
  }

  return 'ui'; // Défaut
}

/**
 * Devrait-on exclure ce composant ?
 */
function shouldExclude(componentPath) {
  return CONFIG.exclude.some(pattern => componentPath.includes(pattern));
}

/**
 * Vérifie si la story existe déjà
 */
function storyExists(componentName, category) {
  const categoryTitle = CONFIG.categories[category].title;
  const storyPath = path.join(
    CONFIG.storiesDir,
    categoryTitle,
    `${componentName}.stories.tsx`
  );

  return fs.existsSync(storyPath);
}

/**
 * Extrait le nom du composant depuis le fichier TSX
 */
function extractComponentName(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Patterns pour trouver export function/const Component
  const patterns = [
    /export\s+function\s+([A-Z][a-zA-Z0-9]*)/,
    /export\s+const\s+([A-Z][a-zA-Z0-9]*)\s*=/,
    /export\s+default\s+function\s+([A-Z][a-zA-Z0-9]*)/,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      return match[1];
    }
  }

  // Fallback: nom du fichier
  const fileName = path.basename(filePath, '.tsx');
  return fileName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Génère le contenu de la story à partir du template
 */
function generateStoryContent(componentName, componentPath, category) {
  const categoryConfig = CONFIG.categories[category];
  const templatePath = path.join(CONFIG.templatesDir, categoryConfig.template);

  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template non trouvé: ${templatePath}`);
    return null;
  }

  let template = fs.readFileSync(templatePath, 'utf-8');

  // Remplacements
  const importPath = `@/components/${componentPath.replace('.tsx', '')}`;
  const title = `${categoryConfig.title}/${componentName}`;

  template = template
    .replace(/ComponentName/g, componentName)
    .replace(/@\/components\/path\/to\/component-name/g, importPath)
    .replace(/Category\/Subcategory\/ComponentName/g, title);

  return template;
}

/**
 * Crée le fichier story
 */
function createStoryFile(componentName, content, category, dryRun = false) {
  const categoryTitle = CONFIG.categories[category].title;
  const storyDir = path.join(CONFIG.storiesDir, categoryTitle);
  const storyPath = path.join(storyDir, `${componentName}.stories.tsx`);

  if (dryRun) {
    console.log(`[DRY-RUN] Créerait: ${storyPath}`);
    return true;
  }

  // Créer dossier si nécessaire
  if (!fs.existsSync(storyDir)) {
    fs.mkdirSync(storyDir, { recursive: true });
  }

  // Écrire fichier
  fs.writeFileSync(storyPath, content, 'utf-8');
  console.log(`✅ Créé: ${storyPath}`);

  return true;
}

// ==================== MAIN ====================

function main() {
  const args = parseArgs();

  console.log('🤖 Auto-Génération Stories Storybook\n');
  console.log(`Mode: ${args.dryRun ? 'DRY-RUN' : 'PRODUCTION'}`);
  if (args.component) {
    console.log(`Filtre: ${args.component} uniquement`);
  }
  console.log('');

  // Trouver tous les composants TSX
  const allComponents = findTsxFiles(CONFIG.componentsDir);

  console.log(`📦 ${allComponents.length} composants TSX trouvés\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const componentPath of allComponents) {
    // Filtres
    if (shouldExclude(componentPath)) {
      skipped++;
      continue;
    }

    const componentName = extractComponentName(
      path.join(CONFIG.componentsDir, componentPath)
    );

    if (args.component && componentName !== args.component) {
      skipped++;
      continue;
    }

    const category = getComponentCategory(componentPath);

    // Vérifier si story existe déjà
    if (!args.force && storyExists(componentName, category)) {
      console.log(`⏭️  Existe déjà: ${componentName} (${category})`);
      skipped++;
      continue;
    }

    // Générer story
    const content = generateStoryContent(
      componentName,
      componentPath,
      category
    );

    if (!content) {
      errors++;
      continue;
    }

    const success = createStoryFile(
      componentName,
      content,
      category,
      args.dryRun
    );

    if (success) {
      created++;
    } else {
      errors++;
    }
  }

  // Résumé
  console.log('\n📊 Résumé:');
  console.log(`✅ Créés: ${created}`);
  console.log(`⏭️  Ignorés: ${skipped}`);
  console.log(`❌ Erreurs: ${errors}`);
  console.log(`📦 Total: ${allComponents.length}`);

  if (args.dryRun) {
    console.log(
      '\n💡 Mode DRY-RUN activé. Relancez sans --dry-run pour créer les fichiers.'
    );
  }
}

// Exécution
if (require.main === module) {
  main();
}

module.exports = { main, parseArgs, findTsxFiles, extractComponentName };
