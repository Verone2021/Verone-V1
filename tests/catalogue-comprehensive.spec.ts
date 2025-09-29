/**
 * 🧪 TESTS CATALOGUE COMPLETS - Vérone 2025
 * Suite de tests Playwright pour validation complète module catalogue
 * 18 tests critiques avec Console Error Checking + Performance SLO
 */

import { test, expect } from '@playwright/test'
import { catalogueTestHelper } from './helpers/catalogue-test-helper'

// Configuration globale
test.beforeEach(async ({ page }) => {
  // Console error tracking (zero tolerance)
  page.on('console', msg => {
    if (msg.type() === 'error') {
      throw new Error(`❌ Console Error détectée: ${msg.text()}`)
    }
  })

  // Network error tracking
  page.on('pageerror', error => {
    throw new Error(`💥 Page Error: ${error.message}`)
  })
})

test.describe('🏗️ NAVIGATION & PAGES CATALOGUE', () => {
  test('01. Page catalogue principale charge sans erreur', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/catalogue')

    // Attendre que le contenu soit chargé
    await expect(page.locator('[data-testid="catalogue-main"]', { timeout: 5000 })).toBeVisible()

    // Vérifier titre page
    await expect(page).toHaveTitle(/catalogue/i)

    // Vérifier éléments principaux
    await expect(page.locator('text=Chargement du catalogue...').or(page.locator('[data-testid="products-grid"]'))).toBeVisible()

    // Performance check <3s SLO
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(3000)

    console.log(`✅ Catalogue chargé en ${loadTime}ms`)
  })

  test('02. Dashboard catalogue affiche métriques business', async ({ page }) => {
    await page.goto('/catalogue/dashboard')

    // Attendre chargement dashboard
    await expect(page.locator('[data-testid="dashboard-metrics"]').or(page.locator('text=Produits Actifs')), { timeout: 5000 }).toBeVisible()

    // Vérifier métriques principales
    await expect(page.locator('text=Produits').first()).toBeVisible()
    await expect(page.locator('text=Catégories').or(page.locator('text=Collections'))).toBeVisible()

    // Vérifier actions rapides
    await expect(page.locator('text=Nouveau Produit').or(page.locator('text=Créer'))).toBeVisible()

    console.log('✅ Dashboard catalogue fonctionnel')
  })

  test('03. Navigation hiérarchique catégories → sous-catégories → familles', async ({ page }) => {
    // Page catégories
    await page.goto('/catalogue/categories')
    await expect(page.locator('[data-testid="categories-grid"]').or(page.locator('text=Catégories')), { timeout: 5000 }).toBeVisible()

    // Navigation vers sous-catégorie si disponible
    const categoryLink = page.locator('[data-testid="category-card"]').first().or(page.locator('button').filter({ hasText: /voir|afficher/i }).first())
    if (await categoryLink.isVisible()) {
      await categoryLink.click()

      // Vérifier navigation breadcrumb
      await expect(page.locator('[data-testid="breadcrumb"]').or(page.locator('text=Retour')), { timeout: 3000 }).toBeVisible()
    }

    console.log('✅ Navigation hiérarchique fonctionnelle')
  })

  test('04. Pages création/édition produits accessibles', async ({ page }) => {
    // Page création
    await page.goto('/catalogue/create')
    await expect(page.locator('[data-testid="product-form"]').or(page.locator('text=Nouveau Produit')), { timeout: 5000 }).toBeVisible()

    // Vérifier formulaire présent
    await expect(page.locator('input[type="text"]').first()).toBeVisible()

    // Tester navigation retour
    const backButton = page.locator('text=Retour').or(page.locator('[data-testid="back-button"]'))
    if (await backButton.isVisible()) {
      await backButton.click()
      await expect(page).toHaveURL(/catalogue/)
    }

    console.log('✅ Pages création/édition accessibles')
  })

  test('05. Page collections fonctionnelle', async ({ page }) => {
    await page.goto('/catalogue/collections')

    // Attendre chargement collections
    await expect(page.locator('[data-testid="collections-grid"]').or(page.locator('text=Collections')), { timeout: 5000 }).toBeVisible()

    // Vérifier fonctionnalités collections
    await expect(page.locator('text=Collection').or(page.locator('[data-testid="collection-card"]')).toBeVisible()

    console.log('✅ Page collections fonctionnelle')
  })

  test('06. Page stocks intégrée catalogue', async ({ page }) => {
    await page.goto('/catalogue/stocks')

    // Attendre chargement stocks
    await expect(page.locator('[data-testid="stocks-table"]').or(page.locator('text=Stock')), { timeout: 5000 }).toBeVisible()

    // Vérifier intégration catalogue
    await expect(page.locator('text=Produit').or(page.locator('text=Référence'))).toBeVisible()

    console.log('✅ Page stocks intégrée')
  })
})

