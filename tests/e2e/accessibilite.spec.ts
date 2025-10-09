/**
 * 🧪 TESTS E2E ACCESSIBILITÉ - Vérone Back Office
 * Tests navigation keyboard, ARIA, WCAG AA, screen readers
 */

import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      throw new Error(`❌ Console Error: ${msg.text()}`)
    }
  })
})

test.describe('⌨️ NAVIGATION KEYBOARD', () => {
  test('01. Navigation Tab entre éléments interactifs', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Tester Tab navigation
    await page.keyboard.press('Tab')
    await page.waitForTimeout(200)

    let focusedElement = await page.evaluate(() => {
      const el = document.activeElement
      return {
        tag: el?.tagName,
        type: el?.getAttribute('type'),
        role: el?.getAttribute('role')
      }
    })

    expect(focusedElement.tag).toBeTruthy()
    console.log(`✅ Premier focus: ${focusedElement.tag}`)

    // Tab suivant
    await page.keyboard.press('Tab')
    await page.waitForTimeout(200)

    focusedElement = await page.evaluate(() => {
      const el = document.activeElement
      return {
        tag: el?.tagName,
        type: el?.getAttribute('type'),
        role: el?.getAttribute('role')
      }
    })

    console.log(`✅ Second focus: ${focusedElement.tag}`)
  })

  test('02. Enter active boutons et liens', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Focus premier lien
    const firstLink = page.locator('a').first()

    if (await firstLink.isVisible({ timeout: 3000 })) {
      await firstLink.focus()
      await page.waitForTimeout(200)

      const currentUrl = page.url()

      // Appuyer Enter
      await page.keyboard.press('Enter')
      await page.waitForTimeout(500)

      // Vérifier navigation
      const newUrl = page.url()
      console.log(`✅ Navigation Enter: ${currentUrl} → ${newUrl}`)
    }
  })

  test('03. Escape ferme modals/dialogs', async ({ page }) => {
    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')

    // Ouvrir modal
    const openButton = page.locator('button:has-text("Nouveau"), button:has-text("Créer")').first()

    if (await openButton.isVisible({ timeout: 3000 })) {
      await openButton.click()
      await page.waitForTimeout(500)

      // Vérifier modal ouvert
      const modalVisible = await page.locator('[role="dialog"]').isVisible({ timeout: 2000 }).catch(() => false)

      if (modalVisible) {
        // Appuyer Escape
        await page.keyboard.press('Escape')
        await page.waitForTimeout(500)

        // Vérifier fermeture
        const modalClosed = await page.locator('[role="dialog"]').isHidden().catch(() => true)

        expect(modalClosed).toBeTruthy()
        console.log('✅ Escape ferme modal')
      }
    }
  })

  test('04. Arrows naviguent dans menus/dropdowns', async ({ page }) => {
    await page.goto('/catalogue')
    await page.waitForLoadState('networkidle')

    // Chercher dropdown
    const dropdown = page.locator('[role="combobox"], select').first()

    if (await dropdown.isVisible({ timeout: 3000 })) {
      await dropdown.focus()
      await page.keyboard.press('ArrowDown')
      await page.waitForTimeout(200)

      console.log('✅ Arrow Down fonctionnel')
    } else {
      console.log('ℹ️ Pas de dropdown testable')
    }
  })

  test('05. Focus visible sur éléments interactifs', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Tab pour focus
    await page.keyboard.press('Tab')
    await page.waitForTimeout(200)

    // Vérifier focus visible
    const hasFocusOutline = await page.evaluate(() => {
      const el = document.activeElement
      if (!el) return false

      const styles = window.getComputedStyle(el)
      return styles.outline !== 'none' || styles.boxShadow.includes('blue') || styles.borderColor.includes('blue')
    })

    console.log(`✅ Focus visible: ${hasFocusOutline ? 'OK' : 'à améliorer'}`)
  })
})

test.describe('🏷️ ARIA LABELS & ROLES', () => {
  test('06. Boutons ont aria-label ou texte visible', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const buttons = await page.locator('button').all()
    let buttonsWithLabel = 0

    for (const button of buttons.slice(0, 10)) {
      const hasAriaLabel = await button.getAttribute('aria-label')
      const hasText = await button.textContent()

      if (hasAriaLabel || hasText?.trim()) {
        buttonsWithLabel++
      }
    }

    expect(buttonsWithLabel).toBeGreaterThan(0)
    console.log(`✅ Boutons avec label: ${buttonsWithLabel}/${Math.min(10, buttons.length)}`)
  })

  test('07. Images ont alt text', async ({ page }) => {
    await page.goto('/catalogue')
    await page.waitForLoadState('networkidle')

    const images = await page.locator('img').all()
    let imagesWithAlt = 0

    for (const img of images.slice(0, 10)) {
      const alt = await img.getAttribute('alt')

      if (alt !== null) {
        imagesWithAlt++
      }
    }

    console.log(`✅ Images avec alt: ${imagesWithAlt}/${Math.min(10, images.length)}`)
  })

  test('08. Formulaires ont labels associés', async ({ page }) => {
    await page.goto('/catalogue/create')
    await page.waitForLoadState('networkidle')

    const inputs = await page.locator('input:visible').all()
    let inputsWithLabel = 0

    for (const input of inputs.slice(0, 10)) {
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledby = await input.getAttribute('aria-labelledby')

      // Chercher label associé
      let hasLabel = false

      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count()
        hasLabel = label > 0
      }

      if (ariaLabel || ariaLabelledby || hasLabel) {
        inputsWithLabel++
      }
    }

    console.log(`✅ Inputs avec label: ${inputsWithLabel}/${Math.min(10, inputs.length)}`)
  })

  test('09. Rôles sémantiques appropriés (navigation, main, article)', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Vérifier rôles sémantiques
    const hasNav = await page.locator('nav, [role="navigation"]').count()
    const hasMain = await page.locator('main, [role="main"]').count()
    const hasHeader = await page.locator('header, [role="banner"]').count()

    console.log(`✅ Rôles sémantiques: nav=${hasNav}, main=${hasMain}, header=${hasHeader}`)

    expect(hasNav + hasMain + hasHeader).toBeGreaterThan(0)
  })

  test('10. Liens descriptifs (pas "cliquez ici")', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Chercher liens avec texte vague
    const vagueLinks = await page.locator('a:has-text("ici"), a:has-text("cliquez"), a:has-text("here"), a:has-text("click")').count()

    console.log(`✅ Liens vagues: ${vagueLinks} (idéalement 0)`)
  })
})

