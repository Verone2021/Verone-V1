/**
 * Global Setup for Contract Wizard Playwright Tests
 * Want It Now V1 - Test Environment Initialization
 * 
 * Setup includes:
 * - Database initialization with test data
 * - Mock API endpoints for testing
 * - Performance monitoring initialization
 * - Authentication setup
 * - Test data seeding
 */

import { chromium, FullConfig } from '@playwright/test'
import { TEST_PROPRIETES, TEST_UNITES, TEST_PROPRIETAIRES } from '../../../test-data/contrats-test-data'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Contract Wizard Test Setup...')
  
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    // 1. Verify application is running
    console.log('📡 Checking application availability...')
    await page.goto('http://localhost:3001/health', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    })
    
    const isHealthy = await page.evaluate(() => {
      return document.body.textContent?.includes('healthy') || 
             document.body.textContent?.includes('OK')
    })
    
    if (!isHealthy) {
      console.warn('⚠️  Health check failed, but continuing with tests...')
    } else {
      console.log('✅ Application health check passed')
    }
    
    // 2. Setup test database with contract test data
    console.log('🗄️  Setting up test database...')
    await setupTestDatabase(page)
    
    // 3. Initialize mock API responses
    console.log('🎭 Setting up mock API responses...')
    await setupMockApis(page)
    
    // 4. Performance monitoring setup
    console.log('📊 Initializing performance monitoring...')
    await setupPerformanceMonitoring(page)
    
    // 5. Authentication setup (if needed)
    console.log('🔐 Setting up test authentication...')
    await setupTestAuthentication(page)
    
    console.log('✅ Contract Wizard Test Setup Complete!')
    
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await context.close()
    await browser.close()
  }
}

async function setupTestDatabase(page: any) {
  // Mock database seeding via API calls
  try {
    // Seed organizations
    await page.route('**/api/organisations**', (route: any) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'org_wantitnow_001',
              nom: 'Want It Now France',
              pays: 'FR',
              created_at: '2025-01-01T00:00:00Z'
            }
          ])
        })
      } else {
        route.continue()
      }
    })
    
    // Seed properties
    await page.route('**/api/proprietes**', (route: any) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify(TEST_PROPRIETES)
        })
      } else {
        route.continue()
      }
    })
    
    // Seed units
    await page.route('**/api/unites**', (route: any) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          contentType: 'application/json', 
          body: JSON.stringify(TEST_UNITES)
        })
      } else {
        route.continue()
      }
    })
    
    // Seed proprietaires
    await page.route('**/api/proprietaires**', (route: any) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify(TEST_PROPRIETAIRES)
        })
      } else {
        route.continue()
      }
    })
    
    console.log('✅ Test database seeded successfully')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    throw error
  }
}

async function setupMockApis(page: any) {
  // Mock successful contract creation
  await page.route('**/api/contrats**', (route: any) => {
    if (route.request().method() === 'POST') {
      const requestBody = route.request().postDataJSON()
      
      // Validate business rules in mock
      if (!requestBody.autorisation_sous_location) {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'L\'autorisation de sous-location est obligatoire pour Want It Now'
          })
        })
        return
      }
      
      if (requestBody.type_contrat === 'variable' && requestBody.commission_pourcentage !== '10') {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'La commission pour les contrats variables doit être de 10%'
          })
        })
        return
      }
      
      if (parseInt(requestBody.usage_proprietaire_jours_max) > 60) {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'L\'usage propriétaire ne peut pas dépasser 60 jours par an'
          })
        })
        return
      }
      
      // Mock successful creation
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: `contract_${Date.now()}`,
            ...requestBody,
            created_at: new Date().toISOString()
          }
        })
      })
    } else {
      route.continue()
    }
  })
  
  // Mock draft save/load
  let draftStorage: any = {}
  
  await page.route('**/api/contrats/draft**', (route: any) => {
    if (route.request().method() === 'POST') {
      const draftData = route.request().postDataJSON()
      const draftId = `draft_${Date.now()}`
      draftStorage[draftId] = draftData
      
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          draftId
        })
      })
    } else if (route.request().method() === 'GET') {
      const url = new URL(route.request().url())
      const draftId = url.searchParams.get('id')
      
      if (draftId && draftStorage[draftId]) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: draftStorage[draftId]
          })
        })
      } else {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Draft not found'
          })
        })
      }
    } else {
      route.continue()
    }
  })
  
  // Mock search functionality
  await page.route('**/api/proprietes/search**', (route: any) => {
    const url = new URL(route.request().url())
    const query = url.searchParams.get('q') || ''
    
    const results = TEST_PROPRIETES.filter(prop => 
      prop.nom.toLowerCase().includes(query.toLowerCase()) ||
      prop.adresse_complete.toLowerCase().includes(query.toLowerCase())
    )
    
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(results)
    })
  })
  
  console.log('✅ Mock APIs configured successfully')
}

async function setupPerformanceMonitoring(page: any) {
  // Add performance monitoring scripts
  await page.addInitScript(() => {
    // Initialize performance observer
    if (typeof PerformanceObserver !== 'undefined') {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          if (entry.entryType === 'measure') {
            console.log(`📊 Performance: ${entry.name} took ${entry.duration}ms`)
          }
        })
      })
      
      try {
        observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] })
      } catch (e) {
        console.warn('Performance Observer not supported in this browser')
      }
    }
    
    // Custom performance markers
    ;(window as any).markPerformance = (name: string) => {
      if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark(name)
      }
    }
    
    ;(window as any).measurePerformance = (name: string, start: string, end: string) => {
      if (typeof performance !== 'undefined' && performance.measure) {
        try {
          performance.measure(name, start, end)
        } catch (e) {
          console.warn(`Could not measure ${name}:`, e)
        }
      }
    }
  })
  
  console.log('✅ Performance monitoring initialized')
}

async function setupTestAuthentication(page: any) {
  // Mock authentication for tests
  await page.route('**/auth/**', (route: any) => {
    const url = route.request().url()
    
    if (url.includes('/session')) {
      // Mock valid session
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock_access_token',
          user: {
            id: 'test_user_001',
            email: 'test@want-it-now.fr',
            role: 'admin'
          }
        })
      })
    } else {
      route.continue()
    }
  })
  
  // Set up test user session
  await page.goto('http://localhost:3001')
  
  await page.evaluate(() => {
    // Mock localStorage auth state
    localStorage.setItem('supabase.auth.token', JSON.stringify({
      access_token: 'mock_access_token',
      user: {
        id: 'test_user_001',
        email: 'test@want-it-now.fr',
        role: 'admin'
      }
    }))
  })
  
  console.log('✅ Test authentication configured')
}

export default globalSetup