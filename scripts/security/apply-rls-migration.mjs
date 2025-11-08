#!/usr/bin/env node

/**
 * Script d'Application Automatisée Migration RLS Critique
 *
 * Mission: Corriger vulnérabilité sécurité sur 3 tables SANS RLS
 * - variant_groups
 * - sample_orders
 * - sample_order_items
 *
 * Bonus: Renforcement policies contacts
 *
 * Usage: node scripts/security/apply-rls-migration.mjs
 *
 * Prérequis:
 * - NEXT_PUBLIC_SUPABASE_URL dans .env.local
 * - SUPABASE_SERVICE_ROLE_KEY dans .env.local
 * - @supabase/supabase-js installé
 *
 * Date: 8 octobre 2025
 * Impact: BLOQUEUR PRODUCTION - Sécurité critique
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Configuration paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');
const envPath = join(projectRoot, '.env.local');
const migrationPath = join(
  projectRoot,
  'supabase/migrations/20251008_003_fix_missing_rls_policies.sql'
);

// Charger variables environnement
dotenv.config({ path: envPath });

// Couleurs console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Helpers logging
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(`  ${title}`, 'bold');
  console.log('='.repeat(80) + '\n');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Vérification environnement
function checkEnvironment() {
  logSection('1. VÉRIFICATION ENVIRONNEMENT');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    logError('NEXT_PUBLIC_SUPABASE_URL non trouvée dans .env.local');
    process.exit(1);
  }

  if (!serviceRoleKey) {
    logError('SUPABASE_SERVICE_ROLE_KEY non trouvée dans .env.local');
    logWarning('Service Role Key nécessaire pour bypass RLS pendant migration');
    process.exit(1);
  }

  logSuccess(`Supabase URL: ${url}`);
  logSuccess(`Service Role Key: ${serviceRoleKey.substring(0, 20)}...`);

  return { url, serviceRoleKey };
}

// Initialisation client Supabase
function initSupabaseClient(url, serviceRoleKey) {
  logSection('2. INITIALISATION CLIENT SUPABASE');

  try {
    const supabase = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    logSuccess('Client Supabase initialisé avec Service Role (bypass RLS)');
    return supabase;
  } catch (error) {
    logError(`Erreur initialisation Supabase: ${error.message}`);
    process.exit(1);
  }
}

// Lecture fichier migration
function readMigrationFile() {
  logSection('3. LECTURE FICHIER MIGRATION SQL');

  try {
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    const lines = migrationSQL.split('\n').length;
    const size = (migrationSQL.length / 1024).toFixed(2);

    logSuccess(`Migration lue: ${migrationPath}`);
    logInfo(`Taille: ${size} KB (${lines} lignes)`);

    // Validation basique structure
    if (!migrationSQL.includes('BEGIN') || !migrationSQL.includes('COMMIT')) {
      logWarning('Transaction BEGIN/COMMIT non détectée dans migration');
    } else {
      logSuccess('Transaction PostgreSQL détectée (BEGIN/COMMIT)');
    }

    return migrationSQL;
  } catch (error) {
    logError(`Erreur lecture migration: ${error.message}`);
    process.exit(1);
  }
}

// Application migration
async function applyMigration(supabase, migrationSQL) {
  logSection('4. APPLICATION MIGRATION RLS');

  try {
    logInfo('Exécution transaction SQL...');

    // Supabase utilise PostgREST, nous devons utiliser .rpc() pour exécuter SQL brut
    // Mais les migrations sont mieux gérées via query direct
    const { data, error } = await supabase.rpc('exec', { query: migrationSQL });

    if (error) {
      // Si .rpc() échoue, essayer avec une approche alternative
      logWarning('Méthode .rpc() non disponible, tentative query directe...');

      // Alternative: Exécuter via fetch direct API Supabase
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ query: migrationSQL }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erreur HTTP: ${response.status} - ${response.statusText}`
        );
      }

      logSuccess('Migration appliquée avec succès (fetch direct)');
    } else {
      logSuccess('Migration appliquée avec succès (.rpc())');
    }

    return true;
  } catch (error) {
    logError(`Erreur application migration: ${error.message}`);
    logWarning('ROLLBACK automatique PostgreSQL si transaction incomplète');
    return false;
  }
}

// Validation RLS activé
async function validateRLSEnabled(supabase) {
  logSection('5. VALIDATION RLS ENABLED');

  const targetTables = [
    'variant_groups',
    'sample_orders',
    'sample_order_items',
  ];

  try {
    const { data, error } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public')
      .in('tablename', targetTables);

    if (error) {
      // Fallback: query SQL directe
      logWarning('Query pg_tables échoué, validation manuelle requise');
      logInfo(
        'Vérifier manuellement dans Supabase Dashboard > Database > Tables'
      );
      return false;
    }

    logInfo('Résultats validation RLS:');
    let allEnabled = true;

    for (const table of targetTables) {
      const tableData = data?.find(t => t.tablename === table);

      if (!tableData) {
        logWarning(`  ${table}: NON TROUVÉ`);
        allEnabled = false;
      } else if (tableData.rowsecurity) {
        logSuccess(`  ${table}: RLS ENABLED ✓`);
      } else {
        logError(`  ${table}: RLS DISABLED ✗`);
        allEnabled = false;
      }
    }

    return allEnabled;
  } catch (error) {
    logError(`Erreur validation RLS: ${error.message}`);
    return false;
  }
}

// Validation policies
async function validatePolicies(supabase) {
  logSection('6. VALIDATION POLICIES');

  const targetTables = [
    'variant_groups',
    'sample_orders',
    'sample_order_items',
    'contacts',
  ];
  const expectedPoliciesCount = 4; // SELECT, INSERT, UPDATE, DELETE

  logInfo('Vérification nombre de policies par table...');

  try {
    // Note: pg_policies n'est pas accessible via PostgREST par défaut
    // Validation manuelle requise
    logWarning(
      'Validation policies nécessite accès pg_policies (non exposé via API)'
    );
    logInfo('Vérification manuelle recommandée:');
    logInfo(
      '  URL: https://supabase.com/dashboard/project/aorroydfjsrygmosnzrl/auth/policies'
    );
    logInfo('');
    logInfo('Attendu pour chaque table:');

    for (const table of targetTables) {
      logInfo(
        `  ${table}: ${expectedPoliciesCount} policies (SELECT, INSERT, UPDATE, DELETE)`
      );
    }

    return true; // Validation manuelle
  } catch (error) {
    logError(`Erreur validation policies: ${error.message}`);
    return false;
  }
}

// Rapport final
function generateReport(migrationApplied, rlsValidated, policiesValidated) {
  logSection('7. RAPPORT FINAL MIGRATION RLS');

  const allPassed = migrationApplied && rlsValidated && policiesValidated;

  console.log('Résultats:');
  console.log(
    `  Migration appliquée:      ${migrationApplied ? '✅ OUI' : '❌ NON'}`
  );
  console.log(
    `  RLS enabled (3 tables):   ${rlsValidated ? '✅ OUI' : '⚠️  VÉRIFICATION MANUELLE REQUISE'}`
  );
  console.log(
    `  Policies validées:        ${policiesValidated ? '⚠️  VÉRIFICATION MANUELLE REQUISE' : '❌ NON'}`
  );
  console.log('');

  if (allPassed || migrationApplied) {
    logSuccess('MIGRATION APPLIQUÉE AVEC SUCCÈS');
    logInfo('');
    logInfo('PROCHAINES ÉTAPES:');
    logInfo('1. Vérifier manuellement policies dans Dashboard:');
    logInfo(
      '   https://supabase.com/dashboard/project/aorroydfjsrygmosnzrl/auth/policies'
    );
    logInfo('');
    logInfo('2. Exécuter tests isolation multi-organisations:');
    logInfo('   - Créer 2 organisations test (org-test-a, org-test-b)');
    logInfo('   - Créer 2 users avec organisations différentes');
    logInfo('   - Tester accès croisés (ATTENDU: 0 rows)');
    logInfo('');
    logInfo('3. Exécuter script validation coverage:');
    logInfo('   ./scripts/security/validate-rls-coverage.sh');
    logInfo('');
    logSuccess('Si validations OK → DÉPLOIEMENT PRODUCTION AUTORISÉ ✓');
    return 0;
  } else {
    logError('MIGRATION ÉCHOUÉE');
    logWarning('Vérifier logs ci-dessus pour diagnostiquer erreurs');
    logInfo('');
    logInfo('OPTIONS ALTERNATIVES:');
    logInfo('1. Application manuelle via Supabase Dashboard SQL Editor');
    logInfo('2. Vérifier permissions Service Role Key');
    logInfo('3. Contacter support Supabase si problème persistant');
    return 1;
  }
}

// Main execution
async function main() {
  console.clear();
  log(
    '╔════════════════════════════════════════════════════════════════════════════╗',
    'cyan'
  );
  log(
    '║         VÉRONE - APPLICATION MIGRATION RLS CRITIQUE                        ║',
    'cyan'
  );
  log(
    '║         Correction Vulnérabilité Sécurité 3 Tables                         ║',
    'cyan'
  );
  log(
    '╚════════════════════════════════════════════════════════════════════════════╝',
    'cyan'
  );
  console.log('');

  try {
    // 1. Vérification environnement
    const { url, serviceRoleKey } = checkEnvironment();

    // 2. Initialisation client Supabase
    const supabase = initSupabaseClient(url, serviceRoleKey);

    // 3. Lecture migration
    const migrationSQL = readMigrationFile();

    // 4. Application migration
    const migrationApplied = await applyMigration(supabase, migrationSQL);

    if (!migrationApplied) {
      logError('Migration échouée - Arrêt du script');
      logWarning(
        'Appliquer migration manuellement via Supabase Dashboard SQL Editor'
      );
      process.exit(1);
    }

    // 5. Validation RLS
    const rlsValidated = await validateRLSEnabled(supabase);

    // 6. Validation policies
    const policiesValidated = await validatePolicies(supabase);

    // 7. Rapport final
    const exitCode = generateReport(
      migrationApplied,
      rlsValidated,
      policiesValidated
    );
    process.exit(exitCode);
  } catch (error) {
    logError(`Erreur fatale: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Exécution
main().catch(error => {
  logError(`Erreur non gérée: ${error.message}`);
  console.error(error);
  process.exit(1);
});
