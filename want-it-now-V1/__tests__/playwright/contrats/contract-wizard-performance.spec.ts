/**
 * Contract Wizard Performance & Cross-Browser Tests
 * Want It Now V1 - Performance Validation & Browser Compatibility
 * 
 * Tests cover:
 * - Page load performance targets
 * - Form interaction performance
 * - Auto-save performance under load
 * - Cross-browser compatibility
 * - Mobile performance validation
 * - Large dataset handling
 * - Memory usage monitoring
 */

import { test, expect, devices } from '@playwright/test'
import { TEST_PERFORMANCE_DATA } from '../../../test-data/contrats-test-data'

test.describe('Contract Wizard - Performance Tests', () => {
  test.describe('Page Load Performance', () => {
    test('Initial wizard load under 2 seconds', async ({ page }) => {
      // Performance target from manifests: < 2000ms FCP
      const startTime = Date.now()
      
      await page.goto('http://localhost:3001/contrats/nouveau')
      
      // Wait for critical content to be visible
      await expect(page.locator('[data-testid="contract-wizard"]')).toBeVisible()
      await expect(page.locator('[data-testid="wizard-step-1"]')).toBeVisible()
      await expect(page.locator('[data-testid="property-search"]')).toBeVisible()
      
      const loadTime = Date.now() - startTime
      
      // Business requirement: < 2000ms for initial load
      expect(loadTime).toBeLessThan(2000)
      console.log(`Wizard load time: ${loadTime}ms`)
    })

    test('Step navigation performance under 500ms', async ({ page }) => {
      await page.goto('http://localhost:3001/contrats/nouveau')
      
      // Complete Step 1 
      await page.fill('[data-testid="property-search"]', 'Villa Les Palmiers')
      await page.click('[data-testid="property-option-prop_villa_nice_001"]')
      
      const navigationStart = Date.now()
      
      // Navigate to Step 2
      await page.click('[data-testid="wizard-next-button"]')
      await expect(page.locator('[data-testid="wizard-step-2"]')).toHaveClass(/bg-\[#D4841A\]/)
      
      const navigationTime = Date.now() - navigationStart
      
      // Step navigation should be under 500ms
      expect(navigationTime).toBeLessThan(500)
      console.log(`Step navigation time: ${navigationTime}ms`)
    })

    test('Auto-save performance with large form data', async ({ page }) => {
      await page.goto('http://localhost:3001/contrats/nouveau')
      
      // Fill form with substantial data
      await page.fill('[data-testid="property-search"]', 'Villa Les Palmiers Nice Côte d\'Azur avec piscine et vue mer exceptionnelle')
      await page.click('[data-testid="property-option-prop_villa_nice_001"]')
      await page.click('[data-testid="wizard-next-button"]')
      
      // Fill multiple fields with large text data
      await page.selectOption('[data-testid="type-contrat-select"]', 'fixe')
      await page.fill('[data-testid="date-debut-input"]', '2025-03-01')
      await page.fill('[data-testid="date-fin-input"]', '2026-02-28')
      await page.check('[data-testid="autorisation-sous-location-checkbox"]')
      
      // Large text fields
      const longText = 'Lorem ipsum '.repeat(200) // ~2KB of text
      await page.fill('[data-testid="bailleur-nom-input"]', `Jean Dupont ${longText}`)
      await page.fill('[data-testid="bailleur-email-input"]', 'jean.dupont@gmail.com')
      
      const autoSaveStart = Date.now()
      
      // Trigger auto-save
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('trigger-auto-save'))
      })
      
      // Wait for auto-save completion
      await expect(page.locator('[data-testid="auto-save-message"]')).toBeVisible()
      
      const autoSaveTime = Date.now() - autoSaveStart
      
      // Auto-save should complete under 1000ms even with large data
      expect(autoSaveTime).toBeLessThan(1000)
      console.log(`Auto-save time with large data: ${autoSaveTime}ms`)
    })
  })

  test.describe('Form Interaction Performance', () => {
    test('Real-time validation response under 100ms', async ({ page }) => {
      await page.goto('http://localhost:3001/contrats/nouveau')
      
      // Navigate to financial conditions step
      await page.fill('[data-testid="property-search"]', 'Villa')
      await page.click('[data-testid="property-option-prop_villa_nice_001"]')
      await page.click('[data-testid="wizard-next-button"]')
      
      await page.selectOption('[data-testid="type-contrat-select"]', 'variable')
      await page.click('[data-testid="wizard-next-button"]')
      
      // Test real-time commission validation
      const validationStart = Date.now()
      
      await page.fill('[data-testid="commission-pourcentage-input"]', '15') // Invalid for variable
      
      // Wait for validation message to appear
      await expect(page.locator('[data-testid="commission-variable-error"]')).toBeVisible()
      
      const validationTime = Date.now() - validationStart
      
      // Real-time validation should be under 100ms
      expect(validationTime).toBeLessThan(100)
      console.log(`Real-time validation time: ${validationTime}ms`)
    })

    test('Search performance with 500+ properties', async ({ page }) => {
      // Mock large property dataset
      await page.route('**/api/proprietes/search**', route => {
        const largeDataset = TEST_PERFORMANCE_DATA.large_proprietes_set
        route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify(largeDataset.slice(0, 500)) // 500 properties
        })
      })
      
      await page.goto('http://localhost:3001/contrats/nouveau')
      
      const searchStart = Date.now()
      
      // Perform search
      await page.fill('[data-testid="property-search"]', 'Test')
      
      // Wait for results to appear
      await expect(page.locator('[data-testid="property-results"]')).toBeVisible()
      
      const searchTime = Date.now() - searchStart
      
      // Search should complete under 300ms even with large dataset
      expect(searchTime).toBeLessThan(300)
      console.log(`Large dataset search time: ${searchTime}ms`)
      
      // Should implement virtualization (not show all 500 DOM elements)
      const visibleResults = await page.locator('[data-testid^="property-option-"]').count()
      expect(visibleResults).toBeLessThanOrEqual(50) // Virtualized display
    })

    test('Calculation performance with complex formulas', async ({ page }) => {
      await page.goto('http://localhost:3001/contrats/nouveau')
      
      // Navigate to financial conditions
      await page.fill('[data-testid="property-search"]', 'Villa')
      await page.click('[data-testid="property-option-prop_villa_nice_001"]')
      await page.click('[data-testid="wizard-next-button"]')
      await page.selectOption('[data-testid="type-contrat-select"]', 'fixe')
      await page.click('[data-testid="wizard-next-button"]')
      
      const calculationStart = Date.now()
      
      // Input values that trigger multiple calculations
      await page.fill('[data-testid="loyer-mensuel-input"]', '2500')
      await page.fill('[data-testid="charges-mensuelles-input"]', '200')
      await page.fill('[data-testid="commission-pourcentage-input"]', '12')
      await page.fill('[data-testid="usage-proprietaire-jours-input"]', '45')
      
      // Wait for all calculations to complete
      await expect(page.locator('[data-testid="commission-calculation"]')).toBeVisible()
      await expect(page.locator('[data-testid="net-to-owner"]')).toBeVisible()
      await expect(page.locator('[data-testid="revenue-impact-calculation"]')).toBeVisible()
      
      const calculationTime = Date.now() - calculationStart
      
      // Complex calculations should complete under 50ms
      expect(calculationTime).toBeLessThan(50)
      console.log(`Complex calculation time: ${calculationTime}ms`)
    })
  })

  test.describe('Memory Usage & Resource Monitoring', () => {
    test('Memory usage remains stable during long session', async ({ page, context }) => {
      await page.goto('http://localhost:3001/contrats/nouveau')
      
      // Get initial memory usage
      const initialMetrics = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize || 0)
      
      // Simulate extended usage - multiple form fills and navigation
      for (let i = 0; i < 10; i++) {
        // Fill form
        await page.fill('[data-testid="property-search"]', `Test Property ${i}`)
        await page.click('[data-testid="property-option-prop_villa_nice_001"]')
        await page.click('[data-testid="wizard-next-button"]')
        
        // Fill step 2
        await page.selectOption('[data-testid="type-contrat-select"]', i % 2 ? 'fixe' : 'variable')
        await page.fill('[data-testid="date-debut-input"]', '2025-03-01')
        await page.fill('[data-testid="bailleur-nom-input"]', `Test User ${i}`)
        
        // Navigate back to step 1
        await page.click('[data-testid="wizard-step-1-button"]')
        
        // Clear and refill
        await page.fill('[data-testid="property-search"]', '')
      }
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc()
        }
      })
      
      const finalMetrics = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize || 0)
      
      // Memory growth should be reasonable (< 10MB increase)
      const memoryGrowth = finalMetrics - initialMetrics
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024) // 10MB
      
      console.log(`Memory growth during session: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`)
    })

    test('No memory leaks in auto-save timers', async ({ page }) => {
      await page.goto('http://localhost:3001/contrats/nouveau')
      
      // Monitor timer cleanup
      const timersBefore = await page.evaluate(() => {
        return (window as any).__activeTimers ? (window as any).__activeTimers.length : 0
      })
      
      // Fill form to trigger auto-save timers
      await page.fill('[data-testid="property-search"]', 'Villa')
      await page.click('[data-testid="property-option-prop_villa_nice_001"]')
      await page.click('[data-testid="wizard-next-button"]')
      
      await page.fill('[data-testid="bailleur-nom-input"]', 'Test')
      
      // Navigate away to trigger cleanup
      await page.goto('http://localhost:3001/contrats')
      
      // Give time for cleanup
      await page.waitForTimeout(1000)
      
      // Return to wizard
      await page.goto('http://localhost:3001/contrats/nouveau')
      
      const timersAfter = await page.evaluate(() => {
        return (window as any).__activeTimers ? (window as any).__activeTimers.length : 0
      })
      
      // Should not accumulate timers
      expect(timersAfter).toBeLessThanOrEqual(timersBefore + 1) // Allow for new timer
    })
  })
})

