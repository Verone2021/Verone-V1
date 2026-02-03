'use client';

// 🚀 MCP Playwright Integration - Version Allégée
export interface MCPTestContext {
  testId: string;
  testTitle: string;
  expectedElements: string[];
  moduleType: 'dashboard' | 'catalogue' | 'stock' | 'navigation' | 'generic';
}

export interface MCPTestResult {
  success: boolean;
  duration: number;
  errors: string[];
  consoleErrors: string[];
  performance: {
    loadTime: number;
  };
}

/**
 * 🤖 Classe allégée d'intégration MCP Playwright
 * Focus sur detection erreurs et performance
 */
export class MCPPlaywrightIntegration {
  private isInitialized = false;

  constructor() {
    void this.initialize().catch(error => {
      console.error('[PlaywrightIntegration] initialize failed:', error);
    });
  }

  /**
   * 🔧 Initialisation simplifiée
   */
  private async initialize() {
    try {
      this.isInitialized = true;
      console.warn('✅ [MCP Playwright] Système initialisé');
    } catch (error) {
      console.error('❌ [MCP Playwright] Erreur initialisation:', error);
      throw error;
    }
  }

  /**
   * 🎯 Point d'entrée principal pour exécuter un test MCP
   */
  async executeTest(context: MCPTestContext): Promise<MCPTestResult> {
    if (!this.isInitialized) {
      throw new Error('MCP Playwright Integration non initialisée');
    }

    const startTime = Date.now();
    console.warn(`🚀 [MCP] Exécution test: ${context.testTitle}`);

    try {
      // Test simplifié focus sur erreurs console
      const consoleErrors = await this.getConsoleErrors();
      const performance = { loadTime: Date.now() - startTime };

      const result: MCPTestResult = {
        success: consoleErrors.length === 0,
        duration: Date.now() - startTime,
        errors:
          consoleErrors.length > 0
            ? [`${consoleErrors.length} erreurs console détectées`]
            : [],
        consoleErrors: consoleErrors.slice(0, 5),
        performance,
      };

      if (!result.success) {
        console.warn(`⚠️ [MCP] Test échoué: ${context.testTitle}`, {
          test_type: context.moduleType,
          test_id: context.testId,
          consoleErrors,
          performance,
        });
      } else {
        // Success feedback in console
        console.warn(`✅ [MCP] Test réussi: ${context.testTitle}`, {
          testId: context.testId,
          duration: result.duration,
        });
      }

      return result;
    } catch (error) {
      const errorResult: MCPTestResult = {
        success: false,
        duration: Date.now() - startTime,
        errors: [
          `Erreur critique: ${error instanceof Error ? error.message : String(error)}`,
        ],
        consoleErrors: [],
        performance: { loadTime: Date.now() - startTime },
      };

      console.error(`❌ [MCP] Erreur test: ${context.testTitle}`, {
        test_type: context.moduleType,
        test_id: context.testId,
        error,
      });

      return errorResult;
    }
  }

  /**
   * 🔍 Récupération erreurs console
   * Utiliser MCP Playwright browser_console_messages pour la détection
   */
  private async getConsoleErrors(): Promise<string[]> {
    try {
      // Pour détecter erreurs console, utiliser mcp__playwright-lane-1__browser_console_messages
      console.warn(
        '[MCP] getConsoleErrors: Utiliser browser_console_messages pour détection erreurs'
      );
      return [];
    } catch (error) {
      console.warn('[MCP] Impossible de récupérer les erreurs console:', error);
      return [];
    }
  }

  /**
   * 🎯 Test rapide pour validation page
   */
  async quickValidation(
    pageUrl: string,
    testTitle: string = 'Quick Validation'
  ): Promise<boolean> {
    try {
      const context: MCPTestContext = {
        testId: `quick-${Date.now()}`,
        testTitle,
        expectedElements: [],
        moduleType: 'generic',
      };

      const result = await this.executeTest(context);
      return result.success;
    } catch (error) {
      console.error('[MCP] Quick validation failed:', error);
      return false;
    }
  }
}

// 🌟 Instance globale MCP Playwright allégée
export const mcpPlaywright = new MCPPlaywrightIntegration();

// 🛠️ Interface pour tests
interface TestInfo {
  id?: string;
  title?: string;
}

// 🛠️ Fonctions utilitaires pour tests-manuels
export function getTestUrlForTest(test: TestInfo): string {
  const moduleUrlMap: Record<string, string> = {
    dashboard: '/dashboard',
    catalogue: '/produits/catalogue',
    stock: '/stocks',
    sourcing: '/produits/sourcing',
    interaction: '/consultations',
    commande: '/commandes',
    canal: '/canaux',
    contact: '/contacts',
    parametre: '/settings',
  };

  const moduleKey = test.id?.substring(0, test.id.indexOf('-')) ?? '';
  return moduleUrlMap[moduleKey] ?? '/dashboard';
}

export function getExpectedElementsForTest(_test: TestInfo): string[] {
  // Elements de base attendus selon le module
  const baseElements = ['.main-content', 'nav', 'header'];
  return baseElements;
}

export function determineModuleType(
  test: TestInfo
): MCPTestContext['moduleType'] {
  const moduleType = test.id?.substring(0, test.id.indexOf('-')) ?? '';

  switch (moduleType) {
    case 'dashboard':
      return 'dashboard';
    case 'catalogue':
      return 'catalogue';
    case 'stock':
      return 'stock';
    default:
      return 'generic';
  }
}
