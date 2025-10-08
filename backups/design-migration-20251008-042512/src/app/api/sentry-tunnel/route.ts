/**
 * 🔗 Tunnel Sentry - Vérone Back Office
 *
 * Endpoint proxy pour contourner les ad-blockers et problèmes CORS
 * Recommandé par Sentry pour résoudre les erreurs 403
 */

import { NextRequest, NextResponse } from 'next/server'

// Configuration Sentry - Projet Vérone actuel
const SENTRY_HOST = 'o4510076285943808.ingest.de.sentry.io'
const SENTRY_PROJECT_IDS = ['4510095142289488']

export async function POST(request: NextRequest) {
  try {
    const envelope = await request.text()
    const pieces = envelope.split('\n')
    const header = JSON.parse(pieces[0])

    // Validation de sécurité - vérifier que le DSN correspond à notre projet
    const dsn = header?.dsn
    if (!dsn) {
      console.error('❌ [Sentry Tunnel] DSN manquant dans l\'enveloppe')
      return NextResponse.json({ error: 'DSN manquant' }, { status: 400 })
    }

    const dsnMatch = dsn.match(/https:\/\/(.+)@(.+)\/(.+)/)
    if (!dsnMatch) {
      console.error('❌ [Sentry Tunnel] Format DSN invalide:', dsn)
      return NextResponse.json({ error: 'Format DSN invalide' }, { status: 400 })
    }

    const [, , host, projectId] = dsnMatch

    // Vérification de sécurité
    if (host !== SENTRY_HOST) {
      console.error('❌ [Sentry Tunnel] Host non autorisé:', host)
      return NextResponse.json({ error: 'Host non autorisé' }, { status: 403 })
    }

    if (!SENTRY_PROJECT_IDS.includes(projectId)) {
      console.error('❌ [Sentry Tunnel] Projet non autorisé:', projectId)
      return NextResponse.json({ error: 'Projet non autorisé' }, { status: 403 })
    }

    // Construire l'URL Sentry
    const sentryUrl = `https://${host}/api/${projectId}/envelope/`

    console.log('🔗 [Sentry Tunnel] Redirection vers:', sentryUrl)

    // Proxy vers Sentry
    const response = await fetch(sentryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'User-Agent': `verone-tunnel/1.0`,
      },
      body: envelope,
    })

    console.log('📡 [Sentry Tunnel] Réponse Sentry:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [Sentry Tunnel] Erreur Sentry:', response.status, errorText)
      return NextResponse.json(
        { error: `Erreur Sentry: ${response.status}` },
        { status: response.status }
      )
    }

    const result = await response.text()
    console.log('✅ [Sentry Tunnel] Événement transmis avec succès')

    return new NextResponse(result, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('💥 [Sentry Tunnel] Erreur interne:', error)
    return NextResponse.json(
      { error: 'Erreur interne du tunnel' },
      { status: 500 }
    )
  }
}

// Support OPTIONS pour CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}