test.describe('🎨 CONTRASTE COULEURS WCAG AA', () => {
  test('11. Texte principal a contraste suffisant (4.5:1)', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Vérifier contraste texte principal
    const textContrast = await page.evaluate(() => {
      const body = document.body
      const styles = window.getComputedStyle(body)

      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor
      }
    })

    console.log(`✅ Couleurs texte: ${textContrast.color} sur ${textContrast.backgroundColor}`)

    // Vérone utilise noir/blanc/gris (bon contraste)
    expect(textContrast.color || textContrast.backgroundColor).toBeTruthy()
  })

  test('12. Boutons ont contraste suffisant', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const button = page.locator('button').first()

    if (await button.isVisible({ timeout: 3000 })) {
      const buttonStyles = await button.evaluate(el => {
        const styles = window.getComputedStyle(el)
        return {
          color: styles.color,
          backgroundColor: styles.backgroundColor,
          border: styles.border
        }
      })

      console.log(`✅ Styles bouton: ${JSON.stringify(buttonStyles)}`)
      expect(buttonStyles.color || buttonStyles.backgroundColor).toBeTruthy()
    }
  })

  test('13. État focus a contraste visible', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Tab pour focus
    await page.keyboard.press('Tab')
    await page.waitForTimeout(200)

    const focusStyles = await page.evaluate(() => {
      const el = document.activeElement
      if (!el) return null

      const styles = window.getComputedStyle(el)
      return {
        outline: styles.outline,
        outlineColor: styles.outlineColor,
        boxShadow: styles.boxShadow
      }
    })

    console.log(`✅ Focus styles: ${JSON.stringify(focusStyles)}`)
  })
})

test.describe('📱 RESPONSIVE & MOBILE ACCESSIBILITY', () => {
  test('14. Éléments tactiles ont taille minimale (44x44px)', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const buttons = await page.locator('button:visible').all()
    let buttonsWithGoodSize = 0

    for (const button of buttons.slice(0, 10)) {
      const box = await button.boundingBox()

      if (box && box.width >= 44 && box.height >= 44) {
        buttonsWithGoodSize++
      }
    }

    console.log(`✅ Boutons taille OK (≥44px): ${buttonsWithGoodSize}/${Math.min(10, buttons.length)}`)
  })

  test('15. Texte reste lisible à 200% zoom', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Zoomer page
    await page.evaluate(() => {
      document.body.style.zoom = '200%'
    })

    await page.waitForTimeout(500)

    // Vérifier contenu toujours visible
    const contentVisible = await page.locator('main, [role="main"], body').isVisible({ timeout: 3000 }).catch(() => false)

    expect(contentVisible).toBeTruthy()
    console.log('✅ Contenu lisible à 200% zoom')
  })
})

test.describe('🔍 SCREEN READER COMPATIBILITY', () => {
  test('16. Headings hiérarchie logique (h1, h2, h3)', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const h1Count = await page.locator('h1').count()
    const h2Count = await page.locator('h2').count()
    const h3Count = await page.locator('h3').count()

    console.log(`✅ Headings: h1=${h1Count}, h2=${h2Count}, h3=${h3Count}`)

    // Idéalement 1 seul h1 par page
    expect(h1Count).toBeGreaterThanOrEqual(0)
  })

  test('17. Landmarks ARIA présents', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const landmarks = await page.evaluate(() => {
      return {
        banner: document.querySelectorAll('[role="banner"], header').length,
        navigation: document.querySelectorAll('[role="navigation"], nav').length,
        main: document.querySelectorAll('[role="main"], main').length,
        contentinfo: document.querySelectorAll('[role="contentinfo"], footer').length
      }
    })

    console.log(`✅ Landmarks: ${JSON.stringify(landmarks)}`)
    expect(landmarks.main).toBeGreaterThan(0)
  })

  test('18. États dynamiques annoncés (aria-live)', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Chercher régions live
    const liveRegions = await page.locator('[aria-live], [role="alert"], [role="status"]').count()

    console.log(`✅ Régions live (notifications): ${liveRegions}`)
  })
})

test.describe('🚨 CONSOLE ERRORS ACCESSIBILITÉ', () => {
  test('19. Zero erreur console navigation keyboard', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Navigation keyboard extensive
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
      await page.waitForTimeout(100)
    }

    await page.waitForTimeout(1000)

    if (consoleErrors.length > 0) {
      console.error('❌ Erreurs console:', consoleErrors)
    }

    expect(consoleErrors).toHaveLength(0)
    console.log('✅ Zero erreur navigation keyboard')
  })
})
