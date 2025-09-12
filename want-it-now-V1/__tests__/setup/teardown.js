/**
 * Global Test Teardown
 * Cleans up after all tests complete
 */

module.exports = async () => {
  console.log('🧹 Global test teardown starting...')
  
  try {
    // Add any global cleanup logic here
    // For example, cleaning up test databases, stopping services, etc.
    
    // Wait a moment for any async operations to complete
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log('✅ Global test teardown completed')
  } catch (error) {
    console.error('❌ Error during global teardown:', error)
  }
}