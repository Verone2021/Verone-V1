import { test, expect } from '@playwright/test'

/**
 * Tests E2E - Page Inventaire
 *
 * Objectif : Vérifier qu'aucune régression n'a été introduite par les modifications
 * des pages Mouvements et Dashboard
 *
 * Phase 3.6 : Simplification UI Stock Module (Nov 2025)
 */

test.describe('Page Inventaire - Tests de Régression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/stocks/inventaire')
    await page.waitForLoadState('networkidle')
  })

  test('page charge sans erreur', async ({ page }) => {
    // Vérifier que le titre de la page est présent
    const title = page.getByRole('heading', { name: /inventaire/i })
    await expect(title).toBeVisible()
  })

  test('console = 0 erreurs', async ({ page }) => {
    const errors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    expect(errors).toHaveLength(0)
  })

  test('navigation vers autres pages stocks fonctionne', async ({ page }) => {
    // Vérifier que les boutons de navigation sont présents
    const mouvementsLink = page.getByRole('link', { name: /mouvements/i }).first()
    await expect(mouvementsLink).toBeVisible()

    const alertesLink = page.getByRole('link', { name: /alertes/i }).first()
    await expect(alertesLink).toBeVisible()
  })

  test('performance : page charge en <3s', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/stocks/inventaire')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(3000)
  })

  test('tableau inventaire s\'affiche si produits présents', async ({ page }) => {
    // Attendre un tableau ou un message "Aucun produit"
    const hasTable = await page.locator('table').count() > 0
    const hasEmptyMessage = await page.getByText(/aucun produit/i).count() > 0

    // Au moins l'un des deux doit être présent
    expect(hasTable || hasEmptyMessage).toBe(true)
  })
})
