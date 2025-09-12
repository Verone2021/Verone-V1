import { test, expect } from '@playwright/test'

/**
 * Tests de validation cohérence parfaite données saisies ↔ affichage
 * 
 * OBJECTIF CRITIQUE: Vérifier que tous les éléments saisis sont visibles
 * dans les détails propriété/unité (exemple spécifique: pays "France")
 */
test.describe('Validation Cohérence Données Saisies ↔ Affichage', () => {
  
  test.describe('Propriété - Cohérence Complète', () => {
    
    test('CRITIQUE - Propriété avec pays "France" doit afficher France dans détails', async ({ page }) => {
      await page.goto('http://localhost:3000/proprietes')
      
      // Navigation vers création propriété
      await page.click('[data-testid="create-property-button"]')
      
      // Remplir TOUS les champs propriété
      const proprieteData = {
        nom: 'Villa Les Palmiers - Test France',
        type: 'villa',
        adresse: '123 Avenue des Palmiers',
        code_postal: '06400',
        ville: 'Cannes',
        pays: 'FR', // CRITIQUE - DOIT apparaître comme "France"
        superficie_m2: '250',
        nb_pieces: '6',
        description: 'Magnifique villa avec vue mer, idéale pour location saisonnière'
      }
      
      await page.fill('[data-testid="property-name-input"]', proprieteData.nom)
      await page.selectOption('[data-testid="property-type-select"]', proprieteData.type)
      await page.fill('[data-testid="property-address-input"]', proprieteData.adresse)
      await page.fill('[data-testid="property-postal-code"]', proprieteData.code_postal)
      await page.fill('[data-testid="property-city"]', proprieteData.ville)
      await page.selectOption('[data-testid="property-country"]', proprieteData.pays)
      await page.fill('[data-testid="property-surface"]', proprieteData.superficie_m2)
      await page.fill('[data-testid="property-rooms"]', proprieteData.nb_pieces)
      await page.fill('[data-testid="property-description"]', proprieteData.description)
      
      // Validation en temps réel
      await expect(page.locator('[data-testid="country-display"]')).toContainText('France')
      
      // Création
      await page.click('[data-testid="create-property-submit"]')
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      
      // Navigation vers page détail
      await page.waitForURL('**/proprietes/**')
      const currentUrl = page.url()
      const propertyId = currentUrl.split('/').pop()
      
      // VALIDATION CRITIQUE - Tous champs doivent être visibles
      
      // 1. Titre/nom propriété
      await expect(page.locator('h1')).toContainText(proprieteData.nom)
      
      // 2. Type propriété (badge)
      await expect(page.locator('[data-testid="property-type-badge"]')).toContainText('Villa')
      
      // 3. Adresse complète AVEC pays = France
      await expect(page.locator('[data-testid="property-full-address"]')).toContainText(proprieteData.adresse)
      await expect(page.locator('[data-testid="property-full-address"]')).toContainText(proprieteData.code_postal)
      await expect(page.locator('[data-testid="property-full-address"]')).toContainText(proprieteData.ville)
      await expect(page.locator('[data-testid="property-full-address"]')).toContainText('France') // CRITIQUE
      
      // 4. Spécifications techniques
      await expect(page.locator('[data-testid="property-surface-display"]')).toContainText('250 m²')
      await expect(page.locator('[data-testid="property-rooms-display"]')).toContainText('6 pièces')
      
      // 5. Description complète
      await expect(page.locator('[data-testid="property-description-display"]')).toContainText(proprieteData.description)
      
      // Screenshot pour documentation
      await page.screenshot({ 
        path: '.playwright-mcp/property-france-validation-complete.png',
        fullPage: true 
      })
      
      console.log('✅ VALIDATION CRITIQUE RÉUSSIE: Pays "France" affiché correctement')
    })
    
    test('Propriété - Validation exhaustive tous champs optionnels', async ({ page }) => {
      await page.goto('http://localhost:3000/proprietes')
      await page.click('[data-testid="create-property-button"]')
      
      // Données avec TOUS les champs possibles
      const fullData = {
        nom: 'Propriété Test Complète',
        type: 'appartement',
        adresse: '456 Rue de la République',
        code_postal: '75001',
        ville: 'Paris',
        pays: 'FR',
        superficie_m2: '85.5', // Décimales
        nb_pieces: '3',
        description: 'Appartement avec caractères spéciaux: éèàü & émojis 🏠✨'
      }
      
      // Saisie complète
      await page.fill('[data-testid="property-name-input"]', fullData.nom)
      await page.selectOption('[data-testid="property-type-select"]', fullData.type)
      await page.fill('[data-testid="property-address-input"]', fullData.adresse)
      await page.fill('[data-testid="property-postal-code"]', fullData.code_postal)
      await page.fill('[data-testid="property-city"]', fullData.ville)
      await page.selectOption('[data-testid="property-country"]', fullData.pays)
      await page.fill('[data-testid="property-surface"]', fullData.superficie_m2)
      await page.fill('[data-testid="property-rooms"]', fullData.nb_pieces)
      await page.fill('[data-testid="property-description"]', fullData.description)
      
      // Création et navigation
      await page.click('[data-testid="create-property-submit"]')
      await page.waitForURL('**/proprietes/**')
      
      // Validation formatage correct
      await expect(page.locator('[data-testid="property-surface-display"]')).toContainText('85,5 m²') // Virgule française
      await expect(page.locator('[data-testid="property-description-display"]')).toContainText('éèàü')
      await expect(page.locator('[data-testid="property-description-display"]')).toContainText('🏠✨')
      
      // Screenshot formatage spécial
      await page.screenshot({ 
        path: '.playwright-mcp/property-formatting-validation.png',
        fullPage: true 
      })
    })
    
  })

  test.describe('Unités - Cohérence Complète', () => {
    
    test('Unité avec tous champs - validation affichage complet', async ({ page }) => {
      // Aller sur propriété avec unités
      await page.goto('http://localhost:3000/proprietes')
      
      // Sélectionner propriété existante avec unités
      await page.click('[data-testid="property-with-units-link"]')
      
      // Créer nouvelle unité avec TOUS les champs
      await page.click('[data-testid="add-unit-button"]')
      
      const uniteData = {
        nom: 'Studio Vue Mer - Étage 3',
        type: 'studio',
        superficie: '35.5',
        etage: '3',
        numero: 'A301',
        prix_base: '950.00',
        description: 'Studio moderne avec balcon vue mer panoramique 🌊'
      }
      
      // Saisie complète unité
      await page.fill('[data-testid="unit-name-input"]', uniteData.nom)
      await page.selectOption('[data-testid="unit-type-select"]', uniteData.type)
      await page.fill('[data-testid="unit-surface-input"]', uniteData.superficie)
      await page.fill('[data-testid="unit-floor-input"]', uniteData.etage)
      await page.fill('[data-testid="unit-number-input"]', uniteData.numero)
      await page.fill('[data-testid="unit-price-input"]', uniteData.prix_base)
      await page.fill('[data-testid="unit-description-input"]', uniteData.description)
      
      // Création
      await page.click('[data-testid="create-unit-submit"]')
      await expect(page.locator('[data-testid="unit-created-success"]')).toBeVisible()
      
      // Navigation vers détail unité
      await page.click('[data-testid="view-unit-detail"]')
      
      // VALIDATION COMPLÈTE - Tous champs doivent être visibles
      
      // 1. Nom unité en titre
      await expect(page.locator('h1')).toContainText(uniteData.nom)
      
      // 2. Type unité (badge)
      await expect(page.locator('[data-testid="unit-type-badge"]')).toContainText('Studio')
      
      // 3. Spécifications
      await expect(page.locator('[data-testid="unit-surface-display"]')).toContainText('35,5 m²')
      await expect(page.locator('[data-testid="unit-floor-display"]')).toContainText('Étage 3')
      await expect(page.locator('[data-testid="unit-number-display"]')).toContainText('A301')
      
      // 4. Tarification
      await expect(page.locator('[data-testid="unit-price-display"]')).toContainText('950,00 €')
      
      // 5. Description avec emojis
      await expect(page.locator('[data-testid="unit-description-display"]')).toContainText(uniteData.description)
      await expect(page.locator('[data-testid="unit-description-display"]')).toContainText('🌊')
      
      // Screenshot validation unité
      await page.screenshot({ 
        path: '.playwright-mcp/unit-complete-validation.png',
        fullPage: true 
      })
    })
    
  })

  test.describe('Quotités - Cohérence Données Complexes', () => {
    
    test('Quotités avec calculs précis - validation formatage', async ({ page }) => {
      await page.goto('http://localhost:3000/proprietes')
      
      // Propriété existante
      await page.click('[data-testid="property-detail-link"]')
      
      // Onglet quotités
      await page.click('[data-testid="quotites-tab"]')
      
      // Ajouter propriétaire avec quotité précise
      await page.click('[data-testid="add-owner-button"]')
      
      const quotiteData = {
        nom: 'Dubois',
        prenom: 'Marie-Claire',
        type: 'particulier',
        pourcentage: '33.33', // Décimales précises
        date_acquisition: '2024-03-15',
        prix_acquisition: '125000.50',
        notes: 'Acquisition via succession familiale 📋'
      }
      
      // Saisie propriétaire
      await page.fill('[data-testid="owner-lastname"]', quotiteData.nom)
      await page.fill('[data-testid="owner-firstname"]', quotiteData.prenom)
      await page.selectOption('[data-testid="owner-type"]', quotiteData.type)
      await page.fill('[data-testid="ownership-percentage"]', quotiteData.pourcentage)
      await page.fill('[data-testid="acquisition-date"]', quotiteData.date_acquisition)
      await page.fill('[data-testid="acquisition-price"]', quotiteData.prix_acquisition)
      await page.fill('[data-testid="ownership-notes"]', quotiteData.notes)
      
      // Validation
      await page.click('[data-testid="add-owner-submit"]')
      await expect(page.locator('[data-testid="owner-added-success"]')).toBeVisible()
      
      // VALIDATION AFFICHAGE QUOTITÉS
      
      // 1. Nom complet propriétaire
      await expect(page.locator('[data-testid="owner-full-name"]')).toContainText('Marie-Claire DUBOIS')
      
      // 2. Type propriétaire
      await expect(page.locator('[data-testid="owner-type-badge"]')).toContainText('Particulier')
      
      // 3. Pourcentage avec précision
      await expect(page.locator('[data-testid="ownership-percentage-display"]')).toContainText('33,33%')
      
      // 4. Date formatée français
      await expect(page.locator('[data-testid="acquisition-date-display"]')).toContainText('15/03/2024')
      
      // 5. Prix formaté avec devise
      await expect(page.locator('[data-testid="acquisition-price-display"]')).toContainText('125 000,50 €')
      
      // 6. Notes complètes avec emoji
      await expect(page.locator('[data-testid="ownership-notes-display"]')).toContainText(quotiteData.notes)
      await expect(page.locator('[data-testid="ownership-notes-display"]')).toContainText('📋')
      
      // Screenshot quotités détaillées
      await page.screenshot({ 
        path: '.playwright-mcp/quotites-detailed-validation.png',
        fullPage: true 
      })
    })
    
  })

  test.describe('Modification Temps Réel - Cohérence Dynamique', () => {
    
    test('Modification propriété → mise à jour immédiate affichage', async ({ page }) => {
      await page.goto('http://localhost:3000/proprietes')
      
      // Sélectionner propriété existante
      await page.click('[data-testid="property-detail-link"]')
      
      // Basculer en mode édition
      await page.click('[data-testid="edit-property-button"]')
      
      // Modifications
      const modifications = {
        nom: 'Villa Les Palmiers - MODIFIÉE',
        ville: 'Nice', // Changement ville
        superficie: '300', // Changement superficie
        description: 'Description mise à jour avec nouvelles informations 🔄'
      }
      
      // Appliquer modifications
      await page.fill('[data-testid="property-name-input"]', modifications.nom)
      await page.fill('[data-testid="property-city"]', modifications.ville)
      await page.fill('[data-testid="property-surface"]', modifications.superficie)
      await page.fill('[data-testid="property-description"]', modifications.description)
      
      // Sauvegarder
      await page.click('[data-testid="save-property-changes"]')
      await expect(page.locator('[data-testid="property-updated-success"]')).toBeVisible()
      
      // VALIDATION MISE À JOUR TEMPS RÉEL
      
      // Vérifier changements immédiats
      await expect(page.locator('h1')).toContainText(modifications.nom)
      await expect(page.locator('[data-testid="property-full-address"]')).toContainText(modifications.ville)
      await expect(page.locator('[data-testid="property-surface-display"]')).toContainText('300 m²')
      await expect(page.locator('[data-testid="property-description-display"]')).toContainText(modifications.description)
      
      // Reload page pour vérifier persistance
      await page.reload()
      
      // Re-valider après reload
      await expect(page.locator('h1')).toContainText(modifications.nom)
      await expect(page.locator('[data-testid="property-full-address"]')).toContainText(modifications.ville)
      
      // Screenshot après modification
      await page.screenshot({ 
        path: '.playwright-mcp/property-after-modification-validation.png',
        fullPage: true 
      })
    })
    
  })

  test.describe('Edge Cases - Champs Vides vs Remplis', () => {
    
    test('Propriété avec champs optionnels vides - affichage cohérent', async ({ page }) => {
      await page.goto('http://localhost:3000/proprietes')
      await page.click('[data-testid="create-property-button"]')
      
      // Remplir seulement champs obligatoires
      await page.fill('[data-testid="property-name-input"]', 'Propriété Minimale')
      await page.selectOption('[data-testid="property-type-select"]', 'maison')
      await page.fill('[data-testid="property-address-input"]', 'Adresse basique')
      await page.selectOption('[data-testid="property-country"]', 'FR')
      
      // Laisser vides: code_postal, ville, superficie, nb_pieces, description
      
      await page.click('[data-testid="create-property-submit"]')
      await page.waitForURL('**/proprietes/**')
      
      // VALIDATION CHAMPS VIDES
      
      // Champs remplis doivent s'afficher
      await expect(page.locator('h1')).toContainText('Propriété Minimale')
      await expect(page.locator('[data-testid="property-type-badge"]')).toContainText('Maison')
      await expect(page.locator('[data-testid="property-full-address"]')).toContainText('Adresse basique')
      await expect(page.locator('[data-testid="property-full-address"]')).toContainText('France')
      
      // Champs vides doivent avoir placeholders ou être masqués
      await expect(page.locator('[data-testid="property-surface-display"]')).toContainText('Non spécifié')
      await expect(page.locator('[data-testid="property-rooms-display"]')).toContainText('Non spécifié')
      
      // Section description masquée si vide
      const descriptionSection = page.locator('[data-testid="property-description-section"]')
      if (await descriptionSection.isVisible()) {
        await expect(descriptionSection).toContainText('Aucune description')
      }
      
      // Screenshot champs minimaux
      await page.screenshot({ 
        path: '.playwright-mcp/property-minimal-fields-validation.png',
        fullPage: true 
      })
    })
    
  })

})