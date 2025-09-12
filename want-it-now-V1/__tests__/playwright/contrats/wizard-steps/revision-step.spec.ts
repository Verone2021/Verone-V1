/**
 * Revision Step Playwright Tests - Contract Wizard
 * Want It Now V1 - Final Review & Submission Testing
 * 
 * Tests cover:
 * - Complete data review and verification
 * - Final business rules validation
 * - Contract generation and submission
 * - Error handling during submission
 * - Success flow and redirections
 * - Print/download functionality
 */

import { test, expect } from '@playwright/test'
import { TEST_CONTRAT_SCENARIOS } from '../../../../test-data/contrats-test-data'

test.describe('Revision Step - Data Review & Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/contrats/nouveau')
    
    // Navigate through all steps to reach Step 6 (Revision)
    await fillCompleteWizard(page)
    
    // Verify we're on the revision step
    await expect(page.locator('[data-testid="wizard-step-6"]')).toHaveClass(/bg-\[#D4841A\]/)
    await expect(page.locator('[data-testid="revision-step-title"]'))
      .toContainText('Révision & Finalisation')
  })

  test('Complete contract data review display', async ({ page }) => {
    const scenario = TEST_CONTRAT_SCENARIOS.villa_nice_fixe
    
    // **Property Information Section**
    await expect(page.locator('[data-testid="review-section-propriete"]')).toBeVisible()
    await expect(page.locator('[data-testid="review-propriete-nom"]'))
      .toContainText('Villa Les Palmiers Nice')
    await expect(page.locator('[data-testid="review-propriete-adresse"]'))
      .toContainText('15 Avenue des Palmiers, 06000 Nice')
    await expect(page.locator('[data-testid="review-propriete-type"]'))
      .toContainText('Villa')
    await expect(page.locator('[data-testid="review-propriete-superficie"]'))
      .toContainText('180 m²')
    
    // **Contract Details Section**
    await expect(page.locator('[data-testid="review-section-contrat"]')).toBeVisible()
    await expect(page.locator('[data-testid="review-type-contrat"]'))
      .toContainText('Contrat Fixe')
    await expect(page.locator('[data-testid="review-duree-contrat"]'))
      .toContainText('1 an (01/03/2025 - 28/02/2026)')
    await expect(page.locator('[data-testid="review-meuble"]'))
      .toContainText('Meublé')
    await expect(page.locator('[data-testid="review-sous-location"]'))
      .toContainText('Sous-location autorisée')
    
    // **Financial Information Section**
    await expect(page.locator('[data-testid="review-section-financier"]')).toBeVisible()
    await expect(page.locator('[data-testid="review-loyer-mensuel"]'))
      .toContainText('2 500,00 € / mois')
    await expect(page.locator('[data-testid="review-charges"]'))
      .toContainText('200,00 € / mois')
    await expect(page.locator('[data-testid="review-commission"]'))
      .toContainText('12% (300,00 € / mois)')
    await expect(page.locator('[data-testid="review-depot-garantie"]'))
      .toContainText('2 500,00 €')
    
    // **Landlord Information Section**  
    await expect(page.locator('[data-testid="review-section-bailleur"]')).toBeVisible()
    await expect(page.locator('[data-testid="review-bailleur-nom"]'))
      .toContainText('Jean Dupont')
    await expect(page.locator('[data-testid="review-bailleur-email"]'))
      .toContainText('jean.dupont@gmail.com')
    await expect(page.locator('[data-testid="review-bailleur-telephone"]'))
      .toContainText('+33 6 12 34 56 78')
    
    // **Insurance Information Section**
    await expect(page.locator('[data-testid="review-section-assurance"]')).toBeVisible()
    await expect(page.locator('[data-testid="review-attestation-assurance"]'))
      .toContainText('Attestation fournie')
    await expect(page.locator('[data-testid="review-nom-assureur"]'))
      .toContainText('AXA France')
    await expect(page.locator('[data-testid="review-numero-police"]'))
      .toContainText('AXA-PNO-2025-001234')
    await expect(page.locator('[data-testid="review-pertes-exploitation"]'))
      .toContainText('Incluse')
    await expect(page.locator('[data-testid="review-protection-juridique"]'))
      .toContainText('Incluse')
    
    // **Business Rules Section**
    await expect(page.locator('[data-testid="review-section-regles"]')).toBeVisible()
    await expect(page.locator('[data-testid="review-usage-proprietaire"]'))
      .toContainText('45 jours maximum par an')
    await expect(page.locator('[data-testid="review-type-activite"]'))
      .toContainText('Courte durée')
    await expect(page.locator('[data-testid="review-conditions-sous-location"]'))
      .toContainText('Durée minimum 3 nuits, maximum 8 personnes')
    
    // **Emergency Contact Section**
    await expect(page.locator('[data-testid="review-section-urgence"]')).toBeVisible()
    await expect(page.locator('[data-testid="review-contact-urgence"]'))
      .toContainText('Marie Dupont - +33 6 98 76 54 32')
  })

  test('Edit functionality from review step', async ({ page }) => {
    // Should have edit buttons for each section
    await expect(page.locator('[data-testid="edit-propriete-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="edit-contrat-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="edit-financier-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="edit-bailleur-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="edit-assurance-button"]')).toBeVisible()
    
    // Test editing property information (goes back to Step 1)
    await page.click('[data-testid="edit-propriete-button"]')
    await expect(page.locator('[data-testid="wizard-step-1"]')).toHaveClass(/bg-\[#D4841A\]/)
    
    // Make a change and return
    await page.fill('[data-testid="property-search"]', 'Chalet')
    await page.click('[data-testid="property-option-prop_chalet_chamonix_001"]')
    
    // Navigate back to review step
    await page.click('[data-testid="wizard-step-6-button"]')
    
    // Should show updated information
    await expect(page.locator('[data-testid="review-propriete-nom"]'))
      .toContainText('Chalet Mont-Blanc Vue')
  })

  test('Financial summary calculations accuracy', async ({ page }) => {
    // Verify all financial calculations are accurate
    await expect(page.locator('[data-testid="financial-summary"]')).toBeVisible()
    
    // Monthly totals
    await expect(page.locator('[data-testid="summary-loyer-ht"]')).toContainText('2 500,00 €')
    await expect(page.locator('[data-testid="summary-charges"]')).toContainText('200,00 €')
    await expect(page.locator('[data-testid="summary-total-mensuel"]'))
      .toContainText('2 700,00 €') // 2500 + 200
    
    // Commission breakdown
    await expect(page.locator('[data-testid="summary-commission-pourcentage"]'))
      .toContainText('12%')
    await expect(page.locator('[data-testid="summary-commission-montant"]'))
      .toContainText('300,00 €') // 2500 * 12%
    
    // Net to owner
    await expect(page.locator('[data-testid="summary-net-proprietaire"]'))
      .toContainText('2 200,00 €') // 2500 - 300
    
    // Annual projections
    await expect(page.locator('[data-testid="summary-revenus-annuels"]'))
      .toContainText('30 000,00 €') // 2500 * 12
    await expect(page.locator('[data-testid="summary-commission-annuelle"]'))
      .toContainText('3 600,00 €') // 300 * 12
    await expect(page.locator('[data-testid="summary-net-annuel-proprietaire"]'))
      .toContainText('26 400,00 €') // 2200 * 12
  })
})

