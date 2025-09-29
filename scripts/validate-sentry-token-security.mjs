#!/usr/bin/env node

/**
 * 🔒 Script de Validation Token Sentry
 *
 * Teste les permissions du token Sentry actuel et valide
 * qu'il respecte les bonnes pratiques de sécurité.
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

const SENTRY_API_URL = 'https://de.sentry.io/api/0'
const SENTRY_ORG = process.env.SENTRY_ORG || 'verone'
const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN

console.log('🔒 Validation Sécurité Token Sentry - Vérone Back Office')
console.log('=' .repeat(60))

if (!SENTRY_AUTH_TOKEN) {
  console.error('❌ SENTRY_AUTH_TOKEN manquant dans .env.local')
  process.exit(1)
}

// Test 1: Permissions lecture organisation
async function testOrganizationRead() {
  console.log('\n📖 Test 1: Lecture Organisation')
  try {
    const response = await fetch(`${SENTRY_API_URL}/organizations/${SENTRY_ORG}/`, {
      headers: {
        'Authorization': `Bearer ${SENTRY_AUTH_TOKEN}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Lecture organisation réussie')
      console.log(`   Organisation: ${data.name || data.slug}`)
      console.log(`   Projets: ${data.projects?.length || 'N/A'}`)
      return true
    } else {
      console.log(`❌ Échec lecture organisation: ${response.status}`)
      return false
    }
  } catch (error) {
    console.log(`❌ Erreur lecture organisation: ${error.message}`)
    return false
  }
}

// Test 2: Permissions lecture issues
async function testIssuesRead() {
  console.log('\n📋 Test 2: Lecture Issues')
  try {
    const response = await fetch(`${SENTRY_API_URL}/organizations/${SENTRY_ORG}/issues/?limit=5`, {
      headers: {
        'Authorization': `Bearer ${SENTRY_AUTH_TOKEN}`
      }
    })

    if (response.ok) {
      const issues = await response.json()
      console.log('✅ Lecture issues réussie')
      console.log(`   Issues trouvées: ${issues.length}`)
      if (issues.length > 0) {
        console.log(`   Dernière issue: ${issues[0].title?.substring(0, 50)}...`)
      }
      return true
    } else {
      console.log(`❌ Échec lecture issues: ${response.status}`)
      return false
    }
  } catch (error) {
    console.log(`❌ Erreur lecture issues: ${error.message}`)
    return false
  }
}

// Test 3: Validation sécurité - tentative écriture (doit échouer)
async function testWriteRestriction() {
  console.log('\n🛡️ Test 3: Restriction Écriture (doit échouer)')
  try {
    // Tentative de création d'un projet (doit échouer)
    const response = await fetch(`${SENTRY_API_URL}/organizations/${SENTRY_ORG}/projects/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENTRY_AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'test-security-validation',
        slug: 'test-security-validation'
      })
    })

    if (response.status === 403 || response.status === 401) {
      console.log('✅ Restriction écriture confirmée (403/401 attendu)')
      console.log('   Token correctement limité en lecture seule')
      return true
    } else if (response.ok) {
      console.log('⚠️ ATTENTION: Token a des permissions d\'écriture!')
      console.log('   Recommandé: utiliser un token read-only pour la production')
      // Nettoyer le projet de test créé
      const data = await response.json()
      if (data.slug) {
        await fetch(`${SENTRY_API_URL}/projects/${SENTRY_ORG}/${data.slug}/`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${SENTRY_AUTH_TOKEN}` }
        })
        console.log('   Projet de test supprimé')
      }
      return false
    } else {
      console.log(`❌ Réponse inattendue: ${response.status}`)
      return false
    }
  } catch (error) {
    console.log(`❌ Erreur test écriture: ${error.message}`)
    return false
  }
}

// Test 4: API locale Vérone
async function testLocalAPI() {
  console.log('\n🚀 Test 4: API Locale Vérone')
  try {
    const response = await fetch('http://localhost:3000/api/monitoring/sentry-issues')

    if (response.ok) {
      const data = await response.json()
      console.log('✅ API locale fonctionnelle')
      console.log(`   Issues: ${data.stats?.totalIssues || 0}`)
      console.log(`   Non résolues: ${data.stats?.unresolvedCount || 0}`)
      return true
    } else {
      console.log(`❌ Échec API locale: ${response.status}`)
      return false
    }
  } catch (error) {
    console.log(`❌ Erreur API locale: ${error.message}`)
    console.log('   Vérifiez que npm run dev est actif')
    return false
  }
}

// Analyse du token
function analyzeToken() {
  console.log('\n🔍 Analyse Token')

  if (!SENTRY_AUTH_TOKEN.startsWith('sntryu_')) {
    console.log('⚠️ Format token non standard (attendu: sntryu_*)')
  } else {
    console.log('✅ Format token valide')
  }

  // Masquer le token pour logs sécurisés
  const maskedToken = SENTRY_AUTH_TOKEN.substring(0, 10) + '*'.repeat(SENTRY_AUTH_TOKEN.length - 10)
  console.log(`   Token: ${maskedToken}`)
  console.log(`   Longueur: ${SENTRY_AUTH_TOKEN.length} caractères`)
}

// Exécution principale
async function main() {
  analyzeToken()

  const results = []
  results.push(await testOrganizationRead())
  results.push(await testIssuesRead())
  results.push(await testWriteRestriction())
  results.push(await testLocalAPI())

  // Résumé
  console.log('\n' + '='.repeat(60))
  console.log('📊 RÉSUMÉ VALIDATION')
  console.log('='.repeat(60))

  const passed = results.filter(r => r === true).length
  const total = results.length

  console.log(`Tests réussis: ${passed}/${total}`)

  if (passed === total) {
    console.log('🎉 SUCCÈS: Token Sentry correctement configuré')
    console.log('✅ Permissions minimales respectées')
    console.log('✅ API fonctionnelle')
    process.exit(0)
  } else {
    console.log('⚠️ ATTENTION: Certains tests ont échoué')
    console.log('📖 Consultez le guide: .claude/commands/sentry-token-security-guide.md')
    process.exit(1)
  }
}

main().catch(error => {
  console.error('💥 Erreur critique:', error)
  process.exit(1)
})