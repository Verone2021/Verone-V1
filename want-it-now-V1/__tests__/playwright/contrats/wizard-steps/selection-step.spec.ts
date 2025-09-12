/**
 * Selection Step Playwright Tests - Contract Wizard
 * Want It Now V1 - Property/Unit Selection Business Logic Testing
 * 
 * Tests cover:
 * - Property search and filtering
 * - Unit selection for properties with units
 * - Auto-fill functionality based on property selection
 * - Exclusive selection rules (Property XOR Unit)
 * - Search performance and UX
 */

import { test, expect } from '@playwright/test'
import { TEST_PROPRIETES, TEST_UNITES } from '../../../../test-data/contrats-test-data'

test.describe('Selection Step - Property Search & Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/contrats/nouveau')
    await expect(page.locator('[data-testid="wizard-step-1"]')).toHaveClass(/bg-\[#D4841A\]/)
  })

  test('Property search with real-time filtering', async ({ page }) => {
    const searchInput = page.locator('[data-testid="property-search"]')
    
    // Type partial search - should show filtering results
    await searchInput.fill('Villa')
    await page.waitForTimeout(300) // Debounce wait
    
    // Should show properties containing "Villa"
    await expect(page.locator('[data-testid="property-results"]')).toBeVisible()
    await expect(page.locator('[data-testid="property-option-prop_villa_nice_001"]')).toBeVisible()
    await expect(page.locator('[data-testid="property-option-prop_villa_nice_001"]'))
      .toContainText('Villa Les Palmiers Nice')
    
    // Should not show non-matching properties
    await expect(page.locator('[data-testid="property-option-prop_immeuble_paris_001"]'))
      .not.toBeVisible()
    
    // Clear search - should show all properties
    await searchInput.clear()
    await page.waitForTimeout(300)
    
    await expect(page.locator('[data-testid="property-option-prop_immeuble_paris_001"]'))
      .toBeVisible()
  })

  test('Property selection auto-fill functionality', async ({ page }) => {
    const villaProperty = TEST_PROPRIETES[0] // Villa Les Palmiers Nice
    
    // Select property
    await page.fill('[data-testid="property-search"]', villaProperty.nom)
    await page.click('[data-testid="property-option-prop_villa_nice_001"]')
    
    // Verify auto-filled information
    await expect(page.locator('[data-testid="property-info-nom"]'))
      .toContainText(villaProperty.nom)
    await expect(page.locator('[data-testid="property-info-adresse"]'))
      .toContainText('15 Avenue des Palmiers, 06000 Nice')
    await expect(page.locator('[data-testid="property-info-type"]'))
      .toContainText('Villa')
    await expect(page.locator('[data-testid="property-info-superficie"]'))
      .toContainText('180 m²')
    await expect(page.locator('[data-testid="property-info-pieces"]'))
      .toContainText('6 pièces')
    
    // Property without units - should hide unit selector
    await expect(page.locator('[data-testid="units-selector"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="no-units-info"]'))
      .toContainText('Cette propriété n\'a pas d\'unités séparées')
    
    // Selection should be confirmed
    await expect(page.locator('[data-testid="property-selected-badge"]')).toBeVisible()
    await expect(page.locator('[data-testid="property-selected-badge"]'))
      .toContainText('Propriété sélectionnée')
    
    // Next button should be enabled
    await expect(page.locator('[data-testid="wizard-next-button"]')).not.toBeDisabled()
  })

  test('Property with units - unit selection required', async ({ page }) => {
    const propertyWithUnits = TEST_PROPRIETES[1] // Résidence Trocadéro
    
    // Select property with units
    await page.fill('[data-testid="property-search"]', 'Trocadéro')
    await page.click('[data-testid="property-option-prop_immeuble_paris_001"]')
    
    // Property info should show
    await expect(page.locator('[data-testid="property-info-nom"]'))
      .toContainText('Résidence Trocadéro')
    
    // Units selector should appear
    await expect(page.locator('[data-testid="units-selector"]')).toBeVisible()
    await expect(page.locator('[data-testid="units-info"]'))
      .toContainText('Cette propriété contient des unités. Sélectionnez une unité spécifique.')
    
    // Should show warning that unit selection is required
    await expect(page.locator('[data-testid="unit-selection-required"]'))
      .toContainText('Sélection d\'unité requise')
    
    // Next button should be disabled until unit selected
    await expect(page.locator('[data-testid="wizard-next-button"]')).toBeDisabled()
    
    // Units dropdown should show available units
    await page.click('[data-testid="units-selector"]')
    await expect(page.locator('[data-testid="unit-option-unit_paris_trocadero_01"]'))
      .toContainText('Studio Étoile - 35 m² - 1 pièce')
    await expect(page.locator('[data-testid="unit-option-unit_paris_trocadero_02"]'))
      .toContainText('Appartement Hausmanien - 75 m² - 3 pièces')
    await expect(page.locator('[data-testid="unit-option-unit_paris_trocadero_03"]'))
      .toContainText('Duplex Prestige - 95 m² - 4 pièces')
  })

  test('Unit selection with auto-fill', async ({ page }) => {
    // Select property with units
    await page.fill('[data-testid="property-search"]', 'Trocadéro')
    await page.click('[data-testid="property-option-prop_immeuble_paris_001"]')
    
    // Select specific unit
    await page.selectOption('[data-testid="units-selector"]', 'unit_paris_trocadero_01')
    
    // Unit information should auto-fill
    await expect(page.locator('[data-testid="selected-unit-info"]'))
      .toContainText('Studio Étoile')
    await expect(page.locator('[data-testid="unit-info-numero"]'))
      .toContainText('Unité n°01')
    await expect(page.locator('[data-testid="unit-info-type"]'))
      .toContainText('Studio')
    await expect(page.locator('[data-testid="unit-info-superficie"]'))
      .toContainText('35 m²')
    await expect(page.locator('[data-testid="unit-info-description"]'))
      .toContainText('Studio moderne avec kitchenette équipée, vue Trocadéro')
    
    // Should show unit selected badge
    await expect(page.locator('[data-testid="unit-selected-badge"]')).toBeVisible()
    await expect(page.locator('[data-testid="unit-selected-badge"]'))
      .toContainText('Unité sélectionnée')
    
    // Next button should now be enabled
    await expect(page.locator('[data-testid="wizard-next-button"]')).not.toBeDisabled()
    
    // Property selection should be cleared (business rule: exclusive)
    await expect(page.locator('[data-testid="property-selected-badge"]')).not.toBeVisible()
  })

  test('Search performance with large property list', async ({ page }) => {
    // Mock large dataset
    await page.route('**/api/proprietes/search**', route => {
      const largeResults = Array.from({ length: 500 }, (_, i) => ({
        id: `prop_large_${i}`,
        nom: `Propriété ${i} Test`,
        adresse_complete: `${i} Rue de Test, 75001 Paris`,
        type: 'appartement',
        superficie_m2: 50,
        nb_pieces: 2
      }))
      
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(largeResults)
      })
    })
    
    const searchStartTime = Date.now()
    
    // Perform search
    await page.fill('[data-testid="property-search"]', 'Test')
    
    // Results should appear quickly (< 500ms)
    await expect(page.locator('[data-testid="property-results"]')).toBeVisible()
    const searchTime = Date.now() - searchStartTime
    
    expect(searchTime).toBeLessThan(500)
    
    // Should show virtualized results (not all 500 DOM elements)
    const resultElements = page.locator('[data-testid^="property-option-"]')
    const count = await resultElements.count()
    expect(count).toBeLessThanOrEqual(50) // Virtualized to show max 50 at a time
  })

  test('No search results handling', async ({ page }) => {
    // Search for non-existent property
    await page.fill('[data-testid="property-search"]', 'PropertyThatDoesNotExist12345')
    await page.waitForTimeout(500) // Wait for search
    
    // Should show no results message
    await expect(page.locator('[data-testid="no-results-message"]'))
      .toContainText('Aucune propriété trouvée')
    await expect(page.locator('[data-testid="no-results-suggestions"]'))
      .toContainText('Essayez d\'affiner votre recherche')
    
    // Should show clear search button
    await expect(page.locator('[data-testid="clear-search-button"]')).toBeVisible()
    
    // Clear search should reset to show all properties
    await page.click('[data-testid="clear-search-button"]')
    await expect(page.locator('[data-testid="property-results"]')).toBeVisible()
  })
})