test.describe('Contract Wizard - Cross-Browser Compatibility', () => {
  // Test on different browsers
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`Core functionality works on ${browserName}`, async ({ page, browserName: currentBrowser }) => {
      test.skip(currentBrowser !== browserName, `Skipping ${browserName} test on ${currentBrowser}`)
      
      await page.goto('http://localhost:3001/contrats/nouveau')
      
      // Test basic wizard functionality
      await expect(page.locator('[data-testid="contract-wizard"]')).toBeVisible()
      
      // Property selection
      await page.fill('[data-testid="property-search"]', 'Villa')
      await page.click('[data-testid="property-option-prop_villa_nice_001"]')
      await expect(page.locator('[data-testid="property-selected-badge"]')).toBeVisible()
      
      // Step navigation
      await page.click('[data-testid="wizard-next-button"]')
      await expect(page.locator('[data-testid="wizard-step-2"]')).toHaveClass(/bg-\[#D4841A\]/)
      
      // Form interactions
      await page.selectOption('[data-testid="type-contrat-select"]', 'fixe')
      await page.fill('[data-testid="date-debut-input"]', '2025-03-01')
      await page.check('[data-testid="autorisation-sous-location-checkbox"]')
      
      // All should work consistently across browsers
      await expect(page.locator('[data-testid="date-debut-input"]')).toHaveValue('2025-03-01')
      await expect(page.locator('[data-testid="autorisation-sous-location-checkbox"]')).toBeChecked()
    })

    test(`CSS layout consistency on ${browserName}`, async ({ page, browserName: currentBrowser }) => {
      test.skip(currentBrowser !== browserName, `Skipping ${browserName} test on ${currentBrowser}`)
      
      await page.goto('http://localhost:3001/contrats/nouveau')
      
      // Test Want It Now design system consistency
      const wizardHeader = page.locator('[data-testid="wizard-header"]')
      
      // Copper color should be consistently applied
      await expect(page.locator('[data-testid="wizard-step-1"]')).toHaveCSS('background-color', 'rgb(212, 132, 26)') // #D4841A
      
      // Progress bar should render correctly
      const progressBar = page.locator('[data-testid="wizard-progress"]')
      await expect(progressBar).toBeVisible()
      
      // Form elements should have consistent styling
      const searchInput = page.locator('[data-testid="property-search"]')
      await expect(searchInput).toHaveCSS('background-color', 'rgb(255, 255, 255)') // White background
    })
  })
})

