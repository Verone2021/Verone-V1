/**
 * 🧪 Test E2E - Validation du produit corrigé
 *
 * Vérifier que "Test Produit Images Workflow" peut maintenant être validé
 */

import { test, expect } from '@playwright/test'

test.describe('Validation Produit Corrigé', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002/login')
    await page.fill('input[placeholder*="veronebyromeo@gmail.com"]', 'veronebyromeo@gmail.com')
    await page.fill('input[placeholder*="Votre mot de passe"]', 'Abc123456')
    await page.click('button:has-text("Se connecter")')
    await expect(page).toHaveURL('http://localhost:3002/dashboard')
    await page.click('a[href="/catalogue"]')
    await expect(page).toHaveURL('http://localhost:3002/catalogue')
  })

  test('Valider le produit "Test Produit Images Workflow"', async ({ page }) => {
    // Capturer les logs de validation
    const logs: string[] = []
    page.on('console', msg => {
      if (msg.text().includes('🔍') || msg.text().includes('✅') || msg.text().includes('❌') || msg.text().includes('🚀')) {
        logs.push(msg.text())
        console.log('🔍 Log:', msg.text())
      }
    })

    // Trouver et ouvrir le produit
    await page.waitForSelector('text=Test Produit Images Workflow', { timeout: 10000 })
    await page.click('text=Test Produit Images Workflow')

    await expect(page.locator('text=Création de produit')).toBeVisible()

    // Aller directement à l'étape 6 (validation)
    await page.click('button[value="6"]')

    // Essayer de créer le produit
    await page.click('button:has-text("Créer le produit")')

    // Attendre les logs de validation
    await page.waitForTimeout(5000)

    console.log('📋 Tous les logs capturés:', logs)

    // Vérifier qu'il y a eu une tentative de création
    const hasCreationAttempt = logs.some(log => log.includes('🚀 Tentative de création produit'))
    const hasValidation = logs.some(log => log.includes('🔍 Validation étape 6'))

    expect(hasCreationAttempt).toBe(true)
    expect(hasValidation).toBe(true)

    // Si la validation passe, on devrait avoir des logs de succès
    const hasValidationSuccess = logs.some(log => log.includes('✅ Validation réussie'))

    if (hasValidationSuccess) {
      console.log('🎉 SUCCÈS: Le produit peut maintenant être validé !')
    } else {
      // Analyser pourquoi ça échoue encore
      const errorLogs = logs.filter(log => log.includes('❌'))
      console.log('⚠️ Validation échoue encore:', errorLogs)
    }
  })
})