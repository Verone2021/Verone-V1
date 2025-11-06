#!/usr/bin/env node

/**
 * Script de correction des imports relatifs dans les modules
 * Convertit les imports relatifs vers imports absolus
 */

const fs = require('fs');
const path = require('path');

// Patterns à corriger
const RELATIVE_IMPORT_FIXES = [
  {
    pattern: /from ['"]\.\.\/\.\.\/hooks\/use-([^'"]+)['"]/g,
    replacement: (match, hookName) => {
      // Mapper le hook vers son module
      const moduleMap = {
        'smart-suggestions': 'common',
        'inline-edit': 'common',
        'toast': 'common',
        'supabase-query': 'common',
        'simple-image-upload': 'common',
        'user-activity-tracker': 'notifications',
        'pricing': 'finance',
        'sourcing-products': 'products',
      };

      const moduleName = moduleMap[hookName] || 'common';
      return `from '@/shared/modules/${moduleName}/hooks'`;
    }
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/lib\/utils['"]/g,
    replacement: `from '@/lib/utils'`
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/lib\/supabase\/client['"]/g,
    replacement: `from '@/lib/supabase/client'`
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/types\/collections['"]/g,
    replacement: `from '@/types/collections'`
  }
];

function findAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
        findAllFiles(filePath, fileList);
      }
    } else if (file.match(/\.(ts|tsx)$/)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  RELATIVE_IMPORT_FIXES.forEach(({ pattern, replacement }) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${filePath}`);
    return 1;
  }

  return 0;
}

function main() {
  console.log('🔧 Correction imports relatifs dans modules\n');

  const modulesDir = path.join(__dirname, '..', 'src', 'shared', 'modules');
  const files = findAllFiles(modulesDir);

  console.log(`📂 ${files.length} fichiers trouvés\n`);

  let filesModified = 0;
  files.forEach((file) => {
    filesModified += fixImportsInFile(file);
  });

  console.log(`\n✅ ${filesModified} fichiers modifiés`);
}

main();
