/**
 * 🔗 API Route - Proxy Sentry Issues
 *
 * Route sécurisée pour récupérer les issues depuis l'API Sentry
 * Évite d'exposer le token côté client
 */

import { NextRequest, NextResponse } from 'next/server'

const SENTRY_API_URL = 'https://de.sentry.io/api/0'
const SENTRY_ORG = process.env.SENTRY_ORG || 'verone'
const SENTRY_PROJECT = '4510095142289488' // ID du projet Sentry
const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN

export async function GET(request: NextRequest) {
  try {
    if (!SENTRY_AUTH_TOKEN) {
      console.error('❌ [API] SENTRY_AUTH_TOKEN manquant')
      return NextResponse.json(
        { error: 'Configuration Sentry manquante' },
        { status: 500 }
      )
    }

    // Récupérer les issues depuis Sentry (requête simplifiée pour éviter erreur 400)
    const issuesResponse = await fetch(
      `${SENTRY_API_URL}/organizations/${SENTRY_ORG}/issues/?project=${SENTRY_PROJECT}&statsPeriod=24h&limit=50`,
      {
        headers: {
          'Authorization': `Bearer ${SENTRY_AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!issuesResponse.ok) {
      console.error('❌ [API] Erreur Sentry:', issuesResponse.status, issuesResponse.statusText)
      throw new Error(`Erreur API Sentry: ${issuesResponse.status}`)
    }

    const issues = await issuesResponse.json()

    // Calculer les statistiques
    const stats = {
      totalIssues: issues.length,
      unresolvedCount: issues.filter((i: any) => i.status === 'unresolved').length,
      last24hCount: issues.filter((i: any) => {
        const lastSeen = new Date(i.lastSeen)
        const now = new Date()
        const diff = now.getTime() - lastSeen.getTime()
        return diff < 24 * 60 * 60 * 1000
      }).length,
      criticalCount: issues.filter((i: any) =>
        i.level === 'error' || i.level === 'fatal' || i.priority === 'high'
      ).length,
      affectedUsers: issues.reduce((sum: number, i: any) => sum + (i.userCount || 0), 0),
    }

    console.log('✅ [API] Récupération Sentry réussie:', {
      totalIssues: stats.totalIssues,
      unresolvedCount: stats.unresolvedCount
    })

    return NextResponse.json({
      issues,
      stats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('💥 [API] Erreur récupération Sentry:', error)
    return NextResponse.json(
      {
        error: 'Erreur lors de la récupération des données',
        issues: [],
        stats: {
          totalIssues: 0,
          unresolvedCount: 0,
          last24hCount: 0,
          criticalCount: 0,
          affectedUsers: 0
        }
      },
      { status: 500 }
    )
  }
}

// Endpoint pour envoyer une erreur de test
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message = 'Test error from dashboard', level = 'error' } = body

    // Import dynamique de Sentry
    const Sentry = await import('@sentry/nextjs')

    // Capturer le message de test
    Sentry.captureMessage(message, level as any)

    console.log('✅ [API] Message test envoyé à Sentry:', message)

    return NextResponse.json({
      success: true,
      message: 'Erreur de test envoyée à Sentry'
    })

  } catch (error) {
    console.error('💥 [API] Erreur envoi test Sentry:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du test' },
      { status: 500 }
    )
  }
}