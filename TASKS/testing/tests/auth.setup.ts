/**
 * Configuration authentification Playwright - Vérone Back Office
 * Ce fichier s'exécute AVANT tous les tests E2E pour créer une session authentifiée
 * Storage state sauvegardé dans tests/.auth/user.json
 */

import { test as setup, expect } from '@playwright/test'
import path from 'path'

// Chemin du fichier storage state
const authFile = path.join(__dirname, '.auth/user.json')

setup('authenticate', async ({ page }) => {
  console.log('🔐 Démarrage authentification Playwright...')

  // Navigation vers page login Vérone (utilise baseURL de la config)
  await page.goto('/login')

  // Attendre que la page soit complètement chargée
  await page.waitForLoadState('networkidle')

  // Vérifier que le formulaire de login est visible (logo principal uniquement)
  await expect(page.locator('.font-logo').first()).toBeVisible()
  console.log('✅ Page login chargée')

  // Remplir le formulaire avec les credentials de test
  // User test MVP existant : veronebyromeo@gmail.com
  await page.locator('input[type="email"]').fill('veronebyromeo@gmail.com')
  await page.locator('input[type="password"]').fill('Abc123456')
  console.log('📝 Credentials remplis')

  // Cliquer sur le bouton de connexion
  await page.getByRole('button', { name: /se connecter/i }).click()
  console.log('🔄 Clic sur Se connecter...')

  // Attendre la redirection vers le dashboard
  // Vérone redirige vers /dashboard après login
  await page.waitForURL('**/dashboard', { timeout: 10000 })
  console.log('✅ Redirection vers dashboard réussie')

  // Vérification que l'utilisateur est bien connecté
  // Vérifier que la sidebar de navigation est visible (signe d'authentification)
  await expect(page.locator('nav').first()).toBeVisible({ timeout: 5000 })
  console.log('✅ Dashboard chargé - authentification réussie')

  // Sauvegarder le storage state (cookies + localStorage)
  await page.context().storageState({ path: authFile })
  console.log(`💾 Storage state sauvegardé : ${authFile}`)

  console.log('🎉 Authentification Playwright terminée avec succès!')
})