test.describe('Contract Wizard - Mobile Performance', () => {
  // Mobile device testing
  const mobileDevices = ['iPhone 12', 'Samsung Galaxy S21', 'iPad']
  
  mobileDevices.forEach(deviceName => {
    test(`Mobile performance on ${deviceName}`, async ({ browser }) => {
      const device = devices[deviceName]
      if (!device) return
      
      const context = await browser.newContext({
        ...device
      })
      const page = await context.newPage()
      
      const startTime = Date.now()
      
      await page.goto('http://localhost:3001/contrats/nouveau')
      await expect(page.locator('[data-testid="contract-wizard"]')).toBeVisible()
      
      const loadTime = Date.now() - startTime
      
      // Mobile load time should be under 3 seconds (slower than desktop)
      expect(loadTime).toBeLessThan(3000)
      console.log(`${deviceName} load time: ${loadTime}ms`)
      
      // Test touch interactions
      await page.tap('[data-testid="property-search"]')
      await page.fill('[data-testid="property-search"]', 'Villa')
      
      // Touch targets should be appropriate size
      const propertyOption = page.locator('[data-testid="property-option-prop_villa_nice_001"]').first()
      if (await propertyOption.isVisible()) {
        const boundingBox = await propertyOption.boundingBox()
        expect(boundingBox?.height).toBeGreaterThanOrEqual(44) // iOS minimum touch target
      }
      
      await context.close()
    })
  })

  test('Responsive layout performance', async ({ page }) => {
    await page.goto('http://localhost:3001/contrats/nouveau')
    
    // Test viewport transitions
    const viewportSizes = [
      { width: 375, height: 667 },   // Mobile
      { width: 768, height: 1024 },  // Tablet
      { width: 1200, height: 800 },  // Desktop
    ]
    
    for (const viewport of viewportSizes) {
      const resizeStart = Date.now()
      
      await page.setViewportSize(viewport)
      
      // Wait for layout to settle
      await page.waitForTimeout(100)
      
      const resizeTime = Date.now() - resizeStart
      
      // Viewport changes should be smooth (< 200ms)
      expect(resizeTime).toBeLessThan(200)
      
      // Layout should adapt correctly
      await expect(page.locator('[data-testid="contract-wizard"]')).toBeVisible()
      
      console.log(`Viewport ${viewport.width}x${viewport.height} transition: ${resizeTime}ms`)
    }
  })
})

