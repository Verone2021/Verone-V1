/**
 * 🔗 ERROR REPORTING INTEGRATION - HOOK CROSS-MODULE
 *
 * Hook d'intégration pour connecter le système Error Reporting Intelligent
 * avec les modules Dashboard, Catalogue, et Stocks
 *
 * @author Vérone System Orchestrator
 * @version 2.0 - Révolutionnaire
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useErrorProcessingQueue } from '@/lib/error-detection/error-processing-queue'
import { veroneErrorDetector } from '@/lib/error-detection/verone-error-system'
import type { VeroneError } from '@/lib/error-detection/verone-error-system'
import type { QueueMetrics } from '@/lib/error-detection/error-processing-queue'

/**
 * 🎯 TYPES D'INTÉGRATION
 */
export interface ModuleErrorContext {
  module_name: string
  current_route: string
  active_operations: string[]
  user_context: {
    user_id?: string
    session_id: string
    last_action: string
    timestamp: Date
  }
  performance_context: {
    page_load_time?: number
    api_response_times: Record<string, number>
    memory_usage?: number
  }
}

export interface ErrorReportingIntegration {
  // 📊 Status & Metrics
  isActive: boolean
  metrics: QueueMetrics
  criticalErrorsCount: number
  lastDetectionTime?: Date

  // 🎯 Actions
  reportError: (error: VeroneError, context?: Partial<ModuleErrorContext>) => Promise<string>
  detectAndReportModuleErrors: (moduleName: string) => Promise<VeroneError[]>
  enableAutoDetection: (moduleName: string) => void
  disableAutoDetection: () => void

  // 🔍 Monitoring
  getModuleErrorStats: (moduleName: string) => {
    total_errors: number
    resolved_errors: number
    pending_errors: number
    success_rate: number
  }

  // 🚨 Alertes
  getCriticalAlerts: () => {
    message: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    module: string
    timestamp: Date
  }[]
}

/**
 * 🚀 HOOK PRINCIPAL : Intégration Error Reporting
 */
