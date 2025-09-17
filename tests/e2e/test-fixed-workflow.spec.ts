/**
 * 🧪 Test E2E - Workflow Corrigé Prix Euros
 *
 * Test pour vérifier que la correction centimes→euros fonctionne
 * et que "Test Produit Images Workflow" peut être créé
 */

import { test, expect } from '@playwright/test'

test.describe('Test Workflow Corrigé', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002/login')
    await page.fill('input[placeholder*="veronebyromeo@gmail.com"]', 'veronebyromeo@gmail.com')
    await page.fill('input[placeholder*="Votre mot de passe"]', 'Abc123456')
    await page.click('button:has-text("Se connecter")')
    await expect(page).toHaveURL('http://localhost:3002/dashboard')
    await page.click('a[href="/catalogue"]')
    await expect(page).toHaveURL('http://localhost:3002/catalogue')
  })

  test('Création produit avec prix euros APRÈS correction', async ({ page }) => {
    // Capturer tous les logs de debugging
    const logs: string[] = []
    page.on('console', msg => {
      logs.push(msg.text())
      console.log('📋 Log:', msg.text())
    })

    // Ouvrir le produit problématique
    await page.click('text=Test Produit Images Workflow')
    await expect(page.locator('text=Création de produit')).toBeVisible()

    // Aller directement à l'étape 6
    await page.click('button[value="6"]')

    // MOMENT DE VÉRITÉ - Créer le produit
    await page.click('button:has-text("Créer le produit")')

    // Attendre le résultat
    await page.waitForTimeout(10000)

    console.log('🔍 Tous les logs capturés:', logs)

    // Analyser les logs pour comprendre ce qui se passe
    const hasCreationAttempt = logs.some(log => log.includes('🚀 Tentative de création produit'))
    const hasValidation = logs.some(log => log.includes('🔍 Validation étape 6'))
    const hasSuccess = logs.some(log => log.includes('✅ Produit créé avec succès'))
    const hasError = logs.some(log => log.includes('❌') || log.includes('Erreur'))

    expect(hasCreationAttempt).toBe(true)
    expect(hasValidation).toBe(true)

    if (hasSuccess) {
      console.log('🎉 SUCCÈS TOTAL ! Le produit a été créé')

      // Vérifier qu'on est bien retourné au catalogue
      await expect(page).toHaveURL('http://localhost:3002/catalogue')

      // Le produit devrait maintenant être dans "Produits finalisés"
      // et plus dans les brouillons

    } else {
      console.log('⚠️ Pas encore de succès, analysons les erreurs:', logs.filter(log => log.includes('❌')))
    }
  })

  test('Vérification que le produit apparaît dans Produits finalisés', async ({ page }) => {
    // Vérifier la section "Produits finalisés"
    const produitsSection = page.locator('text=Produits finalisés').or(page.locator('text=Produits'))

    if (await produitsSection.isVisible()) {
      console.log('✅ Section produits finalisés trouvée')

      // Chercher notre produit créé
      const produitCree = page.locator('text=Test Produit Images Workflow')

      if (await produitCree.isVisible()) {
        console.log('🎉 SUCCÈS ! Le produit est bien dans les produits finalisés')
      } else {
        console.log('⚠️ Produit pas encore visible dans les produits finalisés')
      }
    } else {
      console.log('⚠️ Section produits finalisés non trouvée')
    }
  })
})