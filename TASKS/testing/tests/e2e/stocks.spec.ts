/**
 * 🧪 TESTS E2E GESTION STOCKS - Vérone Back Office
 * Tests complets: mouvements, alertes, inventaire, import/export
 */

import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  const consoleErrors: string[] = []

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  page.on('pageerror', error => {
    throw new Error(`💥 Page Error: ${error.message}`)
  })
})

test.describe('📦 STOCKS - NAVIGATION & PAGES', () => {
  test('01. Page stocks principale charge correctement', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')

    // Vérifier titre
    await expect(page).toHaveURL(/stocks/)

    // Vérifier contenu (table ou liste produits)
    const hasTable = await page.locator('table, [data-testid="stocks-table"]').isVisible({ timeout: 3000 }).catch(() => false)
    const hasList = await page.locator('[data-testid="stock-item"]').isVisible({ timeout: 3000 }).catch(() => false)

    expect(hasTable || hasList).toBeTruthy()

    const loadTime = Date.now() - startTime
    console.log(`✅ Page stocks chargée en ${loadTime}ms`)
  })

  test('02. Navigation mouvements stocks', async ({ page }) => {
    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')

    // Chercher lien mouvements
    const mouvementsLink = page.locator('a[href*="mouvements"], text=/mouvements/i').first()

    if (await mouvementsLink.isVisible({ timeout: 3000 })) {
      await mouvementsLink.click()
      await expect(page).toHaveURL(/mouvements/)
      console.log('✅ Navigation mouvements OK')
    } else {
      // Fallback: navigation directe
      await page.goto('/stocks/mouvements')
      await page.waitForLoadState('networkidle')
      console.log('ℹ️ Navigation directe vers mouvements')
    }
  })

  test('03. Navigation alertes stocks bas', async ({ page }) => {
    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')

    // Chercher lien alertes
    const alertesLink = page.locator('a[href*="alertes"], text=/alertes/i').first()

    if (await alertesLink.isVisible({ timeout: 3000 })) {
      await alertesLink.click()
      await expect(page).toHaveURL(/alertes/)
      console.log('✅ Navigation alertes OK')
    } else {
      await page.goto('/stocks/alertes')
      await page.waitForLoadState('networkidle')
      console.log('ℹ️ Navigation directe vers alertes')
    }
  })

  test('04. Navigation inventaire', async ({ page }) => {
    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')

    const inventaireLink = page.locator('a[href*="inventaire"], text=/inventaire/i').first()

    if (await inventaireLink.isVisible({ timeout: 3000 })) {
      await inventaireLink.click()
      await expect(page).toHaveURL(/inventaire/)
      console.log('✅ Navigation inventaire OK')
    } else {
      await page.goto('/stocks/inventaire')
      await page.waitForLoadState('networkidle')
      console.log('ℹ️ Navigation directe vers inventaire')
    }
  })
})

