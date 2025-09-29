#!/usr/bin/env node

/**
 * 🧹 Script de Nettoyage des Erreurs de Test Sentry
 *
 * Ce script marque automatiquement comme "résolues" toutes les erreurs
 * contenant des marqueurs de test ([TEST], [TEST CLI], etc.)
 *
 * Usage: node scripts/sentry-cleanup-test-errors.js
 */

const https = require('https');
require('dotenv').config({ path: '.env.local' });

const SENTRY_API_URL = 'https://de.sentry.io/api/0';
const SENTRY_ORG = process.env.SENTRY_ORG || 'verone';
const SENTRY_PROJECT = '4510095142289488'; // ID du projet Sentry
const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;

// Patterns identifiant les erreurs de test
const TEST_PATTERNS = [
  '[TEST]',
  '[TEST CLI]',
  '[TEST API]',
  'test-sentry-cli',
  'Erreur Serveur Volontaire',
  'TEST',
  'Message Warning -'
];

/**
 * Effectue une requête HTTPS vers l'API Sentry
 */
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'de.sentry.io',
      path: `/api/0${path}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${SENTRY_AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Vérifie si une issue est une erreur de test
 */
function isTestError(issue) {
  const title = issue.title || '';
  const culprit = issue.culprit || '';

  return TEST_PATTERNS.some(pattern =>
    title.includes(pattern) || culprit.includes(pattern)
  );
}

/**
 * Marque une issue comme résolue
 */
async function resolveIssue(issueId, title) {
  try {
    console.log(`🔄 Résolution de l'issue ${issueId}: ${title.substring(0, 60)}...`);

    const response = await makeRequest(
      `/organizations/${SENTRY_ORG}/issues/${issueId}/`,
      'PUT',
      { status: 'resolved' }
    );

    if (response.status === 200) {
      console.log(`✅ Issue ${issueId} résolue avec succès`);
      return true;
    } else {
      console.log(`❌ Erreur résolution issue ${issueId}: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`💥 Erreur lors de la résolution de l'issue ${issueId}:`, error.message);
    return false;
  }
}

/**
 * Script principal
 */
async function main() {
  if (!SENTRY_AUTH_TOKEN) {
    console.error('❌ SENTRY_AUTH_TOKEN manquant dans .env.local');
    process.exit(1);
  }

  console.log('🚀 Début du nettoyage des erreurs de test Sentry...\n');

  try {
    // 1. Récupérer toutes les issues non résolues
    console.log('📋 Récupération des issues non résolues...');
    const response = await makeRequest(
      `/organizations/${SENTRY_ORG}/issues/?project=${SENTRY_PROJECT}&query=is:unresolved&limit=100`
    );

    if (response.status !== 200) {
      throw new Error(`Erreur API Sentry: ${response.status}`);
    }

    const issues = response.data;
    console.log(`📊 ${issues.length} issues non résolues trouvées\n`);

    // 2. Identifier les erreurs de test
    const testErrors = issues.filter(isTestError);
    console.log(`🧪 ${testErrors.length} erreurs de test identifiées:`);
    testErrors.forEach(issue => {
      console.log(`   • ${issue.shortId}: ${issue.title.substring(0, 80)}...`);
    });
    console.log('');

    if (testErrors.length === 0) {
      console.log('✨ Aucune erreur de test à nettoyer !');
      return;
    }

    // 3. Demander confirmation
    console.log(`⚠️  Êtes-vous sûr de vouloir marquer ${testErrors.length} erreurs comme résolues ?`);
    console.log('   Appuyez sur Ctrl+C pour annuler, ou attendez 5 secondes pour continuer...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // 4. Résoudre les erreurs de test
    let resolved = 0;
    let failed = 0;

    for (const issue of testErrors) {
      const success = await resolveIssue(issue.id, issue.title);
      if (success) {
        resolved++;
      } else {
        failed++;
      }

      // Pause entre les requêtes pour éviter le rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 5. Rapport final
    console.log('\n📈 RAPPORT FINAL');
    console.log('================');
    console.log(`✅ Erreurs résolues: ${resolved}`);
    console.log(`❌ Erreurs échouées: ${failed}`);
    console.log(`📊 Total traité: ${testErrors.length}`);

    if (resolved > 0) {
      console.log('\n🎉 Nettoyage terminé avec succès !');
      console.log('🔗 Vérifiez dans Sentry: https://verone.sentry.io/issues/');
    }

  } catch (error) {
    console.error('💥 Erreur durant le nettoyage:', error.message);
    process.exit(1);
  }
}

// Gestion des signaux pour arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Nettoyage annulé par l\'utilisateur');
  process.exit(0);
});

// Exécution
main().catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});