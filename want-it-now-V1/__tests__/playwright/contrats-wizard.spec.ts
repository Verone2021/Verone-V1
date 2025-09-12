import { test, expect } from '@playwright/test'

test.describe('Contrats Wizard - Business Rules Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to contrats wizard
    await page.goto('http://localhost:3000/contrats/new')
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="wizard-container"]', { timeout: 10000 })
  })

  test.describe('Step 1: Property/Unit Selection', () => {
    test('should display property selection step', async ({ page }) => {
      // Verify we're on step 1
      await expect(page.locator('[data-testid="wizard-step-1"]')).toBeVisible()
      
      // Verify step title
      await expect(page.locator('h2')).toContainText('Sélection Propriété/Unité')
      
      // Verify property selection is available
      await expect(page.locator('[data-testid="property-selector"]')).toBeVisible()
    })

    test('should validate property selection before proceeding', async ({ page }) => {
      // Try to proceed without selecting a property
      const nextButton = page.locator('[data-testid="next-button"]')
      
      // Next button should be disabled initially
      await expect(nextButton).toBeDisabled()
      
      // Select a property
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      
      // Next button should now be enabled
      await expect(nextButton).not.toBeDisabled()
    })

    test('should navigate to step 2 after property selection', async ({ page }) => {
      // Select a property
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      
      // Click next
      await page.click('[data-testid="next-button"]')
      
      // Should be on step 2
      await expect(page.locator('[data-testid="wizard-step-2"]')).toBeVisible()
      await expect(page.locator('h2')).toContainText('Informations Générales')
    })
  })

  test.describe('Step 2: Informations Générales - Business Rules', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to step 2 by completing step 1
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      await page.click('[data-testid="next-button"]')
      
      // Wait for step 2 to load
      await page.waitForSelector('[data-testid="wizard-step-2"]')
    })

    test('Type de contrat Select - should display both options correctly', async ({ page }) => {
      const typeContratSelect = page.locator('[data-testid="type-contrat-select"]')
      
      // Select should be visible and clickable
      await expect(typeContratSelect).toBeVisible()
      
      // Click to open dropdown
      await typeContratSelect.click()
      
      // Both options should be visible
      const fixeOption = page.locator('[data-testid="contract-type-fixe"]')
      const variableOption = page.locator('[data-testid="contract-type-variable"]')
      
      await expect(fixeOption).toBeVisible()
      await expect(variableOption).toBeVisible()
      
      // Verify option texts
      await expect(fixeOption).toContainText('Contrat Fixe')
      await expect(variableOption).toContainText('Contrat Variable (10% commission)')
    })

    test('should select Contrat Fixe and update form state', async ({ page }) => {
      // Open type contrat dropdown
      await page.click('[data-testid="type-contrat-select"]')
      
      // Select Contrat Fixe
      await page.click('[data-testid="contract-type-fixe"]')
      
      // Verify selection
      const selectedValue = page.locator('[data-testid="type-contrat-select"]')
      await expect(selectedValue).toContainText('Contrat Fixe')
      
      // Verify description updates
      const description = page.locator('[data-testid="contract-type-description"]')
      await expect(description).toContainText('Loyer fixe mensuel avec commission négociable')
    })

    test('should select Contrat Variable and validate 10% commission rule', async ({ page }) => {
      // Open type contrat dropdown
      await page.click('[data-testid="type-contrat-select"]')
      
      // Select Contrat Variable
      await page.click('[data-testid="contract-type-variable"]')
      
      // Verify selection
      const selectedValue = page.locator('[data-testid="type-contrat-select"]')
      await expect(selectedValue).toContainText('Contrat Variable (10% commission)')
      
      // Verify description shows 10% commission
      const description = page.locator('[data-testid="contract-type-description"]')
      await expect(description).toContainText('Commission fixe de 10% sur revenus variables')
    })

    test('should validate required date fields', async ({ page }) => {
      // Fill contract type first
      await page.click('[data-testid="type-contrat-select"]')
      await page.click('[data-testid="contract-type-fixe"]')
      
      // Try to proceed without dates
      await page.click('[data-testid="next-button"]')
      
      // Should show validation errors
      await expect(page.locator('[data-testid="date-debut-error"]')).toContainText('Date de début requise')
      await expect(page.locator('[data-testid="date-fin-error"]')).toContainText('Date de fin requise')
    })

    test('should validate date logic - end date after start date', async ({ page }) => {
      // Fill contract type
      await page.click('[data-testid="type-contrat-select"]')
      await page.click('[data-testid="contract-type-fixe"]')
      
      // Set end date before start date
      await page.fill('[data-testid="date-debut"]', '2025-06-01')
      await page.fill('[data-testid="date-fin"]', '2025-05-01')
      
      // Try to proceed
      await page.click('[data-testid="next-button"]')
      
      // Should show validation error
      await expect(page.locator('[data-testid="date-fin-error"]'))
        .toContainText('La date de fin doit être postérieure à la date de début')
    })

    test('should calculate and display contract duration', async ({ page }) => {
      // Fill contract type and dates
      await page.click('[data-testid="type-contrat-select"]')
      await page.click('[data-testid="contract-type-fixe"]')
      
      await page.fill('[data-testid="date-debut"]', '2025-06-01')
      await page.fill('[data-testid="date-fin"]', '2025-12-31')
      
      // Duration should be calculated and displayed
      const durationDisplay = page.locator('[data-testid="contract-duration"]')
      await expect(durationDisplay).toBeVisible()
      await expect(durationDisplay).toContainText('213 jours')
      await expect(durationDisplay).toContainText('7 mois environ')
    })

    test('should enforce mandatory sous-location authorization', async ({ page }) => {
      // Verify sous-location switch is disabled and checked
      const sousLocationSwitch = page.locator('[data-testid="autorisation-sous-location-switch"]')
      await expect(sousLocationSwitch).toBeChecked()
      await expect(sousLocationSwitch).toBeDisabled()
      
      // Verify business rule alert
      const businessRuleAlert = page.locator('[data-testid="sous-location-business-rule"]')
      await expect(businessRuleAlert).toBeVisible()
      await expect(businessRuleAlert).toContainText('L\'autorisation de sous-location est obligatoire')
      await expect(businessRuleAlert).toContainText('Want It Now')
    })

    test('should display auto-filled property information', async ({ page }) => {
      // Verify property information section is visible
      const propertyInfo = page.locator('[data-testid="property-auto-filled-section"]')
      await expect(propertyInfo).toBeVisible()
      
      // Verify title
      await expect(page.locator('h3')).toContainText('Informations du Bien (Auto-remplies)')
      
      // Verify property details are displayed (from step 1 selection)
      await expect(page.locator('[data-testid="property-address"]')).toBeVisible()
      await expect(page.locator('[data-testid="property-type"]')).toBeVisible()
    })
  })

  test.describe('Business Rules - Variable Contract Validation', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to financial conditions step with variable contract
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      await page.click('[data-testid="next-button"]')
      
      // Fill step 2 - select variable contract
      await page.click('[data-testid="type-contrat-select"]')
      await page.click('[data-testid="contract-type-variable"]')
      
      await page.fill('[data-testid="date-debut"]', '2025-06-01')
      await page.fill('[data-testid="date-fin"]', '2025-12-31')
      
      await page.click('[data-testid="next-button"]')
      await page.waitForSelector('[data-testid="wizard-step-3"]')
    })

    test('should enforce 10% commission for variable contracts', async ({ page }) => {
      // Commission field should be pre-filled with 10%
      const commissionField = page.locator('[data-testid="commission-pourcentage"]')
      await expect(commissionField).toHaveValue('10')
      
      // Try to change commission to different value
      await page.fill('[data-testid="commission-pourcentage"]', '15')
      
      // Should show validation error
      await page.click('[data-testid="next-button"]')
      await expect(page.locator('[data-testid="commission-error"]'))
        .toContainText('La commission pour les contrats variables doit être de 10%')
    })

    test('should validate maximum 60 days owner usage', async ({ page }) => {
      // Try to set owner usage above 60 days
      await page.fill('[data-testid="usage-proprietaire-jours-max"]', '65')
      
      // Should show validation error
      await page.click('[data-testid="next-button"]')
      await expect(page.locator('[data-testid="usage-proprietaire-error"]'))
        .toContainText('L\'usage propriétaire ne peut pas dépasser 60 jours par an')
      
      // Set valid value (60 days or less)
      await page.fill('[data-testid="usage-proprietaire-jours-max"]', '45')
      
      // Error should disappear
      await expect(page.locator('[data-testid="usage-proprietaire-error"]')).not.toBeVisible()
    })
  })

  test.describe('Form Persistence and Navigation', () => {
    test('should persist form data when navigating between steps', async ({ page }) => {
      // Complete step 1
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      await page.click('[data-testid="next-button"]')
      
      // Fill step 2 data
      await page.click('[data-testid="type-contrat-select"]')
      await page.click('[data-testid="contract-type-variable"]')
      
      await page.fill('[data-testid="date-debut"]', '2025-06-01')
      await page.fill('[data-testid="date-fin"]', '2025-12-31')
      
      // Navigate to step 3
      await page.click('[data-testid="next-button"]')
      
      // Navigate back to step 2
      await page.click('[data-testid="prev-button"]')
      
      // Verify data is preserved
      await expect(page.locator('[data-testid="type-contrat-select"]')).toContainText('Contrat Variable')
      await expect(page.locator('[data-testid="date-debut"]')).toHaveValue('2025-06-01')
      await expect(page.locator('[data-testid="date-fin"]')).toHaveValue('2025-12-31')
    })

    test('should save form as draft automatically', async ({ page }) => {
      // Complete step 1
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      await page.click('[data-testid="next-button"]')
      
      // Start filling step 2
      await page.click('[data-testid="type-contrat-select"]')
      await page.click('[data-testid="contract-type-fixe"]')
      
      // Wait for auto-save indication
      await expect(page.locator('[data-testid="auto-save-indicator"]')).toBeVisible()
      await expect(page.locator('[data-testid="auto-save-indicator"]')).toContainText('Brouillon sauvegardé')
    })
  })

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Mock network failure for save operation
      await page.route('**/api/contrats', route => route.abort())
      
      // Try to proceed through wizard
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      await page.click('[data-testid="next-button"]')
      
      // Fill required fields
      await page.click('[data-testid="type-contrat-select"]')
      await page.click('[data-testid="contract-type-fixe"]')
      
      // Should show error message
      await expect(page.locator('[data-testid="network-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="network-error"]'))
        .toContainText('Erreur de connexion. Vos données sont sauvegardées localement.')
    })

    test('should validate all numeric fields', async ({ page }) => {
      // Navigate to financial step
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      await page.click('[data-testid="next-button"]')
      
      await page.click('[data-testid="type-contrat-select"]')
      await page.click('[data-testid="contract-type-fixe"]')
      
      await page.fill('[data-testid="date-debut"]', '2025-06-01')
      await page.fill('[data-testid="date-fin"]', '2025-12-31')
      await page.click('[data-testid="next-button"]')
      
      // Try to enter invalid numeric values
      await page.fill('[data-testid="commission-pourcentage"]', 'invalid')
      await page.fill('[data-testid="usage-proprietaire-jours-max"]', 'not-a-number')
      
      await page.click('[data-testid="next-button"]')
      
      // Should show validation errors
      await expect(page.locator('[data-testid="commission-error"]'))
        .toContainText('Doit être un nombre valide')
      await expect(page.locator('[data-testid="usage-proprietaire-error"]'))
        .toContainText('Doit être un nombre valide')
    })
  })

  test.describe('Performance and Accessibility', () => {
    test('should load wizard within performance budget', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto('http://localhost:3000/contrats/new')
      await page.waitForSelector('[data-testid="wizard-container"]')
      
      const loadTime = Date.now() - startTime
      
      // Should load within 2 seconds
      expect(loadTime).toBeLessThan(2000)
    })

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('http://localhost:3000/contrats/new')
      
      // Tab through form elements
      await page.keyboard.press('Tab')
      await expect(page.locator('[data-testid="property-selector"]:focus')).toBeVisible()
      
      await page.keyboard.press('Tab')
      await expect(page.locator('[data-testid="next-button"]:focus')).toBeVisible()
      
      // Should be able to open select with Enter
      await page.keyboard.press('Enter')
      // Property selector should open
    })

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('http://localhost:3000/contrats/new')
      
      // Check for proper ARIA labels
      const propertySelector = page.locator('[data-testid="property-selector"]')
      await expect(propertySelector).toHaveAttribute('aria-label')
      
      const nextButton = page.locator('[data-testid="next-button"]')
      await expect(nextButton).toHaveAttribute('aria-label')
    })
  })
})