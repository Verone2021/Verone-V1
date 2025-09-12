/**
 * Conditions Step Playwright Tests - Contract Wizard
 * Want It Now V1 - Financial Conditions Business Logic Testing
 * 
 * Tests cover:
 * - Commission percentage validation (10% for variable contracts)
 * - Owner usage days limit (60 days maximum)
 * - Financial calculations and validation
 * - Contract type specific fields
 * - Real-time calculations and updates
 * - Business rule enforcement
 */

import { test, expect } from '@playwright/test'
import { TEST_CONTRAT_SCENARIOS, TEST_EDGE_CASES } from '../../../../test-data/contrats-test-data'

test.describe('Conditions Step - Commission Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/contrats/nouveau')
    
    // Navigate to Step 3 (Conditions) via completed Steps 1 & 2
    await page.fill('[data-testid="property-search"]', 'Villa Les Palmiers')
    await page.click('[data-testid="property-option-prop_villa_nice_001"]')
    await page.click('[data-testid="wizard-next-button"]')
    
    await page.selectOption('[data-testid="type-contrat-select"]', 'fixe')
    await page.fill('[data-testid="date-debut-input"]', '2025-03-01')
    await page.fill('[data-testid="date-fin-input"]', '2026-02-28')
    await page.check('[data-testid="autorisation-sous-location-checkbox"]')
    await page.fill('[data-testid="bailleur-nom-input"]', 'Jean Dupont')
    await page.fill('[data-testid="bailleur-email-input"]', 'jean.dupont@gmail.com')
    await page.click('[data-testid="wizard-next-button"]')
    
    // Now at Step 3 - Financial Conditions
    await expect(page.locator('[data-testid="wizard-step-3"]')).toHaveClass(/bg-\[#D4841A\]/)
  })

  test('Fixed contract - flexible commission validation', async ({ page }) => {
    const scenario = TEST_CONTRAT_SCENARIOS.villa_nice_fixe
    
    // For fixed contracts, commission should be flexible (but reasonable range)
    await page.fill('[data-testid="commission-pourcentage-input"]', '15')
    
    // Should accept values in reasonable range (5-25%)
    await expect(page.locator('[data-testid="commission-warning"]')).not.toBeVisible()
    
    // Test boundary values
    await page.fill('[data-testid="commission-pourcentage-input"]', '5')
    await expect(page.locator('[data-testid="commission-valid-indicator"]')).toBeVisible()
    
    await page.fill('[data-testid="commission-pourcentage-input"]', '25')
    await expect(page.locator('[data-testid="commission-valid-indicator"]')).toBeVisible()
    
    // Test extreme values should show warnings
    await page.fill('[data-testid="commission-pourcentage-input"]', '35')
    await expect(page.locator('[data-testid="commission-high-warning"]'))
      .toContainText('Commission élevée - vérifiez la valeur')
    
    await page.fill('[data-testid="commission-pourcentage-input"]', '2')
    await expect(page.locator('[data-testid="commission-low-warning"]'))
      .toContainText('Commission faible - vérifiez la valeur')
    
    // Set valid commission for test continuation
    await page.fill('[data-testid="commission-pourcentage-input"]', scenario.commission_pourcentage)
  })

  test('Variable contract - 10% commission enforcement', async ({ page }) => {
    // Change to variable contract type (navigate back to Step 2)
    await page.click('[data-testid="wizard-step-2-button"]')
    await page.selectOption('[data-testid="type-contrat-select"]', 'variable')
    await page.click('[data-testid="wizard-next-button"]')
    
    // Commission should auto-populate to 10% for variable contracts
    await expect(page.locator('[data-testid="commission-pourcentage-input"]')).toHaveValue('10')
    await expect(page.locator('[data-testid="commission-fixed-info"]'))
      .toContainText('Commission fixe à 10% pour les contrats variables')
    
    // Field should be read-only or show warning when changed
    await page.fill('[data-testid="commission-pourcentage-input"]', '15')
    await expect(page.locator('[data-testid="commission-variable-error"]'))
      .toContainText('La commission doit être de 10% pour les contrats variables')
    
    // Try to proceed with wrong commission
    await page.fill('[data-testid="usage-proprietaire-jours-input"]', '30')
    await page.fill('[data-testid="estimation-revenus-mensuels-input"]', '3000')
    await page.click('[data-testid="wizard-next-button"]')
    
    // Should prevent progression
    await expect(page.locator('[data-testid="form-validation-error"]'))
      .toContainText('La commission pour les contrats variables doit être de 10%')
    await expect(page.locator('[data-testid="wizard-step-3"]')).toHaveClass(/bg-\[#D4841A\]/) // Still on step 3
    
    // Fix commission to proceed
    await page.fill('[data-testid="commission-pourcentage-input"]', '10')
    await expect(page.locator('[data-testid="commission-variable-error"]')).not.toBeVisible()
  })

  test('Commission calculation preview', async ({ page }) => {
    const monthlyRent = '2500'
    const commission = '12'
    
    await page.fill('[data-testid="loyer-mensuel-input"]', monthlyRent)
    await page.fill('[data-testid="commission-pourcentage-input"]', commission)
    
    // Should show real-time calculation
    const expectedCommission = (parseFloat(monthlyRent) * parseFloat(commission) / 100).toFixed(2)
    
    await expect(page.locator('[data-testid="commission-calculation"]'))
      .toContainText(`${expectedCommission} € par mois`)
    
    // Annual commission preview
    const annualCommission = (parseFloat(expectedCommission) * 12).toFixed(2)
    await expect(page.locator('[data-testid="commission-annual"]'))
      .toContainText(`${annualCommission} € par an`)
  })
})