test.describe('Revision Step - Business Rules Final Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/contrats/nouveau')
    await fillCompleteWizard(page)
  })

  test('Final business rules check before submission', async ({ page }) => {
    // Should show business rules compliance checklist
    await expect(page.locator('[data-testid="business-rules-checklist"]')).toBeVisible()
    
    // All rules should be validated and marked as compliant
    await expect(page.locator('[data-testid="rule-sous-location-check"]')).toBeVisible()
    await expect(page.locator('[data-testid="rule-sous-location-status"]'))
      .toContainText('✓ Sous-location autorisée')
    
    await expect(page.locator('[data-testid="rule-usage-proprietaire-check"]')).toBeVisible()
    await expect(page.locator('[data-testid="rule-usage-proprietaire-status"]'))
      .toContainText('✓ Usage propriétaire ≤ 60 jours')
    
    await expect(page.locator('[data-testid="rule-commission-check"]')).toBeVisible()
    await expect(page.locator('[data-testid="rule-commission-status"]'))
      .toContainText('✓ Commission dans les limites acceptables')
    
    await expect(page.locator('[data-testid="rule-assurance-check"]')).toBeVisible()
    await expect(page.locator('[data-testid="rule-assurance-status"]'))
      .toContainText('✓ Assurance PNO requise fournie')
    
    // Overall compliance indicator
    await expect(page.locator('[data-testid="overall-compliance"]'))
      .toHaveClass(/text-green-600/)
    await expect(page.locator('[data-testid="overall-compliance"]'))
      .toContainText('Toutes les règles métier sont respectées')
  })

  test('Variable contract specific validation', async ({ page }) => {
    // Go back and change to variable contract
    await page.click('[data-testid="edit-contrat-button"]')
    await page.selectOption('[data-testid="type-contrat-select"]', 'variable')
    await page.click('[data-testid="wizard-next-button"]')
    
    // Update financial conditions for variable contract
    await page.fill('[data-testid="commission-pourcentage-input"]', '10') // Must be 10%
    await page.fill('[data-testid="estimation-revenus-mensuels-input"]', '3200')
    await page.click('[data-testid="wizard-next-button"]')
    
    // Continue to review step
    await page.click('[data-testid="wizard-next-button"]')
    await page.click('[data-testid="wizard-next-button"]')
    
    // Variable contract specific validation
    await expect(page.locator('[data-testid="rule-commission-variable-check"]')).toBeVisible()
    await expect(page.locator('[data-testid="rule-commission-variable-status"]'))
      .toContainText('✓ Commission 10% (obligatoire pour contrat variable)')
  })
})

