"use client"

import * as Sentry from "@sentry/nextjs"

// 🚀 RÉVOLUTIONNAIRE: Système de détection automatique d'erreurs avec Sentry
export interface ErrorContext {
  errorType: 'console' | 'network' | 'performance' | 'supabase' | 'mcp'
  severity: 'critical' | 'high' | 'medium' | 'low'
  source: string
  timestamp: Date
  autoCorrection?: {
    suggested: boolean
    strategy: string
    implemented: boolean
  }
}

export interface ErrorPattern {
  pattern: RegExp
  type: ErrorContext['errorType']
  severity: ErrorContext['severity']
  autoFix?: string
}

// 🎯 Patterns d'erreurs communes Vérone Back Office
const ERROR_PATTERNS: ErrorPattern[] = [
  // Erreurs Supabase critiques
  {
    pattern: /auth\.users.*does not exist/i,
    type: 'supabase',
    severity: 'critical',
    autoFix: 'Utiliser auth.users au lieu de public.users'
  },
  {
    pattern: /permission denied.*RLS/i,
    type: 'supabase',
    severity: 'high',
    autoFix: 'Vérifier les policies RLS et permissions utilisateur'
  },
  {
    pattern: /relation.*does not exist/i,
    type: 'supabase',
    severity: 'critical',
    autoFix: 'Exécuter les migrations manquantes'
  },

  // Erreurs Network & API
  {
    pattern: /Failed to fetch/i,
    type: 'network',
    severity: 'high',
    autoFix: 'Vérifier connectivité réseau et endpoints API'
  },
  {
    pattern: /403|Forbidden/i,
    type: 'network',
    severity: 'medium',
    autoFix: 'Vérifier authentification et autorisations'
  },
  {
    pattern: /503|Service Unavailable/i,
    type: 'network',
    severity: 'critical',
    autoFix: 'Service temporairement indisponible - retry automatique'
  },

  // Erreurs Performance
  {
    pattern: /Loading chunk \d+ failed/i,
    type: 'performance',
    severity: 'medium',
    autoFix: 'Rechargement automatique de la page'
  },
  {
    pattern: /Maximum call stack/i,
    type: 'performance',
    severity: 'critical',
    autoFix: 'Récursion infinie détectée - arrêt automatique'
  },

  // Erreurs MCP Playwright
  {
    pattern: /playwright.*timeout/i,
    type: 'mcp',
    severity: 'medium',
    autoFix: 'Augmenter timeout et retry automatique'
  },
  {
    pattern: /element.*not found/i,
    type: 'mcp',
    severity: 'medium',
    autoFix: 'Attendre rendu DOM complet et sélecteur alternatif'
  }
]

// 🤖 Classificateur intelligent d'erreurs
export class SentryAutoDetector {
  private errorQueue: ErrorContext[] = []
  private consecutiveErrors = 0
  private lastErrorTime: Date | null = null
  private isClientSide: boolean

