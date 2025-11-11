#!/usr/bin/env node
/**
 * 🔄 Script Migration Imports Monorepo - VAGUE 4
 * 
 * Objectif : Remplacer tous les imports @/components, @/shared, @/lib
 *            vers imports @verone/* monorepo
 * 
 * Utilisation :
 *   npm install -g jscodeshift
 *   node scripts/migrate-imports-monorepo.js --dry-run   # Preview changes
 *   node scripts/migrate-imports-monorepo.js              # Execute migration
 * 
 * Patterns migrés :
 *   - @/components/ui/* → @verone/ui
 *   - @/shared/modules/* → @verone/* (18 packages)
 *   - @/lib/utils → @verone/utils
 *   - @/lib/supabase → @verone/utils/supabase
 *   - @/lib/design-system → @verone/ui/tokens
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// ============================================================================
// CONFIGURATION
// ============================================================================

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

const TARGETS = [
  'src/app/**/*.{ts,tsx}',
  'src/components/**/*.{ts,tsx}',
  'src/hooks/**/*.{ts,tsx}',
];

// ============================================================================
// MAPPING TABLE
// ============================================================================

const IMPORT_MAPPINGS = {
  // UI Components (consolidation multiple imports)
  "@/components/ui": "@verone/ui",
  
  // Business Modules (18 packages)
  "@/shared/modules/admin": "@verone/admin",
  "@/shared/modules/categories": "@verone/categories",
  "@/shared/modules/channels": "@verone/channels",
  "@/shared/modules/collections": "@verone/collections",
  "@/shared/modules/common": "@verone/common",
  "@/shared/modules/consultations": "@verone/consultations",
  "@/shared/modules/customers": "@verone/customers",
  "@/shared/modules/dashboard": "@verone/dashboard",
  "@/shared/modules/finance": "@verone/finance",
  "@/shared/modules/logistics": "@verone/logistics",
  "@/shared/modules/notifications": "@verone/notifications",
  "@/shared/modules/orders": "@verone/orders",
  "@/shared/modules/organisations": "@verone/organisations",
  "@/shared/modules/products": "@verone/products",
  "@/shared/modules/stock": "@verone/stock",
  "@/shared/modules/suppliers": "@verone/suppliers",
  "@/shared/modules/testing": "@verone/testing",
  "@/shared/modules/ui": "@verone/ui-business",
  
  // Lib Utils
  "@/lib/utils": "@verone/utils",
  "@/lib/supabase": "@verone/utils/supabase",
  "@/lib/design-system": "@verone/ui/tokens",
  "@/lib/analytics": "@verone/utils/analytics",
  "@/lib/monitoring": "@verone/utils/monitoring",
  "@/lib/upload": "@verone/utils/upload",
  "@/lib/validation": "@verone/utils/validation",
  
  // Integrations (après VAGUE 3)
  "@/lib/abby": "@verone/integrations/abby",
  "@/lib/google-merchant": "@verone/integrations/google-merchant",
  "@/lib/qonto": "@verone/integrations/qonto",
  
  // Actions
  "@/lib/actions/user-management": "@verone/admin/actions/user-management",
};