export function useErrorReportingIntegration(moduleName: string): ErrorReportingIntegration {
  // 🔗 Hooks système
  const {
    metrics,
    isRunning,
    enqueueError
  } = useErrorProcessingQueue()

  // 📊 État local
  const [isActive, setIsActive] = useState(false)
  const [criticalErrorsCount, setCriticalErrorsCount] = useState(0)
  const [lastDetectionTime, setLastDetectionTime] = useState<Date>()
  const [moduleErrors, setModuleErrors] = useState<VeroneError[]>([])

  // 🔄 Références pour monitoring
  const detectionInterval = useRef<NodeJS.Timeout>()
  const moduleContext = useRef<ModuleErrorContext>({
    module_name: moduleName,
    current_route: typeof window !== 'undefined' ? window.location.pathname : '',
    active_operations: [],
    user_context: {
      session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      last_action: 'page_load',
      timestamp: new Date()
    },
    performance_context: {
      api_response_times: {}
    }
  })

  /**
   * 🎯 DÉTECTION AUTO : Module-spécifique
   */
  const detectAndReportModuleErrors = useCallback(async (targetModule: string): Promise<VeroneError[]> => {
    try {
      console.log(`🔍 Détection erreurs module: ${targetModule}`)

      // 🔍 Détection complète tous layers
      const detectedErrors = await veroneErrorDetector.detectAllErrors()

      // 🎯 Filtrer pour le module ciblé
      const moduleSpecificErrors = detectedErrors.filter(error =>
        error.module === targetModule ||
        error.context.url?.includes(`/${targetModule}`) ||
        error.message.toLowerCase().includes(targetModule.toLowerCase())
      )

      // 📊 Mise à jour contexte module
      updateModuleContext({
        module_name: targetModule,
        active_operations: [`detection_${Date.now()}`]
      })

      // 📥 Enqueue pour traitement
      for (const error of moduleSpecificErrors) {
        const enhancedError = enhanceErrorWithModuleContext(error, moduleContext.current)
        await enqueueError(enhancedError, calculateModulePriority(error, targetModule))
      }

      setModuleErrors(prev => [...prev, ...moduleSpecificErrors])
      setLastDetectionTime(new Date())

      console.log(`✅ Détection terminée: ${moduleSpecificErrors.length} erreurs trouvées pour ${targetModule}`)
      return moduleSpecificErrors

    } catch (detectionError) {
      console.error(`❌ Erreur détection module ${targetModule}:`, detectionError)
      return []
    }
  }, [enqueueError])

  /**
   * 🚨 REPORT MANUEL : Signaler une erreur spécifique
   */
  const reportError = useCallback(async (
    error: VeroneError,
    context?: Partial<ModuleErrorContext>
  ): Promise<string> => {
    try {
      // 🔄 Fusionner contexte
      const mergedContext = {
        ...moduleContext.current,
        ...context
      }

      // 🎯 Enrichir erreur avec contexte module
      const enrichedError = enhanceErrorWithModuleContext(error, mergedContext)

      // 📥 Enqueue avec priorité calculée
      const taskId = await enqueueError(
        enrichedError,
        calculateModulePriority(error, moduleName)
      )

      console.log(`📝 Erreur reportée: ${taskId} pour module ${moduleName}`)
      return taskId

    } catch (reportError) {
      console.error('❌ Erreur lors du report:', reportError)
      throw reportError
    }
  }, [enqueueError, moduleName])

  /**
   * ⚡ AUTO-DÉTECTION : Activer monitoring continu
   */
  const enableAutoDetection = useCallback((targetModule: string) => {
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current)
    }

    console.log(`🚀 Activation auto-détection pour ${targetModule}`)
    setIsActive(true)

    // 🔄 Détection périodique toutes les 30s
    detectionInterval.current = setInterval(() => {
      if (isRunning) {
        detectAndReportModuleErrors(targetModule)
      }
    }, 30000)

    // 🎯 Détection immédiate
    detectAndReportModuleErrors(targetModule)
  }, [detectAndReportModuleErrors, isRunning])

  /**
   * 🛑 DÉSACTIVATION : Arrêter monitoring
   */
  const disableAutoDetection = useCallback(() => {
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current)
      detectionInterval.current = undefined
    }

    setIsActive(false)
    console.log(`⏸️ Auto-détection désactivée pour ${moduleName}`)
  }, [moduleName])

  /**
   * 📊 STATS MODULE : Statistiques spécifiques au module
   */
  const getModuleErrorStats = useCallback((targetModule: string) => {
    const moduleSpecificErrors = moduleErrors.filter(e => e.module === targetModule)

    return {
      total_errors: moduleSpecificErrors.length,
      resolved_errors: moduleSpecificErrors.filter(e => e.resolution_status === 'resolved').length,
      pending_errors: moduleSpecificErrors.filter(e => e.resolution_status === 'pending').length,
      success_rate: moduleSpecificErrors.length > 0
        ? Math.round((moduleSpecificErrors.filter(e => e.resolution_status === 'resolved').length / moduleSpecificErrors.length) * 100)
        : 100
    }
  }, [moduleErrors])

  /**
   * 🚨 ALERTES CRITIQUES : Alertes module-spécifiques
   */
  const getCriticalAlerts = useCallback(() => {
    const criticalErrors = moduleErrors.filter(e => e.severity === 'critical')

    return criticalErrors.map(error => ({
      message: `Erreur critique ${error.module}: ${error.message.substring(0, 100)}`,
      severity: 'critical' as const,
      module: error.module,
      timestamp: error.context.timestamp
    })).slice(0, 5) // Max 5 alertes critiques
  }, [moduleErrors])

  /**
   * 🔄 MISE À JOUR CONTEXTE : Contextualisation dynamique
   */
  const updateModuleContext = useCallback((updates: Partial<ModuleErrorContext>) => {
    moduleContext.current = {
      ...moduleContext.current,
      ...updates,
      user_context: {
        ...moduleContext.current.user_context,
        ...updates.user_context,
        timestamp: new Date()
      }
    }
  }, [])

  /**
   * 📊 MONITORING PERFORMANCE : Tracking performance module
   */
  const trackModulePerformance = useCallback((operation: string, duration: number) => {
    moduleContext.current.performance_context.api_response_times[operation] = duration

    // 🚨 Auto-report si performance dégradée
    if (duration > 5000) { // >5s considéré comme lent
      const performanceError: VeroneError = {
        id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'performance' as any,
        severity: 'high' as any,
        module: moduleName,
        message: `Slow operation detected: ${operation} took ${duration}ms`,
        context: {
          url: window.location.href,
          user_action: operation,
          timestamp: new Date(),
          browser: navigator.userAgent,
          session_id: moduleContext.current.user_context.session_id
        },
        fix_priority: 7,
        estimated_fix_time: '2h',
        mcp_tools_needed: ['mcp__playwright__browser_evaluate', 'mcp__supabase__get_advisors'],
        auto_fixable: false,
        resolution_status: 'pending'
      }

      reportError(performanceError)
    }
  }, [moduleName, reportError])

  /**
   * 🔄 EFFECTS : Initialisation et cleanup
   */
  useEffect(() => {
    // 🚀 Auto-activation pour modules critiques
    const criticalModules = ['dashboard', 'catalogue', 'stocks']
    if (criticalModules.includes(moduleName.toLowerCase())) {
      enableAutoDetection(moduleName)
    }

    // 📊 Mise à jour contexte initial
    updateModuleContext({
      module_name: moduleName,
      current_route: window.location.pathname
    })

    // 🧹 Cleanup
    return () => {
      disableAutoDetection()
    }
  }, [moduleName, enableAutoDetection, disableAutoDetection, updateModuleContext])

  // 📊 Mise à jour compteur erreurs critiques
  useEffect(() => {
    const criticalCount = moduleErrors.filter(e => e.severity === 'critical').length
    setCriticalErrorsCount(criticalCount)
  }, [moduleErrors])

  // 🔍 Monitoring changements de route
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleRouteChange = () => {
        updateModuleContext({
          current_route: window.location.pathname,
          user_context: {
            last_action: 'navigation',
            timestamp: new Date()
          }
        })
      }

      window.addEventListener('popstate', handleRouteChange)
      return () => window.removeEventListener('popstate', handleRouteChange)
    }
  }, [updateModuleContext])

  return {
    // 📊 Status & Metrics
    isActive,
    metrics,
    criticalErrorsCount,
    lastDetectionTime,

    // 🎯 Actions
    reportError,
    detectAndReportModuleErrors,
    enableAutoDetection,
    disableAutoDetection,

    // 🔍 Monitoring
    getModuleErrorStats,

    // 🚨 Alertes
    getCriticalAlerts
  }
}

