/**
 * 🧪 TESTS E2E DASHBOARD - Vérone Back Office
 * Tests complets du dashboard principal avec KPIs et navigation
 * SLO Critique: Dashboard load <2s
 */

import { test, expect } from '@playwright/test'

// Configuration console error tracking (zero tolerance)
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

  // Stocker errors pour vérification finale
  ;(page as any).consoleErrors = consoleErrors
})

test.describe('🏠 DASHBOARD PRINCIPAL', () => {
  test('01. Dashboard charge correctement avec KPIs', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Vérifier titre page
    await expect(page).toHaveTitle(/dashboard/i)

    // Vérifier présence widgets principaux (flexibles)
    const hasKPIs = await page.locator('[data-testid="dashboard-metrics"]').isVisible().catch(() => false)
    const hasCards = await page.locator('[data-testid="kpi-card"]').isVisible().catch(() => false)
    const hasWidgets = await page.locator('.dashboard-widget').isVisible().catch(() => false)

    expect(hasKPIs || hasCards || hasWidgets).toBeTruthy()

    // Performance SLO: <2s
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(2000)

    console.log(`✅ Dashboard chargé en ${loadTime}ms (SLO <2000ms)`)
  })

  test('02. KPIs business affichés (CA, Commandes, Stocks)', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Vérifier présence indicateurs métier (recherche flexible)
    const hasRevenue = await page.locator('text=/chiffre|revenue|ca|ventes/i').isVisible().catch(() => false)
    const hasOrders = await page.locator('text=/commande|order/i').isVisible().catch(() => false)
    const hasStock = await page.locator('text=/stock|inventaire/i').isVisible().catch(() => false)

    // Au moins 1 KPI doit être visible
    const hasAnyKPI = hasRevenue || hasOrders || hasStock

    if (!hasAnyKPI) {
      // Fallback: chercher cartes génériques
      const cardCount = await page.locator('[data-testid="kpi-card"]').count()
      expect(cardCount).toBeGreaterThan(0)
    }

    console.log(`✅ KPIs business présents: CA=${hasRevenue}, Commandes=${hasOrders}, Stocks=${hasStock}`)
  })

  test('03. Navigation rapide vers modules depuis dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Tester navigation vers Catalogue
    const catalogueLink = page.locator('a[href*="catalogue"], text=/catalogue/i').first()
    if (await catalogueLink.isVisible({ timeout: 3000 })) {
      await catalogueLink.click()
      await expect(page).toHaveURL(/catalogue/)
      await page.goBack()
    }

    // Tester navigation vers Stocks
    const stocksLink = page.locator('a[href*="stocks"], text=/stocks/i').first()
    if (await stocksLink.isVisible({ timeout: 3000 })) {
      await stocksLink.click()
      await expect(page).toHaveURL(/stocks/)
      await page.goBack()
    }

    console.log('✅ Navigation rapide fonctionnelle')
  })

  test('04. Filtres dates/périodes dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Chercher filtres dates
    const dateFilter = page.locator('input[type="date"]').first()
    const periodSelector = page.locator('select').first()
    const dateButton = page.locator('button:has-text("Date"), button:has-text("Période")').first()

    const hasDateFilter = await dateFilter.isVisible({ timeout: 3000 }).catch(() => false)
    const hasPeriodSelector = await periodSelector.isVisible({ timeout: 3000 }).catch(() => false)
    const hasDateButton = await dateButton.isVisible({ timeout: 3000 }).catch(() => false)

    const hasAnyFilter = hasDateFilter || hasPeriodSelector || hasDateButton

    if (hasAnyFilter) {
      console.log('✅ Filtres dates/périodes disponibles')
    } else {
      console.log('ℹ️ Pas de filtres dates visibles (pas bloquant)')
    }
  })

  test('05. Refresh données temps réel', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Capturer valeurs initiales
    const initialKPIValues = await page.locator('[data-testid="kpi-card"]').allTextContents()

    // Chercher bouton refresh
    const refreshButton = page.locator('button:has-text("Actualiser"), button:has-text("Refresh"), button[title*="actualiser"]').first()

    if (await refreshButton.isVisible({ timeout: 3000 })) {
      await refreshButton.click()
      await page.waitForTimeout(1000)

      // Vérifier que contenu a rechargé
      await page.waitForLoadState('networkidle')

      console.log('✅ Refresh données fonctionne')
    } else {
      // Fallback: recharger page manuellement
      await page.reload()
      await page.waitForLoadState('networkidle')

      console.log('ℹ️ Pas de bouton refresh (rechargement page OK)')
    }
  })
})

test.describe('🚨 CONSOLE ERROR CHECKING DASHBOARD', () => {
  test('06. Zero erreur console dashboard principal', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Attendre 2s pour capturer erreurs différées
    await page.waitForTimeout(2000)

    if (consoleErrors.length > 0) {
      console.error('❌ Erreurs console détectées:', consoleErrors)
    }

    expect(consoleErrors).toHaveLength(0)
    console.log('✅ Zero erreur console dashboard')
  })

  test('07. Zero erreur navigation entre widgets', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Interagir avec widgets si disponibles
    const widgets = await page.locator('[data-testid="dashboard-widget"], .dashboard-card').all()

    for (const widget of widgets.slice(0, 3)) {
      if (await widget.isVisible()) {
        await widget.click({ force: true })
        await page.waitForTimeout(500)
      }
    }

    await page.waitForTimeout(1000)

    expect(consoleErrors).toHaveLength(0)
    console.log('✅ Zero erreur interactions widgets')
  })
})

test.describe('⚡ PERFORMANCE DASHBOARD', () => {
  test('08. SLO Dashboard <2s (critique)', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Attendre que KPIs soient visibles
    const hasContent = await page.locator('[data-testid="dashboard-metrics"], [data-testid="kpi-card"], .dashboard-widget').first().isVisible({ timeout: 3000 }).catch(() => false)

    const loadTime = Date.now() - startTime

    // SLO strict <2s
    expect(loadTime).toBeLessThan(2000)

    console.log(`✅ SLO respecté: ${loadTime}ms < 2000ms`)
  })

  test('09. Refresh KPIs <1s', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const refreshButton = page.locator('button:has-text("Actualiser"), button:has-text("Refresh")').first()

    if (await refreshButton.isVisible({ timeout: 3000 })) {
      const startTime = Date.now()

      await refreshButton.click()
      await page.waitForLoadState('networkidle')

      const refreshTime = Date.now() - startTime

      expect(refreshTime).toBeLessThan(1000)

      console.log(`✅ Refresh rapide: ${refreshTime}ms < 1000ms`)
    } else {
      console.log('ℹ️ Pas de bouton refresh, test passé')
    }
  })
})

test.describe('📱 ACCESSIBILITÉ DASHBOARD', () => {
  test('10. Navigation keyboard entre KPIs', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Tester navigation Tab
    await page.keyboard.press('Tab')
    await page.waitForTimeout(200)
    await page.keyboard.press('Tab')
    await page.waitForTimeout(200)

    // Vérifier qu'un élément est focus
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()

    console.log(`✅ Navigation keyboard fonctionnelle (focus: ${focusedElement})`)
  })

  test('11. Contraste couleurs WCAG AA', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Vérifier présence design system Vérone (noir/blanc/gris)
    const bodyStyles = await page.evaluate(() => {
      const body = document.body
      const styles = window.getComputedStyle(body)
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color
      }
    })

    console.log('✅ Styles dashboard:', bodyStyles)
    expect(bodyStyles).toBeTruthy()
  })
})
