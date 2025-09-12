/**
 * Test E2E Playwright - Contrat Variable avec Unité
 * Vérifie le workflow complet de création d'un contrat variable
 * lié à une unité spécifique dans une propriété divisée
 */

import { test, expect } from '@playwright/test'

test.describe('Contrat Variable - Unité Spécifique', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigation vers la page de création de contrat
    await page.goto('/contrats/new')
    
    // Attendre que le wizard soit chargé
    await page.waitForSelector('text=Sélection Propriété ou Unité', { timeout: 10000 })
  })

  test('Création complète contrat variable pour unité dans Immeuble de Rapport', async ({ page }) => {
    // === ÉTAPE 1: SÉLECTION UNITÉ ===
    await test.step('Sélection de l\'unité dans l\'immeuble', async () => {
      // Rechercher la propriété avec unités
      await page.fill('input[placeholder="Rechercher par nom ou adresse..."]', 'Immeuble')
      
      // Sélectionner Immeuble de Rapport
      await page.click('text=Immeuble de Rapport')
      
      // Attendre que les unités se chargent
      await page.waitForSelector('text=Unités de la Propriété', { timeout: 5000 })
      
      // Vérifier que les unités sont affichées
      await expect(page.locator('text=Appartement 2A')).toBeVisible()
      await expect(page.locator('text=Appartement 2B')).toBeVisible()
      await expect(page.locator('text=Studio RDC')).toBeVisible()
      
      // Sélectionner l'Appartement 2A
      await page.click('text=Appartement 2A')
      
      // Vérifier que l'unité est sélectionnée
      await expect(page.locator('button:has-text("Appartement 2A")')).toHaveClass(/border-\[#D4841A\]|bg-\[#D4841A\]/)
      
      // Vérifier l'alerte sur la règle métier Property XOR Unit
      await expect(page.locator('text=Un contrat doit être lié soit à une propriété')).toBeVisible()
      
      // Cliquer sur Suivant
      await page.click('button:has-text("Suivant")')
    })

    // === ÉTAPE 2: INFORMATIONS GÉNÉRALES ===
    await test.step('Remplissage des informations générales pour contrat variable', async () => {
      await page.waitForSelector('text=Informations Générales du Contrat')
      
      // Vérifier que l'unité est bien affichée dans le récapitulatif
      await expect(page.locator('text=Unité: Appartement 2A')).toBeVisible()
      
      // Sélectionner type de contrat VARIABLE
      await page.selectOption('select[name="type_contrat"]', 'variable')
      
      // Dates du contrat (contrat d'un an)
      const dateDebut = new Date()
      dateDebut.setMonth(dateDebut.getMonth() + 1) // Début dans 1 mois
      const dateFin = new Date(dateDebut)
      dateFin.setFullYear(dateFin.getFullYear() + 1)
      
      await page.fill('input[name="date_debut"]', dateDebut.toISOString().split('T')[0])
      await page.fill('input[name="date_fin"]', dateFin.toISOString().split('T')[0])
      
      // Meublé
      await page.check('input[name="meuble"]')
      
      // Autorisation sous-location (OBLIGATOIRE pour Want It Now)
      await page.check('input[name="autorisation_sous_location"]')
      
      // Besoin rénovation
      await page.uncheck('input[name="besoin_renovation"]')
      
      // Informations bailleur (personne morale)
      await page.fill('input[name="bailleur_nom"]', 'SCI Immobilière Marseille')
      await page.fill('input[name="bailleur_siret"]', '12345678901234')
      await page.fill('input[name="bailleur_email"]', 'contact@sci-marseille.fr')
      await page.fill('input[name="bailleur_telephone"]', '0491123456')
      await page.fill('input[name="bailleur_adresse"]', '100 Boulevard Victor Hugo, 13000 Marseille')
      
      // Représentant légal
      await page.fill('input[name="representant_nom"]', 'Dubois')
      await page.fill('input[name="representant_prenom"]', 'Jean-Pierre')
      await page.fill('input[name="representant_qualite"]', 'Gérant')
      
      await page.click('button:has-text("Suivant")')
    })

    // === ÉTAPE 3: CONDITIONS FINANCIÈRES ===
    await test.step('Configuration spécifique contrat variable avec commission 10%', async () => {
      await page.waitForSelector('text=Conditions Financières')
      
      // Commission Want It Now - STRICTEMENT 10% pour contrat variable
      await page.fill('input[name="commission_pourcentage"]', '10')
      
      // Vérifier que la commission est verrouillée à 10% pour contrat variable
      const commissionField = page.locator('input[name="commission_pourcentage"]')
      await expect(commissionField).toHaveValue('10')
      
      // Usage propriétaire (test avec limite maximale)
      await page.fill('input[name="usage_proprietaire_jours_max"]', '60')
      
      // Estimation revenus mensuels (plus élevés pour un appartement)
      await page.fill('input[name="estimation_revenus_mensuels"]', '2500')
      
      // Méthode calcul revenus (bruts pour contrat variable)
      await page.selectOption('select[name="methode_calcul_revenus"]', 'revenus_bruts')
      
      // Seuil rentabilité minimum
      await page.fill('input[name="seuil_rentabilite_min"]', '2000')
      
      // Charges mensuelles
      await page.fill('input[name="charges_mensuelles"]', '200')
      
      // Provisions pour charges
      await page.check('input[name="provisions_charges"]')
      await page.fill('input[name="montant_provisions"]', '200')
      
      // Dépôt de garantie (2 mois pour contrat variable)
      await page.fill('input[name="depot_garantie"]', '5000')
      
      // Jour de paiement
      await page.fill('input[name="jour_paiement_loyer"]', '1')
      
      // Méthode de paiement
      await page.selectOption('select[name="methode_paiement"]', 'prelevement')
      
      // IBAN pour prélèvement
      await page.fill('input[name="iban_prelevement"]', 'FR7612345678901234567890123')
      
      await page.click('button:has-text("Suivant")')
    })

    // === ÉTAPE 4: ASSURANCES & PROTECTION ===
    await test.step('Configuration assurances pour location meublée', async () => {
      await page.waitForSelector('text=Assurances & Protection')
      
      // Assurance habitation locataire (obligatoire)
      await page.check('input[name="assurance_habitation_locataire"]')
      await page.fill('input[name="numero_police_assurance"]', 'MMA-2024-789456')
      await page.fill('input[name="compagnie_assurance"]', 'MMA Assurances')
      await page.fill('input[name="montant_couverture"]', '500000')
      
      // Garantie loyers impayés (GLI)
      await page.check('input[name="garantie_loyers_impayes"]')
      await page.selectOption('select[name="type_garantie"]', 'gli_privee')
      await page.fill('input[name="compagnie_gli"]', 'Garantme')
      await page.fill('input[name="taux_gli"]', '2.5')
      
      // Caution solidaire
      await page.check('input[name="caution_solidaire"]')
      await page.fill('input[name="caution_nom"]', 'Dupont')
      await page.fill('input[name="caution_prenom"]', 'Michel')
      await page.fill('input[name="caution_revenus"]', '5000')
      
      // Protection juridique
      await page.check('input[name="protection_juridique"]')
      await page.fill('input[name="franchise_protection"]', '200')
      await page.fill('input[name="plafond_protection"]', '10000')
      
      // Assurance propriétaire non occupant
      await page.check('input[name="assurance_pno"]')
      await page.fill('input[name="numero_pno"]', 'PNO-2024-456789')
      
      await page.click('button:has-text("Suivant")')
    })

    // === ÉTAPE 5: CLAUSES & RÈGLES MÉTIER ===
    await test.step('Validation stricte des règles métier Want It Now', async () => {
      await page.waitForSelector('text=Clauses & Règles Métier')
      
      // === VALIDATION RÈGLE 1: Autorisation sous-location obligatoire ===
      const sousLocationCheckbox = page.locator('input[name="autorisation_sous_location"]')
      await expect(sousLocationCheckbox).toBeChecked()
      await expect(sousLocationCheckbox).toBeDisabled()
      await expect(page.locator('text=✓ Autorisation sous-location (obligatoire Want It Now)')).toBeVisible()
      
      // === VALIDATION RÈGLE 2: Commission 10% pour contrat variable ===
      await expect(page.locator('text=Commission fixée à 10% (contrat variable)')).toBeVisible()
      const commissionDisplay = page.locator('[data-testid="commission-display"]')
      await expect(commissionDisplay).toContainText('10%')
      
      // === VALIDATION RÈGLE 3: Usage propriétaire max 60 jours ===
      const usageDisplay = page.locator('[data-testid="usage-proprietaire-display"]')
      await expect(usageDisplay).toContainText('60 jours')
      await expect(page.locator('text=✓ Usage propriétaire dans la limite autorisée')).toBeVisible()
      
      // === VALIDATION RÈGLE 4: Property XOR Unit ===
      await expect(page.locator('text=Contrat lié à: Unité - Appartement 2A')).toBeVisible()
      await expect(page.locator('text=Propriété parente: Immeuble de Rapport')).toBeVisible()
      
      // Clauses spécifiques contrat variable
      await page.fill('textarea[name="clauses_particulieres"]', 
        'Contrat variable Want It Now avec commission fixe 10%. ' +
        'Unité Appartement 2A dans Immeuble de Rapport. ' +
        'Revenus estimés 2500€/mois bruts. ' +
        'Usage propriétaire maximum 60 jours/an. ' +
        'Sous-location autorisée via plateforme Want It Now exclusivement.'
      )
      
      // Modalités de révision (contrat variable)
      await page.fill('textarea[name="modalites_revision"]', 
        'Révision annuelle basée sur les revenus réels générés. ' +
        'Ajustement possible du seuil de rentabilité après 6 mois.'
      )
      
      // Conditions résiliation
      await page.fill('textarea[name="conditions_resiliation"]', 
        'Préavis 3 mois bailleur, 1 mois locataire. ' +
        'Résiliation anticipée possible si revenus < seuil pendant 3 mois consécutifs.'
      )
      
      // Obligations spécifiques
      await page.check('input[name="entretien_regulier"]')
      await page.check('input[name="respect_reglement_copropriete"]')
      await page.check('input[name="declaration_sinistres"]')
      
      await page.click('button:has-text("Suivant")')
    })

    // === ÉTAPE 6: RÉVISION & FINALISATION ===
    await test.step('Révision complète et validation finale', async () => {
      await page.waitForSelector('text=Révision & Finalisation')
      
      // === Vérification du récapitulatif complet ===
      
      // Type et lieu
      await expect(page.locator('text=Type de contrat: Variable')).toBeVisible()
      await expect(page.locator('text=Unité: Appartement 2A')).toBeVisible()
      await expect(page.locator('text=Propriété: Immeuble de Rapport')).toBeVisible()
      
      // Dates
      await expect(page.locator('text=Durée: 12 mois')).toBeVisible()
      
      // Conditions financières
      await expect(page.locator('text=Commission Want It Now: 10%')).toBeVisible()
      await expect(page.locator('text=Revenus estimés: 2500€/mois')).toBeVisible()
      await expect(page.locator('text=Seuil rentabilité: 2000€')).toBeVisible()
      await expect(page.locator('text=Dépôt garantie: 5000€')).toBeVisible()
      
      // Règles métier critiques
      await expect(page.locator('text=✓ Autorisation sous-location: OUI (obligatoire)')).toBeVisible()
      await expect(page.locator('text=✓ Commission 10%: CONFORME')).toBeVisible()
      await expect(page.locator('text=✓ Usage propriétaire: 60 jours (limite max)')).toBeVisible()
      await expect(page.locator('text=✓ Property XOR Unit: VALIDE (unité seulement)')).toBeVisible()
      
      // Assurances
      await expect(page.locator('text=Assurance habitation: MMA-2024-789456')).toBeVisible()
      await expect(page.locator('text=GLI: Garantme (2.5%)')).toBeVisible()
      await expect(page.locator('text=Caution: Michel Dupont')).toBeVisible()
      
      // Télécharger le brouillon PDF (optionnel)
      const downloadButton = page.locator('button:has-text("Télécharger brouillon PDF")')
      if (await downloadButton.isVisible()) {
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          downloadButton.click()
        ])
        expect(download.suggestedFilename()).toContain('contrat-variable')
      }
      
      // Accepter les conditions générales
      await page.check('input[name="acceptation_conditions"]')
      await expect(page.locator('input[name="acceptation_conditions"]')).toBeChecked()
      
      // Accepter les règles métier Want It Now
      await page.check('input[name="acceptation_regles_metier"]')
      await expect(page.locator('input[name="acceptation_regles_metier"]')).toBeChecked()
      
      // Signature électronique
      const signatureCanvas = page.locator('canvas[data-testid="signature-canvas"]')
      if (await signatureCanvas.isVisible()) {
        // Simuler une signature
        await signatureCanvas.click({ position: { x: 50, y: 50 } })
        await page.mouse.down()
        await page.mouse.move(150, 50)
        await page.mouse.move(150, 100)
        await page.mouse.move(50, 100)
        await page.mouse.up()
      }
      
      // Soumettre le contrat
      await page.click('button:has-text("Créer le contrat")')
      
      // Attendre la création et redirection
      await page.waitForLoadState('networkidle')
      
      // Vérifier la redirection vers le contrat créé
      await expect(page).toHaveURL(/\/contrats\/[a-f0-9-]+/, { timeout: 10000 })
      
      // Vérifier le message de succès
      await expect(page.locator('text=Contrat variable créé avec succès')).toBeVisible()
      
      // Vérifier que le contrat apparaît avec le bon statut
      await expect(page.locator('text=Statut: Actif')).toBeVisible()
      await expect(page.locator('text=Commission: 10%')).toBeVisible()
    })
  })

  test('Validation exclusive Property XOR Unit', async ({ page }) => {
    await test.step('Vérifier qu\'on ne peut pas sélectionner propriété ET unité', async () => {
      // Sélectionner d'abord une propriété avec unités
      await page.click('text=Immeuble de Rapport')
      
      // Attendre le chargement des unités
      await page.waitForSelector('text=Appartement 2A')
      
      // Sélectionner une unité
      await page.click('text=Appartement 2A')
      
      // Vérifier que la propriété est automatiquement désélectionnée
      const propertyButton = page.locator('button:has-text("Immeuble de Rapport")')
      await expect(propertyButton).not.toHaveClass(/border-\[#D4841A\]|bg-\[#D4841A\]/)
      
      // Vérifier que seule l'unité est sélectionnée
      const unitButton = page.locator('button:has-text("Appartement 2A")')
      await expect(unitButton).toHaveClass(/border-\[#D4841A\]|bg-\[#D4841A\]/)
      
      // Le bouton Suivant doit être activé (une seule sélection)
      await expect(page.locator('button:has-text("Suivant")')).not.toBeDisabled()
    })
  })

  test('Test limite usage propriétaire 60 jours', async ({ page }) => {
    await test.step('Vérifier le rejet si > 60 jours', async () => {
      // Sélection rapide
      await page.click('text=Immeuble de Rapport')
      await page.click('text=Appartement 2B')
      await page.click('button:has-text("Suivant")')
      
      // Informations minimales
      await page.selectOption('select[name="type_contrat"]', 'variable')
      await page.fill('input[name="date_debut"]', new Date().toISOString().split('T')[0])
      const dateFin = new Date()
      dateFin.setFullYear(dateFin.getFullYear() + 1)
      await page.fill('input[name="date_fin"]', dateFin.toISOString().split('T')[0])
      await page.check('input[name="autorisation_sous_location"]')
      await page.fill('input[name="bailleur_nom"]', 'Test')
      await page.click('button:has-text("Suivant")')
      
      // Tester limite usage propriétaire
      await page.fill('input[name="commission_pourcentage"]', '10')
      
      // Essayer de mettre 61 jours (au-dessus de la limite)
      await page.fill('input[name="usage_proprietaire_jours_max"]', '61')
      
      // Essayer de continuer
      await page.click('button:has-text("Suivant")')
      
      // Vérifier le message d'erreur
      await expect(page.locator('text=L\'usage propriétaire ne peut pas dépasser 60 jours par an')).toBeVisible()
      
      // Corriger à 60 jours
      await page.fill('input[name="usage_proprietaire_jours_max"]', '60')
      
      // Vérifier qu'on peut maintenant continuer
      await page.click('button:has-text("Suivant")')
      await expect(page.locator('text=Assurances & Protection')).toBeVisible()
    })
  })
})