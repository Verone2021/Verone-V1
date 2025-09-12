/**
 * Playwright Configuration for Contract Wizard E2E Tests
 * Want It Now V1 - Specialized Configuration for Real Estate Business Workflows
 * 
 * Configuration includes:
 * - Performance monitoring and thresholds
 * - Cross-browser testing setup
 * - Mobile device emulation
 * - Test timeout and retry strategies
 * - Screenshot and video recording
 * - Business rule compliance validation
 */

import { defineConfig, devices } from '@playwright/test'
import path from 'path'

export default defineConfig({
  testDir: '../contrats',
  
  // Global timeout configurations
  timeout: 60000, // 60 seconds per test
  expect: { timeout: 10000 }, // 10 seconds for assertions
  
  // Test execution configuration
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : 4,
  
  // Reporter configuration
  reporter: [
    ['html', { 
      outputFolder: '../../../playwright-report/contracts',
      open: 'never'
    }],
    ['json', { 
      outputFile: '../../../test-results/contracts-results.json' 
    }],
    ['junit', { 
      outputFile: '../../../test-results/contracts-results.xml' 
    }],
    ['line'], // Console output during development
    ...(process.env.CI ? [
      ['github'] // GitHub Actions integration
    ] : [])
  ],
  
  // Global test configuration
  use: {
    // Base URL for all tests
    baseURL: 'http://localhost:3001',
    
    // Browser configuration
    headless: !!process.env.CI,
    
    // Tracing and debugging
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    
    // Performance monitoring
    actionTimeout: 10000, // 10s for individual actions
    navigationTimeout: 30000, // 30s for page loads
    
    // Want It Now specific configuration
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    
    // Test data configuration
    storageState: undefined, // No persistent auth state
    ignoreHTTPSErrors: true,
    
    // Custom test attributes
    testIdAttribute: 'data-testid'
  },
  
  // Projects for different test scenarios
  projects: [
    // ** Desktop Browsers **
    {
      name: 'desktop-chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1200, height: 800 }
      },
      testMatch: [
        '**/contract-wizard.spec.ts',
        '**/wizard-steps/selection-step.spec.ts',
        '**/wizard-steps/conditions-step.spec.ts', 
        '**/wizard-steps/revision-step.spec.ts'
      ]
    },
    
    {
      name: 'desktop-firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1200, height: 800 }
      },
      testMatch: [
        '**/contract-wizard.spec.ts'
      ]
    },
    
    {
      name: 'desktop-safari',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1200, height: 800 }
      },
      testMatch: [
        '**/contract-wizard.spec.ts'
      ]
    },
    
    // ** Mobile Devices **
    {
      name: 'mobile-iphone',
      use: { 
        ...devices['iPhone 12'],
        locale: 'fr-FR'
      },
      testMatch: [
        '**/contract-wizard.spec.ts'
      ]
    },
    
    {
      name: 'mobile-android',
      use: { 
        ...devices['Galaxy S8'],
        locale: 'fr-FR'
      },
      testMatch: [
        '**/contract-wizard.spec.ts'
      ]
    },
    
    // ** Tablet Devices **
    {
      name: 'tablet-ipad',
      use: { 
        ...devices['iPad Pro'],
        locale: 'fr-FR'
      },
      testMatch: [
        '**/contract-wizard.spec.ts'
      ]
    },
    
    // ** Performance Testing **
    {
      name: 'performance',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1200, height: 800 }
      },
      testMatch: [
        '**/contract-wizard-performance.spec.ts'
      ],
      timeout: 120000, // Extended timeout for performance tests
    },
    
    // ** Business Rules Validation **
    {
      name: 'business-rules',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1200, height: 800 }
      },
      testMatch: [
        '**/wizard-steps/conditions-step.spec.ts'
      ],
      grep: /@business-rule/
    },
    
    // ** Accessibility Testing **
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1200, height: 800 }
      },
      testMatch: [
        '**/contract-wizard.spec.ts'
      ],
      grep: /@accessibility/
    }
  ],
  
  // Global setup and teardown
  globalSetup: path.resolve(__dirname, 'global-setup.ts'),
  globalTeardown: path.resolve(__dirname, 'global-teardown.ts'),
  
  // Web server configuration for tests
  webServer: {
    command: 'npm run dev',
    port: 3001,
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes to start
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      NODE_ENV: 'test',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    }
  },
  
  // Output directories
  outputDir: '../../../test-results/contracts',
  
  // Custom matchers and fixtures
  expect: {
    // Performance thresholds
    toLoadWithin: {
      timeout: 2000 // 2s load time target
    },
    
    // Business rule validation
    toComplywithBusinessRules: {
      timeout: 5000
    }
  }
})

