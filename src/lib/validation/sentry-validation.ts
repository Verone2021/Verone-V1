/**
 * 🚀 Sentry Validation System - Professional Workflow 2025
 * Validation systématique selon meilleures pratiques Claude Code
 * Think → Test → Code → Verify OBLIGATOIRE
 */

export interface SentryValidationResult {
  isConnected: boolean
  errorCount: number
  criticalErrors: number
  warningErrors: number
  lastCheck: Date
  region: 'DE' | 'US'
  status: 'healthy' | 'warning' | 'critical'
  message: string
}

export interface SentryError {
  id: string
  title: string
  level: 'error' | 'warning'
  count: number
  lastSeen: string
  isResolved: boolean
  permalink: string
}

/**
 * 🔐 Validation connexion Sentry avec authentification Bearer Token
 */
export async function validateSentryConnection(): Promise<SentryValidationResult> {
  const startTime = Date.now()

  try {
    // Vérification variables d'environnement
    const bearerToken = process.env.SENTRY_BEARER_TOKEN
    const sentryOrg = process.env.SENTRY_ORG
    const sentryRegion = process.env.SENTRY_REGION_URL || 'https://de.sentry.io'

    if (!bearerToken || !sentryOrg) {
      return {
        isConnected: false,
        errorCount: 0,
        criticalErrors: 0,
        warningErrors: 0,
        lastCheck: new Date(),
        region: 'DE',
        status: 'critical',
        message: '❌ Configuration Sentry manquante (Bearer Token ou Organisation)'
      }
    }

    // Test API Sentry - Récupération des erreurs non résolues
    const response = await fetch(
      `${sentryRegion}/api/0/projects/${sentryOrg}/verone-backoffice/issues/?query=is:unresolved&limit=100`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

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

    const errors: SentryError[] = await response.json()
    const duration = Date.now() - startTime

    // Analyse des erreurs selon priorité
    const criticalErrors = errors.filter(e => e.level === 'error').length
    const warningErrors = errors.filter(e => e.level === 'warning').length
    const totalErrors = errors.length

    // Détermination du statut selon business rules
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
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

    console.log(`🔍 [Sentry Validation] ${message} (${duration}ms)`)

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
    console.error('❌ [Sentry Validation] Erreur:', error)

    return {
      isConnected: false,
      errorCount: 0,
      criticalErrors: 0,
      warningErrors: 0,
      lastCheck: new Date(),
      region: 'DE',
      status: 'critical',
      message: `❌ Erreur validation: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * 🎯 Récupération détaillée des erreurs Sentry
 */
export async function getSentryErrors(limit = 20): Promise<SentryError[]> {
  try {
    const bearerToken = process.env.SENTRY_BEARER_TOKEN
    const sentryOrg = process.env.SENTRY_ORG
    const sentryRegion = process.env.SENTRY_REGION_URL || 'https://de.sentry.io'

    if (!bearerToken || !sentryOrg) {
      throw new Error('Configuration Sentry manquante')
    }

    const response = await fetch(
      `${sentryRegion}/api/0/projects/${sentryOrg}/verone-backoffice/issues/?query=is:unresolved&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`API Sentry error: ${response.status}`)
    }

    const rawErrors = await response.json()

    return rawErrors.map((error: any): SentryError => ({
      id: error.id,
      title: error.title,
      level: error.level as 'error' | 'warning',
      count: parseInt(error.count) || 0,
      lastSeen: error.lastSeen,
      isResolved: error.status === 'resolved',
      permalink: error.permalink
    }))

  } catch (error) {
    console.error('❌ [getSentryErrors] Erreur:', error)
    return []
  }
}

/**
 * 🎨 Indicateurs visuels console selon statut
 */
export function displayValidationStatus(result: SentryValidationResult): void {
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

  console.log(`\n${emoji} ${color}[SENTRY VALIDATION]${reset} ${result.message}`)
  console.log(`   Erreurs: ${result.errorCount} total (${result.criticalErrors} critiques, ${result.warningErrors} warnings)`)
  console.log(`   Région: ${result.region} | Dernière vérification: ${result.lastCheck.toISOString()}`)
  console.log(`   Connexion: ${result.isConnected ? '✅ Active' : '❌ Échec'}\n`)
}