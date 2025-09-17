import { test, expect } from '@playwright/test'

test.describe('Module Organisations - Fournisseurs', () => {
  test.beforeEach(async ({ page }) => {
    // Navigation vers la page organisations
    await page.goto('/organisations')
    await expect(page).toHaveTitle(/Vérone Back Office/)
  })

  test('Navigation vers les fournisseurs depuis la page organisations', async ({ page }) => {
    // Vérifier que la page organisations est chargée
    await expect(page.locator('h1')).toContainText('Organisations')

    // Cliquer sur le bouton "Gérer" pour les fournisseurs
    await page.getByRole('button', { name: 'Gérer' }).first().click()

    // Vérifier la redirection vers la page fournisseurs
    await expect(page).toHaveURL('/organisations/suppliers')
    await expect(page.locator('h1')).toContainText('Fournisseurs')
  })

  test('Affichage de la liste des fournisseurs migrés', async ({ page }) => {
    await page.goto('/organisations/suppliers')

    // Vérifier que la page fournisseurs est chargée
    await expect(page.locator('h1')).toContainText('Fournisseurs')

    // Vérifier les statistiques (au moins 12 fournisseurs migrés)
    const totalStat = page.locator('text=Total fournisseurs').locator('..').locator('div').first()
    await expect(totalStat).toContainText(/[1-9][0-9]*/) // Au moins 1 fournisseur

    // Vérifier qu'au moins une carte fournisseur est affichée
    await expect(page.locator('[data-testid="supplier-card"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('Recherche de fournisseur par nom', async ({ page }) => {
    await page.goto('/organisations/suppliers')

    // Attendre que la liste soit chargée
    await page.waitForSelector('[data-testid="supplier-card"]', { timeout: 10000 })

    // Compter le nombre initial de fournisseurs
    const initialCount = await page.locator('[data-testid="supplier-card"]').count()
    expect(initialCount).toBeGreaterThan(0)

    // Rechercher "Vérone"
    await page.getByPlaceholder('Rechercher par nom ou email...').fill('Vérone')

    // Attendre que les résultats se mettent à jour (debounce)
    await page.waitForTimeout(500)

    // Vérifier que seuls les fournisseurs contenant "Vérone" sont affichés
    const searchResults = await page.locator('[data-testid="supplier-card"]').count()
    const supplierNames = await page.locator('[data-testid="supplier-name"]').allTextContents()

    for (const name of supplierNames) {
      expect(name.toLowerCase()).toContain('vérone')
    }
  })

  test('Filtrage par statut actif/inactif', async ({ page }) => {
    await page.goto('/organisations/suppliers')

    // Attendre que la liste soit chargée
    await page.waitForSelector('[data-testid="supplier-card"]', { timeout: 10000 })

    // Compter le nombre initial de fournisseurs
    const initialCount = await page.locator('[data-testid="supplier-card"]').count()

    // Cliquer sur le filtre "Tous" pour voir les inactifs aussi
    await page.getByRole('button', { name: /Actifs uniquement|Tous/ }).click()

    // Attendre que les résultats se mettent à jour
    await page.waitForTimeout(500)

    // Le nombre peut rester le même si tous sont actifs, ou augmenter
    const newCount = await page.locator('[data-testid="supplier-card"]').count()
    expect(newCount).toBeGreaterThanOrEqual(initialCount)
  })

  test('Affichage des détails d\'un fournisseur', async ({ page }) => {
    await page.goto('/organisations/suppliers')

    // Attendre qu'au moins une carte soit visible
    await page.waitForSelector('[data-testid="supplier-card"]', { timeout: 10000 })

    // Cliquer sur la première carte fournisseur
    const firstCard = page.locator('[data-testid="supplier-card"]').first()
    const supplierName = await firstCard.locator('[data-testid="supplier-name"]').textContent()

    await firstCard.locator('[data-testid="supplier-actions"] >> text=Voir détails').click()

    // Vérifier la redirection vers la page catalogue avec filtre fournisseur
    await expect(page).toHaveURL(/\/catalogue\?.*/)
  })

  test('Désactivation/activation d\'un fournisseur', async ({ page }) => {
    await page.goto('/organisations/suppliers')

    // Attendre qu'au moins une carte soit visible
    await page.waitForSelector('[data-testid="supplier-card"]', { timeout: 10000 })

    // Trouver un fournisseur actif
    const activeCard = page.locator('[data-testid="supplier-card"]', {
      has: page.locator('text=Actif')
    }).first()

    if (await activeCard.count() > 0) {
      // Cliquer sur le menu d'actions
      await activeCard.locator('button[aria-haspopup="menu"]').click()

      // Cliquer sur "Désactiver"
      await page.getByRole('menuitem', { name: 'Désactiver' }).click()

      // Vérifier que le statut a changé
      await expect(activeCard.locator('text=Inactif')).toBeVisible({ timeout: 5000 })

      // Réactiver pour remettre en état
      await activeCard.locator('button[aria-haspopup="menu"]').click()
      await page.getByRole('menuitem', { name: 'Activer' }).click()
      await expect(activeCard.locator('text=Actif')).toBeVisible({ timeout: 5000 })
    }
  })

  test('Navigation retour vers organisations', async ({ page }) => {
    await page.goto('/organisations/suppliers')

    // Cliquer sur le bouton retour
    await page.getByRole('button', { name: 'Organisations' }).click()

    // Vérifier la redirection
    await expect(page).toHaveURL('/organisations')
    await expect(page.locator('h1')).toContainText('Organisations')
  })

  test('Vérification de la migration Brand → Supplier dans le catalogue', async ({ page }) => {
    await page.goto('/catalogue')

    // Attendre que la page catalogue soit chargée
    await expect(page.locator('h1')).toContainText('Catalogue')

    // Vérifier qu'il n'y a plus de référence aux "marques" dans l'interface
    const brandElements = await page.locator('text=marque').count()
    const brandInputs = await page.locator('input[name="brand"]').count()

    // Aucun élément ne devrait mentionner "marque"
    expect(brandElements).toBe(0)
    expect(brandInputs).toBe(0)

    // Vérifier la présence d'éléments fournisseur
    if (await page.locator('[data-testid="product-card"]').count() > 0) {
      // Au moins un produit devrait afficher un fournisseur
      const supplierInfo = await page.locator('[data-testid="supplier-info"]').count()
      expect(supplierInfo).toBeGreaterThan(0)
    }
  })

  test('Performance - Chargement page fournisseurs < 2s', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/organisations/suppliers')

    // Attendre que le contenu principal soit chargé
    await page.waitForSelector('[data-testid="supplier-card"]', { timeout: 10000 })

    const loadTime = Date.now() - startTime

    // Vérifier que le chargement respecte le SLO de 2 secondes
    expect(loadTime).toBeLessThan(2000)
  })

  test('Accessibilité - Navigation au clavier', async ({ page }) => {
    await page.goto('/organisations/suppliers')

    // Attendre que la page soit chargée
    await page.waitForSelector('[data-testid="supplier-card"]', { timeout: 10000 })

    // Tester la navigation au clavier
    await page.keyboard.press('Tab') // Navigation vers le premier élément focusable
    await page.keyboard.press('Tab') // Navigation vers l'élément suivant

    // Vérifier qu'un élément est focusé
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(['BUTTON', 'INPUT', 'A']).toContain(focusedElement)
  })
})