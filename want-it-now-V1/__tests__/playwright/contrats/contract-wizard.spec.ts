/**
 * Comprehensive Playwright E2E Tests for Contract Wizard
 * Want It Now V1 - Real Estate Business Workflow Testing
 * 
 * Tests cover:
 * - Complete 6-step wizard journey
 * - Property/Unit selection with auto-fill functionality  
 * - Business rules enforcement
 * - Draft saving functionality
 * - Form validation at each step
 * - Navigation between steps
 * - Final contract submission
 * - Error handling scenarios
 */

import { test, expect, Page } from '@playwright/test'
import { TEST_CONTRAT_SCENARIOS, TEST_PROPRIETES, TEST_UNITES, TEST_EDGE_CASES } from '../../../test-data/contrats-test-data'

test.describe('Contract Wizard - Complete 6-Step Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to contract creation page
    await page.goto('http://localhost:3001/contrats/nouveau')
    
    // Wait for wizard to load
    await expect(page.locator('[data-testid="contract-wizard"]')).toBeVisible()
    await expect(page.locator('h1')).toContainText('Nouveau Contrat')
  })

  test('Full wizard journey - Fixed contract for villa', async ({ page }) => {
    const scenario = TEST_CONTRAT_SCENARIOS.villa_nice_fixe

    // **Step 1: Property Selection**
    await expect(page.locator('[data-testid="wizard-step-1"]')).toHaveClass(/bg-\[#D4841A\]/)
    await expect(page.locator('[data-testid="wizard-progress"]')).toHaveText('Étape 1 sur 6')
    
    // Search and select property
    await page.fill('[data-testid="property-search"]', 'Villa Les Palmiers')
    await page.waitForTimeout(500) // Wait for search results
    await page.click('[data-testid="property-option-prop_villa_nice_001"]')
    
    // Verify auto-fill functionality
    await expect(page.locator('[data-testid="property-info-nom"]')).toContainText('Villa Les Palmiers Nice')
    await expect(page.locator('[data-testid="property-info-adresse"]')).toContainText('15 Avenue des Palmiers')
    await expect(page.locator('[data-testid="property-info-superficie"]')).toContainText('180 m²')
    
    // Proceed to next step
    await page.click('[data-testid="wizard-next-button"]')
    await expect(page.locator('[data-testid="wizard-step-1"]')).toHaveClass(/bg-green-100/)
    await expect(page.locator('[data-testid="wizard-step-1"] .lucide-check-circle-2')).toBeVisible()

    // **Step 2: General Information**
    await expect(page.locator('[data-testid="wizard-step-2"]')).toHaveClass(/bg-\[#D4841A\]/)
    await expect(page.locator('[data-testid="wizard-progress"]')).toHaveText('Étape 2 sur 6')
    
    // Fill contract type and dates
    await page.selectOption('[data-testid="type-contrat-select"]', scenario.type_contrat)
    await page.fill('[data-testid="date-debut-input"]', scenario.date_debut)
    await page.fill('[data-testid="date-fin-input"]', scenario.date_fin)
    
    // Contract options
    await page.check('[data-testid="meuble-checkbox"]')
    await page.check('[data-testid="autorisation-sous-location-checkbox"]') // Business rule: mandatory
    
    // Landlord information
    await page.fill('[data-testid="bailleur-nom-input"]', scenario.bailleur_nom)
    await page.fill('[data-testid="bailleur-email-input"]', scenario.bailleur_email)
    await page.fill('[data-testid="bailleur-telephone-input"]', scenario.bailleur_telephone)
    
    // Validate business rule enforcement
    await expect(page.locator('[data-testid="sous-location-required-info"]')).toBeVisible()
    await expect(page.locator('[data-testid="sous-location-required-info"]'))
      .toContainText('Autorisation obligatoire pour Want It Now')
    
    await page.click('[data-testid="wizard-next-button"]')

    // **Step 3: Financial Conditions**
    await expect(page.locator('[data-testid="wizard-step-3"]')).toHaveClass(/bg-\[#D4841A\]/)
    
    // Fill financial details
    await page.fill('[data-testid="commission-pourcentage-input"]', scenario.commission_pourcentage)
    await page.fill('[data-testid="usage-proprietaire-jours-input"]', scenario.usage_proprietaire_jours_max)
    await page.fill('[data-testid="loyer-mensuel-input"]', scenario.loyer_mensuel_ht)
    await page.fill('[data-testid="charges-mensuelles-input"]', scenario.charges_mensuelles)
    await page.fill('[data-testid="depot-garantie-input"]', scenario.depot_garantie)
    
    // Verify 60-day limit warning
    await expect(page.locator('[data-testid="usage-proprietaire-limit-info"]'))
      .toContainText('Maximum 60 jours par an')
    
    await page.click('[data-testid="wizard-next-button"]')

    // **Step 4: Insurance & Protection**  
    await expect(page.locator('[data-testid="wizard-step-4"]')).toHaveClass(/bg-\[#D4841A\]/)
    
    await page.check('[data-testid="attestation-assurance-checkbox"]')
    await page.fill('[data-testid="nom-assureur-input"]', scenario.nom_assureur)
    await page.fill('[data-testid="numero-police-input"]', scenario.numero_police)
    await page.check('[data-testid="assurance-pertes-exploitation-checkbox"]')
    await page.check('[data-testid="protection-juridique-checkbox"]')
    
    await page.click('[data-testid="wizard-next-button"]')

    // **Step 5: Clauses & Business Rules**
    await expect(page.locator('[data-testid="wizard-step-5"]')).toHaveClass(/bg-\[#D4841A\]/)
    
    await page.selectOption('[data-testid="type-activite-select"]', scenario.type_activite_sous_location)
    await page.fill('[data-testid="conditions-sous-location-textarea"]', scenario.conditions_sous_location)
    await page.fill('[data-testid="contact-urgence-nom-input"]', scenario.contact_urgence_nom)
    await page.fill('[data-testid="contact-urgence-telephone-input"]', scenario.contact_urgence_telephone)
    
    await page.click('[data-testid="wizard-next-button"]')

    // **Step 6: Review & Finalization**
    await expect(page.locator('[data-testid="wizard-step-6"]')).toHaveClass(/bg-\[#D4841A\]/)
    await expect(page.locator('[data-testid="wizard-progress"]')).toHaveText('Étape 6 sur 6')
    
    // Verify all data in review section
    await expect(page.locator('[data-testid="review-propriete-nom"]')).toContainText('Villa Les Palmiers Nice')
    await expect(page.locator('[data-testid="review-type-contrat"]')).toContainText('Fixe')
    await expect(page.locator('[data-testid="review-commission"]')).toContainText('12%')
    await expect(page.locator('[data-testid="review-loyer"]')).toContainText('2500.00 €')
    await expect(page.locator('[data-testid="review-bailleur"]')).toContainText('Jean Dupont')
    
    // Submit contract
    await page.click('[data-testid="submit-contract-button"]')
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Contrat créé avec succès')
    
    // Should redirect to contracts list
    await page.waitForURL('**/contrats')
    await expect(page.url()).toContain('/contrats')
  })

  test('Variable contract with unit selection', async ({ page }) => {
    const scenario = TEST_CONTRAT_SCENARIOS.studio_paris_variable

    // **Step 1: Unit Selection (Property with units)**
    await page.fill('[data-testid="property-search"]', 'Résidence Trocadéro')
    await page.click('[data-testid="property-option-prop_immeuble_paris_001"]')
    
    // Verify units dropdown appears
    await expect(page.locator('[data-testid="units-selector"]')).toBeVisible()
    await expect(page.locator('[data-testid="units-info"]'))
      .toContainText('Cette propriété contient des unités. Sélectionnez une unité spécifique.')
    
    // Select specific unit
    await page.selectOption('[data-testid="units-selector"]', 'unit_paris_trocadero_01')
    await expect(page.locator('[data-testid="selected-unit-info"]')).toContainText('Studio Étoile')
    
    await page.click('[data-testid="wizard-next-button"]')

    // **Step 2: Variable contract specifics**
    await page.selectOption('[data-testid="type-contrat-select"]', 'variable')
    
    // Verify commission auto-changes to 10% for variable contracts
    await expect(page.locator('[data-testid="commission-pourcentage-input"]')).toHaveValue('10')
    await expect(page.locator('[data-testid="commission-variable-info"]'))
      .toContainText('Commission fixe à 10% pour les contrats variables')
    
    // Continue filling required fields...
    await page.fill('[data-testid="date-debut-input"]', scenario.date_debut)
    await page.fill('[data-testid="date-fin-input"]', scenario.date_fin)
    await page.check('[data-testid="autorisation-sous-location-checkbox"]')
    
    // Test business rule: commission cannot be changed for variable contracts
    await page.fill('[data-testid="commission-pourcentage-input"]', '15')
    await page.click('[data-testid="wizard-next-button"]')
    
    // Should show error for incorrect commission
    await expect(page.locator('[data-testid="commission-error"]'))
      .toContainText('La commission pour les contrats variables doit être de 10%')
    
    // Fix commission
    await page.fill('[data-testid="commission-pourcentage-input"]', '10')
    await page.click('[data-testid="wizard-next-button"]')
    
    // Continue to completion...
    // (Similar to previous test but with variable contract specifics)
  })
})

test.describe('Contract Wizard - Business Rules Enforcement', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/contrats/nouveau')
    await expect(page.locator('[data-testid="contract-wizard"]')).toBeVisible()
  })

  test('Mandatory subletting authorization', async ({ page }) => {
    // Navigate through Step 1
    await page.fill('[data-testid="property-search"]', 'Villa Les Palmiers')
    await page.click('[data-testid="property-option-prop_villa_nice_001"]')
    await page.click('[data-testid="wizard-next-button"]')
    
    // Step 2: Try to proceed without subletting authorization
    await page.selectOption('[data-testid="type-contrat-select"]', 'fixe')
    await page.fill('[data-testid="date-debut-input"]', '2025-03-01')
    await page.fill('[data-testid="date-fin-input"]', '2026-02-28')
    
    // Leave subletting unchecked
    await page.uncheck('[data-testid="autorisation-sous-location-checkbox"]')
    
    // Try to proceed
    await page.click('[data-testid="wizard-next-button"]')
    
    // Should show error
    await expect(page.locator('[data-testid="subletting-error"]'))
      .toContainText('L\'autorisation de sous-location est obligatoire pour Want It Now')
    await expect(page.locator('[data-testid="wizard-next-button"]')).toBeDisabled()
    
    // Fix by checking subletting
    await page.check('[data-testid="autorisation-sous-location-checkbox"]')
    await expect(page.locator('[data-testid="wizard-next-button"]')).not.toBeDisabled()
  })

  test('10% commission enforcement for variable contracts', async ({ page }) => {
    // Navigate to Step 3 with variable contract
    await page.fill('[data-testid="property-search"]', 'Villa Les Palmiers')
    await page.click('[data-testid="property-option-prop_villa_nice_001"]')
    await page.click('[data-testid="wizard-next-button"]')
    
    await page.selectOption('[data-testid="type-contrat-select"]', 'variable')
    await page.fill('[data-testid="date-debut-input"]', '2025-03-01')
    await page.fill('[data-testid="date-fin-input"]', '2026-02-28')
    await page.check('[data-testid="autorisation-sous-location-checkbox"]')
    await page.click('[data-testid="wizard-next-button"]')
    
    // Step 3: Commission should be auto-set to 10%
    await expect(page.locator('[data-testid="commission-pourcentage-input"]')).toHaveValue('10')
    
    // Try to change commission to different value
    await page.fill('[data-testid="commission-pourcentage-input"]', '15')
    
    // Should show warning
    await expect(page.locator('[data-testid="commission-variable-warning"]'))
      .toContainText('La commission doit être de 10% pour les contrats variables')
    
    // Try to proceed with wrong commission
    await page.fill('[data-testid="usage-proprietaire-jours-input"]', '30')
    await page.click('[data-testid="wizard-next-button"]')
    
    // Should show error and prevent progression
    await expect(page.locator('[data-testid="commission-validation-error"]'))
      .toContainText('La commission pour les contrats variables doit être de 10%')
  })

  test('60-day limit for owner usage', async ({ page }) => {
    // Navigate to Step 3
    await page.fill('[data-testid="property-search"]', 'Villa Les Palmiers')
    await page.click('[data-testid="property-option-prop_villa_nice_001"]')
    await page.click('[data-testid="wizard-next-button"]')
    
    await page.selectOption('[data-testid="type-contrat-select"]', 'fixe')
    await page.fill('[data-testid="date-debut-input"]', '2025-03-01')
    await page.fill('[data-testid="date-fin-input"]', '2026-02-28')
    await page.check('[data-testid="autorisation-sous-location-checkbox"]')
    await page.click('[data-testid="wizard-next-button"]')
    
    // Step 3: Try to exceed 60-day limit
    await page.fill('[data-testid="usage-proprietaire-jours-input"]', '75')
    
    // Should show real-time warning
    await expect(page.locator('[data-testid="usage-proprietaire-warning"]'))
      .toContainText('Maximum 60 jours par an autorisé')
    
    // Try to proceed
    await page.fill('[data-testid="commission-pourcentage-input"]', '12')
    await page.click('[data-testid="wizard-next-button"]')
    
    // Should show error
    await expect(page.locator('[data-testid="usage-proprietaire-error"]'))
      .toContainText('L\'usage propriétaire ne peut pas dépasser 60 jours par an')
    
    // Fix by setting valid value
    await page.fill('[data-testid="usage-proprietaire-jours-input"]', '45')
    await expect(page.locator('[data-testid="usage-proprietaire-error"]')).not.toBeVisible()
  })
})

test.describe('Contract Wizard - Draft Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/contrats/nouveau')
    await expect(page.locator('[data-testid="contract-wizard"]')).toBeVisible()
  })

  test('Auto-save draft every 30 seconds', async ({ page }) => {
    // Fill some data
    await page.fill('[data-testid="property-search"]', 'Villa Les Palmiers')
    await page.click('[data-testid="property-option-prop_villa_nice_001"]')
    await page.click('[data-testid="wizard-next-button"]')
    
    await page.selectOption('[data-testid="type-contrat-select"]', 'fixe')
    await page.fill('[data-testid="date-debut-input"]', '2025-03-01')
    
    // Wait for auto-save (30 seconds + buffer)
    await page.waitForTimeout(32000)
    
    // Should show auto-save confirmation
    await expect(page.locator('[data-testid="auto-save-message"]'))
      .toContainText('Brouillon sauvegardé automatiquement')
    
    // Verify draft badge appears
    await expect(page.locator('[data-testid="draft-badge"]')).toBeVisible()
    await expect(page.locator('[data-testid="draft-badge"]')).toContainText('Brouillon')
    
    // Verify last saved time is displayed
    await expect(page.locator('[data-testid="last-saved-time"]')).toBeVisible()
  })

  test('Manual draft save', async ({ page }) => {
    // Fill some data
    await page.fill('[data-testid="property-search"]', 'Villa Les Palmiers')
    await page.click('[data-testid="property-option-prop_villa_nice_001"]')
    
    // Click manual save
    await page.click('[data-testid="save-draft-button"]')
    
    // Should show success message
    await expect(page.locator('[data-testid="draft-save-success"]'))
      .toContainText('Brouillon sauvegardé')
    
    // Draft badge should appear
    await expect(page.locator('[data-testid="draft-badge"]')).toBeVisible()
  })

  test('Load draft on page return', async ({ page }) => {
    // Create draft first
    await page.fill('[data-testid="property-search"]', 'Villa Les Palmiers')
    await page.click('[data-testid="property-option-prop_villa_nice_001"]')
    await page.click('[data-testid="save-draft-button"]')
    
    // Get draft ID from URL or storage
    const draftId = await page.evaluate(() => localStorage.getItem('contract-draft-id'))
    
    // Navigate away and back
    await page.goto('http://localhost:3001/contrats')
    await page.goto(`http://localhost:3001/contrats/nouveau?draft=${draftId}`)
    
    // Should auto-load draft
    await expect(page.locator('[data-testid="draft-loaded-message"]'))
      .toContainText('Brouillon chargé')
    
    // Data should be preserved
    await expect(page.locator('[data-testid="property-info-nom"]'))
      .toContainText('Villa Les Palmiers Nice')
  })
})

test.describe('Contract Wizard - Form Validation & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/contrats/nouveau')
  })

  test('Step-by-step validation prevents progression with incomplete data', async ({ page }) => {
    // Try to proceed from Step 1 without selecting property
    await page.click('[data-testid="wizard-next-button"]')
    
    // Should show validation error
    await expect(page.locator('[data-testid="property-required-error"]'))
      .toContainText('Veuillez sélectionner une propriété')
    
    // Next button should be disabled or show error
    await expect(page.locator('[data-testid="validation-error-message"]'))
      .toContainText('Veuillez compléter tous les champs requis')
  })

  test('Navigation between completed steps', async ({ page }) => {
    // Complete Step 1
    await page.fill('[data-testid="property-search"]', 'Villa Les Palmiers')
    await page.click('[data-testid="property-option-prop_villa_nice_001"]')
    await page.click('[data-testid="wizard-next-button"]')
    
    // Complete Step 2 partially  
    await page.selectOption('[data-testid="type-contrat-select"]', 'fixe')
    await page.fill('[data-testid="date-debut-input"]', '2025-03-01')
    await page.fill('[data-testid="date-fin-input"]', '2026-02-28')
    await page.check('[data-testid="autorisation-sous-location-checkbox"]')
    await page.click('[data-testid="wizard-next-button"]')
    
    // Now at Step 3 - navigate back to Step 1
    await page.click('[data-testid="wizard-step-1-button"]')
    
    // Should be at Step 1 with data preserved
    await expect(page.locator('[data-testid="wizard-step-1"]')).toHaveClass(/bg-\[#D4841A\]/)
    await expect(page.locator('[data-testid="property-info-nom"]'))
      .toContainText('Villa Les Palmiers Nice')
    
    // Navigate back to Step 3
    await page.click('[data-testid="wizard-step-3-button"]')
    await expect(page.locator('[data-testid="wizard-step-3"]')).toHaveClass(/bg-\[#D4841A\]/)
  })

  test('Previous/Next button functionality', async ({ page }) => {
    // Step 1: Previous should be disabled
    await expect(page.locator('[data-testid="wizard-prev-button"]')).toBeDisabled()
    
    // Complete Step 1 and go to Step 2
    await page.fill('[data-testid="property-search"]', 'Villa Les Palmiers')
    await page.click('[data-testid="property-option-prop_villa_nice_001"]')
    await page.click('[data-testid="wizard-next-button"]')
    
    // Step 2: Previous should be enabled, Next disabled until complete
    await expect(page.locator('[data-testid="wizard-prev-button"]')).not.toBeDisabled()
    
    // Go back to Step 1
    await page.click('[data-testid="wizard-prev-button"]')
    await expect(page.locator('[data-testid="wizard-step-1"]')).toHaveClass(/bg-\[#D4841A\]/)
  })

  test('Real-time form validation feedback', async ({ page }) => {
    // Navigate to Step 2
    await page.fill('[data-testid="property-search"]', 'Villa Les Palmiers')
    await page.click('[data-testid="property-option-prop_villa_nice_001"]')
    await page.click('[data-testid="wizard-next-button"]')
    
    // Test email validation
    await page.fill('[data-testid="bailleur-email-input"]', 'invalid-email')
    await page.blur('[data-testid="bailleur-email-input"]')
    
    await expect(page.locator('[data-testid="bailleur-email-error"]'))
      .toContainText('Format d\'email invalide')
    
    // Test phone validation
    await page.fill('[data-testid="bailleur-telephone-input"]', '123')
    await page.blur('[data-testid="bailleur-telephone-input"]')
    
    await expect(page.locator('[data-testid="bailleur-telephone-error"]'))
      .toContainText('Numéro de téléphone invalide')
    
    // Test date validation (end before start)
    await page.fill('[data-testid="date-debut-input"]', '2025-12-01')
    await page.fill('[data-testid="date-fin-input"]', '2025-06-01')
    await page.blur('[data-testid="date-fin-input"]')
    
    await expect(page.locator('[data-testid="date-fin-error"]'))
      .toContainText('La date de fin doit être postérieure à la date de début')
  })
})

test.describe('Contract Wizard - Error Handling & Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/contrats/nouveau')
  })

  test('Property AND unit selection error (business rule violation)', async ({ page }) => {
    // This would be a developer/admin test case
    // Navigate to debug mode or simulate invalid state
    
    await page.evaluate(() => {
      // Simulate invalid state in form
      window.dispatchEvent(new CustomEvent('test-invalid-state', {
        detail: {
          propriete_id: 'prop_villa_nice_001',
          unite_id: 'unit_paris_trocadero_01'
        }
      }))
    })
    
    // Try to proceed with both property and unit selected
    await page.click('[data-testid="wizard-next-button"]')
    
    // Should show exclusivity error
    await expect(page.locator('[data-testid="exclusivity-error"]'))
      .toContainText('Un contrat ne peut pas être lié à la fois à une propriété ET une unité')
  })

  test('Network error handling during form submission', async ({ page }) => {
    // Complete entire form
    await fillCompleteForm(page)
    
    // Navigate to final step
    await navigateToFinalStep(page)
    
    // Simulate network error
    await page.route('**/api/contrats**', route => route.abort())
    
    // Try to submit
    await page.click('[data-testid="submit-contract-button"]')
    
    // Should show error message
    await expect(page.locator('[data-testid="network-error-message"]'))
      .toContainText('Erreur de connexion. Veuillez réessayer.')
    
    // Form should remain in submitting state briefly then recover
    await expect(page.locator('[data-testid="submit-contract-button"]')).toBeDisabled()
    await page.waitForTimeout(3000)
    await expect(page.locator('[data-testid="submit-contract-button"]')).not.toBeDisabled()
  })

  test('Server validation error handling', async ({ page }) => {
    await fillCompleteForm(page)
    await navigateToFinalStep(page)
    
    // Mock server validation error
    await page.route('**/api/contrats**', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'La propriété sélectionnée n\'est plus disponible'
        })
      })
    })
    
    await page.click('[data-testid="submit-contract-button"]')
    
    // Should show server error
    await expect(page.locator('[data-testid="server-error-message"]'))
      .toContainText('La propriété sélectionnée n\'est plus disponible')
  })
})

