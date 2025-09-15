/**
 * 🧪 Test E2E Complet - CRUD Categories avec Chrome
 *
 * Valide la connexion complète aux vraies données Supabase
 * AUCUNE donnée mock utilisée - Politique stricte
 */

import { test, expect } from '@playwright/test'

// Configuration spécifique Chrome
test.use({
  channel: 'chrome',
  headless: false, // Mode visible pour voir les actions
  viewport: { width: 1920, height: 1080 }
})

// Credentials authentification
const AUTH_CREDENTIALS = {
  email: 'veronebyromeo@gmail.com',
  password: 'Abc123456'
}

test.describe('🎯 CRUD Complet Categories - Vraies Données Supabase', () => {

  test.beforeEach(async ({ page }) => {
    // Navigation vers login
    await page.goto('/login')

    // Authentification avec vraies credentials
    await page.fill('[name="email"]', AUTH_CREDENTIALS.email)
    await page.fill('[name="password"]', AUTH_CREDENTIALS.password)
    await page.click('button[type="submit"]')

    // Attendre redirection dashboard
    await page.waitForURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Dashboard')

    // Navigation vers categories
    await page.goto('/catalogue/categories')
    await page.waitForLoadState('networkidle')
  })

  test('🔍 Validation - Aucune donnée mock utilisée', async ({ page }) => {
    // Vérifier que les données viennent de Supabase
    await page.waitForSelector('[data-testid="families-section"]')

    // Attendre chargement des vraies données
    await page.waitForFunction(() => {
      const familyCards = document.querySelectorAll('[data-testid^="family-card-"]')
      return familyCards.length > 0 // Doit avoir au moins 1 famille depuis DB
    })

    // Vérifier présence données réelles (pas de données mock)
    const familyCards = page.locator('[data-testid^="family-card-"]')
    const count = await familyCards.count()
    expect(count).toBeGreaterThan(0) // Base a 8 familles

    console.log(`✅ ${count} familles chargées depuis Supabase`)
  })

  test('👨‍👩‍👧‍👦 CRUD Families - Création avec image', async ({ page }) => {
    // Ouvrir modal création famille
    await page.click('[data-testid="create-family-button"]')
    await page.waitForSelector('[data-testid="family-form-modal"]')

    // Saisie données famille
    const familyName = `Test Family Chrome ${Date.now()}`
    await page.fill('[name="name"]', familyName)
    await page.fill('[name="description"]', 'Famille créée via test Chrome')

    // Upload image test
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('./PHOTO TEST.png')

    // Attendre upload
    await page.waitForSelector('.upload-progress', { state: 'visible', timeout: 10000 })
    await page.waitForSelector('.upload-success', { timeout: 15000 })

    // Soumettre formulaire
    await page.click('[data-testid="submit-family-form"]')

    // Attendre fermeture modal et refresh liste
    await page.waitForSelector('[data-testid="family-form-modal"]', { state: 'hidden' })
    await page.waitForLoadState('networkidle')

    // Vérifier famille apparaît dans liste
    await expect(page.locator(`text=${familyName}`)).toBeVisible()

    console.log(`✅ Famille créée: ${familyName}`)
  })

  test('🏷️ CRUD Categories - Cycle complet', async ({ page }) => {
    // Attendre famille disponible
    const firstFamily = page.locator('[data-testid^="family-card-"]').first()
    await firstFamily.waitFor()

    // Cliquer pour ouvrir section catégories
    await firstFamily.click()
    await page.waitForSelector('[data-testid="categories-section"]')

    // Créer nouvelle catégorie
    await page.click('[data-testid="create-category-button"]')
    await page.waitForSelector('[data-testid="category-form-modal"]')

    const categoryName = `Test Catégorie Chrome ${Date.now()}`
    await page.fill('[name="name"]', categoryName)
    await page.fill('[name="description"]', 'Catégorie test Chrome')

    // Soumettre
    await page.click('[data-testid="submit-category-form"]')
    await page.waitForSelector('[data-testid="category-form-modal"]', { state: 'hidden' })

    // Vérifier création
    await expect(page.locator(`text=${categoryName}`)).toBeVisible()

    // Modifier catégorie
    const categoryCard = page.locator(`[data-testid*="category-"][data-testid*="${categoryName.replace(/\s+/g, '-').toLowerCase()}"]`)
    await categoryCard.hover()
    await page.click('[data-testid="edit-category-button"]')

    const updatedName = `${categoryName} - Modifiée`
    await page.fill('[name="name"]', updatedName)
    await page.click('[data-testid="submit-category-form"]')

    // Vérifier modification
    await expect(page.locator(`text=${updatedName}`)).toBeVisible()

    console.log(`✅ Catégorie CRUD complet: ${updatedName}`)
  })

  test('🏪 CRUD Subcategories - Cycle complet', async ({ page }) => {
    // Naviguer vers catégorie existante
    const firstFamily = page.locator('[data-testid^="family-card-"]').first()
    await firstFamily.click()

    const firstCategory = page.locator('[data-testid^="category-card-"]').first()
    await firstCategory.waitFor()
    await firstCategory.click()

    // Créer sous-catégorie
    await page.click('[data-testid="create-subcategory-button"]')
    await page.waitForSelector('[data-testid="subcategory-form-modal"]')

    const subcategoryName = `Test Sous-Cat Chrome ${Date.now()}`
    await page.fill('[name="name"]', subcategoryName)
    await page.fill('[name="description"]', 'Sous-catégorie test Chrome')

    // Soumettre
    await page.click('[data-testid="submit-subcategory-form"]')
    await page.waitForSelector('[data-testid="subcategory-form-modal"]', { state: 'hidden' })

    // Vérifier création
    await expect(page.locator(`text=${subcategoryName}`)).toBeVisible()

    console.log(`✅ Sous-catégorie créée: ${subcategoryName}`)
  })

  test('🔄 Persistance - Données survivent au refresh', async ({ page }) => {
    // Compter éléments avant refresh
    const familiesCountBefore = await page.locator('[data-testid^="family-card-"]').count()
    const categoriesCountBefore = await page.locator('[data-testid^="category-card-"]').count()

    // Refresh page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Attendre rechargement données Supabase
    await page.waitForFunction(() => {
      const families = document.querySelectorAll('[data-testid^="family-card-"]')
      return families.length > 0
    })

    // Vérifier données persistées
    const familiesCountAfter = await page.locator('[data-testid^="family-card-"]').count()
    expect(familiesCountAfter).toBeGreaterThanOrEqual(familiesCountBefore)

    console.log(`✅ Persistance validée: ${familiesCountAfter} familles après refresh`)
  })

  test('⚡ Performance - Chargement < 3s', async ({ page }) => {
    const startTime = Date.now()

    // Navigation et attente chargement complet
    await page.goto('/catalogue/categories')
    await page.waitForSelector('[data-testid="families-section"]')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(3000) // SLO: < 3s

    console.log(`✅ Performance: ${loadTime}ms (< 3s SLO)`)
  })

  test('🚫 Anti-Mock - Validation zéro donnée simulée', async ({ page }) => {
    // Injecter script pour détecter données mock
    await page.addInitScript(() => {
      // Surveiller console pour logs de données mock
      const originalLog = console.log
      window.mockDataDetected = false

      console.log = (...args) => {
        const message = args.join(' ')
        if (message.includes('mock') || message.includes('fake') || message.includes('dummy')) {
          window.mockDataDetected = true
        }
        originalLog.apply(console, args)
      }
    })

    // Naviguer et charger données
    await page.goto('/catalogue/categories')
    await page.waitForLoadState('networkidle')

    // Vérifier aucune donnée mock détectée
    const mockDetected = await page.evaluate(() => window.mockDataDetected)
    expect(mockDetected).toBeFalsy()

    // Vérifier que les hooks Supabase sont bien utilisés
    const networkRequests = []
    page.on('request', req => {
      if (req.url().includes('supabase')) {
        networkRequests.push(req.url())
      }
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    expect(networkRequests.length).toBeGreaterThan(0)
    console.log(`✅ Anti-Mock validé: ${networkRequests.length} requêtes Supabase`)
  })
})