test.describe('Revision Step - Contract Submission', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/contrats/nouveau')
    await fillCompleteWizard(page)
  })

  test('Successful contract submission flow', async ({ page }) => {
    // Final review should show submit button
    await expect(page.locator('[data-testid="submit-contract-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="submit-contract-button"]'))
      .toContainText('Créer le Contrat')
    await expect(page.locator('[data-testid="submit-contract-button"]')).not.toBeDisabled()
    
    // Add final notes
    await page.fill('[data-testid="notes-internes-textarea"]', 
      'Contrat créé via wizard - propriétaire confirme availability mars 2025')
    
    // Submit contract
    await page.click('[data-testid="submit-contract-button"]')
    
    // Should show loading state
    await expect(page.locator('[data-testid="submit-loading"]')).toBeVisible()
    await expect(page.locator('[data-testid="submit-contract-button"]')).toBeDisabled()
    
    // Success message should appear
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="success-message"]'))
      .toContainText('Contrat créé avec succès')
    
    // Should redirect to contracts list
    await page.waitForURL('**/contrats')
    await expect(page.url()).toContain('/contrats')
    
    // New contract should appear in the list
    await expect(page.locator('[data-testid="contract-list"]')).toBeVisible()
    await expect(page.locator('[data-testid^="contract-item-"]').first())
      .toContainText('Villa Les Palmiers Nice')
  })

  test('Final validation errors prevent submission', async ({ page }) => {
    // Simulate a validation error (missing required data)
    await page.evaluate(() => {
      // Force validation error
      window.dispatchEvent(new CustomEvent('force-validation-error', {
        detail: { field: 'contact_urgence_telephone', message: 'Téléphone d\'urgence requis' }
      }))
    })
    
    // Try to submit
    await page.click('[data-testid="submit-contract-button"]')
    
    // Should show validation errors
    await expect(page.locator('[data-testid="final-validation-errors"]')).toBeVisible()
    await expect(page.locator('[data-testid="validation-error-contact-urgence"]'))
      .toContainText('Téléphone d\'urgence requis')
    
    // Submit button should be disabled
    await expect(page.locator('[data-testid="submit-contract-button"]')).toBeDisabled()
    
    // Should show error summary
    await expect(page.locator('[data-testid="validation-error-summary"]'))
      .toContainText('Veuillez corriger les erreurs avant de continuer')
  })

  test('Server error handling during submission', async ({ page }) => {
    // Mock server error
    await page.route('**/api/contrats**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Erreur interne du serveur'
        })
      })
    })
    
    // Submit contract
    await page.click('[data-testid="submit-contract-button"]')
    
    // Should show error message
    await expect(page.locator('[data-testid="server-error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="server-error-message"]'))
      .toContainText('Erreur lors de la création du contrat')
    
    // Should show retry option
    await expect(page.locator('[data-testid="retry-submit-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="retry-submit-button"]'))
      .toContainText('Réessayer')
    
    // Submit button should be re-enabled
    await expect(page.locator('[data-testid="submit-contract-button"]')).not.toBeDisabled()
  })

  test('Network error handling', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/contrats**', route => route.abort())
    
    // Submit contract
    await page.click('[data-testid="submit-contract-button"]')
    
    // Should show network error
    await expect(page.locator('[data-testid="network-error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="network-error-message"]'))
      .toContainText('Problème de connexion')
    
    // Should suggest checking connection
    await expect(page.locator('[data-testid="network-error-suggestion"]'))
      .toContainText('Vérifiez votre connexion internet')
  })
})

