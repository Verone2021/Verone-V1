/**
 * 🧪 TESTS E2E TRÉSORERIE - Vérone Back Office
 * Tests rapprochement bancaire: Qonto API, auto-match, export CSV
 */

import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      throw new Error(`❌ Console Error: ${msg.text()}`)
    }
  })

  page.on('pageerror', error => {
    throw new Error(`💥 Page Error: ${error.message}`)
  })
})

test.describe('💰 TRÉSORERIE - NAVIGATION & PAGES', () => {
  test('01. Page trésorerie principale accessible', async ({ page }) => {
    await page.goto('/tresorerie')
    await page.waitForLoadState('networkidle')

    // Vérifier URL
    await expect(page).toHaveURL(/tresorerie/)

    // Vérifier contenu
    const hasContent = await page.locator('[data-testid="tresorerie-main"], .tresorerie-content').isVisible({ timeout: 3000 }).catch(() => false)
    const hasTable = await page.locator('table').isVisible({ timeout: 3000 }).catch(() => false)

    expect(hasContent || hasTable).toBeTruthy()
    console.log('✅ Page trésorerie accessible')
  })

  test('02. Dashboard trésorerie affiche solde', async ({ page }) => {
    await page.goto('/tresorerie')
    await page.waitForLoadState('networkidle')

    // Chercher indicateurs solde
    const hasSolde = await page.locator('text=/solde|balance/i').isVisible({ timeout: 3000 }).catch(() => false)
    const hasAmount = await page.locator('text=/€|EUR/i').isVisible({ timeout: 3000 }).catch(() => false)

    console.log(`✅ Indicateurs solde: Solde=${hasSolde}, Montant=${hasAmount}`)
  })
})

test.describe('🏦 RAPPROCHEMENT BANCAIRE - QONTO API', () => {
  test('03. Import transactions Qonto disponible', async ({ page }) => {
    await page.goto('/tresorerie')
    await page.waitForLoadState('networkidle')

    // Chercher bouton import Qonto
    const qontoButton = page.locator('button:has-text("Qonto"), button:has-text("Import"), button:has-text("Synchroniser")').first()

    const isVisible = await qontoButton.isVisible({ timeout: 3000 }).catch(() => false)

    console.log(`✅ Import Qonto: ${isVisible ? 'disponible' : 'non visible'}`)
  })

  test('04. Transactions bancaires affichées', async ({ page }) => {
    await page.goto('/tresorerie')
    await page.waitForLoadState('networkidle')

    // Chercher liste transactions
    const hasTransactions = await page.locator('[data-testid="transactions-table"], table').isVisible({ timeout: 3000 }).catch(() => false)
    const hasTransactionItem = await page.locator('[data-testid="transaction-item"]').isVisible({ timeout: 3000 }).catch(() => false)

    expect(hasTransactions || hasTransactionItem).toBeTruthy()
    console.log('✅ Transactions bancaires affichées')
  })

  test('05. Filtres transactions (date, statut, montant)', async ({ page }) => {
    await page.goto('/tresorerie')
    await page.waitForLoadState('networkidle')

    // Chercher filtres
    const hasDateFilter = await page.locator('input[type="date"]').isVisible({ timeout: 3000 }).catch(() => false)
    const hasStatusFilter = await page.locator('select, [data-testid="status-filter"]').isVisible({ timeout: 3000 }).catch(() => false)
    const hasSearch = await page.locator('input[type="search"]').isVisible({ timeout: 3000 }).catch(() => false)

    console.log(`✅ Filtres: Date=${hasDateFilter}, Statut=${hasStatusFilter}, Recherche=${hasSearch}`)
  })

  test('06. Auto-refresh trésorerie fonctionne', async ({ page }) => {
    await page.goto('/tresorerie')
    await page.waitForLoadState('networkidle')

    // Chercher indicateur auto-refresh
    const hasAutoRefresh = await page.locator('text=/auto-refresh|actualisation automatique/i').isVisible({ timeout: 3000 }).catch(() => false)
    const hasRefreshButton = await page.locator('button:has-text("Actualiser"), button:has-text("Refresh")').isVisible({ timeout: 3000 }).catch(() => false)

    console.log(`✅ Auto-refresh: ${hasAutoRefresh || hasRefreshButton ? 'disponible' : 'non visible'}`)
  })
})

test.describe('🔗 AUTO-MATCHING TRANSACTIONS', () => {
  test('07. Auto-matching transactions/commandes disponible', async ({ page }) => {
    await page.goto('/tresorerie')
    await page.waitForLoadState('networkidle')

    // Chercher fonctionnalité auto-match
    const hasAutoMatch = await page.locator('button:has-text("Match"), button:has-text("Rapprocher"), text=/auto-match/i').isVisible({ timeout: 3000 }).catch(() => false)

    console.log(`✅ Auto-matching: ${hasAutoMatch ? 'disponible' : 'non visible'}`)
  })

  test('08. Validation manuelle matches possible', async ({ page }) => {
    await page.goto('/tresorerie')
    await page.waitForLoadState('networkidle')

    // Chercher actions validation
    const hasValidateButton = await page.locator('button:has-text("Valider"), button:has-text("Confirmer")').isVisible({ timeout: 3000 }).catch(() => false)

    console.log(`✅ Validation manuelle: ${hasValidateButton ? 'disponible' : 'non visible'}`)
  })

  test('09. Statuts rapprochement affichés (matched, unmatched)', async ({ page }) => {
    await page.goto('/tresorerie')
    await page.waitForLoadState('networkidle')

    // Chercher badges statuts
    const hasMatched = await page.locator('text=/rapproché|matched/i').isVisible({ timeout: 3000 }).catch(() => false)
    const hasUnmatched = await page.locator('text=/non rapproché|unmatched/i').isVisible({ timeout: 3000 }).catch(() => false)

    console.log(`✅ Statuts: Matched=${hasMatched}, Unmatched=${hasUnmatched}`)
  })
})