/**
 * 🎯 HELPERS : Fonctions utilitaires
 */

/**
 * 🔧 ENRICHISSEMENT : Ajouter contexte module à l'erreur
 */
function enhanceErrorWithModuleContext(
  error: VeroneError,
  context: ModuleErrorContext
): VeroneError {
  return {
    ...error,
    module: context.module_name,
    context: {
      ...error.context,
      module_route: context.current_route,
      active_operations: context.active_operations,
      session_context: context.user_context,
      performance_data: context.performance_context
    }
  }
}

/**
 * 📊 PRIORITÉ : Calcul priorité basée sur module
 */
function calculateModulePriority(error: VeroneError, moduleName: string): number {
  let priority = 5 // Base

  // 🏢 Modules business critiques
  const criticalModules = {
    'catalogue': 3,   // +3 priorité
    'stocks': 3,      // +3 priorité
    'commandes': 4,   // +4 priorité (plus critique)
    'dashboard': 2    // +2 priorité
  }

  priority += criticalModules[moduleName.toLowerCase()] || 0

  // 🚨 Boost sévérité
  if (error.severity === 'critical') priority += 4
  else if (error.severity === 'high') priority += 2

  // ⚡ Boost auto-fixable
  if (error.auto_fixable) priority += 1

  return Math.max(1, Math.min(10, priority))
}

