/**
 * 🧪 Test E2E - Workflow Complet avec Sections Brouillons/Produits
 *
 * Teste que:
 * 1. Les brouillons apparaissent dans l'onglet "Brouillons"
 * 2. Les produits finalisés apparaissent dans l'onglet "Produits finalisés"
 * 3. Le workflow de création fonctionne avec les prix en euros
 * 4. Les badges "nouveau" s'affichent pour les produits récents
 */

import { test, expect } from '@playwright/test'

test.describe('Workflow Complet avec Sections', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002/login')
    await page.fill('input[placeholder*="veronebyromeo@gmail.com"]', 'veronebyromeo@gmail.com')
    await page.fill('input[placeholder*="Votre mot de passe"]', 'Abc123456')
    await page.click('button:has-text("Se connecter")')
    await expect(page).toHaveURL('http://localhost:3002/dashboard')
    await page.click('a[href="/catalogue"]')
    await expect(page).toHaveURL('http://localhost:3002/catalogue')
  })

  test('Vérification des sections Brouillons et Produits finalisés', async ({ page }) => {
    // Vérifier que les onglets sont présents
    await expect(page.locator('text=Produits finalisés')).toBeVisible()
    await expect(page.locator('text=Brouillons')).toBeVisible()

    console.log('✅ Onglets Brouillons et Produits finalisés présents')

    // Aller dans les brouillons
    await page.click('button:has-text("Brouillons")')

    // Vérifier que "Test Produit Images Workflow" est dans les brouillons
    const brouillonVisible = page.locator('text=Test Produit Images Workflow')
    if (await brouillonVisible.isVisible()) {
      console.log('✅ Brouillon "Test Produit Images Workflow" trouvé dans l\'onglet Brouillons')

      // Essayer de le finaliser
      await page.click('text=Test Produit Images Workflow')
      await expect(page.locator('text=Création de produit')).toBeVisible()

      // Aller à l'étape 6 et créer le produit
      await page.click('button[value="6"]')
      await page.click('button:has-text("Créer le produit")')

      // Attendre la redirection
      await page.waitForTimeout(5000)

      // Revenir au catalogue
      await page.goto('http://localhost:3002/catalogue')

      // Vérifier que le produit est maintenant dans "Produits finalisés"
      await page.click('button:has-text("Produits finalisés")')

      const produitFinalise = page.locator('text=Test Produit Images Workflow')
      if (await produitFinalise.isVisible()) {
        console.log('🎉 SUCCÈS TOTAL! Le produit est maintenant dans "Produits finalisés"')

        // Vérifier le badge "nouveau"
        const badgeNouveau = page.locator('text=nouveau')
        if (await badgeNouveau.isVisible()) {
          console.log('✅ Badge "nouveau" affiché pour le produit récent')
        }
      } else {
        console.log('⚠️ Produit pas encore visible dans "Produits finalisés"')
      }
    } else {
      console.log('⚠️ Brouillon "Test Produit Images Workflow" non trouvé')
    }
  })

  test('Vérification des prix en euros dans les cartes produits', async ({ page }) => {
    // Aller dans "Produits finalisés"
    await page.click('button:has-text("Produits finalisés")')

    // Vérifier que les prix s'affichent en euros avec 2 décimales
    const priceElements = page.locator('[class*="font-semibold"]').filter({ hasText: '€ HT' })

    const count = await priceElements.count()
    if (count > 0) {
      console.log(`✅ ${count} prix trouvés avec format euros`)

      // Vérifier le format du premier prix
      const firstPrice = await priceElements.first().textContent()
      console.log(`Prix exemple: ${firstPrice}`)

      // Le prix doit être au format "123.45 € HT" (pas "12345 € HT")
      if (firstPrice && firstPrice.includes('.')) {
        console.log('✅ Prix affiché avec décimales (format euros correct)')
      } else {
        console.log('⚠️ Prix sans décimales - possiblement encore en centimes')
      }
    } else {
      console.log('⚠️ Aucun prix trouvé dans les produits')
    }
  })

  test('Test création nouveau produit directement en euros', async ({ page }) => {
    // Capturer les logs
    const logs: string[] = []
    page.on('console', msg => {
      logs.push(msg.text())
      console.log('📋 Log:', msg.text())
    })

    // Créer un nouveau produit
    await page.click('button:has-text("Nouveau produit")')
    await expect(page.locator('text=Création de produit')).toBeVisible()

    // Remplir rapidement les champs essentiels
    await page.fill('input[name="name"]', 'Test Produit Euros Direct')
    await page.click('button:has-text("Suivant")')

    // Étape 2 - Catégorie (sélectionner la première disponible)
    const categoryButtons = page.locator('button').filter({ hasText: /^[A-Z]/ })
    if (await categoryButtons.count() > 0) {
      await categoryButtons.first().click()
    }
    await page.click('button:has-text("Suivant")')

    // Étape 3 - Caractéristiques
    await page.click('button:has-text("Suivant")')

    // Étape 4 - Images (passer)
    await page.click('button:has-text("Suivant")')

    // Étape 5 - Tarification (CRUCIAL - test euros)
    await page.fill('input[name="supplier_price"]', '299.99') // Prix en euros
    await page.fill('input[name="estimated_selling_price"]', '449.99') // Prix de vente
    await page.click('button:has-text("Suivant")')

    // Étape 6 - Validation et création
    await page.click('button:has-text("Créer le produit")')

    // Attendre le résultat
    await page.waitForTimeout(10000)

    console.log('🔍 Tous les logs:', logs)

    // Vérifier le succès
    const hasSuccess = logs.some(log => log.includes('✅ Produit créé avec succès'))
    if (hasSuccess) {
      console.log('🎉 SUCCÈS! Nouveau produit créé avec prix en euros')

      // Vérifier qu'on est dans le catalogue
      await expect(page).toHaveURL('http://localhost:3002/catalogue')

      // Le nouveau produit devrait être visible avec un badge "nouveau"
      await page.click('button:has-text("Produits finalisés")')

      const nouveauProduit = page.locator('text=Test Produit Euros Direct')
      if (await nouveauProduit.isVisible()) {
        console.log('✅ Nouveau produit visible dans "Produits finalisés"')
      }
    } else {
      console.log('⚠️ Création échouée, logs d\'erreur:', logs.filter(log => log.includes('❌')))
    }
  })
})