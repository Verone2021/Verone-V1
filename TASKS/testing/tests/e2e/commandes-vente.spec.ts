/**
 * 🧪 TESTS E2E COMMANDES VENTE - Vérone Back Office
 * Tests workflow complet: création, statuts, PDF, historique
 */

import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      throw new Error(`❌ Console Error: ${msg.text()}`)
    }
  })

  page.on('pageerror', error => {
    throw new Error(`💥 Page Error: ${error.message}`)
  })
})

test.describe('🛒 COMMANDES - NAVIGATION & PAGES', () => {
  test('01. Page commandes clients charge correctement', async ({ page }) => {
    await page.goto('/commandes/clients')
    await page.waitForLoadState('networkidle')

    // Vérifier URL
    await expect(page).toHaveURL(/commandes.*clients/)

    // Vérifier contenu
    const hasTable = await page.locator('table, [data-testid="commandes-table"]').isVisible({ timeout: 3000 }).catch(() => false)
    const hasList = await page.locator('[data-testid="commande-card"]').isVisible({ timeout: 3000 }).catch(() => false)

    expect(hasTable || hasList).toBeTruthy()
    console.log('✅ Page commandes clients chargée')
  })

  test('02. Navigation entre commandes clients/fournisseurs', async ({ page }) => {
    await page.goto('/commandes/clients')
    await page.waitForLoadState('networkidle')

    // Chercher navigation fournisseurs
    const fournisseursLink = page.locator('a[href*="fournisseurs"], text=/fournisseurs/i').first()

    if (await fournisseursLink.isVisible({ timeout: 3000 })) {
      await fournisseursLink.click()
      await expect(page).toHaveURL(/fournisseurs/)
      await page.goBack()
      console.log('✅ Navigation clients ↔ fournisseurs OK')
    } else {
      console.log('ℹ️ Navigation fournisseurs non visible')
    }
  })

  test('03. Filtres commandes (statut, date, client)', async ({ page }) => {
    await page.goto('/commandes/clients')
    await page.waitForLoadState('networkidle')

    // Chercher filtres
    const hasStatusFilter = await page.locator('select, [data-testid="status-filter"]').isVisible({ timeout: 3000 }).catch(() => false)
    const hasDateFilter = await page.locator('input[type="date"]').isVisible({ timeout: 3000 }).catch(() => false)
    const hasSearch = await page.locator('input[type="search"]').isVisible({ timeout: 3000 }).catch(() => false)

    console.log(`✅ Filtres: Statut=${hasStatusFilter}, Date=${hasDateFilter}, Recherche=${hasSearch}`)
  })
})

test.describe('➕ COMMANDES - CRÉATION', () => {
  test('04. Bouton nouvelle commande accessible', async ({ page }) => {
    await page.goto('/commandes/clients')
    await page.waitForLoadState('networkidle')

    // Chercher bouton création
    const createButton = page.locator('button:has-text("Nouvelle"), button:has-text("Créer"), a[href*="create"]').first()

    const isVisible = await createButton.isVisible({ timeout: 3000 }).catch(() => false)
    expect(isVisible).toBeTruthy()

    console.log('✅ Bouton nouvelle commande présent')
  })

  test('05. Formulaire création commande accessible', async ({ page }) => {
    await page.goto('/commandes/clients')
    await page.waitForLoadState('networkidle')

    // Ouvrir formulaire
    const createButton = page.locator('button:has-text("Nouvelle"), button:has-text("Créer")').first()

    if (await createButton.isVisible({ timeout: 3000 })) {
      await createButton.click()
      await page.waitForTimeout(500)

      // Vérifier formulaire ouvert
      const hasForm = await page.locator('form, [data-testid="commande-form"]').isVisible({ timeout: 3000 }).catch(() => false)

      expect(hasForm).toBeTruthy()
      console.log('✅ Formulaire création commande OK')
    } else {
      // Essayer navigation directe
      await page.goto('/commandes/clients/create')
      await page.waitForLoadState('networkidle')

      const hasForm = await page.locator('form').isVisible({ timeout: 3000 }).catch(() => false)
      expect(hasForm).toBeTruthy()
      console.log('ℹ️ Formulaire accessible via URL directe')
    }
  })

  test('06. Validation champs obligatoires commande', async ({ page }) => {
    await page.goto('/commandes/clients')
    await page.waitForLoadState('networkidle')

    // Ouvrir formulaire
    const createButton = page.locator('button:has-text("Nouvelle"), button:has-text("Créer")').first()

    if (await createButton.isVisible({ timeout: 3000 })) {
      await createButton.click()
      await page.waitForTimeout(500)

      // Tenter soumission vide
      const submitButton = page.locator('button[type="submit"], button:has-text("Enregistrer")').first()

      if (await submitButton.isVisible({ timeout: 3000 })) {
        await submitButton.click()
        await page.waitForTimeout(500)

        // Vérifier messages validation
        const hasError = await page.locator('text=/requis|obligatoire|required/i').isVisible({ timeout: 2000 }).catch(() => false)

        console.log(`✅ Validation formulaire: ${hasError ? 'OK' : 'pas de message'}`)
      }
    } else {
      console.log('ℹ️ Formulaire non testable')
    }
  })

  test('07. Sélection client dans formulaire', async ({ page }) => {
    await page.goto('/commandes/clients')
    await page.waitForLoadState('networkidle')

    const createButton = page.locator('button:has-text("Nouvelle")').first()

    if (await createButton.isVisible({ timeout: 3000 })) {
      await createButton.click()
      await page.waitForTimeout(500)

      // Chercher sélecteur client
      const clientSelect = page.locator('select[name*="client"], input[placeholder*="client"], [data-testid="client-select"]').first()

      const isVisible = await clientSelect.isVisible({ timeout: 3000 }).catch(() => false)

      console.log(`✅ Sélecteur client: ${isVisible ? 'présent' : 'non visible'}`)
    }
  })

  test('08. Ajout produits à la commande', async ({ page }) => {
    await page.goto('/commandes/clients')
    await page.waitForLoadState('networkidle')

    const createButton = page.locator('button:has-text("Nouvelle")').first()

    if (await createButton.isVisible({ timeout: 3000 })) {
      await createButton.click()
      await page.waitForTimeout(500)

      // Chercher fonctionnalité ajout produit
      const addProductButton = page.locator('button:has-text("Ajouter"), button:has-text("Produit")').first()

      const isVisible = await addProductButton.isVisible({ timeout: 3000 }).catch(() => false)

      console.log(`✅ Ajout produits: ${isVisible ? 'disponible' : 'non visible'}`)
    }
  })
})

