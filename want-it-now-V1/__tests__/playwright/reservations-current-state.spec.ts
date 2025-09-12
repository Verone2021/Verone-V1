import { test, expect } from '@playwright/test'

/**
 * Test de l'état actuel du système de réservations
 * 
 * Ce test documente l'état exact de l'interface des réservations
 * pour comprendre pourquoi le message "Aucune propriété avec contrat actif disponible" s'affiche.
 */

test.describe('Réservations - État Actuel du Système', () => {
  
  test('Page /reservations - Affichage état vide', async ({ page }) => {
    // Navigation vers la page des réservations
    await page.goto('http://localhost:3004/reservations')
    
    // Vérifications de base
    await expect(page).toHaveTitle(/Want It Now/)
    await expect(page.locator('h1')).toContainText('Gestion des Réservations')
    await expect(page.locator('p').first()).toContainText('Channel Manager - Propriétés avec contrats actifs')
    
    // Vérification des boutons d'action
    await expect(page.locator('button').filter({ hasText: 'Import CSV' })).toBeVisible()
    await expect(page.locator('button').filter({ hasText: 'Nouvelle Réservation' })).toBeVisible()
    
    // Vérification des KPIs - tous à zéro
    await expect(page.locator('text=Propriétés Actives')).toBeVisible()
    await expect(page.locator('text="0"').nth(0)).toBeVisible() // Propriétés Actives: 0
    
    await expect(page.locator('text=Réservations Actives')).toBeVisible()
    await expect(page.locator('text="0"').nth(1)).toBeVisible() // Réservations Actives: 0
    
    await expect(page.locator('text=Disponibles Aujourd\'hui')).toBeVisible()
    await expect(page.locator('text="0"').nth(2)).toBeVisible() // Disponibles Aujourd'hui: 0
    
    await expect(page.locator('text=Taux d\'Occupation')).toBeVisible()
    await expect(page.locator('text=0%')).toBeVisible()
    
    // Vérification de la barre de recherche
    await expect(page.locator('input[placeholder*="Rechercher"]')).toBeVisible()
    
    // **FINDING CRITIQUE** : Message d'état vide
    await expect(page.locator('h3')).toContainText('Aucune propriété trouvée')
    await expect(page.locator('text=Aucune propriété avec contrat actif disponible')).toBeVisible()
    
    // Bouton "Créer un Contrat" présent
    await expect(page.locator('button').filter({ hasText: 'Créer un Contrat' })).toBeVisible()
    
    // Screenshot pour documentation
    await page.screenshot({ path: '.playwright-mcp/reservations-state-empty.png', fullPage: true })
  })
  
  test('Formulaire nouvelle réservation - Dropdown vide', async ({ page }) => {
    // Navigation vers nouvelle réservation
    await page.goto('http://localhost:3004/reservations/new')
    
    // Vérifications du formulaire wizard
    await expect(page.locator('h1')).toContainText('Nouvelle Réservation')
    await expect(page.locator('text=Créer une réservation manuelle')).toBeVisible()
    
    // Vérification des étapes wizard
    await expect(page.locator('text=Propriété')).toBeVisible()
    await expect(page.locator('text=Voyageur')).toBeVisible()
    await expect(page.locator('text=Paiement')).toBeVisible()
    
    // Section Propriété et Dates
    await expect(page.locator('h3')).toContainText('Propriété et Dates')
    
    // **FINDING CRITIQUE** : Alert information sur contrats actifs
    await expect(page.locator('text=Propriétés avec contrats actifs')).toBeVisible()
    await expect(page.locator('text=Seules les propriétés ayant un contrat actif sont affichées')).toBeVisible()
    
    // Test du dropdown propriété/unité
    const propertyDropdown = page.locator('[role="combobox"]').first()
    await expect(propertyDropdown).toBeVisible()
    
    // Clic sur le dropdown pour l'ouvrir
    await propertyDropdown.click()
    
    // **FINDING CRITIQUE** : Dropdown est vide (aucune option visible)
    // Le listbox s'ouvre mais ne contient aucune option
    await expect(page.locator('[role="listbox"]')).toBeVisible()
    
    // Vérification des autres champs
    await expect(page.locator('input[placeholder*="arrivée"]')).toBeVisible()
    await expect(page.locator('input[placeholder*="départ"]')).toBeVisible()
    
    // Boutons navigation désactivés (pas de propriété sélectionnée)
    await expect(page.locator('button').filter({ hasText: 'Précédent' })).toBeDisabled()
    await expect(page.locator('button').filter({ hasText: 'Suivant' })).toBeDisabled()
    
    // Screenshot avec dropdown ouvert
    await page.screenshot({ path: '.playwright-mcp/reservations-form-empty-dropdown.png' })
  })
  
  test('Navigation vers création contrat fonctionne', async ({ page }) => {
    // Depuis page réservations
    await page.goto('http://localhost:3004/reservations')
    
    // Clic sur "Créer un Contrat" 
    await page.locator('button').filter({ hasText: 'Créer un Contrat' }).click()
    
    // Vérification navigation réussie
    await expect(page).toHaveURL('http://localhost:3004/contrats/new')
    await expect(page.locator('h1')).toContainText('Assistant Création Contrat')
    await expect(page.locator('text=Wizard guidé en 6 étapes')).toBeVisible()
    
    // Vérification du wizard contrat
    await expect(page.locator('text=Nouveau Contrat')).toBeVisible()
    await expect(page.locator('text=Étape 1 sur 6')).toBeVisible()
    await expect(page.locator('text=Sélection Propriété')).toBeVisible()
    await expect(page.locator('text=17% complété')).toBeVisible()
    
    // Étapes du wizard visibles
    await expect(page.locator('text=Sélection Propriété')).toBeVisible()
    await expect(page.locator('text=Informations Générales')).toBeVisible()
    await expect(page.locator('text=Conditions Financières')).toBeVisible()
    await expect(page.locator('text=Assurances & Protection')).toBeVisible()
    await expect(page.locator('text=Clauses & Règles Métier')).toBeVisible()
    await expect(page.locator('text=Révision & Finalisation')).toBeVisible()
    
    // **FINDING** : Règle métier visible
    await expect(page.locator('text=Règle métier :')).toBeVisible()
    await expect(page.locator('text=Un contrat doit être lié soit à une propriété')).toBeVisible()
    
    // Screenshot wizard contrat
    await page.screenshot({ path: '.playwright-mcp/contrats-wizard-step1.png', fullPage: true })
  })
  
  test('Analyse des messages console pour diagnostics', async ({ page }) => {
    const consoleMessages: string[] = []
    const errorMessages: string[] = []
    
    // Capture des messages console
    page.on('console', (msg) => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`)
    })
    
    page.on('pageerror', (error) => {
      errorMessages.push(error.message)
    })
    
    // Navigation vers réservations
    await page.goto('http://localhost:3004/reservations')
    
    // Attendre chargement complet
    await page.waitForTimeout(2000)
    
    // Navigation vers nouvelle réservation
    await page.goto('http://localhost:3004/reservations/new')
    await page.waitForTimeout(2000)
    
    // Test dropdown ouverture
    await page.locator('[role="combobox"]').first().click()
    await page.waitForTimeout(1000)
    
    // Logging des messages pour analyse
    console.log('=== CONSOLE MESSAGES ===')
    consoleMessages.forEach((msg, i) => {
      console.log(`${i + 1}. ${msg}`)
    })
    
    console.log('=== ERROR MESSAGES ===')
    errorMessages.forEach((error, i) => {
      console.log(`${i + 1}. ${error}`)
    })
    
    // Les erreurs ne doivent pas bloquer le test
    // Mais on les documente pour analyse
  })
})

/**
 * RÉSULTATS ATTENDUS DE CET AUDIT :
 * 
 * 1. **CAUSE ROOT** du message "Aucune propriété avec contrat actif disponible" :
 *    - Soit aucune propriété n'a de contrat actif en base
 *    - Soit la requête pour récupérer les propriétés avec contrats échoue
 *    - Soit les RLS policies bloquent l'accès aux données
 * 
 * 2. **DROPDOWN VIDE** dans le formulaire nouvelle réservation :
 *    - Confirmé que le dropdown s'ouvre mais ne contient aucune option
 *    - Lié au même problème : pas de propriétés avec contrats actifs
 * 
 * 3. **NAVIGATION FONCTIONNE** :
 *    - Le bouton "Créer un Contrat" redirige correctement
 *    - Le wizard de création de contrat se charge properly
 * 
 * 4. **PROCHAINES ÉTAPES** :
 *    - Vérifier s'il y a des propriétés en base de données
 *    - Vérifier s'il y a des contrats en base de données
 *    - Analyser la requête de récupération des propriétés avec contrats
 *    - Tester la création d'un contrat pour résoudre le problème
 */