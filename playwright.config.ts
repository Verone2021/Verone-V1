/**
 * 🎭 Playwright Configuration - Vérone Back Office
 *
 * Configuration E2E pour validation workflows business critiques
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Dossier de tests
  testDir: './tests/e2e',

  // Timeout global pour tests business
  timeout: 60000, // 60s pour workflows complets

  // Configuration parallélisation
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 2 : 1,

  // Reporter pour analyse des résultats
  reporter: [
    ['html', { outputFolder: '.playwright-mcp/reports' }],
    ['json', { outputFile: '.playwright-mcp/results.json' }],
    ['list']
  ],

  // Configuration globale
  use: {
    // Base URL pour tests
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',

    // Tracing pour debug
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Headers pour identification tests
    extraHTTPHeaders: {
      'X-Test-Environment': 'playwright-e2e'
    },

    // Timeouts spécifiques
    navigationTimeout: 30000,
    actionTimeout: 15000
  },

  // Configuration projets multi-environnements
  projects: [
    // Tests critiques sur Chrome Desktop
    {
      name: 'chrome-business-critical',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
      testMatch: ['**/*critical*.spec.ts', '**/business-workflows.spec.ts']
    },

    // Tests responsive mobile
    {
      name: 'mobile-workflows',
      use: {
        ...devices['iPhone 13'],
      },
      testMatch: ['**/mobile-*.spec.ts', '**/responsive.spec.ts']
    },

    // Tests performance
    {
      name: 'performance-benchmarks',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
      testMatch: ['**/performance-*.spec.ts']
    },

    // Tests API uniquement
    {
      name: 'api-tests',
      testMatch: ['**/api-*.spec.ts']
    }
  ],

  // Configuration serveur de test
  webServer: [
    {
      command: 'npm run dev',
      port: 3000,
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'test'
      }
    }
  ],

  // Dossier de sortie
  outputDir: '.playwright-mcp/test-results',

  // Configuration globale expect
  expect: {
    // Timeout pour assertions
    timeout: 10000,

    // Comparaison screenshots
    threshold: 0.2,
    toHaveScreenshot: {
      mode: 'css',
      animations: 'disabled'
    }
  }
});