test.describe('Conditions Step - Owner Usage Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/contrats/nouveau')
    
    // Navigate to Step 3
    await page.fill('[data-testid="property-search"]', 'Villa Les Palmiers')
    await page.click('[data-testid="property-option-prop_villa_nice_001"]')
    await page.click('[data-testid="wizard-next-button"]')
    
    await page.selectOption('[data-testid="type-contrat-select"]', 'fixe')
    await page.fill('[data-testid="date-debut-input"]', '2025-03-01')
    await page.fill('[data-testid="date-fin-input"]', '2026-02-28')
    await page.check('[data-testid="autorisation-sous-location-checkbox"]')
    await page.fill('[data-testid="bailleur-nom-input"]', 'Jean Dupont')
    await page.fill('[data-testid="bailleur-email-input"]', 'jean.dupont@gmail.com')
    await page.click('[data-testid="wizard-next-button"]')
  })

  test('60-day maximum owner usage validation', async ({ page }) => {
    const usageInput = page.locator('[data-testid="usage-proprietaire-jours-input"]')
    
    // Test valid values (under 60 days)
    await usageInput.fill('45')
    await expect(page.locator('[data-testid="usage-valid-indicator"]')).toBeVisible()
    await expect(page.locator('[data-testid="usage-remaining"]'))
      .toContainText('15 jours restants disponibles')
    
    // Test maximum allowed (60 days)
    await usageInput.fill('60')
    await expect(page.locator('[data-testid="usage-valid-indicator"]')).toBeVisible()
    await expect(page.locator('[data-testid="usage-at-maximum"]'))
      .toContainText('Utilisation maximum atteinte')
    
    // Test exceeding limit (61+ days)
    await usageInput.fill('75')
    await expect(page.locator('[data-testid="usage-error"]'))
      .toContainText('Maximum 60 jours par an autorisé')
    await expect(page.locator('[data-testid="usage-exceeded-warning"]'))
      .toContainText('15 jours au-delà de la limite')
    
    // Should show business rule explanation
    await expect(page.locator('[data-testid="usage-limit-explanation"]'))
      .toContainText('Règle Want It Now : usage propriétaire limité à 60 jours/an')
    
    // Try to proceed with invalid usage
    await page.fill('[data-testid="commission-pourcentage-input"]', '12')
    await page.fill('[data-testid="loyer-mensuel-input"]', '2500')
    await page.click('[data-testid="wizard-next-button"]')
    
    // Should prevent progression
    await expect(page.locator('[data-testid="usage-validation-error"]'))
      .toContainText('L\'usage propriétaire ne peut pas dépasser 60 jours par an')
  })

  test('Owner usage impact on revenue calculations', async ({ page }) => {
    await page.fill('[data-testid="loyer-mensuel-input"]', '3000')
    await page.fill('[data-testid="usage-proprietaire-jours-input"]', '30')
    
    // Should show revenue impact calculation
    await expect(page.locator('[data-testid="revenue-impact-calculation"]')).toBeVisible()
    
    // 30 days = 1 month of lost revenue
    await expect(page.locator('[data-testid="lost-revenue-monthly"]'))
      .toContainText('≈ 1 mois de revenus perdus')
    await expect(page.locator('[data-testid="lost-revenue-amount"]'))
      .toContainText('≈ 3000 € de revenus en moins')
    
    // Test with different usage
    await page.fill('[data-testid="usage-proprietaire-jours-input"]', '45')
    await expect(page.locator('[data-testid="lost-revenue-monthly"]'))
      .toContainText('≈ 1,5 mois de revenus perdus')
    await expect(page.locator('[data-testid="lost-revenue-amount"]'))
      .toContainText('≈ 4500 € de revenus en moins')
  })

  test('Seasonal usage optimization suggestions', async ({ page }) => {
    // For properties like chalets, suggest optimal usage periods
    await page.click('[data-testid="wizard-step-1-button"]') // Go back to change property
    await page.fill('[data-testid="property-search"]', 'Chalet')
    await page.click('[data-testid="property-option-prop_chalet_chamonix_001"]')
    
    // Navigate back to conditions
    await page.click('[data-testid="wizard-next-button"]')
    await page.click('[data-testid="wizard-next-button"]')
    
    await page.fill('[data-testid="usage-proprietaire-jours-input"]', '30')
    
    // Should show seasonal optimization tips
    await expect(page.locator('[data-testid="seasonal-optimization"]')).toBeVisible()
    await expect(page.locator('[data-testid="optimal-periods"]'))
      .toContainText('Périodes optimales : mai-juin, septembre-octobre')
    await expect(page.locator('[data-testid="avoid-periods"]'))
      .toContainText('Éviter : décembre-mars (haute saison ski)')
  })
})