/**
 * 🎛️ HOOKS SPÉCIALISÉS : Hooks pour modules spécifiques
 */

/**
 * 📊 DASHBOARD INTEGRATION
 */
export function useDashboardErrorReporting() {
  const integration = useErrorReportingIntegration('dashboard')

  return {
    ...integration,
    // Dashboard-specific methods
    reportDashboardLoadError: (loadTime: number) => {
      if (loadTime > 3000) { // Dashboard SLO: <3s
        const error: VeroneError = {
          id: `dashboard_load_${Date.now()}`,
          type: 'performance' as any,
          severity: 'high' as any,
          module: 'dashboard',
          message: `Dashboard load time exceeded SLO: ${loadTime}ms (target: <3s)`,
          context: {
            url: '/dashboard',
            user_action: 'dashboard_load',
            timestamp: new Date(),
            browser: navigator.userAgent,
            session_id: `dash_${Date.now()}`
          },
          fix_priority: 8,
          estimated_fix_time: '1h',
          mcp_tools_needed: ['mcp__playwright__browser_evaluate'],
          auto_fixable: false,
          resolution_status: 'pending'
        }

        return integration.reportError(error)
      }
    }
  }
}

/**
 * 📦 CATALOGUE INTEGRATION
 */
export function useCatalogueErrorReporting() {
  const integration = useErrorReportingIntegration('catalogue')

  return {
    ...integration,
    // Catalogue-specific methods
    reportProductLoadError: (productId: string, error: Error) => {
      const veroneError: VeroneError = {
        id: `catalogue_product_${productId}_${Date.now()}`,
        type: 'console' as any,
        severity: 'high' as any,
        module: 'catalogue',
        message: `Failed to load product ${productId}: ${error.message}`,
        context: {
          url: `/catalogue/${productId}`,
          user_action: 'product_load',
          timestamp: new Date(),
          browser: navigator.userAgent,
          session_id: `cat_${Date.now()}`,
          product_context: { product_id: productId }
        },
        fix_priority: 7,
        estimated_fix_time: '30min',
        mcp_tools_needed: ['mcp__supabase__get_logs', 'mcp__serena__find_symbol'],
        auto_fixable: true,
        resolution_status: 'pending'
      }

      return integration.reportError(veroneError)
    }
  }
}

/**
 * 📦 STOCKS INTEGRATION
 */
export function useStocksErrorReporting() {
  const integration = useErrorReportingIntegration('stocks')

  return {
    ...integration,
    // Stocks-specific methods
    reportStockMovementError: (movementData: any, error: Error) => {
      const veroneError: VeroneError = {
        id: `stocks_movement_${Date.now()}`,
        type: 'console' as any,
        severity: 'critical' as any, // Stock errors are critical for business
        module: 'stocks',
        message: `Stock movement failed: ${error.message}`,
        context: {
          url: '/stocks',
          user_action: 'stock_movement',
          timestamp: new Date(),
          browser: navigator.userAgent,
          session_id: `stock_${Date.now()}`,
          movement_data: movementData
        },
        fix_priority: 9,
        estimated_fix_time: '45min',
        mcp_tools_needed: ['mcp__supabase__execute_sql', 'mcp__supabase__get_advisors'],
        auto_fixable: false,
        resolution_status: 'pending'
      }

      return integration.reportError(veroneError)
    }
  }
}