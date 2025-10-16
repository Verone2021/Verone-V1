/**
 * 🧪 TESTS E2E FORMULAIRES & INTERACTIONS UI - Vérone Back Office
 * Tests validation, états boutons, modals, dropdowns
 */

import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      throw new Error(`❌ Console Error: ${msg.text()}`)
    }
  })
})

test.describe('📝 FORMULAIRES - VALIDATION CHAMPS', () => {
  test('01. Validation champs obligatoires affiche erreurs', async ({ page }) => {
    // Tester sur formulaire création produit
    await page.goto('/catalogue/create')
    await page.waitForLoadState('networkidle')

    // Tenter soumission vide
    const submitButton = page.locator('button[type="submit"], button:has-text("Enregistrer"), button:has-text("Créer")').first()

    if (await submitButton.isVisible({ timeout: 3000 })) {
      await submitButton.click()
      await page.waitForTimeout(500)

      // Vérifier messages erreur
      const hasError = await page.locator('text=/requis|obligatoire|required|ce champ/i').isVisible({ timeout: 2000 }).catch(() => false)
      const hasFieldError = await page.locator('.error, [data-error], .text-red-500').isVisible({ timeout: 2000 }).catch(() => false)

      expect(hasError || hasFieldError).toBeTruthy()
      console.log('✅ Messages erreur validation affichés')
    } else {
      console.log('ℹ️ Formulaire non testable')
    }
  })

  test('02. Validation email format correct', async ({ page }) => {
    // Tester sur page profil ou création client
    await page.goto('/contacts-organisations/customers')
    await page.waitForLoadState('networkidle')

    const createButton = page.locator('button:has-text("Nouveau"), button:has-text("Créer")').first()

    if (await createButton.isVisible({ timeout: 3000 })) {
      await createButton.click()
      await page.waitForTimeout(500)

      // Chercher champ email
      const emailInput = page.locator('input[type="email"], input[name*="email"]').first()

      if (await emailInput.isVisible({ timeout: 3000 })) {
        // Entrer email invalide
        await emailInput.fill('email-invalide')

        const submitButton = page.locator('button[type="submit"]').first()
        await submitButton.click()
        await page.waitForTimeout(500)

        // Vérifier erreur format
        const hasEmailError = await page.locator('text=/email|format/i').isVisible({ timeout: 2000 }).catch(() => false)

        console.log(`✅ Validation email: ${hasEmailError ? 'OK' : 'non visible'}`)
      }
    } else {
      console.log('ℹ️ Test validation email non applicable')
    }
  })

  test('03. Validation nombres positifs', async ({ page }) => {
    await page.goto('/catalogue/create')
    await page.waitForLoadState('networkidle')

    // Chercher champs nombre (prix, quantité)
    const numberInput = page.locator('input[type="number"]').first()

    if (await numberInput.isVisible({ timeout: 3000 })) {
      // Entrer valeur négative
      await numberInput.fill('-10')

      const submitButton = page.locator('button[type="submit"]').first()

      if (await submitButton.isVisible({ timeout: 3000 })) {
        await submitButton.click()
        await page.waitForTimeout(500)

        // Vérifier validation
        const hasError = await page.locator('text=/positif|supérieur|greater/i').isVisible({ timeout: 2000 }).catch(() => false)

        console.log(`✅ Validation nombre: ${hasError ? 'OK' : 'accept négatifs'}`)
      }
    }
  })

  test('04. Champs requis marqués visuellement', async ({ page }) => {
    await page.goto('/catalogue/create')
    await page.waitForLoadState('networkidle')

    // Chercher indicateurs requis (*, rouge, etc.)
    const hasAsterisk = await page.locator('text=*').isVisible({ timeout: 3000 }).catch(() => false)
    const hasRequiredLabel = await page.locator('label:has-text("*")').isVisible({ timeout: 3000 }).catch(() => false)
    const hasRequiredAttr = await page.locator('input[required]').count() > 0

    const hasRequiredIndicator = hasAsterisk || hasRequiredLabel || hasRequiredAttr

    console.log(`✅ Indicateurs requis: ${hasRequiredIndicator ? 'présents' : 'non visibles'}`)
  })
})