test.describe('Conditions Step - Financial Calculations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/contrats/nouveau')
    
    // Navigate to Step 3
    await page.fill('[data-testid="property-search"]', 'Villa Les Palmiers')
    await page.click('[data-testid="property-option-prop_villa_nice_001"]')
    await page.click('[data-testid="wizard-next-button"]')
    
    await page.selectOption('[data-testid="type-contrat-select"]', 'fixe')
    await page.fill('[data-testid="date-debut-input"]', '2025-03-01')
    await page.fill('[data-testid="date-fin-input"]', '2026-02-28')
    await page.check('[data-testid="autorisation-sous-location-checkbox"]')
    await page.fill('[data-testid="bailleur-nom-input"]', 'Jean Dupont')
    await page.fill('[data-testid="bailleur-email-input"]', 'jean.dupont@gmail.com')
    await page.click('[data-testid="wizard-next-button"]')
  })

  test('Real-time financial calculations for fixed contracts', async ({ page }) => {
    const monthlyRent = '2500'
    const monthlyCharges = '200'
    const commission = '12'
    
    await page.fill('[data-testid="loyer-mensuel-input"]', monthlyRent)
    await page.fill('[data-testid="charges-mensuelles-input"]', monthlyCharges)
    await page.fill('[data-testid="commission-pourcentage-input"]', commission)
    
    // Real-time calculations should update
    const totalMonthly = parseFloat(monthlyRent) + parseFloat(monthlyCharges)
    const commissionAmount = parseFloat(monthlyRent) * parseFloat(commission) / 100
    const netToOwner = parseFloat(monthlyRent) - commissionAmount
    
    await expect(page.locator('[data-testid="total-monthly-cost"]'))
      .toContainText(`${totalMonthly.toFixed(2)} €`)
    
    await expect(page.locator('[data-testid="commission-amount"]'))
      .toContainText(`${commissionAmount.toFixed(2)} €`)
    
    await expect(page.locator('[data-testid="net-to-owner"]'))
      .toContainText(`${netToOwner.toFixed(2)} €`)
    
    // Annual projections
    await expect(page.locator('[data-testid="annual-rent-projection"]'))
      .toContainText(`${(parseFloat(monthlyRent) * 12).toFixed(2)} €`)
    
    await expect(page.locator('[data-testid="annual-commission"]'))
      .toContainText(`${(commissionAmount * 12).toFixed(2)} €`)
  })

  test('Security deposit validation', async ({ page }) => {
    const monthlyRent = '2500'
    await page.fill('[data-testid="loyer-mensuel-input"]', monthlyRent)
    
    // Test standard deposit (1 month)
    await page.fill('[data-testid="depot-garantie-input"]', monthlyRent)
    await expect(page.locator('[data-testid="deposit-standard-indicator"]'))
      .toContainText('Dépôt standard (1 mois de loyer)')
    
    // Test high deposit (2+ months)
    await page.fill('[data-testid="depot-garantie-input"]', '5000')
    await expect(page.locator('[data-testid="deposit-high-warning"]'))
      .toContainText('Dépôt élevé (2 mois de loyer)')
    
    // Test low deposit (< 0.5 month)
    await page.fill('[data-testid="depot-garantie-input"]', '1000')
    await expect(page.locator('[data-testid="deposit-low-warning"]'))
      .toContainText('Dépôt faible (< 1 mois de loyer)')
  })

  test('Payment day validation', async ({ page }) => {
    const paymentDaySelect = page.locator('[data-testid="jour-paiement-select"]')
    
    // Should have all valid payment days (1-28)
    await paymentDaySelect.click()
    
    // Test common payment days
    await expect(page.locator('[data-testid="payment-day-1"]')).toBeVisible()
    await expect(page.locator('[data-testid="payment-day-5"]')).toBeVisible()
    await expect(page.locator('[data-testid="payment-day-15"]')).toBeVisible()
    await expect(page.locator('[data-testid="payment-day-28"]')).toBeVisible()
    
    // Should not have invalid days (29-31)
    await expect(page.locator('[data-testid="payment-day-29"]')).not.toBeVisible()
    
    // Select payment day
    await page.selectOption('[data-testid="jour-paiement-select"]', '5')
    await expect(page.locator('[data-testid="payment-day-info"]'))
      .toContainText('Paiement le 5 de chaque mois')
  })
})

