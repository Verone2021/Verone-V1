/**
 * 🧪 Tests E2E - Gestion des Profils Utilisateur
 *
 * Tests complets pour les nouvelles fonctionnalités profil :
 * - Modification des informations personnelles
 * - Validation des champs (téléphone, nom, etc.)
 * - Changement de mot de passe sécurisé
 * - Respect du design system Vérone
 */

import { test, expect } from '@playwright/test'

test.describe('Gestion des Profils Utilisateur', () => {
  test.beforeEach(async ({ page }) => {
    // Navigation vers la page de profil après connexion
    await page.goto('/login')

    // Connexion avec les credentials de test
    await page.fill('input[placeholder*="veronebyromeo@gmail.com"]', 'veronebyromeo@gmail.com')
    await page.fill('input[placeholder*="Votre mot de passe"]', 'Abc123456')
    await page.click('button:has-text("Se connecter")')

    // Attendre la redirection vers le dashboard
    await expect(page).toHaveURL('/dashboard')

    // Naviguer vers le profil via le menu
    await page.click('button:has-text("Menu profil")')
    await page.click('text=Mon Profil')

    // Vérifier que nous sommes sur la page profil
    await expect(page).toHaveURL('/profile')
    await expect(page.locator('h1:has-text("Mon Profil")')).toBeVisible()
  })

  test('Affichage de la page profil avec tous les champs', async ({ page }) => {
    // Vérifier la présence de tous les champs
    await expect(page.locator('text=Nom d\\'affichage')).toBeVisible()
    await expect(page.locator('text=Prénom')).toBeVisible()
    await expect(page.locator('text=Nom de famille')).toBeVisible()
    await expect(page.locator('text=Téléphone')).toBeVisible()
    await expect(page.locator('text=Intitulé de poste')).toBeVisible()
    await expect(page.locator('text=Email')).toBeVisible()
    await expect(page.locator('text=Rôle et permissions')).toBeVisible()

    // Vérifier le bouton de changement de mot de passe
    await expect(page.locator('button:has-text("Changer le mot de passe")')).toBeVisible()

    // Vérifier que les champs optionnels sont marqués
    await expect(page.locator('text=(optionnel)')).toHaveCount(4) // Prénom, nom, téléphone, poste
  })

  test('Modification des informations personnelles', async ({ page }) => {
    // Cliquer sur Modifier
    await page.click('button:has-text("Modifier")')

    // Vérifier que les champs sont maintenant éditables
    await expect(page.locator('input[placeholder="Nom d\\'affichage"]')).toBeVisible()
    await expect(page.locator('input[placeholder="Votre prénom"]')).toBeVisible()
    await expect(page.locator('input[placeholder="Votre nom de famille"]')).toBeVisible()
    await expect(page.locator('input[placeholder*="0X XX XX XX XX"]')).toBeVisible()
    await expect(page.locator('input[placeholder="Votre fonction/poste"]')).toBeVisible()

    // Remplir les champs avec des données de test
    await page.fill('input[placeholder="Nom d\\'affichage"]', 'Romeo Test')
    await page.fill('input[placeholder="Votre prénom"]', 'Romeo')
    await page.fill('input[placeholder="Votre nom de famille"]', 'Dos Santos')
    await page.fill('input[placeholder*="0X XX XX XX XX"]', '0123456789')
    await page.fill('input[placeholder="Votre fonction/poste"]', 'Développeur Full Stack')

    // Sauvegarder
    await page.click('button:has-text("Enregistrer")')

    // Vérifier que le mode édition est désactivé
    await expect(page.locator('input[placeholder="Nom d\\'affichage"]')).not.toBeVisible()

    // Vérifier que les données sont affichées
    await expect(page.locator('text=Romeo Test')).toBeVisible()
    await expect(page.locator('text=Romeo')).toBeVisible()
    await expect(page.locator('text=Dos Santos')).toBeVisible()
    await expect(page.locator('text=0123456789')).toBeVisible()
    await expect(page.locator('text=Développeur Full Stack')).toBeVisible()
  })

  test('Validation du format de téléphone', async ({ page }) => {
    // Cliquer sur Modifier
    await page.click('button:has-text("Modifier")')

    // Tester un numéro invalide
    await page.fill('input[placeholder*="0X XX XX XX XX"]', '123456')

    // Essayer de sauvegarder
    await page.click('button:has-text("Enregistrer")')

    // Vérifier qu'un message d'erreur apparaît
    await expect(page.locator('text=Format invalide')).toBeVisible()

    // Tester un format valide
    await page.fill('input[placeholder*="0X XX XX XX XX"]', '+33123456789')

    // Sauvegarder
    await page.click('button:has-text("Enregistrer")')

    // Vérifier que l'erreur disparaît et la sauvegarde réussit
    await expect(page.locator('text=Format invalide')).not.toBeVisible()
    await expect(page.locator('input[placeholder*="0X XX XX XX XX"]')).not.toBeVisible()
  })

  test('Validation de la longueur des champs', async ({ page }) => {
    // Cliquer sur Modifier
    await page.click('button:has-text("Modifier")')

    // Tester prénom trop long (> 50 caractères)
    const longFirstName = 'A'.repeat(51)
    await page.fill('input[placeholder="Votre prénom"]', longFirstName)

    // Essayer de sauvegarder
    await page.click('button:has-text("Enregistrer")')

    // Vérifier qu'un message d'erreur apparaît
    await expect(page.locator('text=ne peut pas dépasser 50 caractères')).toBeVisible()

    // Corriger avec un prénom valide
    await page.fill('input[placeholder="Votre prénom"]', 'Romeo')

    // Tester intitulé de poste trop long (> 100 caractères)
    const longJobTitle = 'B'.repeat(101)
    await page.fill('input[placeholder="Votre fonction/poste"]', longJobTitle)

    // Essayer de sauvegarder
    await page.click('button:has-text("Enregistrer")')

    // Vérifier qu'un message d'erreur apparaît
    await expect(page.locator('text=ne peut pas dépasser 100 caractères')).toBeVisible()
  })

  test('Ouverture et fermeture du modal changement de mot de passe', async ({ page }) => {
    // Cliquer sur le bouton changer le mot de passe
    await page.click('button:has-text("Changer le mot de passe")')

    // Vérifier que le modal s'ouvre
    await expect(page.locator('text=Changer le mot de passe').first()).toBeVisible()
    await expect(page.locator('text=Modifiez votre mot de passe pour sécuriser')).toBeVisible()

    // Vérifier la présence des champs
    await expect(page.locator('input[placeholder="Votre nouveau mot de passe"]')).toBeVisible()
    await expect(page.locator('input[placeholder="Confirmez votre nouveau mot de passe"]')).toBeVisible()

    // Fermer le modal avec le bouton Annuler
    await page.click('button:has-text("Annuler")')

    // Vérifier que le modal se ferme
    await expect(page.locator('text=Modifiez votre mot de passe pour sécuriser')).not.toBeVisible()
  })

  test('Validation force du mot de passe dans le modal', async ({ page }) => {
    // Ouvrir le modal de changement de mot de passe
    await page.click('button:has-text("Changer le mot de passe")')

    // Tester un mot de passe faible
    await page.fill('input[placeholder="Votre nouveau mot de passe"]', '123')

    // Vérifier l'indicateur de force
    await expect(page.locator('text=Très faible')).toBeVisible()

    // Tester un mot de passe fort
    await page.fill('input[placeholder="Votre nouveau mot de passe"]', 'MonMotDePasseSecurise123!')

    // Vérifier l'indicateur de force
    await expect(page.locator('text=Très fort')).toBeVisible()

    // Vérifier que tous les critères sont verts
    const greenDots = page.locator('.bg-green-600')
    await expect(greenDots).toHaveCount(10) // 5 critères * 2 (dot + bar)
  })

  test('Validation confirmation mot de passe', async ({ page }) => {
    // Ouvrir le modal
    await page.click('button:has-text("Changer le mot de passe")')

    // Saisir nouveau mot de passe
    await page.fill('input[placeholder="Votre nouveau mot de passe"]', 'MonMotDePasseSecurise123!')

    // Saisir confirmation différente
    await page.fill('input[placeholder="Confirmez votre nouveau mot de passe"]', 'AutreMotDePasse123!')

    // Vérifier message d'erreur
    await expect(page.locator('text=Les mots de passe ne correspondent pas')).toBeVisible()

    // Corriger la confirmation
    await page.fill('input[placeholder="Confirmez votre nouveau mot de passe"]', 'MonMotDePasseSecurise123!')

    // Vérifier que l'erreur disparaît
    await expect(page.locator('text=Les mots de passe ne correspondent pas')).not.toBeVisible()
  })

  test('Annulation des modifications', async ({ page }) => {
    // Noter les valeurs initiales
    const initialDisplayName = await page.locator('text=Nom d\\'affichage').locator('..').locator('p.font-medium').textContent()

    // Cliquer sur Modifier
    await page.click('button:has-text("Modifier")')

    // Modifier le nom d'affichage
    await page.fill('input[placeholder="Nom d\\'affichage"]', 'Nouveau Nom Temporaire')

    // Cliquer sur Annuler
    await page.click('button:has-text("Annuler")')

    // Vérifier que les modifications sont annulées
    await expect(page.locator('input[placeholder="Nom d\\'affichage"]')).not.toBeVisible()

    // Vérifier que la valeur originale est préservée
    if (initialDisplayName) {
      await expect(page.locator(`text=${initialDisplayName}`)).toBeVisible()
    }
  })

  test('Design system Vérone respecté', async ({ page }) => {
    // Vérifier les couleurs principales (noir/blanc)
    const header = page.locator('h1:has-text("Mon Profil")')
    await expect(header).toHaveCSS('color', 'rgb(0, 0, 0)') // Noir Vérone

    // Vérifier les boutons respectent le design system
    const editButton = page.locator('button:has-text("Modifier")')
    await expect(editButton).toHaveCSS('border-color', 'rgb(0, 0, 0)') // Border noir

    // Vérifier les icônes sont visibles
    await expect(page.locator('svg')).toHaveCount.atLeast(8) // User, Mail, Shield, Building, Phone, Briefcase, Edit, etc.

    // Vérifier le modal respecte le design system
    await page.click('button:has-text("Changer le mot de passe")')
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toHaveCSS('background-color', 'rgb(255, 255, 255)') // Fond blanc
  })

  test('Responsive design sur mobile', async ({ page }) => {
    // Définir une taille d'écran mobile
    await page.setViewportSize({ width: 375, height: 667 })

    // Vérifier que la page s'affiche correctement
    await expect(page.locator('h1:has-text("Mon Profil")')).toBeVisible()

    // Vérifier que les boutons restent accessibles
    await expect(page.locator('button:has-text("Modifier")')).toBeVisible()
    await expect(page.locator('button:has-text("Changer le mot de passe")')).toBeVisible()

    // Tester l'édition en mode mobile
    await page.click('button:has-text("Modifier")')
    await expect(page.locator('input[placeholder="Nom d\\'affichage"]')).toBeVisible()

    // Tester le modal en mode mobile
    await page.click('button:has-text("Annuler")')
    await page.click('button:has-text("Changer le mot de passe")')
    await expect(page.locator('text=Changer le mot de passe').first()).toBeVisible()
  })
})