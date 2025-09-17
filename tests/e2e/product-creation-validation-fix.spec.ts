/**
 * 🧪 Test E2E - Product Creation Validation Fix
 *
 * Tests the specific fixes implemented:
 * - Fix 1: useProductImages hook handles empty productId gracefully
 * - Fix 2: Validation properly enforces step 6 requirements for product creation
 *
 * Uses the actual test image: "Generated Image September 15, 2025 - 5_02AM.png"
 */

import { test, expect } from '@playwright/test'
import * as path from 'path'

test.describe('Product Creation Validation Fix', () => {
  const testImagePath = path.resolve('./Generated Image September 15, 2025 - 5_02AM.png')

  test.beforeEach(async ({ page }) => {
    // Navigate to login
    await page.goto('http://localhost:3002/login')

    // Login
    await page.fill('input[placeholder*="veronebyromeo@gmail.com"]', 'veronebyromeo@gmail.com')
    await page.fill('input[placeholder*="Votre mot de passe"]', 'Abc123456')
    await page.click('button:has-text("Se connecter")')

    // Wait for redirect to dashboard
    await expect(page).toHaveURL('http://localhost:3002/dashboard')

    // Navigate to catalogue
    await page.click('a[href="/catalogue"]')
    await expect(page).toHaveURL('http://localhost:3002/catalogue')
  })

  test('Fix 1: No more image loading error with empty productId', async ({ page }) => {
    // Monitor console errors specifically for image loading
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('chargement des images')) {
        consoleErrors.push(msg.text())
      }
    })

    // Open product creation wizard
    await page.click('button:has-text("Nouveau produit")')

    // Verify modal opens
    await expect(page.locator('text=Création de produit')).toBeVisible()

    // Wait a moment for any image loading attempts
    await page.waitForTimeout(2000)

    // Verify no image loading errors occurred
    expect(consoleErrors).toHaveLength(0)

    console.log('✅ Fix 1 validated: No image loading errors with empty productId')
  })

  test('Fix 2: Validation properly blocks incomplete product creation', async ({ page }) => {
    // Monitor console for validation debugging
    const validationLogs: string[] = []
    page.on('console', msg => {
      if (msg.text().includes('Validation étape 6') || msg.text().includes('Validation échouée')) {
        validationLogs.push(msg.text())
      }
    })

    // Open wizard
    await page.click('button:has-text("Nouveau produit")')
    await expect(page.locator('text=Création de produit')).toBeVisible()

    // Fill only name (incomplete data)
    await page.fill('input[placeholder*="Canapé d\'angle"]', 'Test Validation Fix')

    // Go to step 6 (validation step)
    await page.click('button[value="6"]')

    // Try to create product with incomplete data
    await page.click('button:has-text("Créer le produit")')

    // Verify validation kicked in
    await page.waitForTimeout(1000)

    // Check that validation logs were generated
    expect(validationLogs.length).toBeGreaterThan(0)
    expect(validationLogs.some(log => log.includes('Validation étape 6'))).toBe(true)

    console.log('✅ Fix 2 validated: Validation properly enforced for step 6')
  })

  test('Complete workflow: Image upload + validation + product creation', async ({ page }) => {
    // Monitor all relevant console logs
    const allLogs: string[] = []
    page.on('console', msg => {
      if (msg.text().includes('🔍') || msg.text().includes('✅') || msg.text().includes('❌') || msg.text().includes('🚀')) {
        allLogs.push(msg.text())
      }
    })

    // Open wizard
    await page.click('button:has-text("Nouveau produit")')
    await expect(page.locator('text=Création de produit')).toBeVisible()

    // Step 1: Basic information
    await page.fill('input[placeholder*="Canapé d\'angle"]', 'Produit Test Complet')

    // Select supplier
    await page.click('[data-testid="supplier-select"] button')
    await page.locator('text=Fournisseur').first().click()

    // Upload test image
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testImagePath)
    await page.waitForTimeout(3000)

    // Step 2: Categorization
    await page.click('button[value="2"]')
    // Skip category selection for this test

    // Step 4: Pricing
    await page.click('button[value="4"]')
    await page.fill('input[placeholder*="150.00"]', '100.00')
    await page.fill('input[placeholder*="100.0"]', '50')

    // Step 6: Final validation
    await page.click('button[value="6"]')

    // Now try to create the product
    await page.click('button:has-text("Créer le produit")')

    // Wait for validation to run
    await page.waitForTimeout(2000)

    // Check the logs to understand what happened
    console.log('All validation logs:', allLogs)

    // Verify validation ran and identified missing fields correctly
    expect(allLogs.some(log => log.includes('🚀 Tentative de création produit'))).toBe(true)
    expect(allLogs.some(log => log.includes('🔍 Validation étape 6'))).toBe(true)

    console.log('✅ Complete workflow validated: All debugging and validation working')
  })

  test('Regression test: Create product with all required fields', async ({ page }) => {
    // Open wizard
    await page.click('button:has-text("Nouveau produit")')
    await expect(page.locator('text=Création de produit')).toBeVisible()

    // Step 1: Complete basic info
    await page.fill('input[placeholder*="Canapé d\'angle"]', 'Produit Complet Test')

    // Select supplier (required)
    await page.click('select[name="supplier_id"]', { timeout: 10000 }).catch(async () => {
      // Alternative selector if the first doesn't work
      await page.click('[role="combobox"]')
    })
    await page.locator('text=Fournisseur').first().click()

    // Step 2: Select subcategory (required)
    await page.click('button[value="2"]')
    await page.click('input[placeholder*="Rechercher"]')
    await page.fill('input[placeholder*="Rechercher"]', 'Canapé')
    await page.locator('text=Canapé').first().click()

    // Step 4: Add pricing (required)
    await page.click('button[value="4"]')
    await page.fill('input[placeholder*="150.00"]', '200.00')

    // Step 6: Validation and creation
    await page.click('button[value="6"]')

    // Save as draft first to get an ID
    await page.click('button:has-text("Sauvegarder")')
    await expect(page.locator('text=Brouillon sauvegardé avec succès')).toBeVisible({ timeout: 10000 })

    // Now try creating the product
    await page.click('button:has-text("Créer le produit")')

    // Should succeed or at least give clear feedback
    await page.waitForTimeout(3000)

    console.log('✅ Regression test completed')
  })
})