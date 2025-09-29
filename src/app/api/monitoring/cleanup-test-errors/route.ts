/**
 * 🧹 API Route - Nettoyage des Erreurs de Test Sentry
 *
 * Route sécurisée pour nettoyer automatiquement les erreurs de test
 * depuis le dashboard interne
 */

import { NextRequest, NextResponse } from 'next/server'

const SENTRY_API_URL = 'https://de.sentry.io/api/0'
const SENTRY_ORG = process.env.SENTRY_ORG || 'verone'
const SENTRY_PROJECT = '4510095142289488' // ID du projet Sentry
const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN

// Patterns identifiant les erreurs de test
const TEST_PATTERNS = [
  '[TEST]',
  '[TEST CLI]',
  '[TEST API]',
  'test-sentry-cli',
  'Erreur Serveur Volontaire',
  'Message Warning -'
]

/**
 * Vérifie si une issue est une erreur de test
 */
function isTestError(issue: any) {
  const title = issue.title || ''
  const culprit = issue.culprit || ''

  return TEST_PATTERNS.some(pattern =>
    title.includes(pattern) || culprit.includes(pattern)
  )
}

/**
 * POST - Nettoyer les erreurs de test
 */
export async function POST(request: NextRequest) {
  try {
    if (!SENTRY_AUTH_TOKEN) {
      console.error('❌ [API Cleanup] SENTRY_AUTH_TOKEN manquant')
      return NextResponse.json(
        { error: 'Configuration Sentry manquante' },
        { status: 500 }
      )
    }

    console.log('🧹 [API Cleanup] Début du nettoyage des erreurs de test...')

    // 1. Récupérer toutes les issues non résolues
    const issuesResponse = await fetch(
      `${SENTRY_API_URL}/organizations/${SENTRY_ORG}/issues/?project=${SENTRY_PROJECT}&query=is:unresolved&limit=100`,
      {
        headers: {
          'Authorization': `Bearer ${SENTRY_AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!issuesResponse.ok) {
      console.error('❌ [API Cleanup] Erreur récupération issues:', issuesResponse.status)
      throw new Error(`Erreur API Sentry: ${issuesResponse.status}`)
    }

    const issues = await issuesResponse.json()
    console.log(`📊 [API Cleanup] ${issues.length} issues non résolues trouvées`)

    // 2. Identifier les erreurs de test
    const testErrors = issues.filter(isTestError)
    console.log(`🧪 [API Cleanup] ${testErrors.length} erreurs de test identifiées`)

    if (testErrors.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucune erreur de test à nettoyer',
        resolved: 0,
        total: 0
      })
    }

    // 3. Résoudre les erreurs de test
    let resolved = 0
    let failed = 0

    for (const issue of testErrors) {
      try {
        console.log(`🔄 [API Cleanup] Résolution issue ${issue.id}: ${issue.title.substring(0, 60)}...`)

        const resolveResponse = await fetch(
          `${SENTRY_API_URL}/organizations/${SENTRY_ORG}/issues/${issue.id}/`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${SENTRY_AUTH_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'resolved' })
          }
        )

        if (resolveResponse.ok) {
          console.log(`✅ [API Cleanup] Issue ${issue.id} résolue`)
          resolved++
        } else {
          console.error(`❌ [API Cleanup] Erreur résolution issue ${issue.id}:`, resolveResponse.status)
          failed++
        }

        // Pause pour éviter rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (error) {
        console.error(`💥 [API Cleanup] Erreur issue ${issue.id}:`, error)
        failed++
      }
    }

    const result = {
      success: true,
      message: `Nettoyage terminé: ${resolved} erreurs résolues, ${failed} échouées`,
      resolved,
      failed,
      total: testErrors.length,
      errors: testErrors.map(issue => ({
        id: issue.id,
        shortId: issue.shortId,
        title: issue.title.substring(0, 100)
      }))
    }

    console.log('✅ [API Cleanup] Nettoyage terminé:', result)
    return NextResponse.json(result)

  } catch (error) {
    console.error('💥 [API Cleanup] Erreur durant le nettoyage:', error)
    return NextResponse.json(
      {
        error: 'Erreur lors du nettoyage des erreurs de test',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

/**
 * GET - Obtenir la liste des erreurs de test sans les résoudre
 */
export async function GET(request: NextRequest) {
  try {
    if (!SENTRY_AUTH_TOKEN) {
      return NextResponse.json(
        { error: 'Configuration Sentry manquante' },
        { status: 500 }
      )
    }

    // Récupérer les issues non résolues
    const issuesResponse = await fetch(
      `${SENTRY_API_URL}/organizations/${SENTRY_ORG}/issues/?project=${SENTRY_PROJECT}&query=is:unresolved&limit=100`,
      {
        headers: {
          'Authorization': `Bearer ${SENTRY_AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!issuesResponse.ok) {
      throw new Error(`Erreur API Sentry: ${issuesResponse.status}`)
    }

    const issues = await issuesResponse.json()
    const testErrors = issues.filter(isTestError)

    return NextResponse.json({
      total: testErrors.length,
      errors: testErrors.map(issue => ({
        id: issue.id,
        shortId: issue.shortId,
        title: issue.title,
        level: issue.level,
        firstSeen: issue.firstSeen,
        lastSeen: issue.lastSeen
      }))
    })

  } catch (error) {
    console.error('💥 [API Cleanup GET] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des erreurs de test' },
      { status: 500 }
    )
  }
}