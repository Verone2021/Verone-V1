/**
 * Configuration Playwright - Tests E2E Vérone Back Office
 * Stratégie tests ciblés : 50 tests essentiels vs 677 exhaustifs
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Dossier des tests E2E
  testDir: './tests',

  // Pattern des fichiers de tests
  testMatch: '**/*.spec.ts',

  // Exécution des tests
  fullyParallel: false, // Séquentiel pour éviter conflits données
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1, // Un seul worker pour tests métier

  // Reporter
  reporter: [
    ['html', { outputFolder: 'tests/reports/html' }],
    ['json', { outputFile: 'tests/reports/results.json' }],
    ['list'],
  ],

  // Timeout global — plus souple en CI (cold-start Supabase, réseau runner
  // GitHub plus lent que localhost). En local on garde 30 s pour feedback
  // rapide.
  timeout: process.env.CI ? 60000 : 30000,
  expect: {
    timeout: process.env.CI ? 10000 : 5000,
  },

  // Configuration base
  use: {
    // URL de base
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Traces
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Navigation — idem, CI doit supporter les cold-starts.
    navigationTimeout: process.env.CI ? 30000 : 10000,
    actionTimeout: process.env.CI ? 10000 : 5000,

    // Console error tracking (zero tolerance)
    bypassCSP: false,
  },

  // Projets de test (navigateurs)
  projects: [
    // Projet setup : Authentification AVANT tous les tests
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: {
        // PAS de storageState pour le setup (sinon erreur fichier manquant)
        storageState: undefined,
      },
    },

    // Projet chromium : Tests E2E avec authentification
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Storage state (authentification persistante)
        storageState: './tests/.auth/user.json',
        // Console error tracking
        contextOptions: {
          strictSelectors: false,
        },
      },
      dependencies: ['setup'], // Exécuter setup AVANT les tests
    },
    // Ajouter Firefox et Safari si besoin
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    //   dependencies: ['setup'],
    // },
  ],

  // Serveur de développement
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true, // Toujours réutiliser serveur existant
    timeout: 120000, // 2 minutes pour démarrage
  },
});