test.describe('Selection Step - Business Rule Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/contrats/nouveau')
  })

  test('Exclusive selection enforcement (Property XOR Unit)', async ({ page }) => {
    // This test simulates edge case where both could be selected
    
    // Select property without units first
    await page.fill('[data-testid="property-search"]', 'Villa Les Palmiers')
    await page.click('[data-testid="property-option-prop_villa_nice_001"]')
    
    await expect(page.locator('[data-testid="property-selected-badge"]')).toBeVisible()
    
    // Now try to also select a unit (should not be possible in normal UI)
    // But test the validation if it somehow happens
    await page.evaluate(() => {
      // Simulate invalid state
      window.dispatchEvent(new CustomEvent('test-exclusive-violation', {
        detail: {
          propriete_id: 'prop_villa_nice_001',
          unite_id: 'unit_paris_trocadero_01'
        }
      }))
    })
    
    // Should show validation error
    await expect(page.locator('[data-testid="exclusive-selection-error"]'))
      .toContainText('Sélection exclusive : propriété OU unité')
  })

  test('Required selection validation', async ({ page }) => {
    // Try to proceed without selecting anything
    await page.click('[data-testid="wizard-next-button"]')
    
    // Should show validation error
    await expect(page.locator('[data-testid="selection-required-error"]'))
      .toContainText('Veuillez sélectionner une propriété ou une unité')
    
    // Next button should remain disabled
    await expect(page.locator('[data-testid="wizard-next-button"]')).toBeDisabled()
  })

  test('Unit required for properties with units', async ({ page }) => {
    // Select property with units but don't select unit
    await page.fill('[data-testid="property-search"]', 'Trocadéro')
    await page.click('[data-testid="property-option-prop_immeuble_paris_001"]')
    
    // Try to proceed without selecting unit
    await page.click('[data-testid="wizard-next-button"]')
    
    // Should show unit selection required error
    await expect(page.locator('[data-testid="unit-required-error"]'))
      .toContainText('Sélection d\'une unité requise pour cette propriété')
    
    // Should highlight unit selector
    await expect(page.locator('[data-testid="units-selector"]'))
      .toHaveClass(/border-red-500/)
  })
})