// Custom test fixtures for Want It Now
export const test = defineConfig({
  // Contract wizard specific fixtures
  fixtures: {
    contractWizardPage: async ({ page }, use) => {
      await page.goto('/contrats/nouveau')
      await page.waitForLoadState('networkidle')
      await use(page)
    },
    
    // Pre-filled form fixture for faster testing
    prefilledWizard: async ({ page }, use) => {
      await page.goto('/contrats/nouveau')
      
      // Pre-fill Step 1
      await page.fill('[data-testid="property-search"]', 'Villa Les Palmiers')
      await page.click('[data-testid="property-option-prop_villa_nice_001"]')
      await page.click('[data-testid="wizard-next-button"]')
      
      // Pre-fill Step 2
      await page.selectOption('[data-testid="type-contrat-select"]', 'fixe')
      await page.fill('[data-testid="date-debut-input"]', '2025-03-01')
      await page.fill('[data-testid="date-fin-input"]', '2026-02-28')
      await page.check('[data-testid="autorisation-sous-location-checkbox"]')
      await page.fill('[data-testid="bailleur-nom-input"]', 'Jean Dupont')
      await page.fill('[data-testid="bailleur-email-input"]', 'jean.dupont@gmail.com')
      
      await use(page)
    },
    
    // Performance monitoring fixture
    performanceMonitor: async ({ page }, use) => {
      const startTime = Date.now()
      const performanceEntries: any[] = []
      
      // Collect performance data
      await page.addInitScript(() => {
        // Monitor Core Web Vitals
        new PerformanceObserver((list) => {
          (window as any).__performanceEntries = [
            ...((window as any).__performanceEntries || []),
            ...list.getEntries()
          ]
        }).observe({ entryTypes: ['measure', 'navigation', 'paint'] })
      })
      
      await use({
        getLoadTime: () => Date.now() - startTime,
        getPerformanceEntries: () => page.evaluate(() => (window as any).__performanceEntries || [])
      })
    },
    
    // Business rule compliance checker
    businessRuleChecker: async ({ page }, use) => {
      const checkCompliance = async () => {
        const rules = {
          sublettingAuthorized: await page.locator('[data-testid="autorisation-sous-location-checkbox"]').isChecked(),
          commissionValid: await page.evaluate(() => {
            const commission = document.querySelector('[data-testid="commission-pourcentage-input"]') as HTMLInputElement
            const contractType = document.querySelector('[data-testid="type-contrat-select"]') as HTMLSelectElement
            
            if (contractType?.value === 'variable') {
              return commission?.value === '10'
            }
            return true
          }),
          ownerUsageValid: await page.evaluate(() => {
            const usage = document.querySelector('[data-testid="usage-proprietaire-jours-input"]') as HTMLInputElement
            return usage ? parseInt(usage.value) <= 60 : true
          })
        }
        
        return {
          compliant: Object.values(rules).every(Boolean),
          rules
        }
      }
      
      await use({ checkCompliance })
    }
  }
})

// Environment-specific configuration
if (process.env.NODE_ENV === 'production') {
  // Production testing configuration
  module.exports.use.baseURL = 'https://want-it-now-v1.vercel.app'
  module.exports.retries = 3
  module.exports.workers = 1
} else if (process.env.NODE_ENV === 'development') {
  // Development configuration
  module.exports.use.headless = false
  module.exports.use.slowMo = 100 // Slow down for debugging
}