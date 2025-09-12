import { test, expect, Page } from '@playwright/test'

test.describe('Création Contrat E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Naviguer vers la page de connexion et s'authentifier
    await page.goto('/auth/login')
    
    // Attendre que la page soit chargée
    await page.waitForLoadState('networkidle')
    
    // Saisir les identifiants (utilise les variables d'environnement ou valeurs par défaut)
    await page.fill('[data-testid="email"]', process.env.TEST_USER_EMAIL || 'admin@want-it-now.fr')
    await page.fill('[data-testid="password"]', process.env.TEST_USER_PASSWORD || 'admin123')
    
    // Cliquer sur le bouton de connexion
    await page.click('[data-testid="login-button"]')
    
    // Attendre la redirection vers le dashboard
    await page.waitForURL('**/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('Création complète contrat avec première propriété disponible', async ({ page }) => {
    console.log('🚀 Début du test création contrat')
    
    // Étape 1: Navigation vers création contrat
    await page.goto('/contrats/new')
    await page.waitForLoadState('networkidle')
    
    console.log('📍 Navigation vers /contrats/new réussie')
    
    // Vérifier que nous sommes sur la page de création contrat
    await expect(page.locator('h1, h2, [data-testid="contrat-wizard-title"]')).toContainText(/Création.*Contrat|Nouveau.*Contrat/i)
    
    // Attendre que le wizard soit chargé
    await page.waitForSelector('[data-testid="wizard-step-1"], [data-testid="property-selector"], .step-1, [data-testid="selection-step"]', {
      timeout: 10000
    })
    
    console.log('🧙‍♂️ Wizard chargé, début Étape 1')
    
    // ===== ÉTAPE 1: SÉLECTION PROPRIÉTÉ =====
    
    // Attendre et sélectionner la première propriété disponible
    const proprieteSelector = page.locator('[data-testid="propriete-selector"], [data-testid="property-select"], select[name="propriete_id"], .property-selector').first()
    await proprieteSelector.waitFor({ timeout: 15000 })
    
    // Obtenir les options disponibles
    const options = await proprieteSelector.locator('option').allTextContents()
    console.log('🏠 Propriétés disponibles:', options.filter(opt => opt.trim() !== '' && !opt.includes('Sélectionner')))
    
    // Sélectionner la première propriété (skip la première option qui est généralement "Sélectionner...")
    const firstPropertyOption = await proprieteSelector.locator('option').nth(1)
    const firstPropertyValue = await firstPropertyOption.getAttribute('value')
    
    if (firstPropertyValue && firstPropertyValue.trim() !== '') {
      await proprieteSelector.selectOption(firstPropertyValue)
      console.log('✅ Propriété sélectionnée:', firstPropertyValue)
      
      // Attendre que les propriétaires se chargent
      await page.waitForTimeout(2000) // Laisser le temps au système de charger les propriétaires
      
      // Vérifier que les propriétaires se chargent automatiquement
      await expect(page.locator('[data-testid="proprietaires-loading"], .loading-proprietaires')).toBeHidden({ timeout: 10000 })
      
      const proprietairesCount = await page.locator('[data-testid="proprietaire-item"], .proprietaire-item').count()
      console.log('👥 Propriétaires chargés:', proprietairesCount)
      
      expect(proprietairesCount).toBeGreaterThan(0)
    } else {
      throw new Error('❌ Aucune propriété disponible pour le test')
    }
    
    // Passer à l'étape suivante
    await page.click('[data-testid="next-button"], .next-step, button:has-text("Suivant")')
    
    console.log('➡️ Passage à l\'étape 2')
    
    // ===== ÉTAPE 2: INFORMATIONS GÉNÉRALES =====
    
    // Attendre que l'étape 2 soit chargée
    await page.waitForSelector('[data-testid="wizard-step-2"], [data-testid="informations-step"], .step-2', { timeout: 10000 })
    
    // Vérifier que l'erreur "uncontrolled to controlled" n'apparaît PAS dans la console
    const consoleErrors: string[] = []
    page.on('console', message => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text())
      }
    })
    
    // Sélectionner le type de contrat
    const typeContratSelector = page.locator('[data-testid="type-contrat-select"], select[name="type_contrat"], [data-testid="contract-type-select"]')
    if (await typeContratSelector.count() > 0) {
      await typeContratSelector.selectOption('fixe')
      console.log('📄 Type contrat: Fixe sélectionné')
    }
    
    // Remplir les dates (c'est ici que l'erreur "uncontrolled to controlled" se manifesterait)
    const today = new Date()
    const startDate = today.toISOString().split('T')[0] // Format YYYY-MM-DD
    const endDate = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // +1 an
    
    await page.fill('[data-testid="date-debut"], input[name="date_debut"], input[type="date"]:first', startDate)
    console.log('📅 Date début remplie:', startDate)
    
    await page.fill('[data-testid="date-fin"], input[name="date_fin"], input[type="date"]:last', endDate)
    console.log('📅 Date fin remplie:', endDate)
    
    // Vérifier l'autorisation sous-location (doit être activée par défaut - règle business)
    const sousLocationToggle = page.locator('[data-testid="autorisation-sous-location"], input[name="autorisation_sous_location"], .sous-location-toggle')
    if (await sousLocationToggle.count() > 0) {
      const isChecked = await sousLocationToggle.isChecked()
      if (!isChecked) {
        await sousLocationToggle.check()
      }
      console.log('✅ Autorisation sous-location activée (règle business)')
    }
    
    // Passer à l'étape suivante
    await page.click('[data-testid="next-button"], .next-step, button:has-text("Suivant")')
    console.log('➡️ Passage à l\'étape 3')
    
    // ===== ÉTAPE 3: CONDITIONS FINANCIÈRES =====
    
    await page.waitForSelector('[data-testid="wizard-step-3"], [data-testid="conditions-step"], .step-3', { timeout: 10000 })
    
    // Remplir les conditions financières obligatoires
    await page.fill('[data-testid="commission-pourcentage"], input[name="commission_pourcentage"]', '10')
    console.log('💰 Commission: 10% remplie')
    
    await page.fill('[data-testid="usage-proprietaire-jours"], input[name="usage_proprietaire_jours_max"]', '60')
    console.log('📆 Usage propriétaire: 60 jours max rempli')
    
    // Si contrat fixe, remplir le loyer mensuel
    const loyerMensuelInput = page.locator('[data-testid="loyer-mensuel"], input[name="loyer_mensuel_ht"]')
    if (await loyerMensuelInput.count() > 0 && await loyerMensuelInput.isVisible()) {
      await loyerMensuelInput.fill('1200')
      console.log('🏠 Loyer mensuel: 1200€ rempli')
    }
    
    // Passer à l'étape suivante
    await page.click('[data-testid="next-button"], .next-step, button:has-text("Suivant")')
    console.log('➡️ Passage à l\'étape 4')
    
    // ===== ÉTAPE 4: ASSURANCES (Simplifiée pour le test) =====
    
    await page.waitForSelector('[data-testid="wizard-step-4"], [data-testid="assurances-step"], .step-4', { timeout: 10000 })
    
    // Activer l'attestation d'assurance
    const attestationToggle = page.locator('[data-testid="attestation-assurance"], input[name="attestation_assurance"]')
    if (await attestationToggle.count() > 0) {
      await attestationToggle.check()
      console.log('🛡️ Attestation assurance activée')
    }
    
    // Passer à l'étape suivante
    await page.click('[data-testid="next-button"], .next-step, button:has-text("Suivant")')
    console.log('➡️ Passage à l\'étape 5')
    
    // ===== ÉTAPE 5: CLAUSES (Simplifiée) =====
    
    await page.waitForSelector('[data-testid="wizard-step-5"], [data-testid="clauses-step"], .step-5', { timeout: 10000 })
    
    // Remplir les champs obligatoires de contact d'urgence
    await page.fill('[data-testid="contact-urgence-nom"], input[name="contact_urgence_nom"]', 'Contact Test')
    await page.fill('[data-testid="contact-urgence-telephone"], input[name="contact_urgence_telephone"]', '0123456789')
    console.log('📞 Contact urgence rempli')
    
    // Passer à l'étape finale
    await page.click('[data-testid="next-button"], .next-step, button:has-text("Suivant")')
    console.log('➡️ Passage à l\'étape finale')
    
    // ===== ÉTAPE 6: RÉVISION ET SAUVEGARDE =====
    
    await page.waitForSelector('[data-testid="wizard-step-6"], [data-testid="revision-step"], .step-6', { timeout: 10000 })
    
    // Vérifier qu'aucune erreur console "uncontrolled to controlled" n'est apparue
    const uncontrolledErrors = consoleErrors.filter(error => 
      error.includes('uncontrolled') && error.includes('controlled')
    )
    
    if (uncontrolledErrors.length > 0) {
      console.error('❌ Erreurs uncontrolled to controlled détectées:', uncontrolledErrors)
      throw new Error('Erreurs uncontrolled to controlled détectées: ' + uncontrolledErrors.join('; '))
    } else {
      console.log('✅ Aucune erreur uncontrolled to controlled détectée')
    }
    
    // Sauvegarder le contrat
    const saveButton = page.locator('[data-testid="save-contrat"], [data-testid="save-button"], button:has-text("Sauvegarder")')
    await saveButton.click()
    console.log('💾 Bouton sauvegarder cliqué')
    
    // Attendre la confirmation de sauvegarde
    await expect(page.locator('[data-testid="success-message"], .success, .toast')).toBeVisible({ timeout: 15000 })
    console.log('✅ Message de succès affiché')
    
    // Vérifier la redirection (vers liste des contrats ou détail)
    await page.waitForURL('**/contrats**', { timeout: 10000 })
    console.log('🔄 Redirection vers liste contrats réussie')
    
    // Vérifier que le contrat apparaît dans la liste
    await page.waitForSelector('[data-testid="contrats-list"], [data-testid="contrat-item"], .contrats-table', { timeout: 10000 })
    
    const contratsCount = await page.locator('[data-testid="contrat-item"], tr[data-testid*="contrat"], .contrat-row').count()
    expect(contratsCount).toBeGreaterThan(0)
    
    console.log('🎉 Test création contrat réussi! Contrats visibles:', contratsCount)
    
    // Test final: Vérifier qu'il n'y a pas eu d'erreurs critiques
    expect(uncontrolledErrors).toHaveLength(0)
  })
  
  test('Validation des erreurs - formulaire incomplet', async ({ page }) => {
    console.log('🧪 Test validation erreurs')
    
    // Naviguer vers création contrat
    await page.goto('/contrats/new')
    await page.waitForLoadState('networkidle')
    
    // Essayer de passer à l'étape suivante sans sélectionner de propriété
    const nextButton = page.locator('[data-testid="next-button"], .next-step, button:has-text("Suivant")')
    
    if (await nextButton.count() > 0) {
      await nextButton.click()
      
      // Vérifier qu'une erreur de validation apparaît
      await expect(page.locator('[data-testid="error-message"], .error, .form-error')).toBeVisible({ timeout: 5000 })
      console.log('✅ Validation erreur propriété manquante fonctionne')
    }
  })
})