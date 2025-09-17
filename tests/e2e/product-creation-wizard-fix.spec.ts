/**
 * 🧪 Test E2E - Fix Product Creation Wizard Margin Percentage
 *
 * Test spécifique pour valider le fix de la contrainte CHECK sur margin_percentage
 * - Validation des marges de 0 à 1000% (biens de luxe)
 * - Gestion correcte des valeurs NULL pour brouillons partiels
 * - Upload d'image avec validation complète
 */

import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Product Creation Wizard - Margin Percentage Fix', () => {
  const testImagePath = path.resolve('./Generated Image September 15, 2025 - 5_02AM.png')

  test.beforeEach(async ({ page }) => {
    // Configuration pour port 3002
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

  test('Sauvegarde brouillon avec marges élevées (jusqu\'à 1000%)', async ({ page }) => {
    // Ouvrir le wizard de création
    await page.click('button:has-text("Nouveau produit")')

    // Vérifier que le modal s'ouvre
    await expect(page.locator('text=Création de produit')).toBeVisible()

    // Étape 1: Informations de base
    await page.fill('input[placeholder*="Canapé d\'angle"]', 'Produit Test Marge Élevée')

    // Sélectionner un fournisseur
    await page.click('[data-testid="supplier-select"] button')
    await page.click('text=Fournisseur').first()

    // Upload de l'image de test
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testImagePath)

    // Attendre l'upload
    await page.waitForTimeout(3000)

    // Aller à l'étape tarification (étape 4)
    await page.click('button[value="4"]')

    // Remplir les prix avec une marge élevée (cas biens de luxe)
    await page.fill('input[placeholder*="150.00"]', '100.00') // Prix d'achat
    await page.fill('input[placeholder*="100.0"]', '500') // Marge 500%

    // Vérifier que le prix de vente est calculé automatiquement
    await expect(page.locator('input[placeholder="Calculé automatiquement"]')).toHaveValue('600.00')

    // Sauvegarder le brouillon
    await page.click('button:has-text("Sauvegarder")')

    // Vérifier la confirmation
    await expect(page.locator('text=Brouillon sauvegardé avec succès')).toBeVisible({ timeout: 10000 })
  })

  test('Validation frontend des marges limites', async ({ page }) => {
    // Ouvrir le wizard
    await page.click('button:has-text("Nouveau produit")')

    // Aller à l'étape tarification
    await page.click('button[value="4"]')

    // Test marge valide maximale (1000%)
    await page.fill('input[placeholder*="150.00"]', '50.00')
    await page.fill('input[placeholder*="100.0"]', '1000')

    // Vérifier que la valeur est acceptée
    await expect(page.locator('input[placeholder*="100.0"]')).toHaveValue('1000')

    // Vérifier le calcul (50€ + 1000% = 550€)
    await expect(page.locator('input[placeholder="Calculé automatiquement"]')).toHaveValue('550.00')

    // Test marge invalide (>1000%)
    await page.fill('input[placeholder*="100.0"]', '1500')

    // La validation frontend devrait empêcher la saisie ou la ramener à 1000
    await page.blur()
    await page.waitForTimeout(500)

    // Vérifier que la valeur reste dans les limites
    const marginValue = await page.locator('input[placeholder*="100.0"]').inputValue()
    expect(parseFloat(marginValue)).toBeLessThanOrEqual(1000)
  })

  test('Gestion des valeurs NULL pour brouillons partiels', async ({ page }) => {
    // Ouvrir le wizard
    await page.click('button:has-text("Nouveau produit")')

    // Remplir seulement le nom (brouillon partiel)
    await page.fill('input[placeholder*="Canapé d\'angle"]', 'Brouillon Partiel Test')

    // Sauvegarder sans remplir les prix (margin_percentage sera NULL)
    await page.click('button:has-text("Sauvegarder")')

    // Vérifier que la sauvegarde réussit malgré margin_percentage NULL
    await expect(page.locator('text=Brouillon sauvegardé avec succès')).toBeVisible({ timeout: 10000 })

    // Aller à l'étape tarification et vérifier que les champs sont vides
    await page.click('button[value="4"]')
    await expect(page.locator('input[placeholder*="150.00"]')).toHaveValue('')
    await expect(page.locator('input[placeholder*="100.0"]')).toHaveValue('')
  })

  test('Cas limites et validation robuste', async ({ page }) => {
    // Ouvrir le wizard
    await page.click('button:has-text("Nouveau produit")')

    await page.fill('input[placeholder*="Canapé d\'angle"]', 'Test Validation Robuste')

    // Aller à l'étape tarification
    await page.click('button[value="4"]')

    // Test marge 0% (valide)
    await page.fill('input[placeholder*="150.00"]', '100.00')
    await page.fill('input[placeholder*="100.0"]', '0')
    await expect(page.locator('input[placeholder="Calculé automatiquement"]')).toHaveValue('100.00')

    // Test marge décimale (ex: 25.5%)
    await page.fill('input[placeholder*="100.0"]', '25.5')
    await expect(page.locator('input[placeholder="Calculé automatiquement"]')).toHaveValue('125.50')

    // Test effacement du champ (retour à NULL)
    await page.fill('input[placeholder*="100.0"]', '')
    await page.blur()

    // Le prix de vente devrait redevenir vide ou indéfini
    const sellingPrice = await page.locator('input[placeholder="Calculé automatiquement"]').inputValue()
    expect(sellingPrice === '' || sellingPrice === '0.00').toBe(true)

    // Sauvegarder pour vérifier que NULL est accepté
    await page.click('button:has-text("Sauvegarder")')
    await expect(page.locator('text=Brouillon sauvegardé avec succès')).toBeVisible({ timeout: 10000 })
  })

  test('Workflow complet avec image et validation finale', async ({ page }) => {
    // Ouvrir le wizard
    await page.click('button:has-text("Nouveau produit")')

    // Étape 1: Informations complètes
    await page.fill('input[placeholder*="Canapé d\'angle"]', 'Produit Luxe Test Complet')

    // Upload image
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testImagePath)
    await page.waitForTimeout(3000)

    // Étape 2: Catégorisation (passer à l'étape suivante)
    await page.click('button[value="2"]')

    // Étape 4: Tarification avec marge élevée
    await page.click('button[value="4"]')
    await page.fill('input[placeholder*="150.00"]', '200.00')
    await page.fill('input[placeholder*="100.0"]', '300') // Marge 300% pour bien de luxe

    // Vérifier le calcul automatique
    await expect(page.locator('input[placeholder="Calculé automatiquement"]')).toHaveValue('800.00')

    // Sauvegarder et fermer
    await page.click('button:has-text("Sauvegarder et fermer")')

    // Vérifier le retour au catalogue
    await expect(page).toHaveURL('http://localhost:3002/catalogue')

    // Vérifier que le produit apparaît dans la liste des brouillons
    await expect(page.locator('text=Produit Luxe Test Complet')).toBeVisible({ timeout: 10000 })
  })
})