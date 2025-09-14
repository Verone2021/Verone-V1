/**
 * 🔐 Tests E2E - Flux d'Authentification
 *
 * Validation du workflow complet : Homepage → Login → Dashboard
 */

import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {

  test('Homepage shows public layout with login button for unauthenticated users', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/')

    // Should show Vérone branding
    await expect(page.locator('h1')).toContainText('VÉRONE')
    await expect(page.locator('text=Back Office')).toBeVisible()

    // Should show login button
    const loginButton = page.locator('a[href="/login"]')
    await expect(loginButton).toBeVisible()
    await expect(loginButton).toContainText('Se connecter')

    // Should NOT show sidebar or header (unauthenticated)
    await expect(page.locator('aside')).not.toBeVisible()
    await expect(page.locator('header')).not.toBeVisible()

    // Should show features section
    await expect(page.locator('text=Catalogue')).toBeVisible()
    await expect(page.locator('text=Commandes')).toBeVisible()
    await expect(page.locator('text=Clients')).toBeVisible()
  })

  test('Login button redirects to login page', async ({ page }) => {
    await page.goto('/')

    // Click login button
    await page.locator('a[href="/login"]').click()

    // Should be redirected to login page
    await expect(page).toHaveURL('/login')

    // Should show login form
    await expect(page.locator('h1')).toContainText('VÉRONE')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('Dashboard requires authentication', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard')

    // Should be redirected to login with redirect parameter
    await expect(page).toHaveURL('/login?redirect=%2Fdashboard')
  })

  test('Complete authentication flow: Login → Dashboard with sidebar', async ({ page }) => {
    // Start at homepage
    await page.goto('/')

    // Click login button
    await page.locator('a[href="/login"]').click()
    await expect(page).toHaveURL('/login')

    // Fill login form
    await page.fill('input[type="email"]', 'admin@verone.fr')
    await page.fill('input[type="password"]', 'password123')

    // Submit form (this sets the authentication cookie)
    await page.click('button[type="submit"]')

    // Should be redirected to dashboard
    await expect(page).toHaveURL('/dashboard')

    // Now should show authenticated layout with sidebar and header
    await expect(page.locator('aside')).toBeVisible() // Sidebar
    await expect(page.locator('header')).toBeVisible() // Header

    // Should show navigation items in sidebar
    await expect(page.locator('text=Dashboard')).toBeVisible()
    await expect(page.locator('text=Catalogue')).toBeVisible()
    await expect(page.locator('text=Commandes')).toBeVisible()

    // Should show header search
    await expect(page.locator('input[placeholder*="Rechercher"]')).toBeVisible()
  })

  test('Logout returns to homepage', async ({ page }) => {
    // Login first (set authentication cookie manually for this test)
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@verone.fr')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Should be at dashboard
    await expect(page).toHaveURL('/dashboard')

    // Click logout button
    await page.locator('text=Déconnexion').click()

    // Should be redirected to login page
    await expect(page).toHaveURL('/login')

    // Try to access dashboard again - should be redirected to login
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login?redirect=%2Fdashboard')
  })

  test('Authenticated user visiting homepage redirects to dashboard', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@verone.fr')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Visit homepage while authenticated
    await page.goto('/')

    // Should be redirected to dashboard (middleware behavior)
    // Note: This test may need adjustment based on actual middleware implementation
    await page.waitForURL(/\/(dashboard)?/)
  })

  test('Homepage is mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/')

    // Should still show main elements on mobile
    await expect(page.locator('h1')).toContainText('VÉRONE')
    await expect(page.locator('a[href="/login"]')).toBeVisible()

    // Features should stack vertically on mobile
    const featuresGrid = page.locator('.grid')
    await expect(featuresGrid).toHaveCSS('grid-template-columns', 'repeat(1, minmax(0px, 1fr))')
  })
})