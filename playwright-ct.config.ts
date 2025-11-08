/**
 * Configuration Playwright - Component Testing
 *
 * Config spécifique pour tests composants (ButtonUnified, etc.)
 * SANS authentification (pages publiques /test-components/*)
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Dossier des tests composants
  testDir: './tests/components',

  // Pattern des fichiers de tests
  testMatch: '**/*.spec.ts',

  // Exécution des tests
  fullyParallel: true, // Composants isolés = parallel OK
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4, // Multiple workers car pas de partage state

  // Reporter
  reporter: [
    ['html', { outputFolder: 'tests/reports/components-html' }],
    ['json', { outputFile: 'tests/reports/components-results.json' }],
    ['list'],
  ],

  // Timeout global
  timeout: 30000, // 30s par test
  expect: {
    timeout: 5000, // 5s pour assertions
  },

  // Configuration base
  use: {
    // URL de base
    baseURL: process.env.BASE_URL || 'http://localhost:3001',

    // Traces
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Navigation
    navigationTimeout: 10000,
    actionTimeout: 5000,

    // Console error tracking (zero tolerance)
    bypassCSP: false,
  },

  // Projets de test (navigateurs)
  projects: [
    // Chromium uniquement (default)
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // PAS de storageState (pas d'auth nécessaire)
      },
    },

    // Ajouter Firefox/Safari si besoin
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Serveur de développement
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI, // Réutiliser server existant en local
    timeout: 120000, // 2 minutes pour démarrage
  },
});
