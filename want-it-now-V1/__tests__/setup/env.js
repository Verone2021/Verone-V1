/**
 * Environment Variables Setup for Tests
 */

// Load environment variables for testing
require('dotenv').config({ path: '.env.local' })

// Set test-specific environment variables
process.env.NODE_ENV = 'test'

// Ensure required environment variables are available
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_ACCESS_TOKEN'
]

const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables for testing:')
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`)
  })
  console.error('\nPlease ensure all required environment variables are set in .env.local')
  process.exit(1)
}

console.log('✅ Test environment variables loaded successfully')