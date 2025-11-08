#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fix ButtonV2 Import Path Script');
console.log('=====================================\n');

// Étape 1 : Trouver tous les fichiers avec le mauvais import ButtonV2
console.log(
  '📂 Recherche des fichiers avec import ButtonV2 depuis ui/button...\n'
);

let files = [];
try {
  const result = execSync(
    `grep -r "import.*ButtonV2.*from '@/components/ui/button'" src/ --include="*.tsx" --include="*.ts" -l`,
    { encoding: 'utf-8' }
  );
  files = result.trim().split('\n').filter(Boolean);
} catch (error) {
  if (error.status === 1) {
    console.log('✅ Aucun fichier trouvé avec le mauvais import path');
    process.exit(0);
  }
  throw error;
}

console.log(`📊 ${files.length} fichiers trouvés\n`);

let modifiedCount = 0;
let errorCount = 0;

// Étape 2 : Corriger chaque fichier
files.forEach((filePath, index) => {
  try {
    console.log(`[${index + 1}/${files.length}] ${filePath}`);

    const content = fs.readFileSync(filePath, 'utf-8');

    // Remplacer le path d'import
    const newContent = content.replace(
      /import\s+\{\s*ButtonV2\s*\}\s+from\s+['"]@\/components\/ui\/button['"]/g,
      "import { ButtonV2 } from '@/components/ui-v2/button'"
    );

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log(`  ✅ Modifié\n`);
      modifiedCount++;
    } else {
      console.log(`  ⚠️ Aucune modification nécessaire\n`);
    }
  } catch (error) {
    console.error(`  ❌ Erreur: ${error.message}\n`);
    errorCount++;
  }
});

// Résumé
console.log('\n📊 RÉSUMÉ');
console.log('==========');
console.log(`✅ Fichiers modifiés : ${modifiedCount}/${files.length}`);
if (errorCount > 0) {
  console.log(`❌ Erreurs : ${errorCount}`);
}
console.log('\n🎯 Prochaine étape : npm run type-check');
