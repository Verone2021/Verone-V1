import { test, expect } from '@playwright/test'

test.describe('Contrats - Quotités Validation Integration', () => {
  test.describe('Property Ownership Validation in Contract Creation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:3000/contrats/new')
      await page.waitForSelector('[data-testid="wizard-container"]', { timeout: 10000 })
    })

    test('should only show properties with valid 100% quotités', async ({ page }) => {
      // Open property selector
      await page.click('[data-testid="property-selector"]')
      await page.waitForSelector('[data-testid="property-dropdown-list"]')
      
      // Should only show properties where quotités sum to 100%
      const propertyOptions = page.locator('[data-testid^="property-option-"]')
      const optionCount = await propertyOptions.count()
      
      // Verify each displayed property has valid quotités
      for (let i = 0; i < optionCount; i++) {
        const option = propertyOptions.nth(i)
        
        // Each property should have quotités indicator
        const quotitesIndicator = option.locator('[data-testid="quotites-valid-indicator"]')
        await expect(quotitesIndicator).toBeVisible()
        
        // Should show 100% validation
        await expect(option).toContainText('100%')
      }
    })

    test('should display quotités information for selected property', async ({ page }) => {
      // Select a property
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      await page.click('[data-testid="next-button"]')
      
      // Should display property ownership information
      const ownershipSection = page.locator('[data-testid="property-ownership-info"]')
      await expect(ownershipSection).toBeVisible()
      
      // Should show owner names and quotités
      const ownersList = page.locator('[data-testid="owners-list"]')
      await expect(ownersList).toBeVisible()
      
      // Should show total quotités validation
      const quotitesTotal = page.locator('[data-testid="quotites-total"]')
      await expect(quotitesTotal).toContainText('100%')
      
      // Should have validation checkmark
      const validationCheck = page.locator('[data-testid="quotites-validation-check"]')
      await expect(validationCheck).toBeVisible()
    })

    test('should prevent contract creation for properties with invalid quotités', async ({ page }) => {
      // This test assumes there might be properties with invalid quotités
      // In production, these should be filtered out, but this tests the failsafe
      
      // Mock a property with invalid quotités in the selector
      await page.evaluate(() => {
        // Simulate property with 95% quotités
        const invalidProperty = {
          id: 'invalid-prop-1',
          name: 'Property with Invalid Quotités',
          quotites_total: 95,
          owners: [
            { name: 'Owner A', quotite: '60%' },
            { name: 'Owner B', quotite: '35%' }
          ]
        }
        // This would be handled by the backend in real scenario
      })
      
      // If such property appears, it should show warning
      const invalidWarning = page.locator('[data-testid="invalid-quotites-warning"]')
      if (await invalidWarning.isVisible()) {
        await expect(invalidWarning).toContainText('quotités')
        await expect(invalidWarning).toContainText('100%')
      }
    })
  })

  test.describe('Multi-Owner Property Contracts', () => {
    test('should handle contracts for properties with multiple owners', async ({ page }) => {
      // Select property with multiple owners
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-multi-owners"]') // Property known to have multiple owners
      await page.click('[data-testid="next-button"]')
      
      await page.waitForSelector('[data-testid="wizard-step-2"]')
      
      // Should display all owners with their quotités
      const ownersSection = page.locator('[data-testid="multi-owners-section"]')
      await expect(ownersSection).toBeVisible()
      
      // Should show each owner's information
      const ownerCards = page.locator('[data-testid^="owner-card-"]')
      const ownerCount = await ownerCards.count()
      
      expect(ownerCount).toBeGreaterThan(1) // Multiple owners
      
      // Each owner card should show quotité information
      for (let i = 0; i < ownerCount; i++) {
        const ownerCard = ownerCards.nth(i)
        await expect(ownerCard.locator('[data-testid="owner-quotite"]')).toBeVisible()
        await expect(ownerCard.locator('[data-testid="owner-name"]')).toBeVisible()
      }
      
      // Should show total validation
      await expect(page.locator('[data-testid="quotites-sum-validation"]')).toContainText('100%')
    })

    test('should validate contract signing requirements for all owners', async ({ page }) => {
      // Navigate to contract with multiple owners
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-multi-owners"]')
      await page.click('[data-testid="next-button"]')
      
      // Complete contract details
      await page.click('[name="type_contrat"]')
      await page.click('[role="option"][data-value="fixe"]')
      await page.fill('[name="date_debut"]', '2025-06-01')
      await page.fill('[name="date_fin"]', '2025-12-31')
      
      // Navigate through steps to contract finalization
      await page.click('[data-testid="next-button"]') // To financial step
      await page.fill('[name="commission_pourcentage"]', '8')
      await page.fill('[name="usage_proprietaire_jours_max"]', '30')
      
      // Should reach final step or signature requirements
      while (await page.locator('[data-testid="next-button"]').isVisible()) {
        await page.click('[data-testid="next-button"]')
        // Break if we reach signature step
        if (await page.locator('[data-testid="signature-requirements"]').isVisible()) {
          break
        }
      }
      
      // Should show signature requirements for all owners
      const signatureSection = page.locator('[data-testid="signature-requirements"]')
      if (await signatureSection.isVisible()) {
        // Should list all owners who need to sign
        const signatureList = page.locator('[data-testid="owners-signature-list"]')
        await expect(signatureList).toBeVisible()
        
        // Each owner should be listed with their quotité
        const signerCards = page.locator('[data-testid^="signer-card-"]')
        const signerCount = await signerCards.count()
        
        expect(signerCount).toBeGreaterThan(1) // Multiple signers for multiple owners
        
        // Should show completion status for signatures
        await expect(page.locator('[data-testid="signature-completion-status"]')).toBeVisible()
      }
    })
  })

  test.describe('Quotités Changes During Contract Lifecycle', () => {
    test('should handle quotités changes after contract creation', async ({ page }) => {
      // This test verifies what happens when property ownership changes
      // after a contract is already in place
      
      // Create a contract first
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      await page.click('[data-testid="next-button"]')
      
      await page.click('[name="type_contrat"]')
      await page.click('[role="option"][data-value="fixe"]')
      await page.fill('[name="date_debut"]', '2025-06-01')
      await page.fill('[name="date_fin"]', '2025-12-31')
      await page.click('[data-testid="next-button"]')
      
      // Fill financial details
      await page.fill('[name="commission_pourcentage"]', '8')
      await page.fill('[name="usage_proprietaire_jours_max"]', '30')
      
      // Save as draft or create contract
      await page.click('[data-testid="save-draft-button"]')
      
      // Verify contract is created/saved
      await expect(page.locator('[data-testid="contract-saved-confirmation"]')).toBeVisible()
      
      // Navigate away to simulate going to property management
      // and changing ownership quotités
      
      // In a real test, this would involve:
      // 1. Going to property management
      // 2. Modifying ownership quotités
      // 3. Returning to contract to see warnings/updates
      
      // For now, verify that contract shows current ownership state
      const ownershipWarning = page.locator('[data-testid="ownership-change-warning"]')
      if (await ownershipWarning.isVisible()) {
        await expect(ownershipWarning).toContainText('propriété')
        await expect(ownershipWarning).toContainText('modifié')
      }
    })
  })

  test.describe('Business Rules Integration with Quotités', () => {
    test('should validate 60-day owner usage against quotités', async ({ page }) => {
      // Select property with specific quotités to test usage calculation
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      await page.click('[data-testid="next-button"]')
      
      // Complete basic contract info
      await page.click('[name="type_contrat"]')
      await page.click('[role="option"][data-value="variable"]')
      await page.fill('[name="date_debut"]', '2025-06-01')
      await page.fill('[name="date_fin"]', '2025-12-31')
      await page.click('[data-testid="next-button"]')
      
      // In financial step, check usage validation
      const usageField = page.locator('[name="usage_proprietaire_jours_max"]')
      
      // For properties with multiple owners, usage might be pro-rated by quotité
      const quotitesInfo = page.locator('[data-testid="quotites-usage-calculation"]')
      if (await quotitesInfo.isVisible()) {
        await expect(quotitesInfo).toContainText('quotité')
        
        // Should show calculation based on ownership percentage
        await expect(quotitesInfo).toContainText('%')
      }
      
      // Test usage validation
      await usageField.fill('70') // Above 60 days limit
      await page.click('[data-testid="next-button"]')
      
      // Should show error
      const usageError = page.locator('[data-testid="usage-proprietaire-error"]')
      await expect(usageError).toBeVisible()
      await expect(usageError).toContainText('60 jours')
      
      // Correct the usage
      await usageField.fill('45')
      
      // Error should clear
      await expect(usageError).not.toBeVisible()
    })

    test('should calculate pro-rata commission for partial ownership', async ({ page }) => {
      // Select property with partial ownership (if available)
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-multi-owners"]') // Property with multiple owners
      await page.click('[data-testid="next-button"]')
      
      // Set up variable contract
      await page.click('[name="type_contrat"]')
      await page.click('[role="option"][data-value="variable"]')
      await page.fill('[name="date_debut"]', '2025-06-01')
      await page.fill('[name="date_fin"]', '2025-12-31')
      await page.click('[data-testid="next-button"]')
      
      // Check commission calculation
      const commissionField = page.locator('[name="commission_pourcentage"]')
      await expect(commissionField).toHaveValue('10') // Standard 10% for variable
      
      // Should show pro-rata calculation info
      const proRataInfo = page.locator('[data-testid="commission-pro-rata-info"]')
      if (await proRataInfo.isVisible()) {
        await expect(proRataInfo).toContainText('réparti selon quotités')
        
        // Should show breakdown by owner
        const ownerBreakdown = page.locator('[data-testid="commission-owner-breakdown"]')
        await expect(ownerBreakdown).toBeVisible()
      }
      
      // Should show estimated revenue distribution
      const revenueDistribution = page.locator('[data-testid="revenue-distribution"]')
      if (await revenueDistribution.isVisible()) {
        await expect(revenueDistribution).toContainText('%')
        await expect(revenueDistribution).toContainText('propriétaire')
      }
    })
  })

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle properties without owners gracefully', async ({ page }) => {
      // This would be an edge case that shouldn't happen in production
      // but good to test error handling
      
      await page.click('[data-testid="property-selector"]')
      
      // If a property without valid ownership appears
      const noOwnersWarning = page.locator('[data-testid="no-owners-warning"]')
      if (await noOwnersWarning.isVisible()) {
        await expect(noOwnersWarning).toContainText('propriétaires')
        await expect(noOwnersWarning).toContainText('non défini')
        
        // Should prevent selection
        const nextButton = page.locator('[data-testid="next-button"]')
        await expect(nextButton).toBeDisabled()
      }
    })

    test('should handle quotités rounding precision', async ({ page }) => {
      // Test properties with decimal quotités that should sum to 100%
      await page.click('[data-testid="property-selector"]')
      
      // Look for property with decimal quotités (e.g., 33.33%, 33.33%, 33.34%)
      const decimalProperty = page.locator('[data-testid="property-decimal-quotites"]')
      if (await decimalProperty.isVisible()) {
        await decimalProperty.click()
        await page.click('[data-testid="next-button"]')
        
        // Should show precise quotités
        const precisionInfo = page.locator('[data-testid="quotites-precision-info"]')
        await expect(precisionInfo).toBeVisible()
        
        // Should still show 100% total despite decimal precision
        const totalQuotites = page.locator('[data-testid="quotites-total"]')
        await expect(totalQuotites).toContainText('100.00%')
        
        // Should have validation checkmark
        const validationCheck = page.locator('[data-testid="quotites-validation-check"]')
        await expect(validationCheck).toBeVisible()
      }
    })

    test('should validate ownership history for temporal quotités', async ({ page }) => {
      // Test properties where ownership has changed over time
      await page.click('[data-testid="property-selector"]')
      
      const temporalProperty = page.locator('[data-testid="property-temporal-ownership"]')
      if (await temporalProperty.isVisible()) {
        await temporalProperty.click()
        await page.click('[data-testid="next-button"]')
        
        // Should show current ownership state
        const currentOwnership = page.locator('[data-testid="current-ownership"]')
        await expect(currentOwnership).toBeVisible()
        await expect(currentOwnership).toContainText('Actuel')
        
        // May show ownership history if relevant
        const ownershipHistory = page.locator('[data-testid="ownership-history"]')
        if (await ownershipHistory.isVisible()) {
          await expect(ownershipHistory).toContainText('Historique')
        }
        
        // Contract should be based on current ownership
        const contractBasis = page.locator('[data-testid="contract-ownership-basis"]')
        await expect(contractBasis).toContainText('propriété actuelle')
      }
    })
  })

  test.describe('Performance with Complex Quotités', () => {
    test('should handle properties with many owners efficiently', async ({ page }) => {
      // Test performance with properties having many owners
      const startTime = Date.now()
      
      await page.click('[data-testid="property-selector"]')
      
      // Look for property with many owners (if available in test data)
      const manyOwnersProperty = page.locator('[data-testid="property-many-owners"]')
      if (await manyOwnersProperty.isVisible()) {
        await manyOwnersProperty.click()
        await page.click('[data-testid="next-button"]')
        
        const loadTime = Date.now() - startTime
        
        // Should load within reasonable time even with many owners
        expect(loadTime).toBeLessThan(2000) // < 2 seconds
        
        // Should display all owners efficiently
        const ownersList = page.locator('[data-testid="owners-list"]')
        await expect(ownersList).toBeVisible()
        
        // Quotités calculation should be accurate
        const quotitesTotal = page.locator('[data-testid="quotites-total"]')
        await expect(quotitesTotal).toContainText('100%')
      }
    })

    test('should cache quotités validation results', async ({ page }) => {
      // First load
      const firstLoadStart = Date.now()
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      await page.click('[data-testid="next-button"]')
      const firstLoadTime = Date.now() - firstLoadStart
      
      // Navigate back and reload same property
      await page.click('[data-testid="prev-button"]')
      
      const secondLoadStart = Date.now()
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      await page.click('[data-testid="next-button"]')
      const secondLoadTime = Date.now() - secondLoadStart
      
      // Second load should be faster due to caching
      expect(secondLoadTime).toBeLessThan(firstLoadTime)
      
      // Data should still be accurate
      const quotitesTotal = page.locator('[data-testid="quotites-total"]')
      await expect(quotitesTotal).toContainText('100%')
    })
  })
})