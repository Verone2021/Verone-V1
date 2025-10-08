/**
 * 🧪 API Route - Test Erreur Sentry
 *
 * Route de test pour valider la capture des erreurs serveur
 * Utilisée par la page de test Sentry
 */

import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [API Test] Génération erreur serveur volontaire...')

    // Générer une erreur serveur volontaire
    throw new Error('🔥 [TEST API] Erreur Serveur Volontaire - ' + new Date().toISOString())

  } catch (error) {
    // Capturer l'erreur avec Sentry
    Sentry.captureException(error, {
      tags: {
        test_type: 'api_error',
        source: 'test_api_route',
        verone_module: 'test_sentry',
        endpoint: '/api/test-sentry-error'
      },
      level: 'error'
    })

    console.error('❌ [API Test] Erreur capturée et envoyée à Sentry:', error)

    // Retourner une réponse de succès pour le test
    return NextResponse.json({
      success: true,
      message: 'Erreur serveur générée et envoyée à Sentry',
      timestamp: new Date().toISOString()
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { errorType = 'standard' } = body

    console.log('🧪 [API Test] Génération erreur type:', errorType)

    // Différents types d'erreurs selon le paramètre
    switch (errorType) {
      case 'database':
        // Simuler une erreur database
        throw new Error('🗄️ [TEST] Erreur Database Connection Failed')

      case 'timeout':
        // Simuler un timeout
        await new Promise(resolve => setTimeout(resolve, 5000))
        throw new Error('⏱️ [TEST] Request Timeout après 5 secondes')

      case 'validation':
        // Simuler une erreur de validation
        throw new Error('📝 [TEST] Validation Error: champ requis manquant')

      case 'auth':
        // Simuler une erreur d'authentification
        Sentry.captureException(new Error('🔐 [TEST] Authentication Failed'), {
          level: 'warning',
          tags: {
            test_type: 'auth_error',
            user_id: 'test-user'
          }
        })
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 401 }
        )

      default:
        // Erreur standard
        throw new Error('💥 [TEST] Erreur Standard POST - ' + new Date().toISOString())
    }

  } catch (error) {
    // Capturer avec contexte enrichi
    Sentry.captureException(error, {
      tags: {
        test_type: 'api_error_post',
        source: 'test_api_route'
      },
      extra: {
        method: 'POST',
        timestamp: new Date().toISOString()
      }
    })

    console.error('❌ [API Test POST] Erreur envoyée à Sentry:', error)

    return NextResponse.json({
      success: true,
      message: `Erreur ${error} générée et envoyée à Sentry`,
      timestamp: new Date().toISOString()
    })
  }
}