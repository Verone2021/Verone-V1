/**
 * 🚀 RÉVOLUTIONNAIRE: API Route Sentry Unifiée - Vérone Back Office 2025
 *
 * Route sécurisée avec retry intelligent, validation robuste et cache
 * Compatible avec le hook useSentryUnified pour synchronisation parfaite
 * Meilleures pratiques Sentry.io implémentées
 */

import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

// 🔧 Configuration Sentry robuste avec validation
const SENTRY_API_URL = 'https://sentry.io/api/0' // URL officielle (pas de.sentry.io)
const SENTRY_ORG = process.env.SENTRY_ORG || 'verone'
const SENTRY_PROJECT = process.env.SENTRY_PROJECT_ID || '4510095142289488' // Configurable via env
const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN

// 🚀 Configuration retry et cache
const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 4000] // Exponential backoff
const CACHE_TTL = 30000 // 30 secondes de cache

// 📊 Cache simple en mémoire
interface CacheEntry {
  data: any
  timestamp: number
}

const cache = new Map<string, CacheEntry>()

// 🔍 Validation robuste de la configuration
function validateSentryConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!SENTRY_AUTH_TOKEN || SENTRY_AUTH_TOKEN.length < 10) {
    errors.push('SENTRY_AUTH_TOKEN manquant ou invalide')
  }

  if (!SENTRY_ORG || SENTRY_ORG.length < 2) {
    errors.push('SENTRY_ORG manquant ou invalide')
  }

  if (!SENTRY_PROJECT || SENTRY_PROJECT.length < 5) {
    errors.push('SENTRY_PROJECT_ID manquant ou invalide')
  }

  return { isValid: errors.length === 0, errors }
}

// 🔄 Fonction retry intelligente avec exponential backoff
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retryCount = 0
): Promise<Response> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    // Si la réponse est OK, on retourne
    if (response.ok) {
      return response
    }

    // Si c'est une erreur client (4xx), pas de retry
    if (response.status >= 400 && response.status < 500) {
      console.error(`❌ [API Sentry] Erreur client ${response.status}: ${response.statusText}`)
      throw new Error(`Erreur client Sentry: ${response.status} ${response.statusText}`)
    }

    // Si c'est une erreur serveur (5xx) et qu'on peut retry
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAYS[retryCount] || 4000
      console.warn(`⏳ [API Sentry] Retry ${retryCount + 1}/${MAX_RETRIES} dans ${delay}ms`)

      await new Promise(resolve => setTimeout(resolve, delay))
      return fetchWithRetry(url, options, retryCount + 1)
    }

    throw new Error(`Erreur serveur Sentry après ${MAX_RETRIES} tentatives: ${response.status}`)

  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Timeout API Sentry (10s)')
    }

    if (retryCount < MAX_RETRIES && !error.message.includes('client')) {
      const delay = RETRY_DELAYS[retryCount] || 4000
      console.warn(`⏳ [API Sentry] Retry network ${retryCount + 1}/${MAX_RETRIES} dans ${delay}ms`)

      await new Promise(resolve => setTimeout(resolve, delay))
      return fetchWithRetry(url, options, retryCount + 1)
    }

    throw error
  }
}

// 📊 Cache intelligent avec TTL
function getCachedData(key: string): any | null {
  const entry = cache.get(key)
  if (!entry) return null

  const now = Date.now()
  if (now - entry.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }

  return entry.data
}

