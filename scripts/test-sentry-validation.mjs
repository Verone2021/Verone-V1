#!/usr/bin/env node

/**
 * 🧪 Test Script - Validation Sentry Professionnel 2025
 * Test de la fonction validateSentryConnection()
 */

import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Configuration des variables d'environnement
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

config({ path: join(projectRoot, '.env.local') })

// Simulation de la fonction validateSentryConnection
async function validateSentryConnection() {
  const startTime = Date.now()

  try {
    // Vérification variables d'environnement
    const bearerToken = process.env.SENTRY_BEARER_TOKEN
    const sentryOrg = process.env.SENTRY_ORG
    const sentryRegion = process.env.SENTRY_REGION_URL || 'https://de.sentry.io'

    console.log('🔍 [Test] Vérification variables d\'environnement...')
    console.log(`   SENTRY_BEARER_TOKEN: ${bearerToken ? '✅ Présent' : '❌ Manquant'}`)
    console.log(`   SENTRY_ORG: ${sentryOrg || '❌ Manquant'}`)
    console.log(`   SENTRY_REGION: ${sentryRegion}`)

    if (!bearerToken || !sentryOrg) {
      return {
        isConnected: false,
        errorCount: 0,
        criticalErrors: 0,
        warningErrors: 0,
        lastCheck: new Date(),
        region: 'DE',
        status: 'critical',
        message: '❌ Configuration Sentry manquante'
      }
    }

    // Test API Sentry
    console.log('🌐 [Test] Test connexion API Sentry...')

    const response = await fetch(
      `${sentryRegion}/api/0/projects/${sentryOrg}/verone-backoffice/issues/?query=is:unresolved&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    console.log(`   Status HTTP: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      return {
        isConnected: false,
        errorCount: 0,
        criticalErrors: 0,
        warningErrors: 0,
        lastCheck: new Date(),
        region: sentryRegion.includes('de.sentry.io') ? 'DE' : 'US',
        status: 'critical',
        message: `❌ Authentification Sentry échouée (${response.status})`
      }
    }

    const errors = await response.json()
    const duration = Date.now() - startTime

    console.log(`   Erreurs récupérées: ${errors.length}`)

    // Analyse des erreurs
    const criticalErrors = errors.filter(e => e.level === 'error').length
    const warningErrors = errors.filter(e => e.level === 'warning').length
    const totalErrors = errors.length

    // Échantillon des erreurs pour analyse
    console.log('📊 [Test] Échantillon erreurs récupérées:')
    errors.slice(0, 3).forEach((error, index) => {
      console.log(`   ${index + 1}. [${error.level.toUpperCase()}] ${error.title.substring(0, 80)}...`)
      console.log(`      Count: ${error.count} | LastSeen: ${error.lastSeen}`)
    })

    // Détermination du statut
    let status = 'healthy'
    let message = '✅ Sentry opérationnel'

    if (criticalErrors > 0) {
      status = 'critical'
      message = `🚨 ${criticalErrors} erreurs critiques détectées`
    } else if (totalErrors > 10) {
      status = 'warning'
      message = `⚠️ ${totalErrors} erreurs non critiques`
    } else if (totalErrors > 0) {
      status = 'warning'
      message = `💡 ${totalErrors} erreurs mineures`
    }

    return {
      isConnected: true,
      errorCount: totalErrors,
      criticalErrors,
      warningErrors,
      lastCheck: new Date(),
      region: sentryRegion.includes('de.sentry.io') ? 'DE' : 'US',
      status,
      message: `${message} | Région: ${sentryRegion.includes('de.sentry.io') ? 'DE' : 'US'} | Durée: ${duration}ms`
    }

  } catch (error) {
    console.error('❌ [Test] Erreur de validation:', error)

    return {
      isConnected: false,
      errorCount: 0,
      criticalErrors: 0,
      warningErrors: 0,
      lastCheck: new Date(),
      region: 'DE',
      status: 'critical',
      message: `❌ Erreur: ${error.message}`
    }
  }
}

// Affichage des résultats avec indicateurs visuels
function displayValidationStatus(result) {
  const statusEmoji = {
    healthy: '🟢',
    warning: '🟡',
    critical: '🔴'
  }

  const statusColor = {
    healthy: '\x1b[32m', // Vert
    warning: '\x1b[33m', // Jaune
    critical: '\x1b[31m', // Rouge
  }

  const reset = '\x1b[0m'
  const emoji = statusEmoji[result.status]
  const color = statusColor[result.status]

  console.log(`\n${emoji} ${color}[SENTRY VALIDATION RESULT]${reset} ${result.message}`)
  console.log(`   📊 Erreurs: ${result.errorCount} total (${result.criticalErrors} critiques, ${result.warningErrors} warnings)`)
  console.log(`   🌍 Région: ${result.region} | 🕐 Vérification: ${result.lastCheck.toISOString()}`)
  console.log(`   🔗 Connexion: ${result.isConnected ? '✅ Active' : '❌ Échec'}\n`)
}

// Exécution du test
async function runTest() {
  console.log('🚀 [Test] Démarrage validation Sentry - Workflow Professionnel 2025\n')

  const result = await validateSentryConnection()
  displayValidationStatus(result)

  // Recommandations selon le statut
  if (result.status === 'critical') {
    console.log('🚨 ACTION REQUISE:')
    console.log('   - Vérifier configuration Bearer Token')
    console.log('   - Corriger erreurs critiques avant validation')
    console.log('   - Re-exécuter validation après corrections\n')
    process.exit(1)
  } else if (result.status === 'warning') {
    console.log('⚠️ RECOMMANDATIONS:')
    console.log('   - Surveiller les erreurs non critiques')
    console.log('   - Planifier corrections mineures')
    console.log('   - Reset intelligent disponible\n')
  } else {
    console.log('✅ VALIDATION RÉUSSIE:')
    console.log('   - Système Sentry opérationnel')
    console.log('   - Reset intelligent autorisé')
    console.log('   - Workflow professionnel respecté\n')
  }
}

runTest()