test.describe('Contract Wizard - Mobile & Responsive Testing', () => {
  test('Mobile viewport navigation and form interaction', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('http://localhost:3001/contrats/nouveau')
    
    // Mobile-specific UI elements
    await expect(page.locator('[data-testid="mobile-wizard-header"]')).toBeVisible()
    
    // Step navigation should be horizontal scroll on mobile
    await expect(page.locator('[data-testid="wizard-steps-container"]')).toHaveCSS('overflow-x', 'auto')
    
    // Form fields should stack vertically
    await expect(page.locator('[data-testid="form-container"]')).toHaveCSS('flex-direction', 'column')
    
    // Touch-friendly button sizes
    const nextButton = page.locator('[data-testid="wizard-next-button"]')
    const boundingBox = await nextButton.boundingBox()
    expect(boundingBox?.height).toBeGreaterThanOrEqual(44) // iOS minimum touch target
  })

  test('Tablet viewport layout adaptation', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    
    await page.goto('http://localhost:3001/contrats/nouveau')
    
    // Tablet layout should show 2-column forms where appropriate
    await page.fill('[data-testid="property-search"]', 'Villa Les Palmiers')
    await page.click('[data-testid="property-option-prop_villa_nice_001"]')
    await page.click('[data-testid="wizard-next-button"]')
    
    // Form should adapt to tablet width
    await expect(page.locator('[data-testid="form-grid"]')).toHaveCSS('grid-template-columns', /.* .* .*/)
  })
})

