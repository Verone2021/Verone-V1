import { test, expect } from '@playwright/test';

/**
 * E2E Tests - OrderFormUnified (6-step workflow)
 * Tests: LM-ORD-009 Phase 9
 * Validates: 6-step order creation workflow with all scenarios
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3002';

test.describe('OrderFormUnified - 6 Step Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login with Pokawa test account
    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(3000);

    // If not logged in, use test accounts
    const testAccountsButton = page.locator(
      'button:has-text("Comptes de test")'
    );
    if (await testAccountsButton.isVisible()) {
      await testAccountsButton.click();
      await page.click('text=Pokawa');
      await page.waitForTimeout(2000);
    }

    await page.waitForURL(/\/(dashboard|catalogue|login)/, { timeout: 15000 });
  });

  /**
   * Test 3: Restaurant existant + Contact existant
   * Priority: P0
   */
  test('Test 3: Existing restaurant + Existing contact', async ({ page }) => {
    // Aller sur une sélection publique (remplacer par vraie URL)
    await page.goto(`${BASE_URL}/s/[SELECTION_ID]`); // TODO: Remplacer par ID réel

    // Attendre que la page charge
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

    // Ajouter des produits au panier
    const addButton = page
      .locator('button:has-text("Ajouter au panier")')
      .first();
    await addButton.click();
    await page.waitForTimeout(500);

    // Cliquer sur "Valider la commande"
    await page.click('button:has-text("Valider la commande")');

    // STEP 1: Demandeur
    await expect(page.locator('text=Demandeur')).toBeVisible();
    await page.fill('input[name="requester.name"]', 'Jean Dupont');
    await page.fill('input[name="requester.email"]', 'jean.dupont@pokawa.fr');
    await page.fill('input[name="requester.phone"]', '0612345678');
    await page.click('button:has-text("Suivant")');

    // STEP 2: Restaurant
    await expect(page.locator('text=Restaurant')).toBeVisible();
    // Sélectionner "Restaurant existant"
    await page.click('text=Restaurant existant');
    // Sélectionner le premier restaurant dans la liste
    await page.click('[data-testid="restaurant-card"]:first-child');
    await page.click('button:has-text("Suivant")');

    // STEP 3: Responsable
    await expect(page.locator('text=Responsable')).toBeVisible();
    // Sélectionner le premier contact existant
    await page.click('[data-testid="contact-card"]:first-child');
    await page.click('button:has-text("Suivant")');

    // STEP 4: Facturation
    await expect(page.locator('text=Facturation')).toBeVisible();
    // Choisir "Même que le responsable"
    await page.click('input[value="responsable"]');
    await page.click('button:has-text("Suivant")');

    // STEP 5: Livraison
    await expect(page.locator('text=Livraison')).toBeVisible();
    // Cocher "Contact = responsable"
    await page.check('#useResponsableContact');
    // Remplir adresse
    await page.fill(
      'input[placeholder*="Rechercher une adresse"]',
      '1 Rue de Rivoli, 75001 Paris'
    );
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');
    // Date de livraison
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    const dateString = tomorrow.toISOString().split('T')[0];
    await page.fill('input[type="date"]', dateString);
    // Semi-remorque
    await page.click('input[value="yes"]#semi-yes');
    await page.click('button:has-text("Suivant")');

    // STEP 6: Validation
    await expect(page.locator('text=Récapitulatif')).toBeVisible();
    await expect(page.locator('text=Demandeur')).toBeVisible();
    await expect(page.locator('text=Restaurant')).toBeVisible();
    await expect(page.locator('text=Responsable')).toBeVisible();
    await expect(page.locator('text=Facturation')).toBeVisible();
    await expect(page.locator('text=Livraison')).toBeVisible();

    // Cliquer sur "Valider la commande"
    await page.click('button:has-text("Valider la commande")');

    // Modal de confirmation
    await expect(page.locator('text=Confirmer la commande')).toBeVisible();
    // Vérifier les 5 sections dans le modal
    await expect(
      page.locator('.modal-content >> text=Demandeur')
    ).toBeVisible();
    await expect(
      page.locator('.modal-content >> text=Restaurant')
    ).toBeVisible();
    await expect(
      page.locator('.modal-content >> text=Responsable')
    ).toBeVisible();
    await expect(
      page.locator('.modal-content >> text=Facturation')
    ).toBeVisible();
    await expect(
      page.locator('.modal-content >> text=Livraison')
    ).toBeVisible();

    // Accepter les conditions
    await page.check('input[type="checkbox"]');
    // Soumettre
    await page.click('button:has-text("Confirmer et envoyer")');

    // Vérifier toast de succès
    await expect(page.locator('text=Commande créée')).toBeVisible({
      timeout: 10000,
    });
  });

  /**
   * Test 4: Restaurant existant + Nouveau contact
   * Priority: P1
   */
  test('Test 4: Existing restaurant + New contact', async ({ page }) => {
    await page.goto(`${BASE_URL}/s/[SELECTION_ID]`); // TODO: Remplacer

    // Ajouter produits + valider
    await page.click('button:has-text("Ajouter au panier")');
    await page.click('button:has-text("Valider la commande")');

    // STEP 1: Demandeur
    await page.fill('input[name="requester.name"]', 'Claire Bernard');
    await page.fill(
      'input[name="requester.email"]',
      'claire.bernard@pokawa.fr'
    );
    await page.fill('input[name="requester.phone"]', '0623456789');
    await page.click('button:has-text("Suivant")');

    // STEP 2: Restaurant
    await page.click('text=Restaurant existant');
    await page.click('[data-testid="restaurant-card"]:first-child');
    await page.click('button:has-text("Suivant")');

    // STEP 3: Responsable - Ajouter un nouveau contact
    await expect(page.locator('text=Responsable')).toBeVisible();
    // Cliquer sur "Ajouter un nouveau contact"
    await page.click('button:has-text("Ajouter un nouveau contact")');

    // Remplir les informations du nouveau contact
    await page.fill('input[name="responsable.name"]', 'Thomas Petit');
    await page.fill(
      'input[name="responsable.email"]',
      'thomas.petit@pokawa.fr'
    );
    await page.fill('input[name="responsable.phone"]', '0634567890');
    await page.click('button:has-text("Suivant")');

    // STEP 4: Facturation
    await page.click('input[value="responsable"]');
    await page.click('button:has-text("Suivant")');

    // STEP 5: Livraison
    await page.check('#useResponsableContact');
    await page.fill(
      'input[placeholder*="Rechercher une adresse"]',
      '15 Avenue des Champs-Élysées, 75008 Paris'
    );
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');
    const dateString = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    await page.fill('input[type="date"]', dateString);
    await page.click('button:has-text("Suivant")');

    // STEP 6: Validation
    await page.click('button:has-text("Valider la commande")');
    await page.check('input[type="checkbox"]');
    await page.click('button:has-text("Confirmer et envoyer")');

    await expect(page.locator('text=Commande créée')).toBeVisible({
      timeout: 10000,
    });
  });

  /**
   * Test 5: Nouveau restaurant propre + Org mère facturation
   * Priority: P0
   */
  test('Test 5: New restaurant (propre) + Parent org billing', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/s/[SELECTION_ID]`); // TODO: Remplacer

    // Ajouter produits + valider
    await page.click('button:has-text("Ajouter au panier")');
    await page.click('button:has-text("Valider la commande")');

    // STEP 1: Demandeur
    await page.fill('input[name="requester.name"]', 'Marie Martin');
    await page.fill('input[name="requester.email"]', 'marie.martin@pokawa.fr');
    await page.fill('input[name="requester.phone"]', '0698765432');
    await page.click('button:has-text("Suivant")');

    // STEP 2: Restaurant
    // Sélectionner "Nouveau restaurant"
    await page.click('text=Nouveau restaurant');
    await page.fill('input[name="newRestaurant.tradeName"]', 'Pokawa Opéra');
    await page.fill(
      'input[placeholder*="Rechercher une adresse"]',
      '8 Rue Scribe, 75009 Paris'
    );
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');
    // Choisir "Restaurant propre"
    await page.click('button:has-text("Restaurant propre")');
    await page.click('button:has-text("Suivant")');

    // STEP 3: Responsable
    await page.fill('input[name="responsable.name"]', 'Sophie Dubois');
    await page.fill(
      'input[name="responsable.email"]',
      'sophie.dubois@pokawa.fr'
    );
    await page.fill('input[name="responsable.phone"]', '0645678901');
    await page.click('button:has-text("Suivant")');

    // STEP 4: Facturation
    // Vérifier que la checkbox "Org mère" est visible
    await expect(
      page.locator("text=Utiliser l'organisation mère")
    ).toBeVisible();
    // Cocher la checkbox
    await page.check('#useParentOrg');
    // Vérifier que les détails de l'org mère s'affichent
    await expect(page.locator('text=SIRET')).toBeVisible();
    await page.click('button:has-text("Suivant")');

    // STEP 5: Livraison (simplifié)
    await page.check('#useResponsableContact');
    await page.fill(
      'input[placeholder*="Rechercher une adresse"]',
      '8 Rue Scribe, 75009 Paris'
    );
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');
    const dateString = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    await page.fill('input[type="date"]', dateString);
    await page.click('button:has-text("Suivant")');

    // STEP 6: Validation + Confirmation
    await page.click('button:has-text("Valider la commande")');
    await page.check('input[type="checkbox"]');
    await page.click('button:has-text("Confirmer et envoyer")');

    await expect(page.locator('text=Commande créée')).toBeVisible({
      timeout: 10000,
    });
  });

  /**
   * Test 6: Nouveau restaurant propre + Facturation custom
   * Priority: P1
   */
  test('Test 6: New restaurant (propre) + Custom billing', async ({ page }) => {
    await page.goto(`${BASE_URL}/s/[SELECTION_ID]`); // TODO: Remplacer

    await page.click('button:has-text("Ajouter au panier")');
    await page.click('button:has-text("Valider la commande")');

    // STEP 1: Demandeur
    await page.fill('input[name="requester.name"]', 'Julie Durand');
    await page.fill('input[name="requester.email"]', 'julie.durand@pokawa.fr');
    await page.fill('input[name="requester.phone"]', '0645123456');
    await page.click('button:has-text("Suivant")');

    // STEP 2: Restaurant
    await page.click('text=Nouveau restaurant');
    await page.fill('input[name="newRestaurant.tradeName"]', 'Pokawa Bastille');
    await page.fill(
      'input[placeholder*="Rechercher une adresse"]',
      '5 Place de la Bastille, 75011 Paris'
    );
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');
    await page.click('button:has-text("Restaurant propre")');
    await page.click('button:has-text("Suivant")');

    // STEP 3: Responsable
    await page.fill('input[name="responsable.name"]', 'Marc Leroy');
    await page.fill('input[name="responsable.email"]', 'marc.leroy@pokawa.fr');
    await page.fill('input[name="responsable.phone"]', '0656789012');
    await page.click('button:has-text("Suivant")');

    // STEP 4: Facturation - NE PAS cocher org mère, choisir custom
    // Vérifier que la checkbox org mère est visible
    await expect(
      page.locator("text=Utiliser l'organisation mère")
    ).toBeVisible();
    // NE PAS la cocher (laisser décoché)

    // Choisir "Autre contact"
    await page.click('input[value="custom"]');

    // Remplir les informations du contact de facturation
    await page.fill('input[name="billing.name"]', 'Comptabilité Pokawa');
    await page.fill('input[name="billing.email"]', 'compta@pokawa.fr');
    await page.fill('input[name="billing.phone"]', '0145678901');

    // Remplir l'adresse de facturation (différente du restaurant)
    await page.fill(
      'input[name="billing.address"]',
      '12 Rue de la Paix, 75002 Paris'
    );
    await page.fill('input[name="billing.postalCode"]', '75002');
    await page.fill('input[name="billing.city"]', 'Paris');

    await page.click('button:has-text("Suivant")');

    // STEP 5: Livraison
    await page.check('#useResponsableContact');
    await page.fill(
      'input[placeholder*="Rechercher une adresse"]',
      '5 Place de la Bastille, 75011 Paris'
    );
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');
    const dateString = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    await page.fill('input[type="date"]', dateString);
    await page.click('button:has-text("Suivant")');

    // STEP 6: Validation
    await page.click('button:has-text("Valider la commande")');

    // Vérifier que la facturation custom s'affiche dans le modal
    await expect(
      page.locator('.modal-content >> text=Comptabilité Pokawa')
    ).toBeVisible();
    await expect(
      page.locator('.modal-content >> text=12 Rue de la Paix')
    ).toBeVisible();

    await page.check('input[type="checkbox"]');
    await page.click('button:has-text("Confirmer et envoyer")');

    await expect(page.locator('text=Commande créée')).toBeVisible({
      timeout: 10000,
    });
  });

  /**
   * Test 7: Nouveau restaurant franchise + Société
   * Priority: P0
   */
  test('Test 7: New restaurant (franchise) + Company fields', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/s/[SELECTION_ID]`); // TODO: Remplacer

    await page.click('button:has-text("Ajouter au panier")');
    await page.click('button:has-text("Valider la commande")');

    // STEP 1
    await page.fill('input[name="requester.name"]', 'Pierre Lefebvre');
    await page.fill(
      'input[name="requester.email"]',
      'pierre.lefebvre@franchise.fr'
    );
    await page.fill('input[name="requester.phone"]', '0687654321');
    await page.click('button:has-text("Suivant")');

    // STEP 2
    await page.click('text=Nouveau restaurant');
    await page.fill(
      'input[name="newRestaurant.tradeName"]',
      'Pokawa Lyon Part-Dieu'
    );
    await page.fill(
      'input[placeholder*="Rechercher une adresse"]',
      '17 Rue Dr Bouchut, 69003 Lyon'
    );
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');
    // Choisir "Franchise"
    await page.click('button:has-text("Franchise")');
    await page.click('button:has-text("Suivant")');

    // STEP 3
    await page.fill('input[name="responsable.name"]', 'Luc Moreau');
    await page.fill(
      'input[name="responsable.email"]',
      'luc.moreau@franchise.fr'
    );
    await page.fill('input[name="responsable.phone"]', '0612349876');

    // Section société doit être visible
    await expect(page.locator('text=Informations de la société')).toBeVisible();
    await page.fill(
      'input[name="responsable.companyLegalName"]',
      'SARL Restaurant Moreau'
    );
    await page.fill('input[name="responsable.siret"]', '12345678901234');

    await page.click('button:has-text("Suivant")');

    // STEP 4-6 (simplifié)
    await page.click('input[value="responsable"]');
    await page.click('button:has-text("Suivant")');

    await page.check('#useResponsableContact');
    await page.fill(
      'input[placeholder*="Rechercher une adresse"]',
      '17 Rue Dr Bouchut, 69003 Lyon'
    );
    await page.keyboard.press('Enter');
    const dateString = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    await page.fill('input[type="date"]', dateString);
    await page.click('button:has-text("Suivant")');

    await page.click('button:has-text("Valider la commande")');
    await page.check('input[type="checkbox"]');
    await page.click('button:has-text("Confirmer et envoyer")');

    await expect(page.locator('text=Commande créée')).toBeVisible({
      timeout: 10000,
    });
  });

  /**
   * Test 8: Livraison centre commercial + Upload formulaire
   * Priority: P1
   */
  test('Test 8: Mall delivery + Access form upload', async ({ page }) => {
    await page.goto(`${BASE_URL}/s/[SELECTION_ID]`); // TODO: Remplacer

    await page.click('button:has-text("Ajouter au panier")');
    await page.click('button:has-text("Valider la commande")');

    // STEP 1-4 (simplifié)
    await page.fill('input[name="requester.name"]', 'Test User');
    await page.fill('input[name="requester.email"]', 'test@pokawa.fr');
    await page.fill('input[name="requester.phone"]', '0600000000');
    await page.click('button:has-text("Suivant")');

    await page.click('text=Restaurant existant');
    await page.click('[data-testid="restaurant-card"]:first-child');
    await page.click('button:has-text("Suivant")');

    await page.click('[data-testid="contact-card"]:first-child');
    await page.click('button:has-text("Suivant")');

    await page.click('input[value="responsable"]');
    await page.click('button:has-text("Suivant")');

    // STEP 5: Livraison avec centre commercial
    await page.check('#useResponsableContact');
    await page.fill(
      'input[placeholder*="Rechercher une adresse"]',
      'Centre Commercial Les 4 Temps, 92800 Puteaux'
    );
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    const dateString = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    await page.fill('input[type="date"]', dateString);

    // Choisir "Centre commercial" = Oui
    await page.click('input[value="yes"]#mall-yes');

    // Vérifier que la section centre commercial est visible
    await expect(page.locator('text=Email du centre commercial')).toBeVisible();
    await page.fill('input[name="delivery.mallEmail"]', 'accueil@les4temps.fr');

    // Formulaire d'accès requis = Oui
    await page.click('input[value="yes"]#form-yes');

    // Upload fichier (simulé)
    await expect(page.locator('text=Télécharger le formulaire')).toBeVisible();
    // Note: Upload réel nécessite un fichier de test
    // await page.setInputFiles('input[type="file"]', 'path/to/test-form.pdf');

    // Semi-remorque = Non
    await page.click('input[value="no"]#semi-no');

    // Notes livraison
    await page.fill(
      'textarea[name="delivery.notes"]',
      'Livraison samedi matin avant 10h'
    );

    await page.click('button:has-text("Suivant")');

    // STEP 6
    await page.click('button:has-text("Valider la commande")');

    // Vérifier que le modal affiche les infos de livraison
    await expect(
      page.locator('.modal-content >> text=Centre commercial')
    ).toBeVisible();
    await expect(
      page.locator('.modal-content >> text=Non accessible')
    ).toBeVisible();

    await page.check('input[type="checkbox"]');
    await page.click('button:has-text("Confirmer et envoyer")');

    await expect(page.locator('text=Commande créée')).toBeVisible({
      timeout: 10000,
    });
  });

  /**
   * Test 10: Console Zero
   * Priority: P0
   */
  test('Test 10: Console should have zero errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Écouter les erreurs console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Exécuter un workflow complet
    await page.goto(`${BASE_URL}/s/[SELECTION_ID]`);
    await page.click('button:has-text("Ajouter au panier")');
    await page.click('button:has-text("Valider la commande")');

    // Remplir les 6 étapes rapidement
    await page.fill('input[name="requester.name"]', 'Console Test');
    await page.fill('input[name="requester.email"]', 'console@test.fr');
    await page.fill('input[name="requester.phone"]', '0600000000');
    await page.click('button:has-text("Suivant")');

    await page.click('text=Restaurant existant');
    await page.click('[data-testid="restaurant-card"]:first-child');
    await page.click('button:has-text("Suivant")');

    await page.click('[data-testid="contact-card"]:first-child');
    await page.click('button:has-text("Suivant")');

    await page.click('input[value="responsable"]');
    await page.click('button:has-text("Suivant")');

    await page.check('#useResponsableContact');
    await page.fill(
      'input[placeholder*="Rechercher une adresse"]',
      '1 Rue de Rivoli, 75001 Paris'
    );
    await page.keyboard.press('Enter');
    const dateString = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    await page.fill('input[type="date"]', dateString);
    await page.click('button:has-text("Suivant")');

    await page.click('button:has-text("Valider la commande")');

    // Vérifier qu'il n'y a pas d'erreurs console
    expect(consoleErrors.length).toBe(0);

    // Nettoyer
    await page.close();
  });
});
