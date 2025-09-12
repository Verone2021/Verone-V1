/**
 * Test Environment Setup
 * Configures the testing environment for integration tests
 */

import { beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

// Test environment configuration
const TEST_CONFIG = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_ACCESS_TOKEN || 'test-service-key',
  TEST_TIMEOUT: 30000, // 30 seconds for integration tests
  CLEANUP_ON_ERROR: true
}

// Global test state
let supabaseTestClient: ReturnType<typeof createClient>
let testSessionId: string

// Initialize test environment
beforeAll(async () => {
  console.log('🧪 Setting up test environment...')
  
  // Create test session ID for isolation
  testSessionId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Initialize Supabase client for testing
  supabaseTestClient = createClient(
    TEST_CONFIG.SUPABASE_URL,
    TEST_CONFIG.SUPABASE_SERVICE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  // Verify database connection
  try {
    const { data, error } = await supabaseTestClient
      .from('organisations')
      .select('id')
      .limit(1)
    
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`)
    }
    
    console.log('✅ Database connection verified')
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error)
    throw error
  }

  // Set test timeouts
  jest.setTimeout(TEST_CONFIG.TEST_TIMEOUT)
  
  console.log(`✅ Test environment ready (Session: ${testSessionId})`)
}, TEST_CONFIG.TEST_TIMEOUT)

// Cleanup test environment
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...')
  
  if (TEST_CONFIG.CLEANUP_ON_ERROR) {
    try {
      // Cleanup any test data that might have been left behind
      // This is a safety net - individual tests should clean up after themselves
      
      // Note: In a real scenario, you might want to implement cleanup based on
      // test session ID or other identifiers to avoid affecting other tests
      
      console.log('✅ Test environment cleanup completed')
    } catch (error) {
      console.warn('⚠️ Error during test cleanup:', error)
    }
  }
})

// Utility functions for tests
export const testUtils = {
  /**
   * Get test session ID for data isolation
   */
  getSessionId: () => testSessionId,

  /**
   * Get Supabase test client
   */
  getTestClient: () => supabaseTestClient,

  /**
   * Generate unique test identifier
   */
  generateTestId: (prefix: string = 'test') => 
    `${prefix}_${testSessionId}_${Date.now()}`,

  /**
   * Wait for async operations to complete
   */
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Retry operation with exponential backoff
   */
  retryOperation: async <T>(
    operation: () => Promise<T>, 
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let lastError: Error
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        if (attempt === maxRetries) {
          throw lastError
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1)
        console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms`)
        await testUtils.waitFor(delay)
      }
    }
    
    throw lastError!
  },

  /**
   * Validate test data structure
   */
  validateTestData: (data: any, requiredFields: string[]) => {
    const missing = requiredFields.filter(field => !(field in data))
    if (missing.length > 0) {
      throw new Error(`Missing required test data fields: ${missing.join(', ')}`)
    }
    return true
  },

  /**
   * Create test organisation if needed
   */
  ensureTestOrganisation: async () => {
    try {
      const { data: existingOrgs } = await supabaseTestClient
        .from('organisations')
        .select('id')
        .eq('is_active', true)
        .limit(1)
      
      if (existingOrgs && existingOrgs.length > 0) {
        return existingOrgs[0].id
      }
      
      // Create test organisation if none exists
      const { data: newOrg, error } = await supabaseTestClient
        .from('organisations')
        .insert({
          nom: `Test Organisation ${testSessionId}`,
          pays: 'FR',
          is_active: true
        })
        .select('id')
        .single()
      
      if (error) {
        throw new Error(`Failed to create test organisation: ${error.message}`)
      }
      
      return newOrg.id
    } catch (error) {
      console.error('Error ensuring test organisation:', error)
      throw error
    }
  }
}

// Export test configuration
export { TEST_CONFIG }

// Type definitions for test data
export interface TestProprietaire {
  id: string
  type: 'physique' | 'morale'
  nom: string
  prenom?: string
  email: string
  [key: string]: any
}

export interface TestPropriete {
  id: string
  organisation_id: string
  nom: string
  type: string
  statut: string
  prix_acquisition?: number
  [key: string]: any
}

export interface TestQuotite {
  id: string
  proprietaire_id: string
  propriete_id: string
  quotite_numerateur: number
  quotite_denominateur: number
  pourcentage: number
  [key: string]: any
}

// Test data generators
export const testDataGenerators = {
  /**
   * Generate test proprietaire data
   */
  proprietaire: (overrides: Partial<TestProprietaire> = {}): Partial<TestProprietaire> => ({
    type: 'physique',
    nom: `TestOwner_${testUtils.generateTestId()}`,
    prenom: 'Test',
    email: `test_${testUtils.generateTestId()}@example.com`,
    ...overrides
  }),

  /**
   * Generate test propriete data
   */
  propriete: (organisationId: string, overrides: Partial<TestPropriete> = {}): Partial<TestPropriete> => ({
    organisation_id: organisationId,
    nom: `TestProperty_${testUtils.generateTestId()}`,
    type: 'appartement',
    statut: 'achetee',
    prix_acquisition: 200000,
    adresse_ligne1: '123 Test Street',
    ville: 'Test City',
    code_postal: '12345',
    pays: 'FR',
    ...overrides
  }),

  /**
   * Generate test quotite data
   */
  quotite: (
    proprietaireId: string, 
    proprieteId: string, 
    overrides: Partial<TestQuotite> = {}
  ): Partial<TestQuotite> => ({
    proprietaire_id: proprietaireId,
    propriete_id: proprieteId,
    quotite_numerateur: 1,
    quotite_denominateur: 1,
    pourcentage: 100,
    date_debut: '2024-01-01',
    is_active: true,
    ...overrides
  })
}

console.log('📋 Test environment configuration loaded')