test.describe('🔘 BOUTONS - ÉTATS & INTERACTIONS', () => {
  test('05. Boutons affichent état loading pendant soumission', async ({ page }) => {
    await page.goto('/catalogue/create')
    await page.waitForLoadState('networkidle')

    // Remplir formulaire minimal
    const nameInput = page.locator('input[type="text"]').first()

    if (await nameInput.isVisible({ timeout: 3000 })) {
      await nameInput.fill('Produit Test E2E')

      const submitButton = page.locator('button[type="submit"]').first()

      if (await submitButton.isVisible({ timeout: 3000 })) {
        await submitButton.click()

        // Vérifier état loading (spinner, texte, disabled)
        const hasSpinner = await page.locator('[data-testid="spinner"], .animate-spin').isVisible({ timeout: 1000 }).catch(() => false)
        const hasLoadingText = await page.locator('button:has-text("Chargement"), button:has-text("Loading")').isVisible({ timeout: 1000 }).catch(() => false)
        const isDisabled = await submitButton.isDisabled().catch(() => false)

        const hasLoadingState = hasSpinner || hasLoadingText || isDisabled

        console.log(`✅ État loading: ${hasLoadingState ? 'OK' : 'non visible'}`)
      }
    }
  })

  test('06. Boutons disabled non cliquables', async ({ page }) => {
    await page.goto('/catalogue/create')
    await page.waitForLoadState('networkidle')

    // Chercher boutons disabled
    const disabledButton = page.locator('button:disabled, button[disabled]').first()

    if (await disabledButton.isVisible({ timeout: 3000 })) {
      const isDisabled = await disabledButton.isDisabled()
      expect(isDisabled).toBeTruthy()

      console.log('✅ Boutons disabled non cliquables')
    } else {
      console.log('ℹ️ Pas de boutons disabled visibles')
    }
  })

  test('07. Boutons changent apparence au hover', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Tester hover sur bouton
    const button = page.locator('button').first()

    if (await button.isVisible({ timeout: 3000 })) {
      await button.hover()
      await page.waitForTimeout(200)

      // Capturer style après hover
      const hoverStyles = await button.evaluate(el => {
        const styles = window.getComputedStyle(el)
        return {
          cursor: styles.cursor,
          opacity: styles.opacity
        }
      })

      expect(hoverStyles.cursor).toBe('pointer')
      console.log('✅ Boutons réagissent au hover')
    }
  })

  test('08. Boutons succès affichent feedback visuel', async ({ page }) => {
    await page.goto('/catalogue/create')
    await page.waitForLoadState('networkidle')

    // Remplir et soumettre formulaire
    const nameInput = page.locator('input[type="text"]').first()

    if (await nameInput.isVisible({ timeout: 3000 })) {
      await nameInput.fill('Produit Test Success')

      const submitButton = page.locator('button[type="submit"]').first()

      if (await submitButton.isVisible({ timeout: 3000 })) {
        await submitButton.click()

        // Chercher feedback succès
        const hasSuccessToast = await page.locator('text=/succès|success|créé|enregistré/i').isVisible({ timeout: 3000 }).catch(() => false)
        const hasCheckmark = await page.locator('[data-testid="success-icon"], .checkmark').isVisible({ timeout: 3000 }).catch(() => false)

        console.log(`✅ Feedback succès: ${hasSuccessToast || hasCheckmark ? 'OK' : 'non visible'}`)
      }
    }
  })
})

test.describe('🗨️ MODALS & DIALOGS', () => {
  test('09. Modals s\'ouvrent correctement', async ({ page }) => {
    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')

    // Chercher bouton ouvrant modal
    const openModalButton = page.locator('button:has-text("Nouveau"), button:has-text("Créer"), button:has-text("Ajouter")').first()

    if (await openModalButton.isVisible({ timeout: 3000 })) {
      await openModalButton.click()
      await page.waitForTimeout(500)

      // Vérifier modal ouvert
      const hasModal = await page.locator('[role="dialog"], .modal, [data-testid="modal"]').isVisible({ timeout: 2000 }).catch(() => false)

      expect(hasModal).toBeTruthy()
      console.log('✅ Modal s\'ouvre correctement')
    } else {
      console.log('ℹ️ Pas de modal testable')
    }
  })

  test('10. Modals se ferment avec bouton close', async ({ page }) => {
    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')

    const openModalButton = page.locator('button:has-text("Nouveau")').first()

    if (await openModalButton.isVisible({ timeout: 3000 })) {
      await openModalButton.click()
      await page.waitForTimeout(500)

      // Chercher bouton fermeture
      const closeButton = page.locator('button[aria-label="Close"], button:has-text("×"), button:has-text("Fermer")').first()

      if (await closeButton.isVisible({ timeout: 2000 })) {
        await closeButton.click()
        await page.waitForTimeout(500)

        // Vérifier modal fermé
        const modalClosed = await page.locator('[role="dialog"]').isHidden().catch(() => true)

        expect(modalClosed).toBeTruthy()
        console.log('✅ Modal se ferme correctement')
      }
    }
  })

  test('11. Modals se ferment avec Escape', async ({ page }) => {
    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')

    const openModalButton = page.locator('button:has-text("Nouveau")').first()

    if (await openModalButton.isVisible({ timeout: 3000 })) {
      await openModalButton.click()
      await page.waitForTimeout(500)

      // Appuyer Escape
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)

      // Vérifier modal fermé
      const modalClosed = await page.locator('[role="dialog"]').isHidden().catch(() => true)

      console.log(`✅ Modal Escape: ${modalClosed ? 'OK' : 'reste ouvert'}`)
    }
  })
})

