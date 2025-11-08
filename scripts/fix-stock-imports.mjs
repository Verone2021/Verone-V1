#!/usr/bin/env node
/**
 * Script de correction batch des imports cassés dans @verone/stock
 * Corrige le pattern @verone/ui'component' → @verone/ui
 */

import { readFileSync, writeFileSync } from 'fs';
import globPkg from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const { glob } = globPkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Pattern à corriger : @verone/ui'composant' → @verone/ui
const PATTERNS = [
  {
    name: "Imports '@verone/ui' collés",
    regex: /from '@verone\/ui'[a-z-]+'/g,
    replacement: "from '@verone/ui'",
  },
  {
    name: "Imports '@verone/utils' collés",
    regex: /from '@verone\/utils'[a-z-]+'/g,
    replacement: "from '@verone/utils'",
  },
  {
    name: "Imports '@verone/types' collés",
    regex: /from '@verone\/types'[a-z-]+'/g,
    replacement: "from '@verone/types'",
  },
  {
    name: "Point-virgule mal placé '@verone/ui';",
    regex: /from '@verone\/ui'; \/\//g,
    replacement: "from '@verone/ui' //",
  },
  {
    name: "Imports relatifs '../hooks' → '../../hooks' (depuis components/)",
    regex: /from '\.\.\/hooks'/g,
    replacement: "from '../../hooks'",
  },
  {
    name: "@/shared/modules/products/hooks → @verone/products/hooks",
    regex: /from '@\/shared\/modules\/products\/hooks'/g,
    replacement: "from '@verone/products/hooks'",
  },
  {
    name: "@/shared/modules/stock → imports relatifs dans package",
    regex: /from '@\/shared\/modules\/stock\/(.*?)'/g,
    replacement: "from '../$1'",
  },
  {
    name: "createClient from @verone/utils → @/lib/supabase/client",
    regex: /import \{ createClient \} from '@verone\/utils'/g,
    replacement: "import { createClient } from '@/lib/supabase/client'",
  },
  {
    name: "@/hooks/core → @verone/stock/hooks (ou relatif)",
    regex: /from '@\/hooks\/core\/(.+?)'/g,
    replacement: "from '../hooks/$1'",
  },
  {
    name: "ButtonV2 → Button (ButtonV2 non exporté)",
    regex: /import \{ ButtonV2 \}/g,
    replacement: "import { Button }",
  },
  {
    name: "ButtonV2 usage → Button",
    regex: /<ButtonV2\b/g,
    replacement: "<Button",
  },
  {
    name: "ButtonV2 closing tag → Button",
    regex: /<\/ButtonV2>/g,
    replacement: "</Button>",
  },
  {
    name: "ButtonV2Props → ButtonProps",
    regex: /ButtonV2Props/g,
    replacement: "ButtonProps",
  },
];

async function main() {
  console.log('🔍 Scanning packages/@verone/stock/src/**/*.{ts,tsx}...\n');

  const pattern = path.join(rootDir, 'packages/@verone/stock/src/**/*.{ts,tsx}');
  const files = await new Promise((resolve, reject) => {
    glob(pattern, (err, matches) => {
      if (err) reject(err);
      else resolve(matches);
    });
  });

  console.log(`📁 Found ${files.length} files to process\n`);

  let totalReplacements = 0;
  let filesModified = 0;

  for (const file of files) {
    const relativePath = path.relative(rootDir, file);
    let content = readFileSync(file, 'utf-8');
    let modified = false;
    let fileReplacements = 0;

    for (const pattern of PATTERNS) {
      const matches = content.match(pattern.regex);
      if (matches && matches.length > 0) {
        content = content.replace(pattern.regex, pattern.replacement);
        modified = true;
        fileReplacements += matches.length;
        console.log(
          `  ✅ ${pattern.name}: ${matches.length} replacement(s) in ${relativePath}`
        );
      }
    }

    if (modified) {
      writeFileSync(file, content, 'utf-8');
      filesModified++;
      totalReplacements += fileReplacements;
    }
  }

  console.log(`\n✅ Completed!`);
  console.log(`   Files modified: ${filesModified}/${files.length}`);
  console.log(`   Total replacements: ${totalReplacements}`);
  console.log(`\n🔧 Next step: cd packages/@verone/stock && npm run type-check\n`);
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