test.describe('Contract Wizard - Performance Testing', () => {
  test('Page load performance under 2 seconds', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('http://localhost:3001/contrats/nouveau')
    await expect(page.locator('[data-testid="contract-wizard"]')).toBeVisible()
    
    const loadTime = Date.now() - startTime
    
    // Performance target: < 2000ms
    expect(loadTime).toBeLessThan(2000)
  })

  test('Form submission performance', async ({ page }) => {
    await fillCompleteForm(page)
    await navigateToFinalStep(page)
    
    const startTime = Date.now()
    
    await page.click('[data-testid="submit-contract-button"]')
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    const submissionTime = Date.now() - startTime
    
    // Business requirement: < 3000ms for submission
    expect(submissionTime).toBeLessThan(3000)
  })

  test('Large property list performance', async ({ page }) => {
    // Mock large dataset
    await page.route('**/api/proprietes**', route => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `prop_${i}`,
        nom: `Propriété ${i}`,
        adresse_complete: `${i} Rue Test, 75001 Paris`
      }))
      
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(largeDataset)
      })
    })
    
    await page.goto('http://localhost:3001/contrats/nouveau')
    
    const searchStartTime = Date.now()
    await page.fill('[data-testid="property-search"]', 'Propriété')
    
    // Search results should appear within 500ms
    await expect(page.locator('[data-testid="property-results"]')).toBeVisible({ timeout: 500 })
    
    const searchTime = Date.now() - searchStartTime
    expect(searchTime).toBeLessThan(500)
  })
})