test.describe('Contract Wizard - Stress Testing', () => {
  test('Concurrent user simulation', async ({ context }) => {
    // Simulate 5 concurrent users
    const pages = await Promise.all(
      Array.from({ length: 5 }, () => context.newPage())
    )
    
    const startTime = Date.now()
    
    // All users start wizard simultaneously
    await Promise.all(
      pages.map(async (page, index) => {
        await page.goto('http://localhost:3001/contrats/nouveau')
        await page.fill('[data-testid="property-search"]', `Villa ${index}`)
        
        if (await page.locator('[data-testid="property-option-prop_villa_nice_001"]').isVisible()) {
          await page.click('[data-testid="property-option-prop_villa_nice_001"]')
        }
        
        await page.click('[data-testid="wizard-next-button"]')
        
        // Fill different data per user
        await page.selectOption('[data-testid="type-contrat-select"]', index % 2 ? 'fixe' : 'variable')
        await page.fill('[data-testid="bailleur-nom-input"]', `User ${index}`)
        await page.fill('[data-testid="bailleur-email-input"]', `user${index}@test.com`)
      })
    )
    
    const concurrentTime = Date.now() - startTime
    
    // Concurrent operations should complete within reasonable time
    expect(concurrentTime).toBeLessThan(5000)
    console.log(`Concurrent user simulation time: ${concurrentTime}ms`)
    
    // Cleanup
    await Promise.all(pages.map(page => page.close()))
  })

  test('Rapid form interactions stress test', async ({ page }) => {
    await page.goto('http://localhost:3001/contrats/nouveau')
    
    // Navigate to financial conditions
    await page.fill('[data-testid="property-search"]', 'Villa')
    await page.click('[data-testid="property-option-prop_villa_nice_001"]')
    await page.click('[data-testid="wizard-next-button"]')
    await page.selectOption('[data-testid="type-contrat-select"]', 'fixe')
    await page.click('[data-testid="wizard-next-button"]')
    
    const stressTestStart = Date.now()
    
    // Rapid form interactions
    for (let i = 0; i < 50; i++) {
      await page.fill('[data-testid="commission-pourcentage-input"]', `${10 + (i % 10)}`)
      await page.fill('[data-testid="loyer-mensuel-input"]', `${2000 + i * 10}`)
      await page.fill('[data-testid="usage-proprietaire-jours-input"]', `${30 + (i % 30)}`)
    }
    
    const stressTestTime = Date.now() - stressTestStart
    
    // Should handle rapid interactions without performance degradation
    expect(stressTestTime).toBeLessThan(2000) // 50 interactions in under 2s
    console.log(`Rapid interactions stress test: ${stressTestTime}ms`)
    
    // Final calculations should still be accurate
    await expect(page.locator('[data-testid="commission-calculation"]')).toBeVisible()
    await expect(page.locator('[data-testid="net-to-owner"]')).toBeVisible()
  })
})