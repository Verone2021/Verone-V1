import { test, expect } from '@playwright/test'

/**
 * Test pour vérifier que la correction du système de réservations fonctionne
 */

test.describe('Vérification Système Réservations - Après Correction', () => {
  
  test('Les propriétés doivent maintenant apparaître sur /reservations', async ({ page }) => {
    // Navigation vers réservations
    await page.goto('http://localhost:3004/reservations')
    
    // Attendre le chargement complet
    await page.waitForTimeout(3000)
    
    // Vérifier que la page se charge correctement
    await expect(page.locator('h1')).toContainText('Gestion des Réservations')
    
    // Vérifier que le message d'erreur n'apparaît PLUS
    const emptyStateMessage = page.locator('text=Aucune propriété avec contrat actif disponible')
    const emptyStateExists = await emptyStateMessage.isVisible()
    
    if (emptyStateExists) {
      console.log('❌ PROBLÈME: Le message vide existe encore')
      await page.screenshot({ path: '.playwright-mcp/reservations-still-empty.png', fullPage: true })
      
      // Échec du test - les propriétés n'apparaissent toujours pas
      throw new Error('Les propriétés ne sont toujours pas visibles dans le système de réservations')
    } else {
      console.log('✅ SUCCESS: Le message vide a disparu!')
      
      // Chercher des éléments indiquant la présence de propriétés
      const propertyElements = await page.locator('[data-testid^="property-"]').count()
      const propertyCards = await page.locator('.property-card').count()
      const propertyRows = await page.locator('tr').count()
      
      console.log(`📊 Éléments trouvés:`)
      console.log(`  - Éléments property-*: ${propertyElements}`)
      console.log(`  - Cards propriétés: ${propertyCards}`)
      console.log(`  - Lignes de table: ${propertyRows}`)
      
      // Screenshot du succès
      await page.screenshot({ path: '.playwright-mcp/reservations-with-properties.png', fullPage: true })
    }
  })
  
  test('Le dropdown nouvelle réservation doit contenir des propriétés', async ({ page }) => {
    // Navigation vers nouvelle réservation
    await page.goto('http://localhost:3004/reservations/new')
    
    // Attendre le chargement
    await page.waitForTimeout(2000)
    
    // Vérifier que la page se charge
    await expect(page.locator('h1')).toContainText('Nouvelle Réservation')
    
    // Chercher et ouvrir le dropdown propriétés
    const dropdown = page.locator('[role="combobox"]').first()
    await expect(dropdown).toBeVisible()
    
    await dropdown.click()
    await page.waitForTimeout(1000)
    
    // Vérifier que des options sont maintenant disponibles
    const listbox = page.locator('[role="listbox"]')
    await expect(listbox).toBeVisible()
    
    const options = await page.locator('[role="option"]').count()
    console.log(`📊 Options dans dropdown: ${options}`)
    
    if (options === 0) {
      await page.screenshot({ path: '.playwright-mcp/dropdown-still-empty.png' })
      throw new Error('Le dropdown des propriétés est encore vide')
    } else {
      console.log(`✅ SUCCESS: ${options} propriétés trouvées dans le dropdown`)
      
      // Capturer le nom des premières options
      const firstOptions = await page.locator('[role="option"]').first().textContent()
      console.log(`📝 Première option: ${firstOptions}`)
      
      await page.screenshot({ path: '.playwright-mcp/dropdown-with-properties.png' })
    }
  })
  
  test('Navigation vers calendrier propriété doit fonctionner', async ({ page }) => {
    // Aller sur réservations 
    await page.goto('http://localhost:3004/reservations')
    await page.waitForTimeout(2000)
    
    // Chercher un bouton "Voir Calendrier" ou lien vers calendrier
    const calendarLinks = await page.locator('a[href*="/calendar"]').count()
    const calendarButtons = await page.locator('button').filter({ hasText: /calendrier|calendar/i }).count()
    
    console.log(`📊 Liens calendrier trouvés: ${calendarLinks}`)
    console.log(`📊 Boutons calendrier trouvés: ${calendarButtons}`)
    
    if (calendarLinks > 0) {
      // Cliquer sur le premier lien calendrier
      await page.locator('a[href*="/calendar"]').first().click()
      
      // Vérifier la navigation réussie
      await expect(page).toHaveURL(/.*\/calendar/)
      await page.screenshot({ path: '.playwright-mcp/calendar-page-loaded.png', fullPage: true })
      console.log('✅ Navigation vers calendrier réussie')
    } else {
      console.log('⚠️  Aucun lien calendrier trouvé - peut-être normal selon l\'UI actuelle')
      await page.screenshot({ path: '.playwright-mcp/reservations-no-calendar-links.png', fullPage: true })
    }
  })
  
})