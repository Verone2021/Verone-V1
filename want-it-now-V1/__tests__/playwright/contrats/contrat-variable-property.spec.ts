/**
 * Test E2E Playwright - Contrat Variable avec Propriété Principale
 * Vérifie le workflow complet de création d'un contrat variable
 * lié directement à une propriété (sans unités)
 */

import { test, expect } from '@playwright/test'

test.describe('Contrat Variable - Propriété Principale', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigation vers la page de création de contrat
    await page.goto('/contrats/new')
    
    // Attendre que le wizard soit chargé
    await page.waitForSelector('text=Sélection Propriété ou Unité', { timeout: 10000 })
  })

  test('Création complète contrat variable pour Studio Étudiant', async ({ page }) => {
    // === ÉTAPE 1: SÉLECTION PROPRIÉTÉ ===
    await test.step('Sélection de la propriété Studio Étudiant', async () => {
      // Rechercher la propriété
      await page.fill('input[placeholder="Rechercher par nom ou adresse..."]', 'Studio')
      
      // Sélectionner Studio Étudiant
      await page.click('text=Studio Étudiant')
      
      // Vérifier que la propriété est sélectionnée (bouton doit avoir une bordure ou un style actif)
      await expect(page.locator('button:has-text("Studio Étudiant")')).toHaveClass(/border-\[#D4841A\]|bg-\[#D4841A\]/)
      
      // Vérifier qu'aucune unité n'est affichée (propriété sans unités)
      await expect(page.locator('text=Aucune unité disponible')).toBeVisible()
      
      // Cliquer sur Suivant
      await page.click('button:has-text("Suivant")')
    })

    // === ÉTAPE 2: INFORMATIONS GÉNÉRALES ===
    await test.step('Remplissage des informations générales', async () => {
      await page.waitForSelector('text=Informations Générales du Contrat')
      
      // Sélectionner type de contrat VARIABLE
      await page.selectOption('select[name="type_contrat"]', 'variable')
      
      // Dates du contrat
      const dateDebut = new Date()
      const dateFin = new Date()
      dateFin.setFullYear(dateFin.getFullYear() + 1)
      
      await page.fill('input[name="date_debut"]', dateDebut.toISOString().split('T')[0])
      await page.fill('input[name="date_fin"]', dateFin.toISOString().split('T')[0])
      
      // Meublé
      await page.check('input[name="meuble"]')
      
      // Autorisation sous-location (OBLIGATOIRE pour Want It Now)
      await page.check('input[name="autorisation_sous_location"]')
      
      // Besoin rénovation
      await page.uncheck('input[name="besoin_renovation"]')
      
      // Informations bailleur
      await page.fill('input[name="bailleur_nom"]', 'Martin')
      await page.fill('input[name="bailleur_prenom"]', 'Sophie')
      await page.fill('input[name="bailleur_email"]', 'sophie.martin@example.com')
      await page.fill('input[name="bailleur_telephone"]', '0612345678')
      
      await page.click('button:has-text("Suivant")')
    })

    // === ÉTAPE 3: CONDITIONS FINANCIÈRES ===
    await test.step('Configuration des conditions financières pour contrat variable', async () => {
      await page.waitForSelector('text=Conditions Financières')
      
      // Commission Want It Now - DOIT ÊTRE 10% pour contrat variable
      await page.fill('input[name="commission_pourcentage"]', '10')
      
      // Usage propriétaire (max 60 jours)
      await page.fill('input[name="usage_proprietaire_jours_max"]', '30')
      
      // Estimation revenus mensuels (pour contrat variable)
      await page.fill('input[name="estimation_revenus_mensuels"]', '1800')
      
      // Méthode calcul revenus
      await page.selectOption('select[name="methode_calcul_revenus"]', 'revenus_nets')
      
      // Charges mensuelles
      await page.fill('input[name="charges_mensuelles"]', '150')
      
      // Dépôt de garantie
      await page.fill('input[name="depot_garantie"]', '1800')
      
      // Jour de paiement
      await page.fill('input[name="jour_paiement_loyer"]', '5')
      
      // Méthode de paiement
      await page.selectOption('select[name="methode_paiement"]', 'virement')
      
      await page.click('button:has-text("Suivant")')
    })

    // === ÉTAPE 4: ASSURANCES & PROTECTION ===
    await test.step('Configuration des assurances', async () => {
      await page.waitForSelector('text=Assurances & Protection')
      
      // Assurance habitation locataire
      await page.check('input[name="assurance_habitation_locataire"]')
      await page.fill('input[name="numero_police_assurance"]', 'AH-2024-12345')
      await page.fill('input[name="compagnie_assurance"]', 'AXA France')
      
      // Garantie loyers impayés
      await page.check('input[name="garantie_loyers_impayes"]')
      await page.selectOption('select[name="type_garantie"]', 'visale')
      
      // Protection juridique
      await page.check('input[name="protection_juridique"]')
      await page.fill('input[name="franchise_protection"]', '150')
      
      await page.click('button:has-text("Suivant")')
    })

    // === ÉTAPE 5: CLAUSES & RÈGLES MÉTIER ===
    await test.step('Validation des règles métier Want It Now', async () => {
      await page.waitForSelector('text=Clauses & Règles Métier')
      
      // Vérifier que les règles métier sont pré-cochées et verrouillées
      const sousLocationCheckbox = page.locator('input[name="autorisation_sous_location"]')
      await expect(sousLocationCheckbox).toBeChecked()
      await expect(sousLocationCheckbox).toBeDisabled() // Doit être verrouillé pour Want It Now
      
      // Vérifier commission 10% pour contrat variable
      const commissionInput = page.locator('input[name="commission_pourcentage"][value="10"]')
      await expect(commissionInput).toBeVisible()
      await expect(commissionInput).toBeDisabled() // Verrouillé à 10% pour variable
      
      // Vérifier limite usage propriétaire
      const usageProprietaire = await page.inputValue('input[name="usage_proprietaire_jours_max"]')
      expect(parseInt(usageProprietaire)).toBeLessThanOrEqual(60)
      
      // Clauses additionnelles
      await page.fill('textarea[name="clauses_particulieres"]', 
        'Contrat variable avec commission 10% Want It Now. ' +
        'Revenus nets estimés à 1800€/mois. ' +
        'Usage propriétaire limité à 30 jours par an.'
      )
      
      // Conditions résiliation
      await page.fill('textarea[name="conditions_resiliation"]', 
        'Préavis de 3 mois pour le bailleur, 1 mois pour le locataire.'
      )
      
      await page.click('button:has-text("Suivant")')
    })

    // === ÉTAPE 6: RÉVISION & FINALISATION ===
    await test.step('Révision finale et soumission', async () => {
      await page.waitForSelector('text=Révision & Finalisation')
      
      // Vérifier le récapitulatif
      await expect(page.locator('text=Type de contrat: Variable')).toBeVisible()
      await expect(page.locator('text=Propriété: Studio Étudiant')).toBeVisible()
      await expect(page.locator('text=Commission: 10%')).toBeVisible()
      await expect(page.locator('text=Usage propriétaire: 30 jours')).toBeVisible()
      await expect(page.locator('text=Autorisation sous-location: Oui')).toBeVisible()
      
      // Accepter les conditions
      await page.check('input[name="acceptation_conditions"]')
      
      // Soumettre le contrat
      await page.click('button:has-text("Créer le contrat")')
      
      // Attendre la redirection ou le message de succès
      await expect(page).toHaveURL(/\/contrats\/[a-f0-9-]+/, { timeout: 10000 })
      
      // Vérifier le message de succès
      await expect(page.locator('text=Contrat créé avec succès')).toBeVisible()
    })
  })

  test('Validation règles métier - Commission 10% obligatoire', async ({ page }) => {
    await test.step('Tentative de création avec commission incorrecte', async () => {
      // Sélectionner une propriété
      await page.click('text=Studio Étudiant')
      await page.click('button:has-text("Suivant")')
      
      // Remplir informations générales avec type variable
      await page.selectOption('select[name="type_contrat"]', 'variable')
      await page.fill('input[name="date_debut"]', new Date().toISOString().split('T')[0])
      const dateFin = new Date()
      dateFin.setFullYear(dateFin.getFullYear() + 1)
      await page.fill('input[name="date_fin"]', dateFin.toISOString().split('T')[0])
      await page.check('input[name="autorisation_sous_location"]')
      await page.fill('input[name="bailleur_nom"]', 'Test')
      await page.fill('input[name="bailleur_prenom"]', 'User')
      await page.click('button:has-text("Suivant")')
      
      // Essayer de mettre une commission différente de 10%
      await page.fill('input[name="commission_pourcentage"]', '15')
      await page.fill('input[name="usage_proprietaire_jours_max"]', '30')
      
      // Essayer de passer à l'étape suivante
      await page.click('button:has-text("Suivant")')
      
      // Vérifier le message d'erreur
      await expect(page.locator('text=La commission pour les contrats variables doit être de 10%')).toBeVisible()
      
      // Corriger la commission
      await page.fill('input[name="commission_pourcentage"]', '10')
      await page.click('button:has-text("Suivant")')
      
      // Vérifier qu'on peut maintenant passer à l'étape suivante
      await expect(page.locator('text=Assurances & Protection')).toBeVisible()
    })
  })

  test('Auto-save du brouillon', async ({ page }) => {
    await test.step('Vérification sauvegarde automatique', async () => {
      // Sélectionner une propriété
      await page.click('text=Studio Étudiant')
      await page.click('button:has-text("Suivant")')
      
      // Remplir quelques informations
      await page.selectOption('select[name="type_contrat"]', 'variable')
      await page.fill('input[name="bailleur_nom"]', 'Dupont')
      
      // Attendre la sauvegarde automatique (30 secondes normalement, mais on peut déclencher manuellement)
      await page.click('button:has-text("Sauvegarder brouillon")')
      
      // Vérifier le message de confirmation
      await expect(page.locator('text=Brouillon sauvegardé')).toBeVisible()
      
      // Rafraîchir la page
      await page.reload()
      
      // Vérifier qu'on peut charger le brouillon
      await expect(page.locator('text=Charger un brouillon')).toBeVisible()
    })
  })
})