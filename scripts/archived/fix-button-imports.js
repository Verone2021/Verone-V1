#!/usr/bin/env node
/**
 * Script: fix-button-imports.js
 *
 * Remplace automatiquement les imports Button depuis ui/ par ButtonV2 depuis ui-v2/
 * et met à jour toutes les références dans le code.
 *
 * USAGE:
 *   node scripts/fix-button-imports.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

console.log(`\n${colors.blue}🔧 Script Fix Button → ButtonV2${colors.reset}\n`);

// Étape 1 : Récupérer tous les fichiers qui importent Button depuis ui/
console.log(`${colors.yellow}📂 Recherche des fichiers avec import Button...${colors.reset}`);

let files = [];
try {
  const output = execSync(
    'grep -rl "import.*Button.*from.*@/components/ui/button" src/',
    { encoding: 'utf-8' }
  );
  files = output.trim().split('\n').filter(Boolean);
} catch (error) {
  console.log(`${colors.red}❌ Erreur lors de la recherche des fichiers${colors.reset}`);
  process.exit(1);
}

console.log(`${colors.green}✅ ${files.length} fichiers trouvés${colors.reset}\n`);

// Étape 2 : Traiter chaque fichier
let successCount = 0;
let errorCount = 0;
const errors = [];

files.forEach((filePath, index) => {
  try {
    console.log(`${colors.blue}[${index + 1}/${files.length}]${colors.reset} ${filePath}`);

    // Lire le contenu du fichier
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // Remplacement 1 : Import simple
    if (content.includes("import { Button } from '@/components/ui/button'")) {
      content = content.replace(
        /import \{ Button \} from '@\/components\/ui\/button'/g,
        "import { ButtonV2 } from '@/components/ui-v2/button'"
      );
      modified = true;
    }

    // Remplacement 2 : Import avec alias (rare mais possible)
    if (content.includes("import { Button as")) {
      content = content.replace(
        /import \{ Button as ([^}]+) \} from '@\/components\/ui\/button'/g,
        "import { ButtonV2 as $1 } from '@/components/ui-v2/button'"
      );
      modified = true;
    }

    // Remplacement 3 : Références dans le code (seulement si import modifié)
    if (modified) {
      // Remplacer <Button par <ButtonV2
      content = content.replace(/<Button(\s|>)/g, '<ButtonV2$1');

      // Remplacer </Button> par </ButtonV2>
      content = content.replace(/<\/Button>/g, '</ButtonV2>');

      // Sauvegarder le fichier
      fs.writeFileSync(filePath, content, 'utf-8');

      console.log(`  ${colors.green}✅ Modifié${colors.reset}`);
      successCount++;
    } else {
      console.log(`  ${colors.yellow}⚠️  Aucune modification nécessaire${colors.reset}`);
    }

  } catch (error) {
    console.log(`  ${colors.red}❌ Erreur: ${error.message}${colors.reset}`);
    errors.push({ file: filePath, error: error.message });
    errorCount++;
  }
});

// Étape 3 : Rapport final
console.log(`\n${'='.repeat(60)}`);
console.log(`${colors.blue}📊 RAPPORT FINAL${colors.reset}`);
console.log(`${'='.repeat(60)}\n`);
console.log(`${colors.green}✅ Fichiers modifiés : ${successCount}${colors.reset}`);
console.log(`${colors.yellow}⚠️  Fichiers non modifiés : ${files.length - successCount - errorCount}${colors.reset}`);
console.log(`${colors.red}❌ Erreurs : ${errorCount}${colors.reset}\n`);

if (errors.length > 0) {
  console.log(`${colors.red}Détails des erreurs :${colors.reset}`);
  errors.forEach(({ file, error }) => {
    console.log(`  - ${file}: ${error}`);
  });
  console.log('');
}

console.log(`${colors.blue}💡 Prochaine étape :${colors.reset}`);
console.log(`   npm run type-check\n`);

process.exit(errorCount > 0 ? 1 : 0);
