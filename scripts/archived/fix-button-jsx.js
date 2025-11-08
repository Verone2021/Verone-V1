#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fix Button JSX Tags Script');
console.log('===============================\n');

// Étape 1 : Trouver tous les fichiers qui importent ButtonV2
console.log('📂 Recherche des fichiers avec import ButtonV2...\n');

let files = [];
try {
  const result = execSync(
    `grep -r "import.*ButtonV2" src/ --include="*.tsx" -l`,
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
let errorCount = 0;
let skippedCount = 0;

// Étape 2 : Corriger chaque fichier
files.forEach((filePath, index) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Vérifier si le fichier a des tags <Button
    if (!content.includes('<Button') && !content.includes('</Button>')) {
      skippedCount++;
      return;
    }

    console.log(`[${index + 1}/${files.length}] ${filePath}`);

    // Remplacer les tags JSX
    let newContent = content;

    // Remplacer <Button (avec espace ou > après)
    newContent = newContent.replace(/<Button(\s|>|\/)/g, '<ButtonV2$1');

    // Remplacer </Button>
    newContent = newContent.replace(/<\/Button>/g, '</ButtonV2>');

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf-8');

      // Compter les remplacements
      const openTags = (content.match(/<Button(\s|>|\/)/g) || []).length;
      const closeTags = (content.match(/<\/Button>/g) || []).length;

      console.log(
        `  ✅ Modifié (${openTags} opening tags, ${closeTags} closing tags)\n`
      );
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
console.log(`⏭️  Fichiers sans tags Button : ${skippedCount}`);
if (errorCount > 0) {
  console.log(`❌ Erreurs : ${errorCount}`);
}
console.log('\n🎯 Prochaine étape : npm run type-check');
