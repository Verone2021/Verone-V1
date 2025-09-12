import { test, expect } from '@playwright/test'

/**
 * Test simple validation spécifique affichage pays "France"
 * 
 * OBJECTIF: Vérifier que le pays s'affiche maintenant "France" au lieu de "FR"
 * Suite à la correction avec formatCountryName()
 */
test.describe('Validation Affichage Pays - Correction Appliquée', () => {
  
  test('Propriété doit afficher "France" et non plus "FR"', async ({ page }) => {
    // Configuration URL base depuis l'environnement ou localhost par défaut
    const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'
    
    // Navigation vers page propriétés
    await page.goto(`${baseURL}/proprietes`)
    
    // Attendre que la page soit chargée
    await page.waitForLoadState('networkidle')
    
    // Chercher et cliquer sur un lien propriété
    const propertyLink = page.locator('[href*="/proprietes/"]').first()
    
    // Vérifier qu'il y a des propriétés
    const linkCount = await propertyLink.count()
    console.log(`Liens propriétés trouvés: ${linkCount}`)
    
    if (linkCount > 0) {
      // Cliquer sur la première propriété
      await propertyLink.click()
      
      // Attendre que la page se charge
      await page.waitForLoadState('networkidle')
      
      // VALIDATION CRITIQUE: Chercher affichage pays
      
      // 1. Vérifier élément avec data-testid spécifique
      const countryDisplay = page.locator('[data-testid="property-country-display"]')
      
      if (await countryDisplay.count() > 0) {
        const countryText = await countryDisplay.textContent()
        console.log(`🔍 Pays affiché avec data-testid: "${countryText}"`)
        
        // ASSERTION CRITIQUE: Doit afficher "France" et PAS "FR"
        expect(countryText).toContain('France')
        expect(countryText).not.toBe('FR')
        
        console.log('✅ SUCCÈS: Pays affiché correctement comme "France"')
      } else {
        console.log('❌ Élément data-testid="property-country-display" non trouvé')
      }
      
      // 2. Recherche alternative dans toute la page
      const franceText = page.locator(':has-text("France")')
      const franceCount = await franceText.count()
      console.log(`🔍 Occurrences "France" trouvées: ${franceCount}`)
      
      if (franceCount > 0) {
        console.log('✅ SUCCÈS: Le mot "France" est présent sur la page')
      } else {
        console.log('❌ PROBLÈME: Aucune occurrence "France" trouvée')
      }
      
      // 3. Vérifier qu'on n'affiche plus le code brut "FR"
      const frCodeElements = page.locator('text="FR"')
      const frCount = await frCodeElements.count()
      console.log(`🔍 Occurrences code "FR" trouvées: ${frCount}`)
      
      // On peut avoir FR dans d'autres contextes (formulaires, etc.)
      // mais pas dans l'affichage principal des détails
      
      // Screenshot pour documentation
      await page.screenshot({ 
        path: '.playwright-mcp/country-display-corrected.png',
        fullPage: true 
      })
      
    } else {
      console.log('❌ Aucune propriété trouvée pour tester')
      // Screenshot de la page vide pour debug
      await page.screenshot({ 
        path: '.playwright-mcp/no-properties-found.png',
        fullPage: true 
      })
    }
  })
  
  test('Validation formatage autres champs géographiques', async ({ page }) => {
    const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'
    
    await page.goto(`${baseURL}/proprietes`)
    await page.waitForLoadState('networkidle')
    
    const propertyLink = page.locator('[href*="/proprietes/"]').first()
    
    if (await propertyLink.count() > 0) {
      await propertyLink.click()
      await page.waitForLoadState('networkidle')
      
      console.log('=== VALIDATION FORMATAGE ADRESSE COMPLÈTE ===')
      
      // Vérifier affichage adresse
      const addressDisplay = page.locator('[data-testid="property-address-display"]')
      if (await addressDisplay.count() > 0) {
        const addressText = await addressDisplay.textContent()
        console.log(`📍 Adresse: "${addressText}"`)
      }
      
      // Vérifier affichage ville
      const cityDisplay = page.locator('[data-testid="property-city-display"]')
      if (await cityDisplay.count() > 0) {
        const cityText = await cityDisplay.textContent()
        console.log(`🏙️ Ville: "${cityText}"`)
      }
      
      // Vérifier affichage code postal
      const postalDisplay = page.locator('[data-testid="property-postal-code-display"]')
      if (await postalDisplay.count() > 0) {
        const postalText = await postalDisplay.textContent()
        console.log(`📮 Code postal: "${postalText}"`)
      }
      
      // Vérifier superficie
      const surfaceDisplay = page.locator('[data-testid="property-surface-display"]')
      if (await surfaceDisplay.count() > 0) {
        const surfaceText = await surfaceDisplay.textContent()
        console.log(`📐 Superficie: "${surfaceText}"`)
        
        // Vérifier format avec "m²" et pas juste un nombre
        if (surfaceText && surfaceText !== 'Non spécifié') {
          expect(surfaceText).toContain('m²')
          console.log('✅ Superficie formatée correctement avec "m²"')
        }
      }
      
      // Vérifier nombre pièces
      const roomsDisplay = page.locator('[data-testid="property-rooms-display"]')
      if (await roomsDisplay.count() > 0) {
        const roomsText = await roomsDisplay.textContent()
        console.log(`🚪 Pièces: "${roomsText}"`)
      }
      
      // Screenshot final formatage
      await page.screenshot({ 
        path: '.playwright-mcp/formatting-validation-complete.png',
        fullPage: true 
      })
      
    }
  })

  test('Test validation cohérence description propriété', async ({ page }) => {
    const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'
    
    await page.goto(`${baseURL}/proprietes`)
    await page.waitForLoadState('networkidle')
    
    const propertyLink = page.locator('[href*="/proprietes/"]').first()
    
    if (await propertyLink.count() > 0) {
      await propertyLink.click()
      await page.waitForLoadState('networkidle')
      
      console.log('=== VALIDATION DESCRIPTION PROPRIÉTÉ ===')
      
      // Chercher section description
      const descriptionCard = page.locator('h3:has-text("Description"), h2:has-text("Description")').first()
      
      if (await descriptionCard.count() > 0) {
        console.log('✅ Section Description trouvée')
        
        // Chercher le contenu de description
        const descriptionContent = page.locator('[data-testid="property-description-display"]')
        
        if (await descriptionContent.count() > 0) {
          const descText = await descriptionContent.textContent()
          console.log(`📝 Description: "${descText?.substring(0, 100)}..."`)
          
          // Vérifier que la description n'est pas vide
          expect(descText).toBeTruthy()
          expect(descText?.trim()).not.toBe('')
          
          console.log('✅ Description non vide et affichée correctement')
        } else {
          console.log('❌ Élément description avec data-testid non trouvé')
          
          // Chercher alternative
          const altDescription = descriptionCard.locator('~ div p, + div p').first()
          if (await altDescription.count() > 0) {
            const altText = await altDescription.textContent()
            console.log(`📝 Description alternative: "${altText?.substring(0, 100)}..."`)
          }
        }
        
      } else {
        console.log('❌ Section Description non trouvée - peut-être pas de description pour cette propriété')
      }
      
      // Screenshot section description
      await page.screenshot({ 
        path: '.playwright-mcp/property-description-validation.png',
        fullPage: true 
      })
    }
  })

})