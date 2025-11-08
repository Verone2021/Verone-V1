#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔄 Revert ButtonV2 Import Path Script');
console.log('========================================\n');

// Trouver tous les fichiers avec le mauvais import (ui-v2)
console.log(
  '📂 Recherche des fichiers avec import ButtonV2 depuis ui-v2/button...\n'
);

let files = [];
try {
  const result = execSync(
    `grep -r "import.*ButtonV2.*from '@/components/ui-v2/button'" src/ --include="*.tsx" --include="*.ts" -l`,
    { encoding: 'utf-8' }
  );
  files = result.trim().split('\n').filter(Boolean);
} catch (error) {
  if (error.status === 1) {
    console.log('✅ Aucun fichier trouvé');
    process.exit(0);
  }
  throw error;
}

console.log(`📊 ${files.length} fichiers trouvés\n`);

let modifiedCount = 0;

// Corriger chaque fichier
files.forEach((filePath, index) => {
  try {
    console.log(`[${index + 1}/${files.length}] ${filePath}`);

    const content = fs.readFileSync(filePath, 'utf-8');

    // Remettre le bon path
    const newContent = content.replace(
      /import\s+\{\s*ButtonV2\s*\}\s+from\s+['"]@\/components\/ui-v2\/button['"]/g,
      "import { ButtonV2 } from '@/components/ui/button'"
    );

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log(`  ✅ Restauré\n`);
      modifiedCount++;
    }
  } catch (error) {
    console.error(`  ❌ Erreur: ${error.message}\n`);
  }
});

console.log('\n📊 RÉSUMÉ');
console.log('==========');
console.log(`✅ Fichiers restaurés : ${modifiedCount}/${files.length}`);
console.log('\n🎯 Prochaine étape : npm run type-check');