function setCachedData(key: string, data: any): void {
  cache.set(key, {
    data,
    timestamp: Date.now()
  })

  // Nettoyage automatique du cache (max 100 entries)
  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value
    cache.delete(oldestKey)
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const cacheKey = `sentry-issues-${SENTRY_ORG}-${SENTRY_PROJECT}`

  try {
    // 🔍 Validation robuste de la configuration
    const validation = validateSentryConfig()
    if (!validation.isValid) {
      console.error('❌ [API Sentry] Configuration invalide:', validation.errors)
      return NextResponse.json(
        {
          error: 'Configuration Sentry invalide',
          details: validation.errors,
          isConnected: false
        },
        { status: 500 }
      )
    }

    // 📊 Vérifier le cache d'abord
    const cachedData = getCachedData(cacheKey)
    if (cachedData) {
      console.log('✅ [API Sentry] Données servies depuis le cache')
      return NextResponse.json({
        ...cachedData,
        fromCache: true,
        responseTime: Date.now() - startTime
      })
    }

    console.log('🚀 [API Sentry] Récupération depuis l\'API officielle...')

    // 🔄 Récupération avec retry intelligent
    const issuesResponse = await fetchWithRetry(
      `${SENTRY_API_URL}/organizations/${SENTRY_ORG}/issues/`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SENTRY_AUTH_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Verone-BackOffice/1.0.0'
        }
      }
    )

    // Test de connectivité avec l'API
    const testResponse = await fetchWithRetry(
      `${SENTRY_API_URL}/organizations/${SENTRY_ORG}/`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SENTRY_AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!testResponse.ok) {
      throw new Error(`Test connectivité échoué: ${testResponse.status}`)
    }

    const issues = await issuesResponse.json()

    // 🧮 Calcul des statistiques avancées
    const now = new Date()
    const last24h = now.getTime() - (24 * 60 * 60 * 1000)
    const last1h = now.getTime() - (60 * 60 * 1000)

    const stats = {
      totalIssues: issues.length,
      unresolvedCount: issues.filter((i: any) => i.status === 'unresolved').length,
      last24hCount: issues.filter((i: any) => {
        const lastSeen = new Date(i.lastSeen).getTime()
        return lastSeen > last24h
      }).length,
      last1hCount: issues.filter((i: any) => {
        const lastSeen = new Date(i.lastSeen).getTime()
        return lastSeen > last1h
      }).length,
      criticalCount: issues.filter((i: any) =>
        i.level === 'error' || i.level === 'fatal' || i.priority === 'high'
      ).length,
      affectedUsers: issues.reduce((sum: number, i: any) => sum + (i.userCount || 0), 0)
    }

    // 📦 Préparer la réponse complète
    const responseData = {
      issues: issues.slice(0, 50), // Limiter à 50 pour la performance
      stats,
      isConnected: true,
      apiHealth: 'ok' as const,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      fromCache: false
    }

    // 💾 Mettre en cache pour les prochaines requêtes
    setCachedData(cacheKey, responseData)

    console.log('✅ [API Sentry] Récupération réussie:', {
      totalIssues: stats.totalIssues,
      unresolvedCount: stats.unresolvedCount,
      responseTime: responseData.responseTime,
      cached: false
    })

    return NextResponse.json(responseData)

  } catch (error: any) {
    const responseTime = Date.now() - startTime
    console.error('💥 [API Sentry] Erreur récupération:', error.message)

    // 📊 Réponse d'erreur détaillée avec fallback
    const errorResponse = {
      error: 'Erreur lors de la récupération des données Sentry',
      errorType: error.message.includes('Timeout') ? 'timeout' :
                error.message.includes('client') ? 'client_error' :
                error.message.includes('serveur') ? 'server_error' : 'unknown',
      details: error.message,
      issues: [],
      stats: {
        totalIssues: 0,
        unresolvedCount: 0,
        last24hCount: 0,
        last1hCount: 0,
        criticalCount: 0,
        affectedUsers: 0
      },
      isConnected: false,
      apiHealth: 'error' as const,
      timestamp: new Date().toISOString(),
      responseTime,
      fromCache: false
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// 🚀 Endpoint amélioré pour tests Sentry et validation connectivité
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const {
      message = 'Test error from Vérone Dashboard',
      level = 'error',
      action = 'test' // 'test' | 'validate' | 'ping'
    } = body

    // 🔍 Validation de la configuration avant test
    const validation = validateSentryConfig()
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Configuration Sentry invalide',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    // 🎯 Action selon le type de requête
    switch (action) {
      case 'validate':
        // Test de connectivité API uniquement
        try {
          const testResponse = await fetchWithRetry(
            `${SENTRY_API_URL}/organizations/${SENTRY_ORG}/`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${SENTRY_AUTH_TOKEN}`,
                'Content-Type': 'application/json'
              }
            }
          )

          return NextResponse.json({
            success: true,
            connected: testResponse.ok,
            status: testResponse.status,
            organization: SENTRY_ORG,
            responseTime: Date.now() - startTime
          })
        } catch (error: any) {
          return NextResponse.json({
            success: false,
            connected: false,
            error: error.message,
            responseTime: Date.now() - startTime
          }, { status: 503 })
        }

      case 'ping':
        // Ping simple de santé
        return NextResponse.json({
          success: true,
          pong: true,
          timestamp: new Date().toISOString(),
          config: {
            org: SENTRY_ORG,
            hasToken: !!SENTRY_AUTH_TOKEN,
            project: SENTRY_PROJECT
          }
        })

      default:
        // Test d'envoi d'erreur par défaut
        const eventId = Sentry.captureMessage(message, {
          level: level as any,
          tags: {
            source: 'api_test',
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development'
          },
          contexts: {
            test: {
              timestamp: new Date().toISOString(),
              responseTime: Date.now() - startTime,
              action: 'manual_test'
            }
          }
        })

        console.log('✅ [API Sentry] Message test envoyé:', {
          message,
          level,
          eventId,
          responseTime: Date.now() - startTime
        })

        return NextResponse.json({
          success: true,
          message: 'Erreur de test envoyée à Sentry',
          eventId,
          sentryUrl: `https://sentry.io/organizations/${SENTRY_ORG}/issues/`,
          responseTime: Date.now() - startTime
        })
    }

  } catch (error: any) {
    console.error('💥 [API Sentry POST] Erreur:', error.message)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de l\'envoi du test',
        details: error.message,
        responseTime: Date.now() - startTime
      },
      { status: 500 }
    )
  }
}