test.describe('Revision Step - Additional Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/contrats/nouveau')
    await fillCompleteWizard(page)
  })

  test('Save as draft from revision step', async ({ page }) => {
    // Should have save as draft option even at final step
    await expect(page.locator('[data-testid="save-as-draft-button"]')).toBeVisible()
    
    await page.click('[data-testid="save-as-draft-button"]')
    
    // Should show draft confirmation
    await expect(page.locator('[data-testid="draft-saved-message"]'))
      .toContainText('Brouillon sauvegardé')
    
    // Should maintain data and show draft badge
    await expect(page.locator('[data-testid="draft-badge"]')).toBeVisible()
  })

  test('Print preview functionality', async ({ page }) => {
    // Should have print preview option
    await expect(page.locator('[data-testid="print-preview-button"]')).toBeVisible()
    
    await page.click('[data-testid="print-preview-button"]')
    
    // Should open print-friendly view
    await expect(page.locator('[data-testid="print-preview-modal"]')).toBeVisible()
    await expect(page.locator('[data-testid="print-contract-content"]')).toBeVisible()
    
    // Should show all contract details in printable format
    await expect(page.locator('[data-testid="print-header"]'))
      .toContainText('CONTRAT DE SOUS-LOCATION WANT IT NOW')
    
    // Should have actual print button
    await expect(page.locator('[data-testid="print-button"]')).toBeVisible()
  })

  test('Contract PDF generation', async ({ page }) => {
    // Should have PDF download option
    await expect(page.locator('[data-testid="download-pdf-button"]')).toBeVisible()
    
    // Mock PDF generation
    await page.route('**/api/contrats/pdf**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: Buffer.from('PDF content mock')
      })
    })
    
    // Start PDF download
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="download-pdf-button"]')
    
    const download = await downloadPromise
    
    // Verify download
    expect(download.suggestedFilename()).toContain('contrat-villa-les-palmiers')
    expect(download.suggestedFilename()).toContain('.pdf')
  })

  test('Email contract option', async ({ page }) => {
    // Should have email contract option
    await expect(page.locator('[data-testid="email-contract-button"]')).toBeVisible()
    
    await page.click('[data-testid="email-contract-button"]')
    
    // Should show email modal
    await expect(page.locator('[data-testid="email-contract-modal"]')).toBeVisible()
    
    // Should pre-fill landlord email
    await expect(page.locator('[data-testid="email-recipient-input"]'))
      .toHaveValue('jean.dupont@gmail.com')
    
    // Should have customizable subject and message
    await expect(page.locator('[data-testid="email-subject-input"]'))
      .toHaveValue(/Contrat de sous-location.*Villa Les Palmiers Nice/)
    
    await expect(page.locator('[data-testid="email-message-textarea"]'))
      .toContainText('Veuillez trouver ci-joint votre contrat de sous-location')
    
    // Should have send button
    await expect(page.locator('[data-testid="send-email-button"]')).toBeVisible()
  })

  test('Contract terms and conditions acceptance', async ({ page }) => {
    // Should show T&C checkbox before final submission
    await expect(page.locator('[data-testid="terms-conditions-checkbox"]')).toBeVisible()
    await expect(page.locator('[data-testid="terms-conditions-label"]'))
      .toContainText('J\'accepte les conditions générales Want It Now')
    
    // Submit should be disabled until T&C accepted
    await expect(page.locator('[data-testid="submit-contract-button"]')).toBeDisabled()
    
    // Accept T&C
    await page.check('[data-testid="terms-conditions-checkbox"]')
    
    // Submit should be enabled
    await expect(page.locator('[data-testid="submit-contract-button"]')).not.toBeDisabled()
    
    // Should show T&C link
    await expect(page.locator('[data-testid="terms-conditions-link"]')).toBeVisible()
  })
})

// Helper function to fill complete wizard
async function fillCompleteWizard(page) {
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
  await page.selectOption('[data-testid="jour-paiement-select"]', '5')
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
  
  // Now at Step 6 - Revision
}