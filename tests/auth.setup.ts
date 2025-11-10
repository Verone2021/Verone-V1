import { test as setup, expect } from '@playwright/test';

/**
 * Setup Authentication - Exécuté AVANT tous les tests
 *
 * Objectif : Se connecter une fois et sauvegarder l'état d'authentification
 * pour réutilisation par tous les tests (évite login répété)
 */

const authFile = './tests/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Aller sur la page de login
  await page.goto('/login');

  // Attendre que la page soit chargée
  await page.waitForLoadState('networkidle');

  // Remplir le formulaire de login avec sélecteurs robustes
  await page
    .getByRole('textbox', { name: /email/i })
    .fill('romeo.dossantos.rds+verone@gmail.com');
  await page.getByRole('textbox', { name: /mot de passe/i }).fill('Test1234!');

  // Cliquer sur le bouton de connexion
  await page.getByRole('button', { name: /se connecter/i }).click();

  // Attendre redirection vers dashboard (succès login)
  await page.waitForURL('/dashboard');

  // Vérifier que l'utilisateur est bien connecté
  await expect(page).toHaveURL('/dashboard');

  // Sauvegarder l'état d'authentification
  await page.context().storageState({ path: authFile });

  console.log('✅ Authentication setup completed, state saved to', authFile);
});