// Helper functions for test reuse
async function fillCompleteForm(page: Page) {
  const scenario = TEST_CONTRAT_SCENARIOS.villa_nice_fixe
  
  // Step 1: Property selection
  await page.fill('[data-testid="property-search"]', 'Villa Les Palmiers')
  await page.click('[data-testid="property-option-prop_villa_nice_001"]')
  await page.click('[data-testid="wizard-next-button"]')
  
  // Step 2: General information
  await page.selectOption('[data-testid="type-contrat-select"]', scenario.type_contrat)
  await page.fill('[data-testid="date-debut-input"]', scenario.date_debut)
  await page.fill('[data-testid="date-fin-input"]', scenario.date_fin)
  await page.check('[data-testid="meuble-checkbox"]')
  await page.check('[data-testid="autorisation-sous-location-checkbox"]')
  await page.fill('[data-testid="bailleur-nom-input"]', scenario.bailleur_nom)
  await page.fill('[data-testid="bailleur-email-input"]', scenario.bailleur_email)
  await page.fill('[data-testid="bailleur-telephone-input"]', scenario.bailleur_telephone)
  await page.click('[data-testid="wizard-next-button"]')
  
  // Step 3: Financial conditions
  await page.fill('[data-testid="commission-pourcentage-input"]', scenario.commission_pourcentage)
  await page.fill('[data-testid="usage-proprietaire-jours-input"]', scenario.usage_proprietaire_jours_max)
  await page.fill('[data-testid="loyer-mensuel-input"]', scenario.loyer_mensuel_ht)
  await page.fill('[data-testid="charges-mensuelles-input"]', scenario.charges_mensuelles)
  await page.fill('[data-testid="depot-garantie-input"]', scenario.depot_garantie)
  await page.click('[data-testid="wizard-next-button"]')
  
  // Step 4: Insurance
  await page.check('[data-testid="attestation-assurance-checkbox"]')
  await page.fill('[data-testid="nom-assureur-input"]', scenario.nom_assureur)
  await page.fill('[data-testid="numero-police-input"]', scenario.numero_police)
  await page.check('[data-testid="assurance-pertes-exploitation-checkbox"]')
  await page.check('[data-testid="protection-juridique-checkbox"]')
  await page.click('[data-testid="wizard-next-button"]')
  
  // Step 5: Clauses
  await page.selectOption('[data-testid="type-activite-select"]', scenario.type_activite_sous_location)
  await page.fill('[data-testid="conditions-sous-location-textarea"]', scenario.conditions_sous_location)
  await page.fill('[data-testid="contact-urgence-nom-input"]', scenario.contact_urgence_nom)
  await page.fill('[data-testid="contact-urgence-telephone-input"]', scenario.contact_urgence_telephone)
  await page.click('[data-testid="wizard-next-button"]')
}

async function navigateToFinalStep(page: Page) {
  // Assumes form is already filled, navigates to final step
  await expect(page.locator('[data-testid="wizard-step-6"]')).toHaveClass(/bg-\[#D4841A\]/)
  await expect(page.locator('[data-testid="submit-contract-button"]')).toBeVisible()
}