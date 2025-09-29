/**
 * Script de test Sentry CLI
 * Exécuter avec: node test-sentry-cli.js
 */

const Sentry = require('@sentry/node');

// Initialiser Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || 'https://0797f98c5e37e37fc75fdc42798f3725@de.sentry.io/4510095142289488',
  environment: 'test',
  tracesSampleRate: 1.0,
});

console.log('🚀 Test Sentry CLI - Envoi d\'erreurs de test...\n');

// Test 1: Erreur simple
console.log('1️⃣ Envoi d\'une erreur simple...');
Sentry.captureException(new Error('🧪 [TEST CLI] Erreur Simple - ' + new Date().toISOString()), {
  tags: {
    test_type: 'cli',
    source: 'test_script'
  }
});

// Test 2: Message warning
console.log('2️⃣ Envoi d\'un message warning...');
Sentry.captureMessage('⚠️ [TEST CLI] Message Warning - ' + new Date().toISOString(), 'warning');

// Test 3: Erreur critique
console.log('3️⃣ Envoi d\'une erreur critique...');
Sentry.captureException(new Error('🔴 [TEST CLI] Erreur Critique'), {
  level: 'fatal',
  tags: {
    priority: 'high',
    test_type: 'cli_critical'
  }
});

// Test 4: Avec contexte utilisateur
console.log('4️⃣ Envoi avec contexte utilisateur...');
Sentry.setUser({
  id: 'test-cli-user',
  email: 'test-cli@verone.fr'
});
Sentry.captureMessage('👤 [TEST CLI] Test avec utilisateur', 'info');

// Attendre que les événements soient envoyés
console.log('\n⏳ Envoi en cours vers Sentry...');
Sentry.flush(5000).then(() => {
  console.log('✅ Tests terminés ! Vérifiez votre dashboard Sentry.');
  console.log('🔗 Dashboard: https://verone.sentry.io/issues/');
  process.exit(0);
}).catch(err => {
  console.error('❌ Erreur lors de l\'envoi:', err);
  process.exit(1);
});