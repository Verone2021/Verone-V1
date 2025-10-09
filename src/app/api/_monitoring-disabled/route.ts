/**
 * 🔒 Sentry Tunnel Endpoint - Vérone Back Office
 *
 * Endpoint pour contourner les Content Security Policy et ad-blockers
 * en routant les événements Sentry à travers notre serveur
 *
 * @see https://docs.sentry.io/platforms/javascript/troubleshooting/#dealing-with-ad-blockers
 */

import { NextRequest, NextResponse } from 'next/server'

// Configuration Sentry pour le tunnel
const SENTRY_HOST = 'o4510076285943808.ingest.de.sentry.io'
const SENTRY_PROJECT_IDS = ['4510076999762000'] // Project ID from DSN

export async function POST(request: NextRequest) {
  try {
    const envelope = await request.text()

    // Parse l'envelope Sentry pour extraire les headers
    const pieces = envelope.split('\n')
    const header = JSON.parse(pieces[0])

    // Vérification que c'est bien pour notre projet Sentry
    const projectId = header.dsn?.split('/').pop()
    if (!SENTRY_PROJECT_IDS.includes(projectId)) {
      console.warn(`[Sentry Tunnel] Unauthorized project ID: ${projectId}`)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Forward vers Sentry
    const sentryUrl = `https://${SENTRY_HOST}/api/${projectId}/envelope/`

    const response = await fetch(sentryUrl, {
      method: 'POST',
      body: envelope,
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'User-Agent': request.headers.get('user-agent') || 'verone-back-office/1.0.0',
      },
    })

    // Log pour debug en développement
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Sentry Tunnel] ${response.status} - ${response.statusText}`)
    }

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    })

  } catch (error) {
    console.error('[Sentry Tunnel] Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// Support pour les autres méthodes HTTP si nécessaire
export async function GET() {
  return NextResponse.json({
    status: 'Sentry tunnel active',
    project: 'verone-back-office',
    host: SENTRY_HOST
  })
}