  constructor() {
    // Vérifier si on est côté client
    this.isClientSide = typeof window !== 'undefined'

    // N'initialiser QUE côté client pour éviter les erreurs SSR
    if (this.isClientSide && typeof document !== 'undefined') {
      // Attendre que le DOM soit prêt pour une initialisation sûre
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.initializeErrorInterceptors()
        })
      } else {
        this.initializeErrorInterceptors()
      }
    }
  }

  // 🔧 Initialisation des intercepteurs d'erreurs globaux (CLIENT ONLY)
  private initializeErrorInterceptors() {
    if (!this.isClientSide) return

    // Intercepteur console.error global
    const originalError = console.error
    console.error = (...args: any[]) => {
      originalError(...args)
      this.processConsoleError(args)
    }

    // Intercepteur erreurs non capturées
    window.addEventListener('error', (event) => {
      this.processUnhandledError(event.error, event.filename, event.lineno)
    })

    // Intercepteur promesses rejetées
    window.addEventListener('unhandledrejection', (event) => {
      this.processUnhandledRejection(event.reason)
    })

    // Intercepteur erreurs réseau (via fetch)
    this.setupNetworkInterceptor()
  }

  // 🌐 Intercepteur erreurs réseau (CLIENT ONLY)
  private setupNetworkInterceptor() {
    if (!this.isClientSide || !window.fetch) return

    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)

        if (!response.ok) {
          this.processNetworkError(response.status, response.statusText, args[0])
        }

        return response
      } catch (error) {
        this.processNetworkError(0, 'Network Error', args[0])
        throw error
      }
    }
  }

  // 🎯 Traitement erreur console
  private processConsoleError(args: any[]) {
    if (!this.isClientSide) return

    const errorMessage = args.join(' ')
    const errorContext = this.analyzeError(errorMessage, 'console')

    if (errorContext) {
      this.reportToSentry(errorContext, { consoleArgs: args })
      this.updateErrorMetrics()
    }
  }

  // ⚠️ Traitement erreur non gérée
  private processUnhandledError(error: any, filename?: string, lineno?: number) {
    if (!this.isClientSide) return

    const errorContext = this.analyzeError(
      error?.message || String(error),
      'console',
      { filename, lineno }
    )

    if (errorContext) {
      this.reportToSentry(errorContext, {
        unhandled: true,
        filename,
        lineno,
        stack: error?.stack
      })
      this.updateErrorMetrics()
    }
  }

  // 🚫 Traitement promesse rejetée
  private processUnhandledRejection(reason: any) {
    if (!this.isClientSide) return

    const errorContext = this.analyzeError(
      reason?.message || String(reason),
      'network'
    )

    if (errorContext) {
      this.reportToSentry(errorContext, {
        unhandledRejection: true,
        reason: reason
      })
      this.updateErrorMetrics()
    }
  }

  // 🌐 Traitement erreur réseau
  private processNetworkError(status: number, statusText: string, url: any) {
    if (!this.isClientSide) return

    const errorMessage = `${status} ${statusText} - ${url}`
    const errorContext = this.analyzeError(errorMessage, 'network')

    if (errorContext) {
      this.reportToSentry(errorContext, {
        networkError: true,
        status,
        statusText,
        url: String(url)
      })
      this.updateErrorMetrics()
    }
  }

  // 🧠 Analyse intelligente d'erreur
  private analyzeError(
    message: string,
    defaultType: ErrorContext['errorType'],
    metadata?: any
  ): ErrorContext | null {
    // Filtrer les erreurs non critiques
    const ignoredPatterns = [
      /ResizeObserver loop limit exceeded/i,
      /Non-Error promise rejection captured/i,
      /Warning:/i
    ]

    if (ignoredPatterns.some(pattern => pattern.test(message))) {
      return null
    }

    // Analyser avec patterns prédéfinis
    for (const pattern of ERROR_PATTERNS) {
      if (pattern.pattern.test(message)) {
        return {
          errorType: pattern.type,
          severity: pattern.severity,
          source: message,
          timestamp: new Date(),
          autoCorrection: {
            suggested: true,
            strategy: pattern.autoFix || 'Correction automatique non disponible',
            implemented: false
          }
        }
      }
    }

    // Classification par défaut
    return {
      errorType: defaultType,
      severity: this.determineSeverity(message),
      source: message,
      timestamp: new Date(),
      autoCorrection: {
        suggested: false,
        strategy: 'Analyse manuelle requise',
        implemented: false
      }
    }
  }

  // 📊 Détermination automatique de sévérité
  private determineSeverity(message: string): ErrorContext['severity'] {
    const criticalKeywords = ['fatal', 'crash', 'memory', 'security', 'auth', 'critical']
    const highKeywords = ['error', 'fail', 'exception', 'denied', 'forbidden']
    const mediumKeywords = ['warning', 'deprecated', 'slow', 'timeout']

    const lowerMessage = message.toLowerCase()

    if (criticalKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'critical'
    }
    if (highKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'high'
    }
    if (mediumKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'medium'
    }

    return 'low'
  }

  // 📤 Rapport automatique à Sentry
  private reportToSentry(errorContext: ErrorContext, additionalData?: any) {
    if (!this.isClientSide) return

    // Éviter le spam - max 1 erreur par seconde du même type
    if (this.lastErrorTime &&
        Date.now() - this.lastErrorTime.getTime() < 1000 &&
        this.consecutiveErrors > 3) {
      return
    }

    const sentryEventId = Sentry.captureException(new Error(errorContext.source), {
      tags: {
        error_type: errorContext.errorType,
        severity: errorContext.severity,
        auto_detected: 'true',
        verone_module: 'auto_detection'
      },
      level: errorContext.severity === 'critical' ? 'error' :
             errorContext.severity === 'high' ? 'error' : 'warning',
      contexts: {
        error_analysis: {
          type: errorContext.errorType,
          severity: errorContext.severity,
          timestamp: errorContext.timestamp.toISOString(),
          auto_correction_available: errorContext.autoCorrection?.suggested || false,
          correction_strategy: errorContext.autoCorrection?.strategy
        },
        additional_data: additionalData
      }
    })

    // Ajouter à la queue pour traitement
    this.errorQueue.push({
      ...errorContext,
      sentryEventId
    })

    this.lastErrorTime = new Date()
    this.consecutiveErrors++

    console.log('🤖 [Sentry Auto-Detection] Erreur reportée:', {
      eventId: sentryEventId,
      type: errorContext.errorType,
      severity: errorContext.severity
    })
  }

  // 📈 Mise à jour métriques d'erreurs (localStorage pour header global - CLIENT ONLY)
  private updateErrorMetrics() {
    if (!this.isClientSide || !window.localStorage) return

    try {
      const currentCount = parseInt(localStorage.getItem('sentry-error-count') || '0')
      const newCount = currentCount + 1
      localStorage.setItem('sentry-error-count', newCount.toString())

      // Trigger custom event pour mise à jour header
      window.dispatchEvent(new CustomEvent('sentry-error-detected', {
        detail: { count: newCount, timestamp: new Date() }
      }))
    } catch (error) {
      // Fallback silencieux si localStorage indisponible
      console.warn('🤖 [Sentry Auto-Detection] localStorage indisponible:', error)
    }
  }

  // 📊 Obtenir statistiques d'erreurs
  public getErrorStats() {
    return {
      totalErrors: this.errorQueue.length,
      criticalErrors: this.errorQueue.filter(e => e.severity === 'critical').length,
      recentErrors: this.errorQueue.filter(e =>
        Date.now() - e.timestamp.getTime() < 3600000 // 1h
      ),
      autoCorrectionsAvailable: this.errorQueue.filter(e =>
        e.autoCorrection?.suggested
      ).length,
      isClientSide: this.isClientSide
    }
  }

  // 🧹 Nettoyer les anciennes erreurs
  public cleanupOldErrors() {
    const oneHourAgo = Date.now() - 3600000
    this.errorQueue = this.errorQueue.filter(error =>
      error.timestamp.getTime() > oneHourAgo
    )
  }

  // 🔄 Reset compteur d'erreurs
  public resetErrorCounter() {
    this.consecutiveErrors = 0
    this.lastErrorTime = null
    this.errorQueue = []
    
    if (this.isClientSide && window.localStorage) {
      try {
        localStorage.setItem('sentry-error-count', '0')
      } catch (error) {
        // Fallback silencieux
        console.warn('🤖 [Sentry Auto-Detection] Impossible de reset localStorage:', error)
      }
    }
  }
}

// 🌟 Instance globale du détecteur (CLIENT ONLY)
export const globalSentryDetector = (() => {
  // Protection SSR complète
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null
  }

  try {
    return new SentryAutoDetector()
  } catch (error) {
    console.warn('🤖 [Sentry Auto-Detection] Erreur initialisation:', error)
    return null
  }
})()

// 🚀 Auto-initialisation (CLIENT ONLY) avec protection SSR
if (typeof window !== 'undefined' && typeof document !== 'undefined' && globalSentryDetector) {
  // Attendre que le DOM soit complètement chargé
  const initializeSystem = () => {
    try {
      console.log('🤖 [Sentry Auto-Detection] Système initialisé avec succès')

      // Nettoyage automatique toutes les heures
      setInterval(() => {
        if (globalSentryDetector) {
          globalSentryDetector.cleanupOldErrors()
        }
      }, 3600000)
    } catch (error) {
      console.warn('🤖 [Sentry Auto-Detection] Erreur auto-initialisation:', error)
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSystem)
  } else {
    // DOM déjà chargé
    initializeSystem()
  }
}