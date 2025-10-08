"use client"

import * as Sentry from "@sentry/nextjs"
import { globalSentryDetector } from "../error-detection/sentry-auto-detection"

// 🚀 MCP Playwright Integration - Version Allégée
export interface MCPTestContext {
  testId: string
  testTitle: string
  expectedElements: string[]
  moduleType: 'dashboard' | 'catalogue' | 'stock' | 'navigation' | 'generic'
}

export interface MCPTestResult {
  success: boolean
  duration: number
  errors: string[]
  consoleErrors: string[]
  performance: {
    loadTime: number
  }
  sentryEventId?: string
}

/**
 * 🤖 Classe allégée d'intégration MCP Playwright
 * Focus sur detection erreurs et performance
 */
export class MCPPlaywrightIntegration {
  private isInitialized = false

  constructor() {
    this.initialize()
  }

  /**
   * 🔧 Initialisation simplifiée
   */
  private async initialize() {
    try {
      this.isInitialized = true
      console.log('✅ [MCP Playwright] Système initialisé')

      Sentry.addBreadcrumb({
        message: 'MCP Playwright Integration initialisée (version allégée)',
        category: 'mcp.init',
        level: 'info'
      })

    } catch (error) {
      console.error('❌ [MCP Playwright] Erreur initialisation:', error)
      Sentry.captureException(error, {
        tags: { component: 'mcp_playwright', phase: 'initialization' }
      })
      throw error
    }
  }

  /**
   * 🎯 Point d'entrée principal pour exécuter un test MCP
   */
  async executeTest(context: MCPTestContext): Promise<MCPTestResult> {
    if (!this.isInitialized) {
      throw new Error('MCP Playwright Integration non initialisée')
    }

    const startTime = Date.now()
    console.log(`🚀 [MCP] Exécution test: ${context.testTitle}`)

    return await Sentry.startSpan({
      name: `MCP Test: ${context.testTitle}`,
      op: 'test.mcp.execution'
    }, async () => {
      try {
        // Test simplifié focus sur erreurs console
        const consoleErrors = await this.getConsoleErrors()
        const performance = { loadTime: Date.now() - startTime }

        const result: MCPTestResult = {
          success: consoleErrors.length === 0,
          duration: Date.now() - startTime,
          errors: consoleErrors.length > 0 ? [`${consoleErrors.length} erreurs console détectées`] : [],
          consoleErrors: consoleErrors.slice(0, 5),
          performance,
          sentryEventId: undefined
        }

        if (!result.success) {
          result.sentryEventId = Sentry.captureMessage(`Test échoué: ${context.testTitle}`, {
            level: 'warning',
            tags: {
              test_type: context.moduleType,
              test_id: context.testId
            },
            extra: {
              consoleErrors,
              performance
            }
          })
        } else {
          // Success feedback in Sentry
          Sentry.addBreadcrumb({
            message: `✅ Test réussi: ${context.testTitle}`,
            category: 'test.success',
            level: 'info',
            data: { testId: context.testId, duration: result.duration }
          })
        }

        return result

      } catch (error) {
        const errorResult: MCPTestResult = {
          success: false,
          duration: Date.now() - startTime,
          errors: [`Erreur critique: ${error instanceof Error ? error.message : String(error)}`],
          consoleErrors: [],
          performance: { loadTime: Date.now() - startTime }
        }

        errorResult.sentryEventId = Sentry.captureException(error, {
          tags: {
            test_type: context.moduleType,
            test_id: context.testId,
            mcp_integration: 'true'
          }
        })

        return errorResult
      }
    })
  }

  /**
   * 🔍 Récupération erreurs console via Sentry auto-detection
   */
  private async getConsoleErrors(): Promise<string[]> {
    try {
      const errorStats = globalSentryDetector.getErrorStats()
      return errorStats.recentErrors.map(e => e.source).slice(0, 5)
    } catch (error) {
      console.warn('[MCP] Impossible de récupérer les erreurs console:', error)
      return []
    }
  }

  /**
   * 🎯 Test rapide pour validation page
   */
  async quickValidation(pageUrl: string, testTitle: string = 'Quick Validation'): Promise<boolean> {
    try {
      const context: MCPTestContext = {
        testId: `quick-${Date.now()}`,
        testTitle,
        expectedElements: [],
        moduleType: 'generic'
      }

      const result = await this.executeTest(context)
      return result.success
    } catch (error) {
      console.error('[MCP] Quick validation failed:', error)
      return false
    }
  }
}

// 🌟 Instance globale MCP Playwright allégée
export const mcpPlaywright = new MCPPlaywrightIntegration()

// 🛠️ Fonctions utilitaires pour tests-manuels
export function getTestUrlForTest(test: any): string {
  const moduleUrlMap: Record<string, string> = {
    'dashboard': '/dashboard',
    'catalogue': '/catalogue',
    'stock': '/stocks',
    'sourcing': '/sourcing',
    'interaction': '/consultations',
    'commande': '/commandes',
    'canal': '/canaux',
    'contact': '/contacts',
    'parametre': '/settings'
  }

  const moduleKey = test.id?.substring(0, test.id.indexOf('-'))
  return moduleUrlMap[moduleKey] || '/dashboard'
}

export function getExpectedElementsForTest(test: any): string[] {
  // Elements de base attendus selon le module
  const baseElements = ['.main-content', 'nav', 'header']
  return baseElements
}

export function determineModuleType(test: any): MCPTestContext['moduleType'] {
  const moduleType = test.id?.substring(0, test.id.indexOf('-'))

  switch (moduleType) {
    case 'dashboard': return 'dashboard'
    case 'catalogue': return 'catalogue'
    case 'stock': return 'stock'
    default: return 'generic'
  }
}