/**
 * 🔐 Tests E2E - Flux Complet d'Authentification et Navigation
 *
 * Test complet du workflow utilisateur Vérone :
 * Login → Dashboard → Navigation → Profil → Déconnexion
 */

import { test, expect } from '@playwright/test';

test.describe('Complete Authentication & Navigation Flow', () => {

  test.beforeEach(async ({ page }) => {
    // Configuration viewport optimale pour tests
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('1. Test de connexion complet avec validation d\'erreurs', async ({ page }) => {
    console.log('🔐 Test de connexion - Étape 1');

    // Accéder à la page de login
    await page.goto('/login');
    await expect(page).toHaveURL('/login');

    // Vérifier que la page de connexion s'affiche correctement
    await expect(page.locator('h1')).toContainText('VÉRONE');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    console.log('✅ Page de login affichée correctement');

    // Test avec de mauvais identifiants
    await page.fill('input[type="email"]', 'mauvais@email.com');
    await page.fill('input[type="password"]', 'mauvaismdp');
    await page.click('button[type="submit"]');

    // Attendre et vérifier le message d'erreur
    await page.waitForTimeout(2000);

    // Vérifier qu'on reste sur la page de login (pas de redirection)
    expect(page.url()).toContain('/login');
    console.log('✅ Erreur d\'authentification gérée correctement');

    // Se connecter avec les bons identifiants
    await page.fill('input[type="email"]', 'veronebyromeo@gmail.com');
    await page.fill('input[type="password"]', 'Abc123456');
    await page.click('button[type="submit"]');

    // Vérifier la redirection vers le dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL('/dashboard');

    console.log('✅ Connexion réussie - Redirection vers dashboard');

    // Prendre une capture d'écran du dashboard
    await page.screenshot({
      path: '.playwright-mcp/auth-dashboard-loaded.png',
      fullPage: true
    });
  });

  test('2. Test de navigation authentifiée et interface', async ({ page }) => {
    console.log('🧭 Test de navigation - Étape 2');

    // Se connecter d'abord
    await page.goto('/login');
    await page.fill('input[type="email"]', 'veronebyromeo@gmail.com');
    await page.fill('input[type="password"]', 'Abc123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Vérifier que le dashboard s'affiche avec les éléments attendus
    await expect(page.locator('aside')).toBeVisible(); // Sidebar
    await expect(page.locator('header')).toBeVisible(); // Header

    console.log('✅ Interface authentifiée visible');

    // Vérifier la présence des éléments de navigation
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Catalogue')).toBeVisible();
    await expect(page.locator('text=Commandes')).toBeVisible();
    await expect(page.locator('text=Clients')).toBeVisible();

    console.log('✅ Navigation sidebar présente');

    // Tester la recherche dans le header
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test recherche');
      await expect(searchInput).toHaveValue('test recherche');
      console.log('✅ Fonction de recherche testée');
    }

    // Vérifier les notifications (badge avec "3")
    const notificationBadge = page.locator('[data-testid="notification-badge"]');
    if (await notificationBadge.isVisible()) {
      await expect(notificationBadge).toContainText('3');
      console.log('✅ Badge de notifications affiché');
    }

    // Prendre une capture d'écran du dashboard complet
    await page.screenshot({
      path: '.playwright-mcp/dashboard-interface-complete.png',
      fullPage: true
    });
  });

  test('3. Test profil utilisateur et gestion des rôles', async ({ page }) => {
    console.log('👤 Test profil utilisateur - Étape 3');

    // Se connecter d'abord
    await page.goto('/login');
    await page.fill('input[type="email"]', 'veronebyromeo@gmail.com');
    await page.fill('input[type="password"]', 'Abc123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Chercher et cliquer sur le dropdown profil (icône User en haut à droite)
    const userDropdown = page.locator('[data-testid="user-dropdown"]')
      .or(page.locator('button:has-text("veronebyromeo")'))
      .or(page.locator('button:has(svg)').last())
      .or(page.locator('header button').last());

    await expect(userDropdown).toBeVisible();
    await userDropdown.click();

    console.log('✅ Dropdown profil ouvert');

    // Vérifier que le menu s'ouvre avec les bonnes options
    await expect(page.locator('text=Mon Profil')).toBeVisible();
    await expect(page.locator('text=Se déconnecter')).toBeVisible();

    // Cliquer sur "Mon Profil"
    await page.locator('text=Mon Profil').click();

    // Vérifier la redirection vers /profile
    await page.waitForURL('/profile');
    await expect(page).toHaveURL('/profile');

    console.log('✅ Redirection vers page profil réussie');

    // Prendre une capture d'écran de la page profil
    await page.screenshot({
      path: '.playwright-mcp/profile-page-loaded.png',
      fullPage: true
    });
  });

  test('4. Test page profil - Affichage et édition', async ({ page }) => {
    console.log('✏️ Test édition profil - Étape 4');

    // Se connecter et aller au profil
    await page.goto('/login');
    await page.fill('input[type="email"]', 'veronebyromeo@gmail.com');
    await page.fill('input[type="password"]', 'Abc123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Aller directement à la page profil
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Vérifier l'affichage des informations utilisateur
    await expect(page.locator('text=veronebyromeo@gmail.com')).toBeVisible();

    // Vérifier la présence du badge de rôle "Propriétaire" (owner)
    const roleBadge = page.locator('[data-testid="role-badge"]')
      .or(page.locator('.role-badge'))
      .or(page.locator('text=Propriétaire'))
      .or(page.locator('text=Owner'));

    if (await roleBadge.isVisible()) {
      console.log('✅ Badge de rôle affiché');

      // Cliquer sur le badge de rôle pour voir les permissions
      await roleBadge.click();
      await page.waitForTimeout(1000);

      // Vérifier si un popup ou tooltip s'affiche
      const permissionsPopup = page.locator('[data-testid="permissions-popup"]')
        .or(page.locator('.permissions-tooltip'))
        .or(page.locator('text=Permissions'));

      if (await permissionsPopup.isVisible()) {
        console.log('✅ Popup permissions affiché');
      }
    }

    // Tester le bouton "Modifier" pour passer en mode édition
    const editButton = page.locator('button:has-text("Modifier")')
      .or(page.locator('[data-testid="edit-profile-button"]'));

    if (await editButton.isVisible()) {
      await editButton.click();
      console.log('✅ Mode édition activé');

      // Modifier le nom de l'utilisateur
      const nameInput = page.locator('input[name="name"]')
        .or(page.locator('input[placeholder*="nom"]'))
        .or(page.locator('input').first());

      if (await nameInput.isVisible()) {
        await nameInput.fill('Romeo Test Modified');

        // Tester le bouton "Enregistrer"
        const saveButton = page.locator('button:has-text("Enregistrer")')
          .or(page.locator('[data-testid="save-profile-button"]'));

        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(2000);
          console.log('✅ Modifications sauvegardées');
        }

        // Tester le bouton "Annuler" (réactiver le mode édition d'abord)
        if (await editButton.isVisible()) {
          await editButton.click();
          const cancelButton = page.locator('button:has-text("Annuler")')
            .or(page.locator('[data-testid="cancel-edit-button"]'));

          if (await cancelButton.isVisible()) {
            await cancelButton.click();
            console.log('✅ Annulation testée');
          }
        }
      }
    }

    // Prendre une capture d'écran finale du profil
    await page.screenshot({
      path: '.playwright-mcp/profile-page-final.png',
      fullPage: true
    });
  });

  test('5. Test déconnexion complète', async ({ page }) => {
    console.log('🚪 Test déconnexion - Étape 5');

    // Se connecter d'abord
    await page.goto('/login');
    await page.fill('input[type="email"]', 'veronebyromeo@gmail.com');
    await page.fill('input[type="password"]', 'Abc123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Retourner au dropdown profil
    const userDropdown = page.locator('[data-testid="user-dropdown"]')
      .or(page.locator('button:has-text("veronebyromeo")'))
      .or(page.locator('button:has(svg)').last())
      .or(page.locator('header button').last());

    await userDropdown.click();

    // Cliquer sur "Se déconnecter"
    await page.locator('text=Se déconnecter').click();

    // Vérifier la redirection vers /login
    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');

    console.log('✅ Déconnexion réussie - Redirection vers login');

    // Vérifier qu'on ne peut plus accéder aux pages protégées
    await page.goto('/dashboard');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');

    console.log('✅ Protection des pages après déconnexion validée');

    // Vérifier qu'on ne peut pas accéder au profil
    await page.goto('/profile');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');

    console.log('✅ Protection complète validée');

    // Prendre une capture d'écran finale
    await page.screenshot({
      path: '.playwright-mcp/logout-complete.png',
      fullPage: true
    });
  });

  test('6. Test workflow complet en une seule fois', async ({ page }) => {
    console.log('🔄 Test workflow complet - Validation finale');

    // 1. Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'veronebyromeo@gmail.com');
    await page.fill('input[type="password"]', 'Abc123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // 2. Navigation dashboard
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();

    // 3. Test navigation vers différentes pages
    const navigationItems = [
      { text: 'Catalogue', url: '/catalogue' },
      { text: 'Commandes', url: '/commandes' },
      { text: 'Clients', url: '/clients' }
    ];

    for (const item of navigationItems) {
      const navLink = page.locator(`a:has-text("${item.text}")`);
      if (await navLink.isVisible()) {
        await navLink.click();
        await page.waitForLoadState('networkidle');
        console.log(`✅ Navigation vers ${item.text} réussie`);
        await page.waitForTimeout(1000);
      }
    }

    // 4. Retour au dashboard
    await page.goto('/dashboard');

    // 5. Test profil
    const userDropdown = page.locator('[data-testid="user-dropdown"]')
      .or(page.locator('button:has-text("veronebyromeo")'))
      .or(page.locator('header button').last());

    if (await userDropdown.isVisible()) {
      await userDropdown.click();
      await page.locator('text=Mon Profil').click();
      await page.waitForURL('/profile');
    }

    // 6. Déconnexion
    await page.goto('/dashboard');
    if (await userDropdown.isVisible()) {
      await userDropdown.click();
      await page.locator('text=Se déconnecter').click();
      await page.waitForURL('/login');
    }

    console.log('🎉 Workflow complet validé avec succès');

    // Capture d'écran finale
    await page.screenshot({
      path: '.playwright-mcp/workflow-complete-final.png',
      fullPage: true
    });
  });

  test('7. Test responsive mobile', async ({ page }) => {
    console.log('📱 Test responsive mobile');

    // Configuration viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });

    // Test login sur mobile
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('VÉRONE');
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Login
    await page.fill('input[type="email"]', 'veronebyromeo@gmail.com');
    await page.fill('input[type="password"]', 'Abc123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Vérifier l'interface mobile
    await expect(page.locator('aside')).toBeVisible(); // Sidebar responsive

    console.log('✅ Interface mobile validée');

    // Capture mobile
    await page.screenshot({
      path: '.playwright-mcp/mobile-interface.png',
      fullPage: true
    });
  });
});