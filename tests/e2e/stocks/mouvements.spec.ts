import { test, expect } from '@playwright/test'

/**
 * Tests E2E - Page Mouvements de Stock
 *
 * Objectif : Valider que la page affiche UNIQUEMENT les mouvements réels (affects_forecast=false)
 * et que la séparation réel/prévisionnel est claire.
 *
 * Phase 3.6 : Simplification UI Stock Module (Nov 2025)
 */

test.describe('Page Mouvements - Stock Réel Uniquement', () => {
  test.beforeEach(async ({ page }) => {
    // Aller sur la page Mouvements
    await page.goto('/stocks/mouvements')

    // Attendre que la page soit chargée
    await page.waitForLoadState('networkidle')
  })

  test('affiche le badge "Stock Réel Uniquement" sur onglet Tous', async ({ page }) => {
    // Vérifier présence du badge vert avec texte exact
    const badge = page.getByText('✓ Historique Mouvements Effectués - Stock Réel Uniquement')
    await expect(badge).toBeVisible()

    // Vérifier style du badge (vert)
    await expect(badge).toHaveClass(/bg-green/)
  })

  test('n\'affiche AUCUN onglet Réel/Prévisionnel imbriqué', async ({ page }) => {
    // Vérifier qu'il n'y a PAS de TabsTrigger avec "Entrées Réelles" ou "Entrées Prévisionnelles"
    const realTab = page.getByRole('tab', { name: /Entrées Réelles/i })
    await expect(realTab).not.toBeVisible()

    const forecastTab = page.getByRole('tab', { name: /Entrées Prévisionnelles/i })
    await expect(forecastTab).not.toBeVisible()
  })

  test('affiche uniquement des mouvements réels (pas de badge "Prévisionnel ↗/↘")', async ({ page }) => {
    // Attendre que les mouvements soient chargés
    await page.waitForSelector('table tbody tr', { timeout: 10000 })

    // Vérifier qu'AUCUN badge "Prévisionnel ↗" ou "Prévisionnel ↘" n'est présent
    const forecastInBadge = page.getByText('Prévisionnel ↗')
    await expect(forecastInBadge).not.toBeVisible()

    const forecastOutBadge = page.getByText('Prévisionnel ↘')
    await expect(forecastOutBadge).not.toBeVisible()
  })

  test('affiche le filtre actif "affects_forecast" dans le badge Filtres', async ({ page }) => {
    // Le badge "Filtres" doit afficher "1" (filtre affects_forecast actif)
    const filtersBadge = page.getByRole('button', { name: /Filtres/ }).locator('span').filter({ hasText: /^1$/ })
    await expect(filtersBadge).toBeVisible()
  })

  test('console = 0 erreurs', async ({ page }) => {
    const errors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    // Recharger la page pour capturer les erreurs console
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Vérifier 0 erreurs console
    expect(errors).toHaveLength(0)
  })

  test('onglet Entrées affiche badge "Stock Réel Uniquement"', async ({ page }) => {
    // Cliquer sur onglet Entrées
    await page.getByRole('tab', { name: 'Entrées' }).click()

    // Vérifier badge vert visible
    const badge = page.getByText('✓ Historique Mouvements Effectués - Stock Réel Uniquement')
    await expect(badge).toBeVisible()
  })

  test('onglet Sorties affiche badge "Stock Réel Uniquement"', async ({ page }) => {
    // Cliquer sur onglet Sorties
    await page.getByRole('tab', { name: 'Sorties' }).click()

    // Vérifier badge vert visible
    const badge = page.getByText('✓ Historique Mouvements Effectués - Stock Réel Uniquement')
    await expect(badge).toBeVisible()
  })

  test('performance : page charge en <3s', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/stocks/mouvements')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(3000)
  })
})