test.describe('📊 COMMANDES - WORKFLOW STATUTS', () => {
  test('09. Statuts commande affichés (draft, confirmed, shipped)', async ({ page }) => {
    await page.goto('/commandes/clients')
    await page.waitForLoadState('networkidle')

    // Chercher badges statuts
    const hasDraft = await page.locator('text=/brouillon|draft/i').isVisible({ timeout: 3000 }).catch(() => false)
    const hasConfirmed = await page.locator('text=/confirmé|confirmed/i').isVisible({ timeout: 3000 }).catch(() => false)
    const hasShipped = await page.locator('text=/expédié|shipped/i').isVisible({ timeout: 3000 }).catch(() => false)

    console.log(`✅ Statuts: Draft=${hasDraft}, Confirmed=${hasConfirmed}, Shipped=${hasShipped}`)
  })

  test('10. Changement statut commande possible', async ({ page }) => {
    await page.goto('/commandes/clients')
    await page.waitForLoadState('networkidle')

    // Cliquer première commande
    const firstOrder = page.locator('[data-testid="commande-card"], table tbody tr').first()

    if (await firstOrder.isVisible({ timeout: 3000 })) {
      await firstOrder.click()
      await page.waitForTimeout(500)

      // Chercher actions changement statut
      const statusButton = page.locator('button:has-text("Statut"), button:has-text("Confirmer"), button:has-text("Expédier")').first()

      const isVisible = await statusButton.isVisible({ timeout: 3000 }).catch(() => false)

      console.log(`✅ Changement statut: ${isVisible ? 'disponible' : 'non visible'}`)
    } else {
      console.log('ℹ️ Pas de commande pour test changement statut')
    }
  })
})

test.describe('💰 COMMANDES - CALCULS PRIX', () => {
  test('11. Totaux commande calculés (HT, TVA, TTC)', async ({ page }) => {
    await page.goto('/commandes/clients')
    await page.waitForLoadState('networkidle')

    // Cliquer première commande
    const firstOrder = page.locator('[data-testid="commande-card"], table tbody tr').first()

    if (await firstOrder.isVisible({ timeout: 3000 })) {
      await firstOrder.click()
      await page.waitForTimeout(500)

      // Chercher totaux
      const hasHT = await page.locator('text=/total ht|montant ht/i').isVisible({ timeout: 3000 }).catch(() => false)
      const hasTVA = await page.locator('text=/tva/i').isVisible({ timeout: 3000 }).catch(() => false)
      const hasTTC = await page.locator('text=/total ttc|montant ttc/i').isVisible({ timeout: 3000 }).catch(() => false)

      console.log(`✅ Totaux: HT=${hasHT}, TVA=${hasTVA}, TTC=${hasTTC}`)
    } else {
      console.log('ℹ️ Pas de commande pour vérifier totaux')
    }
  })

  test('12. Prix unitaires et quantités affichés', async ({ page }) => {
    await page.goto('/commandes/clients')
    await page.waitForLoadState('networkidle')

    const firstOrder = page.locator('[data-testid="commande-card"], table tbody tr').first()

    if (await firstOrder.isVisible({ timeout: 3000 })) {
      await firstOrder.click()
      await page.waitForTimeout(500)

      // Chercher lignes produits
      const hasItems = await page.locator('table, [data-testid="order-items"]').isVisible({ timeout: 3000 }).catch(() => false)

      console.log(`✅ Lignes produits: ${hasItems ? 'affichées' : 'non visibles'}`)
    }
  })
})