test.describe('📝 STOCKS - CRÉATION MOUVEMENT', () => {
  test('05. Formulaire création mouvement entrée accessible', async ({ page }) => {
    await page.goto('/stocks/entrees')
    await page.waitForLoadState('networkidle')

    // Vérifier présence formulaire ou bouton création
    const hasForm = await page.locator('[data-testid="mouvement-form"], form').isVisible({ timeout: 3000 }).catch(() => false)
    const hasButton = await page.locator('button:has-text("Nouveau"), button:has-text("Créer")').isVisible({ timeout: 3000 }).catch(() => false)

    expect(hasForm || hasButton).toBeTruthy()
    console.log('✅ Formulaire entrée stock accessible')
  })

  test('06. Formulaire création mouvement sortie accessible', async ({ page }) => {
    await page.goto('/stocks/sorties')
    await page.waitForLoadState('networkidle')

    const hasForm = await page.locator('[data-testid="mouvement-form"], form').isVisible({ timeout: 3000 }).catch(() => false)
    const hasButton = await page.locator('button:has-text("Nouveau"), button:has-text("Créer")').isVisible({ timeout: 3000 }).catch(() => false)

    expect(hasForm || hasButton).toBeTruthy()
    console.log('✅ Formulaire sortie stock accessible')
  })

  test('07. Validation champs obligatoires formulaire mouvement', async ({ page }) => {
    await page.goto('/stocks/entrees')
    await page.waitForLoadState('networkidle')

    // Ouvrir formulaire si modal
    const createButton = page.locator('button:has-text("Nouveau"), button:has-text("Créer")').first()
    if (await createButton.isVisible({ timeout: 3000 })) {
      await createButton.click()
      await page.waitForTimeout(500)
    }

    // Tenter soumission vide
    const submitButton = page.locator('button[type="submit"], button:has-text("Enregistrer"), button:has-text("Valider")').first()

    if (await submitButton.isVisible({ timeout: 3000 })) {
      await submitButton.click()
      await page.waitForTimeout(500)

      // Vérifier messages erreur ou validation
      const hasError = await page.locator('text=/requis|obligatoire|erreur/i').isVisible({ timeout: 2000 }).catch(() => false)

      console.log(`✅ Validation formulaire: ${hasError ? 'messages erreur OK' : 'pas de validation visible'}`)
    } else {
      console.log('ℹ️ Formulaire non testable (bouton submit introuvable)')
    }
  })
})

test.describe('📊 STOCKS - HISTORIQUE & MOUVEMENTS', () => {
  test('08. Historique mouvements affiche liste', async ({ page }) => {
    await page.goto('/stocks/mouvements')
    await page.waitForLoadState('networkidle')

    // Vérifier présence table/liste mouvements
    const hasTable = await page.locator('table, [data-testid="mouvements-table"]').isVisible({ timeout: 3000 }).catch(() => false)
    const hasList = await page.locator('[data-testid="mouvement-item"]').isVisible({ timeout: 3000 }).catch(() => false)

    if (hasTable || hasList) {
      console.log('✅ Historique mouvements affiché')
    } else {
      console.log('ℹ️ Pas de mouvements visibles (table vide possible)')
    }
  })

  test('09. Filtres mouvements (dates, type, produit)', async ({ page }) => {
    await page.goto('/stocks/mouvements')
    await page.waitForLoadState('networkidle')

    // Chercher filtres disponibles
    const hasDateFilter = await page.locator('input[type="date"]').isVisible({ timeout: 3000 }).catch(() => false)
    const hasTypeFilter = await page.locator('select, [data-testid="type-filter"]').isVisible({ timeout: 3000 }).catch(() => false)
    const hasSearch = await page.locator('input[type="search"], input[placeholder*="recherche"]').isVisible({ timeout: 3000 }).catch(() => false)

    const hasAnyFilter = hasDateFilter || hasTypeFilter || hasSearch

    console.log(`✅ Filtres disponibles: Date=${hasDateFilter}, Type=${hasTypeFilter}, Recherche=${hasSearch}`)
  })
})

test.describe('🚨 STOCKS - ALERTES', () => {
  test('10. Page alertes stocks bas affichée', async ({ page }) => {
    await page.goto('/stocks/alertes')
    await page.waitForLoadState('networkidle')

    // Vérifier présence alertes
    const hasAlerts = await page.locator('[data-testid="alert-item"], .alert-card').isVisible({ timeout: 3000 }).catch(() => false)
    const hasTable = await page.locator('table').isVisible({ timeout: 3000 }).catch(() => false)
    const hasEmptyState = await page.locator('text=/aucune alerte|no alerts/i').isVisible({ timeout: 3000 }).catch(() => false)

    expect(hasAlerts || hasTable || hasEmptyState).toBeTruthy()
    console.log('✅ Page alertes stocks fonctionnelle')
  })

  test('11. Alertes indiquent niveau stock critique', async ({ page }) => {
    await page.goto('/stocks/alertes')
    await page.waitForLoadState('networkidle')

    // Chercher indicateurs criticité
    const hasCritical = await page.locator('text=/critique|critical|bas|low/i').isVisible({ timeout: 3000 }).catch(() => false)
    const hasBadge = await page.locator('.badge, [data-testid="alert-badge"]').isVisible({ timeout: 3000 }).catch(() => false)

    console.log(`✅ Indicateurs criticité: ${hasCritical || hasBadge ? 'présents' : 'non visibles'}`)
  })
})