test.describe('Selection Step - User Experience', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/contrats/nouveau')
  })

  test('Search input UX and accessibility', async ({ page }) => {
    const searchInput = page.locator('[data-testid="property-search"]')
    
    // Should have proper placeholder
    await expect(searchInput).toHaveAttribute('placeholder', 'Rechercher une propriété...')
    
    // Should have search icon
    await expect(page.locator('[data-testid="search-icon"]')).toBeVisible()
    
    // Should have aria-label for accessibility
    await expect(searchInput).toHaveAttribute('aria-label', 'Recherche de propriété')
    
    // Should focus on page load
    await expect(searchInput).toBeFocused()
    
    // Should show loading indicator during search
    await searchInput.fill('Villa')
    await expect(page.locator('[data-testid="search-loading"]')).toBeVisible()
    
    // Loading should disappear when results appear
    await expect(page.locator('[data-testid="property-results"]')).toBeVisible()
    await expect(page.locator('[data-testid="search-loading"]')).not.toBeVisible()
  })

  test('Property card display and interaction', async ({ page }) => {
    // Search to show results
    await page.fill('[data-testid="property-search"]', 'Villa')
    
    const propertyCard = page.locator('[data-testid="property-option-prop_villa_nice_001"]')
    
    // Card should show key information
    await expect(propertyCard.locator('[data-testid="property-name"]'))
      .toContainText('Villa Les Palmiers Nice')
    await expect(propertyCard.locator('[data-testid="property-address"]'))
      .toContainText('15 Avenue des Palmiers, 06000 Nice')
    await expect(propertyCard.locator('[data-testid="property-type-badge"]'))
      .toContainText('Villa')
    await expect(propertyCard.locator('[data-testid="property-specs"]'))
      .toContainText('180 m² • 6 pièces')
    
    // Hover should show highlight
    await propertyCard.hover()
    await expect(propertyCard).toHaveClass(/hover:bg-gray-50/)
    
    // Should show selection indicator on click
    await propertyCard.click()
    await expect(propertyCard).toHaveClass(/border-\[#D4841A\]/)
    await expect(propertyCard.locator('[data-testid="selected-indicator"]')).toBeVisible()
  })

  test('Unit selector UX', async ({ page }) => {
    // Select property with units
    await page.fill('[data-testid="property-search"]', 'Trocadéro')
    await page.click('[data-testid="property-option-prop_immeuble_paris_001"]')
    
    const unitsSelector = page.locator('[data-testid="units-selector"]')
    
    // Should have proper label
    await expect(page.locator('[data-testid="units-selector-label"]'))
      .toContainText('Sélectionnez une unité')
    
    // Should show unit count
    await expect(page.locator('[data-testid="units-count"]'))
      .toContainText('3 unités disponibles')
    
    // Options should be properly formatted
    await unitsSelector.click()
    
    const studioOption = page.locator('[data-testid="unit-option-unit_paris_trocadero_01"]')
    await expect(studioOption).toContainText('Studio Étoile')
    await expect(studioOption).toContainText('35 m²')
    await expect(studioOption).toContainText('1 pièce')
    
    // Should show unit details on selection
    await studioOption.click()
    await expect(page.locator('[data-testid="selected-unit-details"]')).toBeVisible()
  })

  test('Responsive design - mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Search input should be full width on mobile
    const searchInput = page.locator('[data-testid="property-search"]')
    await expect(searchInput).toHaveCSS('width', /.+/) // Should expand to container
    
    // Property cards should stack vertically
    await page.fill('[data-testid="property-search"]', 'Test')
    
    const propertyResults = page.locator('[data-testid="property-results"]')
    await expect(propertyResults).toHaveCSS('display', 'flex')
    await expect(propertyResults).toHaveCSS('flex-direction', 'column')
    
    // Touch targets should be appropriate size
    const propertyCard = page.locator('[data-testid="property-option-prop_villa_nice_001"]').first()
    if (await propertyCard.isVisible()) {
      const boundingBox = await propertyCard.boundingBox()
      expect(boundingBox?.height).toBeGreaterThanOrEqual(44) // iOS minimum touch target
    }
  })
})