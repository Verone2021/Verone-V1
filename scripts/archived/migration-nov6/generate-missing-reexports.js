#!/usr/bin/env node

/**
 * Script automatique de génération des re-exports manquants
 *
 * Après migration monorepo, ce script :
 * 1. Scanne tous les imports @/components/business/* et @/hooks/*
 * 2. Vérifie si les fichiers re-export existent
 * 3. Trouve les fichiers source dans src/shared/modules/
 * 4. Génère les re-exports manquants automatiquement
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(PROJECT_ROOT, 'src/app');
const SHARED_MODULES_DIR = path.join(PROJECT_ROOT, 'src/shared/modules');
const COMPONENTS_BUSINESS_DIR = path.join(
  PROJECT_ROOT,
  'src/components/business'
);
const HOOKS_DIR = path.join(PROJECT_ROOT, 'src/hooks');

// Patterns à rechercher
const IMPORT_PATTERNS = [
  /@\/components\/business\/([a-z0-9-]+)/g,
  /@\/hooks\/([a-z0-9-]+)/g,
];

console.log('🔍 Scanning imports dans src/app/**/*.{ts,tsx}...\n');

// 1. Scanner tous les imports
const allImports = new Set();

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (file.match(/\.(ts|tsx)$/)) {
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Extract @/components/business/* imports
      const businessMatches = [
        ...content.matchAll(/@\/components\/business\/([a-z0-9-]+)/g),
      ];
      businessMatches.forEach(match => {
        allImports.add({ type: 'component', name: match[1] });
      });

      // Extract @/hooks/* imports
      const hooksMatches = [...content.matchAll(/@\/hooks\/(use-[a-z0-9-]+)/g)];
      hooksMatches.forEach(match => {
        allImports.add({ type: 'hook', name: match[1] });
      });
    }
  }
}

scanDirectory(APP_DIR);

console.log(`✅ Trouvé ${allImports.size} imports uniques\n`);

// 2. Vérifier quels re-exports existent déjà
const missingReexports = [];

for (const imp of allImports) {
  const targetPath =
    imp.type === 'component'
      ? path.join(COMPONENTS_BUSINESS_DIR, `${imp.name}.tsx`)
      : path.join(HOOKS_DIR, `${imp.name}.ts`);

  if (!fs.existsSync(targetPath)) {
    missingReexports.push(imp);
  }
}

console.log(`⚠️  ${missingReexports.length} re-exports manquants\n`);

if (missingReexports.length === 0) {
  console.log('✅ Tous les re-exports existent déjà !');
  process.exit(0);
}

// 3. Trouver les fichiers source dans src/shared/modules/
function findSourceFile(name) {
  // Convertir kebab-case en PascalCase pour la recherche
  const pascalName = name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  try {
    // Chercher fichiers .tsx
    const tsxResults = execSync(
      `find "${SHARED_MODULES_DIR}" -type f -name "${pascalName}.tsx"`,
      { encoding: 'utf-8' }
    )
      .trim()
      .split('\n')
      .filter(Boolean);

    if (tsxResults.length > 0) {
      return tsxResults[0];
    }

    // Chercher fichiers .ts
    const tsResults = execSync(
      `find "${SHARED_MODULES_DIR}" -type f -name "${pascalName}.ts"`,
      { encoding: 'utf-8' }
    )
      .trim()
      .split('\n')
      .filter(Boolean);

    if (tsResults.length > 0) {
      return tsResults[0];
    }

    // Fallback: chercher avec le nom exact
    const exactResults = execSync(
      `find "${SHARED_MODULES_DIR}" -type f \\( -name "${name}.tsx" -o -name "${name}.ts" \\)`,
      { encoding: 'utf-8' }
    )
      .trim()
      .split('\n')
      .filter(Boolean);

    if (exactResults.length > 0) {
      return exactResults[0];
    }

    return null;
  } catch (error) {
    return null;
  }
}

// 4. Générer les re-exports
const generated = [];
const notFound = [];

console.log('📝 Génération des re-exports...\n');

for (const imp of missingReexports) {
  const sourceFile = findSourceFile(imp.name);

  if (!sourceFile) {
    notFound.push(imp);
    console.log(`❌ Source non trouvée: ${imp.name}`);
    continue;
  }

  // Extraire le chemin relatif depuis src/
  const relativePath = sourceFile.replace(PROJECT_ROOT + '/src/', '');
  const importPath = '@/' + relativePath.replace(/\.(tsx?|jsx?)$/, '');

  // Déterminer le nom du symbole exporté (PascalCase)
  const symbolName = imp.name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  // Générer le contenu du re-export
  let reexportContent;

  if (imp.type === 'hook') {
    // Pour les hooks, exporter tout avec export *
    reexportContent = `// Re-export from shared modules for backward compatibility
export * from '${importPath}'
`;
  } else {
    // Pour les composants, exporter le symbole nommé
    reexportContent = `// Re-export from shared modules for backward compatibility
export { ${symbolName} } from '${importPath}'
`;
  }

  // Écrire le fichier
  const targetPath =
    imp.type === 'component'
      ? path.join(COMPONENTS_BUSINESS_DIR, `${imp.name}.tsx`)
      : path.join(HOOKS_DIR, `${imp.name}.ts`);

  fs.writeFileSync(targetPath, reexportContent, 'utf-8');

  generated.push({ ...imp, targetPath, importPath });
  console.log(`✅ ${imp.name} → ${importPath}`);
}

console.log('\n' + '='.repeat(60));
console.log(`\n📊 RÉSUMÉ:\n`);
console.log(`✅ ${generated.length} re-exports créés`);
console.log(`❌ ${notFound.length} sources non trouvées\n`);

if (generated.length > 0) {
  console.log('📁 Fichiers créés:');
  generated.forEach(g => {
    console.log(
      `   - ${g.type === 'component' ? 'src/components/business/' : 'src/hooks/'}${g.name}.${g.type === 'component' ? 'tsx' : 'ts'}`
    );
  });
}

if (notFound.length > 0) {
  console.log('\n⚠️  Sources non trouvées (vérification manuelle requise):');
  notFound.forEach(nf => {
    console.log(`   - ${nf.name} (${nf.type})`);
  });
}

console.log('\n✨ Script terminé !');
console.log(
  '💡 Redémarrer le serveur Next.js pour appliquer les changements.\n'
);