test.describe('Conditions Step - Variable Contract Specifics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/contrats/nouveau')
    
    // Navigate to Step 3 with variable contract
    await page.fill('[data-testid="property-search"]', 'Trocadéro')
    await page.click('[data-testid="property-option-prop_immeuble_paris_001"]')
    await page.selectOption('[data-testid="units-selector"]', 'unit_paris_trocadero_01')
    await page.click('[data-testid="wizard-next-button"]')
    
    await page.selectOption('[data-testid="type-contrat-select"]', 'variable')
    await page.fill('[data-testid="date-debut-input"]', '2025-03-01')
    await page.fill('[data-testid="date-fin-input"]', '2026-02-28')
    await page.check('[data-testid="autorisation-sous-location-checkbox"]')
    await page.fill('[data-testid="bailleur-nom-input"]', 'SCI Famille Martin')
    await page.fill('[data-testid="bailleur-email-input"]', 'contact@sci-martin.fr')
    await page.click('[data-testid="wizard-next-button"]')
  })

  test('Variable contract financial fields and calculations', async ({ page }) => {
    // Variable contracts should show different fields
    await expect(page.locator('[data-testid="estimation-revenus-mensuels-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="methode-calcul-revenus-select"]')).toBeVisible()
    
    // Fixed rent field should not be visible
    await expect(page.locator('[data-testid="loyer-mensuel-input"]')).not.toBeVisible()
    
    // Fill variable contract specifics
    await page.fill('[data-testid="estimation-revenus-mensuels-input"]', '3200')
    await page.selectOption('[data-testid="methode-calcul-revenus-select"]', 'revenus_nets')
    
    // Commission should be locked to 10%
    await expect(page.locator('[data-testid="commission-pourcentage-input"]')).toHaveValue('10')
    
    // Calculate variable commission
    const estimatedRevenue = 3200
    const expectedCommission = (estimatedRevenue * 0.10).toFixed(2)
    
    await expect(page.locator('[data-testid="variable-commission-calculation"]'))
      .toContainText(`${expectedCommission} € (estimation mensuelle)`)
  })

  test('Revenue calculation methods', async ({ page }) => {
    await page.fill('[data-testid="estimation-revenus-mensuels-input"]', '3200')
    
    // Test different calculation methods
    await page.selectOption('[data-testid="methode-calcul-revenus-select"]', 'revenus_bruts')
    await expect(page.locator('[data-testid="calculation-method-info"]'))
      .toContainText('Commission calculée sur les revenus bruts')
    
    await page.selectOption('[data-testid="methode-calcul-revenus-select"]', 'revenus_nets')
    await expect(page.locator('[data-testid="calculation-method-info"]'))
      .toContainText('Commission calculée sur les revenus nets (après charges)')
    
    await page.selectOption('[data-testid="methode-calcul-revenus-select"]', 'revenus_ajustes')
    await expect(page.locator('[data-testid="calculation-method-info"]'))
      .toContainText('Commission ajustée selon occupation réelle')
  })

  test('Variable contract additional fees', async ({ page }) => {
    // Variable contracts may have additional service fees
    await page.fill('[data-testid="frais-abonnement-internet-input"]', '45')
    await page.fill('[data-testid="frais-equipements-domotique-input"]', '25')
    
    // Should calculate total additional fees
    await expect(page.locator('[data-testid="total-additional-fees"]'))
      .toContainText('70 € par mois')
    
    // Should show impact on net revenue
    await page.fill('[data-testid="estimation-revenus-mensuels-input"]', '3200')
    const netRevenue = 3200 - 70 // Minus additional fees
    
    await expect(page.locator('[data-testid="net-revenue-after-fees"]'))
      .toContainText(`${netRevenue} €`)
  })
})

