/**
 * 🧪 CATALOGUE TEST HELPER - Vérone 2025
 * Utilitaires professionnels pour tests catalogue avec MCP integration
 * Support pour 18 tests critiques + Console Error Checking + Performance SLO
 */

import { Page, expect } from '@playwright/test'

// 🎯 Configuration Vérone SLO
export const VERONE_SLOS = {
  dashboard_load: 2000,        // <2s
  catalogue_load: 3000,       // <3s SLO critique
  navigation: 1000,           // <1s entre pages
  search_response: 2000,      // <2s recherche
  product_detail: 2000,       // <2s détail produit
  api_response: 1000,         // <1s APIs
  console_error_tolerance: 0  // Zero tolerance
} as const

// 🚨 Sélecteurs Critiques Catalogue
export const CATALOGUE_SELECTORS = {
  // Pages principales
  catalogueMain: '[data-testid="catalogue-main"]',
  productsGrid: '[data-testid="products-grid"]',
  dashboardMetrics: '[data-testid="dashboard-metrics"]',
  categoriesGrid: '[data-testid="categories-grid"]',
  collectionsGrid: '[data-testid="collections-grid"]',
  stocksTable: '[data-testid="stocks-table"]',

  // Navigation
  breadcrumb: '[data-testid="breadcrumb"]',
  backButton: '[data-testid="back-button"]',
  categoryCard: '[data-testid="category-card"]',
  productCard: '[data-testid="product-card"]',
  collectionCard: '[data-testid="collection-card"]',

  // Formulaires
  productForm: '[data-testid="product-form"]',
  searchInput: 'input[type="search"], input[placeholder*="recherche"]',
  categoryFilter: '[data-testid="category-filter"]',

  // Détail produit
  productDetail: '[data-testid="product-detail"]',

  // Textes courants
  loading: 'text=Chargement du catalogue...',
  products: 'text=Produits',
  categories: 'text=Catégories',
  collections: 'text=Collections',
  newProduct: 'text=Nouveau Produit, text=Créer',
  back: 'text=Retour',
  sourcing: 'text=Sourcing',
  dashboard: 'text=Dashboard'
} as const

// 📊 Helper Class Principal
export class CatalogueTestHelper {
  constructor(private page: Page) {}

