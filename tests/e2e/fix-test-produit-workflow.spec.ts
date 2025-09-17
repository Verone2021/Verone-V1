/**
 * 🔧 Test E2E - Fix "Test Produit Images Workflow"
 *
 * Test spécifique pour corriger le produit problématique identifié
 * - ID: cccd9759-cb1a-497f-814a-d4ae23ad1fd5
 * - Problème: supplier_id = NULL (champ requis manquant)
 */

import { test, expect } from '@playwright/test'

test.describe('Fix Test Produit Images Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login sur le bon port
    await page.goto('http://localhost:3002/login')

    // Connexion
    await page.fill('input[placeholder*="veronebyromeo@gmail.com"]', 'veronebyromeo@gmail.com')
    await page.fill('input[placeholder*="Votre mot de passe"]', 'Abc123456')
    await page.click('button:has-text("Se connecter")')

    // Attendre la redirection
    await expect(page).toHaveURL('http://localhost:3002/dashboard')

    // Naviguer vers le catalogue
    await page.click('a[href="/catalogue"]')
    await expect(page).toHaveURL('http://localhost:3002/catalogue')
  })

  test('Diagnostiquer et corriger le produit "Test Produit Images Workflow"', async ({ page }) => {
    // Monitor console pour nos nouveaux logs de debugging
    const validationLogs: string[] = []
    page.on('console', msg => {
      if (msg.text().includes('🔍') || msg.text().includes('❌') || msg.text().includes('🚀')) {
        validationLogs.push(msg.text())
        console.log('Console Log:', msg.text())
      }
    })

    // Chercher le produit dans les brouillons
    await page.waitForSelector('text=Test Produit Images Workflow', { timeout: 10000 })

    // Cliquer sur le produit pour l'éditer
    await page.click('text=Test Produit Images Workflow')

    // Vérifier que le wizard s'ouvre
    await expect(page.locator('text=Création de produit')).toBeVisible()

    // Aller à l'étape 1 pour vérifier le fournisseur
    await page.click('button[value="1"]')

    // Vérifier l'état actuel du fournisseur
    const supplierSelect = page.locator('select, [role="combobox"]').first()
    const supplierValue = await supplierSelect.inputValue().catch(() => '')
    console.log('État actuel du fournisseur:', supplierValue)

    // Si pas de fournisseur, en sélectionner un
    if (!supplierValue) {
      console.log('❌ Fournisseur manquant - Correction en cours...')

      // Sélectionner un fournisseur
      await page.click('select, [role="combobox"]')
      await page.locator('text=Fournisseur').first().click()
      console.log('✅ Fournisseur sélectionné')
    }

    // Aller à l'étape 6 pour tester la validation
    await page.click('button[value="6"]')

    // Essayer de créer le produit
    await page.click('button:has-text("Créer le produit")')

    // Attendre et analyser les logs de validation
    await page.waitForTimeout(3000)

    console.log('Logs de validation capturés:', validationLogs)

    // Vérifier si la validation a réussi ou échoué
    const hasValidationLogs = validationLogs.some(log => log.includes('🔍 Validation étape 6'))
    const hasCreationAttempt = validationLogs.some(log => log.includes('🚀 Tentative de création produit'))

    expect(hasValidationLogs).toBe(true)
    expect(hasCreationAttempt).toBe(true)

    // Si la création échoue encore, analyser pourquoi
    if (validationLogs.some(log => log.includes('❌'))) {
      console.log('⚠️ Validation échouée - Analyse des champs manquants')

      // Retourner aux étapes précédentes pour remplir les champs manquants
      const missingFields = validationLogs.filter(log => log.includes('❌'))
      console.log('Champs manquants identifiés:', missingFields)
    } else {
      console.log('✅ Produit créé avec succès !')
    }
  })

  test('Workflow de correction complète', async ({ page }) => {
    // Chercher et éditer le produit
    await page.click('text=Test Produit Images Workflow')
    await expect(page.locator('text=Création de produit')).toBeVisible()

    // Étape 1: Vérifier et corriger les infos de base
    await page.click('button[value="1"]')

    // Assurer qu'il y a un nom
    const nameInput = page.locator('input[placeholder*="Canapé d\'angle"]')
    const nameValue = await nameInput.inputValue()
    if (!nameValue.trim()) {
      await nameInput.fill('Test Produit Images Workflow Corrigé')
    }

    // Assurer qu'il y a un fournisseur
    try {
      const supplierButton = page.locator('[role="combobox"]').first()
      await supplierButton.click()
      await page.locator('text=Fournisseur').first().click()
      console.log('✅ Fournisseur sélectionné')
    } catch (error) {
      console.log('⚠️ Erreur sélection fournisseur:', error)
    }

    // Étape 2: Vérifier la sous-catégorie (déjà présente selon Supabase)
    await page.click('button[value="2"]')

    // Étape 4: Vérifier la tarification (déjà présente selon Supabase)
    await page.click('button[value="4"]')

    // Sauvegarder les modifications
    await page.click('button:has-text("Sauvegarder")')
    await expect(page.locator('text=Brouillon sauvegardé avec succès')).toBeVisible({ timeout: 10000 })

    // Étape 6: Tenter la création finale
    await page.click('button[value="6"]')
    await page.click('button:has-text("Créer le produit")')

    // Vérifier le résultat
    await page.waitForTimeout(5000)

    // Si succès, on devrait être redirigé vers le catalogue
    const currentUrl = page.url()
    if (currentUrl.includes('/catalogue') && !currentUrl.includes('modal')) {
      console.log('✅ Produit créé avec succès - Redirection vers catalogue')
    } else {
      console.log('⚠️ Création non finalisée - Modal encore ouvert')
    }
  })
})