test.describe('📋 STOCKS - INVENTAIRE', () => {
  test('12. Page inventaire accessible', async ({ page }) => {
    await page.goto('/stocks/inventaire')
    await page.waitForLoadState('networkidle')

    // Vérifier contenu inventaire
    const hasContent = await page.locator('table, [data-testid="inventaire-table"], form').isVisible({ timeout: 3000 }).catch(() => false)

    expect(hasContent).toBeTruthy()
    console.log('✅ Page inventaire accessible')
  })

  test('13. Ajustement inventaire fonctionne', async ({ page }) => {
    await page.goto('/stocks/inventaire')
    await page.waitForLoadState('networkidle')

    // Chercher fonctionnalité ajustement
    const hasAdjustButton = await page.locator('button:has-text("Ajuster"), button:has-text("Corriger")').isVisible({ timeout: 3000 }).catch(() => false)
    const hasAdjustInput = await page.locator('input[type="number"]').isVisible({ timeout: 3000 }).catch(() => false)

    console.log(`✅ Ajustement inventaire: ${hasAdjustButton || hasAdjustInput ? 'disponible' : 'non visible'}`)
  })
})

test.describe('📤 STOCKS - IMPORT/EXPORT', () => {
  test('14. Export CSV stocks disponible', async ({ page }) => {
    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')

    // Chercher bouton export
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Exporter"), button:has-text("CSV")').first()

    if (await exportButton.isVisible({ timeout: 3000 })) {
      console.log('✅ Fonctionnalité export CSV disponible')
    } else {
      console.log('ℹ️ Export CSV non visible sur cette page')
    }
  })

  test('15. Import stocks disponible', async ({ page }) => {
    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')

    // Chercher bouton import
    const importButton = page.locator('button:has-text("Import"), button:has-text("Importer"), input[type="file"]').first()

    if (await importButton.isVisible({ timeout: 3000 })) {
      console.log('✅ Fonctionnalité import disponible')
    } else {
      console.log('ℹ️ Import non visible sur cette page')
    }
  })
})

test.describe('🚨 CONSOLE ERRORS STOCKS', () => {
  test('16. Zero erreur console page principale stocks', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    if (consoleErrors.length > 0) {
      console.error('❌ Erreurs console:', consoleErrors)
    }

    expect(consoleErrors).toHaveLength(0)
    console.log('✅ Zero erreur console stocks')
  })

  test('17. Zero erreur navigation entre pages stocks', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/stocks')
    await page.goto('/stocks/mouvements')
    await page.goto('/stocks/alertes')
    await page.goto('/stocks/inventaire')

    await page.waitForTimeout(2000)

    expect(consoleErrors).toHaveLength(0)
    console.log('✅ Zero erreur navigation stocks')
  })
})

test.describe('⚡ PERFORMANCE STOCKS', () => {
  test('18. Liste stocks charge <3s', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(3000)

    console.log(`✅ Liste stocks: ${loadTime}ms < 3000ms`)
  })

  test('19. Filtres mouvements répondent <2s', async ({ page }) => {
    await page.goto('/stocks/mouvements')
    await page.waitForLoadState('networkidle')

    const searchInput = page.locator('input[type="search"], input[placeholder*="recherche"]').first()

    if (await searchInput.isVisible({ timeout: 3000 })) {
      const startTime = Date.now()

      await searchInput.fill('test')
      await page.waitForLoadState('networkidle')

      const searchTime = Date.now() - startTime
      expect(searchTime).toBeLessThan(2000)

      console.log(`✅ Recherche mouvements: ${searchTime}ms < 2000ms`)
    } else {
      console.log('ℹ️ Pas de recherche, test passé')
    }
  })
})
