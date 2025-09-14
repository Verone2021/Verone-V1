#!/usr/bin/env node

/**
 * 🧪 Test Script - D-Log Logging System
 *
 * Script de test pour démontrer le fonctionnement du système de logging D-Log.
 * Exécuter avec: node test-logging-system.js
 */

const baseUrl = process.env.TEST_URL || 'http://localhost:3000';

console.log('🚀 Testing Vérone D-Log Logging System');
console.log('=====================================\n');

async function testApiEndpoints() {
  console.log('📊 Testing API endpoints with logging...\n');

  // Test 1: Health Check
  console.log('1️⃣  Health Check...');
  try {
    const response = await fetch(`${baseUrl}/api/health`);
    const data = await response.json();
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   💚 Health: ${data.status}`);
    console.log(`   📈 Memory: ${data.checks.memory.usage_mb}MB\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Test 2: Get Products (with parameters)
  console.log('2️⃣  Get Products...');
  try {
    const response = await fetch(`${baseUrl}/api/catalogue/products?category=canapes&limit=5`);
    const data = await response.json();
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📦 Products: ${data.data?.length || 0} items`);
    console.log(`   📊 Total: ${data.pagination?.total_count || 0} total`);
    console.log(`   ⏱️  Query Time: ${data.meta?.query_time_ms || 'N/A'}ms\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Test 3: Search Products
  console.log('3️⃣  Search Products...');
  try {
    const response = await fetch(`${baseUrl}/api/catalogue/products?search=vérone&limit=3`);
    const data = await response.json();
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   🔍 Search Results: ${data.data?.length || 0} items`);
    console.log(`   ⏱️  Query Time: ${data.meta?.query_time_ms || 'N/A'}ms\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Test 4: Create Product (POST)
  console.log('4️⃣  Create Product...');
  try {
    const newProduct = {
      name: 'Test Canapé Logging',
      sku: 'VER-TEST-LOG-001',
      description: 'Produit test pour démonstration logging D-Log',
      price_ht: 99900, // 999€ HT
      category: 'canapes',
      brand: 'Vérone',
      status: 'draft'
    };

    const response = await fetch(`${baseUrl}/api/catalogue/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newProduct)
    });

    const data = await response.json();
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   🆕 Created: ${data.data?.name || 'N/A'}`);
    console.log(`   💰 Price TTC: ${(data.data?.price_ttc / 100)?.toFixed(2) || 'N/A'}€`);
    console.log(`   ⏱️  Creation Time: ${data.meta?.creation_time_ms || 'N/A'}ms\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Test 5: Invalid Request (pour tester error logging)
  console.log('5️⃣  Invalid Request (Error Testing)...');
  try {
    const response = await fetch(`${baseUrl}/api/catalogue/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invalid: 'data' }) // Manque les champs requis
    });

    const data = await response.json();
    console.log(`   ⚠️  Status: ${response.status} (expected error)`);
    console.log(`   🚫 Error: ${data.error}`);
    console.log(`   📝 Missing: ${data.missing_fields?.join(', ') || 'N/A'}\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Test 6: Non-existent endpoint
  console.log('6️⃣  Non-existent Endpoint...');
  try {
    const response = await fetch(`${baseUrl}/api/non-existent`);
    console.log(`   ⚠️  Status: ${response.status} (expected 404)\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }
}

async function testPerformance() {
  console.log('⚡ Testing Performance Logging...\n');

  const iterations = 3;
  const results = [];

  for (let i = 1; i <= iterations; i++) {
    console.log(`🔄 Performance Test ${i}/${iterations}...`);

    const start = Date.now();

    try {
      // Test concurrent requests
      const promises = [
        fetch(`${baseUrl}/api/health`),
        fetch(`${baseUrl}/api/catalogue/products?limit=10`),
        fetch(`${baseUrl}/api/catalogue/products?category=tables&limit=5`)
      ];

      const responses = await Promise.all(promises);
      const duration = Date.now() - start;

      const successCount = responses.filter(r => r.ok).length;

      results.push({
        iteration: i,
        duration,
        successCount,
        totalRequests: promises.length
      });

      console.log(`   ✅ Duration: ${duration}ms`);
      console.log(`   📊 Success: ${successCount}/${promises.length}\n`);

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Pause entre les itérations
    if (i < iterations) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Résumé performance
  console.log('📈 Performance Summary:');
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const totalSuccess = results.reduce((sum, r) => sum + r.successCount, 0);
  const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0);

  console.log(`   ⏱️  Average Duration: ${avgDuration.toFixed(0)}ms`);
  console.log(`   ✅ Success Rate: ${((totalSuccess / totalRequests) * 100).toFixed(1)}%`);
  console.log(`   📊 Total Requests: ${totalRequests}\n`);
}

async function main() {
  console.log(`🎯 Target URL: ${baseUrl}\n`);

  // Vérifier que le serveur est en marche
  console.log('🔌 Checking server availability...');
  try {
    const response = await fetch(`${baseUrl}/api/health`);
    if (response.ok) {
      console.log('   ✅ Server is running\n');
    } else {
      throw new Error(`Server returned ${response.status}`);
    }
  } catch (error) {
    console.log('   ❌ Server is not running');
    console.log('   💡 Please start the development server first:');
    console.log('      npm run dev\n');
    return;
  }

  // Exécuter les tests
  await testApiEndpoints();
  await testPerformance();

  console.log('🎉 D-Log Testing Complete!');
  console.log('=====================================');
  console.log('');
  console.log('📝 Check your console output for structured logs including:');
  console.log('   • Request/Response logging with timing');
  console.log('   • Business metrics (catalogue usage, performance)');
  console.log('   • Error tracking with context');
  console.log('   • Security events (API access)');
  console.log('   • Audit trail (resource creation)');
  console.log('');
  console.log('🔍 In development mode, logs are formatted for readability.');
  console.log('🚀 In production, logs will be structured JSON for parsing.');
}

// Exécuter les tests
main().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});