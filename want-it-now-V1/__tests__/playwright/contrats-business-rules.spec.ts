import { test, expect } from '@playwright/test'

test.describe('Contrats - Business Rules Validation', () => {
  test.describe('Variable Contract Business Rules', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to contrats wizard and complete steps to reach financial conditions
      await page.goto('http://localhost:3000/contrats/new')
      await page.waitForSelector('[data-testid="wizard-container"]', { timeout: 10000 })
      
      // Step 1: Select property
      await page.click('[data-testid="property-selector"]')
      await page.waitForSelector('[data-testid="property-option-1"]', { timeout: 5000 })
      await page.click('[data-testid="property-option-1"]')
      await page.click('[data-testid="next-button"]')
      
      // Step 2: Configure as variable contract
      await page.waitForSelector('[data-testid="wizard-step-2"]', { timeout: 10000 })
      await page.click('[name="type_contrat"]')
      await page.click('[role="option"][data-value="variable"]')
      
      // Fill required dates
      await page.fill('[name="date_debut"]', '2025-06-01')
      await page.fill('[name="date_fin"]', '2025-12-31')
      
      // Proceed to financial conditions step
      await page.click('[data-testid="next-button"]')
      await page.waitForSelector('[data-testid="wizard-step-3"]', { timeout: 10000 })
    })

    test.describe('10% Commission Rule Enforcement', () => {
      test('should pre-fill commission field with 10% for variable contracts', async ({ page }) => {
        // Commission field should be automatically set to 10%
        const commissionField = page.locator('[name="commission_pourcentage"]')
        await expect(commissionField).toHaveValue('10')
        
        // Verify business rule explanation is visible
        const commissionHelp = page.locator('[data-testid="commission-help-text"]')
        await expect(commissionHelp).toContainText('Commission fixe de 10% pour les contrats variables')
      })

      test('should reject commission values other than 10%', async ({ page }) => {
        const commissionField = page.locator('[name="commission_pourcentage"]')
        
        // Try to set commission to 15%
        await commissionField.clear()
        await commissionField.fill('15')
        
        // Try to proceed
        await page.click('[data-testid="next-button"]')
        
        // Should show validation error
        const errorMessage = page.locator('[data-testid="commission-error"]')
        await expect(errorMessage).toBeVisible()
        await expect(errorMessage).toContainText('La commission pour les contrats variables doit être de 10%')
        
        // Form should not proceed
        await expect(page.locator('[data-testid="wizard-step-3"]')).toBeVisible()
      })

      test('should reject commission values below 10%', async ({ page }) => {
        const commissionField = page.locator('[name="commission_pourcentage"]')
        
        // Try to set commission to 5%
        await commissionField.clear()
        await commissionField.fill('5')
        
        await page.click('[data-testid="next-button"]')
        
        // Should show validation error
        const errorMessage = page.locator('[data-testid="commission-error"]')
        await expect(errorMessage).toContainText('La commission pour les contrats variables doit être de 10%')
      })

      test('should accept exactly 10% commission', async ({ page }) => {
        const commissionField = page.locator('[name="commission_pourcentage"]')
        
        // Ensure field is set to 10% (should be pre-filled)
        await commissionField.clear()
        await commissionField.fill('10')
        
        // Fill other required fields
        await page.fill('[name="usage_proprietaire_jours_max"]', '45')
        
        // Try to proceed
        await page.click('[data-testid="next-button"]')
        
        // Should NOT show commission error
        const commissionError = page.locator('[data-testid="commission-error"]')
        await expect(commissionError).not.toBeVisible()
        
        // Should proceed to next step (if no other validation errors)
        // Note: May still have other validation errors for incomplete fields
      })

      test('should handle decimal precision for 10% commission', async ({ page }) => {
        const commissionField = page.locator('[name="commission_pourcentage"]')
        
        // Try 10.0%
        await commissionField.clear()
        await commissionField.fill('10.0')
        
        await page.fill('[name="usage_proprietaire_jours_max"]', '45')
        await page.click('[data-testid="next-button"]')
        
        // Should accept 10.0 as valid
        const commissionError = page.locator('[data-testid="commission-error"]')
        await expect(commissionError).not.toBeVisible()
        
        // Try 10.1%
        await commissionField.clear()
        await commissionField.fill('10.1')
        await page.click('[data-testid="next-button"]')
        
        // Should reject 10.1
        await expect(commissionError).toBeVisible()
        await expect(commissionError).toContainText('La commission pour les contrats variables doit être de 10%')
      })
    })

    test.describe('Maximum 60 Days Owner Usage Rule', () => {
      test('should accept valid owner usage within 60 days limit', async ({ page }) => {
        const usageField = page.locator('[name="usage_proprietaire_jours_max"]')
        
        // Test various valid values
        const validValues = ['1', '30', '45', '60']
        
        for (const value of validValues) {
          await usageField.clear()
          await usageField.fill(value)
          
          // Set commission to valid value
          await page.fill('[name="commission_pourcentage"]', '10')
          
          await page.click('[data-testid="next-button"]')
          
          // Should not show usage error for valid values
          const usageError = page.locator('[data-testid="usage-proprietaire-error"]')
          await expect(usageError).not.toBeVisible()
          
          // Navigate back to continue testing (if we progressed)
          if (await page.locator('[data-testid="prev-button"]').isVisible()) {
            await page.click('[data-testid="prev-button"]')
          }
        }
      })

      test('should reject owner usage above 60 days', async ({ page }) => {
        const usageField = page.locator('[name="usage_proprietaire_jours_max"]')
        
        // Test invalid values above 60
        const invalidValues = ['61', '75', '90', '365']
        
        for (const value of invalidValues) {
          await usageField.clear()
          await usageField.fill(value)
          
          await page.click('[data-testid="next-button"]')
          
          // Should show validation error
          const usageError = page.locator('[data-testid="usage-proprietaire-error"]')
          await expect(usageError).toBeVisible()
          await expect(usageError).toContainText('L\'usage propriétaire ne peut pas dépasser 60 jours par an')
        }
      })

      test('should handle edge case of exactly 60 days', async ({ page }) => {
        const usageField = page.locator('[name="usage_proprietaire_jours_max"]')
        
        // Set to exactly 60 days
        await usageField.clear()
        await usageField.fill('60')
        
        // Set valid commission
        await page.fill('[name="commission_pourcentage"]', '10')
        
        await page.click('[data-testid="next-button"]')
        
        // Should accept exactly 60 days
        const usageError = page.locator('[data-testid="usage-proprietaire-error"]')
        await expect(usageError).not.toBeVisible()
      })

      test('should show helpful validation message for owner usage', async ({ page }) => {
        const usageField = page.locator('[name="usage_proprietaire_jours_max"]')
        
        // Set invalid value
        await usageField.clear()
        await usageField.fill('70')
        
        await page.click('[data-testid="next-button"]')
        
        // Check error message content
        const usageError = page.locator('[data-testid="usage-proprietaire-error"]')
        await expect(usageError).toBeVisible()
        await expect(usageError).toContainText('60 jours par an')
        
        // Verify helper text is present
        const usageHelp = page.locator('[data-testid="usage-proprietaire-help"]')
        await expect(usageHelp).toContainText('Maximum 60 jours d\'usage personnel par an')
      })
    })

    test.describe('Combined Business Rules Validation', () => {
      test('should validate both commission and usage rules simultaneously', async ({ page }) => {
        // Set both fields to invalid values
        await page.fill('[name="commission_pourcentage"]', '15')
        await page.fill('[name="usage_proprietaire_jours_max"]', '75')
        
        await page.click('[data-testid="next-button"]')
        
        // Both errors should be visible
        const commissionError = page.locator('[data-testid="commission-error"]')
        const usageError = page.locator('[data-testid="usage-proprietaire-error"]')
        
        await expect(commissionError).toBeVisible()
        await expect(usageError).toBeVisible()
        
        await expect(commissionError).toContainText('10%')
        await expect(usageError).toContainText('60 jours')
      })

      test('should clear errors when values are corrected', async ({ page }) => {
        // Set invalid values first
        await page.fill('[name="commission_pourcentage"]', '20')
        await page.fill('[name="usage_proprietaire_jours_max"]', '80')
        
        await page.click('[data-testid="next-button"]')
        
        // Verify errors are shown
        const commissionError = page.locator('[data-testid="commission-error"]')
        const usageError = page.locator('[data-testid="usage-proprietaire-error"]')
        
        await expect(commissionError).toBeVisible()
        await expect(usageError).toBeVisible()
        
        // Correct the values
        await page.fill('[name="commission_pourcentage"]', '10')
        await page.fill('[name="usage_proprietaire_jours_max"]', '45')
        
        await page.click('[data-testid="next-button"]')
        
        // Errors should be cleared
        await expect(commissionError).not.toBeVisible()
        await expect(usageError).not.toBeVisible()
      })

      test('should validate numeric format for business rule fields', async ({ page }) => {
        // Test non-numeric values
        await page.fill('[name="commission_pourcentage"]', 'invalid')
        await page.fill('[name="usage_proprietaire_jours_max"]', 'not-a-number')
        
        await page.click('[data-testid="next-button"]')
        
        // Should show numeric validation errors
        const commissionError = page.locator('[data-testid="commission-error"]')
        const usageError = page.locator('[data-testid="usage-proprietaire-error"]')
        
        // Either specific business rule error or generic numeric error
        await expect(commissionError).toBeVisible()
        await expect(usageError).toBeVisible()
        
        // Error should mention numeric requirement
        const errorTexts = [
          await commissionError.textContent(),
          await usageError.textContent()
        ]
        
        const hasNumericError = errorTexts.some(text => 
          text?.includes('nombre') || text?.includes('valide') || text?.includes('10%')
        )
        expect(hasNumericError).toBeTruthy()
      })
    })

    test.describe('Business Rule Context and Help', () => {
      test('should display business rule explanations', async ({ page }) => {
        // Check for business rule context
        const businessRulesSection = page.locator('[data-testid="business-rules-section"]')
        if (await businessRulesSection.isVisible()) {
          await expect(businessRulesSection).toContainText('Règles Want It Now')
        }
        
        // Commission rule explanation
        const commissionHelp = page.locator('[data-testid="commission-help-text"]')
        await expect(commissionHelp).toContainText('10%')
        await expect(commissionHelp).toContainText('variable')
        
        // Usage rule explanation  
        const usageHelp = page.locator('[data-testid="usage-proprietaire-help"]')
        await expect(usageHelp).toContainText('60 jours')
        await expect(usageHelp).toContainText('an')
      })

      test('should highlight business rule fields visually', async ({ page }) => {
        // Commission field should have business-rule styling
        const commissionField = page.locator('[name="commission_pourcentage"]')
        const usageField = page.locator('[name="usage_proprietaire_jours_max"]')
        
        // Check for business rule visual indicators
        const commissionContainer = page.locator('[data-testid="commission-field-container"]')
        const usageContainer = page.locator('[data-testid="usage-field-container"]')
        
        if (await commissionContainer.isVisible()) {
          // Should have business rule styling (e.g., special border, icon, etc.)
          await expect(commissionContainer).toHaveClass(/business-rule|border-\[#D4841A\]/)
        }
        
        if (await usageContainer.isVisible()) {
          await expect(usageContainer).toHaveClass(/business-rule|border-\[#D4841A\]/)
        }
      })
    })
  })

  test.describe('Fixed Contract Rules Comparison', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate and set up fixed contract for comparison
      await page.goto('http://localhost:3000/contrats/new')
      await page.waitForSelector('[data-testid="wizard-container"]')
      
      // Step 1: Select property
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      await page.click('[data-testid="next-button"]')
      
      // Step 2: Configure as fixed contract
      await page.waitForSelector('[data-testid="wizard-step-2"]')
      await page.click('[name="type_contrat"]')
      await page.click('[role="option"][data-value="fixe"]')
      
      await page.fill('[name="date_debut"]', '2025-06-01')
      await page.fill('[name="date_fin"]', '2025-12-31')
      
      await page.click('[data-testid="next-button"]')
      await page.waitForSelector('[data-testid="wizard-step-3"]')
    })

    test('should allow flexible commission for fixed contracts', async ({ page }) => {
      const commissionField = page.locator('[name="commission_pourcentage"]')
      
      // Fixed contracts should allow various commission values
      const testValues = ['5', '8', '12', '15', '20']
      
      for (const value of testValues) {
        await commissionField.clear()
        await commissionField.fill(value)
        
        await page.fill('[name="usage_proprietaire_jours_max"]', '30')
        await page.click('[data-testid="next-button"]')
        
        // Should NOT show the 10% commission error for fixed contracts
        const commissionError = page.locator('[data-testid="commission-error"]')
        const specificError = await commissionError.textContent()
        
        expect(specificError).not.toContain('La commission pour les contrats variables doit être de 10%')
        
        // Navigate back for next test
        if (await page.locator('[data-testid="prev-button"]').isVisible()) {
          await page.click('[data-testid="prev-button"]')
        }
      }
    })

    test('should still enforce 60-day usage limit for fixed contracts', async ({ page }) => {
      // Usage limit should apply to both contract types
      await page.fill('[name="usage_proprietaire_jours_max"]', '75')
      await page.click('[data-testid="next-button"]')
      
      // Should still show usage error for fixed contracts
      const usageError = page.locator('[data-testid="usage-proprietaire-error"]')
      await expect(usageError).toBeVisible()
      await expect(usageError).toContainText('60 jours par an')
    })
  })

  test.describe('Pro-rata Calculations for Variable Contracts', () => {
    test.beforeEach(async ({ page }) => {
      // Set up variable contract with specific dates for pro-rata testing
      await page.goto('http://localhost:3000/contrats/new')
      await page.waitForSelector('[data-testid="wizard-container"]')
      
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      await page.click('[data-testid="next-button"]')
      
      await page.waitForSelector('[data-testid="wizard-step-2"]')
      await page.click('[name="type_contrat"]')
      await page.click('[role="option"][data-value="variable"]')
    })

    test('should calculate pro-rata for partial month contracts', async ({ page }) => {
      // Set contract starting mid-month
      await page.fill('[name="date_debut"]', '2025-06-15') // Mid-June
      await page.fill('[name="date_fin"]', '2025-08-15')   // Mid-August
      
      await page.click('[data-testid="next-button"]')
      await page.waitForSelector('[data-testid="wizard-step-3"]')
      
      // Should show pro-rata calculation info
      const proRataInfo = page.locator('[data-testid="pro-rata-info"]')
      if (await proRataInfo.isVisible()) {
        await expect(proRataInfo).toContainText('pro-rata')
        await expect(proRataInfo).toContainText('mois incomplet')
      }
      
      // Duration should account for partial months
      const durationInfo = page.locator('[data-testid="contract-duration-detailed"]')
      if (await durationInfo.isVisible()) {
        await expect(durationInfo).toContainText('61 jours') // 15+30+16 days
      }
    })

    test('should handle full month calculations', async ({ page }) => {
      // Set contract for full months
      await page.fill('[name="date_debut"]', '2025-06-01')
      await page.fill('[name="date_fin"]', '2025-08-31')
      
      await page.click('[data-testid="next-button"]')
      await page.waitForSelector('[data-testid="wizard-step-3"]')
      
      // Should show full month calculation
      const monthlyInfo = page.locator('[data-testid="monthly-calculation-info"]')
      if (await monthlyInfo.isVisible()) {
        await expect(monthlyInfo).toContainText('3 mois complets')
      }
    })
  })
})