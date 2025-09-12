import { test, expect } from '@playwright/test'

test.describe('Contrats Wizard - Navigation and Form Persistence', () => {
  test.describe('Multi-Step Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:3000/contrats/new')
      await page.waitForSelector('[data-testid="wizard-container"]', { timeout: 10000 })
    })

    test('should display correct step indicators', async ({ page }) => {
      // Step 1 should be active initially
      const step1Indicator = page.locator('[data-testid="step-indicator-1"]')
      const step2Indicator = page.locator('[data-testid="step-indicator-2"]')
      const step3Indicator = page.locator('[data-testid="step-indicator-3"]')
      
      await expect(step1Indicator).toHaveClass(/active|current/)
      await expect(step2Indicator).not.toHaveClass(/active|current/)
      await expect(step3Indicator).not.toHaveClass(/active|current/)
    })

    test('should navigate forward through wizard steps', async ({ page }) => {
      // Complete Step 1
      await page.click('[data-testid="property-selector"]')
      await page.waitForSelector('[data-testid="property-option-1"]')
      await page.click('[data-testid="property-option-1"]')
      
      await page.click('[data-testid="next-button"]')
      await page.waitForSelector('[data-testid="wizard-step-2"]')
      
      // Verify step 2 is active
      await expect(page.locator('[data-testid="step-indicator-2"]')).toHaveClass(/active|current/)
      await expect(page.locator('h2')).toContainText('Informations Générales')
      
      // Complete Step 2
      await page.click('[name="type_contrat"]')
      await page.click('[role="option"][data-value="fixe"]')
      await page.fill('[name="date_debut"]', '2025-06-01')
      await page.fill('[name="date_fin"]', '2025-12-31')
      
      await page.click('[data-testid="next-button"]')
      await page.waitForSelector('[data-testid="wizard-step-3"]')
      
      // Verify step 3 is active
      await expect(page.locator('[data-testid="step-indicator-3"]')).toHaveClass(/active|current/)
      await expect(page.locator('h2')).toContainText('Conditions Financières')
    })

    test('should navigate backward through wizard steps', async ({ page }) => {
      // Navigate to Step 3 first
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      await page.click('[data-testid="next-button"]')
      
      await page.waitForSelector('[data-testid="wizard-step-2"]')
      await page.click('[name="type_contrat"]')
      await page.click('[role="option"][data-value="fixe"]')
      await page.fill('[name="date_debut"]', '2025-06-01')
      await page.fill('[name="date_fin"]', '2025-12-31')
      await page.click('[data-testid="next-button"]')
      
      await page.waitForSelector('[data-testid="wizard-step-3"]')
      
      // Navigate back to Step 2
      await page.click('[data-testid="prev-button"]')
      await expect(page.locator('[data-testid="wizard-step-2"]')).toBeVisible()
      await expect(page.locator('[data-testid="step-indicator-2"]')).toHaveClass(/active|current/)
      
      // Navigate back to Step 1
      await page.click('[data-testid="prev-button"]')
      await expect(page.locator('[data-testid="wizard-step-1"]')).toBeVisible()
      await expect(page.locator('[data-testid="step-indicator-1"]')).toHaveClass(/active|current/)
    })

    test('should disable navigation buttons appropriately', async ({ page }) => {
      // Step 1: Previous should be disabled, Next should be disabled until selection
      await expect(page.locator('[data-testid="prev-button"]')).toBeDisabled()
      await expect(page.locator('[data-testid="next-button"]')).toBeDisabled()
      
      // After selecting property, Next should be enabled
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      await expect(page.locator('[data-testid="next-button"]')).not.toBeDisabled()
      
      // Step 2: Previous should be enabled
      await page.click('[data-testid="next-button"]')
      await expect(page.locator('[data-testid="prev-button"]')).not.toBeDisabled()
      
      // Next should be disabled until form is complete
      await expect(page.locator('[data-testid="next-button"]')).toBeDisabled()
      
      // After filling required fields, Next should be enabled
      await page.click('[name="type_contrat"]')
      await page.click('[role="option"][data-value="fixe"]')
      await page.fill('[name="date_debut"]', '2025-06-01')
      await page.fill('[name="date_fin"]', '2025-12-31')
      
      await expect(page.locator('[data-testid="next-button"]')).not.toBeDisabled()
    })

    test('should show step completion status', async ({ page }) => {
      // Complete Step 1
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      await page.click('[data-testid="next-button"]')
      
      // Step 1 should show as completed
      const step1Indicator = page.locator('[data-testid="step-indicator-1"]')
      await expect(step1Indicator).toHaveClass(/completed|success/)
      
      // Complete Step 2
      await page.click('[name="type_contrat"]')
      await page.click('[role="option"][data-value="fixe"]')
      await page.fill('[name="date_debut"]', '2025-06-01')
      await page.fill('[name="date_fin"]', '2025-12-31')
      await page.click('[data-testid="next-button"]')
      
      // Both Step 1 and 2 should show as completed
      await expect(step1Indicator).toHaveClass(/completed|success/)
      const step2Indicator = page.locator('[data-testid="step-indicator-2"]')
      await expect(step2Indicator).toHaveClass(/completed|success/)
    })
  })

  test.describe('Form Data Persistence', () => {
    test('should persist data when navigating between steps', async ({ page }) => {
      await page.goto('http://localhost:3000/contrats/new')
      await page.waitForSelector('[data-testid="wizard-container"]')
      
      // Complete Step 1
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      
      // Store selected property info for verification
      const selectedPropertyText = await page.locator('[data-testid="property-selector"]').textContent()
      
      await page.click('[data-testid="next-button"]')
      
      // Fill Step 2 data
      await page.click('[name="type_contrat"]')
      await page.click('[role="option"][data-value="variable"]')
      
      await page.fill('[name="date_debut"]', '2025-06-15')
      await page.fill('[name="date_fin"]', '2025-11-30')
      
      await page.click('[name="meuble"]') // Toggle furnished
      
      // Fill bailleur information
      await page.fill('[name="bailleur_nom"]', 'Jean Dupont')
      await page.fill('[name="bailleur_email"]', 'jean.dupont@example.com')
      await page.fill('[name="bailleur_telephone"]', '+33 1 23 45 67 89')
      
      // Navigate to Step 3
      await page.click('[data-testid="next-button"]')
      await page.waitForSelector('[data-testid="wizard-step-3"]')
      
      // Navigate back to Step 2
      await page.click('[data-testid="prev-button"]')
      
      // Verify all data is preserved
      await expect(page.locator('[name="type_contrat"]')).toContainText('Contrat Variable')
      await expect(page.locator('[name="date_debut"]')).toHaveValue('2025-06-15')
      await expect(page.locator('[name="date_fin"]')).toHaveValue('2025-11-30')
      
      await expect(page.locator('[name="meuble"]')).toBeChecked()
      
      await expect(page.locator('[name="bailleur_nom"]')).toHaveValue('Jean Dupont')
      await expect(page.locator('[name="bailleur_email"]')).toHaveValue('jean.dupont@example.com')
      await expect(page.locator('[name="bailleur_telephone"]')).toHaveValue('+33 1 23 45 67 89')
      
      // Navigate back to Step 1
      await page.click('[data-testid="prev-button"]')
      
      // Verify property selection is preserved
      await expect(page.locator('[data-testid="property-selector"]')).toContainText(selectedPropertyText || '')
    })

    test('should persist financial data in Step 3', async ({ page }) => {
      // Navigate to Step 3
      await page.goto('http://localhost:3000/contrats/new')
      await page.waitForSelector('[data-testid="wizard-container"]')
      
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      await page.click('[data-testid="next-button"]')
      
      await page.click('[name="type_contrat"]')
      await page.click('[role="option"][data-value="variable"]')
      await page.fill('[name="date_debut"]', '2025-06-01')
      await page.fill('[name="date_fin"]', '2025-12-31')
      await page.click('[data-testid="next-button"]')
      
      await page.waitForSelector('[data-testid="wizard-step-3"]')
      
      // Fill financial data
      await page.fill('[name="commission_pourcentage"]', '10')
      await page.fill('[name="usage_proprietaire_jours_max"]', '45')
      await page.fill('[name="estimation_revenus_mensuels"]', '2500')
      
      // Navigate back and forth
      await page.click('[data-testid="prev-button"]')
      await page.click('[data-testid="next-button"]')
      
      // Verify financial data is preserved
      await expect(page.locator('[name="commission_pourcentage"]')).toHaveValue('10')
      await expect(page.locator('[name="usage_proprietaire_jours_max"]')).toHaveValue('45')
      await expect(page.locator('[name="estimation_revenus_mensuels"]')).toHaveValue('2500')
    })

    test('should handle form validation errors without losing data', async ({ page }) => {
      await page.goto('http://localhost:3000/contrats/new')
      await page.waitForSelector('[data-testid="wizard-container"]')
      
      // Complete Step 1
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      await page.click('[data-testid="next-button"]')
      
      // Fill Step 2 with some invalid data
      await page.click('[name="type_contrat"]')
      await page.click('[role="option"][data-value="fixe"]')
      
      await page.fill('[name="date_debut"]', '2025-06-01')
      await page.fill('[name="date_fin"]', '2025-05-01') // Invalid: end before start
      
      await page.fill('[name="bailleur_nom"]', 'Marie Martin')
      await page.fill('[name="bailleur_email"]', 'marie.martin@example.com')
      
      // Try to proceed (should show validation error)
      await page.click('[data-testid="next-button"]')
      
      // Should show error but preserve other valid data
      await expect(page.locator('[data-testid="date-fin-error"]')).toBeVisible()
      
      // Verify other data is preserved
      await expect(page.locator('[name="type_contrat"]')).toContainText('Contrat Fixe')
      await expect(page.locator('[name="date_debut"]')).toHaveValue('2025-06-01')
      await expect(page.locator('[name="bailleur_nom"]')).toHaveValue('Marie Martin')
      await expect(page.locator('[name="bailleur_email"]')).toHaveValue('marie.martin@example.com')
      
      // Fix the error
      await page.fill('[name="date_fin"]', '2025-12-31')
      
      // Should now be able to proceed
      await page.click('[data-testid="next-button"]')
      await expect(page.locator('[data-testid="wizard-step-3"]')).toBeVisible()
    })
  })

  test.describe('Auto-Save Functionality', () => {
    test('should auto-save form data as draft', async ({ page }) => {
      await page.goto('http://localhost:3000/contrats/new')
      await page.waitForSelector('[data-testid="wizard-container"]')
      
      // Complete Step 1
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      await page.click('[data-testid="next-button"]')
      
      // Start filling Step 2
      await page.click('[name="type_contrat"]')
      await page.click('[role="option"][data-value="fixe"]')
      
      // Wait for auto-save indicator
      const autoSaveIndicator = page.locator('[data-testid="auto-save-indicator"]')
      await expect(autoSaveIndicator).toBeVisible({ timeout: 5000 })
      await expect(autoSaveIndicator).toContainText('Brouillon sauvegardé')
      
      // Continue filling form
      await page.fill('[name="date_debut"]', '2025-06-01')
      
      // Should show updated save status
      await expect(autoSaveIndicator).toContainText('Brouillon sauvegardé')
    })

    test('should restore draft data on page reload', async ({ page }) => {
      await page.goto('http://localhost:3000/contrats/new')
      await page.waitForSelector('[data-testid="wizard-container"]')
      
      // Fill some data
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      await page.click('[data-testid="next-button"]')
      
      await page.click('[name="type_contrat"]')
      await page.click('[role="option"][data-value="variable"]')
      await page.fill('[name="date_debut"]', '2025-07-01')
      await page.fill('[name="bailleur_nom"]', 'Test Bailleur')
      
      // Wait for auto-save
      await expect(page.locator('[data-testid="auto-save-indicator"]')).toContainText('Brouillon sauvegardé')
      
      // Reload page
      await page.reload()
      await page.waitForSelector('[data-testid="wizard-container"]')
      
      // Should restore to the same step with data
      await expect(page.locator('[data-testid="wizard-step-2"]')).toBeVisible()
      await expect(page.locator('[name="type_contrat"]')).toContainText('Contrat Variable')
      await expect(page.locator('[name="date_debut"]')).toHaveValue('2025-07-01')
      await expect(page.locator('[name="bailleur_nom"]')).toHaveValue('Test Bailleur')
    })

    test('should show save status indicators', async ({ page }) => {
      await page.goto('http://localhost:3000/contrats/new')
      await page.waitForSelector('[data-testid="wizard-container"]')
      
      // Complete Step 1 and start Step 2
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      await page.click('[data-testid="next-button"]')
      
      // Initially should show no changes or draft
      const saveIndicator = page.locator('[data-testid="save-status-indicator"]')
      if (await saveIndicator.isVisible()) {
        await expect(saveIndicator).toContainText(/non sauvegardé|brouillon/)
      }
      
      // Make changes
      await page.click('[name="type_contrat"]')
      await page.click('[role="option"][data-value="fixe"]')
      
      // Should show saving or saved status
      const autoSaveIndicator = page.locator('[data-testid="auto-save-indicator"]')
      await expect(autoSaveIndicator).toBeVisible()
      
      // Should eventually show "saved" status
      await expect(autoSaveIndicator).toContainText(/sauvegardé|enregistré/)
    })

    test('should handle save errors gracefully', async ({ page }) => {
      // Mock network failure for auto-save
      await page.route('**/api/contrats/draft', route => route.abort())
      
      await page.goto('http://localhost:3000/contrats/new')
      await page.waitForSelector('[data-testid="wizard-container"]')
      
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      await page.click('[data-testid="next-button"]')
      
      // Try to trigger auto-save
      await page.click('[name="type_contrat"]')
      await page.click('[role="option"][data-value="fixe"]')
      
      // Should show error indicator
      const errorIndicator = page.locator('[data-testid="save-error-indicator"]')
      await expect(errorIndicator).toBeVisible({ timeout: 5000 })
      await expect(errorIndicator).toContainText(/erreur|échec|impossible/)
      
      // Form should still be functional
      await page.fill('[name="date_debut"]', '2025-06-01')
      await expect(page.locator('[name="date_debut"]')).toHaveValue('2025-06-01')
    })
  })

  test.describe('Browser Navigation Integration', () => {
    test('should handle browser back/forward buttons', async ({ page }) => {
      await page.goto('http://localhost:3000/contrats/new')
      await page.waitForSelector('[data-testid="wizard-container"]')
      
      // Complete Step 1
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      await page.click('[data-testid="next-button"]')
      
      // Complete Step 2 and go to Step 3
      await page.click('[name="type_contrat"]')
      await page.click('[role="option"][data-value="fixe"]')
      await page.fill('[name="date_debut"]', '2025-06-01')
      await page.fill('[name="date_fin"]', '2025-12-31')
      await page.click('[data-testid="next-button"]')
      
      await expect(page.locator('[data-testid="wizard-step-3"]')).toBeVisible()
      
      // Use browser back button
      await page.goBack()
      
      // Should return to Step 2 with data preserved
      await expect(page.locator('[data-testid="wizard-step-2"]')).toBeVisible()
      await expect(page.locator('[name="type_contrat"]')).toContainText('Contrat Fixe')
      
      // Use browser forward button
      await page.goForward()
      
      // Should return to Step 3
      await expect(page.locator('[data-testid="wizard-step-3"]')).toBeVisible()
    })

    test('should update URL with current step', async ({ page }) => {
      await page.goto('http://localhost:3000/contrats/new')
      
      // URL should reflect current step
      await expect(page).toHaveURL(/step=1|etape=1/)
      
      // Navigate to Step 2
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      await page.click('[data-testid="next-button"]')
      
      // URL should update
      await expect(page).toHaveURL(/step=2|etape=2/)
      
      // Navigate to Step 3
      await page.click('[name="type_contrat"]')
      await page.click('[role="option"][data-value="fixe"]')
      await page.fill('[name="date_debut"]', '2025-06-01')
      await page.fill('[name="date_fin"]', '2025-12-31')
      await page.click('[data-testid="next-button"]')
      
      // URL should update to Step 3
      await expect(page).toHaveURL(/step=3|etape=3/)
    })

    test('should handle direct navigation to specific steps', async ({ page }) => {
      // Try to navigate directly to Step 2
      await page.goto('http://localhost:3000/contrats/new?step=2')
      
      // Should either:
      // 1. Redirect to Step 1 if prerequisites not met
      // 2. Show Step 2 if draft data exists
      // 3. Show appropriate validation/error state
      
      // Most likely should redirect to Step 1 for new contract
      await expect(page.locator('[data-testid="wizard-step-1"]')).toBeVisible()
    })
  })

  test.describe('Performance and UX', () => {
    test('should transition between steps smoothly', async ({ page }) => {
      await page.goto('http://localhost:3000/contrats/new')
      await page.waitForSelector('[data-testid="wizard-container"]')
      
      // Measure step transition time
      const startTime = Date.now()
      
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      await page.click('[data-testid="next-button"]')
      
      await page.waitForSelector('[data-testid="wizard-step-2"]')
      
      const transitionTime = Date.now() - startTime
      
      // Should transition within reasonable time
      expect(transitionTime).toBeLessThan(1000) // < 1 second
    })

    test('should show loading states during navigation', async ({ page }) => {
      await page.goto('http://localhost:3000/contrats/new')
      await page.waitForSelector('[data-testid="wizard-container"]')
      
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      
      // Click next button and immediately check for loading state
      await page.click('[data-testid="next-button"]')
      
      // Should show loading indicator briefly
      const loadingIndicator = page.locator('[data-testid="navigation-loading"]')
      if (await loadingIndicator.isVisible({ timeout: 100 })) {
        await expect(loadingIndicator).toBeVisible()
      }
      
      // Should eventually reach Step 2
      await page.waitForSelector('[data-testid="wizard-step-2"]')
    })

    test('should prevent double-click navigation issues', async ({ page }) => {
      await page.goto('http://localhost:3000/contrats/new')
      await page.waitForSelector('[data-testid="wizard-container"]')
      
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      
      // Double-click next button rapidly
      const nextButton = page.locator('[data-testid="next-button"]')
      await nextButton.click()
      await nextButton.click() // Second click should be ignored/handled gracefully
      
      // Should only advance one step
      await expect(page.locator('[data-testid="wizard-step-2"]')).toBeVisible()
      await expect(page.locator('[data-testid="wizard-step-3"]')).not.toBeVisible()
    })
  })
})