// Regex patterns plus spécifiques
const IMPORT_PATTERNS = [
  // Pattern 1 : UI components (simple)
  {
    regex: /from\s+['"]@\/components\/ui\/[^'"]+['"]/g,
    replace: (match) => `from '@verone/ui'`,
    description: 'UI components'
  },
  
  // Pattern 2 : Shared modules (avec capture du nom de module)
  {
    regex: /from\s+['"]@\/shared\/modules\/([^\/'"]+)(?:\/[^'"]+)?['"]/g,
    replace: (match, moduleName) => `from '@verone/${moduleName}'`,
    description: 'Business modules'
  },
  
  // Pattern 3 : Lib utils simples
  {
    regex: /from\s+['"]@\/lib\/utils['"]/g,
    replace: () => `from '@verone/utils'`,
    description: 'Core utils'
  },
  
  // Pattern 4 : Lib supabase
  {
    regex: /from\s+['"]@\/lib\/supabase(?:\/[^'"]+)?['"]/g,
    replace: () => `from '@verone/utils/supabase'`,
    description: 'Supabase utils'
  },
  
  // Pattern 5 : Design system
  {
    regex: /from\s+['"]@\/lib\/design-system(?:\/[^'"]+)?['"]/g,
    replace: () => `from '@verone/ui/tokens'`,
    description: 'Design system'
  },
  
  // Pattern 6 : Lib analytics
  {
    regex: /from\s+['"]@\/lib\/analytics(?:\/[^'"]+)?['"]/g,
    replace: () => `from '@verone/utils/analytics'`,
    description: 'Analytics'
  },
  
  // Pattern 7 : Lib monitoring
  {
    regex: /from\s+['"]@\/lib\/monitoring(?:\/[^'"]+)?['"]/g,
    replace: () => `from '@verone/utils/monitoring'`,
    description: 'Monitoring'
  },
  
  // Pattern 8 : Lib upload
  {
    regex: /from\s+['"]@\/lib\/upload(?:\/[^'"]+)?['"]/g,
    replace: () => `from '@verone/utils/upload'`,
    description: 'Upload utils'
  },
  
  // Pattern 9 : Lib validation
  {
    regex: /from\s+['"]@\/lib\/validation(?:\/[^'"]+)?['"]/g,
    replace: () => `from '@verone/utils/validation'`,
    description: 'Validation'
  },
  
  // Pattern 10 : Integrations Abby
  {
    regex: /from\s+['"]@\/lib\/abby(?:\/[^'"]+)?['"]/g,
    replace: () => `from '@verone/integrations/abby'`,
    description: 'Abby integration'
  },
  
  // Pattern 11 : Integrations Google Merchant
  {
    regex: /from\s+['"]@\/lib\/google-merchant(?:\/[^'"]+)?['"]/g,
    replace: () => `from '@verone/integrations/google-merchant'`,
    description: 'Google Merchant integration'
  },
  
  // Pattern 12 : Integrations Qonto
  {
    regex: /from\s+['"]@\/lib\/qonto(?:\/[^'"]+)?['"]/g,
    replace: () => `from '@verone/integrations/qonto'`,
    description: 'Qonto integration'
  },
  
  // Pattern 13 : Actions admin
  {
    regex: /from\s+['"]@\/lib\/actions\/user-management['"]/g,
    replace: () => `from '@verone/admin/actions/user-management'`,
    description: 'Admin actions'
  },
];

// ============================================================================
// STATS
// ============================================================================

const stats = {
  filesProcessed: 0,
  filesModified: 0,
  totalReplacements: 0,
  byPattern: {},
  errors: [],
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    let newContent = content;
    let fileModified = false;
    let fileReplacements = 0;
    
    // Apply all patterns
    IMPORT_PATTERNS.forEach(pattern => {
      const matches = newContent.match(pattern.regex);
      if (matches && matches.length > 0) {
        const before = newContent;
        newContent = newContent.replace(pattern.regex, pattern.replace);
        
        if (before !== newContent) {
          const count = matches.length;
          fileModified = true;
          fileReplacements += count;
          
          if (!stats.byPattern[pattern.description]) {
            stats.byPattern[pattern.description] = 0;
          }
          stats.byPattern[pattern.description] += count;
          
          if (VERBOSE) {
            console.log(`  ✓ ${pattern.description}: ${count} replacement(s)`);
          }
        }
      }
    });
    
    stats.filesProcessed++;
    
    if (fileModified) {
      stats.filesModified++;
      stats.totalReplacements += fileReplacements;
      
      console.log(`✓ ${filePath} (${fileReplacements} changes)`);
      
      if (!DRY_RUN) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
      }
    }
    
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message });
    console.error(`✗ ${filePath}: ${error.message}`);
  }
}

/**
 * Find all target files
 */
function findFiles() {
  let allFiles = [];
  
  TARGETS.forEach(pattern => {
    const files = glob.sync(pattern, {
      cwd: process.cwd(),
      absolute: true,
      ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**']
    });
    allFiles = allFiles.concat(files);
  });
  
  // Remove duplicates
  return [...new Set(allFiles)];
}

/**
 * Print statistics
 */
function printStats() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION STATISTICS');
  console.log('='.repeat(60));
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (preview only)' : '✏️  WRITE MODE'}`);
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Files modified: ${stats.filesModified}`);
  console.log(`Total replacements: ${stats.totalReplacements}`);
  console.log('\nReplacements by pattern:');
  
  Object.entries(stats.byPattern)
    .sort((a, b) => b[1] - a[1])
    .forEach(([pattern, count]) => {
      console.log(`  - ${pattern}: ${count}`);
    });
  
  if (stats.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    stats.errors.forEach(err => {
      console.log(`  - ${err.file}: ${err.error}`);
    });
  }
  
  console.log('='.repeat(60));
  
  if (DRY_RUN) {
    console.log('\n💡 Tip: Run without --dry-run to apply changes');
  }
}

/**
 * Consolidate imports (post-processing)
 * Example: Multiple "from '@verone/ui'" → Single import with all named imports
 */
function consolidateImports(filePath) {
  // TODO: Implement si nécessaire (optionnel)
  // Pour l'instant, les imports multiples sont OK (Next.js tree-shaking)
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log('🚀 Starting import migration...\n');
  
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No files will be modified\n');
  }
  
  const files = findFiles();
  console.log(`Found ${files.length} files to process\n`);
  
  files.forEach(processFile);
  
  printStats();
  
  if (!DRY_RUN && stats.filesModified > 0) {
    console.log('\n✅ Migration complete! Remember to:');
    console.log('   1. Run: npm run type-check');
    console.log('   2. Run: npm run build');
    console.log('   3. Test critical pages manually');
    console.log('   4. Commit changes with descriptive message');
  }
}

// ============================================================================
// EXECUTE
// ============================================================================

if (require.main === module) {
  main();
}

module.exports = { processFile, findFiles, IMPORT_PATTERNS };
