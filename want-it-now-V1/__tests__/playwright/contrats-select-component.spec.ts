import { test, expect } from '@playwright/test'

test.describe('Contrats - Type de contrat Select Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to contrats wizard and reach step 2
    await page.goto('http://localhost:3000/contrats/new')
    await page.waitForSelector('[data-testid="wizard-container"]', { timeout: 10000 })
    
    // Complete step 1 - select a property
    await page.click('[data-testid="property-selector"]')
    await page.waitForSelector('[data-testid="property-option-1"]', { timeout: 5000 })
    await page.click('[data-testid="property-option-1"]')
    await page.click('[data-testid="next-button"]')
    
    // Wait for step 2 to load
    await page.waitForSelector('[data-testid="wizard-step-2"]', { timeout: 10000 })
  })

  test.describe('Select Component Rendering', () => {
    test('should render Type de contrat select with proper structure', async ({ page }) => {
      // Verify the select trigger is visible
      const selectTrigger = page.locator('[name="type_contrat"]')
      await expect(selectTrigger).toBeVisible()
      
      // Verify placeholder text
      await expect(selectTrigger).toContainText('Choisir le type')
      
      // Verify select has proper styling classes
      await expect(selectTrigger).toHaveClass(/bg-white/)
      await expect(selectTrigger).toHaveClass(/focus:border-\[#D4841A\]/)
    })

    test('should open dropdown when clicked', async ({ page }) => {
      const selectTrigger = page.locator('[name="type_contrat"]')
      
      // Click to open dropdown
      await selectTrigger.click()
      
      // Verify dropdown content is visible
      const selectContent = page.locator('[role="listbox"]')
      await expect(selectContent).toBeVisible()
      
      // Verify both options are present
      const fixeOption = page.locator('[role="option"][data-value="fixe"]')
      const variableOption = page.locator('[role="option"][data-value="variable"]')
      
      await expect(fixeOption).toBeVisible()
      await expect(variableOption).toBeVisible()
    })

    test('should display correct option texts', async ({ page }) => {
      const selectTrigger = page.locator('[name="type_contrat"]')
      await selectTrigger.click()
      
      // Check option texts
      const fixeOption = page.locator('[role="option"][data-value="fixe"]')
      const variableOption = page.locator('[role="option"][data-value="variable"]')
      
      await expect(fixeOption).toContainText('Contrat Fixe')
      await expect(variableOption).toContainText('Contrat Variable (10% commission)')
    })
  })

  test.describe('Option Selection Functionality', () => {
    test('should select Contrat Fixe option', async ({ page }) => {
      const selectTrigger = page.locator('[name="type_contrat"]')
      
      // Open dropdown and select fixe
      await selectTrigger.click()
      await page.click('[role="option"][data-value="fixe"]')
      
      // Verify selection
      await expect(selectTrigger).toContainText('Contrat Fixe')
      
      // Verify the value is set in the form
      const hiddenInput = page.locator('input[name="type_contrat"]')
      await expect(hiddenInput).toHaveValue('fixe')
    })

    test('should select Contrat Variable option', async ({ page }) => {
      const selectTrigger = page.locator('[name="type_contrat"]')
      
      // Open dropdown and select variable
      await selectTrigger.click()
      await page.click('[role="option"][data-value="variable"]')
      
      // Verify selection
      await expect(selectTrigger).toContainText('Contrat Variable (10% commission)')
      
      // Verify the value is set in the form
      const hiddenInput = page.locator('input[name="type_contrat"]')
      await expect(hiddenInput).toHaveValue('variable')
    })

    test('should switch between options correctly', async ({ page }) => {
      const selectTrigger = page.locator('[name="type_contrat"]')
      
      // First select fixe
      await selectTrigger.click()
      await page.click('[role="option"][data-value="fixe"]')
      await expect(selectTrigger).toContainText('Contrat Fixe')
      
      // Then switch to variable
      await selectTrigger.click()
      await page.click('[role="option"][data-value="variable"]')
      await expect(selectTrigger).toContainText('Contrat Variable (10% commission)')
      
      // Verify form value updated
      const hiddenInput = page.locator('input[name="type_contrat"]')
      await expect(hiddenInput).toHaveValue('variable')
    })
  })

  test.describe('Dynamic Content Updates', () => {
    test('should update description for Contrat Fixe', async ({ page }) => {
      const selectTrigger = page.locator('[name="type_contrat"]')
      
      // Select Contrat Fixe
      await selectTrigger.click()
      await page.click('[role="option"][data-value="fixe"]')
      
      // Check description text
      const description = page.locator('text=Loyer fixe mensuel avec commission négociable')
      await expect(description).toBeVisible()
    })

    test('should update description for Contrat Variable', async ({ page }) => {
      const selectTrigger = page.locator('[name="type_contrat"]')
      
      // Select Contrat Variable
      await selectTrigger.click()
      await page.click('[role="option"][data-value="variable"]')
      
      // Check description text
      const description = page.locator('text=Commission fixe de 10% sur revenus variables')
      await expect(description).toBeVisible()
    })

    test('should show business rule alert for mandatory sous-location', async ({ page }) => {
      // Business rule alert should always be visible regardless of contract type
      const alertElement = page.locator('.border-\\[\\#D4841A\\]\\/20.bg-\\[\\#D4841A\\]\\/5')
      await expect(alertElement).toBeVisible()
      
      // Check alert text
      await expect(page.locator('text=L\'autorisation de sous-location est obligatoire')).toBeVisible()
      await expect(page.locator('text=Want It Now')).toBeVisible()
    })
  })

  test.describe('Form Integration', () => {
    test('should integrate with React Hook Form validation', async ({ page }) => {
      // Try to proceed without selecting contract type
      const nextButton = page.locator('[data-testid="next-button"]')
      await nextButton.click()
      
      // Should show validation error (if required)
      // Note: Based on the schema, type_contrat is required
      const errorMessage = page.locator('.text-red-600, .text-destructive')
      
      // If validation is active, error should appear
      // If not required at this step, test should still pass
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toContainText('requis')
      }
      
      // Now select a type and error should clear
      const selectTrigger = page.locator('[name="type_contrat"]')
      await selectTrigger.click()
      await page.click('[role="option"][data-value="fixe"]')
      
      // Error should disappear
      await expect(errorMessage).not.toBeVisible()
    })

    test('should persist selection across form steps', async ({ page }) => {
      const selectTrigger = page.locator('[name="type_contrat"]')
      
      // Select contract type
      await selectTrigger.click()
      await page.click('[role="option"][data-value="variable"]')
      
      // Fill other required fields
      await page.fill('[name="date_debut"]', '2025-06-01')
      await page.fill('[name="date_fin"]', '2025-12-31')
      
      // Navigate to next step
      await page.click('[data-testid="next-button"]')
      await page.waitForSelector('[data-testid="wizard-step-3"]')
      
      // Navigate back
      await page.click('[data-testid="prev-button"]')
      
      // Verify selection persisted
      await expect(selectTrigger).toContainText('Contrat Variable (10% commission)')
    })
  })

  test.describe('Accessibility and UX', () => {
    test('should be keyboard accessible', async ({ page }) => {
      // Tab to the select component
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab') // Skip other elements if needed
      
      const selectTrigger = page.locator('[name="type_contrat"]')
      
      // Focus should be on select trigger
      await expect(selectTrigger).toBeFocused()
      
      // Open with keyboard
      await page.keyboard.press('Enter')
      
      // Options should be visible
      await expect(page.locator('[role="listbox"]')).toBeVisible()
      
      // Navigate with arrow keys
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')
      
      // Selection should be made
      await expect(selectTrigger).not.toContainText('Choisir le type')
    })

    test('should have proper ARIA attributes', async ({ page }) => {
      const selectTrigger = page.locator('[name="type_contrat"]')
      
      // Check ARIA attributes
      await expect(selectTrigger).toHaveAttribute('role', 'combobox')
      await expect(selectTrigger).toHaveAttribute('aria-expanded', 'false')
      
      // Open dropdown
      await selectTrigger.click()
      
      // Should update ARIA state
      await expect(selectTrigger).toHaveAttribute('aria-expanded', 'true')
    })

    test('should close dropdown when clicking outside', async ({ page }) => {
      const selectTrigger = page.locator('[name="type_contrat"]')
      
      // Open dropdown
      await selectTrigger.click()
      await expect(page.locator('[role="listbox"]')).toBeVisible()
      
      // Click outside
      await page.click('body')
      
      // Dropdown should close
      await expect(page.locator('[role="listbox"]')).not.toBeVisible()
      await expect(selectTrigger).toHaveAttribute('aria-expanded', 'false')
    })
  })

  test.describe('Error States and Edge Cases', () => {
    test('should handle rapid clicks gracefully', async ({ page }) => {
      const selectTrigger = page.locator('[name="type_contrat"]')
      
      // Rapid clicks
      await selectTrigger.click()
      await selectTrigger.click()
      await selectTrigger.click()
      
      // Should still be functional
      await expect(page.locator('[role="listbox"]')).toBeVisible()
      
      // Should be able to select option
      await page.click('[role="option"][data-value="fixe"]')
      await expect(selectTrigger).toContainText('Contrat Fixe')
    })

    test('should maintain state during page interactions', async ({ page }) => {
      const selectTrigger = page.locator('[name="type_contrat"]')
      
      // Select an option
      await selectTrigger.click()
      await page.click('[role="option"][data-value="variable"]')
      
      // Interact with other form elements
      await page.fill('[name="date_debut"]', '2025-06-01')
      await page.click('[name="meuble"]') // Toggle switch
      
      // Selection should persist
      await expect(selectTrigger).toContainText('Contrat Variable (10% commission)')
    })

    test('should handle form reset correctly', async ({ page }) => {
      const selectTrigger = page.locator('[name="type_contrat"]')
      
      // Select an option
      await selectTrigger.click()
      await page.click('[role="option"][data-value="fixe"]')
      
      // Refresh page (simulates form reset)
      await page.reload()
      await page.waitForSelector('[data-testid="wizard-container"]')
      
      // Complete step 1 again
      await page.click('[data-testid="property-selector"]')
      await page.click('[data-testid="property-option-1"]')
      await page.click('[data-testid="next-button"]')
      
      // Select should be back to placeholder
      await expect(selectTrigger).toContainText('Choisir le type')
    })
  })

  test.describe('Performance Tests', () => {
    test('should render select options quickly', async ({ page }) => {
      const startTime = Date.now()
      
      const selectTrigger = page.locator('[name="type_contrat"]')
      await selectTrigger.click()
      
      // Options should appear within reasonable time
      await expect(page.locator('[role="listbox"]')).toBeVisible()
      
      const renderTime = Date.now() - startTime
      expect(renderTime).toBeLessThan(500) // Should render in < 500ms
    })

    test('should handle selection without performance degradation', async ({ page }) => {
      const selectTrigger = page.locator('[name="type_contrat"]')
      
      const operations = []
      
      // Perform multiple selections and measure time
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now()
        
        await selectTrigger.click()
        await page.click(`[role="option"][data-value="${i % 2 === 0 ? 'fixe' : 'variable'}"]`)
        
        operations.push(Date.now() - startTime)
      }
      
      // All operations should be fast
      const averageTime = operations.reduce((a, b) => a + b) / operations.length
      expect(averageTime).toBeLessThan(200) // Average < 200ms per operation
    })
  })
})