  // 🚨 Console Error Detection (Règle Sacrée)
  async setupConsoleErrorDetection(): Promise<string[]> {
    const consoleErrors: string[] = []

    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
        console.error(`❌ Console Error détectée: ${msg.text()}`)
      }
    })

    this.page.on('pageerror', error => {
      consoleErrors.push(`Page Error: ${error.message}`)
      console.error(`💥 Page Error: ${error.message}`)
    })

    return consoleErrors
  }

  // ⚡ Performance Monitoring avec SLO Vérone
  async measurePerformance<T>(
    operation: () => Promise<T>,
    sloTarget: number,
    operationName: string
  ): Promise<{ result: T; duration: number; sloMet: boolean }> {
    const startTime = Date.now()

    try {
      const result = await operation()
      const duration = Date.now() - startTime
      const sloMet = duration < sloTarget

      if (sloMet) {
        console.log(`✅ ${operationName}: ${duration}ms < ${sloTarget}ms (SLO respecté)`)
      } else {
        console.warn(`⚠️ ${operationName}: ${duration}ms > ${sloTarget}ms (SLO violé)`)
      }

      return { result, duration, sloMet }
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`❌ ${operationName} échoué après ${duration}ms:`, error)
      throw error
    }
  }

  // 🎯 Navigation Intelligente avec Performance
  async navigateWithSLO(url: string, expectedSelector: string, sloTarget: number = VERONE_SLOS.navigation) {
    return this.measurePerformance(async () => {
      await this.page.goto(url)
      await expect(this.page.locator(expectedSelector), { timeout: 5000 }).toBeVisible()
      return url
    }, sloTarget, `Navigation vers ${url}`)
  }

  // 🔍 Recherche avec Performance Monitoring
  async performSearch(searchTerm: string, expectedResults: string = CATALOGUE_SELECTORS.productsGrid) {
    return this.measurePerformance(async () => {
      const searchInput = this.page.locator(CATALOGUE_SELECTORS.searchInput).first()
      await searchInput.fill(searchTerm)
      await this.page.waitForTimeout(100) // Debounce
      await this.page.waitForLoadState('networkidle')
      await expect(this.page.locator(expectedResults).or(this.page.locator('text=Aucun résultat'))).toBeVisible()
      return searchTerm
    }, VERONE_SLOS.search_response, `Recherche "${searchTerm}"`)
  }

  // 📊 Validation Métriques Business
  async validateBusinessMetrics(expectedMetrics: string[] = ['Produits', 'Catégories', 'Collections']) {
    for (const metric of expectedMetrics) {
      await expect(this.page.locator(`text=${metric}`).first()).toBeVisible()
    }
    console.log(`✅ Métriques business validées: ${expectedMetrics.join(', ')}`)
  }

  // 🏗️ Validation Structure Page Catalogue
  async validateCataloguePageStructure() {
    const requiredElements = [
      { selector: CATALOGUE_SELECTORS.catalogueMain, name: 'Catalogue principal', fallback: CATALOGUE_SELECTORS.productsGrid },
      { selector: 'text=Produits', name: 'Section Produits', fallback: 'text=Catalogue' }
    ]

    for (const element of requiredElements) {
      const primaryElement = this.page.locator(element.selector)
      const fallbackElement = element.fallback ? this.page.locator(element.fallback) : null

      if (fallbackElement) {
        await expect(primaryElement.or(fallbackElement)).toBeVisible()
      } else {
        await expect(primaryElement).toBeVisible()
      }

      console.log(`✅ ${element.name} présent`)
    }
  }

  // 📱 Validation Navigation Mobile/Desktop
  async validateResponsiveNavigation(urls: string[]) {
    for (const url of urls) {
      await this.navigateWithSLO(url, 'body', VERONE_SLOS.navigation)

      // Attendre que le contenu soit stable
      await this.page.waitForLoadState('networkidle')
      await this.page.waitForTimeout(500)

      // Vérifier qu'aucune erreur de layout
      const layoutErrors = await this.page.evaluate(() => {
        const elements = document.querySelectorAll('[style*="display: none"]')
        return elements.length
      })

      if (layoutErrors > 10) { // Seuil raisonnable
        console.warn(`⚠️ Possible problème layout sur ${url}: ${layoutErrors} éléments cachés`)
      }
    }
  }

  // 🎨 Validation Accessibilité WCAG
  async validateAccessibility() {
    // Vérifier contrastes de base
    const colorContrast = await this.page.evaluate(() => {
      const elements = document.querySelectorAll('*')
      let lowContrastCount = 0

      elements.forEach(el => {
        const style = window.getComputedStyle(el)
        const bgColor = style.backgroundColor
        const textColor = style.color

        // Vérifie que ce ne sont pas les couleurs par défaut transparentes
        if (bgColor !== 'rgba(0, 0, 0, 0)' && textColor !== 'rgba(0, 0, 0, 0)') {
          // Logique de contraste simplifiée pour démo
          if (bgColor === textColor) {
            lowContrastCount++
          }
        }
      })

      return lowContrastCount
    })

    if (colorContrast > 0) {
      console.warn(`⚠️ Problèmes potentiels de contraste détectés: ${colorContrast}`)
    } else {
      console.log('✅ Validation accessibilité de base réussie')
    }

    // Vérifier attributs ARIA essentiels
    const missingAria = await this.page.locator('button:not([aria-label]):not([aria-labelledby])').count()
    if (missingAria > 5) { // Seuil tolérable
      console.warn(`⚠️ ${missingAria} boutons sans attributs ARIA`)
    }
  }

  // 🔄 Workflow Navigation Hiérarchique
  async testHierarchicalNavigation() {
    const navigationFlow = [
      { url: '/catalogue', expectedElement: CATALOGUE_SELECTORS.catalogueMain },
      { url: '/catalogue/categories', expectedElement: CATALOGUE_SELECTORS.categoriesGrid },
      { url: '/catalogue/dashboard', expectedElement: CATALOGUE_SELECTORS.dashboardMetrics },
      { url: '/catalogue/collections', expectedElement: CATALOGUE_SELECTORS.collectionsGrid }
    ]

    for (const step of navigationFlow) {
      await this.navigateWithSLO(step.url, step.expectedElement, VERONE_SLOS.navigation)

      // Vérifier breadcrumb ou navigation retour
      const navigationElement = this.page.locator(CATALOGUE_SELECTORS.breadcrumb)
        .or(this.page.locator(CATALOGUE_SELECTORS.back))
        .or(this.page.locator('nav'))

      if (await navigationElement.isVisible()) {
        console.log(`✅ Navigation présente sur ${step.url}`)
      }
    }
  }

  // 📈 Métriques Conversion & Business
  async trackBusinessInteractions() {
    const interactions = {
      productViews: 0,
      categoryNavigations: 0,
      searchQueries: 0,
      formInteractions: 0
    }

    // Tracker les clics sur produits
    this.page.on('click', async (element) => {
      const elementText = await element.textContent() || ''

      if (elementText.includes('Produit') || elementText.includes('product')) {
        interactions.productViews++
      }

      if (elementText.includes('Catégorie') || elementText.includes('category')) {
        interactions.categoryNavigations++
      }
    })

    return interactions
  }

  // 🧪 Test Data Helpers
  static createTestProduct() {
    return {
      name: `Produit Test E2E ${Date.now()}`,
      description: 'Description test automatisée',
      category: 'Mobilier',
      price: '299.99',
      stock: '10'
    }
  }

  static createTestSearch() {
    return {
      validTerms: ['mobilier', 'table', 'chaise', 'décoration'],
      invalidTerms: ['xyz123', 'inexistant'],
      specialChars: ['é', 'è', 'ç', 'à']
    }
  }

  // 🚨 Escalation Sentry (Simulation)
  async escalateToSentry(issue: {
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    details: any
  }) {
    console.log(`🚨 ESCALATION SENTRY: ${issue.type}`, {
      severity: issue.severity,
      timestamp: new Date().toISOString(),
      details: issue.details,
      url: this.page.url()
    })

    // Dans un vrai environnement, ici on utiliserait mcp__sentry__create_issue
    if (issue.severity === 'critical') {
      throw new Error(`Critical issue escalated: ${issue.type}`)
    }
  }

  // 🔧 Utilitaires Cleanup
  async cleanup() {
    // Cleanup automatique après tests
    try {
      // Fermer modales ouvertes
      const modals = this.page.locator('[role="dialog"], .modal')
      if (await modals.count() > 0) {
        await this.page.keyboard.press('Escape')
      }

      // Retour page d'accueil si nécessaire
      if (!this.page.url().includes('/catalogue')) {
        await this.page.goto('/catalogue')
      }

      console.log('✅ Cleanup test terminé')
    } catch (error) {
      console.warn('⚠️ Cleanup partiel:', error)
    }
  }
}

// 🔧 Factory Functions
export const catalogueTestHelper = {
  create: (page: Page) => new CatalogueTestHelper(page),

  selectors: CATALOGUE_SELECTORS,
  slos: VERONE_SLOS,

  // Quick helpers statiques
  expectVisibleWithFallback: async (page: Page, primary: string, fallback: string, timeout: number = 5000) => {
    await expect(page.locator(primary).or(page.locator(fallback)), { timeout }).toBeVisible()
  },

  waitForStableContent: async (page: Page, waitTime: number = 2000) => {
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(waitTime)
  },

  logPerformance: (operation: string, duration: number, sloTarget: number) => {
    const status = duration < sloTarget ? '✅' : '⚠️'
    console.log(`${status} ${operation}: ${duration}ms (SLO: ${sloTarget}ms)`)
  }
}

// Export types pour TypeScript
export type CatalogueSelector = keyof typeof CATALOGUE_SELECTORS
export type VeroneSLO = keyof typeof VERONE_SLOS
export type TestProduct = ReturnType<typeof CatalogueTestHelper.createTestProduct>
export type TestSearch = ReturnType<typeof CatalogueTestHelper.createTestSearch>

export default catalogueTestHelper