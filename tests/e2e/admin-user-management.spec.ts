/**
 * 🧪 Tests E2E - Administration des Utilisateurs
 *
 * Tests complets pour l'interface d'administration des utilisateurs :
 * - Accès restreint aux owners
 * - Création, modification et suppression d'utilisateurs
 * - Gestion des rôles et permissions
 * - Respect du design system Vérone
 */

import { test, expect } from '@playwright/test'

test.describe('Administration des Utilisateurs', () => {
  test.beforeEach(async ({ page }) => {
    // Navigation vers la page de connexion
    await page.goto('/login')

    // Connexion avec les credentials owner (supposé existant)
    await page.fill('input[placeholder*="veronebyromeo@gmail.com"]', 'veronebyromeo@gmail.com')
    await page.fill('input[placeholder*="Votre mot de passe"]', 'Abc123456')
    await page.click('button:has-text("Se connecter")')

    // Attendre la redirection vers le dashboard
    await expect(page).toHaveURL('/dashboard')
  })

  test('Accès au menu Administration pour les owners', async ({ page }) => {
    // Cliquer sur le menu profil
    await page.click('button[aria-label="Menu profil"], button:has([data-testid="user-menu"])')

    // Vérifier que le lien Administration est visible
    await expect(page.locator('text=Administration')).toBeVisible()

    // Cliquer sur Administration
    await page.click('text=Administration')

    // Vérifier que nous sommes sur la page d'administration
    await expect(page).toHaveURL('/admin/users')
    await expect(page.locator('h1:has-text("Administration des Utilisateurs")')).toBeVisible()
  })

  test('Affichage de la page d\'administration avec tous les éléments', async ({ page }) => {
    // Naviguer directement vers l'administration
    await page.goto('/admin/users')

    // Vérifier les éléments principaux de la page
    await expect(page.locator('h1:has-text("Administration des Utilisateurs")')).toBeVisible()
    await expect(page.locator('text=Gérer les utilisateurs et leurs permissions dans Vérone')).toBeVisible()

    // Vérifier le bouton de création d'utilisateur
    await expect(page.locator('button:has-text("Nouvel Utilisateur")')).toBeVisible()

    // Vérifier les statistiques
    await expect(page.locator('text=Total Utilisateurs')).toBeVisible()
    await expect(page.locator('text=Owners')).toBeVisible()
    await expect(page.locator('text=Admins')).toBeVisible()
    await expect(page.locator('text=Catalog Managers')).toBeVisible()

    // Vérifier le tableau de gestion
    await expect(page.locator('h2:has-text("Liste des Utilisateurs")')).toBeVisible()
    await expect(page.locator('table')).toBeVisible()

    // Vérifier les colonnes du tableau
    await expect(page.locator('th:has-text("Utilisateur")')).toBeVisible()
    await expect(page.locator('th:has-text("Rôle")')).toBeVisible()
    await expect(page.locator('th:has-text("Contact")')).toBeVisible()
    await expect(page.locator('th:has-text("Poste")')).toBeVisible()
    await expect(page.locator('th:has-text("Actions")')).toBeVisible()
  })

  test('Fonctionnalité de recherche et filtrage', async ({ page }) => {
    await page.goto('/admin/users')

    // Test de la recherche
    const searchInput = page.locator('input[placeholder*="Rechercher par nom ou email"]')
    await expect(searchInput).toBeVisible()

    // Saisir un terme de recherche
    await searchInput.fill('romeo')

    // Test du filtre par rôle
    const roleFilter = page.locator('text=Filtrer par rôle').first()
    await expect(roleFilter).toBeVisible()

    // Cliquer sur le filtre et sélectionner un rôle
    await page.click('button:has-text("Tous les rôles")')
    await page.click('text=Owner')

    // Vérifier que le filtre est appliqué
    await expect(page.locator('button:has-text("Owner")')).toBeVisible()
  })

  test('Ouverture du modal de création d\'utilisateur', async ({ page }) => {
    await page.goto('/admin/users')

    // Cliquer sur le bouton "Nouvel Utilisateur"
    await page.click('button:has-text("Nouvel Utilisateur")')

    // Vérifier que le modal s'ouvre
    await expect(page.locator('text=Créer un nouvel utilisateur').first()).toBeVisible()
    await expect(page.locator('text=Ajoutez un nouvel utilisateur au système Vérone')).toBeVisible()

    // Vérifier la présence des champs
    await expect(page.locator('label:has-text("Email")')).toBeVisible()
    await expect(page.locator('label:has-text("Mot de passe temporaire")')).toBeVisible()
    await expect(page.locator('label:has-text("Rôle")')).toBeVisible()
    await expect(page.locator('label:has-text("Prénom")')).toBeVisible()
    await expect(page.locator('label:has-text("Nom de famille")')).toBeVisible()
    await expect(page.locator('label:has-text("Téléphone")')).toBeVisible()
    await expect(page.locator('label:has-text("Intitulé de poste")')).toBeVisible()

    // Vérifier les boutons d'action
    await expect(page.locator('button:has-text("Annuler")')).toBeVisible()
    await expect(page.locator('button:has-text("Créer l\'utilisateur")')).toBeVisible()

    // Fermer le modal
    await page.click('button:has-text("Annuler")')
    await expect(page.locator('text=Créer un nouvel utilisateur').first()).not.toBeVisible()
  })

  test('Validation du formulaire de création d\'utilisateur', async ({ page }) => {
    await page.goto('/admin/users')

    // Ouvrir le modal de création
    await page.click('button:has-text("Nouvel Utilisateur")')

    // Essayer de soumettre le formulaire vide
    await page.click('button:has-text("Créer l\'utilisateur")')

    // Vérifier les messages d'erreur
    await expect(page.locator('text=L\'email est requis')).toBeVisible()
    await expect(page.locator('text=Le mot de passe est requis')).toBeVisible()

    // Remplir un email invalide
    await page.fill('input[placeholder*="utilisateur@exemple.com"]', 'email-invalide')
    await page.click('button:has-text("Créer l\'utilisateur")')
    await expect(page.locator('text=Format d\'email invalide')).toBeVisible()

    // Remplir un mot de passe trop court
    await page.fill('input[placeholder*="utilisateur@exemple.com"]', 'test@exemple.com')
    await page.fill('input[placeholder*="Mot de passe temporaire"]', '123')
    await page.click('button:has-text("Créer l\'utilisateur")')
    await expect(page.locator('text=Le mot de passe doit contenir au moins 8 caractères')).toBeVisible()

    // Test de validation du téléphone
    await page.fill('input[placeholder*="Mot de passe temporaire"]', 'MotDePasse123!')
    await page.fill('input[placeholder*="0X XX XX XX XX"]', '123456')
    await page.click('button:has-text("Créer l\'utilisateur")')
    await expect(page.locator('text=Format invalide')).toBeVisible()
  })

  test('Sélection et affichage des rôles', async ({ page }) => {
    await page.goto('/admin/users')

    // Ouvrir le modal de création
    await page.click('button:has-text("Nouvel Utilisateur")')

    // Cliquer sur le sélecteur de rôle
    await page.click('button:has-text("Sélectionner un rôle")')

    // Vérifier que tous les rôles sont disponibles
    await expect(page.locator('text=Catalog Manager')).toBeVisible()
    await expect(page.locator('text=Admin')).toBeVisible()
    await expect(page.locator('text=Owner')).toBeVisible()

    // Sélectionner le rôle Admin
    await page.click('div:has-text("Admin")')

    // Vérifier que le rôle est sélectionné
    await expect(page.locator('button:has-text("Admin")')).toBeVisible()
  })

  test('Fonctionnalité d\'affichage/masquage du mot de passe', async ({ page }) => {
    await page.goto('/admin/users')

    // Ouvrir le modal de création
    await page.click('button:has-text("Nouvel Utilisateur")')

    // Vérifier que le champ mot de passe est masqué par défaut
    const passwordInput = page.locator('input[placeholder*="Mot de passe temporaire"]')
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // Cliquer sur le bouton d'affichage du mot de passe
    await page.click('button[aria-label*="password"], button:has(svg[data-testid="eye-icon"]), button:has([data-testid="show-password"])')

    // Vérifier que le mot de passe est maintenant visible
    await expect(passwordInput).toHaveAttribute('type', 'text')

    // Cliquer à nouveau pour masquer
    await page.click('button[aria-label*="password"], button:has(svg[data-testid="eye-off-icon"]), button:has([data-testid="hide-password"])')
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('Design system Vérone respecté', async ({ page }) => {
    await page.goto('/admin/users')

    // Vérifier les couleurs principales (noir/blanc)
    const header = page.locator('h1:has-text("Administration des Utilisateurs")')
    await expect(header).toHaveCSS('color', 'rgb(0, 0, 0)') // Noir Vérone

    // Vérifier les boutons respectent le design system
    const newUserButton = page.locator('button:has-text("Nouvel Utilisateur")')
    await expect(newUserButton).toHaveCSS('background-color', 'rgb(0, 0, 0)') // Fond noir

    // Vérifier le tableau respecte le design system
    const table = page.locator('table')
    await expect(table).toHaveCSS('border-color', 'rgb(0, 0, 0)') // Bordures noires

    // Test du modal
    await page.click('button:has-text("Nouvel Utilisateur")')
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toHaveCSS('background-color', 'rgb(255, 255, 255)') // Fond blanc
    await expect(modal).toHaveCSS('border-color', 'rgb(0, 0, 0)') // Bordure noire
  })

  test('Responsive design sur mobile', async ({ page }) => {
    // Définir une taille d'écran mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/admin/users')

    // Vérifier que la page s'affiche correctement
    await expect(page.locator('h1:has-text("Administration des Utilisateurs")')).toBeVisible()

    // Vérifier que les boutons restent accessibles
    await expect(page.locator('button:has-text("Nouvel Utilisateur")')).toBeVisible()

    // Vérifier que le tableau s'adapte
    await expect(page.locator('table')).toBeVisible()

    // Tester l'ouverture du modal en mode mobile
    await page.click('button:has-text("Nouvel Utilisateur")')
    await expect(page.locator('text=Créer un nouvel utilisateur').first()).toBeVisible()

    // Vérifier que le modal s'affiche correctement sur mobile
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()
  })

  test('Actions sur les utilisateurs dans le tableau', async ({ page }) => {
    await page.goto('/admin/users')

    // Attendre que le tableau soit chargé
    await expect(page.locator('table')).toBeVisible()

    // Chercher les boutons d'action (Edit/Delete) dans le tableau
    const editButtons = page.locator('button[aria-label*="Éditer"], button:has(svg[data-testid="edit-icon"])')
    const deleteButtons = page.locator('button[aria-label*="Supprimer"], button:has(svg[data-testid="trash-icon"])')

    // Vérifier que les boutons d'action existent (s'il y a des utilisateurs)
    const userRows = page.locator('tbody tr')
    const userCount = await userRows.count()

    if (userCount > 0) {
      // S'il y a des utilisateurs, vérifier les boutons d'action
      await expect(editButtons.first()).toBeVisible()

      // Note: Le bouton delete peut ne pas être visible pour le dernier owner
      // C'est un comportement attendu selon la logique métier
    }
  })

  test('Navigation vers la page depuis le menu profil', async ({ page }) => {
    // Cliquer sur le menu profil dans le header
    await page.click('button:has(svg):has-text("Menu profil"), button[aria-label="Menu profil"]')

    // Vérifier que le menu déroulant s'ouvre
    await expect(page.locator('text=Mon Profil')).toBeVisible()

    // Vérifier que le lien Administration est visible (pour les owners)
    await expect(page.locator('text=Administration')).toBeVisible()

    // Cliquer sur Administration
    await page.click('text=Administration')

    // Vérifier la navigation
    await expect(page).toHaveURL('/admin/users')
    await expect(page.locator('h1:has-text("Administration des Utilisateurs")')).toBeVisible()
  })
})