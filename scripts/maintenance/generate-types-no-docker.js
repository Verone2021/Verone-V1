#!/usr/bin/env node

/**
 * Script de génération des types TypeScript Supabase SANS Docker
 * Workflow Vercel : Connexion directe à PostgreSQL distant
 *
 * Usage: node scripts/generate-types-no-docker.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Database URL - Charger depuis .env.local ou .mcp.env
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres.aorroydfjsrygmosnzrl:[PASSWORD]@aws-1-eu-west-3.pooler.supabase.com:5432/postgres';
const OUTPUT_FILE = path.join(__dirname, '../apps/back-office/src/types/supabase.ts');
const PACKAGE_OUTPUT = path.join(__dirname, '../packages/@verone/types/src/supabase.ts');

console.log('🚀 Génération des types TypeScript Supabase (sans Docker)...\n');

try {
  // Méthode 1 : Utiliser npx supabase directement (peut fonctionner sans Docker pour gen types)
  console.log('📝 Tentative de génération avec Supabase CLI...');

  const command = `npx supabase@latest gen types typescript --db-url "${DB_URL}"`;
  const types = execSync(command, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, SUPABASE_SKIP_DOCKER_CHECK: '1' }
  });

  // Écrire les types dans le fichier de sortie
  fs.writeFileSync(OUTPUT_FILE, types, 'utf8');
  console.log(`✅ Types générés : ${OUTPUT_FILE}`);

  // Copier vers packages/@verone/types
  fs.copyFileSync(OUTPUT_FILE, PACKAGE_OUTPUT);
  console.log(`✅ Types copiés : ${PACKAGE_OUTPUT}`);

  console.log('\n🎉 Génération terminée avec succès !');
  console.log('\n📝 Prochaines étapes :');
  console.log('  npm run type-check');
  console.log('  npm run build');

} catch (error) {
  console.error('\n❌ Erreur lors de la génération des types:');
  console.error(error.message);

  console.log('\n💡 Solution alternative :');
  console.log('1. Ouvrir https://supabase.com/dashboard/project/aorroydfjsrygmosnzrl/api/types');
  console.log('2. Copier tout le code TypeScript généré');
  console.log(`3. Coller dans ${OUTPUT_FILE}`);
  console.log(`4. Copier vers ${PACKAGE_OUTPUT}`);

  process.exit(1);
}
