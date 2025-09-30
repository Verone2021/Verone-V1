import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './',
  use: {
    headless: false,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: {
      slowMo: 500 // Pour visibilité des actions
    }
  },
  projects: [
    {
      name: 'session-persistante',
      use: {
        channel: 'chrome',
        baseURL: 'http://localhost:3000'
      },
    },
  ],
});