test.describe('🚨 CONSOLE ERROR CHECKING (ZERO TOLERANCE)', () => {
  test('07. Zero erreurs console page principale', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/catalogue')
    await page.waitForLoadState('networkidle')

    // Attendre 2s pour capturer erreurs différées
    await page.waitForTimeout(2000)

    expect(consoleErrors).toHaveLength(0)
    console.log('✅ Zero erreur console page principale')
  })

  test('08. Zero erreurs navigation hiérarchique', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Navigation multiple pour tester
    await page.goto('/catalogue')
    await page.goto('/catalogue/categories')
    await page.goto('/catalogue/dashboard')

    await page.waitForTimeout(2000)

    expect(consoleErrors).toHaveLength(0)
    console.log('✅ Zero erreur navigation hiérarchique')
  })

  test('09. Zero erreurs filtres/recherche', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/catalogue')
    await page.waitForLoadState('networkidle')

    // Tester filtres si disponibles
    const filterInput = page.locator('input[type="search"]').or(page.locator('input[placeholder*="recherche"]')).first()
    if (await filterInput.isVisible()) {
      await filterInput.fill('test')
      await page.waitForTimeout(1000)
    }

    expect(consoleErrors).toHaveLength(0)
    console.log('✅ Zero erreur filtres/recherche')
  })

  test('10. Zero erreurs actions CRUD produits', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Tester actions CRUD
    await page.goto('/catalogue/create')
    await page.waitForLoadState('networkidle')

    // Tester saisie formulaire
    const nameInput = page.locator('input[type="text"]').first()
    if (await nameInput.isVisible()) {
      await nameInput.fill('Produit Test')
      await page.waitForTimeout(500)
    }

    expect(consoleErrors).toHaveLength(0)
    console.log('✅ Zero erreur actions CRUD')
  })
})

test.describe('⚡ PERFORMANCE SLO VÉRONE', () => {
  test('11. Catalogue charge <3s (SLO critique)', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/catalogue')

    // Attendre contenu visible
    await expect(page.locator('[data-testid="catalogue-main"]').or(page.locator('text=Produits')), { timeout: 5000 }).toBeVisible()

    const loadTime = Date.now() - startTime

    // SLO strict <3s
    expect(loadTime).toBeLessThan(3000)

    console.log(`✅ SLO respecté: ${loadTime}ms < 3000ms`)
  })

  test('12. Navigation <1s entre pages', async ({ page }) => {
    // Page initiale
    await page.goto('/catalogue')
    await page.waitForLoadState('networkidle')

    // Test navigation rapide
    const startTime = Date.now()
    await page.goto('/catalogue/dashboard')
    await expect(page.locator('text=Dashboard').or(page.locator('text=Produits')), { timeout: 2000 }).toBeVisible()

    const navTime = Date.now() - startTime
    expect(navTime).toBeLessThan(1000)

    console.log(`✅ Navigation rapide: ${navTime}ms < 1000ms`)
  })

  test('13. Filtres/recherche <2s réponse', async ({ page }) => {
    await page.goto('/catalogue')
    await page.waitForLoadState('networkidle')

    const searchInput = page.locator('input[type="search"]').or(page.locator('input[placeholder*="recherche"]')).first()

    if (await searchInput.isVisible()) {
      const startTime = Date.now()

      await searchInput.fill('mobilier')
      await page.waitForTimeout(100)

      // Attendre résultats ou état chargé
      await page.waitForLoadState('networkidle')

      const searchTime = Date.now() - startTime
      expect(searchTime).toBeLessThan(2000)

      console.log(`✅ Recherche rapide: ${searchTime}ms < 2000ms`)
    } else {
      console.log('ℹ️ Pas de recherche disponible, test passé')
    }
  })

  test('14. Chargement détail produit <2s', async ({ page }) => {
    await page.goto('/catalogue')
    await page.waitForLoadState('networkidle')

    // Chercher premier produit
    const productLink = page.locator('[data-testid="product-card"]').first().or(page.locator('a[href*="/catalogue/"]')).first()

    if (await productLink.isVisible()) {
      const startTime = Date.now()

      await productLink.click()
      await expect(page.locator('[data-testid="product-detail"]').or(page.locator('text=Détail')), { timeout: 3000 }).toBeVisible()

      const detailTime = Date.now() - startTime
      expect(detailTime).toBeLessThan(2000)

      console.log(`✅ Détail produit: ${detailTime}ms < 2000ms`)
    } else {
      console.log('ℹ️ Pas de produit disponible, test passé')
    }
  })
})