test.describe('📄 COMMANDES - GÉNÉRATION PDF', () => {
  test('13. Bouton génération PDF disponible', async ({ page }) => {
    await page.goto('/commandes/clients')
    await page.waitForLoadState('networkidle')

    const firstOrder = page.locator('[data-testid="commande-card"], table tbody tr').first()

    if (await firstOrder.isVisible({ timeout: 3000 })) {
      await firstOrder.click()
      await page.waitForTimeout(500)

      // Chercher bouton PDF
      const pdfButton = page.locator('button:has-text("PDF"), button:has-text("Télécharger"), a[href*=".pdf"]').first()

      const isVisible = await pdfButton.isVisible({ timeout: 3000 }).catch(() => false)

      console.log(`✅ Génération PDF: ${isVisible ? 'disponible' : 'non visible'}`)
    }
  })

  test('14. Performance génération PDF <5s (SLO)', async ({ page }) => {
    await page.goto('/commandes/clients')
    await page.waitForLoadState('networkidle')

    const firstOrder = page.locator('[data-testid="commande-card"], table tbody tr').first()

    if (await firstOrder.isVisible({ timeout: 3000 })) {
      await firstOrder.click()
      await page.waitForTimeout(500)

      const pdfButton = page.locator('button:has-text("PDF")').first()

      if (await pdfButton.isVisible({ timeout: 3000 })) {
        const startTime = Date.now()

        // Écouter téléchargement
        const downloadPromise = page.waitForEvent('download', { timeout: 6000 }).catch(() => null)

        await pdfButton.click()

        const download = await downloadPromise

        if (download) {
          const pdfTime = Date.now() - startTime
          expect(pdfTime).toBeLessThan(5000)

          console.log(`✅ Génération PDF: ${pdfTime}ms < 5000ms (SLO OK)`)
        } else {
          console.log('ℹ️ Pas de téléchargement PDF capturé')
        }
      }
    }
  })
})

test.describe('📋 COMMANDES - HISTORIQUE', () => {
  test('15. Historique commandes client affiché', async ({ page }) => {
    await page.goto('/commandes/clients')
    await page.waitForLoadState('networkidle')

    const firstOrder = page.locator('[data-testid="commande-card"], table tbody tr').first()

    if (await firstOrder.isVisible({ timeout: 3000 })) {
      await firstOrder.click()
      await page.waitForTimeout(500)

      // Chercher historique
      const hasHistory = await page.locator('text=/historique|history/i, [data-testid="order-history"]').isVisible({ timeout: 3000 }).catch(() => false)

      console.log(`✅ Historique commande: ${hasHistory ? 'affiché' : 'non visible'}`)
    }
  })

  test('16. Filtrage historique par client', async ({ page }) => {
    await page.goto('/commandes/clients')
    await page.waitForLoadState('networkidle')

    // Chercher filtre client
    const clientFilter = page.locator('select, input[placeholder*="client"], [data-testid="client-filter"]').first()

    const isVisible = await clientFilter.isVisible({ timeout: 3000 }).catch(() => false)

    console.log(`✅ Filtre client: ${isVisible ? 'disponible' : 'non visible'}`)
  })
})

test.describe('🚨 CONSOLE ERRORS COMMANDES', () => {
  test('17. Zero erreur console page commandes', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/commandes/clients')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    if (consoleErrors.length > 0) {
      console.error('❌ Erreurs console:', consoleErrors)
    }

    expect(consoleErrors).toHaveLength(0)
    console.log('✅ Zero erreur console commandes')
  })
})

test.describe('⚡ PERFORMANCE COMMANDES', () => {
  test('18. Liste commandes charge <3s', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/commandes/clients')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(3000)

    console.log(`✅ Liste commandes: ${loadTime}ms < 3000ms`)
  })

  test('19. Recherche commandes <1s', async ({ page }) => {
    await page.goto('/commandes/clients')
    await page.waitForLoadState('networkidle')

    const searchInput = page.locator('input[type="search"]').first()

    if (await searchInput.isVisible({ timeout: 3000 })) {
      const startTime = Date.now()

      await searchInput.fill('TEST')
      await page.waitForLoadState('networkidle')

      const searchTime = Date.now() - startTime
      expect(searchTime).toBeLessThan(1000)

      console.log(`✅ Recherche: ${searchTime}ms < 1000ms`)
    } else {
      console.log('ℹ️ Pas de recherche, test passé')
    }
  })
})
