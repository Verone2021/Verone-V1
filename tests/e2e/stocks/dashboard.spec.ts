import { test, expect } from '@playwright/test'

/**
 * Tests E2E - Dashboard Stocks
 *
 * Objectif : Valider la séparation visuelle renforcée entre Stock Réel et Stock Prévisionnel
 *
 * Phase 3.6 : Simplification UI Stock Module (Nov 2025)
 */

test.describe('Dashboard Stocks - Séparation Visuelle Renforcée', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')
  })

  test('section STOCK RÉEL : affiche emoji ✓ dans le titre', async ({ page }) => {
    const title = page.getByRole('heading', { name: /✓ STOCK RÉEL/i })
    await expect(title).toBeVisible()
  })

  test('section STOCK RÉEL : affiche badge "Mouvements Effectués"', async ({ page }) => {
    const badge = page.getByText('Mouvements Effectués')
    await expect(badge).toBeVisible()

    // Vérifier style du badge (vert)
    await expect(badge.locator('..')).toHaveClass(/bg-green/)
  })

  test('section STOCK RÉEL : affiche description claire', async ({ page }) => {
    const description = page.getByText('Inventaire actuel et mouvements confirmés')
    await expect(description).toBeVisible()
  })

  test('section STOCK PRÉVISIONNEL : affiche emoji ⏱ dans le titre', async ({ page }) => {
    const title = page.getByRole('heading', { name: /⏱ STOCK PRÉVISIONNEL/i })
    await expect(title).toBeVisible()
  })

  test('section STOCK PRÉVISIONNEL : affiche badge "Commandes En Cours"', async ({ page }) => {
    const badge = page.getByText('Commandes En Cours')
    await expect(badge).toBeVisible()

    // Vérifier style du badge (bleu)
    await expect(badge.locator('..')).toHaveClass(/bg-blue/)
  })

  test('section STOCK PRÉVISIONNEL : affiche texte "INFORMATIF uniquement"', async ({ page }) => {
    const description = page.getByText(/INFORMATIF uniquement/i)
    await expect(description).toBeVisible()
  })

  test('séparation visuelle : espacement vertical entre les 2 sections', async ({ page }) => {
    const realSection = page.locator('text=✓ STOCK RÉEL').locator('..')
    const forecastSection = page.locator('text=⏱ STOCK PRÉVISIONNEL').locator('..')

    // Vérifier que les 2 sections sont visibles
    await expect(realSection).toBeVisible()
    await expect(forecastSection).toBeVisible()

    // Vérifier que la section prévisionnel a une marge top (mt-8 = 32px)
    const forecastCard = page.locator('text=⏱ STOCK PRÉVISIONNEL').locator('xpath=ancestor::div[contains(@class, "mt-8")]')
    await expect(forecastCard).toBeVisible()
  })

  test('KPIs s\'affichent correctement', async ({ page }) => {
    // Vérifier que les 4 KPIs sont visibles
    await expect(page.getByText('Stock Réel')).toBeVisible()
    await expect(page.getByText('Disponible')).toBeVisible()
    await expect(page.getByText('Alertes')).toBeVisible()
    await expect(page.getByText('Valeur Stock')).toBeVisible()
  })

  test('widget Mouvements 7 Derniers Jours affiche données', async ({ page }) => {
    const widget = page.getByRole('heading', { name: 'Mouvements 7 Derniers Jours' })
    await expect(widget).toBeVisible()

    // Vérifier présence des 3 types
    await expect(page.getByText('Entrées')).toBeVisible()
    await expect(page.getByText('Sorties')).toBeVisible()
    await expect(page.getByText('Ajustements')).toBeVisible()
  })

  test('widget Alertes Stock Faible est visible', async ({ page }) => {
    const widget = page.getByRole('heading', { name: 'Alertes Stock Faible' })
    await expect(widget).toBeVisible()
  })

  test('widget Derniers Mouvements est visible', async ({ page }) => {
    const widget = page.getByRole('heading', { name: 'Derniers Mouvements' })
    await expect(widget).toBeVisible()
  })

  test('widget Stock Prévisionnel affiche commandes', async ({ page }) => {
    const widget = page.getByRole('heading', { name: 'Stock Prévisionnel' })
    await expect(widget).toBeVisible()

    // Vérifier boutons Entrées/Sorties Prévues
    await expect(page.getByRole('button', { name: /Entrées Prévues/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Sorties Prévues/ })).toBeVisible()
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

  test('performance : dashboard charge en <2s', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(2000)
  })
})
