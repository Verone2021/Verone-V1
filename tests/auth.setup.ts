import { test as setup, expect } from '@playwright/test';

/**
 * Setup Authentication - Exécuté AVANT tous les tests
 *
 * Objectif : Se connecter une fois et sauvegarder l'état d'authentification
 * pour réutilisation par tous les tests (évite login répété)
 */

const authFile = './tests/.auth/user.json';

/**
 * Échoue immédiatement avec un message actionnable si la variable manque.
 * En CI, ces valeurs viennent des secrets GitHub `E2E_TEST_EMAIL` /
 * `E2E_TEST_PASSWORD`. En local, de `.env.local` ou de l'environnement shell.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `[auth.setup] Variable d'environnement ${name} absente. ` +
        `En CI : ajouter le secret GitHub ${name}. ` +
        `En local : l'exporter avant de lancer Playwright. ` +
        `Aucun mot de passe n'est plus écrit en dur dans le dépôt (Lot 002).`
    );
  }
  return value;
}

setup('authenticate', async ({ page }) => {
  // Aller sur la page de login
  await page.goto('/login');

  // 'domcontentloaded' + petit settle : /login ne fait pas de polling,
  // mais networkidle est flaky en CI (cold-start runner GitHub).
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);

  // Creds : env vars uniquement (Lot 002 — plus aucun mot de passe en dur).
  // [BO-AUDIT-004] 2026-07-30 — sans ce garde, `password` valait `undefined`
  // et Playwright échouait sur « locator.fill: value: expected string, got
  // undefined », message qui ne dit rien de la cause réelle. Constaté sur le
  // run 30545876019 : les 5 jobs E2E rouges pour cette seule raison.
  const email = required('E2E_TEST_EMAIL', process.env.E2E_TEST_EMAIL);
  const password = required('E2E_TEST_PASSWORD', process.env.E2E_TEST_PASSWORD);

  // Remplir le formulaire de login avec sélecteurs robustes
  await page.getByRole('textbox', { name: /email/i }).fill(email);
  await page.getByRole('textbox', { name: /mot de passe/i }).fill(password);

  // Cliquer sur le bouton de connexion
  await page.getByRole('button', { name: /se connecter/i }).click();

  // Attendre redirection vers dashboard (timeout élargi en CI : cold-start
  // Supabase auth = 2-5 s réels avant redirect)
  await page.waitForURL('/dashboard', { timeout: 30000 });

  // Vérifier que l'utilisateur est bien connecté
  await expect(page).toHaveURL('/dashboard');

  // Sauvegarder l'état d'authentification
  await page.context().storageState({ path: authFile });

  console.log('✅ Authentication setup completed, state saved to', authFile);
});
