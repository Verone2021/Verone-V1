/**
 * Test complet du formulaire famille avec RLS bypass
 */

const { chromium } = require('playwright')

async function testFamilyFormComplete() {
  console.log('🧪 TEST COMPLET FORMULAIRE FAMILLE')
  console.log('=' .repeat(50))

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // 1. Navigation vers la page catalogue/categories
    console.log('\n1️⃣ Navigation vers page catalogue')
    await page.goto('http://localhost:3000/catalogue/categories')
    await page.waitForTimeout(3000)

    // Screenshot de l'état initial
    await page.screenshot({ path: 'test-results/comprehensive-01-initial.png', fullPage: true })

    // Vérifier si la page charge correctement
    const pageTitle = await page.textContent('h1')
    console.log(`📄 Titre de la page: ${pageTitle}`)

    if (pageTitle?.includes('404') || pageTitle?.includes('Page non trouvée')) {
      console.log('❌ Page 404 détectée - Test du dashboard à la place')
      await page.goto('http://localhost:3000/dashboard')
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'test-results/comprehensive-01b-dashboard.png', fullPage: true })

      // Essayer de naviguer via le menu
      const catalogueLink = page.locator('a').filter({ hasText: /catalogue/i })
      if (await catalogueLink.count() > 0) {
        await catalogueLink.first().click()
        await page.waitForTimeout(2000)
        await page.screenshot({ path: 'test-results/comprehensive-01c-catalogue-via-menu.png', fullPage: true })
      }
    }

    // 2. Rechercher le bouton "Nouvelle famille"
    console.log('\n2️⃣ Recherche du bouton Nouvelle famille')
    const newFamilyButton = page.locator('button').filter({ hasText: /nouvelle famille/i })
    const buttonCount = await newFamilyButton.count()
    console.log(`🔍 Nombre de boutons "Nouvelle famille" trouvés: ${buttonCount}`)

    if (buttonCount === 0) {
      // Chercher d'autres variantes
      const addButtons = await page.locator('button').filter({ hasText: /ajouter|nouveau|créer|plus/i }).all()
      console.log(`🔍 Autres boutons d'ajout trouvés: ${addButtons.length}`)

      for (let i = 0; i < addButtons.length; i++) {
        const text = await addButtons[i].textContent()
        console.log(`   - Bouton ${i + 1}: "${text}"`)
      }

      // Screenshot pour voir l'état de la page
      await page.screenshot({ path: 'test-results/comprehensive-02-buttons-search.png', fullPage: true })
    }

    // 3. Ouvrir le formulaire famille
    console.log('\n3️⃣ Ouverture du formulaire famille')
    if (buttonCount > 0) {
      await newFamilyButton.first().click()
      await page.waitForTimeout(2000)
      console.log('✅ Bouton cliqué')

      // Screenshot du modal ouvert
      await page.screenshot({ path: 'test-results/comprehensive-03-modal-opened.png', fullPage: true })

      // Vérifier les éléments du formulaire
      const nameInput = page.locator('input[name="name"], input[placeholder*="nom"], #name')
      const descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="description"], #description')
      const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /sauvegarder|enregistrer|créer/i })

      const nameInputCount = await nameInput.count()
      const descriptionInputCount = await descriptionInput.count()
      const submitButtonCount = await submitButton.count()

      console.log(`📝 Champ nom trouvé: ${nameInputCount > 0 ? '✅' : '❌'}`)
      console.log(`📝 Champ description trouvé: ${descriptionInputCount > 0 ? '✅' : '❌'}`)
      console.log(`🔘 Bouton submit trouvé: ${submitButtonCount > 0 ? '✅' : '❌'}`)

      // 4. Test de soumission sans image
      console.log('\n4️⃣ Test soumission formulaire sans image')
      if (nameInputCount > 0) {
        const testName = `Famille Test RLS ${Date.now()}`
        await nameInput.fill(testName)
        console.log(`📝 Nom saisi: ${testName}`)

        if (descriptionInputCount > 0) {
          await descriptionInput.fill('Description de test pour validation RLS')
          console.log('📝 Description saisie')
        }

        // Screenshot avant soumission
        await page.screenshot({ path: 'test-results/comprehensive-04-form-filled.png', fullPage: true })

        if (submitButtonCount > 0) {
          console.log('🚀 Soumission du formulaire...')
          await submitButton.first().click()
          await page.waitForTimeout(5000) // Attendre la soumission

          // Screenshot après soumission
          await page.screenshot({ path: 'test-results/comprehensive-05-form-submitted.png', fullPage: true })

          // Vérifier les messages d'erreur ou de succès
          const errorMessages = await page.locator('.error, [role="alert"], .text-red, .text-red-500, .text-red-600').allTextContents()
          const successMessages = await page.locator('.success, .text-green, .text-green-500, .text-green-600').allTextContents()

          if (errorMessages.length > 0) {
            console.log('❌ ERREURS DÉTECTÉES:')
            errorMessages.forEach((msg, i) => console.log(`   ${i + 1}. ${msg}`))
          }

          if (successMessages.length > 0) {
            console.log('✅ SUCCÈS DÉTECTÉS:')
            successMessages.forEach((msg, i) => console.log(`   ${i + 1}. ${msg}`))
          }

          if (errorMessages.length === 0 && successMessages.length === 0) {
            console.log('⚠️ Aucun message d\'erreur ou de succès visible')
          }
        }
      }

      // 5. Vérifier les erreurs JavaScript
      console.log('\n5️⃣ Vérification erreurs JavaScript')
      const logs = []
      page.on('console', msg => {
        if (msg.type() === 'error') {
          logs.push(msg.text())
        }
      })

      await page.waitForTimeout(2000)

      if (logs.length > 0) {
        console.log('❌ ERREURS JAVASCRIPT:')
        logs.forEach((log, i) => console.log(`   ${i + 1}. ${log}`))
      } else {
        console.log('✅ Aucune erreur JavaScript détectée')
      }
    } else {
      console.log('❌ Impossible de trouver le bouton "Nouvelle famille"')
    }

    // Screenshot final
    await page.screenshot({ path: 'test-results/comprehensive-06-final-state.png', fullPage: true })

  } catch (error) {
    console.error('💥 ERREUR DURANT LE TEST:', error.message)
    await page.screenshot({ path: 'test-results/comprehensive-error.png', fullPage: true })
  } finally {
    await browser.close()
    console.log('\n🔍 TEST COMPLET TERMINÉ')
    console.log('📸 Screenshots sauvegardés dans test-results/')
  }
}

testFamilyFormComplete().catch(console.error)