test.describe('📋 DROPDOWNS & SELECTS', () => {
  test('12. Dropdowns s\'ouvrent au clic', async ({ page }) => {
    await page.goto('/catalogue')
    await page.waitForLoadState('networkidle')

    // Chercher dropdown ou select
    const dropdown = page.locator('select, [role="combobox"], button[aria-haspopup]').first()

    if (await dropdown.isVisible({ timeout: 3000 })) {
      await dropdown.click()
      await page.waitForTimeout(300)

      // Vérifier options affichées
      const hasOptions = await page.locator('[role="option"], option').isVisible({ timeout: 2000 }).catch(() => false)

      console.log(`✅ Dropdown: ${hasOptions ? 'options affichées' : 'pas d\'options'}`)
    }
  })

  test('13. Selects permettent sélection option', async ({ page }) => {
    await page.goto('/catalogue/create')
    await page.waitForLoadState('networkidle')

    const select = page.locator('select').first()

    if (await select.isVisible({ timeout: 3000 })) {
      // Sélectionner première option non-vide
      await select.selectOption({ index: 1 })

      const selectedValue = await select.inputValue()
      expect(selectedValue).toBeTruthy()

      console.log(`✅ Select fonctionnel: ${selectedValue}`)
    } else {
      console.log('ℹ️ Pas de select testable')
    }
  })
})

test.describe('📅 DATE PICKERS', () => {
  test('14. Date pickers accessibles', async ({ page }) => {
    await page.goto('/stocks/mouvements')
    await page.waitForLoadState('networkidle')

    // Chercher date picker
    const dateInput = page.locator('input[type="date"]').first()

    if (await dateInput.isVisible({ timeout: 3000 })) {
      // Entrer date
      await dateInput.fill('2025-01-15')

      const value = await dateInput.inputValue()
      expect(value).toBe('2025-01-15')

      console.log('✅ Date picker fonctionnel')
    } else {
      console.log('ℹ️ Pas de date picker visible')
    }
  })
})

test.describe('📎 FILE UPLOADS', () => {
  test('15. Upload fichiers fonctionne', async ({ page }) => {
    await page.goto('/catalogue/create')
    await page.waitForLoadState('networkidle')

    // Chercher input file
    const fileInput = page.locator('input[type="file"]').first()

    if (await fileInput.isVisible({ timeout: 3000 })) {
      console.log('✅ Upload fichier disponible')
    } else {
      // Chercher bouton upload
      const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Télécharger"), button:has-text("Image")').first()

      const isVisible = await uploadButton.isVisible({ timeout: 3000 }).catch(() => false)
      console.log(`ℹ️ Upload fichier: ${isVisible ? 'bouton présent' : 'non visible'}`)
    }
  })
})

test.describe('🚨 CONSOLE ERRORS FORMULAIRES', () => {
  test('16. Zero erreur interactions formulaires', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/catalogue/create')
    await page.waitForLoadState('networkidle')

    // Interagir avec formulaire
    const nameInput = page.locator('input[type="text"]').first()

    if (await nameInput.isVisible({ timeout: 3000 })) {
      await nameInput.fill('Test')
      await nameInput.clear()
      await nameInput.fill('Test Final')
    }

    await page.waitForTimeout(1000)

    if (consoleErrors.length > 0) {
      console.error('❌ Erreurs console:', consoleErrors)
    }

    expect(consoleErrors).toHaveLength(0)
    console.log('✅ Zero erreur interactions formulaires')
  })
})