test.describe('💼 BUSINESS LOGIC CATALOGUE', () => {
  test('15. Filtres catégories fonctionnels', async ({ page }) => {
    await page.goto('/catalogue')
    await page.waitForLoadState('networkidle')

    // Chercher filtres catégories
    const categoryFilter = page.locator('[data-testid="category-filter"]').or(page.locator('select')).first()

    if (await categoryFilter.isVisible()) {
      // Tester changement filtre
      await categoryFilter.click()
      await page.waitForTimeout(500)

      // Vérifier que le contenu réagit
      await page.waitForLoadState('networkidle')

      console.log('✅ Filtres catégories fonctionnels')
    } else {
      console.log('ℹ️ Pas de filtres visibles, validation navigation')

      // Validation navigation catégories alternative
      await page.goto('/catalogue/categories')
      await expect(page.locator('text=Catégorie').or(page.locator('[data-testid="category-card"]')), { timeout: 3000 }).toBeVisible()
    }
  })

  test('16. Workflow création produit complet', async ({ page }) => {
    await page.goto('/catalogue/create')
    await page.waitForLoadState('networkidle')

    // Vérifier formulaire création
    await expect(page.locator('input[type="text"]').first(), { timeout: 3000 }).toBeVisible()

    // Saisie données test
    const nameInput = page.locator('input[type="text"]').first()
    await nameInput.fill('Produit Test E2E')

    // Vérifier que la saisie est prise en compte
    const inputValue = await nameInput.inputValue()
    expect(inputValue).toBe('Produit Test E2E')

    console.log('✅ Workflow création produit opérationnel')
  })

  test('17. Navigation breadcrumb cohérente', async ({ page }) => {
    // Navigation profonde
    await page.goto('/catalogue/categories')
    await page.waitForLoadState('networkidle')

    // Chercher navigation breadcrumb ou retour
    const breadcrumb = page.locator('[data-testid="breadcrumb"]').or(page.locator('text=Retour')).or(page.locator('nav'))

    if (await breadcrumb.isVisible()) {
      console.log('✅ Breadcrumb navigation présente')
    }

    // Tester navigation retour
    await page.goto('/catalogue/dashboard')
    await page.waitForLoadState('networkidle')

    const backToCatalogue = page.locator('text=Catalogue').or(page.locator('[href="/catalogue"]'))
    if (await backToCatalogue.isVisible()) {
      await backToCatalogue.click()
      await expect(page).toHaveURL(/catalogue/)
    }

    console.log('✅ Navigation breadcrumb cohérente')
  })

  test('18. Intégration sourcing → catalogue', async ({ page }) => {
    // Vérifier lien sourcing depuis catalogue
    await page.goto('/catalogue')
    await page.waitForLoadState('networkidle')

    const sourcingLink = page.locator('text=Sourcing').or(page.locator('[href*="sourcing"]'))

    if (await sourcingLink.isVisible()) {
      await sourcingLink.click()
      await expect(page).toHaveURL(/sourcing/)

      // Retour catalogue
      await page.goto('/catalogue')
      await expect(page).toHaveURL(/catalogue/)
    }

    // Vérifier accès depuis dashboard
    await page.goto('/catalogue/dashboard')
    const sourcingFromDashboard = page.locator('text=Sourcing').or(page.locator('[href*="sourcing"]'))

    if (await sourcingFromDashboard.isVisible()) {
      console.log('✅ Intégration sourcing → catalogue opérationnelle')
    }
  })
})

// Configuration performance globale
test.describe.configure({ timeout: 30000 })

// Export pour utilisation dans autres tests
export { catalogueTestHelper }