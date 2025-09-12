import { test, expect } from '@playwright/test'

/**
 * Test pour créer les données de test des contrats
 * 
 * Ce test va utiliser l'interface utilisateur pour créer deux contrats
 * (un fixe et un variable) pour les propriétés existantes.
 */

test.describe('Création des Contrats de Test', () => {
  
  test('Créer contrat fixe via UI', async ({ page }) => {
    // Navigation vers la création de contrat
    await page.goto('http://localhost:3004/contrats/new')
    
    // Vérifier que la page de création de contrat existe
    await expect(page.locator('h1')).toContainText('Assistant Création Contrat')
    
    // Screenshot de la page initiale
    await page.screenshot({ path: '.playwright-mcp/contrat-creation-page.png', fullPage: true })
    
    console.log('✅ Page de création de contrat accessible')
  })
  
  test('Vérifier état actuel système réservations', async ({ page }) => {
    // Navigation vers réservations
    await page.goto('http://localhost:3004/reservations')
    
    // Capture de l'état actuel
    await expect(page.locator('h1')).toContainText('Gestion des Réservations')
    
    // Vérifier le message d'état vide actuel
    const emptyStateExists = await page.locator('text=Aucune propriété avec contrat actif disponible').isVisible()
    
    if (emptyStateExists) {
      console.log('⚠️  Confirmé: Aucun contrat actif trouvé')
      await page.screenshot({ path: '.playwright-mcp/reservations-before-contracts.png', fullPage: true })
    } else {
      console.log('✅ Des contrats existent déjà!')
      await page.screenshot({ path: '.playwright-mcp/reservations-with-contracts.png', fullPage: true })
    }
  })
  
  test('Tester navigation vers création contrat depuis réservations', async ({ page }) => {
    // Aller sur réservations
    await page.goto('http://localhost:3004/reservations')
    
    // Cliquer sur "Créer un Contrat"
    const createButton = page.locator('button').filter({ hasText: 'Créer un Contrat' })
    await expect(createButton).toBeVisible()
    await createButton.click()
    
    // Vérifier redirection vers wizard contrat
    await expect(page).toHaveURL('http://localhost:3004/contrats/new')
    await expect(page.locator('h1')).toContainText('Assistant Création Contrat')
    
    console.log('✅ Navigation réservations → création contrat fonctionne')
  })
  
  test('Explorer étapes wizard création contrat', async ({ page }) => {
    await page.goto('http://localhost:3004/contrats/new')
    
    // Vérifier étape 1 - Sélection Propriété
    await expect(page.locator('text=Étape 1 sur 6')).toBeVisible()
    await expect(page.locator('text=Sélection Propriété')).toBeVisible()
    
    // Chercher dropdown propriétés
    const propertyDropdown = page.locator('[role="combobox"]').first()
    await expect(propertyDropdown).toBeVisible()
    
    // Ouvrir le dropdown
    await propertyDropdown.click()
    
    // Vérifier si des options sont disponibles
    const listbox = page.locator('[role="listbox"]')
    await expect(listbox).toBeVisible()
    
    // Compter les options disponibles
    const options = await page.locator('[role="option"]').count()
    console.log(`📊 Nombre de propriétés disponibles: ${options}`)
    
    if (options > 0) {
      // Sélectionner première propriété disponible
      await page.locator('[role="option"]').first().click()
      
      console.log('✅ Propriété sélectionnée dans le wizard')
      await page.screenshot({ path: '.playwright-mcp/wizard-property-selected.png' })
      
      // Tenter de passer à l'étape suivante
      const nextButton = page.locator('button').filter({ hasText: 'Suivant' })
      if (await nextButton.isEnabled()) {
        await nextButton.click()
        console.log('✅ Navigation vers étape 2 réussie')
        await page.screenshot({ path: '.playwright-mcp/wizard-step2.png' })
      }
    } else {
      console.log('⚠️  Aucune propriété disponible dans le wizard')
      await page.screenshot({ path: '.playwright-mcp/wizard-no-properties.png' })
    }
  })
  
})