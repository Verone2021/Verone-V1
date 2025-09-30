// Test rapide de capture Sentry depuis le navigateur
console.log('🧪 Test Sentry - Erreur console.error')
console.error('TEST SENTRY: Erreur console pour validation capture')

// Test avec window.testSentry si disponible
if (typeof window !== 'undefined' && window.testSentry) {
  window.testSentry('Test Sentry depuis script')
} else {
  console.log('⚠️ window.testSentry non disponible')
}

// Erreur JavaScript non gérée
throw new Error('TEST SENTRY: Erreur JavaScript non gérée pour validation')