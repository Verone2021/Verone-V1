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

  // Creds : env vars en CI, fallback sur creds locales MVP
  const email = process.env.E2E_TEST_EMAIL ?? 'veronebyromeo@gmail.com';
  const password = process.env.E2E_TEST_PASSWORD ?? 'Abc123456';

  // Remplir le formulaire de login avec sélecteurs robustes
  await page.getByRole('textbox', { name: /email/i }).fill(email);
  await page.getByRole('textbox', { name: /mot de passe/i }).fill(password);

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