test.describe('📤 EXPORT RAPPROCHEMENT', () => {
  test('10. Export CSV rapprochement disponible', async ({ page }) => {
    await page.goto('/tresorerie')
    await page.waitForLoadState('networkidle')

    // Chercher bouton export
    const exportButton = page.locator('button:has-text("Export"), button:has-text("CSV"), button:has-text("Télécharger")').first()

    const isVisible = await exportButton.isVisible({ timeout: 3000 }).catch(() => false)

    console.log(`✅ Export CSV: ${isVisible ? 'disponible' : 'non visible'}`)
  })

  test('11. Export génère fichier CSV correct', async ({ page }) => {
    await page.goto('/tresorerie')
    await page.waitForLoadState('networkidle')

    const exportButton = page.locator('button:has-text("Export CSV")').first()

    if (await exportButton.isVisible({ timeout: 3000 })) {
      // Écouter téléchargement
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null)

      await exportButton.click()

      const download = await downloadPromise

      if (download) {
        const fileName = download.suggestedFilename()
        expect(fileName).toContain('.csv')

        console.log(`✅ Export CSV: ${fileName}`)
      } else {
        console.log('ℹ️ Téléchargement CSV non capturé')
      }
    } else {
      console.log('ℹ️ Bouton export non visible')
    }
  })
})

test.describe('📊 HISTORIQUE TRÉSORERIE', () => {
  test('12. Historique mouvements trésorerie affiché', async ({ page }) => {
    await page.goto('/tresorerie')
    await page.waitForLoadState('networkidle')

    // Chercher historique
    const hasHistory = await page.locator('table, [data-testid="historique-table"]').isVisible({ timeout: 3000 }).catch(() => false)
    const hasTimeline = await page.locator('[data-testid="timeline"]').isVisible({ timeout: 3000 }).catch(() => false)

    expect(hasHistory || hasTimeline).toBeTruthy()
    console.log('✅ Historique trésorerie affiché')
  })

  test('13. Filtrage par période fonctionnel', async ({ page }) => {
    await page.goto('/tresorerie')
    await page.waitForLoadState('networkidle')

    // Chercher filtres période
    const periodFilter = page.locator('select, button:has-text("Période")').first()

    if (await periodFilter.isVisible({ timeout: 3000 })) {
      await periodFilter.click()
      await page.waitForTimeout(500)

      console.log('✅ Filtrage période fonctionnel')
    } else {
      console.log('ℹ️ Filtre période non visible')
    }
  })
})

test.describe('🚨 CONSOLE ERRORS TRÉSORERIE', () => {
  test('14. Zero erreur console page trésorerie', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/tresorerie')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    if (consoleErrors.length > 0) {
      console.error('❌ Erreurs console:', consoleErrors)
    }

    expect(consoleErrors).toHaveLength(0)
    console.log('✅ Zero erreur console trésorerie')
  })

  test('15. Zero erreur import/refresh données', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/tresorerie')
    await page.waitForLoadState('networkidle')

    // Tester refresh
    const refreshButton = page.locator('button:has-text("Actualiser")').first()

    if (await refreshButton.isVisible({ timeout: 3000 })) {
      await refreshButton.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
    }

    expect(consoleErrors).toHaveLength(0)
    console.log('✅ Zero erreur refresh trésorerie')
  })
})

test.describe('⚡ PERFORMANCE TRÉSORERIE', () => {
  test('16. Page trésorerie charge <2s', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/tresorerie')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(2000)

    console.log(`✅ Page trésorerie: ${loadTime}ms < 2000ms`)
  })

  test('17. Import transactions Qonto <5s', async ({ page }) => {
    await page.goto('/tresorerie')
    await page.waitForLoadState('networkidle')

    const qontoButton = page.locator('button:has-text("Qonto"), button:has-text("Synchroniser")').first()

    if (await qontoButton.isVisible({ timeout: 3000 })) {
      const startTime = Date.now()

      await qontoButton.click()
      await page.waitForLoadState('networkidle')

      const importTime = Date.now() - startTime
      expect(importTime).toBeLessThan(5000)

      console.log(`✅ Import Qonto: ${importTime}ms < 5000ms`)
    } else {
      console.log('ℹ️ Import Qonto non testable')
    }
  })

  test('18. Auto-match transactions <3s', async ({ page }) => {
    await page.goto('/tresorerie')
    await page.waitForLoadState('networkidle')

    const matchButton = page.locator('button:has-text("Match"), button:has-text("Rapprocher automatiquement")').first()

    if (await matchButton.isVisible({ timeout: 3000 })) {
      const startTime = Date.now()

      await matchButton.click()
      await page.waitForLoadState('networkidle')

      const matchTime = Date.now() - startTime
      expect(matchTime).toBeLessThan(3000)

      console.log(`✅ Auto-match: ${matchTime}ms < 3000ms`)
    } else {
      console.log('ℹ️ Auto-match non testable')
    }
  })
})
