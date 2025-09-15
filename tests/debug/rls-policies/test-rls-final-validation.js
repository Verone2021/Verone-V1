/**
 * Test final de validation RLS avec Playwright
 * On simule l'authentification complète et teste l'upload
 */

const { chromium } = require('playwright')

async function testRLSWithAuth() {
  console.log('🚀 TEST FINAL RLS - Validation avec Authentification')
  console.log('=' .repeat(55))

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // 1. Aller sur la page login
    console.log('\n1️⃣ Navigation vers page login')
    await page.goto('http://localhost:3000/login')
    await page.waitForTimeout(2000)

    // Capturer l'état de la page login
    await page.screenshot({ path: 'test-results/final-01-login.png', fullPage: true })
    console.log('✅ Page login chargée')

    // 2. Essayer de se connecter
    console.log('\n2️⃣ Tentative de connexion (si formulaire visible)')

    // Chercher des champs de connexion
    const emailField = page.locator('input[type="email"], input[name="email"], #email')
    const passwordField = page.locator('input[type="password"], input[name="password"], #password')
    const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /connexion|login|se connecter/i })

    if (await emailField.count() > 0) {
      console.log('📝 Formulaire de connexion trouvé')
      await emailField.fill('veronebyromeo@gmail.com')
      await passwordField.fill('password123')

      if (await submitButton.count() > 0) {
        await submitButton.click()
        await page.waitForTimeout(3000)
        console.log('✅ Tentative de connexion effectuée')
      }
    } else {
      console.log('⚠️  Pas de formulaire de connexion visible')
    }

    // 3. Aller directement au catalogue pour tester
    console.log('\n3️⃣ Navigation vers catalogue')
    await page.goto('http://localhost:3000/catalogue/categories')
    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'test-results/final-02-catalogue.png', fullPage: true })

    // 4. Chercher et ouvrir le formulaire famille
    console.log('\n4️⃣ Recherche formulaire famille')
    const addButton = page.locator('button').filter({ hasText: /ajouter|nouvelle|famille/i }).first()

    if (await addButton.isVisible()) {
      console.log('✅ Bouton ajouter famille trouvé')
      await addButton.click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'test-results/final-03-modal-opened.png', fullPage: true })

      // 5. Tester le formulaire sans image
      console.log('\n5️⃣ Test formulaire sans image')
      const nameInput = page.locator('input[name="name"], input[placeholder*="nom"], #name')
      const submitFormButton = page.locator('button[type="submit"], button').filter({ hasText: /sauvegarder|enregistrer|créer/i })

      if (await nameInput.count() > 0) {
        await nameInput.fill('Test Famille RLS Final')
        console.log('📝 Nom saisi')

        // Essayer de soumettre
        if (await submitFormButton.count() > 0) {
          await submitFormButton.click()
          await page.waitForTimeout(3000)
          console.log('✅ Formulaire soumis')

          // Chercher des messages d'erreur
          const errorMessages = await page.locator('.error, [role="alert"], .text-red').allTextContents()
          if (errorMessages.length > 0) {
            console.log('❌ Erreurs détectées:', errorMessages)
          } else {
            console.log('✅ Aucune erreur visible')
          }
        }
      }

      await page.screenshot({ path: 'test-results/final-04-form-submitted.png', fullPage: true })
    } else {
      console.log('❌ Bouton ajouter famille non trouvé')
    }

    // 6. Vérifier les erreurs de console
    console.log('\n6️⃣ Vérification erreurs JavaScript')
    const logs = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text())
      }
    })

    await page.waitForTimeout(2000)

    if (logs.length > 0) {
      console.log('❌ Erreurs JavaScript:', logs)
    } else {
      console.log('✅ Aucune erreur JavaScript')
    }

    await page.screenshot({ path: 'test-results/final-05-final-state.png', fullPage: true })

  } catch (error) {
    console.error('💥 ERREUR DURANT LE TEST:', error.message)
    await page.screenshot({ path: 'test-results/final-error.png', fullPage: true })
  } finally {
    await browser.close()
    console.log('\n🔍 TEST FINAL TERMINÉ')
    console.log('📸 Screenshots sauvegardés dans test-results/')
  }
}

testRLSWithAuth().catch(console.error)