test.describe('Conditions Step - Form Validation & UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/contrats/nouveau')
    
    // Navigate to Step 3
    await page.fill('[data-testid="property-search"]', 'Villa Les Palmiers')
    await page.click('[data-testid="property-option-prop_villa_nice_001"]')
    await page.click('[data-testid="wizard-next-button"]')
    
    await page.selectOption('[data-testid="type-contrat-select"]', 'fixe')
    await page.fill('[data-testid="date-debut-input"]', '2025-03-01')
    await page.fill('[data-testid="date-fin-input"]', '2026-02-28')
    await page.check('[data-testid="autorisation-sous-location-checkbox"]')
    await page.fill('[data-testid="bailleur-nom-input"]', 'Jean Dupont')
    await page.fill('[data-testid="bailleur-email-input"]', 'jean.dupont@gmail.com')
    await page.click('[data-testid="wizard-next-button"]')
  })

  test('Required fields validation', async ({ page }) => {
    // Try to proceed without filling required fields
    await page.click('[data-testid="wizard-next-button"]')
    
    // Should show validation errors for required fields
    await expect(page.locator('[data-testid="commission-required-error"]'))
      .toContainText('Commission requise')
    
    await expect(page.locator('[data-testid="usage-proprietaire-required-error"]'))
      .toContainText('Usage propriétaire requis')
    
    await expect(page.locator('[data-testid="loyer-mensuel-required-error"]'))
      .toContainText('Loyer mensuel requis')
    
    // Form should not advance
    await expect(page.locator('[data-testid="wizard-step-3"]')).toHaveClass(/bg-\[#D4841A\]/)
  })

  test('Numeric field validation', async ({ page }) => {
    // Test invalid numeric inputs
    await page.fill('[data-testid="commission-pourcentage-input"]', 'abc')
    await page.blur('[data-testid="commission-pourcentage-input"]')
    
    await expect(page.locator('[data-testid="commission-numeric-error"]'))
      .toContainText('Valeur numérique requise')
    
    // Test negative values
    await page.fill('[data-testid="loyer-mensuel-input"]', '-100')
    await page.blur('[data-testid="loyer-mensuel-input"]')
    
    await expect(page.locator('[data-testid="loyer-positive-error"]'))
      .toContainText('Le montant doit être positif')
    
    // Test decimal precision
    await page.fill('[data-testid="loyer-mensuel-input"]', '2500.999')
    await page.blur('[data-testid="loyer-mensuel-input"]')
    
    // Should round to 2 decimal places
    await expect(page.locator('[data-testid="loyer-mensuel-input"]')).toHaveValue('2500.00')
  })

  test('Real-time field updates and dependencies', async ({ page }) => {
    // Test that changing rent updates all related calculations
    await page.fill('[data-testid="loyer-mensuel-input"]', '2000')
    await page.fill('[data-testid="commission-pourcentage-input"]', '15')
    
    // Should update commission calculation immediately
    await expect(page.locator('[data-testid="commission-calculation"]'))
      .toContainText('300.00 €')
    
    // Update rent and verify calculations update
    await page.fill('[data-testid="loyer-mensuel-input"]', '3000')
    
    await expect(page.locator('[data-testid="commission-calculation"]'))
      .toContainText('450.00 €')
    
    // Net to owner should also update
    await expect(page.locator('[data-testid="net-to-owner"]'))
      .toContainText('2550.00 €')
  })

  test('Field formatting and user experience', async ({ page }) => {
    // Test currency formatting
    const rentInput = page.locator('[data-testid="loyer-mensuel-input"]')
    await rentInput.fill('2500')
    await rentInput.blur()
    
    // Should maintain formatting
    await expect(rentInput).toHaveValue('2500.00')
    
    // Should have proper Euro symbol indicators
    await expect(page.locator('[data-testid="loyer-currency-symbol"]')).toContainText('€')
    
    // Test percentage formatting
    const commissionInput = page.locator('[data-testid="commission-pourcentage-input"]')
    await commissionInput.fill('12')
    await commissionInput.blur()
    
    await expect(page.locator('[data-testid="commission-percentage-symbol"]')).toContainText('%')
  })
})